// src/utils/authRedirect.ts
import type { NavigateFunction } from 'react-router-dom';
import type { MeResponse } from '../services/api';

export const SESSION_VERIFY_USER_ID_KEY = 'kafaa_verify_user_id';

export function resolveDashboardRole(userData: MeResponse): 'ADMIN' | 'RECRUITER' | 'CANDIDATE' {
  // Logic: If username is exactly 'admin', they are the Boss.
  // Otherwise, they are a Candidate.
  if (userData.username?.toLowerCase() === 'admin') {
    return 'ADMIN';
  }

  // You can add other specific usernames here if you have recruiters
  // if (userData.username === 'hr_manager') return 'RECRUITER';

  return 'CANDIDATE';
}

export function persistUserAndNavigate(navigate: NavigateFunction, userData: MeResponse) {
  const role = resolveDashboardRole(userData);
  const userWithRole = { ...userData, role };

  // Save the "fake" role to localStorage so the rest of the app thinks it's real
  localStorage.setItem('user', JSON.stringify(userWithRole));

  if (role === 'ADMIN') {
    navigate('/admin');
  } else {
    navigate('/dashboard'); // All non-admin users go here
  }
}