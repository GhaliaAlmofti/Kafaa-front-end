import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  Briefcase,
  MapPin,
  AlertCircle,
  Users,
  ChevronDown,
  ChevronUp,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import type { Company, AdminJobRow, JobApplication } from '../../types';
import { api } from '../../services/api';

const AdminJobsPage = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [adminJobs, setAdminJobs] = useState<AdminJobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showJobForm, setShowJobForm] = useState(false);
  const [newJob, setNewJob] = useState<{
    title: string;
    description: string;
    location: string;
    job_type: string;
  }>({
    title: '',
    description: '',
    location: '',
    job_type: 'FULL_TIME',
  });
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);

  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  const [jobApplications, setJobApplications] = useState<Record<number, JobApplication[]>>({});
  const [loadingAppsForJob, setLoadingAppsForJob] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [companiesData, jobsData] = await Promise.all([
        api.listCompanies(),
        api.listAdminJobs(),
      ]);
      setCompanies(companiesData);
      setAdminJobs(jobsData);
      setSelectedCompanyId((prev) => prev ?? companiesData[0]?.id ?? null);
    } catch {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompanyId) {
      setError('Select a company before posting a job.');
      return;
    }
    try {
      setError('');
      await api.createJob({ ...newJob, company_id: selectedCompanyId });
      fetchData();
      setNewJob({ title: '', description: '', location: '', job_type: 'FULL_TIME' });
      setShowJobForm(false);
    } catch {
      setError('Failed to create job');
    }
  };

  const toggleJobExpand = (jobId: number) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
      return;
    }
    setExpandedJobId(jobId);
    if (!jobApplications[jobId]) {
      void loadJobApplications(jobId);
    }
  };

  const loadJobApplications = async (jobId: number) => {
    try {
      setLoadingAppsForJob(jobId);
      const rows = await api.listJobApplications(jobId);
      setJobApplications((prev) => ({ ...prev, [jobId]: rows }));
    } catch {
      setError('Could not load applications for this job.');
    } finally {
      setLoadingAppsForJob(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[40vh]">Loading…</div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-black">Jobs</h1>
          <p className="text-gray-500 text-sm mt-1">Listings and applications</p>
        </div>
        <button
          type="button"
          onClick={() => setShowJobForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} /> Post job
        </button>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Briefcase className="text-brand-green" /> Jobs ({adminJobs.length})
        </h2>
        <div className="space-y-4">
          {adminJobs.map((job) => {
            const expanded = expandedJobId === job.id;
            const apps = jobApplications[job.id] ?? [];
            return (
              <div
                key={job.id}
                className="rounded-2xl border border-gray-100 overflow-hidden"
              >
                <div className="p-6 hover:border-brand-green transition-all">
                  <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div>
                      <h3 className="text-xl font-bold">{job.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {job.company_name ?? '—'} · @{job.owner_username}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin size={14} /> {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={14} /> {job.application_count ?? 0} applications
                        </span>
                        <span
                          className={`font-bold uppercase ${
                            job.is_active !== false ? 'text-emerald-600' : 'text-gray-500'
                          }`}
                        >
                          {job.is_active !== false ? 'Listing open' : 'Closed'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="px-3 py-1 bg-emerald-50 text-brand-green text-xs font-bold rounded-full uppercase">
                        {job.job_type}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleJobExpand(job.id)}
                        className="text-xs font-bold flex items-center gap-1 text-brand-green hover:underline"
                      >
                        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        {expanded ? 'Hide' : 'View'} applications
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2 mt-4">{job.description}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Posted {new Date(job.created_at).toLocaleDateString()} · Job #{job.id}
                  </p>
                </div>
                {expanded && (
                  <div className="px-6 pb-6 pt-0 border-t border-gray-100 bg-gray-50/50">
                    {loadingAppsForJob === job.id ? (
                      <div className="flex items-center justify-center gap-2 py-8 text-gray-500 text-sm">
                        <Loader2 className="animate-spin" size={18} /> Loading…
                      </div>
                    ) : apps.length === 0 ? (
                      <p className="text-center text-gray-400 py-8 text-sm">
                        No applications for this job.
                      </p>
                    ) : (
                      <div className="overflow-x-auto pt-4">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-[10px] font-black uppercase text-gray-400 border-b border-gray-200">
                              <th className="pb-2 pr-3">Candidate</th>
                              <th className="pb-2 pr-3">Applied</th>
                              <th className="pb-2 pr-3">Status</th>
                              <th className="pb-2 pr-3">Score</th>
                              <th className="pb-2">CV</th>
                            </tr>
                          </thead>
                          <tbody>
                            {apps.map((app) => (
                              <tr key={app.id} className="border-b border-gray-100">
                                <td className="py-2 pr-3">{app.applicant_name}</td>
                                <td className="py-2 pr-3 text-gray-500 whitespace-nowrap">
                                  {new Date(app.applied_at).toLocaleDateString()}
                                </td>
                                <td className="py-2 pr-3 capitalize">{app.status}</td>
                                <td className="py-2 pr-3">
                                  {app.match_score != null ? `${app.match_score}%` : '—'}
                                </td>
                                <td className="py-2">
                                  {app.cv_file ? (
                                    <a
                                      href={app.cv_file}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-brand-green inline-flex"
                                    >
                                      <ExternalLink size={16} />
                                    </a>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {adminJobs.length === 0 && (
            <p className="text-center text-gray-400 py-12">No jobs posted yet.</p>
          )}
        </div>
      </div>

      {showJobForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 w-full max-w-2xl"
          >
            <h2 className="text-2xl font-bold mb-6">Post job</h2>
            <form onSubmit={handleAddJob} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  className="input-field"
                  placeholder="Job title"
                  required
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                />
                <select
                  className="input-field"
                  required
                  value={selectedCompanyId ?? ''}
                  onChange={(e) => setSelectedCompanyId(Number(e.target.value))}
                >
                  <option value="" disabled>
                    Select company
                  </option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                      {company.is_blocked ? ' (blocked)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select
                  className="input-field"
                  value={newJob.job_type}
                  onChange={(e) => setNewJob({ ...newJob, job_type: e.target.value })}
                >
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="FREELANCE">Freelance</option>
                </select>
              </div>
              <input
                className="input-field"
                placeholder="Location"
                required
                value={newJob.location}
                onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
              />
              <textarea
                className="input-field h-32 resize-none"
                placeholder="Job description"
                required
                value={newJob.description}
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
              />
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowJobForm(false)}
                  className="flex-1 py-2 text-gray-500 font-bold"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Post job
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminJobsPage;
