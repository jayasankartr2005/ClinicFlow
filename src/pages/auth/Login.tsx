// ==============================================================================
// ClinicFlow — Authentication: Login Page
// Includes one-click Quick Demo Credentials for evaluation review
// ==============================================================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Activity, Lock, Mail, ArrowRight, Shield, Stethoscope, UserCheck, User, Building2, MessageSquare } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, isCloudMode } = useAuth();
  const { error, success } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const DEMO_PASSWORD = 'Demo@1234';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      error('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password || DEMO_PASSWORD);
      success('Signed in successfully!');
      navigate('/');
    } catch (err: any) {
      const msg: string = err.message || '';
      if (msg.toLowerCase().includes('email not confirmed')) {
        error('Email not confirmed. Go to Supabase Dashboard → Authentication → Users and confirm your email, OR disable email confirmation in Auth settings.');
      } else if (msg.toLowerCase().includes('invalid login credentials')) {
        error('Invalid credentials. Demo password is Demo@1234 — make sure you created the user in Supabase Dashboard.');
      } else {
        error(msg || 'Failed to sign in. Check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setIsLoading(true);
    try {
      await login(demoEmail, DEMO_PASSWORD);
      success(`Signed in as ${demoEmail.split('@')[0]}`);
      navigate('/');
    } catch (err: any) {
      const msg: string = err.message || '';
      if (msg.toLowerCase().includes('email not confirmed')) {
        error('Email not confirmed. In Supabase Dashboard → Auth → Settings → disable "Enable email confirmations".');
      } else if (msg.toLowerCase().includes('invalid login credentials')) {
        error(`User not found. Create "${demoEmail}" in Supabase Dashboard → Authentication → Users with password: Demo@1234`);
      } else {
        error(msg || 'Demo login failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-sky-600 text-white shadow-lg shadow-sky-600/30 mb-4">
          <Activity className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Clinic<span className="text-sky-400">Flow</span> Cloud
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-400">
          Digital Multi-Role Clinic Management SaaS Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                label="Email Address"
                type="email"
                required
                placeholder="name@clinicflow.demo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              />
            </div>

            <div>
              <Input
                label="Password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <label htmlFor="remember-me" className="ml-2 text-slate-600">
                  Remember session
                </label>
              </div>

              <Link to="/forgot-password" className="font-medium text-sky-600 hover:text-sky-500">
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to ClinicFlow
            </Button>
          </form>

          {/* Quick Demo Selector for Evaluators */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
              One-Click Healthcare Staff Login
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('super@clinicflow.demo')}
                className="flex items-center gap-2 p-2 rounded-lg bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-900 text-xs font-semibold transition-colors text-left"
              >
                <Shield className="w-4 h-4 text-sky-600 shrink-0" />
                <div className="truncate">
                  <p className="leading-none">Supercoordinator</p>
                  <span className="text-[10px] text-sky-600 font-normal">Platform Operator</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin@clinicflow.demo')}
                className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-xs font-semibold transition-colors text-left"
              >
                <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
                <div className="truncate">
                  <p className="leading-none">Hospital Admin</p>
                  <span className="text-[10px] text-purple-600 font-normal">Apollo Health</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('dr.sharma@clinicflow.demo')}
                className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-semibold transition-colors text-left"
              >
                <Stethoscope className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="truncate">
                  <p className="leading-none">Doctor</p>
                  <span className="text-[10px] text-emerald-600 font-normal">Cardiology</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('reception@clinicflow.demo')}
                className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold transition-colors text-left"
              >
                <UserCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="truncate">
                  <p className="leading-none">Receptionist</p>
                  <span className="text-[10px] text-amber-600 font-normal">Front Desk</span>
                </div>
              </button>
            </div>
          </div>

          {/* Patient WhatsApp Info Banner */}
          <div className="mt-6 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-900 text-center text-xs">
            <div className="flex items-center justify-center gap-1.5 font-semibold text-emerald-800 mb-1">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Patient Interface: WhatsApp Cloud API</span>
            </div>
            <p className="text-[11px] text-emerald-700 leading-relaxed">
              Patients do not require login credentials. Consultations, slot bookings, and medical records are managed seamlessly via WhatsApp.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          BCSE408L Cloud Computing • VIT Chennai • 2026–2027
        </div>
      </div>
    </div>
  );
};
