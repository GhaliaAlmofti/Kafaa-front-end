import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api'; // Ensure path is correct
import { SESSION_VERIFY_USER_ID_KEY } from '../utils/authRedirect';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    login: (credentials: any) => Promise<void>;
    verifyOtp: (otp: string) => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean;
    setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // 1. Initial Check: Ask Django "Who am I?" using the session cookie
    useEffect(() => {
        const initAuth = async () => {
            try {
                // Ensure we have a CSRF cookie for future POST requests
                await api.getCsrf();

                // Check for an existing session. 
                // Django MeView now returns { username, role, is_verified, id }
                const data = await api.getMe();

                if (data) {
                    setUser({
                        ...data,
                        // Use the real role coming from Django
                        role: data.role,
                    });
                }
            } catch (err) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    // 2. Login Logic: Hits api/v1/login/
    const login = async (credentials: any) => {
        await api.login(credentials);
        // Note: If your login view requires OTP, we don't setUser(data) here.
        // We wait until verifyOtp succeeds.
    };

    // 3. OTP Verification Logic: Hits api/v1/verify-otp/
    const verifyOtp = async (otp: string) => {
        const rawId = sessionStorage.getItem(SESSION_VERIFY_USER_ID_KEY);
        const userId = rawId ? parseInt(rawId, 10) : undefined;
        await api.verifyOtp(otp, Number.isFinite(userId) ? userId : undefined);
        sessionStorage.removeItem(SESSION_VERIFY_USER_ID_KEY);

        // After OTP success, Django logs the user in. Fetch the full user data.
        const data = await api.getMe();

        const userWithRole = {
            ...data,
            role: data.role,
        };

        setUser(userWithRole);
    };

    // 4. Logout Logic: Hits api/v1/logout/
    const logout = async () => {
        try {
            await api.logout();
        } finally {
            setUser(null);
            // Redirect to login page and clear any local state
            window.location.href = '/login';
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, verifyOtp, logout, loading, setUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};