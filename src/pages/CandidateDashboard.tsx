import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Upload, FileText, CheckCircle, AlertCircle, TrendingUp, MapPin, Briefcase, GraduationCap } from 'lucide-react';
import { Job, CV, GrowthReport } from '../types';
import { api } from '../services/api';

const CandidateDashboard = () => {
  const [cv, setCv] = useState<CV | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [user, setUser] = useState<any>(null);
  const [growthReport, setGrowthReport] = useState<GrowthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const jobsData = await api.listJobs();
      setJobs(jobsData);
      
      const me = await api.getMe();
      // In a real app, we'd have a way to get the user's CV. 
      // For now, let's assume we can find it or it's part of the profile.
      // If the user has a CV, we'd set it here.
      
      // Mocking finding the CV for now if the user is verified
      if (me.is_verified) {
        // We'd ideally have an endpoint like api.getMyCV()
      }
    } catch (err) {
      setError('Failed to load data');
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
      setUploading(true);
      const newCv = await api.uploadCV(formData);
      setCv(newCv);
      // Trigger parsing
      await api.parseCV(newCv.id);
      
      // Refresh data
      // const updatedCv = await api.getMe(); // Or a specific CV fetch
      // setCv(updatedCv);
    } catch (err) {
      setError('Upload failed. Make sure you are logged in.');
    } finally {
      setUploading(false);
    }
  };

  const handleApply = async (jobId: number) => {
    if (!cv) {
      setError('Please upload your CV first');
      return;
    }
    try {
      const application = await api.applyJob({ job: jobId, cv: cv.id });
      alert('Application submitted!');
      
      // Fetch growth report for this application
      const report = await api.getGrowthReport(application.id);
      setGrowthReport(report);
    } catch (err) {
      setError('Application failed');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-brand-black">Welcome, {user?.username || 'Candidate'}</h1>
          <p className="text-gray-500">Your personalized job feed based on your skills</p>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: CV Status & Coaching */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <FileText className="text-brand-green" /> CV Status
              </h2>
              
              {!cv ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-brand-green mx-auto mb-4">
                    <Upload size={32} />
                  </div>
                  <p className="text-sm text-gray-500 mb-6">Upload your CV to start matching with top Libyan companies.</p>
                  <label className="btn-primary w-full cursor-pointer text-center block">
                    {uploading ? 'Uploading...' : 'Upload CV (PDF/DOCX)'}
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} accept=".pdf,.docx" />
                  </label>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-emerald-50 rounded-2xl flex items-center gap-4 text-brand-green">
                    <CheckCircle size={24} />
                    <div>
                      <p className="font-bold">CV Digitized</p>
                      <p className="text-xs opacity-80">{cv.is_parsed ? 'AI has parsed your profile' : 'Parsing in progress...'}</p>
                    </div>
                  </div>
                  
                  <div className="p-6 bg-brand-black text-white rounded-2xl">
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                      <TrendingUp size={18} className="text-brand-green" /> CV Coach
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {cv.is_parsed 
                        ? "Your profile is strong! We've identified your core strengths in " + (cv.parsed_data?.skills?.join(', ') || 'your field') + "."
                        : "Digitizing your CV to provide personalized coaching..."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-brand-green">
                <GraduationCap size={24} /> Skill-Bridge
              </h2>
              <div className="space-y-4">
                {growthReport ? (
                  <>
                    <div className="p-4 border border-gray-100 rounded-2xl">
                      <p className="text-sm font-bold mb-2">Skill Gaps Identified</p>
                      <div className="flex flex-wrap gap-2">
                        {growthReport.skill_gaps.map(gap => (
                          <span key={gap} className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded uppercase font-bold">{gap}</span>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 border border-gray-100 rounded-2xl">
                      <p className="text-sm font-bold mb-2">Recommendations</p>
                      <ul className="text-xs text-gray-500 space-y-2">
                        {growthReport.recommendations.map((rec, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-brand-green">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="p-4 border border-gray-100 rounded-2xl text-center">
                    <p className="text-sm text-gray-500">Apply for a job to see your personalized growth report and skill-bridge recommendations.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Job Feed */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-8 flex items-center gap-2">
                <Briefcase className="text-brand-green" /> Personalized Feed
              </h2>
              
              <div className="space-y-6">
                {jobs.map(job => (
                  <motion.div 
                    key={job.id} 
                    whileHover={{ x: 5 }}
                    className="p-6 rounded-2xl border border-gray-100 hover:border-brand-green transition-all group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold group-hover:text-brand-green transition-colors">{job.title}</h3>
                        <p className="text-gray-500 font-medium">Job ID: {job.id}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-brand-green font-black text-2xl">AI</div>
                        <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">Matching</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-400 mb-6">
                      <span className="flex items-center gap-1"><MapPin size={16} /> {job.location}</span>
                      <span className="flex items-center gap-1 uppercase font-bold text-[10px] tracking-widest text-brand-green bg-emerald-50 px-2 py-1 rounded">{job.job_type}</span>
                    </div>
                    <button onClick={() => handleApply(job.id)} className="btn-primary w-full py-3">Apply Now</button>
                  </motion.div>
                ))}
                {jobs.length === 0 && (
                  <div className="text-center py-20 text-gray-400">
                    <Briefcase size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No jobs matching your profile yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;
