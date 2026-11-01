// ==============================================================================
// ClinicFlow — Master Routing Matrix & Application Router
// Multi-Tenant Hierarchy: Supercoordinator, Hospital Admin, Doctor, Receptionist, Patient
// ==============================================================================

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';

// Auth Pages
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { ForgotPassword } from '@/pages/auth/ForgotPassword';

// Supercoordinator Pages
import { SupercoordinatorDashboard } from '@/pages/supercoordinator/SupercoordinatorDashboard';
import { HospitalManagement } from '@/pages/supercoordinator/HospitalManagement';
import { WhatsAppMonitoring } from '@/pages/supercoordinator/WhatsAppMonitoring';
import { PlatformAuditLogs } from '@/pages/supercoordinator/PlatformAuditLogs';

// Admin Pages
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { HospitalSettings } from '@/pages/admin/HospitalSettings';
import { UserManagement } from '@/pages/admin/UserManagement';
import { DepartmentManagement } from '@/pages/admin/DepartmentManagement';
import { SpecializationManagement } from '@/pages/admin/SpecializationManagement';
import { SystemReports } from '@/pages/admin/SystemReports';
import { AuditLogs } from '@/pages/admin/AuditLogs';

// Doctor Pages
import { DoctorDashboard } from '@/pages/doctor/DoctorDashboard';
import { DoctorAppointments } from '@/pages/doctor/DoctorAppointments';
import { DoctorPatients } from '@/pages/doctor/DoctorPatients';
import { ConsultationRoom } from '@/pages/doctor/ConsultationRoom';
import { DoctorSchedule } from '@/pages/doctor/DoctorSchedule';

// Receptionist Pages
import { ReceptionistDashboard } from '@/pages/receptionist/ReceptionistDashboard';
import { FrontDeskQueue } from '@/pages/receptionist/FrontDeskQueue';
import { PatientRegistration } from '@/pages/receptionist/PatientRegistration';
import { PatientDirectory } from '@/pages/receptionist/PatientDirectory';
import { MasterSchedule } from '@/pages/receptionist/MasterSchedule';

// Patient Pages (WhatsApp Integrated Portal)
import { PatientDashboard } from '@/pages/patient/PatientDashboard';
import { BookAppointment } from '@/pages/patient/BookAppointment';
import { MyAppointments } from '@/pages/patient/MyAppointments';
import { MyMedicalRecords } from '@/pages/patient/MyMedicalRecords';
import { MyPrescriptions } from '@/pages/patient/MyPrescriptions';
import { PatientProfile } from '@/pages/patient/PatientProfile';

import { NotFound } from '@/pages/NotFound';

// Helper component that redirects root `/` to user's assigned dashboard
const RootRedirect: React.FC = () => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

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
      return <Navigate to="/patient/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root Direct */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Authenticated Dashboard Shell */}
      <Route element={<DashboardLayout />}>
        {/* Supercoordinator Routes (Platform Operator) */}
        <Route element={<ProtectedRoute allowedRoles={['supercoordinator']} />}>
          <Route path="/supercoordinator/dashboard" element={<SupercoordinatorDashboard />} />
          <Route path="/supercoordinator/hospitals" element={<HospitalManagement />} />
          <Route path="/supercoordinator/whatsapp" element={<WhatsAppMonitoring />} />
          <Route path="/supercoordinator/audit-logs" element={<PlatformAuditLogs />} />
        </Route>

        {/* Hospital Administrator Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/hospital" element={<HospitalSettings />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/departments" element={<DepartmentManagement />} />
          <Route path="/admin/specializations" element={<SpecializationManagement />} />
          <Route path="/admin/reports" element={<SystemReports />} />
          <Route path="/admin/audit-logs" element={<AuditLogs />} />
        </Route>

        {/* Doctor Routes */}
        <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
          <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
          <Route path="/doctor/appointments" element={<DoctorAppointments />} />
          <Route path="/doctor/patients" element={<DoctorPatients />} />
          <Route path="/doctor/consultation/:appointmentId" element={<ConsultationRoom />} />
          <Route path="/doctor/schedule" element={<DoctorSchedule />} />
        </Route>

        {/* Receptionist Routes */}
        <Route element={<ProtectedRoute allowedRoles={['receptionist']} />}>
          <Route path="/receptionist/dashboard" element={<ReceptionistDashboard />} />
          <Route path="/receptionist/queue" element={<FrontDeskQueue />} />
          <Route path="/receptionist/register" element={<PatientRegistration />} />
          <Route path="/receptionist/patients" element={<PatientDirectory />} />
          <Route path="/receptionist/appointments" element={<MasterSchedule />} />
        </Route>

        {/* Patient Routes (Accessible for demo & WhatsApp onboarding) */}
        <Route element={<ProtectedRoute allowedRoles={['patient', 'supercoordinator', 'admin']} />}>
          <Route path="/patient/dashboard" element={<PatientDashboard />} />
          <Route path="/patient/book" element={<BookAppointment />} />
          <Route path="/patient/appointments" element={<MyAppointments />} />
          <Route path="/patient/records" element={<MyMedicalRecords />} />
          <Route path="/patient/prescriptions" element={<MyPrescriptions />} />
          <Route path="/patient/profile" element={<PatientProfile />} />
        </Route>
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
