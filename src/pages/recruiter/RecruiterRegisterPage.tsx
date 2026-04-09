import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  User,
  Lock,
  Phone,
  Globe,
  Linkedin,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Briefcase,
} from 'lucide-react';
import { api } from '../../services/api';
import { SESSION_VERIFY_USER_ID_KEY } from '../../utils/authRedirect';
import { StepProgress } from '../../components/onboarding/StepProgress';

const STEPS = [
  { id: 'account', label: 'Account' },
  { id: 'company', label: 'Company' },
  { id: 'presence', label: 'Online presence' },
];

const RecruiterRegisterPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  const [companyName, setCompanyName] = useState('');
  const [companyField, setCompanyField] = useState('');
  const [about, setAbout] = useState('');

  const [website, setWebsite] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');

  const goNext = () => {
    setError('');
    if (step === 0) {
      if (!username.trim() || !password || !phone.trim()) {
        setError('Please fill in username, password, and phone number.');
        return;
      }
    }
    if (step === 1) {
      if (!companyName.trim() || !companyField.trim() || !about.trim()) {
        setError('Company name, industry, and description are required.');
        return;
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.getCsrf().catch(() => {});
      const created = await api.recruiterSignup({
        username: username.trim(),
        password,
        phone_number: phone.trim(),
        name: companyName.trim(),
        about: about.trim(),
        company_field: companyField.trim(),
        website: website.trim(),
        linkedin_url: linkedinUrl.trim(),
        twitter_url: twitterUrl.trim(),
        facebook_url: facebookUrl.trim(),
      });
      sessionStorage.setItem(SESSION_VERIFY_USER_ID_KEY, String(created.user_id));
      navigate('/verify-otp');
    } catch (err: unknown) {
      try {
        const msg = err instanceof Error ? err.message : String(err);
        const data = JSON.parse(msg);
        setError(Object.values(data as Record<string, unknown>).flat().join(' ') || 'Registration failed');
      } catch {
        setError(err instanceof Error ? err.message : 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl bg-white p-8 md:p-10 rounded-3xl border border-gray-100 shadow-sm"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
            <Building2 size={32} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-black">Employer registration</h1>
          <p className="text-gray-500 mt-2 text-sm md:text-base max-w-md mx-auto">
            Create your recruiter account and company profile. You will verify your phone number before signing in.
          </p>
        </div>

        <StepProgress steps={STEPS} current={step} className="mb-8" />

        {error ? (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle size={18} className="shrink-0" />
            {error}
          </div>
        ) : null}

        <form onSubmit={step === STEPS.length - 1 ? handleSubmit : (e) => e.preventDefault()} className="space-y-6">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Username</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    className="input-field pl-12"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="password"
                    className="input-field pl-12"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Libyan phone number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="tel"
                    className="input-field pl-12"
                    placeholder="091 XXX XXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    autoComplete="tel"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Company name</label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    className="input-field pl-12"
                    placeholder="e.g. Sahara Tech Solutions"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Industry / field</label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    className="input-field pl-12"
                    placeholder="e.g. Oil & gas, IT, Education"
                    value={companyField}
                    onChange={(e) => setCompanyField(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">About the company</label>
                <textarea
                  className="input-field min-h-[120px] resize-y"
                  placeholder="What does your organization do? Who do you hire?"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  rows={5}
                  required
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <p className="text-sm text-gray-500">
                Optional links help candidates learn about your brand. You can edit these later in your company
                profile.
              </p>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Website</label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="url"
                    className="input-field pl-12"
                    placeholder="https://"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">LinkedIn</label>
                <div className="relative">
                  <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="url"
                    className="input-field pl-12"
                    placeholder="https://linkedin.com/company/…"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">X (Twitter)</label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://"
                  value={twitterUrl}
                  onChange={(e) => setTwitterUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Facebook</label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-between pt-2">
            <button
              type="button"
              onClick={goBack}
              disabled={step === 0 || loading}
              className="btn-secondary inline-flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <ArrowLeft size={18} />
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={goNext} className="btn-primary inline-flex items-center justify-center gap-2">
                Continue
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Submitting…' : 'Create account & verify phone'}
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Looking for jobs?{' '}
          <Link to="/signup" className="text-brand-primary font-bold hover:underline">
            Sign up as a candidate
          </Link>
          {' · '}
          <Link to="/login" className="text-brand-primary font-bold hover:underline">
            Sign in
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default RecruiterRegisterPage;
