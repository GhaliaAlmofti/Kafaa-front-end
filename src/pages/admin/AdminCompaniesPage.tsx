import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Building2, Shield, AlertCircle, ExternalLink, Upload } from 'lucide-react';
import type { Company } from '../../types';
import { api } from '../../services/api';
import PageLayout from '../../components/PageLayout';

const AdminCompaniesPage = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    about: '',
    company_field: '',
    website: '',
    linkedin_url: '',
    twitter_url: '',
    facebook_url: '',
    username: '',
    password: '',
    phone_number: '',
  });
  const [blockingCompanyId, setBlockingCompanyId] = useState<number | null>(null);
  const [newCompanyLogo, setNewCompanyLogo] = useState<File | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const companiesData = await api.listCompanies();
      setCompanies(companiesData);
    } catch {
      setError('Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      const created = await api.createCompany({
        ...newCompany,
        ...(newCompanyLogo ? { logo: newCompanyLogo } : {}),
      });
      setShowCompanyForm(false);
      setNewCompanyLogo(null);
      setNewCompany({
        name: '',
        about: '',
        company_field: '',
        website: '',
        linkedin_url: '',
        twitter_url: '',
        facebook_url: '',
        username: '',
        password: '',
        phone_number: '',
      });
      setCompanies((prev) => [...prev, created]);
      fetchData();
    } catch {
      setError(
        'Failed to create company. Check that username and phone are unique and you are logged in as admin.',
      );
    }
  };

  const toggleCompanyBlock = async (company: Company) => {
    try {
      setBlockingCompanyId(company.id);
      const updated = await api.patchCompany(company.id, { is_blocked: !company.is_blocked });
      setCompanies((prev) => prev.map((c) => (c.id === company.id ? updated : c)));
    } catch {
      setError('Failed to update company.');
    } finally {
      setBlockingCompanyId(null);
    }
  };

  if (loading) {
    return (
      <PageLayout.Shell maxWidth="wide">
        <div className="flex items-center justify-center min-h-[40vh] text-gray-500">Loading…</div>
      </PageLayout.Shell>
    );
  }

  return (
    <PageLayout
      maxWidth="wide"
      title="Companies"
      subtitle="Manage recruiter organizations"
      actions={
        <button
          type="button"
          onClick={() => setShowCompanyForm(true)}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 font-bold text-brand-black transition hover:border-brand-primary hover:text-brand-primary"
        >
          <Building2 size={18} /> Add company
        </button>
      }
    >
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 border border-gray-100">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Building2 className="text-brand-primary" /> Companies ({companies.length})
        </h2>
        <div className="space-y-4">
          {companies.map((company) => (
            <div
              key={company.id}
              className="p-4 rounded-2xl bg-gray-50 border border-gray-100"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0 flex gap-3">
                  {company.logo_url ? (
                    <img
                      src={company.logo_url}
                      alt=""
                      className="h-14 w-14 rounded-xl object-cover border border-gray-100 shrink-0 bg-white"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-xl border border-dashed border-gray-200 shrink-0 bg-white" />
                  )}
                  <div className="min-w-0">
                    <h3 className="font-bold">{company.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{company.description}</p>
                    {company.company_field && (
                      <p className="text-[10px] uppercase text-brand-primary font-semibold mt-2">
                        {company.company_field}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {company.website && (
                        <a
                          href={company.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-brand-primary inline-flex items-center gap-0.5 hover:underline"
                        >
                          <ExternalLink size={10} /> Site
                        </a>
                      )}
                      {company.linkedin_url && (
                        <a
                          href={company.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-gray-600 inline-flex items-center gap-0.5 hover:underline"
                        >
                          LinkedIn
                        </a>
                      )}
                      {company.twitter_url && (
                        <a
                          href={company.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-gray-600 inline-flex items-center gap-0.5 hover:underline"
                        >
                          X
                        </a>
                      )}
                      {company.facebook_url && (
                        <a
                          href={company.facebook_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-gray-600 inline-flex items-center gap-0.5 hover:underline"
                        >
                          Facebook
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <span
                  className={`shrink-0 text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    company.is_blocked
                      ? 'bg-red-100 text-red-700'
                      : 'bg-brand-primary-soft text-brand-primary-deep'
                  }`}
                >
                  {company.is_blocked ? 'Blocked' : 'Active'}
                </span>
              </div>
              <button
                type="button"
                disabled={blockingCompanyId === company.id}
                onClick={() => void toggleCompanyBlock(company)}
                className="mt-3 w-full text-xs font-bold py-2 rounded-xl border border-gray-200 hover:border-brand-primary hover:text-brand-primary transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Shield size={14} />
                {blockingCompanyId === company.id
                  ? 'Updating…'
                  : company.is_blocked
                    ? 'Unblock company'
                    : 'Block company'}
              </button>
            </div>
          ))}
          {companies.length === 0 && (
            <p className="text-center text-gray-400 py-12">No companies yet.</p>
          )}
        </div>
      </div>

      {showCompanyForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-5 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex w-full max-w-2xl max-h-[min(90vh,640px)] flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
          >
            <div className="shrink-0 border-b border-gray-100 px-5 py-4">
              <h2 className="text-lg font-bold text-brand-black">Add company</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Creates a recruiter account and links it to the new company.
              </p>
            </div>
            <form onSubmit={handleAddCompany} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-3">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-x-3 sm:gap-y-2">
                  <input
                    className="input-field py-2 text-sm"
                    placeholder="Company name"
                    required
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  />
                  <input
                    className="input-field py-2 text-sm"
                    placeholder="Industry / field"
                    required
                    value={newCompany.company_field}
                    onChange={(e) => setNewCompany({ ...newCompany, company_field: e.target.value })}
                  />
                  <div className="sm:col-span-2 flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2">
                    <span className="text-[10px] font-black uppercase tracking-wide text-gray-400">
                      Logo
                    </span>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-brand-black transition hover:border-brand-primary">
                      <Upload size={14} className="text-brand-primary" />
                      {newCompanyLogo ? newCompanyLogo.name : 'Upload image'}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => setNewCompanyLogo(e.target.files?.[0] ?? null)}
                      />
                    </label>
                    {newCompanyLogo && (
                      <button
                        type="button"
                        className="text-xs font-bold text-red-600 hover:underline"
                        onClick={() => setNewCompanyLogo(null)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <textarea
                    className="input-field min-h-[4.25rem] resize-y py-2 text-sm sm:col-span-2"
                    rows={3}
                    placeholder="About the company"
                    required
                    value={newCompany.about}
                    onChange={(e) => setNewCompany({ ...newCompany, about: e.target.value })}
                  />
                  <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 sm:col-span-2 pt-1">
                    Web & social (optional)
                  </p>
                  <input
                    className="input-field py-2 text-sm"
                    type="url"
                    placeholder="Website"
                    value={newCompany.website}
                    onChange={(e) => setNewCompany({ ...newCompany, website: e.target.value })}
                  />
                  <input
                    className="input-field py-2 text-sm"
                    type="url"
                    placeholder="LinkedIn"
                    value={newCompany.linkedin_url}
                    onChange={(e) => setNewCompany({ ...newCompany, linkedin_url: e.target.value })}
                  />
                  <input
                    className="input-field py-2 text-sm"
                    type="url"
                    placeholder="X (Twitter)"
                    value={newCompany.twitter_url}
                    onChange={(e) => setNewCompany({ ...newCompany, twitter_url: e.target.value })}
                  />
                  <input
                    className="input-field py-2 text-sm"
                    type="url"
                    placeholder="Facebook"
                    value={newCompany.facebook_url}
                    onChange={(e) => setNewCompany({ ...newCompany, facebook_url: e.target.value })}
                  />
                  <div className="border-t border-gray-100 sm:col-span-2" />
                  <p className="text-[10px] font-black uppercase tracking-wide text-gray-400 sm:col-span-2">
                    Recruiter login
                  </p>
                  <input
                    className="input-field py-2 text-sm"
                    placeholder="Username"
                    required
                    autoComplete="username"
                    value={newCompany.username}
                    onChange={(e) => setNewCompany({ ...newCompany, username: e.target.value })}
                  />
                  <input
                    className="input-field py-2 text-sm"
                    type="password"
                    placeholder="Password"
                    required
                    autoComplete="new-password"
                    value={newCompany.password}
                    onChange={(e) => setNewCompany({ ...newCompany, password: e.target.value })}
                  />
                  <input
                    className="input-field py-2 text-sm sm:col-span-2"
                    placeholder="Phone number"
                    required
                    value={newCompany.phone_number}
                    onChange={(e) => setNewCompany({ ...newCompany, phone_number: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex shrink-0 gap-3 border-t border-gray-100 bg-gray-50/90 px-5 py-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCompanyForm(false);
                    setNewCompanyLogo(null);
                  }}
                  className="flex-1 rounded-xl py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary py-2.5 text-sm">
                  Create company
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </PageLayout>
  );
};

export default AdminCompaniesPage;
