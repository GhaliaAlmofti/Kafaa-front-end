import type { NavigateFunction } from 'react-router-dom';
import type { MeResponse } from '../services/api';

/** Persists pending verification user id when session cookies are not shared cross-origin. */
export const SESSION_VERIFY_USER_ID_KEY = 'kafaa_verify_user_id';

/** Client-side role until backend exposes it on User. */
export function resolveDashboardRole(userData: MeResponse): 'ADMIN' | 'RECRUITER' | 'CANDIDATE' {
  if (userData.role === 'ADMIN' || userData.role === 'RECRUITER') {
    return userData.role;
  }
  if (userData.username === 'admin') return 'ADMIN';
  return 'CANDIDATE';
}

export function persistUserAndNavigate(navigate: NavigateFunction, userData: MeResponse) {
  const role = resolveDashboardRole(userData);
  const userWithRole = { ...userData, role };
  localStorage.setItem('user', JSON.stringify(userWithRole));
  if (role === 'ADMIN') navigate('/admin');
  else if (role === 'RECRUITER') navigate('/recruiter-dashboard');
  else navigate('/dashboard');
}
