import { Job, GrowthReport } from '../types';

export type LoginCredentials = {
  username: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  user: string;
  is_verified: boolean;
  /** Present when backend is updated; required for OTP without shared session cookies. */
  user_id?: number;
};

export type SignupResponse = {
  message: string;
  user_id: number;
};

export type MeResponse = {
  username: string;
  profiles: unknown[];
  id?: number;
  is_verified?: boolean;
  phone_number?: string;
  role?: string;
};

const rawBase =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8000/api/v1';
const API_BASE = rawBase.replace(/\/+$/, '');

const ACCESS_KEY = 'kafaa_access_token';
const REFRESH_KEY = 'kafaa_refresh_token';

function getCookie(name: string) {
  let cookieValue = null;
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.substring(0, name.length + 1) === (name + '=')) {
      cookieValue = cookie.substring(name.length + 1);
      break;
    }
  }
  return cookieValue;
}

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setStoredTokens(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearStoredTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

function saveTokensFromBody(data: unknown) {
  if (!data || typeof data !== 'object') return;
  const d = data as Record<string, unknown>;
  if (typeof d.access === 'string' && typeof d.refresh === 'string') {
    setStoredTokens(d.access, d.refresh);
  }
}

async function refreshAccessToken(): Promise<boolean> {
  const refresh = getStoredRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_BASE}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
      credentials: 'include',
    });
    if (!res.ok) return false;
    const data = await res.json();
    saveTokensFromBody(data);
    return true;
  } catch {
    return false;
  }
}

async function request(path: string, options: RequestInit = {}, retried = false): Promise<any> {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const csrfToken = getCookie('csrftoken');
  if (csrfToken) {
    headers.set('X-CSRFToken', csrfToken);
  }

  const access = getStoredAccessToken();
  if (access) {
    headers.set('Authorization', `Bearer ${access}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && !retried && path !== '/token/refresh/') {
    const ok = await refreshAccessToken();
    if (ok) {
      return request(path, options, true);
    }
    clearStoredTokens();
  }

  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type');
  const data =
    contentType && contentType.includes('application/json')
      ? await response.json()
      : await response.text();

  if (!response.ok) {
    throw new Error(typeof data === 'object' ? JSON.stringify(data) : data || 'API Error');
  }

  saveTokensFromBody(data);
  return data;
}

export const api = {
  getCsrf: () => request('/csrf/'),

  signup: (data: Record<string, unknown>) =>
    request('/signup/', { method: 'POST', body: JSON.stringify(data) }) as Promise<SignupResponse>,

  login: (data: LoginCredentials) =>
    request('/login/', { method: 'POST', body: JSON.stringify(data) }) as Promise<LoginResponse>,

  verifyOtp: (otpCode: string, userId?: number) =>
    request('/verify-otp/', {
      method: 'POST',
      body: JSON.stringify(
        userId != null && Number.isFinite(userId)
          ? { otp: otpCode, user_id: userId }
          : { otp: otpCode },
      ),
    }) as Promise<{ message: string }>,

  logout: async () => {
    try {
      await request('/logout/', { method: 'POST' });
    } finally {
      clearStoredTokens();
    }
  },

  getMe: (): Promise<MeResponse> => request('/me/') as Promise<MeResponse>,

  uploadCV: (formData: FormData) => request('/cvs/upload/', { method: 'POST', body: formData }),
  parseCV: (id: number) => request(`/cvs/${id}/parse/`, { method: 'POST' }),
  downloadCV: (id: number) => request(`/cvs/${id}/download/`),

  listJobs: (): Promise<Job[]> => request('/jobs/') as Promise<Job[]>,

  createJob: (data: any) => request('/jobs/create/', { method: 'POST', body: JSON.stringify(data) }),

  applyJob: (data: { job: number; cv: number }) =>
    request('/jobs/apply/', { method: 'POST', body: JSON.stringify(data) }),

  rankCandidates: (jobId: number): Promise<any[]> =>
    request(`/jobs/${jobId}/rank-candidates/`) as Promise<any[]>,

  getGrowthReport: (applicationId: number): Promise<GrowthReport> =>
    request(`/jobs/applications/${applicationId}/growth-report/`) as Promise<GrowthReport>,
};
