const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wqhqpcbbzhtqbriglwlt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxaHFwY2Jiemh0cWJyaWdsd2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NzI3NzEsImV4cCI6MjEwNTE0ODc3MX0.lgjS3jtSt8W8ltlEcuMx-MNcHoXtcp1vsr3Ms26jyzQ';

const client = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin(email, password = 'Demo@1234') {
  console.log(`\nTesting login for: ${email}`);
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    console.log(`Error signing in:`, error.message);
    return;
  }
  console.log(`User ID:`, data.user.id);
  console.log(`User metadata:`, data.user.user_metadata);

  // Now query profile
  const { data: profile, error: pErr } = await client
    .from('profiles')
    .select('*, hospital:hospitals(*)')
    .eq('id', data.user.id)
    .single();

  if (pErr) {
    console.log(`Profile fetch error:`, pErr);
  } else {
    console.log(`Profile:`, profile);
  }

  if (profile && profile.role === 'doctor') {
    const { data: docProf, error: dErr } = await client
      .from('doctor_profiles')
      .select('*, department:departments(*), specialization:specializations(*)')
      .eq('id', data.user.id)
      .single();
    console.log(`Doctor profile:`, docProf, `Error:`, dErr);
  }

  await client.auth.signOut();
}

async function main() {
  await testLogin('super@clinicflow.demo');
  await testLogin('admin@clinicflow.demo');
  await testLogin('dr.sharma@clinicflow.demo');
  await testLogin('reception@clinicflow.demo');
}

main();
