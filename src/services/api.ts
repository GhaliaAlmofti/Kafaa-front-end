import { User, Job, CV, JobApplication, GrowthReport, Company } from '../types';

// Update this to your Django Backend URL
const API_BASE = 'http://localhost:8000/api/v1';

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

async function request(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(options.headers || {});

  // 1. Handle JSON Content-Type automatically
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // 2. Attach CSRF Token for security
  const csrfToken = getCookie('csrftoken');
  if (csrfToken) {
    headers.set('X-CSRFToken', csrfToken);
  }

  // 3. 'credentials: include' is MUST for Django Sessions to work across ports
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  if (response.status === 204) return null;

  // Handle empty or error responses gracefully
  const contentType = response.headers.get("content-type");
  const data = (contentType && contentType.includes("application/json"))
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(typeof data === 'object' ? JSON.stringify(data) : data || 'API Error');
  }
  return data;
}

export const api = {
  // --- Auth ---
  getCsrf: () => request('/csrf/'),

  // Updated: Ensure roles ('CANDIDATE' | 'RECRUITER') are passed in 'data'
  signup: (data: any) => request('/signup/', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: any) => request('/login/', { method: 'POST', body: JSON.stringify(data) }),

  verifyOtp: (otpCode: string) => request('/verify-otp/', {
    method: 'POST',
    body: JSON.stringify({ otp: otpCode })
  }),

  logout: () => request('/logout/', { method: 'POST' }),

  // This will now return { username, profiles, role }
  getMe: (): Promise<{ username: string, role: string, profiles: any[] }> => request('/me/'),

  // --- CVs ---
  uploadCV: (formData: FormData) => request('/cvs/upload/', { method: 'POST', body: formData }),
  parseCV: (id: number) => request(`/cvs/${id}/parse/`, { method: 'POST' }),
  downloadCV: (id: number) => request(`/cvs/${id}/download/`),

  // --- Jobs ---
  listJobs: (): Promise<Job[]> => request('/jobs/'),

  // Updated: Recruiter sends Job data + company_id
  createJob: (data: any) => request('/jobs/create/', { method: 'POST', body: JSON.stringify(data) }),

  applyJob: (data: { job: number; cv: number }) => request('/jobs/apply/', { method: 'POST', body: JSON.stringify(data) }),

  rankCandidates: (jobId: number): Promise<any[]> => request(`/jobs/${jobId}/rank-candidates/`),

  getGrowthReport: (applicationId: number): Promise<GrowthReport> => request(`/jobs/applications/${applicationId}/growth-report/`),
};