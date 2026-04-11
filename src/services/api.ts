import {
  Company,
  Job,
  GrowthReport,
  CV,
  AdminJobRow,
  AdminGlobalApplicationRow,
  JobApplication,
  JobRecruiterAnalytics,
  MyApplication,
  Profile,
  PortfolioItem,
  PendingCompanyRow,
  PendingCompanyOwner,
  InAppNotification,
  InterviewInvitation,
  UserAccountStatus,
} from '../types';
import { formatApiErrorBody } from '../utils/apiErrorMessage';

/** GET /jobs/ optional filters (aligned with `jobs.query.filter_public_jobs`). */
export type JobListQueryParams = {
  search?: string;
  q?: string;
  job_type?: string;
  location?: string;
  seniority?: string;
  work_mode?: string;
  salary_min?: string;
  salary_max?: string;
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
  role: 'admin' | 'recruiter' | 'pending_recruiter' | 'rejected_recruiter' | 'candidate';
  /** Explicit lifecycle state; e.g. PENDING_RECRUITER until an admin approves the company (then ACTIVE). */
  user_status: UserAccountStatus;
  avatar?: string | null;
  profiles: Profile[];
  portfolio_items?: PortfolioItem[];
};

export type CompanyApprovalWorkflow = {
  owner_user_id: number;
  previous_user_status: string;
  current_user_status: string;
  owner_role: string;
};

export type CompanyWithApproval = Company & { approval?: CompanyApprovalWorkflow };

type BackendCompany = {
  id: number;
  name: string;
  about: string;
  company_field: string;
  is_blocked?: boolean;
  is_approved?: boolean;
  approved_at?: string | null;
  rejection_reason?: string;
  logo?: string | null;
  secondary_logo?: string | null;
  google_maps_url?: string;
  website?: string;
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
};

type BackendPendingCompany = BackendCompany & { owner: PendingCompanyOwner };

function mapCompany(company: BackendCompany): Company {
  return {
    id: company.id,
    name: company.name,
    description: company.about,
    company_field: company.company_field,
    is_blocked: Boolean(company.is_blocked),
    is_approved: Boolean(company.is_approved),
    approved_at: company.approved_at ?? null,
    rejection_reason: company.rejection_reason || undefined,
    logo_url: company.logo ?? null,
    secondary_logo_url: company.secondary_logo ?? null,
    google_maps_url: company.google_maps_url || undefined,
    website: company.website || undefined,
    linkedin_url: company.linkedin_url || undefined,
    twitter_url: company.twitter_url || undefined,
    facebook_url: company.facebook_url || undefined,
  };
}

