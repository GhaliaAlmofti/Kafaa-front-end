export type UserRole = 'ADMIN' | 'RECRUITER' | 'CANDIDATE';

export interface User {
  id: number;
  username: string;
  phone_number: string;
  is_verified: boolean;
  role?: UserRole;
  profiles?: unknown[];
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
  website?: string;
  is_blocked?: boolean;
}

export interface Job {
  id: number;
  title: string;
  owner: number;
  description: string;
  location: string;
  job_type: 'full-time' | 'part-time' | 'internship' | 'freelance';
  created_at: string;
  is_active?: boolean;
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
  applied_at: string;
  cv: number;
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
