import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Loader2, Sparkles, FileText, PartyPopper, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageLayout from '../../components/PageLayout';
import CVUpload from '../../components/CVUpload';
import { StepProgress } from '../../components/onboarding/StepProgress';
import { candidateNeedsProfileOnboarding } from '../../utils/authRedirect';

const STEPS = [
  { id: 'profile', label: 'Your profile' },
  { id: 'cv', label: 'Your CV' },
  { id: 'done', label: 'Done' },
];

const CandidateOnboardingPage = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [step, setStep] = useState(0);
  const [major, setMajor] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [cvUploaded, setCvUploaded] = useState(false);

  if (!user) {
    return (
      <PageLayout maxWidth="medium" title="" subtitle="">
        <div className="flex justify-center py-16 text-gray-500 gap-2">
          <Loader2 className="animate-spin" size={22} />
        </div>
      </PageLayout>
    );
  }

  if (!candidateNeedsProfileOnboarding(user) && step === 0) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!major.trim() || !city.trim()) {
      setError('Please enter your field and city.');
      return;
    }
    setSaving(true);
    try {
      await api.createProfile({
        major: major.trim(),
        city: city.trim(),
        bio: bio.trim(),
      });
      await refreshUser();
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const finishToDashboard = async () => {
    try {
      const cvs = await api.getUserCV();
      navigate(cvs.length === 0 ? '/dashboard/cv' : '/dashboard', { replace: true });
    } catch {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <PageLayout
      maxWidth="comfortable"
      title="Complete your profile"
      subtitle="A short profile helps employers recognize you. Then add a CV so our tools can analyze your experience."
    >
      <StepProgress steps={STEPS} current={step} />

      {error ? (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-center gap-2 border border-red-100 text-sm">
          <AlertCircle size={18} />
          {error}
        </div>
      ) : null}

      {step === 0 && (
        <form
          onSubmit={(e) => void handleSaveProfile(e)}
          className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 space-y-5"
        >
          <div className="rounded-2xl border border-brand-primary-soft bg-brand-primary-faint/50 p-4 flex gap-3">
            <Sparkles className="text-brand-primary shrink-0 mt-0.5" size={22} />
            <p className="text-sm text-gray-700">
              This information appears on your account and supports job applications. You can edit it anytime under{' '}
              <strong>My account</strong>.
            </p>
          </div>
          <div>
            <label htmlFor="onb-major" className="block text-sm font-semibold text-gray-700 mb-2">
              Field / major
            </label>
            <input
              id="onb-major"
              className="input-field"
              placeholder="e.g. Civil engineering, Nursing, Software development"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="onb-city" className="block text-sm font-semibold text-gray-700 mb-2">
              City
            </label>
            <input
              id="onb-city"
              className="input-field"
              placeholder="e.g. Tripoli, Benghazi"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="onb-bio" className="block text-sm font-semibold text-gray-700 mb-2">
              Short bio <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="onb-bio"
              className="input-field min-h-[100px] resize-y"
              placeholder="A few lines about your goals, experience level, or what you are looking for."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
            />
          </div>
          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="btn-primary px-8 py-2.5 disabled:opacity-50">
              {saving ? 'Saving…' : 'Continue'}
            </button>
          </div>
        </form>
      )}

      {step === 1 && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-gray-50/80 p-4 flex gap-3">
            <FileText className="text-brand-primary shrink-0 mt-0.5" size={22} />
            <div className="text-sm text-gray-700 space-y-1">
              <p className="font-bold text-brand-black">Upload a résumé</p>
              <p>
                We run <span className="ai-text-gradient font-bold">AI analysis</span> on your CV so match scores
                and growth reports are meaningful. You can skip for now and upload later from <strong>My CV</strong>.
              </p>
            </div>
          </div>
          <CVUpload
            onUploadSuccess={() => {
              setCvUploaded(true);
              setStep(2);
            }}
          />
          <div className="flex justify-end">
            <button type="button" className="btn-primary" onClick={() => void finishToDashboard()}>
              Skip for now
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center">
            Need to fix your profile details? Update them anytime under <strong>My account</strong>.
          </p>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-3xl border border-gray-100 p-8 md:p-10 text-center space-y-4">
          <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mx-auto">
            <PartyPopper size={32} />
          </div>
          <h2 className="text-xl font-bold text-brand-black">You are set</h2>
          <p className="text-gray-600 text-sm max-w-md mx-auto">
            {cvUploaded
              ? 'Your CV is uploaded. Analysis may take a moment — you can check status on My CV.'
              : 'Add a CV when you are ready from the My CV page to unlock match scores and growth insights.'}
          </p>
          <button type="button" className="btn-primary px-10 py-3 mt-2" onClick={() => void finishToDashboard()}>
            Go to dashboard
          </button>
        </div>
      )}
    </PageLayout>
  );
};

export default CandidateOnboardingPage;
