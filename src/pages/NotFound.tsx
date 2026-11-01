// ==============================================================================
// ClinicFlow — 404 Not Found Page
// ==============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { Activity, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center">
      <div className="p-3 bg-sky-100 text-sky-600 rounded-2xl mb-4">
        <Activity className="w-10 h-10" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
      <h2 className="text-lg font-bold text-slate-700 mt-1">Page Not Found</h2>
      <p className="text-xs text-slate-500 max-w-sm mt-2 mb-6">
        The requested clinical portal resource or page route could not be located in this application.
      </p>
      <Link to="/">
        <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
          Return to Portal
        </Button>
      </Link>
    </div>
  );
};
