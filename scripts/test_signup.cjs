const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wqhqpcbbzhtqbriglwlt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxaHFwY2Jiemh0cWJyaWdsd2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NzI3NzEsImV4cCI6MjEwNTE0ODc3MX0.lgjS3jtSt8W8ltlEcuMx-MNcHoXtcp1vsr3Ms26jyzQ';

const client = createClient(supabaseUrl, supabaseAnonKey);

async function testSignUp(email, password, fullName, role) {
  console.log(`\nTesting signUp for ${email}...`);
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role: role,
      }
    }
  });

  if (error) {
    console.log('SignUp error:', error.message);
    return null;
  }
  console.log('SignUp success! User ID:', data.user?.id);
  console.log('Identities:', data.user?.identities);
  console.log('Session:', !!data.session);
  return data.user;
}

async function main() {
  await testSignUp('dr.sharma@clinicflow.demo', 'Demo@1234', 'Dr. Rajesh Sharma', 'doctor');
  await testSignUp('reception@clinicflow.demo', 'Demo@1234', 'Sunita Rao', 'receptionist');
}

main();
