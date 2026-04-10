import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Copy,
  Edit3,
  ExternalLink,
  FileText,
  Loader2,
  PauseCircle,
  PlayCircle,
  Search,
  SlidersHorizontal,
  X,
  XCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { MatchScoreExplainability } from '../MatchScoreExplainability';
import type { Job, JobApplication, JobSeniority, JobWorkMode } from '../../types';
import {
  type ApplicantStage,
  type JobListingStatus,
  type JobSortKey,
  type RecruiterJobRow,
  type SortDirection,
  deriveApplicantStage,
  filterApplicants,
  filterJobs,
  getJobListingStatus,
  mergePipelineMap,
  paginate,
  planStagePatch,
  readHoldJobIds,
  readPipelineMap,
  sortJobRows,
  totalPages,
  writeHoldJobIds,
  writePipelineMap,
} from './recruiterDashboardTypes';
import { useRecruiterLiveSync } from './useRecruiterLiveSync';

const APPLICANT_PAGE_SIZE = 7;
const STAGES: ApplicantStage[] = ['new', 'screening', 'interview', 'offer', 'hired'];

export type RecruiterDashboardProps = {
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  jobsLoading: boolean;
  jobsError: string | null;
  departmentLabel?: string;
  refetchJobs: () => Promise<void>;
  loadApplications: (jobId: number) => Promise<JobApplication[]>;
  patchApplication: (
    applicationId: number,
    status: JobApplication['status'],
  ) => Promise<unknown>;
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
      >
    >,
  ) => Promise<Job>;
  duplicateJob: (source: Job) => Promise<void>;
  pollIntervalMs?: number;
  className?: string;
};

function listingBadgeClass(s: JobListingStatus) {
  switch (s) {
    case 'open':
      return 'bg-brand-primary-soft text-brand-primary-deep';
    case 'on_hold':
      return 'bg-amber-100 text-amber-900';
    default:
      return 'bg-gray-200 text-gray-600';
  }
}

function stageButtonClass(active: boolean) {
  return cn(
    'rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wide border transition-colors min-h-[2rem]',
    active
      ? 'border-brand-primary bg-brand-primary text-white'
      : 'border-gray-200 bg-white text-gray-600 hover:border-brand-primary hover:text-brand-primary',
  );
}

