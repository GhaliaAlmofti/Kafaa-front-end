import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, User, Menu, X, ChevronDown, ChevronUp, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserAvatarDisplay from './UserAvatarDisplay';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const dashboardPath =
    user?.role === 'ADMIN' ? '/admin' : user?.role === 'RECRUITER' ? '/recruiter' : '/dashboard';

  const handleLogout = async () => {
    setIsOpen(false);
    setUserMenuOpen(false);
    await logout();
  };

  useEffect(() => {
    if (!userMenuOpen) return;

    const onDocMouseDown = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };

    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [userMenuOpen]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white font-bold text-xl">
            C
          </div>
          <span className="text-2xl font-black tracking-tighter text-brand-black">
            CAREER<span className="text-brand-primary">VISION</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-gray-600 hover:text-brand-primary font-medium transition-colors">
            Home
          </Link>
          <Link to="/jobs" className="text-gray-600 hover:text-brand-primary font-medium transition-colors">
            Browse Jobs
          </Link>

          {user ? (
            <>
              <Link
                to={dashboardPath}
                className="inline-flex items-center gap-2 font-semibold text-brand-primary hover:text-brand-primary-deep transition-colors"
              >
                <LayoutDashboard size={18} aria-hidden />
                Dashboard
              </Link>
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full bg-white border border-gray-100 transition-colors hover:border-gray-300"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="menu"
                  aria-label="User menu"
                >
                  <UserAvatarDisplay
                    photoUrl={user.avatar_url}
                    alt={user.username || 'Account'}
                  />
                  <span className="font-bold text-gray-900 text-sm max-w-[140px] truncate">
                    {user.username || 'Account'}
                  </span>
                  {userMenuOpen ? (
                    <ChevronUp size={16} className="text-gray-500 shrink-0" aria-hidden />
                  ) : (
                    <ChevronDown size={16} className="text-gray-500 shrink-0" aria-hidden />
                  )}
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 min-w-[220px] rounded-xl bg-white border border-gray-100 py-2 z-50"
                    role="menu"
                  >
                    <Link
                      to="/account"
                      role="menuitem"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left font-bold text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      <User size={18} className="shrink-0 text-brand-primary" aria-hidden />
                      My account
                    </Link>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void handleLogout()}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left font-bold text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={18} className="shrink-0" aria-hidden />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-gray-600 font-medium hover:text-brand-primary">
                Login
              </Link>
              <Link to="/signup" className="btn-primary">
                Sign Up
              </Link>
            </div>
          )}
        </div>

        <button type="button" className="md:hidden text-brand-black" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 p-6 space-y-4">
          <Link to="/" onClick={() => setIsOpen(false)} className="block text-gray-600 font-medium">
            Home
          </Link>
          <Link to="/jobs" onClick={() => setIsOpen(false)} className="block text-gray-600 font-medium">
            Browse Jobs
          </Link>
          {user ? (
            <>
              <Link
                to={dashboardPath}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 font-bold text-brand-primary"
              >
                <LayoutDashboard size={18} aria-hidden />
                Dashboard
              </Link>
              <Link
                to="/account"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 text-gray-900 font-bold"
              >
                <User size={18} className="text-brand-primary shrink-0" aria-hidden />
                My account
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="flex items-center gap-2 text-red-600 font-bold text-left w-full"
              >
                <LogOut size={18} aria-hidden />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setIsOpen(false)} className="block text-gray-600 font-medium">
                Login
              </Link>
              <Link to="/signup" onClick={() => setIsOpen(false)} className="block btn-primary text-center">
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
