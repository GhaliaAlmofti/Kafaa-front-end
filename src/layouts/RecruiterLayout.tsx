import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { api } from '../services/api';
import type { Job } from '../types';

export type RecruiterLayoutContext = {
  jobs: Job[];
  setJobs: React.Dispatch<React.SetStateAction<Job[]>>;
  loading: boolean;
  error: string;
  refetch: () => Promise<void>;
};

const RecruiterLayout = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const jobsData = await api.listMyJobs();
      setJobs(jobsData);
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
