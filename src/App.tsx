import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VerifyOTP from './pages/VerifyOTP';
import Jobs from './pages/Jobs';
import CandidateLayout from './layouts/CandidateLayout';
import CandidateOverview from './pages/candidate/CandidateOverview';
import CandidateApplicationsPage from './pages/candidate/CandidateApplicationsPage';
import CandidateCvPage from './pages/candidate/CandidateCvPage';
import CandidateJobsPage from './pages/candidate/CandidateJobsPage';
import AdminLayout from './layouts/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminCompaniesPage from './pages/admin/AdminCompaniesPage';
import AdminJobsPage from './pages/admin/AdminJobsPage';
import RecruiterLayout from './layouts/RecruiterLayout';
import RecruiterHomeSwitch from './pages/recruiter/RecruiterHomeSwitch';
import RecruiterJobDetailPage from './pages/recruiter/RecruiterJobDetailPage';
import RecruiterCompanyPage from './pages/recruiter/RecruiterCompanyPage';
import RecruiterRegisterPage from './pages/recruiter/RecruiterRegisterPage';
import CandidateOnboardingPage from './pages/candidate/CandidateOnboardingPage';
import MyAccount from './pages/MyAccount';
import RedirectToRoleAccount from './components/RedirectToRoleAccount';
import { useAuth } from './context/AuthContext';
import type { UserRole } from './types';

const ProtectedRoute = ({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles?: UserRole[];
}) => {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        {t('app.protectedLoading')}
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && (!user.role || !roles.includes(user.role))) {
    if (user.role === 'ADMIN') {
      return <Navigate to="/admin" replace />;
    }
    if (user.role === 'RECRUITER') {
      return <Navigate to="/recruiter" replace />;
    }
    if (user.role === 'PENDING_RECRUITER') {
      return <Navigate to="/recruiter" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function isAppShellPath(pathname: string) {
  if (pathname.startsWith('/recruiter/register')) return false;
  return (
    /^\/dashboard(\/|$)/.test(pathname) ||
    /^\/admin(\/|$)/.test(pathname) ||
    /^\/recruiter(\/|$)/.test(pathname)
  );
}

function AppShell() {
  const { pathname } = useLocation();
  const shell = isAppShellPath(pathname);
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {!shell && <Navbar />}

      <main className={shell ? 'flex-grow flex flex-col min-h-0' : 'flex-grow pt-20'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />
          <Route path="/recruiter/register" element={<RecruiterRegisterPage />} />
          <Route path="/jobs" element={<Jobs />} />

          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <RedirectToRoleAccount />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="companies" element={<AdminCompaniesPage />} />
            <Route path="jobs" element={<AdminJobsPage />} />
            <Route path="account" element={<MyAccount />} />
          </Route>

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['CANDIDATE']}>
                <CandidateLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CandidateOverview />} />
            <Route path="onboarding" element={<CandidateOnboardingPage />} />
            <Route path="applications" element={<CandidateApplicationsPage />} />
            <Route path="cv" element={<CandidateCvPage />} />
            <Route path="jobs" element={<CandidateJobsPage />} />
            <Route path="account" element={<MyAccount />} />
          </Route>

          <Route
            path="/recruiter"
            element={
              <ProtectedRoute roles={['RECRUITER', 'PENDING_RECRUITER']}>
                <RecruiterLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RecruiterHomeSwitch />} />
            <Route path="company" element={<RecruiterCompanyPage />} />
            <Route
              path="jobs/:jobId"
              element={
                <ProtectedRoute roles={['RECRUITER']}>
                  <RecruiterJobDetailPage />
                </ProtectedRoute>
              }
            />
            <Route path="account" element={<MyAccount />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!shell && (
        <footer className="bg-brand-black text-white py-12 border-t border-white/10">
          <div className="container mx-auto px-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white font-bold">
                C
              </div>
              <span className="text-xl font-black tracking-tighter text-white">
                CAREER<span className="text-brand-primary">VISION</span>
              </span>
            </div>
            <p className="text-gray-500 text-sm mb-8">
              {t('footer.copyright')}
            </p>
            <div className="flex justify-center gap-8 text-gray-400 text-sm">
              <a href="#" className="hover:text-brand-primary transition-colors">
                {t('footer.privacy')}
              </a>
              <a href="#" className="hover:text-brand-primary transition-colors">
                {t('footer.terms')}
              </a>
              <a href="#" className="hover:text-brand-primary transition-colors">
                {t('footer.contact')}
              </a>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}
