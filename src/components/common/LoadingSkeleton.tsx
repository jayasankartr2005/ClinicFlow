// ==============================================================================
// ClinicFlow — Reusable UI Components: LoadingSkeleton, EmptyState, ErrorState, StatCard
// ==============================================================================

import React from 'react';
import { AlertCircle, RefreshCw, Inbox, LucideIcon } from 'lucide-react';
import { Button } from './Button';

export const LoadingSkeleton: React.FC<{ rows?: number; type?: 'cards' | 'table' | 'profile' }> = ({
  rows = 4,
  type = 'cards',
}) => {
  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="h-8 w-8 bg-slate-200 rounded-lg" />
            </div>
            <div className="h-8 w-16 bg-slate-300 rounded mb-2" />
            <div className="h-3 w-32 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'profile') {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-200 animate-pulse space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-200" />
          <div className="space-y-2">
            <div className="h-5 w-40 bg-slate-200 rounded" />
            <div className="h-3 w-28 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
          <div className="h-10 bg-slate-100 rounded" />
          <div className="h-10 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}> = ({ title, description, icon: Icon = Inbox, action }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
      <div className="mx-auto w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center text-sky-600 mb-3.5">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">{description}</p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
}> = ({ title = 'Something went wrong', message, onRetry }) => {
  return (
    <div className="bg-rose-50/50 rounded-xl border border-rose-200 p-8 text-center shadow-xs">
      <div className="mx-auto w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-rose-900">{title}</h4>
      <p className="text-xs text-rose-700 max-w-md mx-auto mt-1 mb-4">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-4 h-4" />}
          className="border-rose-300 text-rose-800 hover:bg-rose-100"
        >
          Try Again
        </Button>
      )}
    </div>
  );
};

export const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'sky' | 'emerald' | 'amber' | 'purple' | 'rose';
  trend?: string;
}> = ({ title, value, subtitle, icon: Icon, color = 'sky', trend }) => {
  const colorMap = {
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:shadow-card transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        <div className={`p-2 rounded-lg border ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900 tracking-tight">{value}</span>
        {trend && (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
};
