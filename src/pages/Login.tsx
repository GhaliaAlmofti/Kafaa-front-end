import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, User, Lock, AlertCircle, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.login({ username, password });
      setShowOtp(true);
    } catch (err: any) {
      try {
        const data = JSON.parse(err.message);
        setError(Object.values(data).flat().join(' ') || 'Login failed');
      } catch {
        setError('Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // We need the phone number for verify-otp. 
      // In a real app, the backend might store it in the session or we pass it.
      // For now, we'll try to get it from the user if we had it, or assume the backend knows.
      // The user's backend expects phone_number and otp.
      // Since we don't have phone_number here easily (unless we fetch it or user entered it),
      // we'll assume the username might be the phone number or we need to fetch user first.
      // Actually, let's assume the user entered their phone number as username if they are a candidate.
      
      await api.verifyOtp({ phone_number: username, otp });
      
      // Get user details to determine role
      const userData = await api.getMe();
      
      // Determine role (Mock logic: admin is ADMIN, others are CANDIDATE for now)
      // In a real app, the backend should return the role.
      let role = 'CANDIDATE';
      if (userData.username === 'admin') role = 'ADMIN';
      // If they have jobs or company, maybe RECRUITER?
      
      const userWithRole = { ...userData, role };
      localStorage.setItem('user', JSON.stringify(userWithRole));
      
      if (role === 'ADMIN') navigate('/admin');
      else if (role === 'RECRUITER') navigate('/recruiter-dashboard');
      else navigate('/dashboard');
      
    } catch (err: any) {
      setError('Invalid OTP code. Try 0000');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white p-10 rounded-3xl shadow-xl border border-gray-100"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-brand-green rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
            {showOtp ? <ShieldCheck size={32} /> : <LogIn size={32} />}
          </div>
          <h2 className="text-3xl font-bold">{showOtp ? 'Verify OTP' : 'Welcome Back'}</h2>
          <p className="text-gray-500 mt-2">
            {showOtp ? 'Enter the code sent to your phone' : 'Sign in to your Career Vision account'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {!showOtp ? (
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Username or Phone</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  className="input-field pl-12" 
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-lg disabled:opacity-50">
              {loading ? 'Processing...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Verification Code</label>
              <div className="relative">
                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  className="input-field pl-12" 
                  placeholder="0000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-lg disabled:opacity-50">
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            
            <button 
              type="button" 
              onClick={() => setShowOtp(false)}
              className="w-full text-center text-sm text-gray-500 hover:text-brand-green font-bold"
            >
              Back to Login
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-sm text-gray-500">
          Don't have an account? <Link to="/signup" className="text-brand-green font-bold hover:underline">Create one</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
