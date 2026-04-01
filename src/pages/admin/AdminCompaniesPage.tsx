import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { Building2, Shield, AlertCircle } from 'lucide-react';
import type { Company } from '../../types';
import { api } from '../../services/api';

const AdminCompaniesPage = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCompanyForm, setShowCompanyForm] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    about: '',
    company_field: '',
    username: '',
    password: '',
    phone_number: '',
  });
  const [blockingCompanyId, setBlockingCompanyId] = useState<number | null>(null);

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
      <div className="p-8 flex items-center justify-center min-h-[40vh]">Loading…</div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-brand-black">Companies</h1>
          <p className="text-gray-500 text-sm mt-1">Manage recruiter organizations</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCompanyForm(true)}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 font-bold text-brand-black shadow-sm transition hover:border-brand-green hover:text-brand-green"
        >
          <Building2 size={18} /> Add company
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
          <Building2 className="text-brand-green" /> Companies ({companies.length})
        </h2>
        <div className="space-y-4">
          {companies.map((company) => (
            <div
              key={company.id}
              className="p-4 rounded-2xl bg-gray-50 border border-gray-100"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <h3 className="font-bold">{company.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{company.description}</p>
                  {company.company_field && (
                    <p className="text-[10px] uppercase text-brand-green font-semibold mt-2">
                      {company.company_field}
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    company.is_blocked
                      ? 'bg-red-100 text-red-700'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {company.is_blocked ? 'Blocked' : 'Active'}
                </span>
              </div>
              <button
                type="button"
                disabled={blockingCompanyId === company.id}
                onClick={() => void toggleCompanyBlock(company)}
                className="mt-3 w-full text-xs font-bold py-2 rounded-xl border border-gray-200 hover:border-brand-green hover:text-brand-green transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg rounded-3xl bg-white p-8"
          >
            <h2 className="mb-2 text-2xl font-bold">Add company</h2>
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
                  Create company
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminCompaniesPage;
