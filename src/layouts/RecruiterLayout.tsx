import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { api, type RankedCandidateRow } from '../services/api';
import type { Job } from '../types';

export interface JobWithApplicants extends Job {
  applications: RankedCandidateRow[];
}

export type RecruiterLayoutContext = {
  jobs: JobWithApplicants[];
  setJobs: React.Dispatch<React.SetStateAction<JobWithApplicants[]>>;
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
};

const RecruiterLayout = () => {
  const [jobs, setJobs] = useState<JobWithApplicants[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const jobsData = await api.listMyJobs();
      setJobs(jobsData.map((j) => ({ ...j, applications: [] as RankedCandidateRow[] })));
    } catch {
      setError('Could not load your job postings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet context={{ jobs, setJobs, loading, error, refetch } as RecruiterLayoutContext} />
    </div>
  );
};

export default RecruiterLayout;
