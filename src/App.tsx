import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyOTP from './pages/VerifyOTP';
import AdminDashboard from './pages/AdminDashboard';
import CandidateDashboard from './pages/CandidateDashboard';

// Updated Protected Route: Determines access based on the "username" 
// because the backend doesn't have a role field.
const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const userStr = localStorage.getItem('user');

  // 1. If no user is logged in, send to login
  if (!userStr) return <Navigate to="/login" />;

  const user = JSON.parse(userStr);
  const isAdmin = user.username?.toLowerCase() === 'admin';

  // 2. If page requires admin but user is NOT admin, send to user dashboard
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  // 3. If a normal user tries to access /login or /signup while logged in (optional but good)
  // We'll keep it simple for now and just return the children.
  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />

        <main className="flex-grow pt-20">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />

            {/* Admin Dashboard - Strictly for username 'admin' */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin={true}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Candidate Dashboard - For everyone else */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <CandidateDashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch-all Fallback: 
                If logged in as admin, go to admin. 
                If logged in as user, go to dashboard. 
                Otherwise, go home. */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <footer className="bg-brand-black text-white py-12 border-t border-white/10">
          <div className="container mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center text-white font-bold">C</div>
              <span className="text-xl font-black tracking-tighter text-white">
                CAREER<span className="text-brand-green">VISION</span>
              </span>
            </div>
            <p className="text-gray-500 text-sm mb-8">© 2026 Career Vision. Building the future of Libyan recruitment.</p>
            <div className="flex justify-center gap-8 text-gray-400 text-sm">
              <a href="#" className="hover:text-brand-green transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-brand-green transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-brand-green transition-colors">Contact Us</a>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}