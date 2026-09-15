import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../contexts/CustomerAuthContext';
export function RequireCustomer({ children }: { children: ReactNode }) {
  const { customer, loading } = useAuthContext();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>;
  }

  if (!customer) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}