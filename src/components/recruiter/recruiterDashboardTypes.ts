import type { Job, JobApplication } from '../../types';

export type JobListingStatus = 'open' | 'on_hold' | 'closed';

export type ApplicantStage = 'new' | 'screening' | 'interview' | 'offer' | 'hired';

export type JobSortKey = 'title' | 'department' | 'location' | 'posted' | 'applicants' | 'status';

export type SortDirection = 'asc' | 'desc';

export type RecruiterJobRow = Job & {
  applicantCount: number;
};

export type StagePatchPlan = {
  apiStatus: JobApplication['status'];
  pipelineKey: ApplicantStage | null;
};

export const PIPELINE_STORAGE_KEY = 'kafaa_recruiter_pipeline_v1';

export const JOB_HOLD_STORAGE_KEY = 'kafaa_recruiter_job_hold_v1';

export function readHoldJobIds(): Set<number> {
  try {
    const raw = sessionStorage.getItem(JOB_HOLD_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr.filter((n): n is number => typeof n === 'number' && Number.isFinite(n)));
  } catch {
    return new Set();
  }
}

export function writeHoldJobIds(ids: Set<number>): void {
  try {
    sessionStorage.setItem(JOB_HOLD_STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore quota */
  }
}

export function readPipelineMap(): Record<string, ApplicantStage> {
  try {
    const raw = sessionStorage.getItem(PIPELINE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    const out: Record<string, ApplicantStage> = {};
    const allowed: ApplicantStage[] = ['interview', 'hired'];
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (allowed.includes(v as ApplicantStage)) {
        out[k] = v as ApplicantStage;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function writePipelineMap(map: Record<string, ApplicantStage>): void {
  try {
    sessionStorage.setItem(PIPELINE_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function getJobListingStatus(
  job: Pick<Job, 'id' | 'is_active'>,
  holdIds: ReadonlySet<number>,
): JobListingStatus {
  if (job.is_active === false) return 'closed';
  if (holdIds.has(job.id)) return 'on_hold';
  return 'open';
}

export function stageToApiStatus(stage: ApplicantStage): JobApplication['status'] {
  switch (stage) {
    case 'new':
      return 'pending';
    case 'screening':
    case 'interview':
      return 'reviewed';
    case 'offer':
    case 'hired':
      return 'accepted';
    default:
      return 'pending';
  }
}

export function planStagePatch(_appId: number, target: ApplicantStage): StagePatchPlan {
  const apiStatus = stageToApiStatus(target);
  if (apiStatus === 'reviewed') {
    const pipelineKey = target === 'interview' ? 'interview' : null;
    return { apiStatus, pipelineKey };
  }
  if (apiStatus === 'accepted') {
    const pipelineKey = target === 'hired' ? 'hired' : null;
    return { apiStatus, pipelineKey };
  }
  return { apiStatus, pipelineKey: null };
}

export function deriveApplicantStage(
  app: JobApplication,
  pipelineMap: Readonly<Record<string, ApplicantStage>>,
): ApplicantStage | 'rejected' {
  if (app.status === 'rejected') return 'rejected';
  if (app.status === 'pending') return 'new';
  if (app.status === 'reviewed') {
    return pipelineMap[String(app.id)] === 'interview' ? 'interview' : 'screening';
  }
  if (app.status === 'accepted') {
    return pipelineMap[String(app.id)] === 'hired' ? 'hired' : 'offer';
  }
  return 'new';
}

export function mergePipelineMap(
  prev: Record<string, ApplicantStage>,
  appId: number,
  key: ApplicantStage | null,
): Record<string, ApplicantStage> {
  const id = String(appId);
  const next = { ...prev };
  if (key === 'interview') {
    next[id] = 'interview';
  } else if (key === 'hired') {
    next[id] = 'hired';
  } else {
    delete next[id];
  }
  return next;
}

export function sortJobRows(
  rows: RecruiterJobRow[],
  key: JobSortKey,
  dir: SortDirection,
  holdIds: ReadonlySet<number>,
  departmentLabel: string,
): RecruiterJobRow[] {
  const mul = dir === 'asc' ? 1 : -1;
  const dep = (_j: RecruiterJobRow) => departmentLabel || '—';
  const statusOrder = (j: RecruiterJobRow) => {
    const s = getJobListingStatus(j, holdIds);
    return s === 'open' ? 0 : s === 'on_hold' ? 1 : 2;
  };

  return [...rows].sort((a, b) => {
    let cmp = 0;
    switch (key) {
      case 'title':
        cmp = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
        break;
      case 'department':
        cmp = dep(a).localeCompare(dep(b), undefined, { sensitivity: 'base' });
        break;
      case 'location':
        cmp = a.location.localeCompare(b.location, undefined, { sensitivity: 'base' });
        break;
      case 'posted':
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case 'applicants':
        cmp = a.applicantCount - b.applicantCount;
        break;
      case 'status':
        cmp = statusOrder(a) - statusOrder(b);
        if (cmp === 0) {
          cmp = a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
        }
        break;
      default:
        cmp = 0;
    }
    return cmp * mul;
  });
}

export function filterJobs(
  rows: RecruiterJobRow[],
  query: string,
  statusFilter: JobListingStatus | 'all',
  holdIds: ReadonlySet<number>,
): RecruiterJobRow[] {
  const q = query.trim().toLowerCase();
  return rows.filter((j) => {
    const listing = getJobListingStatus(j, holdIds);
    if (statusFilter !== 'all' && listing !== statusFilter) return false;
    if (!q) return true;
    const hay = `${j.title} ${j.location} ${j.job_type}`.toLowerCase();
    return hay.includes(q);
  });
}

export function filterApplicants(apps: JobApplication[], query: string): JobApplication[] {
  const q = query.trim().toLowerCase();
  if (!q) return apps;
  return apps.filter((a) => (a.applicant_name || '').toLowerCase().includes(q));
}

export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export function totalPages(length: number, pageSize: number): number {
  if (pageSize <= 0) return 1;
  return Math.max(1, Math.ceil(length / pageSize));
}
