import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Building2, Briefcase, Trash2, MapPin, AlertCircle } from 'lucide-react';
import { Company, Job } from '../types';
import { api } from '../services/api';

const AdminDashboard = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form states
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  
  const [newCompany, setNewCompany] = useState({ name: '', about: '', company_field: '' });
  const [newJob, setNewJob] = useState({ title: '', description: '', location: '', job_type: 'FULL_TIME' as any });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const jobsData = await api.listJobs();
      setJobs(jobsData);
      
      // Note: In your current backend, companies are tied to users. 
      // For this demo, we'll use a mock list or fetch if you add a company list endpoint.
      const mockCompanies: Company[] = [
        { id: 1, name: 'Libyan Tech', description: 'Leading tech firm' },
        { id: 2, name: 'NOC', description: 'National Oil Corporation' }
      ];
      setCompanies(mockCompanies);
    } catch (err: any) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createJob(newJob);
      fetchData();
      setNewJob({ title: '', description: '', location: '', job_type: 'FULL_TIME' });
      setShowJobForm(false);
    } catch (err: any) {
      setError('Failed to create job');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-brand-black">Admin Dashboard</h1>
            <p className="text-gray-500">Manage companies and job listings</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setShowJobForm(true)} className="btn-primary flex items-center gap-2">
              <Plus size={18} /> Post New Job
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Companies List (Static for now based on your models) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Building2 className="text-brand-green" /> Companies ({companies.length})
              </h2>
              <div className="space-y-4">
                {companies.map(company => (
                  <div key={company.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 group">
                    <h3 className="font-bold">{company.name}</h3>
                    <p className="text-xs text-gray-500">{company.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Jobs List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Briefcase className="text-brand-green" /> Job Offers ({jobs.length})
              </h2>
              <div className="space-y-4">
                {jobs.map(job => (
                  <div key={job.id} className="p-6 rounded-2xl border border-gray-100 hover:border-brand-green transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{job.title}</h3>
                        <p className="text-brand-green font-medium">Job ID: {job.id}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-emerald-50 text-brand-green text-xs font-bold rounded-full uppercase">
                          {job.job_type}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">{job.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><MapPin size={14} /> {job.location}</span>
                      <span>Posted: {new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {jobs.length === 0 && <p className="text-center text-gray-400 py-12">No jobs posted yet.</p>}
              </div>
            </div>
          </div>
        </div>

        {showJobForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-8 w-full max-w-2xl">
              <h2 className="text-2xl font-bold mb-6">Post New Job Offer</h2>
              <form onSubmit={handleAddJob} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    className="input-field" placeholder="Job Title" required 
                    value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})}
                  />
                  <select 
                    className="input-field"
                    value={newJob.job_type} onChange={e => setNewJob({...newJob, job_type: e.target.value})}
                  >
                    <option value="FULL_TIME">Full Time</option>
                    <option value="PART_TIME">Part Time</option>
                    <option value="INTERNSHIP">Internship</option>
                    <option value="CONTRACT">Contract</option>
                  </select>
                </div>
                <input 
                  className="input-field" placeholder="Location" required 
                  value={newJob.location} onChange={e => setNewJob({...newJob, location: e.target.value})}
                />
                <textarea 
                  className="input-field h-32 resize-none" placeholder="Job Description" required
                  value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})}
                />
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowJobForm(false)} className="flex-1 py-2 text-gray-500 font-bold">Cancel</button>
                  <button type="submit" className="flex-1 btn-primary">Post Job</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
