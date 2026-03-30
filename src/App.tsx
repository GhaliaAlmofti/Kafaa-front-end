import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyOTP from './pages/VerifyOTP';
import AdminDashboard from './pages/AdminDashboard';
import CandidateDashboard from './pages/CandidateDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';

// Simple Protected Route
const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role?: string }) => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return <Navigate to="/login" />;
  const user = JSON.parse(userStr);
  if (role && user.role !== role) return <Navigate to="/" />;
  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            
            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute role="ADMIN">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Candidate Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute role="CANDIDATE">
                  <CandidateDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Recruiter Routes */}
            <Route 
              path="/recruiter-dashboard" 
              element={
                <ProtectedRoute role="RECRUITER">
                  <RecruiterDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        
        <footer className="bg-brand-black text-white py-12 border-t border-white/10">
          <div className="container mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center text-white font-bold">C</div>
              <span className="text-xl font-black tracking-tighter">CAREER<span className="text-brand-green">VISION</span></span>
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
