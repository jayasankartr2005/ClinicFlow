// ClinicFlow Full Cloud Setup Script
// Creates all demo users via Supabase Admin API (service_role key)
// Usage: node scripts/full_setup.cjs YOUR_SERVICE_ROLE_KEY
// Get service role key: Supabase Dashboard > Project Settings > API > service_role (secret)

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://wqhqpcbbzhtqbriglwlt.supabase.co';
const SERVICE_ROLE_KEY = process.argv[2];

if (!SERVICE_ROLE_KEY) {
  console.error('Usage: node scripts/full_setup.cjs SERVICE_ROLE_KEY');
  console.error('Get your key: Supabase Dashboard > Project Settings > API > service_role');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const APOLLO_ID = 'a1000000-0000-0000-0000-000000000001';
const KAUVERY_ID = 'a1000000-0000-0000-0000-000000000002';

const DEMO_USERS = [
  {
    email: 'super@clinicflow.demo',
    password: 'Demo@1234',
    full_name: 'Super Coordinator',
    role: 'supercoordinator',
    phone: '+91 90000 00001',
    hospital_id: null,
  },
  {
    email: 'admin@clinicflow.demo',
    password: 'Demo@1234',
    full_name: 'Dr. Arvind Mehra',
    role: 'admin',
    phone: '+91 98401 23456',
    hospital_id: APOLLO_ID,
  },
  {
    email: 'dr.sharma@clinicflow.demo',
    password: 'Demo@1234',
    full_name: 'Dr. Rajesh Sharma',
    role: 'doctor',
    phone: '+91 98765 43210',
    hospital_id: APOLLO_ID,
  },
  {
    email: 'reception@clinicflow.demo',
    password: 'Demo@1234',
    full_name: 'Sunita Rao',
    role: 'receptionist',
    phone: '+91 98400 11223',
    hospital_id: APOLLO_ID,
  },
];

async function main() {
  console.log('\n=== ClinicFlow Full Cloud Setup ===\n');

  // Step 1: Seed hospitals
  console.log('[1/6] Seeding hospitals...');
  const { error: hErr } = await admin.from('hospitals').upsert([
    {
      id: APOLLO_ID,
      name: 'Apollo Health Centre',
      address: '21 Greams Road, Chennai, Tamil Nadu 600006',
      phone: '+91 44 2829 3333',
      email: 'info@apollo.demo',
      website: 'https://apollohospitals.com',
      registration_number: 'TN-HOS-20010042',
      is_active: true,
    },
    {
      id: KAUVERY_ID,
      name: 'Kauvery Hospital',
      address: '199 Luz Church Road, Mylapore, Chennai 600004',
      phone: '+91 44 4000 6000',
      email: 'info@kauvery.demo',
      website: 'https://kauveryhospital.com',
      registration_number: 'TN-HOS-20050127',
      is_active: true,
    },
  ], { onConflict: 'id' });
  if (hErr) console.error('  ERROR:', hErr.message);
  else console.log('  OK - 2 hospitals seeded');

  // Step 2: List existing auth users
  console.log('\n[2/6] Checking existing auth users...');
  const { data: ul, error: ulErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (ulErr) { console.error('  Cannot list users:', ulErr.message); process.exit(1); }
  const existingMap = {};
  (ul.users || []).forEach(u => { existingMap[u.email] = u.id; });
  console.log('  Found', ul.users.length, 'existing auth users');

  // Step 3: Create/update demo users
  console.log('\n[3/6] Creating/updating demo auth users...');
  const userIds = {};
  for (const u of DEMO_USERS) {
    if (existingMap[u.email]) {
      const { error } = await admin.auth.admin.updateUserById(existingMap[u.email], {
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.full_name, role: u.role, phone: u.phone },
      });
      if (error) console.error('  UPDATE FAILED:', u.email, '-', error.message);
      else console.log('  Updated:', u.email, '(' + existingMap[u.email] + ')');
      userIds[u.email] = existingMap[u.email];
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { full_name: u.full_name, role: u.role, phone: u.phone },
      });
      if (error) { console.error('  CREATE FAILED:', u.email, '-', error.message); continue; }
      console.log('  Created:', u.email, '(' + data.user.id + ')');
      userIds[u.email] = data.user.id;
    }
  }

  // Step 4: Fix profiles with correct roles and hospital IDs
  console.log('\n[4/6] Setting up profiles with correct roles...');
  for (const u of DEMO_USERS) {
    const id = userIds[u.email];
    if (!id) { console.warn('  SKIP (no ID):', u.email); continue; }
    const { error } = await admin.from('profiles').upsert({
      id,
      email: u.email,
      full_name: u.full_name,
      role: u.role,
      hospital_id: u.hospital_id,
      phone: u.phone,
      is_active: true,
    }, { onConflict: 'id' });
    if (error) console.error('  PROFILE ERROR:', u.email, '-', error.message);
    else console.log('  Profile OK:', u.role.padEnd(18), u.full_name);
  }

  // Step 5: Seed departments
  console.log('\n[5/6] Seeding departments and specializations...');
  const { error: dErr } = await admin.from('departments').upsert([
    { id: 'd1000000-0000-0000-0000-000000000001', hospital_id: APOLLO_ID, name: 'Cardiology', code: 'CARD', description: 'Cardiovascular conditions and heart disorders', is_active: true },
    { id: 'd1000000-0000-0000-0000-000000000002', hospital_id: APOLLO_ID, name: 'Neurology', code: 'NEUR', description: 'Brain, spine and nervous system disorders', is_active: true },
    { id: 'd1000000-0000-0000-0000-000000000003', hospital_id: APOLLO_ID, name: 'Orthopedics', code: 'ORTH', description: 'Musculoskeletal system and bone disorders', is_active: true },
    { id: 'd1000000-0000-0000-0000-000000000004', hospital_id: APOLLO_ID, name: 'General Medicine', code: 'GENM', description: 'General outpatient and internal medicine', is_active: true },
    { id: 'd1000000-0000-0000-0000-000000000005', hospital_id: APOLLO_ID, name: 'Pediatrics', code: 'PEDI', description: 'Child and adolescent healthcare', is_active: true },
  ], { onConflict: 'id' });
  if (dErr) console.error('  DEPT ERROR:', dErr.message);
  else console.log('  OK - 5 departments seeded');

  const { error: sErr } = await admin.from('specializations').upsert([
    { id: 'e1000000-0000-0000-0000-000000000001', department_id: 'd1000000-0000-0000-0000-000000000001', name: 'Interventional Cardiology', description: 'Catheter-based structural heart interventions', is_active: true },
    { id: 'e1000000-0000-0000-0000-000000000002', department_id: 'd1000000-0000-0000-0000-000000000001', name: 'Electrophysiology', description: 'Heart rhythm disorders', is_active: true },
    { id: 'e1000000-0000-0000-0000-000000000003', department_id: 'd1000000-0000-0000-0000-000000000002', name: 'Stroke Neurology', description: 'Stroke prevention and rehabilitation', is_active: true },
    { id: 'e1000000-0000-0000-0000-000000000004', department_id: 'd1000000-0000-0000-0000-000000000003', name: 'Joint Replacement', description: 'Hip, knee and shoulder replacement', is_active: true },
    { id: 'e1000000-0000-0000-0000-000000000005', department_id: 'd1000000-0000-0000-0000-000000000004', name: 'Internal Medicine', description: 'Diagnosis and treatment of adult diseases', is_active: true },
  ], { onConflict: 'id' });
  if (sErr) console.error('  SPEC ERROR:', sErr.message);
  else console.log('  OK - 5 specializations seeded');

  // Step 6: Seed doctor profile for Dr. Rajesh Sharma
  console.log('\n[6/6] Creating doctor profile for Dr. Rajesh Sharma...');
  const drId = userIds['dr.sharma@clinicflow.demo'];
  if (drId) {
    const { error } = await admin.from('doctor_profiles').upsert({
      id: drId,
      hospital_id: APOLLO_ID,
      department_id: 'd1000000-0000-0000-0000-000000000001',
      specialization_id: 'e1000000-0000-0000-0000-000000000001',
      license_number: 'MCI-CARD-88321',
      consultation_fee: 800,
      bio: 'Senior Consultant Interventional Cardiologist with 14+ years of clinical experience in complex cardiac procedures.',
      room_number: 'Consultation Room 102 (1st Floor)',
      available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      start_time: '09:00:00',
      end_time: '17:00:00',
      slot_duration_minutes: 30,
    }, { onConflict: 'id' });
    if (error) console.error('  DOC PROFILE ERROR:', error.message);
    else console.log('  OK - Doctor profile seeded');
  } else {
    console.warn('  SKIP - Could not get Dr. Sharma user ID');
  }

  // Summary
  console.log('\n=== Setup Complete! ===');
  console.log('');
  console.log('Demo Login Credentials:');
  console.log('  supercoordinator  | super@clinicflow.demo        | Demo@1234');
  console.log('  admin             | admin@clinicflow.demo         | Demo@1234');
  console.log('  doctor            | dr.sharma@clinicflow.demo     | Demo@1234');
  console.log('  receptionist      | reception@clinicflow.demo     | Demo@1234');
  console.log('');
  console.log('Next: Deploy edge function:');
  console.log('  npx supabase functions deploy create-staff-user --project-ref wqhqpcbbzhtqbriglwlt');

  process.exit(0);
}

main().catch(e => {
  console.error('Fatal error:', e.message || e);
  process.exit(1);
});
