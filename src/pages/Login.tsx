import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, User, Lock, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { SESSION_VERIFY_USER_ID_KEY, meResponseToUser, navigateAfterAuth } from '../utils/authRedirect';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.login({ username, password });

      if (!result.is_verified) {
        if (result.user_id != null) {
          sessionStorage.setItem(SESSION_VERIFY_USER_ID_KEY, String(result.user_id));
        }
        navigate('/verify-otp');
        return;
      }

      await refreshUser();
      const userData = await api.getMe();
      await navigateAfterAuth(navigate, meResponseToUser(userData));
    } catch (err: unknown) {
      try {
        const msg = err instanceof Error ? err.message : String(err);
        const data = JSON.parse(msg);
        setError(Object.values(data).flat().join(' ') || t('auth.loginFailed'));
      } catch {
        setError(t('auth.invalidCredentials'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white p-10 rounded-3xl border border-gray-100"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
            <LogIn size={32} />
          </div>
          <h2 className="text-3xl font-bold">{t('auth.welcomeBack')}</h2>
          <p className="text-gray-500 mt-2">{t('auth.signInSubtitle')}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">{t('auth.usernameOrPhone')}</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                className="input-field pl-12"
                placeholder={t('auth.usernamePlaceholder')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">{t('auth.password')}</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                className="input-field pl-12"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-lg disabled:opacity-50">
            {loading ? t('auth.signInProcessing') : t('auth.signIn')}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500 space-y-2">
          <p>
            {t('auth.dontHaveAccount')}{' '}
            <Link to="/signup" className="text-brand-primary font-bold hover:underline">
              {t('auth.createOne')}
            </Link>
          </p>
          <p>
            {t('auth.hiring')}{' '}
            <Link to="/recruiter/register" className="text-brand-primary font-bold hover:underline">
              {t('auth.registerEmployer')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
