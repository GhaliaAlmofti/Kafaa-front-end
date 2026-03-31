import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Upload, FileText, CheckCircle, AlertCircle, TrendingUp, MapPin, Briefcase, GraduationCap, Loader2, Sparkles } from 'lucide-react';
import { Job, CV, GrowthReport } from '../types';
import { api } from '../services/api';

// 1. Map backend slugs to human-readable labels
const JOB_TYPE_LABELS: Record<string, string> = {
  'full-time': 'Full Time',
  'part-time': 'Part Time',
  'internship': 'Internship',
  'freelance': 'Freelance',
};

function readStoredUser(): { username?: string; role?: string } | null {
  try {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as { username?: string; role?: string }) : null;
  } catch {
    return null;
  }
}

const CandidateDashboard = () => {
  const [user] = useState(() => readStoredUser());
  const [cv, setCv] = useState<CV | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [growthReport, setGrowthReport] = useState<GrowthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'parsing'>('idle');

  // New state to track which jobs have been applied to and their scores
  const [applications, setApplications] = useState<Record<number, { score: number, reason: string }>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [jobsData, me] = await Promise.all([
        api.listJobs(),
        api.getMe()
      ]);

      setJobs(jobsData);

      const existingCvs = await api.getUserCV();
      if (existingCvs && existingCvs.length > 0) {
        setCv(existingCvs[0]);
      }
    } catch (err) {
      console.error("Dashboard Load Error:", err);
      setError('Failed to load your dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setStatus('uploading');
      setError('');

      const newCv = await api.uploadCV(formData);
      setStatus('parsing');
      const parsedFullCv = await api.parseCV(newCv.id);
      setCv(parsedFullCv);

    } catch (err: any) {
      console.error("Upload Error:", err);
      setError('Processing failed. Please ensure the file is a valid PDF or DOCX.');
    } finally {
      setStatus('idle');
    }
  };

  const handleApply = async (jobId: number) => {
    if (!cv || !cv.id) {
      setError('Please upload your CV first so the AI can match your skills.');
      return;
    }

    try {
      setError('');
      const application = await api.applyJob({ job: jobId, cv: cv.id });

      // After applying, we fetch the growth report
      const report = await api.getGrowthReport(application.id);
      setGrowthReport(report);

      // UI FIX: Update the local applications state to show the score for this job
      // Note: In a real app, you might fetch the 'Rank' specifically, but for now 
      // we'll assume the application object returns the score if already calculated.
      if (application.match_score) {
        setApplications(prev => ({
          ...prev,
          [jobId]: { score: application.match_score, reason: application.match_reason }
        }));
      }

      alert('Application submitted! Check your Skill-Bridge report below.');
    } catch (err) {
      setError('You have already applied for this job or the server is busy.');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-brand-green mb-4" size={40} />
      <p className="text-gray-500 font-medium">Loading your career profile...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold text-brand-black">Marhaba, {user?.username}</h1>
            <p className="text-gray-500">Libya's AI-powered job matching</p>
          </div>
          <div className="text-right hidden md:block">
            <span className="bg-white px-4 py-2 rounded-full border border-gray-200 text-sm font-bold text-brand-green uppercase">
              {user?.role} ACCOUNT
            </span>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm border border-red-100">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-brand-black">
                <FileText className="text-brand-green" /> CV Profile
              </h2>

              {!cv ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-brand-green mx-auto mb-4">
                    {status === 'idle' ? <Upload size={28} /> : <Loader2 size={28} className="animate-spin" />}
                  </div>
                  <p className="text-sm text-gray-500 mb-6">
                    {status === 'uploading' ? 'Uploading...' : status === 'parsing' ? 'AI is reading CV...' : 'Upload your CV to unlock AI matching'}
                  </p>
                  <label className="btn-primary w-full cursor-pointer text-center block py-3">
                    {status === 'idle' ? 'Select CV' : 'Processing...'}
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={status !== 'idle'} accept=".pdf,.docx" />
                  </label>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-emerald-50 rounded-2xl flex items-center gap-4 text-brand-green">
                    <CheckCircle size={24} />
                    <div>
                      <p className="font-bold text-sm">Verified by AI</p>
                      <p className="text-[11px] opacity-80 uppercase font-bold tracking-tight">
                        Name: {cv.parsed_data?.full_name || 'Extracted'}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 bg-brand-black text-white rounded-2xl shadow-lg">
                    <h3 className="font-bold mb-3 flex items-center gap-2 text-sm">
                      <TrendingUp size={16} className="text-brand-green" /> Extracted Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {cv.parsed_data?.skills?.map((skill: string, i: number) => (
                        <span key={i} className="text-[10px] bg-white/10 px-2 py-1 rounded-md border border-white/5">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setCv(null)}
                    className="text-[10px] text-gray-400 underline w-full text-center hover:text-red-500"
                  >
                    Re-upload different CV
                  </button>
                </div>
              )}
            </div>

            {/* Skill-Bridge */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-brand-green">
                <GraduationCap size={24} /> Skill-Bridge
              </h2>
              {growthReport ? (
                <div className="space-y-4">
                  <div className="p-4 border border-red-50 bg-red-50/30 rounded-2xl">
                    <p className="text-xs font-black text-red-600 uppercase mb-2">Knowledge Gaps</p>
                    <div className="flex flex-wrap gap-1">
                      {growthReport.skill_gaps.map(gap => (
                        <span key={gap} className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold uppercase">{gap}</span>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50/50">
                    <p className="text-xs font-black text-brand-black uppercase mb-2">Roadmap</p>
                    <ul className="text-xs text-gray-600 space-y-2">
                      {growthReport.recommendations.map((rec, i) => (
                        <li key={i} className="flex gap-2 leading-relaxed italic">
                          <span className="text-brand-green font-bold">→</span> {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 border-2 border-dashed border-gray-100 rounded-2xl">
                  <p className="text-xs text-gray-400 px-4">Apply to a job to see what skills you are missing for that specific role.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Job Feed */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Briefcase className="text-brand-green" /> Opportunity Feed
                </h2>
                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  {jobs.length} OPENINGS
                </span>
              </div>

              <div className="space-y-4">
                {jobs.map(job => {
                  const appData = applications[job.id];

                  return (
                    <motion.div
                      key={job.id}
                      whileHover={{ scale: 1.01 }}
                      className="p-6 rounded-2xl border border-gray-100 hover:border-brand-green/30 hover:shadow-md transition-all bg-white"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-brand-black">{job.title}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <MapPin size={12} /> {job.location}
                            </span>
                            <span className="text-[10px] font-black text-brand-green bg-emerald-50 px-2 py-0.5 rounded-md uppercase">
                              {JOB_TYPE_LABELS[job.job_type] || job.job_type}
                            </span>
                          </div>
                        </div>

                        {/* AI RANKING DISPLAY: This is where we show the backend score */}
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1">
                            {appData ? (
                              <span className="text-brand-green font-black text-2xl">{appData.score}%</span>
                            ) : (
                              <Sparkles size={18} className="text-brand-green animate-pulse" />
                            )}
                          </div>
                          <div className="text-[8px] text-gray-400 uppercase font-black tracking-tighter">
                            {appData ? 'Match Score' : 'AI Match Engine'}
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                        {job.description}
                      </p>

                      {/* Display AI Reason if available */}
                      {appData?.reason && (
                        <div className="mb-6 p-3 bg-gray-50 rounded-lg border-l-4 border-brand-green">
                          <p className="text-[11px] text-gray-600 italic">"{appData.reason}"</p>
                        </div>
                      )}

                      <button
                        onClick={() => handleApply(job.id)}
                        disabled={!cv || !!appData}
                        className={`w-full py-3 rounded-xl font-bold transition-all ${appData
                            ? 'bg-emerald-100 text-brand-green cursor-default'
                            : cv
                              ? 'bg-brand-black text-white hover:bg-brand-green'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                      >
                        {appData ? 'Application Received' : cv ? 'One-Click Apply' : 'Upload CV to Apply'}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;