-- ==============================================================================
-- ClinicFlow — Seed Data Script
-- Digital Clinic Management SaaS Platform (BCSE408L Cloud Computing)
-- Note: Fixed deterministic UUIDs are used for clean relational integrity.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Seed Departments
-- ------------------------------------------------------------------------------
INSERT INTO public.departments (id, name, code, description, is_active) VALUES
('d1000000-0000-0000-0000-000000000001', 'Cardiology', 'CARD', 'Diagnosis, treatment and management of cardiovascular conditions and heart disorders.', true),
('d1000000-0000-0000-0000-000000000002', 'Pediatrics', 'PEDS', 'Comprehensive healthcare and developmental screening for infants, children, and adolescents.', true),
('d1000000-0000-0000-0000-000000000003', 'Orthopedics', 'ORTH', 'Specialized care for bones, joints, ligaments, tendons, and musculoskeletal trauma.', true),
('d1000000-0000-0000-0000-000000000004', 'General Medicine', 'GENM', 'Primary clinical care, chronic disease management, and preventive medical health.', true),
('d1000000-0000-0000-0000-000000000005', 'Dermatology', 'DERM', 'Clinical and procedural management of skin, hair, nails, and cutaneous disorders.', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. Seed Specializations
-- ------------------------------------------------------------------------------
INSERT INTO public.specializations (id, department_id, name, description, is_active) VALUES
('s1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'Interventional Cardiology', 'Catheter-based structural heart and vascular interventions', true),
('s1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', 'Electrophysiology & Arrhythmia', 'Cardiac rhythm management, pacemakers, and ablation', true),
('s1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000002', 'General Pediatrics', 'Neonatal care, immunizations, and pediatric wellness', true),
('s1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000002', 'Pediatric Pulmonology', 'Pediatric asthma, allergies, and respiratory therapy', true),
('s1000000-0000-0000-0000-000000000005', 'd1000000-0000-0000-0000-000000000003', 'Joint Replacement & Arthroscopy', 'Hip and knee arthroplasty and ligament reconstructions', true),
('s1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000003', 'Sports Medicine & Spine Care', 'Musculoskeletal rehabilitation and spinal interventions', true),
('s1000000-0000-0000-0000-000000000007', 'd1000000-0000-0000-0000-000000000004', 'Internal Medicine', 'Adult systemic diseases and metabolic syndrome', true),
('s1000000-0000-0000-0000-000000000008', 'd1000000-0000-0000-0000-000000000005', 'Clinical Dermatology', 'Psoriasis, eczema, acne, and cutaneous therapeutics', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. Seed User Profiles (Auth users are represented with static UUIDs)
-- ------------------------------------------------------------------------------

-- Admin
INSERT INTO public.profiles (id, role, full_name, email, phone, is_active) VALUES
('a1000000-0000-0000-0000-000000000001', 'admin', 'Dr. Arvind Mehra (Administrator)', 'admin@clinicflow.demo', '+91 98401 23456', true)
ON CONFLICT (id) DO NOTHING;

-- Doctors
INSERT INTO public.profiles (id, role, full_name, email, phone, is_active) VALUES
('d2000000-0000-0000-0000-000000000001', 'doctor', 'Dr. Rajesh Sharma', 'dr.sharma@clinicflow.demo', '+91 98765 43210', true),
('d2000000-0000-0000-0000-000000000002', 'doctor', 'Dr. Priya Patel', 'dr.patel@clinicflow.demo', '+91 98765 43211', true),
('d2000000-0000-0000-0000-000000000003', 'doctor', 'Dr. Ananya Iyer', 'dr.ananya@clinicflow.demo', '+91 98765 43212', true)
ON CONFLICT (id) DO NOTHING;

-- Receptionist
INSERT INTO public.profiles (id, role, full_name, email, phone, is_active) VALUES
('r1000000-0000-0000-0000-000000000001', 'receptionist', 'Sunita Rao (Front Desk)', 'reception@clinicflow.demo', '+91 98400 11223', true)
ON CONFLICT (id) DO NOTHING;

-- Patients (10 realistic clinical patient records)
INSERT INTO public.profiles (id, role, full_name, email, phone, is_active) VALUES
('p1000000-0000-0000-0000-000000000001', 'patient', 'Vikramaditya Verma', 'patient1@clinicflow.demo', '+91 98111 00001', true),
('p1000000-0000-0000-0000-000000000002', 'patient', 'Deepika Sundaram', 'patient2@clinicflow.demo', '+91 98111 00002', true),
('p1000000-0000-0000-0000-000000000003', 'patient', 'Kavitha Nambiar', 'patient3@clinicflow.demo', '+91 98111 00003', true),
('p1000000-0000-0000-0000-000000000004', 'patient', 'Rohan Sengupta', 'patient4@clinicflow.demo', '+91 98111 00004', true),
('p1000000-0000-0000-0000-000000000005', 'patient', 'Sneha Kulkarni', 'patient5@clinicflow.demo', '+91 98111 00005', true),
('p1000000-0000-0000-0000-000000000006', 'patient', 'Arjun Kapoor', 'patient6@clinicflow.demo', '+91 98111 00006', true),
('p1000000-0000-0000-0000-000000000007', 'patient', 'Meera Subramanian', 'patient7@clinicflow.demo', '+91 98111 00007', true),
('p1000000-0000-0000-0000-000000000008', 'patient', 'Harish Chandra', 'patient8@clinicflow.demo', '+91 98111 00008', true),
('p1000000-0000-0000-0000-000000000009', 'patient', 'Pooja Bhattacharya', 'patient9@clinicflow.demo', '+91 98111 00009', true),
('p1000000-0000-0000-0000-000000000010', 'patient', 'Naveen Reddy', 'patient10@clinicflow.demo', '+91 98111 00010', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. Seed Doctor Profiles Details
-- ------------------------------------------------------------------------------
INSERT INTO public.doctor_profiles (
    id, department_id, specialization_id, license_number, consultation_fee, bio, room_number,
    available_days, start_time, end_time, slot_duration_minutes
) VALUES
('d2000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 's1000000-0000-0000-0000-000000000001', 'MCI-CARD-88321', 800.00, 'Senior Consultant Interventional Cardiologist with 14+ years experience in coronary interventions and preventative cardiology.', 'Consultation Room 102 (1st Floor)', ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], '09:00:00', '17:00:00', 30),
('d2000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000002', 's1000000-0000-0000-0000-000000000003', 'MCI-PEDS-55194', 600.00, 'Pediatrician specializing in child development, immunizations, and pediatric wellness care.', 'Consultation Room 204 (2nd Floor)', ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], '09:30:00', '16:30:00', 30),
('d2000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000003', 's1000000-0000-0000-0000-000000000005', 'MCI-ORTH-23945', 750.00, 'Orthopedic surgeon with expertise in joint replacement, sports injury rehabilitation, and arthroscopy.', 'Consultation Room 301 (3rd Floor)', ARRAY['Monday', 'Wednesday', 'Friday', 'Saturday'], '10:00:00', '18:00:00', 30)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 5. Seed Patient Profiles Details
-- ------------------------------------------------------------------------------
INSERT INTO public.patient_profiles (
    id, date_of_birth, gender, blood_group, emergency_contact_name, emergency_contact_phone, address, allergies, medical_history_summary
) VALUES
('p1000000-0000-0000-0000-000000000001', '1984-06-15', 'male', 'O+', 'Ananya Verma (Spouse)', '+91 98111 99991', '42 Gandhi Nagar, Adyar, Chennai - 600020', 'Penicillin, Sulfa drugs', 'History of mild hypertension managed with lifestyle modifications.'),
('p1000000-0000-0000-0000-000000000002', '1992-11-20', 'female', 'B+', 'Karthik Sundaram (Brother)', '+91 98111 99992', '18 Anna Salai, T. Nagar, Chennai - 600017', 'Dust mites, Shellfish', 'Seasonal allergic rhinitis and mild asthma.'),
('p1000000-0000-0000-0000-000000000003', '1976-03-10', 'female', 'A+', 'Madhavan Nambiar (Spouse)', '+91 98111 99993', '77 Harrington Road, Chetpet, Chennai - 600031', 'No known drug allergies', 'Type 2 Diabetes Mellitus diagnosed 2019, well-controlled.'),
('p1000000-0000-0000-0000-000000000004', '2018-08-04', 'male', 'O-', 'Debashish Sengupta (Father)', '+91 98111 99994', '12 Velachery Main Road, Chennai - 600042', 'Peanuts', 'Pediatric patient; completed primary immunization schedule.'),
('p1000000-0000-0000-0000-000000000005', '1990-01-25', 'female', 'AB+', 'Vijay Kulkarni (Father)', '+91 98111 99995', '56 GST Road, Tambaram, Chennai - 600045', 'Aspirin', 'Occasional migraine headaches, normal BMI.'),
('p1000000-0000-0000-0000-000000000006', '1988-09-12', 'male', 'A-', 'Renu Kapoor (Mother)', '+91 98111 99996', '88 ECR, Thiruvanmiyur, Chennai - 600041', 'No known allergies', 'Right knee ACL sprain from sports in 2022.'),
('p1000000-0000-0000-0000-000000000007', '1965-04-18', 'female', 'O+', 'Suresh Subramanian (Son)', '+91 98111 99997', '34 Cathedral Road, Gopalapuram, Chennai - 600086', 'Ciprofloxacin', 'Osteoarthritis of bilateral knees and lumbar spondylosis.'),
('p1000000-0000-0000-0000-000000000008', '1981-12-05', 'male', 'B-', 'Geeta Chandra (Spouse)', '+91 98111 99998', '29 OMR, Sholinganallur, Chennai - 600119', 'No known drug allergies', 'Dyslipidemia on Atorvastatin.'),
('p1000000-0000-0000-0000-000000000009', '2016-02-14', 'female', 'A+', 'Sourav Bhattacharya (Father)', '+91 98111 99999', '15 Luz Church Road, Mylapore, Chennai - 600004', 'Egg whites', 'Childhood eczema; routine growth milestones normal.'),
('p1000000-0000-0000-0000-000000000010', '1995-07-29', 'male', 'AB-', 'Preethi Reddy (Sister)', '+91 98111 99910', '92 Nungambakkam High Road, Chennai - 600034', 'No known drug allergies', 'No significant prior chronic illness.')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 6. Seed Sample Appointments
-- ------------------------------------------------------------------------------
-- Past Completed Appointments
INSERT INTO public.appointments (
    id, patient_id, doctor_id, appointment_date, start_time, end_time, status, chief_complaint
) VALUES
('b1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '3 days', '10:00:00', '10:30:00', 'completed', 'Chest tightness during morning brisk walking and mild shortness of breath.'),
('b1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000004', 'd2000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '2 days', '11:00:00', '11:30:00', 'completed', 'Persistent dry cough for 5 days with mild evening fever.'),
('b1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000006', 'd2000000-0000-0000-0000-000000000003', CURRENT_DATE - INTERVAL '1 day', '14:00:00', '14:30:00', 'completed', 'Right knee pain and clicking sensation when climbing stairs.'),
-- Today's Appointments
('b1000000-0000-0000-0000-000000000004', 'p1000000-0000-0000-0000-000000000003', 'd2000000-0000-0000-0000-000000000001', CURRENT_DATE, '09:30:00', '10:00:00', 'confirmed', 'Routine diabetic cardiac clearance & blood pressure review.'),
('b1000000-0000-0000-0000-000000000005', 'p1000000-0000-0000-0000-000000000002', 'd2000000-0000-0000-0000-000000000001', CURRENT_DATE, '10:30:00', '11:00:00', 'confirmed', 'Occasional palpitations after heavy exercise and fatigue.'),
('b1000000-0000-0000-0000-000000000006', 'p1000000-0000-0000-0000-000000000009', 'd2000000-0000-0000-0000-000000000002', CURRENT_DATE, '11:30:00', '12:00:00', 'confirmed', 'Vaccination booster review and skin rash examination.'),
('b1000000-0000-0000-0000-000000000007', 'p1000000-0000-0000-0000-000000000007', 'd2000000-0000-0000-0000-000000000003', CURRENT_DATE, '14:30:00', '15:00:00', 'confirmed', 'Follow-up for knee joint osteoarthritis and physical therapy review.'),
-- Future Appointments
('b1000000-0000-0000-0000-000000000008', 'p1000000-0000-0000-0000-000000000005', 'd2000000-0000-0000-0000-000000000001', CURRENT_DATE + INTERVAL '2 days', '10:00:00', '10:30:00', 'confirmed', 'Annual preventive cardiac checkup.'),
('b1000000-0000-0000-0000-000000000009', 'p1000000-0000-0000-0000-000000000008', 'd2000000-0000-0000-0000-000000000003', CURRENT_DATE + INTERVAL '3 days', '15:00:00', '15:30:00', 'confirmed', 'Lower back stiffness and ergonomic consultation.'),
('b1000000-0000-0000-0000-000000000010', 'p1000000-0000-0000-0000-000000000010', 'd2000000-0000-0000-0000-000000000002', CURRENT_DATE + INTERVAL '4 days', '11:00:00', '11:30:00', 'cancelled', 'Routine health checkup')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 7. Seed Medical Records (for Completed Consultations)
-- ------------------------------------------------------------------------------
INSERT INTO public.medical_records (
    id, appointment_id, patient_id, doctor_id, chief_complaint, vital_signs,
    clinical_notes, diagnosis, treatment_plan, follow_up_date, follow_up_notes
) VALUES
(
    'm1000000-0000-0000-0000-000000000001',
    'b1000000-0000-0000-0000-000000000001',
    'p1000000-0000-0000-0000-000000000001',
    'd2000000-0000-0000-0000-000000000001',
    'Chest tightness during morning brisk walking and mild shortness of breath.',
    '{"bp": "138/88", "pulse": 78, "temp": 98.4, "weight": 74.5, "height": 174, "spo2": 98}'::jsonb,
    'Patient presents with exertion-induced retrosternal tightness, resolving with rest. Heart sounds S1 S2 normal, no murmurs. ECG showed sinus rhythm with minimal ST-T wave changes. Baseline lipid panel ordered.',
    'Stable Angina Pectoris / Essential Hypertension Stage 1 (ICD-10 I20.9)',
    '1. Initiate beta-blocker and statin therapy.\n2. Low sodium, heart-healthy DASH diet.\n3. Schedule Treadmill Stress Test (TMT) and 2D-Echocardiogram next week.\n4. Avoid strenuous unconditioned exertion.',
    CURRENT_DATE + INTERVAL '14 days',
    'Review TMT and Echo reports; re-evaluate dosage.'
),
(
    'm1000000-0000-0000-0000-000000000002',
    'b1000000-0000-0000-0000-000000000002',
    'p1000000-0000-0000-0000-000000000004',
    'd2000000-0000-0000-0000-000000000002',
    'Persistent dry cough for 5 days with mild evening fever.',
    '{"bp": "95/60", "pulse": 96, "temp": 99.8, "weight": 21.0, "height": 112, "spo2": 99}'::jsonb,
    'Pediatric patient alert, throat mildly congested, bilateral breath sounds vesicular with scattered rhonchi. No stridor or respiratory distress. Good fluid intake.',
    'Acute Viral Bronchitis / Upper Respiratory Tract Infection (ICD-10 J20.9)',
    '1. Symptomatic relief with pediatric cough syrup.\n2. Paracetamol for fever spikes > 100°F.\n3. Saline nasal drops and steam inhalation.\n4. Increase warm fluids; watch for rapid breathing.',
    CURRENT_DATE + INTERVAL '5 days',
    'Follow up if fever persists beyond 3 days or cough worsens.'
),
(
    'm1000000-0000-0000-0000-000000000003',
    'b1000000-0000-0000-0000-000000000003',
    'p1000000-0000-0000-0000-000000000006',
    'd2000000-0000-0000-0000-000000000003',
    'Right knee pain and clicking sensation when climbing stairs.',
    '{"bp": "122/78", "pulse": 70, "temp": 98.6, "weight": 76.0, "height": 178, "spo2": 99}'::jsonb,
    'Mild joint effusion at right knee. McMurrays test mildly positive for medial meniscus. Lachman test negative. Stable collateral ligaments. Full range of motion with discomfort at terminal flexion.',
    'Medial Meniscus Tear, Right Knee - Mild/Grade 1 (ICD-10 M23.2)',
    '1. RICE protocol (Rest, Ice, Compression, Elevation).\n2. Quadriceps and hamstring strengthening physiotherapy.\n3. Short course NSAIDs for inflammation.\n4. Avoid squatting and high-impact running for 3 weeks.',
    CURRENT_DATE + INTERVAL '21 days',
    'Assess response to physiotherapy; consider MRI if mechanical locking develops.'
)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 8. Seed Structured Prescriptions
-- ------------------------------------------------------------------------------
INSERT INTO public.prescriptions (
    id, medical_record_id, patient_id, doctor_id, medication_name, dosage, frequency, duration, instructions
) VALUES
-- Prescriptions for Medical Record 1 (Cardiology)
('rx000000-0000-0000-0000-000000000001', 'm1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000001', 'Aspirin Gastro-resistant', '75 mg', '1-0-0 (Once daily after lunch)', '30 days', 'Take with a glass of water. Do not crush.'),
('rx000000-0000-0000-0000-000000000002', 'm1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000001', 'Metoprolol Tartrate', '25 mg', '1-0-1 (Twice daily after meals)', '30 days', 'Check pulse before taking; maintain steady timing.'),
('rx000000-0000-0000-0000-000000000003', 'm1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000001', 'Atorvastatin', '20 mg', '0-0-1 (Once daily at bedtime)', '30 days', 'Take at night after food.'),
-- Prescriptions for Medical Record 2 (Pediatrics)
('rx000000-0000-0000-0000-000000000004', 'm1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000004', 'd2000000-0000-0000-0000-000000000002', 'Paracetamol Pediatric Syrup 250mg/5ml', '5 ml', 'SOS (When temp > 100°F, max 3 times/day)', '3 days', 'Keep 6 hours minimum gap between doses.'),
('rx000000-0000-0000-0000-000000000005', 'm1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000002', 'd2000000-0000-0000-0000-000000000002', 'Levocetirizine + Montelukast Syrup', '5 ml', '0-0-1 (At bedtime)', '5 days', 'Shake bottle well before use.'),
-- Prescriptions for Medical Record 3 (Orthopedics)
('rx000000-0000-0000-0000-000000000006', 'm1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000006', 'd2000000-0000-0000-0000-000000000003', 'Aceclofenac + Paracetamol (100mg/325mg)', '1 tablet', '1-0-1 (After food)', '5 days', 'Take strictly after food to avoid gastric irritation.'),
('rx000000-0000-0000-0000-000000000007', 'm1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000003', 'd2000000-0000-0000-0000-000000000003', 'Pantoprazole', '40 mg', '1-0-0 (Morning empty stomach)', '5 days', 'Take 30 mins before breakfast.'),
('rx000000-0000-0000-0000-000000000008', 'm1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000003', 'd2000000-0000-0000-0000-000000000003', 'Glucosamine Sulfate + Chondroitin', '1 tablet', '0-1-0 (After lunch)', '30 days', 'Joint cartilage nutritional support.')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 9. Seed Sample Notifications
-- ------------------------------------------------------------------------------
INSERT INTO public.notifications (user_id, title, message, type, is_read, link) VALUES
('p1000000-0000-0000-0000-000000000001', 'Medical Record Ready', 'Dr. Rajesh Sharma has recorded your consultation notes and prescription for your visit.', 'record_ready', false, '/patient/records'),
('p1000000-0000-0000-0000-000000000003', 'Appointment Reminder', 'You have an appointment today at 09:30 AM with Dr. Rajesh Sharma.', 'appointment_confirmed', false, '/patient/appointments'),
('d2000000-0000-0000-0000-000000000001', 'Today Schedule', 'You have 2 consultations scheduled for today.', 'system', false, '/doctor/appointments'),
('r1000000-0000-0000-0000-000000000001', 'Clinic Ready', 'ClinicFlow front desk station initialized for today.', 'system', true, '/receptionist/dashboard')
ON CONFLICT (id) DO NOTHING;
