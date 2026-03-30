export type UserRole = 'ADMIN' | 'RECRUITER' | 'CANDIDATE';

export interface User {
  id: number;
  username: string;
  phone_number: string;
  is_verified: boolean;
  role?: UserRole;
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
}

export interface Job {
  id: number;
  title: string;
  owner: number;
  description: string;
  location: string;
  job_type: 'full-time' | 'part-time' | 'internship' | 'freelance';
  created_at: string;
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
  cv: number;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  match_score: number;
  match_reason: string;
  applied_at: string;
}

export interface RankedApplication {
  id: number;
  applicant_name: string;
  cv_file: string;
  match_score: number;
  match_reason: string;
  status: string;
}

export interface GrowthReport {
  skill_gaps: string[];
  recommendations: string[];
}
