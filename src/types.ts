export type UserRole = 'ADMIN' | 'RECRUITER' | 'PENDING_RECRUITER' | 'CANDIDATE';

export interface User {
  id: number;
  username: string;
  phone_number: string;
  is_verified: boolean;
  role?: UserRole;
  /** Absolute URL from API (`avatar` on backend). */
  avatar_url?: string | null;
  profiles?: Profile[];
}

export interface Profile {
  id: number;
  major: string;
  city: string;
  bio: string;
}

export interface Company {
  id: number;
  name: string;
  description: string;
  company_field?: string;
  /** Absolute URL from API (`logo` on backend). */
  logo_url?: string | null;
  /** Optional alternate mark (`secondary_logo` on backend). */
  secondary_logo_url?: string | null;
  /** Place link or embed URL for Google Maps. */
  google_maps_url?: string;
  website?: string;
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  is_blocked?: boolean;
  /** False until an admin approves the recruiter organization. */
  is_approved?: boolean;
}

/** Backend `seniority` (empty string when not set). */
export type JobSeniority =
  | ''
  | 'intern'
  | 'junior'
  | 'mid'
  | 'senior'
  | 'lead'
  | 'executive';

/** Backend `work_mode` (empty when not set). */
export type JobWorkMode = '' | 'remote' | 'hybrid' | 'on_site';

export interface Job {
  id: number;
  title: string;
  owner: number;
  description: string;
  location: string;
  job_type: 'full-time' | 'part-time' | 'internship' | 'freelance';
  /** Monthly salary lower bound when set (recruiter-provided). */
  salary_min?: number | null;
  /** Monthly salary upper bound when set. */
  salary_max?: number | null;
  seniority?: JobSeniority | string | null;
  work_mode?: JobWorkMode | string | null;
  created_at: string;
  is_active?: boolean;
  company_name?: string | null;
  /** Absolute URL from API (`company_logo`). */
  company_logo?: string | null;
}

/** Admin job list row with aggregates (from GET /jobs/admin-list/) */
export interface AdminJobRow extends Job {
  application_count: number;
  company_name: string | null;
  owner_username: string;
}

export interface CV {
  id: number;
  user: number;
  file: string;
  /** User-visible label (defaults to uploaded file name; editable). */
  display_name: string;
  parsed_data: any;
  is_parsed: boolean;
  uploaded_at: string;
}

export interface JobApplication {
  id: number;
  job: number;
  applicant: number;
  applicant_name?: string;
  cv: number;
  cv_is_parsed?: boolean;
  cv_file?: string | null;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  match_score: number | null;
  match_reason: string | null;
  /** Explainability: CV-aligned skills from ranking. */
  match_matched_skills?: string[] | null;
  /** Explainability: gaps vs job requirements. */
  match_missing_skills?: string[] | null;
  applied_at: string;
}

/** Current user's applications (GET /jobs/my-applications/) */
export interface MyApplication {
  id: number;
  job: number;
  job_title: string;
  job_location: string;
  job_type: string;
  company_name: string | null;
  status: JobApplication['status'];
  match_score: number | null;
  match_reason: string | null;
  match_matched_skills?: string[] | null;
  match_missing_skills?: string[] | null;
  applied_at: string;
  cv: number;
  cv_is_parsed?: boolean;
}

export interface RankedApplication {
  id: number;
  applicant_name: string;
  cv_file: string | null;
  match_score: number | null;
  match_reason: string | null;
  status: string;
  created_at?: string;
}

export interface GrowthReport {
  skill_gaps: string[];
  recommendations: string[];
  suggested_resources?: string[];
}
