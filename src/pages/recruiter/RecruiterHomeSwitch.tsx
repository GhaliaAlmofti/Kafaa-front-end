import React from 'react';
import { useAuth } from '../../context/AuthContext';
import PendingRecruiterPage from './PendingRecruiterPage';
import RejectedRecruiterPage from './RejectedRecruiterPage';
import RecruiterIndexPage from './RecruiterIndexPage';

/** Renders the full dashboard for approved recruiters; pending accounts see the approval gate. */
const RecruiterHomeSwitch = () => {
  const { user } = useAuth();
  if (user?.role === 'REJECTED_RECRUITER') {
    return <RejectedRecruiterPage />;
  }
  if (user?.role === 'PENDING_RECRUITER') {
    return <PendingRecruiterPage />;
  }
  return <RecruiterIndexPage />;
};

export default RecruiterHomeSwitch;
