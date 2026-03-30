import { Company, Job, GrowthReport, CV } from '../types';

export type LoginCredentials = {
  username: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  user: string;
  is_verified: boolean;
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

type BackendCompany = {
  id: number;
  name: string;
  about: string;
  company_field: string;
  is_blocked?: boolean;
};

const rawBase =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8000/api/v1';
const API_BASE = rawBase.replace(/\/+$/, '');

const ACCESS_KEY = 'kafaa_access_token';
const REFRESH_KEY = 'kafaa_refresh_token';

let csrfTokenCache: string | null = null;

function getCookie(name: string) {
  let cookieValue = null;
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.substring(name.length + 1) === (name + '=')) {
      cookieValue = cookie.substring(name.length + 1);
      break;
    }
  }
  return cookieValue;
}

function setCsrfFromResponseBody(data: unknown) {
  if (!data || typeof data !== 'object') return;
  const d = data as Record<string, unknown>;
  if (typeof d.csrfToken === 'string') {
    csrfTokenCache = d.csrfToken;
  }
}

async function fetchCsrfToken(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/csrf/`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) return;
    const data = await res.json();
    setCsrfFromResponseBody(data);
  } catch { /* ignore */ }
}

export function clearCsrfTokenCache() {
  csrfTokenCache = null;
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
  } catch { return false; }
}

async function request(
  path: string,
  options: RequestInit = {},
  retried = false,
  csrfRetried = false,
): Promise<any> {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const method = (options.method || 'GET').toUpperCase();
  const needsCsrfHeader = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  
  if (needsCsrfHeader && path !== '/csrf/') {
    await fetchCsrfToken();
  }

  const csrfToken = csrfTokenCache || getCookie('csrftoken');
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
    if (ok) return request(path, options, true, csrfRetried);
    clearStoredTokens();
  }

  if (response.status === 403 && needsCsrfHeader && !csrfRetried && path !== '/csrf/') {
    await fetchCsrfToken();
    return request(path, options, retried, true);
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
  setCsrfFromResponseBody(data);
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
      clearCsrfTokenCache();
    }
  },

  getMe: (): Promise<MeResponse> => request('/me/') as Promise<MeResponse>,

  // --- UPDATED CV SECTION ---
  
  // Fetches existing CVs from the database
  getUserCV: (): Promise<CV[]> => request('/cvs/') as Promise<CV[]>,

  uploadCV: (formData: FormData): Promise<CV> => 
    request('/cvs/upload/', { method: 'POST', body: formData }) as Promise<CV>,

  // Now returns Promise<CV> so we get the ID back after AI parsing
  parseCV: (id: number): Promise<CV> => 
    request(`/cvs/${id}/parse/`, { method: 'POST' }) as Promise<CV>,

  downloadCV: (id: number) => request(`/cvs/${id}/download/`),

  // --- JOBS & COMPANIES ---

  listJobs: (): Promise<Job[]> => request('/jobs/') as Promise<Job[]>,

  listCompanies: async (): Promise<Company[]> => {
    const data = await request('/companies/') as BackendCompany[];
    return data.map((company) => ({
      id: company.id,
      name: company.name,
      description: company.about,
      company_field: company.company_field,
    }));
  },

  createCompany: async (data: any): Promise<Company> => {
    const company = await request('/companies/', {
      method: 'POST',
      body: JSON.stringify(data),
    }) as BackendCompany;
    return {
      id: company.id,
      name: company.name,
      description: company.about,
      company_field: company.company_field,
    };
  },

  createJob: (data: any) => {
    const formattedData = {
      ...data,
      job_type: data.job_type.toLowerCase().replace('_', '-')
    };
    return request('/jobs/create/', { 
      method: 'POST', 
      body: JSON.stringify(formattedData) 
    });
  },

  applyJob: (data: { job: number; cv: number }) =>
    request('/jobs/apply/', { method: 'POST', body: JSON.stringify(data) }),

  rankCandidates: (jobId: number): Promise<any[]> =>
    request(`/jobs/${jobId}/rank-candidates/`) as Promise<any[]>,

  getGrowthReport: (applicationId: number): Promise<GrowthReport> =>
    request(`/jobs/applications/${applicationId}/growth-report/`) as Promise<GrowthReport>,
};