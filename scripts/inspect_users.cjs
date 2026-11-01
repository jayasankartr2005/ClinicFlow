const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wqhqpcbbzhtqbriglwlt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxaHFwY2Jiemh0cWJyaWdsd2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NzI3NzEsImV4cCI6MjEwNTE0ODc3MX0.lgjS3jtSt8W8ltlEcuMx-MNcHoXtcp1vsr3Ms26jyzQ';

const client = createClient(supabaseUrl, supabaseAnonKey);

async function inspect(email, password = 'Demo@123') {
  console.log(`\n--- Inspecting ${email} ---`);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('Sign in error:', error.message);
    return;
  }
  console.log('Logged in user ID:', data.user.id);
  console.log('User metadata:', data.user.user_metadata);

  // Profile
  const { data: profile, error: pErr } = await client
    .from('profiles')
    .select('*, hospital:hospitals(*)')
    .eq('id', data.user.id)
    .single();

  console.log('Profile in DB:', profile, 'Error:', pErr);

  if (profile?.role === 'doctor' || email.includes('dr.')) {
    const { data: docProf, error: dErr } = await client
      .from('doctor_profiles')
      .select('*, department:departments(*), specialization:specializations(*)')
      .eq('id', data.user.id)
      .single();
    console.log('Doctor profile in DB:', docProf, 'Error:', dErr);
  }

  await client.auth.signOut();
}

async function main() {
  await inspect('dr.sharma@clinicflow.demo');
  await inspect('reception@clinicflow.demo');
}

main();
