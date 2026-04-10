import type { Job } from '../types';

function parseSalaryInput(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = parseInt(t, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** User-requested salary band from sidebar inputs. */
export function parseSalaryFilterBand(
  minStr: string,
  maxStr: string,
): { lo: number; hi: number } | null {
  const a = parseSalaryInput(minStr);
  const b = parseSalaryInput(maxStr);
  if (a == null && b == null) return null;
  let lo = a ?? 0;
  let hi = b ?? Number.MAX_SAFE_INTEGER;
  if (lo > hi) {
    const t = lo;
    lo = hi;
    hi = t;
  }
  return { lo, hi };
}

function jobSalaryBand(job: Job): { lo: number; hi: number } | null {
  const a = job.salary_min ?? null;
  const b = job.salary_max ?? null;
  if (a == null && b == null) return null;
  if (a != null && b != null) {
    return { lo: Math.min(a, b), hi: Math.max(a, b) };
  }
  if (a != null) return { lo: a, hi: Number.MAX_SAFE_INTEGER };
  return { lo: 0, hi: b as number };
}

function bandsOverlap(
  r1: { lo: number; hi: number },
  r2: { lo: number; hi: number },
): boolean {
  return r1.hi >= r2.lo && r1.lo <= r2.hi;
}

export function jobMatchesSalaryFilter(
  job: Job,
  minStr: string,
  maxStr: string,
): boolean {
  const userBand = parseSalaryFilterBand(minStr, maxStr);
  if (!userBand) return true;
  const jobBand = jobSalaryBand(job);
  if (!jobBand) return true;
  return bandsOverlap(jobBand, userBand);
}

export function jobMatchesSeniorityFilter(job: Job, seniority: string): boolean {
  if (!seniority) return true;
  const s = (job.seniority ?? '').trim();
  if (!s) return true;
  return s === seniority;
}

export function jobMatchesWorkModeFilter(job: Job, workMode: string): boolean {
  if (!workMode) return true;
  const w = (job.work_mode ?? '').trim();
  if (!w) return true;
  return w === workMode;
}

export function jobMatchesCityFilter(job: Job, city: string): boolean {
  if (!city.trim()) return true;
  return job.location.trim().toLowerCase() === city.trim().toLowerCase();
}
