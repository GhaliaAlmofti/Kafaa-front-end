import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Sends `/account` to the role-specific URL so the dashboard sidebar stays visible. */
const RedirectToRoleAccount = () => {
  const { user } = useAuth();

  if (!user?.role) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === 'ADMIN') {
    return <Navigate to="/admin/account" replace />;
  }
  if (user.role === 'RECRUITER' || user.role === 'PENDING_RECRUITER') {
    return <Navigate to="/recruiter/account" replace />;
  }
  return <Navigate to="/dashboard/account" replace />;
};

export default RedirectToRoleAccount;
