import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LogOut, User, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserAvatarDisplay from './UserAvatarDisplay';

/**
 * User dropdown for app sidebars (dashboard areas). Menu opens upward so it stays on screen.
 */
const SidebarUserMenu = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
  };

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (!user) return null;

  return (
    <div ref={wrapRef} className="border-t border-gray-200 bg-gray-50/80 px-3 py-3 md:mt-auto">
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center gap-2.5 pl-1.5 pr-2 py-2 rounded-xl bg-white border border-gray-200 transition-colors hover:border-gray-300 text-left"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={t('nav.userMenu')}
        >
          <UserAvatarDisplay photoUrl={user.avatar_url} alt={user.username || t('nav.myAccount')} />
          <span className="font-bold text-gray-900 text-sm truncate flex-1 min-w-0">{user.username || t('nav.myAccount')}</span>
          {open ? (
            <ChevronUp size={16} className="text-gray-500 shrink-0" aria-hidden />
          ) : (
            <ChevronDown size={16} className="text-gray-500 shrink-0" aria-hidden />
          )}
        </button>

        {open && (
          <div
            className="absolute left-0 right-0 bottom-full mb-1 rounded-xl bg-white border border-gray-200 py-1.5 z-[60]"
            role="menu"
          >
            <Link
              to="/account"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-gray-900 hover:bg-gray-50 transition-colors"
            >
              <User size={18} className="shrink-0 text-brand-primary" aria-hidden />
              {t('nav.myAccount')}
            </Link>
            <div className="my-1 border-t border-gray-100" />
            <button
              type="button"
              role="menuitem"
              onClick={() => void handleLogout()}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors text-left"
            >
              <LogOut size={18} className="shrink-0" aria-hidden />
              {t('nav.logout')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarUserMenu;
