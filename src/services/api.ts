import {
  Company,
  Job,
  GrowthReport,
  CV,
  AdminJobRow,
  JobApplication,
  MyApplication,
} from '../types';

export type RankedCandidateRow = {
  id: number;
  applicant_name: string;
  match_score: number | null;
  match_reason: string | null;
  created_at: string;
  status: string;
  cv_file: string | null;
};

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
  id: number;
  username: string;
  phone_number: string;
  is_verified: boolean;
  role: 'admin' | 'recruiter' | 'candidate';
  profiles: unknown[];
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

let csrfTokenCache: string | null = null;

function getCookie(name: string) {
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + '=')) {
      return cookie.substring(name.length + 1);
    }
  }
  return null;
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
  } catch {
    /* ignore */
  }
}

export function clearCsrfTokenCache() {
  csrfTokenCache = null;
}

/** Clears legacy JWT keys if present (session auth is used instead). */
function clearLegacyJwtKeys() {
  localStorage.removeItem('kafaa_access_token');
  localStorage.removeItem('kafaa_refresh_token');
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

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

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
      clearLegacyJwtKeys();
      clearCsrfTokenCache();
    }
  },

  getMe: (): Promise<MeResponse> => request('/me/') as Promise<MeResponse>,

  getUserCV: (): Promise<CV[]> => request('/cvs/') as Promise<CV[]>,

  uploadCV: (formData: FormData): Promise<CV> =>
    request('/cvs/upload/', { method: 'POST', body: formData }) as Promise<CV>,

  parseCV: async (id: number): Promise<CV> => {
    const data = (await request(`/cvs/${id}/parse/`, {
      method: 'POST',
    })) as { cv?: CV; detail?: string };
    if (data && typeof data === 'object' && data.cv) {
      return data.cv;
    }
    return data as unknown as CV;
  },

  downloadCV: (id: number) => request(`/cvs/${id}/download/`),

  downloadCVBlob: async (id: number): Promise<Blob> => {
    const url = `${API_BASE}/cvs/${id}/download/`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) {
      throw new Error('Could not download CV');
    }
    return res.blob();
  },

  listJobs: (): Promise<Job[]> => request('/jobs/') as Promise<Job[]>,

  listMyApplications: (): Promise<MyApplication[]> =>
    request('/jobs/my-applications/') as Promise<MyApplication[]>,

  listMyJobs: (): Promise<Job[]> => request('/jobs/my/') as Promise<Job[]>,

  listCompanies: async (): Promise<Company[]> => {
    const data = (await request('/companies/')) as BackendCompany[];
    return data.map((company) => ({
      id: company.id,
      name: company.name,
      description: company.about,
      company_field: company.company_field,
      is_blocked: Boolean(company.is_blocked),
    }));
  },

  patchCompany: async (id: number, body: { is_blocked: boolean }): Promise<Company> => {
    const c = (await request(`/companies/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })) as BackendCompany;
    return {
      id: c.id,
      name: c.name,
      description: c.about,
      company_field: c.company_field,
      is_blocked: Boolean(c.is_blocked),
    };
  },

  createCompany: async (data: Record<string, unknown>): Promise<Company> => {
    const company = (await request('/companies/', {
      method: 'POST',
      body: JSON.stringify(data),
    })) as BackendCompany;
    return {
      id: company.id,
      name: company.name,
      description: company.about,
      company_field: company.company_field,
      is_blocked: Boolean(company.is_blocked),
    };
  },

  listAdminJobs: (): Promise<AdminJobRow[]> =>
    request('/jobs/admin-list/') as Promise<AdminJobRow[]>,

  listJobApplications: (jobId: number): Promise<JobApplication[]> =>
    request(`/jobs/${jobId}/applications/`) as Promise<JobApplication[]>,

  patchJobApplication: (applicationId: number, body: { status: JobApplication['status'] }) =>
    request(`/jobs/applications/${applicationId}/`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }) as Promise<JobApplication>,

  patchJob: (jobId: number, body: Partial<Pick<Job, 'is_active' | 'title' | 'description' | 'location'>>) =>
    request(`/jobs/${jobId}/`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }) as Promise<Job>,

  createJob: (data: Record<string, unknown>) => {
    const jobType = String((data as { job_type?: string }).job_type || '')
      .toLowerCase()
      .replace('_', '-');
    return request('/jobs/create/', {
      method: 'POST',
      body: JSON.stringify({ ...data, job_type: jobType }),
    });
  },

  applyJob: (data: { job: number; cv: number }) =>
    request('/jobs/apply/', { method: 'POST', body: JSON.stringify(data) }),

  rankCandidates: (jobId: number): Promise<RankedCandidateRow[]> =>
    request(`/jobs/${jobId}/rank-candidates/`) as Promise<RankedCandidateRow[]>,

  getGrowthReport: (applicationId: number): Promise<GrowthReport> =>
    request(`/jobs/applications/${applicationId}/growth-report/`) as Promise<GrowthReport>,
};
