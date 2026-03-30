import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Building2, Briefcase, MapPin, AlertCircle } from 'lucide-react';
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
  
  const [newJob, setNewJob] = useState<{ title: string; description: string; location: string; job_type: Job['job_type'] }>({
    title: '',
    description: '',
    location: '',
    job_type: 'FULL_TIME',
  });
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [newCompany, setNewCompany] = useState({
    name: '',
    about: '',
    company_field: '',
    username: '',
    password: '',
    phone_number: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const companiesData = await api.listCompanies();
      setCompanies(companiesData);
      setSelectedCompanyId((prev) => prev ?? companiesData[0]?.id ?? null);

      const jobsData = await api.listJobs();
      setJobs(jobsData);
    } catch (err: any) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      const created = await api.createCompany(newCompany);
      setShowCompanyForm(false);
      setNewCompany({
        name: '',
        about: '',
        company_field: '',
        username: '',
        password: '',
        phone_number: '',
      });
      setCompanies((prev) => [...prev, created]);
      setSelectedCompanyId(created.id);
    } catch {
      setError('Failed to create company. Check that username and phone are unique and you are logged in as admin.');
    }
  };

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
            <button
              type="button"
              onClick={() => setShowCompanyForm(true)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 font-bold text-brand-black shadow-sm transition hover:border-brand-green hover:text-brand-green"
            >
              <Building2 size={18} /> Add Company
            </button>
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
                    {company.company_field && (
                      <p className="text-[10px] uppercase text-brand-green font-semibold mt-2">{company.company_field}</p>
                    )}
                  </div>
                ))}
                {companies.length === 0 && <p className="text-center text-gray-400 py-12">No companies found.</p>}
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

        {showCompanyForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-lg rounded-3xl bg-white p-8"
            >
              <h2 className="mb-2 text-2xl font-bold">Add Company</h2>
              <p className="mb-6 text-sm text-gray-500">
                Creates a recruiter account and links it to the new company.
              </p>
              <form onSubmit={handleAddCompany} className="space-y-4">
                <input
                  className="input-field"
                  placeholder="Company name"
                  required
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                />
                <input
                  className="input-field"
                  placeholder="Industry / field (e.g. Oil & Gas)"
                  required
                  value={newCompany.company_field}
                  onChange={(e) => setNewCompany({ ...newCompany, company_field: e.target.value })}
                />
                <textarea
                  className="input-field h-24 resize-none"
                  placeholder="About the company"
                  required
                  value={newCompany.about}
                  onChange={(e) => setNewCompany({ ...newCompany, about: e.target.value })}
                />
                <div className="border-t border-gray-100 pt-4">
                  <p className="mb-3 text-xs font-bold uppercase text-gray-400">Recruiter login</p>
                  <input
                    className="input-field mb-3"
                    placeholder="Username"
                    required
                    autoComplete="username"
                    value={newCompany.username}
                    onChange={(e) => setNewCompany({ ...newCompany, username: e.target.value })}
                  />
                  <input
                    className="input-field mb-3"
                    type="password"
                    placeholder="Password"
                    required
                    autoComplete="new-password"
                    value={newCompany.password}
                    onChange={(e) => setNewCompany({ ...newCompany, password: e.target.value })}
                  />
                  <input
                    className="input-field"
                    placeholder="Phone number"
                    required
                    value={newCompany.phone_number}
                    onChange={(e) => setNewCompany({ ...newCompany, phone_number: e.target.value })}
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCompanyForm(false)}
                    className="flex-1 py-2 font-bold text-gray-500"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 btn-primary">
                    Create Company
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

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
                    required
                    value={selectedCompanyId ?? ''}
                    onChange={e => setSelectedCompanyId(Number(e.target.value))}
                  >
                    <option value="" disabled>Select Company</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select 
                    className="input-field"
                    value={newJob.job_type} onChange={e => setNewJob({...newJob, job_type: e.target.value as Job['job_type']})}
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
