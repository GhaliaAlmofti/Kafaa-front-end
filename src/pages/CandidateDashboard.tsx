import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  ChevronRight,
  Star,
  Search,
  Briefcase,
  Trophy,
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

// Types for the recruiter view
interface Application {
  id: number;
  applicant_name: string;
  match_score: number;
  match_reason: string;
  created_at: string;
  cv_id: number;
}

interface JobWithApplicants {
  id: number;
  title: string;
  location: string;
  job_type: string;
  applications: Application[];
}

const RecruiterDashboard = () => {
  const [jobs, setJobs] = useState<JobWithApplicants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rankingId, setRankingId] = useState<number | null>(null);

  useEffect(() => {
    fetchRecruiterData();
  }, []);

  const fetchRecruiterData = async () => {
    try {
      setLoading(true);
      // 1. Fetch all jobs owned by this recruiter
      const jobsData = await api.listJobs();
      setJobs(jobsData);
    } catch (err) {
      setError('Could not load recruitment data.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunAILogic = async (jobId: number) => {
    try {
      setRankingId(jobId);
      // This calls the "RankCandidatesView" we created in the backend
      const rankedData = await api.rankCandidates(jobId);

      // Update the local state with new scores
      setJobs(prevJobs => prevJobs.map(job => {
        if (job.id === jobId) {
          return { ...job, applications: rankedData };
        }
        return job;
      }));

      alert("AI Ranking Complete!");
    } catch (err) {
      setError("AI Ranking failed. Ensure candidates have parsed CVs.");
    } finally {
      setRankingId(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-brand-green" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-brand-black">Recruitment Command Center</h1>
          <p className="text-gray-500">Review and rank candidates using AI Match Engine</p>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2">
            <AlertCircle size={20} /> {error}
          </div>
        )}

        <div className="space-y-8">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Job Header */}
              <div className="p-6 border-b border-gray-50 bg-white flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-brand-black">{job.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                    <span className="flex items-center gap-1"><Briefcase size={14} /> {job.location}</span>
                    <span className="flex items-center gap-1"><Users size={14} /> {job.applications?.length || 0} Applicants</span>
                  </div>
                </div>

                <button
                  onClick={() => handleRunAILogic(job.id)}
                  disabled={rankingId === job.id}
                  className="flex items-center gap-2 bg-brand-green text-white px-6 py-2.5 rounded-xl font-bold hover:bg-opacity-90 disabled:bg-gray-300 transition-all"
                >
                  {rankingId === job.id ? <Loader2 className="animate-spin" size={18} /> : <Trophy size={18} />}
                  {rankingId === job.id ? 'Ranking...' : 'Run AI Ranking'}
                </button>
              </div>

              {/* Applicants List */}
              <div className="p-6 bg-gray-50/30">
                {!job.applications || job.applications.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 italic">
                    No applications received for this position yet.
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {/* Header for list */}
                    <div className="grid grid-cols-12 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <div className="col-span-5">Candidate Info</div>
                      <div className="col-span-2 text-center">AI Grade</div>
                      <div className="col-span-4">AI Reasoning</div>
                      <div className="col-span-1 text-right">View</div>
                    </div>

                    {/* Sorting candidates by score locally for the UI */}
                    {[...(job.applications || [])].sort((a, b) => (b.match_score || 0) - (a.match_score || 0)).map((app) => (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={app.id}
                        className="grid grid-cols-12 items-center bg-white p-4 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow"
                      >
                        <div className="col-span-5 flex items-center gap-3">
                          <div className="w-10 h-10 bg-brand-black rounded-full flex items-center justify-center text-white font-bold">
                            {app.applicant_name?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <p className="font-bold text-brand-black">{app.applicant_name || `Candidate #${app.id}`}</p>
                            <p className="text-[10px] text-gray-400 italic">Applied {new Date(app.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div className="col-span-2 text-center">
                          <div className={`inline-block px-3 py-1 rounded-full font-black text-sm ${app.match_score >= 80 ? 'bg-emerald-100 text-emerald-700' :
                            app.match_score >= 50 ? 'bg-amber-100 text-amber-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                            {app.match_score ? `${app.match_score}%` : 'N/A'}
                          </div>
                        </div>

                        <div className="col-span-4">
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {app.match_reason || "Click 'Run AI Ranking' to generate score."}
                          </p>
                        </div>

                        <div className="col-span-1 text-right">
                          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-brand-green">
                            <ExternalLink size={18} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;