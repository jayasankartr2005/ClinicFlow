// ==============================================================================
// ClinicFlow — Top Application Header with Evaluation Quick-Role Switcher
// Supports Multi-Tenant Supercoordinator, Hospital Context & Cloud State
// ==============================================================================

import React from 'react';
import { Menu, Cloud, Laptop, ChevronDown, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';
import { UserRole } from '@/types';
import { useNavigate } from 'react-router-dom';

interface TopHeaderProps {
  onMenuClick: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ onMenuClick }) => {
  const { user, role, hospital, isCloudMode, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as UserRole;
    await switchDemoRole(newRole);
    if (newRole === 'supercoordinator') navigate('/supercoordinator/dashboard');
    else if (newRole === 'admin') navigate('/admin/dashboard');
    else if (newRole === 'doctor') navigate('/doctor/dashboard');
    else if (newRole === 'receptionist') navigate('/receptionist/dashboard');
    else navigate('/patient/dashboard');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Cloud Mode Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {isCloudMode ? (
            <>
              <Cloud className="w-3.5 h-3.5 text-sky-600" />
              <span>Supabase Cloud Connected</span>
            </>
          ) : (
            <>
              <Laptop className="w-3.5 h-3.5 text-emerald-600" />
              <span>Multi-Tenant Local Mode</span>
            </>
          )}
        </div>

        {/* Hospital Entity Tag */}
        {hospital && (
          <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
            <Building2 className="w-3 h-3 text-sky-600" />
            <span className="truncate max-w-[180px]">{hospital.name}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Evaluator Quick Role Switcher */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden md:inline">
            Role:
          </span>
          <div className="relative">
            <select
              value={role || 'supercoordinator'}
              onChange={handleRoleChange}
              className="text-xs font-semibold text-slate-800 bg-transparent pr-5 py-0.5 focus:outline-none cursor-pointer appearance-none"
              title="Switch role for evaluation"
            >
              <option value="supercoordinator">Supercoordinator (Platform)</option>
              <option value="admin">Hospital Admin</option>
              <option value="doctor">Doctor</option>
              <option value="receptionist">Receptionist</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* In-App Notifications */}
        <NotificationDropdown />

        {/* Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-sky-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="hidden xl:block text-left">
            <p className="text-xs font-semibold text-slate-800 truncate max-w-[140px]">
              {user?.full_name || 'Clinic User'}
            </p>
            <p className="text-[10px] text-slate-500 capitalize">{role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
