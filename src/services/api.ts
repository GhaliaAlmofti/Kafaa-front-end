import { User, Job, CV, JobApplication, GrowthReport, Company } from '../types';

const API_BASE = '/api/v1';

// Helper to get CSRF token from cookies
function getCookie(name: string) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

async function request(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(options.headers || {});
  
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const csrfToken = getCookie('csrftoken');
  if (csrfToken) {
    headers.set('X-CSRFToken', csrfToken);
  }

  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 204) return null;
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(JSON.stringify(data) || 'API Error');
  }
  return data;
}

export const api = {
  // Auth
  getCsrf: () => request('/csrf/'),
  signup: (data: any) => request('/signup/', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request('/login/', { method: 'POST', body: JSON.stringify(data) }),
  verifyOtp: (data: any) => request('/verify-otp/', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request('/logout/', { method: 'POST' }),
  getMe: () => request('/me/'),

  // CVs
  uploadCV: (formData: FormData) => request('/cvs/upload/', { method: 'POST', body: formData }),
  parseCV: (id: number) => request(`/cvs/${id}/parse/`, { method: 'POST' }),
  downloadCV: (id: number) => request(`/cvs/${id}/download/`),

  // Jobs
  listJobs: (): Promise<Job[]> => request('/jobs/'),
  createJob: (data: any) => request('/jobs/create/', { method: 'POST', body: JSON.stringify(data) }),
  applyJob: (data: { job: number; cv: number }) => request('/jobs/apply/', { method: 'POST', body: JSON.stringify(data) }),
  rankCandidates: (jobId: number): Promise<any[]> => request(`/jobs/${jobId}/rank-candidates/`),
  getGrowthReport: (applicationId: number): Promise<GrowthReport> => request(`/jobs/applications/${applicationId}/growth-report/`),
};
