import type { NavigateFunction } from 'react-router-dom';
import { api, type MeResponse } from '../services/api';
import type { User, UserRole } from '../types';

export const SESSION_VERIFY_USER_ID_KEY = 'kafaa_verify_user_id';

function apiRoleToUserRole(role: MeResponse['role']): UserRole {
  const u = role.toUpperCase();
  if (u === 'ADMIN') return 'ADMIN';
  if (u === 'RECRUITER') return 'RECRUITER';
  if (u === 'PENDING_RECRUITER') return 'PENDING_RECRUITER';
  if (u === 'REJECTED_RECRUITER') return 'REJECTED_RECRUITER';
  return 'CANDIDATE';
}

export function meResponseToUser(data: MeResponse): User {
  return {
    id: data.id,
    username: data.username,
    phone_number: data.phone_number || '',
    is_verified: data.is_verified,
    role: apiRoleToUserRole(data.role),
    userStatus: data.user_status,
    avatar_url: data.avatar ?? null,
    profiles: data.profiles,
  };
}

/** Candidates without a Profile row need the profile wizard first. */
export function candidateNeedsProfileOnboarding(user: User): boolean {
  return user.role === 'CANDIDATE' && (!user.profiles || user.profiles.length === 0);
}

/** After login or signup verification: admins/recruiters go to their app; candidates complete profile then CV. */
export async function navigateAfterAuth(navigate: NavigateFunction, user: User) {
  if (user.role === 'ADMIN') {
    navigate('/admin');
    return;
  }
  if (user.role === 'RECRUITER') {
    navigate('/recruiter');
    return;
  }
  if (user.role === 'PENDING_RECRUITER' || user.role === 'REJECTED_RECRUITER') {
    navigate('/recruiter');
    return;
  }
  if (candidateNeedsProfileOnboarding(user)) {
    navigate('/dashboard/onboarding');
    return;
  }
  try {
    const cvs = await api.getUserCV();
    navigate(cvs.length === 0 ? '/dashboard/cv' : '/dashboard');
  } catch {
    navigate('/dashboard');
  }
}
