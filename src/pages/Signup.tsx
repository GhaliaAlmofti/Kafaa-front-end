import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Phone, Lock, User, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!otpSent) {
        await api.signup({ username, password, phone_number: phone });
        setOtpSent(true);
      } else {
        // In a real flow, verify-otp would happen here or on login
        // For now, we assume signup triggers OTP and then user logs in
        navigate('/login');
      }
    } catch (err: any) {
      try {
        const data = JSON.parse(err.message);
        setError(Object.values(data).flat().join(' ') || 'Signup failed');
      } catch {
        setError(err.message || 'Signup failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl bg-white p-10 rounded-3xl shadow-xl border border-gray-100"
      >
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-brand-green rounded-2xl flex items-center justify-center text-white mx-auto mb-4">
            <UserPlus size={32} />
          </div>
          <h2 className="text-3xl font-bold">User Sign Up</h2>
          <p className="text-gray-500 mt-2">Apply for a job or search for one</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
          {!otpSent ? (
            <>
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
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Libyan Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="tel" 
                    className="input-field pl-12" 
                    placeholder="091 XXX XXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-lg disabled:opacity-50">
                {loading ? 'Processing...' : 'Send Verification Code'}
              </button>
            </>
          ) : (
            <>
              <div className="text-center py-4">
                <p className="text-brand-green font-bold mb-4">Account created successfully!</p>
                <p className="text-sm text-gray-500">Please proceed to login to verify your phone number with code 0000.</p>
              </div>
              <Link to="/login" className="btn-primary w-full py-3 text-lg text-center block">
                Go to Login
              </Link>
            </>
          )}
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          Already have an account? <Link to="/login" className="text-brand-green font-bold hover:underline">Sign in</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
