import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const VerifyOTP = () => {
    const [otp, setOtp] = useState(['', '', '', '']);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { verifyOtp, user } = useAuth();
    const navigate = useNavigate();

    // If a user is already verified, send them to their dashboard
    useEffect(() => {
        if (user?.is_verified) {
            navigate(user.role === 'RECRUITER' ? '/recruiter-dashboard' : '/dashboard');
        }
    }, [user, navigate]);

    const handleChange = (element: HTMLInputElement, index: number) => {
        if (isNaN(Number(element.value))) return false;

        setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

        // Focus next input
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
            await verifyOtp(otpCode);
            // Success! AuthContext will update, and the useEffect above will redirect
        } catch (err: any) {
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
                        disabled={loading || otp.includes('')}
                        className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? 'Verifying...' : 'Verify & Continue'}
                        <ArrowRight size={18} />
                    </button>
                </form>

                <button
                    onClick={() => setOtp(['', '', '', ''])}
                    className="mt-6 text-sm text-gray-400 hover:text-brand-green transition-colors"
                >
                    Clear code
                </button>
            </motion.div>
        </div>
    );
};

export default VerifyOTP;