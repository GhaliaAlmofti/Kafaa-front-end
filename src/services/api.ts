import {
  Company,
  Job,
  GrowthReport,
  CV,
  AdminJobRow,
  JobApplication,
  MyApplication,
  Profile,
} from '../types';
import { formatApiErrorBody } from '../utils/apiErrorMessage';

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
  avatar?: string | null;
  profiles: Profile[];
};

type BackendCompany = {
  id: number;
  name: string;
  about: string;
  company_field: string;
  is_blocked?: boolean;
  logo?: string | null;
  website?: string;
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
};

function mapCompany(company: BackendCompany): Company {
  return {
    id: company.id,
    name: company.name,
    description: company.about,
    company_field: company.company_field,
    is_blocked: Boolean(company.is_blocked),
    logo_url: company.logo ?? null,
    website: company.website || undefined,
    linkedin_url: company.linkedin_url || undefined,
    twitter_url: company.twitter_url || undefined,
    facebook_url: company.facebook_url || undefined,
  };
}

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
    const message =
      typeof data === 'object' && data !== null
        ? formatApiErrorBody(data)
        : formatApiErrorBody(typeof data === 'string' ? data : null, 'Request failed');
    throw new Error(message);
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

  patchMe: (
    body: Partial<{ username: string; phone_number: string }> & { avatar?: File | null },
  ): Promise<MeResponse> => {
    const avatarFile = body.avatar;
    if (avatarFile instanceof File) {
      const fd = new FormData();
      if (body.username != null) fd.append('username', String(body.username).trim());
      if (body.phone_number != null) fd.append('phone_number', String(body.phone_number).trim());
      fd.append('avatar', avatarFile);
      return request('/me/', { method: 'PATCH', body: fd }) as Promise<MeResponse>;
    }
    const { avatar: _omit, ...rest } = body;
    return request('/me/', { method: 'PATCH', body: JSON.stringify(rest) }) as Promise<MeResponse>;
  },

  patchProfile: (
    id: number,
    body: Partial<Pick<Profile, 'major' | 'city' | 'bio'>>,
  ): Promise<Profile> =>
    request(`/profile/${id}/`, { method: 'PATCH', body: JSON.stringify(body) }) as Promise<Profile>,

  getUserCV: (): Promise<CV[]> => request('/cvs/') as Promise<CV[]>,

  uploadCV: (formData: FormData): Promise<CV> =>
    request('/cvs/upload/', { method: 'POST', body: formData }) as Promise<CV>,

  /** Replace file for an existing CV (same user); re-runs analysis. */
  replaceCV: (id: number, file: File): Promise<CV> => {
    const fd = new FormData();
    fd.append('file', file);
    return request(`/cvs/${id}/`, { method: 'PATCH', body: fd }) as Promise<CV>;
  },

  /** Rename CV (JSON PATCH). */
  patchCVDisplayName: (id: number, display_name: string): Promise<CV> =>
    request(`/cvs/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ display_name }),
    }) as Promise<CV>,

  /** Delete CV if it has no job applications (backend enforces). */
  deleteCV: (id: number): Promise<void> => request(`/cvs/${id}/`, { method: 'DELETE' }) as Promise<void>,

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
    return data.map(mapCompany);
  },

  getMyCompany: async (): Promise<Company> => {
    const c = (await request('/companies/me/')) as BackendCompany;
    return mapCompany(c);
  },

  patchMyCompany: async (
    body: Partial<{
      name: string;
      about: string;
      company_field: string;
      website: string;
      linkedin_url: string;
      twitter_url: string;
      facebook_url: string;
    }> & { logo?: File | null },
  ): Promise<Company> => {
    const logoFile = body.logo;
    const hasLogo = logoFile instanceof File;
    if (hasLogo) {
      const fd = new FormData();
      (Object.entries(body) as [string, unknown][]).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (key === 'logo') {
          if (value instanceof File) fd.append('logo', value);
          return;
        }
        fd.append(key, String(value));
      });
      const c = (await request('/companies/me/', { method: 'PATCH', body: fd })) as BackendCompany;
      return mapCompany(c);
    }
    const { logo: _omit, ...rest } = body;
    const c = (await request('/companies/me/', {
      method: 'PATCH',
      body: JSON.stringify(rest),
    })) as BackendCompany;
    return mapCompany(c);
  },

  patchCompany: async (id: number, body: { is_blocked: boolean }): Promise<Company> => {
    const c = (await request(`/companies/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })) as BackendCompany;
    return mapCompany(c);
  },

  createCompany: async (
    data: Record<string, unknown> & { logo?: File | null },
  ): Promise<Company> => {
    const { logo, ...fields } = data;
    if (logo instanceof File) {
      const fd = new FormData();
      Object.entries(fields).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        fd.append(k, String(v));
      });
      fd.append('logo', logo);
      const company = (await request('/companies/', { method: 'POST', body: fd })) as BackendCompany;
      return mapCompany(company);
    }
    const company = (await request('/companies/', {
      method: 'POST',
      body: JSON.stringify(fields),
    })) as BackendCompany;
    return mapCompany(company);
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

  getGrowthReport: (applicationId: number): Promise<GrowthReport> =>
    request(`/jobs/applications/${applicationId}/growth-report/`) as Promise<GrowthReport>,
};
