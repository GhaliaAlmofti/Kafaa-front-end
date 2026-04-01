import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Briefcase,
  MapPin,
  AlertCircle,
  CheckCircle,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api } from '../../services/api';
import type { Job, MyApplication } from '../../types';
import type { CandidateLayoutContext } from '../../layouts/CandidateLayout';

const CandidateJobsPage = () => {
  const { selectedCvId, setSelectedCvId } = useOutletContext<CandidateLayoutContext>();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myApps, setMyApps] = useState<MyApplication[]>([]);
  const [cvs, setCvs] = useState<{ id: number; is_parsed: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyMsg, setApplyMsg] = useState<{ jobId: number; ok: boolean; text: string } | null>(
    null,
  );
  const [jobSearch, setJobSearch] = useState('');
  const [jobTypeFilter, setJobTypeFilter] = useState('');
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [jobsData, appsData, cvData] = await Promise.all([
        api.listJobs(),
        api.listMyApplications(),
        api.getUserCV(),
      ]);
      setJobs(jobsData);
      setMyApps(appsData);
      setCvs(cvData.map((c) => ({ id: c.id, is_parsed: c.is_parsed })));
      if (cvData.length > 0) {
        setSelectedCvId((prev) => prev ?? cvData[0].id);
      }
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [setSelectedCvId]);

  useEffect(() => {
    load();
  }, [load]);

  const appliedJobIds = useMemo(() => new Set(myApps.map((a) => a.job)), [myApps]);

  const filteredJobs = useMemo(() => {
    const q = jobSearch.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchQ =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.description.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q);
      const matchT = !jobTypeFilter || job.job_type === jobTypeFilter;
      return matchQ && matchT;
    });
  }, [jobs, jobSearch, jobTypeFilter]);

  const handleApply = async (jobId: number) => {
    setApplyMsg(null);
    if (selectedCvId == null) {
      setApplyMsg({ jobId, ok: false, text: 'Upload a CV on the My CV tab first.' });
      return;
    }
    try {
      await api.applyJob({ job: jobId, cv: selectedCvId });
      setApplyMsg({ jobId, ok: true, text: 'Application submitted.' });
      setMyApps(await api.listMyApplications());
    } catch (e) {
      const raw = e instanceof Error ? e.message : 'Apply failed';
      let text = raw;
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        text = Object.values(parsed).flat().join(' ') || text;
      } catch {
        /* keep */
      }
      setApplyMsg({ jobId, ok: false, text });
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center text-gray-500">Loading jobs…</div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-brand-black">Find jobs</h1>
        <p className="text-gray-500 mt-2 text-sm">
          Search open roles and apply with your default CV (
          {selectedCvId != null ? `CV #${selectedCvId}` : 'none selected — set on My CV'}).
        </p>
      </header>

      {cvs.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-gray-600">Apply using:</span>
          <select
            className="input-field max-w-xs py-2"
            value={selectedCvId ?? ''}
            onChange={(e) => setSelectedCvId(Number(e.target.value))}
          >
            {cvs.map((cv) => (
              <option key={cv.id} value={cv.id}>
                CV #{cv.id}
                {cv.is_parsed ? ' (parsed)' : ' (not parsed)'}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="search"
            placeholder="Search title, location, description…"
            className="input-field pl-10 w-full"
            value={jobSearch}
            onChange={(e) => setJobSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field md:max-w-[180px]"
          value={jobTypeFilter}
          onChange={(e) => setJobTypeFilter(e.target.value)}
        >
          <option value="">All types</option>
          <option value="full-time">Full-time</option>
          <option value="part-time">Part-time</option>
          <option value="internship">Internship</option>
          <option value="freelance">Freelance</option>
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredJobs.map((job) => {
          const applied = appliedJobIds.has(job.id);
          const expanded = expandedJobId === job.id;
          return (
            <motion.div
              key={job.id}
              layout
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col"
            >
              <div className="flex justify-between items-start gap-2">
                <h3 className="text-lg font-bold text-brand-black">{job.title}</h3>
                {applied && (
                  <span className="shrink-0 text-[10px] font-black uppercase px-2 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    Applied
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-gray-500 mt-2">
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase size={14} />
                  {job.job_type}
                </span>
              </div>
              <p className={`text-sm text-gray-600 mt-3 ${expanded ? '' : 'line-clamp-3'}`}>
                {job.description}
              </p>
              <button
                type="button"
                onClick={() => setExpandedJobId(expanded ? null : job.id)}
                className="mt-2 text-xs font-bold text-brand-green hover:underline self-start flex items-center gap-1"
              >
                {expanded ? (
                  <>
                    <ChevronUp size={14} /> Show less
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} /> Read full description
                  </>
                )}
              </button>
              <div className="mt-4 flex flex-wrap gap-2">
                {!applied ? (
                  <button type="button" className="btn-primary" onClick={() => handleApply(job.id)}>
                    Apply with selected CV
                  </button>
                ) : (
                  <p className="text-sm text-gray-500 flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-500" />
                    You have already applied.
                  </p>
                )}
              </div>
              {applyMsg?.jobId === job.id && (
                <p
                  className={`mt-2 text-sm flex items-center gap-2 ${
                    applyMsg.ok ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {applyMsg.ok ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {applyMsg.text}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
      {filteredJobs.length === 0 && (
        <p className="text-gray-400 text-center py-12 border border-dashed border-gray-200 rounded-2xl text-sm">
          No jobs match your filters.{' '}
          <button
            type="button"
            className="text-brand-green font-semibold"
            onClick={() => {
              setJobSearch('');
              setJobTypeFilter('');
            }}
          >
            Clear filters
          </button>
        </p>
      )}
    </div>
  );
};

export default CandidateJobsPage;
