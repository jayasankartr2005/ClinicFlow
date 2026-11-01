const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wqhqpcbbzhtqbriglwlt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxaHFwY2Jiemh0cWJyaWdsd2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NzI3NzEsImV4cCI6MjEwNTE0ODc3MX0.lgjS3jtSt8W8ltlEcuMx-MNcHoXtcp1vsr3Ms26jyzQ';

const client = createClient(supabaseUrl, supabaseAnonKey);

async function syncPassword(email, currentPassword, newPassword = 'Demo@1234') {
  console.log(`Logging in as ${email}...`);
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password: currentPassword
  });

  if (error) {
    console.error(`Sign in error for ${email}:`, error.message);
    return;
  }

  console.log(`Signed in! Updating password to ${newPassword}...`);
  const { data: updated, error: upErr } = await client.auth.updateUser({
    password: newPassword
  });

  if (upErr) {
    console.error(`Failed to update password for ${email}:`, upErr.message);
  } else {
    console.log(` SUCCESS: Password updated to ${newPassword} for ${email}!`);
  }

  await client.auth.signOut();
}

async function main() {
  await syncPassword('dr.sharma@clinicflow.demo', 'Demo@123', 'Demo@1234');
  await syncPassword('reception@clinicflow.demo', 'Demo@123', 'Demo@1234');
}

main();
