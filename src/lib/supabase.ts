// ==============================================================================
// ClinicFlow — Supabase Client Configuration
// ==============================================================================

import { createClient } from '@supabase/supabase-js';

const env: Record<string, string | undefined> = 
  (typeof import.meta !== 'undefined' && (import.meta as any).env) || 
  (typeof process !== 'undefined' && process.env) || 
  {};

const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl.startsWith('https://') && 
    !supabaseUrl.includes('your-project-ref')
  );
};

// Create Supabase client (fallback to dummy url if not configured to prevent crash during import)
export const supabase = createClient(
  isSupabaseConfigured() ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);