function mapPendingCompany(company: BackendPendingCompany): PendingCompanyRow {
  return { ...mapCompany(company), owner: company.owner };
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

const VISITOR_KEY = 'kafaa_visitor_id';

/** Stable id for anonymous analytics (job impressions). */
export function getOrCreateAnonymousVisitorId(): string {
  try {
    let v = localStorage.getItem(VISITOR_KEY);
    if (!v) {
      v =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(VISITOR_KEY, v);
    }
    return v;
  } catch {
    return `anon-${Date.now()}`;
  }
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

  recruiterSignup: (data: Record<string, unknown>) =>
    request('/recruiter-signup/', { method: 'POST', body: JSON.stringify(data) }) as Promise<SignupResponse>,

  createProfile: (body: Pick<Profile, 'major' | 'city' | 'bio'>): Promise<Profile> =>
    request('/profile/', { method: 'POST', body: JSON.stringify(body) }) as Promise<Profile>,

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

  /** Query params mirror GET /api/v1/jobs/ server filters (search, job_type, location, etc.). */
  listJobs: (params?: JobListQueryParams): Promise<Job[]> => {
    const qs = new URLSearchParams();
    if (params) {
      (Object.entries(params) as [keyof JobListQueryParams, string | undefined][]).forEach(
        ([k, v]) => {
          if (v !== undefined && String(v).trim() !== '') qs.set(k, String(v).trim());
        },
      );
    }
    const q = qs.toString();
    return request(q ? `/jobs/?${q}` : '/jobs/') as Promise<Job[]>;
  },

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
      google_maps_url: string;
      website: string;
      linkedin_url: string;
      twitter_url: string;
      facebook_url: string;
    }> & { logo?: File | null; secondary_logo?: File | null },
  ): Promise<Company> => {
    const logoFile = body.logo;
    const secondaryLogoFile = body.secondary_logo;
    const hasFiles = logoFile instanceof File || secondaryLogoFile instanceof File;
    if (hasFiles) {
      const fd = new FormData();
      (Object.entries(body) as [string, unknown][]).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (key === 'logo') {
          if (value instanceof File) fd.append('logo', value);
          return;
        }
        if (key === 'secondary_logo') {
          if (value instanceof File) fd.append('secondary_logo', value);
          return;
        }
        fd.append(key, String(value));
      });
      const c = (await request('/companies/me/', { method: 'PATCH', body: fd })) as BackendCompany;
      return mapCompany(c);
    }
    const { logo: _omitLogo, secondary_logo: _omitSecondary, ...rest } = body;
    const c = (await request('/companies/me/', {
      method: 'PATCH',
      body: JSON.stringify(rest),
    })) as BackendCompany;
    return mapCompany(c);
  },

  patchCompany: async (
    id: number,
    body: { is_blocked?: boolean; is_approved?: boolean; rejection_reason?: string },
  ): Promise<Company> => {
    const c = (await request(`/companies/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })) as BackendCompany;
    return mapCompany(c);
  },

  listPendingCompanies: async (includeUnverified?: boolean): Promise<PendingCompanyRow[]> => {
    const path =
      includeUnverified === true
        ? '/companies/pending/?include_unverified=1'
        : '/companies/pending/';
    const data = (await request(path)) as BackendPendingCompany[];
    return data.map(mapPendingCompany);
  },

  approveCompany: async (id: number): Promise<CompanyWithApproval> => {
    const raw = (await request(`/companies/${id}/approve/`, {
      method: 'POST',
      body: JSON.stringify({}),
    })) as BackendCompany & { approval?: CompanyApprovalWorkflow };
    return { ...mapCompany(raw), approval: raw.approval };
  },

  rejectCompany: async (id: number, reason?: string): Promise<Company> => {
    const c = (await request(`/companies/${id}/reject/`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason?.trim() ?? '' }),
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

  /** All applications across companies (admin super-view). */
  listAdminApplications: (): Promise<AdminGlobalApplicationRow[]> =>
    request('/jobs/admin-applications/') as Promise<AdminGlobalApplicationRow[]>,

  listJobApplications: (jobId: number): Promise<JobApplication[]> =>
    request(`/jobs/${jobId}/applications/`) as Promise<JobApplication[]>,

  patchJobApplication: (applicationId: number, body: { status: JobApplication['status'] }) =>
    request(`/jobs/applications/${applicationId}/`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }) as Promise<JobApplication>,

  patchJob: (
    jobId: number,
    body: Partial<
      Pick<
        Job,
        | 'is_active'
        | 'title'
        | 'description'
        | 'location'
        | 'salary_min'
        | 'salary_max'
        | 'seniority'
        | 'work_mode'
        | 'knockout_criteria'
        | 'knockout_questions'
      >
    >,
  ) =>
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

  applyJob: (data: {
    job: number;
    cv: number;
    /** Required when the job has `knockout_questions`: map question id → yes | no */
    knockout_answers?: Record<string, 'yes' | 'no'>;
  }) => request('/jobs/apply/', { method: 'POST', body: JSON.stringify(data) }),

  /** Candidate job view (funnel). Authenticated users omit `visitorIdIfAnonymous`. */
  recordJobImpression: (jobId: number, visitorIdIfAnonymous?: string) =>
    request(`/jobs/${jobId}/impression/`, {
      method: 'POST',
      body:
        visitorIdIfAnonymous != null
          ? JSON.stringify({ visitor_id: visitorIdIfAnonymous })
          : JSON.stringify({}),
    }) as Promise<{ ok: boolean }>,

  getJobRecruiterAnalytics: (jobId: number) =>
    request(`/jobs/${jobId}/analytics/`) as Promise<JobRecruiterAnalytics>,

  getGrowthReport: (applicationId: number): Promise<GrowthReport> =>
    request(`/jobs/applications/${applicationId}/growth-report/`) as Promise<GrowthReport>,

  /** Inbox or sent folder (`box` query). */
  listNotifications: (box?: 'inbox' | 'sent'): Promise<InAppNotification[]> => {
    const q = box === 'sent' ? '?box=sent' : '';
    return request(`/notifications/${q}`) as Promise<InAppNotification[]>;
  },

  getUnreadNotificationCount: (): Promise<{ unread_count: number }> =>
    request('/notifications/unread-count/') as Promise<{ unread_count: number }>,

  markNotificationRead: (id: number, read = true): Promise<InAppNotification> =>
    request(`/notifications/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ read }),
    }) as Promise<InAppNotification>,

  sendApplicationMessage: (body: {
    job_application_id: number;
    title: string;
    body: string;
  }): Promise<InAppNotification> =>
    request('/notifications/messages/', {
      method: 'POST',
      body: JSON.stringify(body),
    }) as Promise<InAppNotification>,

  createInterviewInvitation: (body: {
    job_application_id: number;
    proposed_start: string;
    proposed_end?: string | null;
    duration_minutes?: number | null;
    timezone?: string;
    location?: string;
    meeting_url?: string;
    title?: string;
    body?: string;
  }): Promise<InAppNotification & { interview_invitation: InterviewInvitation }> =>
    request('/interview-invitations/', {
      method: 'POST',
      body: JSON.stringify(body),
    }) as Promise<InAppNotification & { interview_invitation: InterviewInvitation }>,

  getInterviewInvitation: (
    id: number,
  ): Promise<InterviewInvitation & { notification: InAppNotification }> =>
    request(`/interview-invitations/${id}/`) as Promise<
      InterviewInvitation & { notification: InAppNotification }
    >,

  respondToInterviewInvitation: (
    id: number,
    body: { status: 'accepted' | 'declined'; response_note?: string },
  ): Promise<InterviewInvitation> =>
    request(`/interview-invitations/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }) as Promise<InterviewInvitation>,
};
