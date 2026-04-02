import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Search, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { formatPostedDate } from '../utils/formatPostedDate';
import { api } from '../services/api';
import type { Job } from '../types';
import { useAuth } from '../context/AuthContext';

const Jobs = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        const data = await api.listJobs();
        setJobs(data);
      } catch {
        setError('Could not load jobs.');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchQ =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.description.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q);
      const matchT = !typeFilter || job.job_type === typeFilter;
      return matchQ && matchT;
    });
  }, [jobs, search, typeFilter]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        Loading jobs…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-brand-black mb-2">Browse jobs</h1>
        <p className="text-gray-500 mb-6">
          Open roles from verified companies.{' '}
          {user?.role === 'CANDIDATE' ? (
            <Link to="/dashboard" className="text-brand-primary font-semibold hover:underline">
              Go to your dashboard to apply with a CV
            </Link>
          ) : user ? (
            <span className="text-gray-400">Switch to a candidate account to apply.</span>
          ) : (
            <>
              <Link to="/login" className="text-brand-primary font-semibold hover:underline">
                Sign in
              </Link>{' '}
              as a candidate to apply.
            </>
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="search"
              placeholder="Search jobs…"
              className="input-field pl-10 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input-field sm:max-w-[200px]"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All types</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="internship">Internship</option>
            <option value="freelance">Freelance</option>
          </select>
        </div>

        {error && <p className="text-red-600 mb-6">{error}</p>}

        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((job) => {
            const expanded = expandedId === job.id;
            return (
              <article
                key={job.id}
                className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col"
              >
                <div className="flex items-start gap-3">
                  {job.company_logo ? (
                    <img
                      src={job.company_logo}
                      alt=""
                      className="h-10 w-10 rounded-lg object-cover border border-gray-100 shrink-0 bg-gray-50"
                    />
                  ) : null}
                  <div className="min-w-0">
                    {job.company_name && (
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">
                        {job.company_name}
                      </p>
                    )}
                    <h2 className="text-lg font-bold text-brand-black">{job.title}</h2>
                  </div>
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
                  {job.created_at && (
                    <span className="flex items-center gap-1 text-gray-400">
                      <Calendar size={14} aria-hidden />
                      {formatPostedDate(job.created_at)}
                    </span>
                  )}
                </div>
                <p className={`text-sm text-gray-600 mt-3 ${expanded ? '' : 'line-clamp-4'}`}>
                  {job.description}
                </p>
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : job.id)}
                  className="mt-2 text-xs font-bold text-brand-primary hover:underline self-start flex items-center gap-1"
                >
                  {expanded ? (
                    <>
                      <ChevronUp size={14} /> Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown size={14} /> Read more
                    </>
                  )}
                </button>
              </article>
            );
          })}
        </div>
        {filtered.length === 0 && !error && (
          <p className="text-gray-400 text-center py-16 border border-dashed border-gray-200 rounded-2xl">
            No listings match your search.{' '}
            <button
              type="button"
              className="text-brand-primary font-semibold"
              onClick={() => {
                setSearch('');
                setTypeFilter('');
              }}
            >
              Reset filters
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default Jobs;
