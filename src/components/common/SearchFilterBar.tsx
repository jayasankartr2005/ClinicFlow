// ==============================================================================
// ClinicFlow — Reusable UI Components: SearchFilterBar
// ==============================================================================

import React from 'react';
import { Search, X, Filter } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  statusOptions?: FilterOption[];
  departmentFilter?: string;
  onDepartmentFilterChange?: (deptId: string) => void;
  departmentOptions?: FilterOption[];
  extraActions?: React.ReactNode;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search records...',
  statusFilter,
  onStatusFilterChange,
  statusOptions,
  departmentFilter,
  onDepartmentFilterChange,
  departmentOptions,
  extraActions,
}) => {
  return (
    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs mb-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
      <div className="flex flex-1 flex-wrap gap-2.5 items-center">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-8 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Dropdown */}
        {onStatusFilterChange && statusOptions && (
          <div className="flex items-center gap-1.5 min-w-[140px]">
            <Filter className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            <select
              value={statusFilter || 'all'}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Department Dropdown */}
        {onDepartmentFilterChange && departmentOptions && (
          <div className="min-w-[150px]">
            <select
              value={departmentFilter || 'all'}
              onChange={(e) => onDepartmentFilterChange(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departmentOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Extra Action Buttons (e.g. Export CSV, New Booking) */}
      {extraActions && (
        <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
          {extraActions}
        </div>
      )}
    </div>
  );
};
