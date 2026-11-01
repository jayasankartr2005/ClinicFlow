// ==============================================================================
// ClinicFlow — Role-Based Protected Route Guard
// Enforces Client-side Route Security in tandem with Database Row Level Security
// ==============================================================================

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';
import { Activity } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="p-3 bg-sky-600 rounded-2xl animate-bounce mb-3 shadow-lg shadow-sky-600/50">
          <Activity className="w-8 h-8 text-white" />
        </div>
        <p className="text-sm font-semibold tracking-tight">Authenticating ClinicFlow Multi-Tenant Cloud...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    // Redirect user to their own role-specific dashboard
    switch (role) {
      case 'supercoordinator':
        return <Navigate to="/supercoordinator/dashboard" replace />;
      case 'admin':
        return <Navigate to="/admin/dashboard" replace />;
      case 'doctor':
        return <Navigate to="/doctor/dashboard" replace />;
      case 'receptionist':
        return <Navigate to="/receptionist/dashboard" replace />;
      case 'patient':
      default:
        return <Navigate to="/patient/dashboard" replace />;
    }
  }

  return <Outlet />;
};
