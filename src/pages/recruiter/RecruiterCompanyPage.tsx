import React, { useEffect, useState } from 'react';
import { Building2, Loader2, MapPin, Save, Upload } from 'lucide-react';
import { api } from '../../services/api';
import type { Company } from '../../types';
import PageLayout from '../../components/PageLayout';
import { isGoogleMapsEmbedUrl } from '../../utils/googleMaps';

const emptyForm = {
  name: '',
  about: '',
  company_field: '',
  google_maps_url: '',
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
  const [secondaryLogoFile, setSecondaryLogoFile] = useState<File | null>(null);

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
          google_maps_url: c.google_maps_url ?? '',
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
        google_maps_url: form.google_maps_url,
        website: form.website,
        linkedin_url: form.linkedin_url,
        twitter_url: form.twitter_url,
        facebook_url: form.facebook_url,
        ...(logoFile ? { logo: logoFile } : {}),
        ...(secondaryLogoFile ? { secondary_logo: secondaryLogoFile } : {}),
      });
      setCompany(updated);
      setLogoFile(null);
      setSecondaryLogoFile(null);
    } catch {
      setError('Could not save. If you uploaded images, try smaller files (e.g. under 2MB each).');
    } finally {
      setSaving(false);
    }
  };

  const mapsTrimmed = form.google_maps_url.trim();
  const mapsEmbed = mapsTrimmed && isGoogleMapsEmbedUrl(mapsTrimmed);
  const mapsAsLink = mapsTrimmed && !mapsEmbed;

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
      subtitle="Logos, business description, map, and social links appear alongside your job listings."
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
        className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8 space-y-8 max-w-2xl"
      >
        <section className="space-y-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-1">Branding</p>
            <h2 className="text-lg font-bold text-brand-black">Logos</h2>
            <p className="text-sm text-gray-500 mt-1">
              Primary logo is shown on job cards. Add an optional second mark for square or dark-background use.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm font-bold text-brand-black mb-2">Primary logo</p>
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
                  {logoFile ? logoFile.name : 'Upload'}
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
              <p className="text-sm font-bold text-brand-black mb-2">Secondary logo (optional)</p>
              <div className="flex flex-wrap items-center gap-4">
                {company?.secondary_logo_url ? (
                  <img
                    src={company.secondary_logo_url}
                    alt=""
                    className="h-20 w-20 rounded-xl object-cover border border-gray-100 bg-gray-50"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-xl border border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 text-xs text-center px-1">
                    None
                  </div>
                )}
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 font-bold text-sm cursor-pointer hover:border-brand-primary transition-colors">
                  <Upload size={18} className="text-brand-primary" />
                  {secondaryLogoFile ? secondaryLogoFile.name : 'Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => setSecondaryLogoFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4 border-t border-gray-100 pt-8">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-1">Business</p>
            <h2 className="text-lg font-bold text-brand-black">Company details</h2>
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
            <label className="block text-sm font-bold text-brand-black mb-1">Business description</label>
            <p className="text-xs text-gray-500 mb-2">
              Summarize what your company does and why candidates should be interested.
            </p>
            <textarea
              className="input-field w-full min-h-[140px] resize-y"
              value={form.about}
              onChange={(e) => setForm({ ...form, about: e.target.value })}
              required
            />
          </div>
        </section>

        <section className="space-y-4 border-t border-gray-100 pt-8">
          <div className="flex items-start gap-3">
            <MapPin className="text-brand-primary shrink-0 mt-0.5" size={22} />
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-gray-400 mb-1">Location</p>
              <h2 className="text-lg font-bold text-brand-black">Google Maps</h2>
              <p className="text-sm text-gray-500 mt-1">
                Paste a share link to your place on Google Maps, or the embed URL from{' '}
                <span className="font-medium text-gray-600">Share → Embed a map</span> (copy the{' '}
                <code className="text-xs bg-gray-100 px-1 rounded">src</code> URL only). Embed URLs show a live
                preview here.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Maps link or embed URL</label>
            <input
              className="input-field w-full font-mono text-sm"
              type="url"
              placeholder="https://www.google.com/maps/embed?… or https://maps.app.goo.gl/…"
              value={form.google_maps_url}
              onChange={(e) => setForm({ ...form, google_maps_url: e.target.value })}
            />
          </div>

          {mapsEmbed && (
            <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-video max-h-[280px]">
              <iframe
                title="Google Maps preview"
                className="w-full h-full min-h-[200px]"
                src={mapsTrimmed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          )}

          {mapsAsLink && (
            <p className="text-sm text-gray-600">
              <a
                href={mapsTrimmed}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-primary font-bold underline underline-offset-2"
              >
                Open map in Google Maps
              </a>
              <span className="text-gray-400"> — preview uses embed URLs only.</span>
            </p>
          )}
        </section>

        <section className="border-t border-gray-100 pt-8 space-y-4">
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
        </section>

        <button type="submit" disabled={saving} className="btn-primary inline-flex items-center gap-2">
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          Save profile
        </button>
      </form>
    </PageLayout>
  );
};

export default RecruiterCompanyPage;
