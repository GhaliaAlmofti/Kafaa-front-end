import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { persistUserAndNavigate, SESSION_VERIFY_USER_ID_KEY } from '../utils/authRedirect';

const VerifyOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
    const rawId = sessionStorage.getItem(SESSION_VERIFY_USER_ID_KEY);
    const userId = rawId ? parseInt(rawId, 10) : undefined;

    try {
      await api.verifyOtp(otpCode, Number.isFinite(userId) ? userId : undefined);
      sessionStorage.removeItem(SESSION_VERIFY_USER_ID_KEY);
      const userData = await api.getMe();
      persistUserAndNavigate(navigate, userData);
    } catch {
      setError('Invalid code. Please try again (Default: 0000)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl text-center"
      >
        <div className="w-16 h-16 bg-brand-green/10 text-brand-green rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck size={32} />
        </div>

        <h2 className="text-2xl font-bold mb-2">Verify Phone Number</h2>
        <p className="text-gray-500 mb-8 text-sm">
          Enter the 4-digit code sent to your phone. <br />
          <span className="font-semibold text-gray-700">Hint: Use 0000</span>
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
                className="w-14 h-14 text-center text-2xl font-bold border-2 rounded-xl focus:border-brand-green focus:outline-none transition-all"
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
          className="mt-6 text-sm text-gray-400 hover:text-brand-green transition-colors"
        >
          Clear code
        </button>

        <div className="mt-8 text-center text-sm text-gray-500">
          <Link to="/login" className="text-brand-green font-bold hover:underline">
            Back to login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyOTP;
