const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wqhqpcbbzhtqbriglwlt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxaHFwY2Jiemh0cWJyaWdsd2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NzI3NzEsImV4cCI6MjEwNTE0ODc3MX0.lgjS3jtSt8W8ltlEcuMx-MNcHoXtcp1vsr3Ms26jyzQ';

const client = createClient(supabaseUrl, supabaseAnonKey);

async function testDoctorQueries() {
  console.log('Logging in as dr.sharma@clinicflow.demo...');
  const { data: { session }, error: sErr } = await client.auth.signInWithPassword({
    email: 'dr.sharma@clinicflow.demo',
    password: 'Demo@1234',
  });
  if (sErr) {
    console.error('Login error:', sErr);
    return;
  }
  const userId = session.user.id;
  console.log('Doctor logged in:', userId);

  // 1. Test appointment query:
  console.log('Testing appointments query...');
  const { data: appts, error: aErr } = await client
    .from('appointments')
    .select('*, patient:patients(*), doctor:profiles!appointments_doctor_id_fkey(*, doctor_profile:doctor_profiles(*, department:departments(*))), hospital:hospitals(*)')
    .eq('doctor_id', userId);

  console.log('Appointments fetched:', appts?.length, 'Error:', aErr?.message);

  // 2. Test medical records query:
  console.log('Testing medical records query...');
  const { data: records, error: mErr } = await client
    .from('medical_records')
    .select('*, patient:patients(*), doctor:profiles!medical_records_doctor_id_fkey(*), prescriptions(*), appointment:appointments(*)')
    .eq('doctor_id', userId);

  console.log('Medical records fetched:', records?.length, 'Error:', mErr?.message);

  await client.auth.signOut();
}

async function testReceptionistQueries() {
  console.log('\nLogging in as reception@clinicflow.demo...');
  const { data: { session }, error: sErr } = await client.auth.signInWithPassword({
    email: 'reception@clinicflow.demo',
    password: 'Demo@1234',
  });
  if (sErr) {
    console.error('Login error:', sErr);
    return;
  }
  console.log('Receptionist logged in:', session.user.id);

  // Test receptionist queries: patients, appointments, doctors
  const { data: patients, error: pErr } = await client
    .from('patients')
    .select('*, hospital:hospitals(*)');
  console.log('Patients fetched:', patients?.length, 'Error:', pErr?.message);

  const { data: doctors, error: dErr } = await client
    .from('profiles')
    .select('*, doctor_profile:doctor_profiles(*, department:departments(*), specialization:specializations(*))')
    .eq('role', 'doctor')
    .eq('is_active', true);
  console.log('Doctors fetched:', doctors?.length, 'Error:', dErr?.message);

  await client.auth.signOut();
}

async function main() {
  await testDoctorQueries();
  await testReceptionistQueries();
}

main();
