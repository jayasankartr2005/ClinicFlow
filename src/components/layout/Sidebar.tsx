// ==============================================================================
// ClinicFlow — Role-Aware Navigation Sidebar
// Supports Supercoordinator, Hospital Admin, Doctor, Receptionist & Patient
// ==============================================================================

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Stethoscope, 
  BarChart3, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  ListOrdered, 
  UserPlus, 
  CalendarPlus, 
  FileText, 
  Pill, 
  User, 
  Activity,
  MessageSquare,
  LogOut,
  X
} from 'lucide-react';
import { StatusBadge } from '../common/StatusBadge';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, role, hospital, logout } = useAuth();

  const getNavLinks = () => {
    switch (role) {
      case 'supercoordinator':
        return [
          { to: '/supercoordinator/dashboard', label: 'Platform Overview', icon: LayoutDashboard },
          { to: '/supercoordinator/hospitals', label: 'Hospital Network', icon: Building2 },
          { to: '/supercoordinator/whatsapp', label: 'WhatsApp Telemetry', icon: MessageSquare },
          { to: '/supercoordinator/audit-logs', label: 'Platform Security Logs', icon: ShieldCheck },
        ];
      case 'admin':
        return [
          { to: '/admin/dashboard', label: 'Hospital Overview', icon: LayoutDashboard },
          { to: '/admin/hospital', label: 'Hospital Details', icon: Building2 },
          { to: '/admin/users', label: 'Staff Directory', icon: Users },
          { to: '/admin/departments', label: 'Departments', icon: Building2 },
          { to: '/admin/specializations', label: 'Specializations', icon: Stethoscope },
          { to: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3 },
          { to: '/admin/audit-logs', label: 'Security Audit Logs', icon: ShieldCheck },
        ];
      case 'doctor':
        return [
          { to: '/doctor/dashboard', label: 'Doctor Dashboard', icon: LayoutDashboard },
          { to: '/doctor/appointments', label: 'Consultation Queue', icon: Calendar },
          { to: '/doctor/patients', label: 'Patient Directory', icon: Users },
          { to: '/doctor/schedule', label: 'Working Hours', icon: Clock },
        ];
      case 'receptionist':
        return [
          { to: '/receptionist/dashboard', label: 'Front Desk Overview', icon: LayoutDashboard },
          { to: '/receptionist/queue', label: "Today's Patient Queue", icon: ListOrdered },
          { to: '/receptionist/register', label: 'Patient Registration', icon: UserPlus },
          { to: '/receptionist/patients', label: 'Patient Directory', icon: Users },
          { to: '/receptionist/appointments', label: 'Master Appointments', icon: Calendar },
        ];
      case 'patient':
      default:
        return [
          { to: '/patient/dashboard', label: 'WhatsApp Patient Portal', icon: LayoutDashboard },
          { to: '/patient/book', label: 'Book Appointment', icon: CalendarPlus },
          { to: '/patient/appointments', label: 'My Appointments', icon: Calendar },
          { to: '/patient/records', label: 'Medical Records', icon: FileText },
          { to: '/patient/prescriptions', label: 'Digital Prescriptions', icon: Pill },
          { to: '/patient/profile', label: 'Health Profile', icon: User },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-sky-600 text-white shadow-sm">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white">Clinic<span className="text-sky-400">Flow</span></span>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                  {role === 'supercoordinator' ? 'Platform' : 'Tenant'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="px-4 py-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 text-sky-400 font-bold flex items-center justify-center border border-slate-700 text-sm">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.full_name || 'Clinic User'}</p>
              {hospital ? (
                <p className="text-[10px] text-sky-300 truncate font-medium">{hospital.name}</p>
              ) : (
                <p className="text-[10px] text-indigo-300 truncate font-medium">ClinicFlow Operator</p>
              )}
              <div className="mt-1">
                <StatusBadge status={role || 'patient'} variant="role" size="sm" />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation Menu
          </div>
          {navLinks.map(link => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-sky-600 text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Logout Strip */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>
    </>
  );
};
