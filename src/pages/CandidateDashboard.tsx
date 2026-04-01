import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, RefreshCw, FileText, AlertCircle, Briefcase, ExternalLink } from 'lucide-react';
import { api } from '../services/api';
import { Job, RankedApplication } from '../types';

const RecruiterDashboard = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [candidates, setCandidates] = useState<RankedApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await api.listJobs();
      setJobs(data);
      if (data.length > 0) {
        setSelectedJob(data[0]);
        fetchRankedCandidates(data[0].id);
      }
    } catch (err) {
      setError('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchRankedCandidates = async (jobId: number) => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      const data = await api.rankCandidates(jobId);
      setCandidates(data);
    } catch (err) {
      setError('Failed to rank candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleJobSelect = (job: Job) => {
    setSelectedJob(job);
    fetchRankedCandidates(job.id);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-brand-black">Recruiter Dashboard</h1>
            <p className="text-gray-500">AI-powered candidate ranking for your active jobs</p>
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <select
                className="input-field pl-10 appearance-none bg-white pr-10 min-w-[240px]"
                value={selectedJob?.id || ''}
                onChange={(e) => {
                  const job = jobs.find(j => j.id === parseInt(e.target.value));
                  if (job) handleJobSelect(job);
                }}
              >
                <option value="" disabled>Select a Job</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>{job.title}</option>
                ))}
              </select>
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm border border-red-100">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="text-brand-green" />
              {selectedJob ? `Top Matches for ${selectedJob.title}` : 'Select a job to see matches'}
            </h2>
            <button
              onClick={() => selectedJob && fetchRankedCandidates(selectedJob.id)}
              disabled={loading || !selectedJob}
              className="flex items-center gap-2 text-brand-green font-bold hover:bg-emerald-50 px-4 py-2 rounded-xl transition-all disabled:opacity-50"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              Re-Rank Candidates
            </button>
          </div>

          <div className="space-y-4">
            {candidates.map((candidate, idx) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-6 rounded-2xl border border-gray-100 hover:border-brand-green transition-all flex items-center justify-between group bg-white"
              >
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center font-bold uppercase">
                    {candidate.applicant_name ? candidate.applicant_name[0] : '?'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold group-hover:text-brand-green transition-colors">
                      {candidate.applicant_name}
                    </h3>
                    <div className="flex flex-col gap-1 mt-1">
                      <p className="text-sm text-gray-500 line-clamp-1 max-w-md">
                        {candidate.match_reason}
                      </p>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                        Status: {candidate.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-center min-w-[80px]">
                    <div className="text-brand-green font-black text-2xl">
                      {Math.round(candidate.match_score)}%
                    </div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold">Match Score</div>
                  </div>
                  <div className="flex gap-2">
                    {/* Accessing the file path from your RankedApplication type */}
                    <a
                      href={candidate.cv_file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl border border-gray-100 hover:bg-gray-50 text-gray-400 hover:text-brand-green transition-all flex items-center gap-2"
                      title="View CV"
                    >
                      <FileText size={20} />
                      <ExternalLink size={14} />
                    </a>
                    <button className="btn-primary px-6">Review</button>
                  </div>
                </div>
              </motion.div>
            ))}

            {!loading && candidates.length === 0 && selectedJob && (
              <div className="text-center py-16 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <Users className="mx-auto text-gray-300 mb-4" size={48} />
                <p className="text-gray-400">No applications found for this job yet.</p>
              </div>
            )}

            {loading && (
              <div className="text-center py-16">
                <RefreshCw className="animate-spin text-brand-green mx-auto mb-4" size={32} />
                <p className="text-gray-500 font-medium">AI is analyzing and ranking candidates...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;