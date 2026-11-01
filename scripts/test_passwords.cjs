const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wqhqpcbbzhtqbriglwlt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxaHFwY2Jiemh0cWJyaWdsd2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NzI3NzEsImV4cCI6MjEwNTE0ODc3MX0.lgjS3jtSt8W8ltlEcuMx-MNcHoXtcp1vsr3Ms26jyzQ';

const client = createClient(supabaseUrl, supabaseAnonKey);

const passwords = [
  'Demo@1234',
  'Demo@123',
  'demo@1234',
  'Demo1234',
  'demo1234',
  'Password123!',
  'Password@123',
  'password',
  '12345678',
  'ClinicFlow@2026',
  'ClinicFlow123'
];

async function checkPasswords(email) {
  console.log(`Checking passwords for: ${email}`);
  for (const pw of passwords) {
    const { data, error } = await client.auth.signInWithPassword({ email, password: pw });
    if (!error) {
      console.log(` SUCCESS! Password for ${email} is: ${pw}`);
      return;
    } else if (!error.message.includes('Invalid login credentials')) {
      console.log(` Note for ${pw}: ${error.message}`);
    }
  }
  console.log(` None of the passwords matched for ${email}`);
}

async function main() {
  await checkPasswords('dr.sharma@clinicflow.demo');
  await checkPasswords('reception@clinicflow.demo');
}

main();
