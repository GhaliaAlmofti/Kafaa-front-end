import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { meResponseToUser, navigateAfterAuth } from '../utils/authRedirect';
import { useAuth } from '../context/AuthContext';

const VerifyOTP = () => {
  const { t } = useTranslation();
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { verifyOtp: verifyOtpCtx } = useAuth();

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (element.value !== '' && isNaN(Number(element.value))) return;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    if (element.nextSibling && element.value !== '') {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const otpCode = otp.join('');

    try {
      await verifyOtpCtx(otpCode);
      const userData = await api.getMe();
      await navigateAfterAuth(navigate, meResponseToUser(userData));
    } catch {
      setError(t('auth.invalidCode'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-10 rounded-3xl border border-gray-100 text-center"
      >
        <div className="w-16 h-16 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck size={32} />
        </div>

        <h2 className="text-2xl font-bold mb-2">{t('auth.verifyTitle')}</h2>
        <p className="text-gray-500 mb-8 text-sm">
          {t('auth.verifySubtitle')} <br />
          <span className="font-semibold text-gray-700">{t('auth.verifyHint')}</span>
        </p>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg flex items-center justify-center gap-2 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex justify-center gap-3 mb-8">
            {otp.map((data, index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                inputMode="numeric"
                className="w-14 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:border-brand-primary focus:outline-none transition-all"
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onFocus={(e) => e.target.select()}
                required
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || otp.some((d) => d === '')}
            className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
            <ArrowRight size={18} />
          </button>
        </form>

        <button
          type="button"
          onClick={() => setOtp(['', '', '', ''])}
          className="mt-6 text-sm text-gray-400 hover:text-brand-primary transition-colors"
        >
          {t('auth.clearCode')}
        </button>

        <div className="mt-8 text-center text-sm text-gray-500">
          <Link to="/login" className="text-brand-primary font-bold hover:underline">
            {t('auth.backToLogin')}
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyOTP;
