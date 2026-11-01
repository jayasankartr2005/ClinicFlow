const { createClient } = require('@supabase/supabase-js');

const url = 'https://wqhqpcbbzhtqbriglwlt.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxaHFwY2Jiemh0cWJyaWdsd2x0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk1NzI3NzEsImV4cCI6MjEwNTE0ODc3MX0.lgjS3jtSt8W8ltlEcuMx-MNcHoXtcp1vsr3Ms26jyzQ';
const supabase = createClient(url, key, {
  auth: { persistSession: false }
});

async function main() {
  try {
    console.log('Logging in as supercoordinator...');
    const { data: { session }, error: signErr } = await supabase.auth.signInWithPassword({
      email: 'super@clinicflow.demo',
      password: 'Demo@1234'
    });
    if (signErr) throw signErr;
    console.log('Logged in as Supercoordinator successfully.');

    // 1. Get Apollo Hospital ID
    const { data: hosp, error: hErr } = await supabase
      .from('hospitals')
      .select('id, name')
      .ilike('name', '%Apollo%')
      .single();
    if (hErr) throw hErr;
    const apolloId = hosp.id;
    console.log('Apollo Hospital:', apolloId, hosp.name);

    // 2. Fix admin profile
    const { data: pAdmin, error: pAdminErr } = await supabase
      .from('profiles')
      .update({
        role: 'admin',
        hospital_id: apolloId,
        full_name: 'Dr. Arvind Mehra (Administrator)',
        phone: '+91 98401 23456'
      })
      .eq('email', 'admin@clinicflow.demo')
      .select();
    console.log('Admin profile updated:', pAdmin, 'Error:', pAdminErr);

    // 3. Fix dr.sharma profile
    const { data: pDoc, error: pDocErr } = await supabase
      .from('profiles')
      .update({
        role: 'doctor',
        hospital_id: apolloId,
        full_name: 'Dr. Rajesh Sharma',
        phone: '+91 98765 43210'
      })
      .eq('email', 'dr.sharma@clinicflow.demo')
      .select();
    console.log('Doctor profile updated:', pDoc, 'Error:', pDocErr);

    // 4. Fix reception profile
    const { data: pRec, error: pRecErr } = await supabase
      .from('profiles')
      .update({
        role: 'receptionist',
        hospital_id: apolloId,
        full_name: 'Sunita Rao (Front Desk)',
        phone: '+91 98400 11223'
      })
      .eq('email', 'reception@clinicflow.demo')
      .select();
    console.log('Receptionist profile updated:', pRec, 'Error:', pRecErr);

    // 5. Upsert Departments
    const { data: depts, error: dErr } = await supabase.from('departments').upsert([
      { id: 'd1000000-0000-0000-0000-000000000001', hospital_id: apolloId, name: 'Cardiology', code: 'CARD', description: 'Cardiovascular conditions and heart disorders', is_active: true },
      { id: 'd1000000-0000-0000-0000-000000000002', hospital_id: apolloId, name: 'Neurology', code: 'NEUR', description: 'Brain, spine and nervous system disorders', is_active: true },
      { id: 'd1000000-0000-0000-0000-000000000003', hospital_id: apolloId, name: 'Orthopedics', code: 'ORTH', description: 'Musculoskeletal system and bone disorders', is_active: true },
      { id: 'd1000000-0000-0000-0000-000000000004', hospital_id: apolloId, name: 'General Medicine', code: 'GENM', description: 'General outpatient and internal medicine', is_active: true },
      { id: 'd1000000-0000-0000-0000-000000000005', hospital_id: apolloId, name: 'Pediatrics', code: 'PEDI', description: 'Child and adolescent healthcare', is_active: true }
    ]).select();
    console.log('Departments seeded:', depts?.length, 'Error:', dErr);

    // 6. Log in as admin to seed specializations and doctor profiles (allowed by is_admin() policy)
    console.log('Logging in as Admin (admin@clinicflow.demo)...');
    const { error: adminSignErr } = await supabase.auth.signInWithPassword({
      email: 'admin@clinicflow.demo',
      password: 'Demo@1234'
    });
    if (adminSignErr) throw adminSignErr;
    console.log('Logged in as Admin successfully.');

    // Upsert Specializations
    const { data: specs, error: sErr } = await supabase.from('specializations').upsert([
      { id: 'e1000000-0000-0000-0000-000000000001', department_id: 'd1000000-0000-0000-0000-000000000001', name: 'Interventional Cardiology', description: 'Catheter-based structural heart interventions', is_active: true },
      { id: 'e1000000-0000-0000-0000-000000000002', department_id: 'd1000000-0000-0000-0000-000000000001', name: 'Electrophysiology', description: 'Heart rhythm disorders', is_active: true },
      { id: 'e1000000-0000-0000-0000-000000000003', department_id: 'd1000000-0000-0000-0000-000000000002', name: 'Stroke Neurology', description: 'Stroke prevention and rehabilitation', is_active: true },
      { id: 'e1000000-0000-0000-0000-000000000004', department_id: 'd1000000-0000-0000-0000-000000000003', name: 'Joint Replacement', description: 'Hip, knee and shoulder replacement', is_active: true },
      { id: 'e1000000-0000-0000-0000-000000000005', department_id: 'd1000000-0000-0000-0000-000000000004', name: 'Internal Medicine', description: 'Diagnosis and treatment of adult diseases', is_active: true }
    ]).select();
    console.log('Specializations seeded:', specs?.length, 'Error:', sErr);

    // 7. Upsert Doctor Profile for Dr. Rajesh Sharma
    if (pDoc && pDoc.length > 0) {
      const docId = pDoc[0].id;
      const { data: docProf, error: dpErr } = await supabase.from('doctor_profiles').upsert({
        id: docId,
        department_id: 'd1000000-0000-0000-0000-000000000001',
        specialization_id: 'e1000000-0000-0000-0000-000000000001',
        license_number: 'MCI-CARD-88321',
        consultation_fee: 800,
        bio: 'Senior Consultant Interventional Cardiologist with 14+ years experience.',
        room_number: 'Consultation Room 102 (1st Floor)',
        available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        start_time: '09:00:00',
        end_time: '17:00:00',
        slot_duration_minutes: 30
      }).select();
      console.log('Doctor profile seeded:', docProf, 'Error:', dpErr);
    }

    console.log('Setup finished successfully!');
  } catch (err) {
    console.error('Fatal error in setup:', err);
  } finally {
    process.exit(0);
  }
}

main();
