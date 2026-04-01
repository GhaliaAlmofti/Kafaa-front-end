import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, User, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  const dashboardPath =
    user?.role === 'ADMIN' ? '/admin' : user?.role === 'RECRUITER' ? '/recruiter' : '/dashboard';

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center text-white font-bold text-xl">
            C
          </div>
          <span className="text-2xl font-black tracking-tighter text-brand-black">
            CAREER<span className="text-brand-green">VISION</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-gray-600 hover:text-brand-green font-medium transition-colors">
            Home
          </Link>
          <Link to="/jobs" className="text-gray-600 hover:text-brand-green font-medium transition-colors">
            Browse Jobs
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              <Link
                to={dashboardPath}
                className="flex items-center gap-2 text-brand-black font-bold hover:text-brand-green transition-colors"
              >
                <User size={20} className="text-brand-green" />
                {user.username || 'My profile'}
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-gray-600 font-medium hover:text-brand-green">
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
              <Link to={dashboardPath} onClick={() => setIsOpen(false)} className="block font-bold">
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="block text-red-500 font-medium text-left w-full"
              >
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
