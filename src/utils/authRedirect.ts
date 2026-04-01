import type { NavigateFunction } from 'react-router-dom';
import type { MeResponse } from '../services/api';
import type { User, UserRole } from '../types';

export const SESSION_VERIFY_USER_ID_KEY = 'kafaa_verify_user_id';

function apiRoleToUserRole(role: MeResponse['role']): UserRole {
  const u = role.toUpperCase();
  if (u === 'ADMIN') return 'ADMIN';
  if (u === 'RECRUITER') return 'RECRUITER';
  return 'CANDIDATE';
}

export function meResponseToUser(data: MeResponse): User {
  return {
    id: data.id,
    username: data.username,
    phone_number: data.phone_number || '',
    is_verified: data.is_verified,
    role: apiRoleToUserRole(data.role),
    profiles: data.profiles,
  };
}

export function navigateAfterAuth(navigate: NavigateFunction, user: User) {
  if (user.role === 'ADMIN') {
    navigate('/admin');
    return;
  }
  if (user.role === 'RECRUITER') {
    navigate('/recruiter');
    return;
  }
  navigate('/dashboard');
}