function TableSkeleton({ rows, cols, ariaLabel }: { rows: number; cols: number; ariaLabel: string }) {
  return (
    <tbody aria-busy="true" aria-label={ariaLabel}>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-gray-100">
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c} className="py-3 pr-3">
              <div className="h-4 rounded bg-gray-200 animate-pulse" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function RecruiterDashboard({
  jobs,
  setJobs,
  jobsLoading,
  jobsError,
  departmentLabel = '—',
  refetchJobs,
  loadApplications,
  patchApplication,
  patchJob,
  duplicateJob,
  pollIntervalMs = 45_000,
  className,
}: RecruiterDashboardProps) {
  const { t } = useTranslation();
  const liveId = useId();
  const [holdIds, setHoldIds] = useState<Set<number>>(readHoldJobIds);
  const [pipelineMap, setPipelineMap] = useState<Record<string, ApplicantStage>>(readPipelineMap);

  const [jobQuery, setJobQuery] = useState('');
  const [jobStatusFilter, setJobStatusFilter] = useState<JobListingStatus | 'all'>('all');
  const [sortKey, setSortKey] = useState<JobSortKey>('posted');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  const [counts, setCounts] = useState<Record<number, number>>({});
  const [countsLoading, setCountsLoading] = useState(false);

  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState('');
  const [patchingAppId, setPatchingAppId] = useState<number | null>(null);
  const [jobActionId, setJobActionId] = useState<number | null>(null);

  const [applicantQuery, setApplicantQuery] = useState('');
  const [applicantPage, setApplicantPage] = useState(1);

  const [editJob, setEditJob] = useState<Job | null>(null);
  const [editDraft, setEditDraft] = useState({
    title: '',
    description: '',
    location: '',
    salary_min: '',
    salary_max: '',
    seniority: '' as JobSeniority | '',
    work_mode: '' as JobWorkMode | '',
  });
  const [drawerApp, setDrawerApp] = useState<JobApplication | null>(null);
  const [liveMsg, setLiveMsg] = useState('');

  const drawerRef = useRef<HTMLDivElement>(null);
  const editTitleRef = useRef<HTMLInputElement>(null);

  const persistHold = useCallback((next: Set<number>) => {
    setHoldIds(next);
    writeHoldJobIds(next);
  }, []);

  const rows: RecruiterJobRow[] = useMemo(
    () =>
      jobs.map((j) => ({
        ...j,
        applicantCount: counts[j.id] ?? 0,
      })),
    [jobs, counts],
  );

  const visibleJobs = useMemo(
    () =>
      sortJobRows(
        filterJobs(rows, jobQuery, jobStatusFilter, holdIds),
        sortKey,
        sortDir,
        holdIds,
        departmentLabel,
      ),
    [rows, jobQuery, jobStatusFilter, holdIds, sortKey, sortDir, departmentLabel],
  );

  const selectedJob = useMemo(
    () => (selectedJobId != null ? jobs.find((j) => j.id === selectedJobId) : undefined),
    [jobs, selectedJobId],
  );

  const filteredApplicants = useMemo(
    () => filterApplicants(applications, applicantQuery),
    [applications, applicantQuery],
  );

  const applicantTotalPages = totalPages(filteredApplicants.length, APPLICANT_PAGE_SIZE);
  const applicantSlice = useMemo(
    () => paginate(filteredApplicants, applicantPage, APPLICANT_PAGE_SIZE),
    [filteredApplicants, applicantPage],
  );

  useEffect(() => {
    if (selectedJobId == null && jobs.length > 0) {
      setSelectedJobId(jobs[0].id);
    }
    if (selectedJobId != null && !jobs.some((j) => j.id === selectedJobId)) {
      setSelectedJobId(jobs[0]?.id ?? null);
    }
  }, [jobs, selectedJobId]);

  useEffect(() => {
    setApplicantPage(1);
  }, [selectedJobId, applicantQuery]);

  useEffect(() => {
    if (applicantPage > applicantTotalPages) {
      setApplicantPage(applicantTotalPages);
    }
  }, [applicantPage, applicantTotalPages]);

  const refreshCounts = useCallback(async () => {
    if (jobs.length === 0) {
      setCounts({});
      return;
    }
    setCountsLoading(true);
    try {
      const entries = await Promise.all(
        jobs.map(async (j) => {
          const apps = await loadApplications(j.id);
          return [j.id, apps.length] as const;
        }),
      );
      const rec: Record<number, number> = {};
      entries.forEach(([id, n]) => {
        rec[id] = n;
      });
      setCounts(rec);
    } catch {
      /* keep previous */
    } finally {
      setCountsLoading(false);
    }
  }, [jobs, loadApplications]);

  useEffect(() => {
    if (jobsLoading) return;
    void refreshCounts();
  }, [jobsLoading, refreshCounts]);

  const loadAppsForJob = useCallback(
    async (jobId: number) => {
      setAppsLoading(true);
      setAppsError('');
      try {
        const list = await loadApplications(jobId);
        setApplications(list);
        setCounts((c) => ({ ...c, [jobId]: list.length }));
      } catch {
        setAppsError(t('recruiterDashboard.loadApplicantsError'));
        setApplications([]);
      } finally {
        setAppsLoading(false);
      }
    },
    [loadApplications, t],
  );

  useEffect(() => {
    if (selectedJobId == null) return;
    void loadAppsForJob(selectedJobId);
  }, [selectedJobId, loadAppsForJob]);

  useEffect(() => {
    setDrawerApp((d) => {
      if (!d) return d;
      return applications.find((a) => a.id === d.id) ?? d;
    });
  }, [applications]);

  const announce = useCallback((msg: string) => {
    setLiveMsg(msg);
    window.setTimeout(() => setLiveMsg(''), 3_000);
  }, []);

  const syncAll = useCallback(async () => {
    await refetchJobs();
    await refreshCounts();
    if (selectedJobId != null) {
      await loadAppsForJob(selectedJobId);
    }
    announce(t('recruiterDashboard.refreshed'));
  }, [refetchJobs, refreshCounts, loadAppsForJob, selectedJobId, announce, t]);

  useRecruiterLiveSync({
    enabled: !jobsLoading && pollIntervalMs > 0,
    pollIntervalMs: pollIntervalMs > 0 ? pollIntervalMs : 60_000_000,
    onSync: syncAll,
  });

  const toggleSort = (key: JobSortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'title' || key === 'department' || key === 'location' ? 'asc' : 'desc');
    }
  };

  const sortAria = (key: JobSortKey): 'none' | 'ascending' | 'descending' =>
    sortKey !== key ? 'none' : sortDir === 'asc' ? 'ascending' : 'descending';

  const openEdit = (job: Job) => {
    setEditJob(job);
    setEditDraft({
      title: job.title,
      description: job.description,
      location: job.location,
      salary_min: job.salary_min != null ? String(job.salary_min) : '',
      salary_max: job.salary_max != null ? String(job.salary_max) : '',
      seniority: ((job.seniority ?? '') as JobSeniority) || '',
      work_mode: ((job.work_mode ?? '') as JobWorkMode) || '',
    });
  };

  const saveEdit = async () => {
    if (!editJob) return;
    const parseOptInt = (s: string): number | null => {
      const trimmed = s.trim();
      if (!trimmed) return null;
      const n = parseInt(trimmed, 10);
      return Number.isFinite(n) && n >= 0 ? n : null;
    };
    try {
      setJobActionId(editJob.id);
      const updated = await patchJob(editJob.id, {
        title: editDraft.title.trim(),
        description: editDraft.description,
        location: editDraft.location.trim(),
        salary_min: parseOptInt(editDraft.salary_min),
        salary_max: parseOptInt(editDraft.salary_max),
        seniority: editDraft.seniority || '',
        work_mode: editDraft.work_mode || '',
      });
      setJobs((prev) => prev.map((j) => (j.id === updated.id ? { ...j, ...updated } : j)));
      setEditJob(null);
      announce(t('recruiterDashboard.jobUpdated'));
    } catch {
      announce(t('recruiterDashboard.jobSaveError'));
    } finally {
      setJobActionId(null);
    }
  };

  const closeJob = async (job: Job) => {
    try {
      setJobActionId(job.id);
      const nextHold = new Set(holdIds);
      nextHold.delete(job.id);
      persistHold(nextHold);
      const updated = await patchJob(job.id, { is_active: false });
      setJobs((prev) => prev.map((j) => (j.id === updated.id ? { ...j, ...updated } : j)));
      await refreshCounts();
      announce(t('recruiterDashboard.jobClosed'));
    } catch {
      announce(t('recruiterDashboard.jobCloseError'));
    } finally {
      setJobActionId(null);
    }
  };

  const toggleHold = (job: Job) => {
    if (job.is_active === false) return;
    const next = new Set(holdIds);
    if (next.has(job.id)) next.delete(job.id);
    else next.add(job.id);
    persistHold(next);
    announce(next.has(job.id) ? t('recruiterDashboard.jobOnHold') : t('recruiterDashboard.jobResumed'));
  };

  const duplicate = async (job: Job) => {
    try {
      setJobActionId(job.id);
      await duplicateJob(job);
      await refetchJobs();
      await refreshCounts();
      announce(t('recruiterDashboard.jobDuplicated'));
    } catch {
      announce(t('recruiterDashboard.jobDupError'));
    } finally {
      setJobActionId(null);
    }
  };

  const applyApplicantStage = async (app: JobApplication, stage: ApplicantStage) => {
    const plan = planStagePatch(app.id, stage);
    try {
      setPatchingAppId(app.id);
      if (app.status !== plan.apiStatus) {
        await patchApplication(app.id, plan.apiStatus);
      }
      const nextMap = mergePipelineMap(pipelineMap, app.id, plan.pipelineKey);
      setPipelineMap(nextMap);
      writePipelineMap(nextMap);
      if (selectedJobId != null) await loadAppsForJob(selectedJobId);
      announce(
        t('recruiterDashboard.candidateMoved', {
          stage: t(`recruiterDashboard.stage_${stage}`),
        }),
      );
    } catch {
      announce(t('recruiterDashboard.stageUpdateError'));
    } finally {
      setPatchingAppId(null);
    }
  };

  useEffect(() => {
    if (drawerApp) {
      const t = window.setTimeout(() => {
        drawerRef.current?.querySelector<HTMLElement>('button, a, [href]')?.focus();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [drawerApp]);

  useEffect(() => {
    if (editJob) {
      const t = window.setTimeout(() => editTitleRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [editJob]);

  return (
    <div className={cn('flex flex-col gap-8', className)}>
      <div id={liveId} role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMsg}
      </div>

      <div className="flex flex-col gap-8 xl:grid xl:grid-cols-5 xl:gap-6 xl:items-stretch">
        <section
          aria-labelledby="rd-jobs-heading"
          className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm xl:col-span-2 xl:flex xl:flex-col xl:min-h-0"
        >
          <div className="flex flex-col gap-4 p-4 md:p-5 border-b border-gray-100 md:flex-row md:items-center md:justify-between shrink-0">
            <div>
              <h2 id="rd-jobs-heading" className="text-lg font-bold text-brand-black flex items-center gap-2">
                <SlidersHorizontal className="text-brand-primary" size={20} aria-hidden />
                {t('recruiterDashboard.activeJobs')}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">{t('recruiterDashboard.sortFilterHint')}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <label className="relative flex-1 min-w-0">
                <span className="sr-only">{t('recruiterDashboard.filterKeyword')}</span>
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={18}
                  aria-hidden
                />
                <input
                  data-testid="rd-job-search"
                  type="search"
                  value={jobQuery}
                  onChange={(e) => setJobQuery(e.target.value)}
                  placeholder={t('recruiterDashboard.searchJobsPlaceholder')}
                  className="input-field pl-10 w-full text-sm"
                />
              </label>
              <label className="sr-only" htmlFor="rd-job-status-filter">
                {t('recruiterDashboard.filterStatus')}
              </label>
              <select
                id="rd-job-status-filter"
                data-testid="rd-job-status-filter"
                value={jobStatusFilter}
                onChange={(e) => setJobStatusFilter(e.target.value as JobListingStatus | 'all')}
                className="input-field text-sm min-w-[140px]"
              >
                <option value="all">{t('recruiterDashboard.allStatuses')}</option>
                <option value="open">{t('recruiterDashboard.statusOpen')}</option>
                <option value="on_hold">{t('recruiterDashboard.statusOnHold')}</option>
                <option value="closed">{t('recruiterDashboard.statusClosed')}</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto xl:flex-1 xl:min-h-0 xl:max-h-[min(70vh,560px)] xl:overflow-y-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="text-left text-[10px] font-black uppercase text-gray-400 border-b border-gray-200 bg-gray-50/80">
                  {(
                    [
                      ['title', t('recruiterDashboard.colJobTitle')],
                      ['department', t('recruiterDashboard.colDepartment')],
                      ['location', t('recruiterDashboard.colLocation')],
                      ['posted', t('recruiterDashboard.colPosted')],
                      ['applicants', t('recruiterDashboard.colApplicants')],
                      ['status', t('recruiterDashboard.colStatus')],
                    ] as const
                  ).map(([key, label]) => (
                    <th key={key} scope="col" className="py-3 px-4">
                      <button
                        type="button"
                        data-testid={`rd-sort-${key}`}
                        onClick={() => toggleSort(key)}
                        className="inline-flex items-center gap-1 font-black uppercase tracking-wider text-gray-500 hover:text-brand-primary"
                        aria-sort={sortAria(key)}
                      >
                        {label}
                        {sortKey === key ? (
                          sortDir === 'asc' ? (
                            <ArrowUp size={14} aria-hidden />
                          ) : (
                            <ArrowDown size={14} aria-hidden />
                          )
                        ) : null}
                      </button>
                    </th>
                  ))}
                  <th scope="col" className="py-3 px-4 text-right">
                    {t('recruiterDashboard.colActions')}
                  </th>
                </tr>
              </thead>
              {jobsLoading ? (
                <TableSkeleton rows={5} cols={7} ariaLabel={t('recruiterDashboard.loadingTable')} />
              ) : visibleJobs.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-500">
                      <FileText className="mx-auto mb-2 text-gray-300" size={36} aria-hidden />
                      <p className="font-medium text-brand-black">{t('recruiterDashboard.noJobsFilter')}</p>
                      <p className="text-sm mt-1">{t('recruiterDashboard.noJobsFilterHint')}</p>
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody>
                  {visibleJobs.map((job) => {
                    const listing = getJobListingStatus(job, holdIds);
                    const selected = job.id === selectedJobId;
                    return (
                      <tr
                        key={job.id}
                        data-testid={`rd-job-row-${job.id}`}
                        className={cn(
                          'border-b border-gray-100 transition-colors',
                          selected ? 'bg-brand-primary-faint/80' : 'hover:bg-gray-50',
                        )}
                      >
                        <td className="py-3 px-4 font-semibold text-brand-black">
                          <div className="flex flex-col gap-1 items-start">
                            <button
                              type="button"
                              data-testid={`rd-select-job-${job.id}`}
                              className="text-left hover:text-brand-primary underline-offset-2 hover:underline"
                              onClick={() => setSelectedJobId(job.id)}
                            >
                              {job.title}
                            </button>
                            <Link
                              to={`/recruiter/jobs/${job.id}`}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 hover:text-brand-primary"
                            >
                              {t('common.fullPage')} <ExternalLink size={12} aria-hidden />
                            </Link>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{departmentLabel}</td>
                        <td className="py-3 px-4 text-gray-600">{job.location}</td>
                        <td className="py-3 px-4 text-gray-500 whitespace-nowrap">
                          {new Date(job.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 tabular-nums">
                          {countsLoading ? <span className="text-gray-400">…</span> : job.applicantCount}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              'text-[10px] font-black uppercase px-2 py-0.5 rounded-full',
                              listingBadgeClass(listing),
                            )}
                          >
                            {listing === 'on_hold'
                              ? t('recruiterDashboard.listing_on_hold')
                              : listing === 'open'
                                ? t('recruiterDashboard.listing_open')
                                : t('recruiterDashboard.listing_closed')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap justify-end gap-1">
                            <button
                              type="button"
                              data-testid={`rd-job-edit-${job.id}`}
                              className="p-2 rounded-lg border border-gray-200 hover:border-brand-primary text-gray-600 hover:text-brand-primary"
                              aria-label={t('recruiterDashboard.editJobTitle', { title: job.title })}
                              disabled={jobActionId === job.id}
                              onClick={() => openEdit(job)}
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              type="button"
                              data-testid={`rd-job-hold-${job.id}`}
                              className="p-2 rounded-lg border border-gray-200 hover:border-amber-500 text-gray-600"
                              aria-label={
                                holdIds.has(job.id)
                                  ? t('recruiterDashboard.resumeJob', { title: job.title })
                                  : t('recruiterDashboard.holdJob', { title: job.title })
                              }
                              disabled={job.is_active === false || jobActionId === job.id}
                              onClick={() => toggleHold(job)}
                            >
                              {holdIds.has(job.id) ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
                            </button>
                            <button
                              type="button"
                              data-testid={`rd-job-close-${job.id}`}
                              className="p-2 rounded-lg border border-gray-200 hover:border-red-400 text-gray-600"
                              aria-label={t('recruiterDashboard.closeJob', { title: job.title })}
                              disabled={job.is_active === false || jobActionId === job.id}
                              onClick={() => void closeJob(job)}
                            >
                              <XCircle size={16} />
                            </button>
                            <button
                              type="button"
                              data-testid={`rd-job-dup-${job.id}`}
                              className="p-2 rounded-lg border border-gray-200 hover:border-brand-primary text-gray-600"
                              disabled={jobActionId === job.id}
                              onClick={() => void duplicate(job)}
                            >
                              <Copy size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              )}
            </table>
          </div>
          {jobsError ? (
            <div className="p-4 text-sm text-red-600 bg-red-50 border-t border-red-100">{jobsError}</div>
          ) : null}
        </section>

        <section
          aria-labelledby="rd-apps-heading"
          className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm xl:col-span-3 xl:flex xl:flex-col xl:min-h-0"
        >
          <div className="p-4 md:p-5 border-b border-gray-100 flex flex-col gap-3 md:flex-row md:items-center md:justify-between shrink-0">
            <div>
              <h2 id="rd-apps-heading" className="text-lg font-bold text-brand-black">
                {t('recruiterDashboard.applicantsHeading')}
                {selectedJob ? (
                  <span className="text-gray-400 font-normal text-base ml-2">· {selectedJob.title}</span>
                ) : null}
              </h2>
              <p className="text-sm text-gray-500">{t('recruiterDashboard.applicantsHint')}</p>
            </div>
            <label className="relative w-full md:max-w-xs">
              <span className="sr-only">{t('recruiterDashboard.searchApplicants')}</span>
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                size={18}
                aria-hidden
              />
              <input
                data-testid="rd-applicant-search"
                type="search"
                value={applicantQuery}
                onChange={(e) => setApplicantQuery(e.target.value)}
                placeholder={t('recruiterDashboard.searchCandidatesPlaceholder')}
                className="input-field pl-10 w-full text-sm"
                disabled={!selectedJob}
              />
            </label>
          </div>

          {!selectedJob ? (
            <p className="text-center text-gray-400 py-12 text-sm">{t('recruiterDashboard.selectJobPrompt')}</p>
          ) : appsLoading && applications.length === 0 ? (
            <div className="overflow-x-auto p-4">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="text-left text-[10px] font-black uppercase text-gray-400 border-b border-gray-200">
                    <th scope="col" className="pb-3 px-3">
                      {t('recruiterDashboard.candidate')}
                    </th>
                    <th scope="col" className="pb-3 px-3">
                      {t('recruiterDashboard.applied')}
                    </th>
                    <th scope="col" className="pb-3 px-3">
                      {t('recruiterDashboard.resume')}
                    </th>
                    <th scope="col" className="pb-3 px-3">
                      {t('recruiterDashboard.score')}
                    </th>
                    <th scope="col" className="pb-3 px-3">
                      {t('recruiterDashboard.stage')}
                    </th>
                    <th scope="col" className="pb-3 px-3 text-right">
                      {t('recruiterDashboard.details')}
                    </th>
                  </tr>
                </thead>
                <TableSkeleton rows={4} cols={6} ariaLabel={t('recruiterDashboard.loadingTable')} />
              </table>
            </div>
          ) : (
            <>
              {appsError ? (
                <div className="p-4 text-sm text-red-600 bg-red-50">{appsError}</div>
              ) : null}
              {filteredApplicants.length === 0 ? (
                <p
                  className="text-center text-gray-400 py-12 text-sm xl:min-h-[280px] xl:flex xl:items-center xl:justify-center"
                  data-testid="rd-apps-empty"
                >
                  {applications.length === 0
                    ? t('recruiterDashboard.noAppsYet')
                    : t('recruiterDashboard.noSearchMatch')}
                </p>
              ) : (
                <div className="overflow-x-auto xl:flex-1 xl:min-h-0 xl:max-h-[min(70vh,560px)] xl:overflow-y-auto">
                  <table className="w-full text-sm min-w-[720px]">
                    <thead>
                      <tr className="text-left text-[10px] font-black uppercase text-gray-400 border-b border-gray-200 bg-gray-50/80">
                        <th scope="col" className="py-3 px-3">
                          {t('recruiterDashboard.candidate')}
                        </th>
                        <th scope="col" className="py-3 px-3">
                          {t('recruiterDashboard.applied')}
                        </th>
                        <th scope="col" className="py-3 px-3">
                          {t('recruiterDashboard.resume')}
                        </th>
                        <th scope="col" className="py-3 px-3">
                          {t('recruiterDashboard.score')}
                        </th>
                        <th scope="col" className="py-3 px-3 min-w-[220px]">
                          {t('recruiterDashboard.stage')}
                        </th>
                        <th scope="col" className="py-3 px-3 text-right">
                          {t('recruiterDashboard.details')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {applicantSlice.map((app) => {
                        const stage = deriveApplicantStage(app, pipelineMap);
                        return (
                          <tr
                            key={app.id}
                            data-testid={`rd-app-row-${app.id}`}
                            className="border-b border-gray-100 align-top"
                          >
                            <td className="py-3 px-3 font-medium text-brand-black">
                              {app.applicant_name || t('common.dash')}
                            </td>
                            <td className="py-3 px-3 text-gray-500 whitespace-nowrap">
                              {new Date(app.applied_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-3">
                              {app.cv_file ? (
                                <a
                                  data-testid={`rd-resume-${app.id}`}
                                  href={app.cv_file}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-brand-primary font-bold hover:underline inline-flex items-center gap-1"
                                >
                                  {t('common.preview')} <FileText size={14} aria-hidden />
                                </a>
                              ) : (
                                <span className="text-gray-400">{t('common.dash')}</span>
                              )}
                            </td>
                            <td className="py-3 px-3 tabular-nums">
                              <MatchScoreExplainability
                                score={app.match_score}
                                matched={app.match_matched_skills}
                                missing={app.match_missing_skills}
                              />
                            </td>
                            <td className="py-3 px-3">
                              {stage === 'rejected' ? (
                                <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-1 rounded-lg">
                                  {t('recruiterDashboard.rejected')}
                                </span>
                              ) : (
                                <div className="flex flex-wrap gap-1" role="group" aria-label={t('recruiterDashboard.pipelineStage')}>
                                  {STAGES.map((st) => {
                                    const active = stage === st;
                                    return (
                                      <button
                                        key={st}
                                        type="button"
                                        data-testid={`rd-stage-${app.id}-${st}`}
                                        disabled={patchingAppId === app.id}
                                        className={stageButtonClass(active)}
                                        aria-pressed={active}
                                        onClick={() => void applyApplicantStage(app, st)}
                                      >
                                        {patchingAppId === app.id && active ? (
                                          <Loader2 className="animate-spin inline" size={12} aria-hidden />
                                        ) : null}{' '}
                                        {t(`recruiterDashboard.stage_${st}`)}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                data-testid={`rd-app-details-${app.id}`}
                                className="text-sm font-bold text-brand-primary hover:underline"
                                onClick={() => setDrawerApp(app)}
                              >
                                {t('common.view')}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredApplicants.length > 0 ? (
                <nav
                  className="flex items-center justify-between gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50/50 xl:mt-auto xl:shrink-0"
                  aria-label={t('recruiterDashboard.applicantPagination')}
                >
                  <button
                    type="button"
                    data-testid="rd-apps-prev"
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold disabled:opacity-40"
                    disabled={applicantPage <= 1}
                    onClick={() => setApplicantPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={18} aria-hidden /> {t('recruiterDashboard.previous')}
                  </button>
                  <span className="text-sm text-gray-600 tabular-nums">
                    {t('recruiterDashboard.pageOf', { page: applicantPage, total: applicantTotalPages })}
                  </span>
                  <button
                    type="button"
                    data-testid="rd-apps-next"
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold disabled:opacity-40"
                    disabled={applicantPage >= applicantTotalPages}
                    onClick={() => setApplicantPage((p) => Math.min(applicantTotalPages, p + 1))}
                  >
                    {t('recruiterDashboard.next')} <ChevronRight size={18} aria-hidden />
                  </button>
                </nav>
              ) : null}
            </>
          )}
        </section>
      </div>

      {editJob ? (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setEditJob(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rd-edit-title"
            className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-gray-200 p-6"
          >
            <h3 id="rd-edit-title" className="text-lg font-bold text-brand-black mb-4">
              {t('recruiterDashboard.editJob')}
            </h3>
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-700">
                {t('recruiterDashboard.labelTitle')}
                <input
                  ref={editTitleRef}
                  className="input-field mt-1 font-normal"
                  value={editDraft.title}
                  onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))}
                />
              </label>
              <label className="block text-sm font-bold text-gray-700">
                {t('recruiterDashboard.labelLocation')}
                <input
                  className="input-field mt-1 font-normal"
                  value={editDraft.location}
                  onChange={(e) => setEditDraft((d) => ({ ...d, location: e.target.value }))}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-bold text-gray-700">
                  {t('recruiterDashboard.salaryMin')}
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    className="input-field mt-1 font-normal tabular-nums"
                    placeholder={t('common.optional')}
                    value={editDraft.salary_min}
                    onChange={(e) => setEditDraft((d) => ({ ...d, salary_min: e.target.value }))}
                  />
                </label>
                <label className="block text-sm font-bold text-gray-700">
                  {t('recruiterDashboard.salaryMax')}
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    className="input-field mt-1 font-normal tabular-nums"
                    placeholder={t('common.optional')}
                    value={editDraft.salary_max}
                    onChange={(e) => setEditDraft((d) => ({ ...d, salary_max: e.target.value }))}
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm font-bold text-gray-700">
                  {t('recruiterDashboard.seniority')}
                  <select
                    className="input-field mt-1 font-normal"
                    value={editDraft.seniority}
                    onChange={(e) =>
                      setEditDraft((d) => ({ ...d, seniority: e.target.value as JobSeniority | '' }))
                    }
                  >
                    <option value="">{t('common.notSpecified')}</option>
                    <option value="intern">{t('jobSearchFilters.intern')}</option>
                    <option value="junior">{t('jobSearchFilters.junior')}</option>
                    <option value="mid">{t('jobSearchFilters.mid')}</option>
                    <option value="senior">{t('jobSearchFilters.senior')}</option>
                    <option value="lead">{t('jobSearchFilters.lead')}</option>
                    <option value="executive">{t('jobSearchFilters.executive')}</option>
                  </select>
                </label>
                <label className="block text-sm font-bold text-gray-700">
                  {t('recruiterDashboard.workMode')}
                  <select
                    className="input-field mt-1 font-normal"
                    value={editDraft.work_mode}
                    onChange={(e) =>
                      setEditDraft((d) => ({ ...d, work_mode: e.target.value as JobWorkMode | '' }))
                    }
                  >
                    <option value="">{t('common.notSpecified')}</option>
                    <option value="remote">{t('workMode.remote')}</option>
                    <option value="hybrid">{t('workMode.hybrid')}</option>
                    <option value="on_site">{t('workMode.on_site')}</option>
                  </select>
                </label>
              </div>
              <label className="block text-sm font-bold text-gray-700">
                {t('recruiterDashboard.description')}
                <textarea
                  className="input-field mt-1 font-normal min-h-[120px]"
                  value={editDraft.description}
                  onChange={(e) => setEditDraft((d) => ({ ...d, description: e.target.value }))}
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" className="btn-secondary text-sm py-2 px-4" onClick={() => setEditJob(null)}>
                {t('common.cancel')}
              </button>
              <button
                type="button"
                data-testid="rd-edit-save"
                className="btn-primary text-sm py-2 px-4"
                disabled={jobActionId === editJob.id}
                onClick={() => void saveEdit()}
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {drawerApp ? (
        <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
          <button
            type="button"
            aria-label={t('recruiterDashboard.closeDetails')}
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerApp(null)}
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="rd-drawer-title"
            className="relative w-full max-w-md bg-white h-full shadow-2xl border-l border-gray-200 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 id="rd-drawer-title" className="text-lg font-bold text-brand-black pr-2">
                {drawerApp.applicant_name || t('recruiterDashboard.drawerCandidate')}
              </h3>
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                aria-label={t('recruiterDashboard.close')}
                onClick={() => setDrawerApp(null)}
              >
                <X size={22} />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-[10px] font-black uppercase text-gray-400">{t('recruiterDashboard.appliedLabel')}</dt>
                  <dd className="text-gray-800">{new Date(drawerApp.applied_at).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-black uppercase text-gray-400">{t('recruiterDashboard.screeningScore')}</dt>
                  <dd className="text-gray-800 tabular-nums">
                    {drawerApp.match_score != null ? (
                      <MatchScoreExplainability
                        score={drawerApp.match_score}
                        matched={drawerApp.match_matched_skills}
                        missing={drawerApp.match_missing_skills}
                      />
                    ) : (
                      <span className="text-gray-500">{t('recruiterDashboard.notScored')}</span>
                    )}
                  </dd>
                </div>
                {(drawerApp.match_matched_skills?.length || drawerApp.match_missing_skills?.length) ? (
                  <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
                    <p className="text-[10px] font-black uppercase text-gray-400 mb-2">{t('recruiterDashboard.skillsExplain')}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="font-bold text-emerald-800 mb-1">{t('recruiterDashboard.matchedSkills')}</p>
                        <ul className="text-gray-700 space-y-0.5 list-disc list-inside">
                          {(drawerApp.match_matched_skills ?? []).map((s, i) => (
                            <li key={`m-${i}-${s}`}>{s}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-bold text-amber-800 mb-1">{t('recruiterDashboard.missingSkills')}</p>
                        <ul className="text-gray-700 space-y-0.5 list-disc list-inside">
                          {(drawerApp.match_missing_skills ?? []).map((s, i) => (
                            <li key={`g-${i}-${s}`}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : null}
                <div>
                  <dt className="text-[10px] font-black uppercase text-gray-400">{t('recruiterDashboard.pipelineStageLabel')}</dt>
                  <dd className="text-gray-800 capitalize">
                    {deriveApplicantStage(drawerApp, pipelineMap) === 'rejected'
                      ? t('recruiterDashboard.rejected')
                      : t(`recruiterDashboard.stage_${deriveApplicantStage(drawerApp, pipelineMap)}`)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-black uppercase text-gray-400">{t('recruiterDashboard.apiStatus')}</dt>
                  <dd className="text-gray-800 capitalize">
                    {t(`applicationStatus.${drawerApp.status}`)}
                  </dd>
                </div>
                {drawerApp.match_reason ? (
                  <div>
                    <dt className="text-[10px] font-black uppercase text-gray-400">{t('recruiterDashboard.matchNotes')}</dt>
                    <dd className="text-gray-700 leading-relaxed">{drawerApp.match_reason}</dd>
                  </div>
                ) : null}
              </dl>
              {drawerApp.cv_file ? (
                <a
                  href={drawerApp.cv_file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center justify-center w-full text-center"
                >
                  {t('recruiterDashboard.openResume')}
                </a>
              ) : null}
              <div className="flex flex-wrap gap-2 pt-2" role="group" aria-label={t('recruiterDashboard.updateStage')}>
                {STAGES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    data-testid={`rd-drawer-stage-${st}`}
                    className={stageButtonClass(deriveApplicantStage(drawerApp, pipelineMap) === st)}
                    disabled={patchingAppId === drawerApp.id}
                    onClick={() => void applyApplicantStage(drawerApp, st)}
                  >
                    {t(`recruiterDashboard.stage_${st}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default RecruiterDashboard;
