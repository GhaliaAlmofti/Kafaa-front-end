import React, { useEffect, useState } from 'react';
import { Building2, Loader2, Save, Upload } from 'lucide-react';
import { api } from '../../services/api';
import type { Company } from '../../types';
import PageLayout from '../../components/PageLayout';

const emptyForm = {
  name: '',
  about: '',
  company_field: '',
  website: '',
  linkedin_url: '',
  twitter_url: '',
  facebook_url: '',
};

const RecruiterCompanyPage = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true);
        setError('');
        const c = await api.getMyCompany();
        setCompany(c);
        setForm({
          name: c.name,
          about: c.description,
          company_field: c.company_field ?? '',
          website: c.website ?? '',
          linkedin_url: c.linkedin_url ?? '',
          twitter_url: c.twitter_url ?? '',
          facebook_url: c.facebook_url ?? '',
        });
      } catch {
        setError('Could not load your company profile.');
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      const updated = await api.patchMyCompany({
        name: form.name,
        about: form.about,
        company_field: form.company_field,
        website: form.website,
        linkedin_url: form.linkedin_url,
        twitter_url: form.twitter_url,
        facebook_url: form.facebook_url,
        ...(logoFile ? { logo: logoFile } : {}),
      });
      setCompany(updated);
      setLogoFile(null);
    } catch {
      setError('Could not save. If you uploaded a logo, try a smaller image (e.g. under 2MB).');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageLayout.Shell maxWidth="wide">
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="animate-spin text-brand-primary" size={40} />
        </div>
      </PageLayout.Shell>
    );
  }

  if (!company && error) {
    return (
      <PageLayout maxWidth="wide" title="Company profile" subtitle="Visible to candidates with your jobs">
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">{error}</div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      maxWidth="wide"
      title="Company profile"
      subtitle="Logo, about us, and social links appear alongside your job listings."
      actions={
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-2">
          <Building2 size={16} className="text-brand-primary" />
          Recruiter
        </span>
      }
    >
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">{error}</div>
      )}

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 space-y-6 max-w-2xl"
      >
        <div>
          <p className="text-sm font-bold text-brand-black mb-2">Logo</p>
          <div className="flex flex-wrap items-center gap-4">
            {company?.logo_url ? (
              <img
                src={company.logo_url}
                alt=""
                className="h-20 w-20 rounded-xl object-cover border border-gray-100 bg-gray-50"
              />
            ) : (
              <div className="h-20 w-20 rounded-xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 text-xs text-center px-1">
                No logo
              </div>
            )}
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 font-bold text-sm cursor-pointer hover:border-brand-primary transition-colors">
              <Upload size={18} className="text-brand-primary" />
              {logoFile ? logoFile.name : 'Upload image'}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-brand-black mb-1">Company name</label>
          <input
            className="input-field w-full"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-brand-black mb-1">Industry / field</label>
          <input
            className="input-field w-full"
            value={form.company_field}
            onChange={(e) => setForm({ ...form, company_field: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-brand-black mb-1">About us</label>
          <textarea
            className="input-field w-full min-h-[120px] resize-y"
            value={form.about}
            onChange={(e) => setForm({ ...form, about: e.target.value })}
            required
          />
        </div>

        <div className="border-t border-gray-100 pt-6 space-y-4">
          <p className="text-xs font-black uppercase tracking-wider text-gray-400">Social & web</p>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Website</label>
            <input
              className="input-field w-full"
              type="url"
              placeholder="https://"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">LinkedIn</label>
            <input
              className="input-field w-full"
              type="url"
              placeholder="https://linkedin.com/company/…"
              value={form.linkedin_url}
              onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">X (Twitter)</label>
            <input
              className="input-field w-full"
              type="url"
              placeholder="https://x.com/…"
              value={form.twitter_url}
              onChange={(e) => setForm({ ...form, twitter_url: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Facebook</label>
            <input
              className="input-field w-full"
              type="url"
              placeholder="https://facebook.com/…"
              value={form.facebook_url}
              onChange={(e) => setForm({ ...form, facebook_url: e.target.value })}
            />
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary inline-flex items-center gap-2">
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          Save profile
        </button>
      </form>
    </PageLayout>
  );
};

export default RecruiterCompanyPage;
