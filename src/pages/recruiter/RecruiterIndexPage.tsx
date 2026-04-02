import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Info, Briefcase, ChevronRight, Loader2, Calendar } from 'lucide-react';
import type { RecruiterLayoutContext } from '../../layouts/RecruiterLayout';
import PageLayout from '../../components/PageLayout';
import { formatPostedDate } from '../../utils/formatPostedDate';

const RecruiterIndexPage = () => {
  const { jobs, loading, error } = useOutletContext<RecruiterLayoutContext>();

  if (loading) {
    return (
      <PageLayout.Shell maxWidth="wide">
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="animate-spin text-brand-primary" size={40} />
        </div>
      </PageLayout.Shell>
    );
  }

  return (
    <PageLayout
      maxWidth="wide"
      title="Recruitment command center"
      subtitle="Your job posts, applicants, and match scores"
    >
      <div className="rounded-2xl border border-brand-primary-soft bg-brand-primary-faint/60 p-5 flex gap-4">
        <Info className="text-brand-primary shrink-0 mt-0.5" size={22} />
        <div className="text-sm text-gray-700 space-y-2">
          <p className="font-bold text-brand-black">How it works</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-600">
            <li>Candidates apply from the public job board using an uploaded CV.</li>
            <li>Candidates&apos; CVs are analyzed automatically when they upload.</li>
            <li>Open a job below to load applications, update status, and open CVs.</li>
            <li>
              <strong>Match scores</strong> are computed when someone applies (for analyzed CVs) and
              shown on the job page.
            </li>
            <li>
              Close a listing anytime with <strong>Close listing</strong> — it stays in your list.
            </li>
          </ol>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Briefcase className="text-brand-primary" size={20} />
          <h2 className="font-bold text-brand-black">Your jobs</h2>
          <span className="text-xs text-gray-400">({jobs.length})</span>
        </div>
        {jobs.length === 0 ? (
          <p className="text-gray-400 text-center py-12 px-4 text-sm">
            No jobs assigned to your account yet. Ask an admin to create a company and jobs for you.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {jobs.map((job) => {
              const isOpen = job.is_active !== false;
              return (
                <li key={job.id}>
                  <Link
                    to={`/recruiter/jobs/${job.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-brand-black truncate group-hover:text-brand-primary transition-colors">
                        {job.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span>
                          {job.location} · {job.job_type}
                        </span>
                        {job.created_at && (
                          <span className="inline-flex items-center gap-1 text-gray-400">
                            <Calendar size={12} aria-hidden />
                            {formatPostedDate(job.created_at)}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isOpen ? 'bg-brand-primary-soft text-brand-primary-deep' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {isOpen ? 'Open' : 'Closed'}
                      </span>
                      <ChevronRight className="text-gray-300 group-hover:text-brand-primary" size={20} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </PageLayout>
  );
};

export default RecruiterIndexPage;
