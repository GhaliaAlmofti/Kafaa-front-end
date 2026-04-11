export type UserRole =
  | 'ADMIN'
  | 'RECRUITER'
  | 'PENDING_RECRUITER'
  | 'REJECTED_RECRUITER'
  | 'CANDIDATE';

/** Mirrors GET /me/ `user_status` (approval workflow and account kind). */
export type UserAccountStatus =
  | 'ADMIN'
  | 'CANDIDATE'
  | 'PENDING_RECRUITER'
  | 'ACTIVE'
  | 'REJECTED_RECRUITER';

export interface User {
  id: number;
  username: string;
  phone_number: string;
  is_verified: boolean;
  role?: UserRole;
  userStatus?: UserAccountStatus;
  /** Absolute URL from API (`avatar` on backend). */
  avatar_url?: string | null;
  profiles?: Profile[];
  /** From GET /me/ — candidate portfolio links. */
  portfolio_items?: PortfolioItem[];
}

/** Candidate portfolio link (GET/POST /api/v1/portfolio/). */
export interface PortfolioItem {
  id: number;
  title: string;
  url: string;
  description: string;
  sort_order: number;
  created_at: string;
}

export interface Profile {
  id: number;
  major: string;
  city: string;
  bio: string;
  /** Expected monthly salary range (candidate); mirrors job salary fields. */
  expected_salary_min?: number | null;
  expected_salary_max?: number | null;
  /** Days until available; 0 = immediate. */
  notice_period_days?: number | null;
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
  /** ISO datetime when approved (API `approved_at`). */
  approved_at?: string | null;
  /** Shown to recruiter after rejection (API `rejection_reason`). */
  rejection_reason?: string;
}

/** Recruiter account on a row from GET /companies/pending/. */
export interface PendingCompanyOwner {
  id: number;
  username: string;
  phone_number: string;
  email: string | null;
  is_verified: boolean;
  date_joined: string;
}

export type PendingCompanyRow = Company & { owner: PendingCompanyOwner };

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

export type KnockoutQuestion = { id: string; question: string };

export interface Job {
  id: number;
  title: string;
  /** Arabic job title when provided; searched together with `title` on the API. */
  title_ar?: string;
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
  /** Mandatory requirements; screening flags candidates who fail any. */
  knockout_criteria?: string[] | null;
  /** Mandatory Yes/No questions answered at apply time (any "no" => not qualified). */
  knockout_questions?: KnockoutQuestion[] | null;
  created_at: string;
  is_active?: boolean;
  company_name?: string | null;
  /** Absolute URL from API (`company_logo`). */
  company_logo?: string | null;
}

/** GET /jobs/:id/analytics/ — recruiter funnel metrics */
export interface JobRecruiterAnalytics {
  unique_viewers: number;
  apply_count: number;
  shortlisted_count: number;
  shortlist_action_count: number;
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

/** Row from GET /jobs/admin-applications/ (admin super-view index). */
export interface AdminGlobalApplicationRow extends JobApplication {
  job_title: string;
  company_name: string | null;
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
  /** True when mandatory (knockout) requirements are not met. */
  knockout_failed?: boolean | null;
  /** Which mandatory requirements were not evidenced. */
  knockout_reasons?: string[] | null;
  /** Self-reported Yes/No answers to `knockout_questions` (API keys match question ids). */
  knockout_answers?: Record<string, 'yes' | 'no'> | null;
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
  knockout_failed?: boolean | null;
  knockout_reasons?: string[] | null;
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

/** In-app notification (GET /notifications/). */
export type NotificationKind = 'message' | 'interview_invite' | 'system';

export interface NotificationSenderStub {
  id: number;
  username: string;
}

export type InterviewInvitationStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'cancelled';

export interface InterviewInvitation {
  id: number;
  job: number;
  job_application: number;
  job_title: string;
  proposed_start: string;
  proposed_end: string | null;
  duration_minutes: number | null;
  timezone: string;
  location: string;
  meeting_url: string;
  status: InterviewInvitationStatus;
  responded_at: string | null;
  response_note: string;
}

export interface InAppNotification {
  id: number;
  kind: NotificationKind;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  sender: NotificationSenderStub | null;
  read_at: string | null;
  created_at: string;
  interview_invitation: InterviewInvitation | null;
}
