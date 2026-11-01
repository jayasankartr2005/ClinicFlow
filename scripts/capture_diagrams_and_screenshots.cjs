const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const IMAGES_DIR = path.join(__dirname, '..', 'docs_images');
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// -----------------------------------------------------------------------------
// Diagram 1: System Architecture Diagram HTML
// -----------------------------------------------------------------------------
const systemArchHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; margin: 0; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    h1 { font-size: 24px; color: #38bdf8; margin-top: 0; text-align: center; letter-spacing: -0.5px; }
    .subtitle { text-align: center; color: #94a3b8; font-size: 14px; margin-bottom: 30px; }
    .tiers { display: flex; flex-direction: column; gap: 20px; }
    .tier { border: 2px dashed #475569; border-radius: 10px; padding: 18px; position: relative; background: rgba(30, 41, 59, 0.7); }
    .tier-title { position: absolute; top: -12px; left: 24px; background: #0284c7; color: white; padding: 2px 12px; font-size: 12px; font-weight: bold; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; }
    .nodes { display: flex; justify-content: space-around; gap: 15px; margin-top: 10px; }
    .node { flex: 1; background: #0f172a; border: 1px solid #3b82f6; border-radius: 8px; padding: 16px; text-align: center; }
    .node-title { font-weight: bold; font-size: 14px; color: #60a5fa; margin-bottom: 6px; }
    .node-desc { font-size: 12px; color: #cbd5e1; line-height: 1.4; }
    .badge { display: inline-block; background: #1e3a8a; color: #93c5fd; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; margin-top: 8px; }
    .arrow-row { text-align: center; font-size: 20px; color: #38bdf8; font-weight: bold; margin: 4px 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>ClinicFlow — System Architecture & Multi-Tenant Hierarchy</h1>
    <div class="subtitle">Decoupled 3-Tier Multi-Tenant Cloud Architecture with WhatsApp Patient Gateway</div>

    <div class="tiers">
      <!-- Tier 1 -->
      <div class="tier">
        <div class="tier-title">1. Presentation & Consumer Tier</div>
        <div class="nodes">
          <div class="node">
            <div class="node-title">Desktop / Tablet Web Client</div>
            <div class="node-desc">React 18 SPA (TypeScript + Tailwind CSS)<br>Role-Aware Routing & Real-time Dashboards</div>
            <span class="badge">Admin • Doctor • Receptionist • Supercoordinator</span>
          </div>
          <div class="node" style="border-color: #22c55e;">
            <div class="node-title" style="color: #4ade80;">WhatsApp Patient Messenger</div>
            <div class="node-desc">Native Mobile WhatsApp Application<br>Zero Web Login / Frictionless Onboarding</div>
            <span class="badge" style="background: #14532d; color: #86efac;">Patient Consumers</span>
          </div>
        </div>
      </div>

      <div class="arrow-row">▼ HTTPS REST / PostgREST &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ▼ Meta Webhook Events</div>

      <!-- Tier 2 -->
      <div class="tier">
        <div class="tier-title">2. Ingress, Edge CDN & Serverless Logic Tier</div>
        <div class="nodes">
          <div class="node">
            <div class="node-title">Vercel Global Edge Network</div>
            <div class="node-desc">Global Anycast CDN, HTTP/3, SSL Termination<br>Single-Page Application Path Rewrites</div>
            <span class="badge">Static Frontend Assets</span>
          </div>
          <div class="node" style="border-color: #06b6d4;">
            <div class="node-title" style="color: #22d3ee;">Supabase Edge Functions</div>
            <div class="node-desc">Deno Serverless Runtime (whatsapp-webhook)<br>GET Verification & POST State Machine</div>
            <span class="badge" style="background: #164e63; color: #67e8f9;">Deterministic Workflow Engine</span>
          </div>
          <div class="node" style="border-color: #8b5cf6;">
            <div class="node-title" style="color: #a78bfa;">Supabase Auth Gateway</div>
            <div class="node-desc">JWT Token Generation & Session Management<br>Role & Tenant Metadata Claims Injection</div>
            <span class="badge" style="background: #3b0764; color: #d8b4fe;">Zero-Trust RBAC</span>
          </div>
        </div>
      </div>

      <div class="arrow-row">▼ Authenticated SQL Queries &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ▼ Atomic Stored Procedure Calls</div>

      <!-- Tier 3 -->
      <div class="tier">
        <div class="tier-title">3. Managed Cloud Database Tier (Supabase PostgreSQL 15+)</div>
        <div class="nodes">
          <div class="node" style="border-color: #10b981;">
            <div class="node-title" style="color: #34d399;">Row Level Security (RLS)</div>
            <div class="node-desc">Zero-Trust Tenant Isolation by hospital_id<br>Prevents Cross-Clinic Data Leakage</div>
            <span class="badge" style="background: #064e3b; color: #6ee7b7;">PostgreSQL Engine Level</span>
          </div>
          <div class="node" style="border-color: #f59e0b;">
            <div class="node-title" style="color: #fbbf24;">Atomic Booking RPC</div>
            <div class="node-desc">book_appointment_atomic()<br>Exclusive Row Locks & Overlap Exclusion</div>
            <span class="badge" style="background: #78350f; color: #fde68a;">Anti-Double-Booking</span>
          </div>
          <div class="node" style="border-color: #ec4899;">
            <div class="node-title" style="color: #f472b6;">Audit & Event Triggers</div>
            <div class="node-desc">Automated Notification Generation<br>Tamper-Evident Audit Logging Ledger</div>
            <span class="badge" style="background: #701a75; color: #fbcfe8;">Automated Reliability</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

// -----------------------------------------------------------------------------
// Diagram 2: Cloud Architecture Diagram HTML
// -----------------------------------------------------------------------------
const cloudArchHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #090d16; color: #f8fafc; padding: 40px; margin: 0; }
    .card { background: #131d2e; border: 1px solid #1e293b; border-radius: 12px; padding: 26px; box-shadow: 0 10px 25px rgba(0,0,0,0.6); }
    h1 { font-size: 24px; color: #38bdf8; margin-top: 0; text-align: center; }
    .subtitle { text-align: center; color: #94a3b8; font-size: 13px; margin-bottom: 25px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .cloud-box { background: #0f172a; border: 2px solid #334155; border-radius: 10px; padding: 20px; }
    .cloud-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid #334155; padding-bottom: 10px; }
    .cloud-name { font-weight: bold; font-size: 16px; color: #38bdf8; }
    .cloud-badge { background: #0284c7; color: white; font-size: 11px; padding: 3px 8px; border-radius: 12px; font-weight: bold; }
    .item-list { display: flex; flex-direction: column; gap: 10px; }
    .item { background: #1e293b; padding: 12px; border-radius: 6px; border-left: 4px solid #3b82f6; font-size: 12px; }
    .item-title { font-weight: bold; color: #e2e8f0; margin-bottom: 2px; }
    .item-desc { color: #94a3b8; }
    .flow-card { grid-column: span 2; background: #1e293b; border: 1px solid #3b82f6; border-radius: 10px; padding: 16px; margin-top: 10px; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <h1>ClinicFlow — Cloud Infrastructure & Service Topology</h1>
    <div class="subtitle">Multi-Cloud Deployment Topology: Vercel Edge CDN + Supabase DBaaS + Meta Cloud API</div>

    <div class="grid">
      <!-- Box 1 -->
      <div class="cloud-box" style="border-color: #000000; box-shadow: inset 0 0 10px rgba(255,255,255,0.05);">
        <div class="cloud-header">
          <span class="cloud-name" style="color: #ffffff;">▲ Vercel Global Edge Network</span>
          <span class="cloud-badge" style="background: #333333;">Frontend Hosting</span>
        </div>
        <div class="item-list">
          <div class="item" style="border-color: #ffffff;">
            <div class="item-title">Edge CDN & Anycast Routing</div>
            <div class="item-desc">Sub-50ms static asset delivery across 100+ global edge locations with Brotli & gzip compression.</div>
          </div>
          <div class="item" style="border-color: #ffffff;">
            <div class="item-title">Automated SPA Rewrites (vercel.json)</div>
            <div class="item-desc">Path routing rules redirecting all deep routes (/supercoordinator, /doctor) to /index.html with HTTP 200.</div>
          </div>
          <div class="item" style="border-color: #ffffff;">
            <div class="item-title">Automated Git CI/CD Integration</div>
            <div class="item-desc">Zero-downtime atomic production deployments triggered on git push with instant preview branches.</div>
          </div>
        </div>
      </div>

      <!-- Box 2 -->
      <div class="cloud-box" style="border-color: #25d366;">
        <div class="cloud-header">
          <span class="cloud-name" style="color: #25d366;">Meta WhatsApp Cloud API</span>
          <span class="cloud-badge" style="background: #15803d;">Messaging Gateway</span>
        </div>
        <div class="item-list">
          <div class="item" style="border-color: #22c55e;">
            <div class="item-title">Enterprise Webhook Dispatcher</div>
            <div class="item-desc">Direct HTTPS event callbacks for incoming patient texts, interactive buttons, and delivery status receipts.</div>
          </div>
          <div class="item" style="border-color: #22c55e;">
            <div class="item-title">Graph API v21.0 Outbound Messaging</div>
            <div class="item-desc">Sends dynamic interactive appointment confirmation menus and scheduling buttons without third-party aggregators.</div>
          </div>
          <div class="item" style="border-color: #22c55e;">
            <div class="item-title">High Reliability & Zero Added Cost</div>
            <div class="item-desc">Utilizes Meta's official development sandbox with 1,000 free monthly service conversations per WABA.</div>
          </div>
        </div>
      </div>

      <!-- Box 3 -->
      <div class="cloud-box" style="grid-column: span 2; border-color: #3ecf8e;">
        <div class="cloud-header">
          <span class="cloud-name" style="color: #3ecf8e;">Supabase Cloud Backend (AWS Infrastructure)</span>
          <span class="cloud-badge" style="background: #065f46;">Managed DBaaS & Compute</span>
        </div>
        <div class="grid" style="grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
          <div class="item" style="border-color: #10b981;">
            <div class="item-title">PostgreSQL 15+ Engine</div>
            <div class="item-desc">ACID transactions, PgBouncer pooler, Row Level Security, JSONB data, and temporal overlap operators.</div>
          </div>
          <div class="item" style="border-color: #10b981;">
            <div class="item-title">Deno Serverless Edge Functions</div>
            <div class="item-desc">Low-latency Deno microservices executing the whatsapp-webhook handler with zero cold start.</div>
          </div>
          <div class="item" style="border-color: #10b981;">
            <div class="item-title">Supabase Secrets Manager</div>
            <div class="item-desc">Secure vault isolating Meta System User Tokens from public client-side JavaScript bundles.</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

// -----------------------------------------------------------------------------
// Diagram 3: Database Entity-Relationship (ER) Diagram HTML
// -----------------------------------------------------------------------------
const erDiagramHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0b1120; color: #f8fafc; padding: 35px; margin: 0; }
    .card { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.6); }
    h1 { font-size: 24px; color: #38bdf8; margin-top: 0; text-align: center; }
    .subtitle { text-align: center; color: #94a3b8; font-size: 13px; margin-bottom: 24px; }
    .er-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
    .table-card { background: #1f2937; border-radius: 8px; border: 1px solid #374151; overflow: hidden; font-size: 11px; }
    .table-header { background: #374151; padding: 8px 12px; font-weight: bold; color: #60a5fa; border-bottom: 1px solid #4b5563; display: flex; justify-content: space-between; }
    .table-header.accent { background: #1e3a8a; color: #93c5fd; }
    .table-header.green { background: #064e3b; color: #6ee7b7; }
    .table-header.purple { background: #4c1d95; color: #c4b5fd; }
    .fields { padding: 8px 12px; display: flex; flex-direction: column; gap: 4px; }
    .field { display: flex; justify-content: space-between; color: #cbd5e1; }
    .pk { color: #f59e0b; font-weight: bold; }
    .fk { color: #38bdf8; font-weight: bold; }
    .type { color: #64748b; font-size: 10px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>ClinicFlow — Relational Database Schema & Entity-Relationship Design</h1>
    <div class="subtitle">Multi-Tenant PostgreSQL 15+ Schema with Strict Foreign Keys, RLS and Exclusion Rules</div>

    <div class="er-grid">
      <!-- 1. hospitals -->
      <div class="table-card">
        <div class="table-header accent"><span>hospitals</span><span>TENANT</span></div>
        <div class="fields">
          <div class="field"><span class="pk">id (PK)</span><span class="type">UUID</span></div>
          <div class="field"><span>name</span><span class="type">VARCHAR</span></div>
          <div class="field"><span>slug</span><span class="type">VARCHAR UNIQUE</span></div>
          <div class="field"><span>whatsapp_phone_number_id</span><span class="type">VARCHAR</span></div>
          <div class="field"><span>whatsapp_enabled</span><span class="type">BOOLEAN</span></div>
          <div class="field"><span>settings</span><span class="type">JSONB</span></div>
          <div class="field"><span>created_at</span><span class="type">TIMESTAMPTZ</span></div>
        </div>
      </div>

      <!-- 2. profiles -->
      <div class="table-card">
        <div class="table-header"><span>profiles</span><span>USERS</span></div>
        <div class="fields">
          <div class="field"><span class="pk">id (PK)</span><span class="type">UUID (auth.users)</span></div>
          <div class="field"><span class="fk">hospital_id (FK)</span><span class="type">UUID</span></div>
          <div class="field"><span>role</span><span class="type">user_role ENUM</span></div>
          <div class="field"><span>full_name</span><span class="type">VARCHAR</span></div>
          <div class="field"><span>email</span><span class="type">VARCHAR</span></div>
          <div class="field"><span>phone_number</span><span class="type">VARCHAR</span></div>
          <div class="field"><span>is_active</span><span class="type">BOOLEAN</span></div>
        </div>
      </div>

      <!-- 3. doctors -->
      <div class="table-card">
        <div class="table-header"><span>doctors</span><span>STAFF</span></div>
        <div class="fields">
          <div class="field"><span class="pk">id (PK/FK)</span><span class="type">UUID -> profiles</span></div>
          <div class="field"><span class="fk">hospital_id (FK)</span><span class="type">UUID</span></div>
          <div class="field"><span>specialization</span><span class="type">VARCHAR</span></div>
          <div class="field"><span>license_number</span><span class="type">VARCHAR</span></div>
          <div class="field"><span>consultation_fee</span><span class="type">NUMERIC</span></div>
          <div class="field"><span>slot_duration</span><span class="type">INTEGER</span></div>
        </div>
      </div>

      <!-- 4. patients -->
      <div class="table-card">
        <div class="table-header green"><span>patients</span><span>PATIENTS</span></div>
        <div class="fields">
          <div class="field"><span class="pk">id (PK)</span><span class="type">UUID</span></div>
          <div class="field"><span class="fk">hospital_id (FK)</span><span class="type">UUID</span></div>
          <div class="field"><span>full_name</span><span class="type">VARCHAR</span></div>
          <div class="field"><span>whatsapp_number</span><span class="type">VARCHAR INDEX</span></div>
          <div class="field"><span>date_of_birth</span><span class="type">DATE</span></div>
          <div class="field"><span>gender</span><span class="type">VARCHAR</span></div>
          <div class="field"><span>blood_group</span><span class="type">VARCHAR</span></div>
        </div>
      </div>

      <!-- 5. appointments -->
      <div class="table-card">
        <div class="table-header accent"><span>appointments</span><span>BOOKINGS</span></div>
        <div class="fields">
          <div class="field"><span class="pk">id (PK)</span><span class="type">UUID</span></div>
          <div class="field"><span class="fk">hospital_id (FK)</span><span class="type">UUID</span></div>
          <div class="field"><span class="fk">doctor_id (FK)</span><span class="type">UUID</span></div>
          <div class="field"><span class="fk">patient_id (FK)</span><span class="type">UUID</span></div>
          <div class="field"><span>appointment_date</span><span class="type">DATE</span></div>
          <div class="field"><span>start_time / end_time</span><span class="type">TIME</span></div>
          <div class="field"><span>status</span><span class="type">VARCHAR</span></div>
          <div class="field"><span>token_number</span><span class="type">INTEGER</span></div>
          <div class="field"><span>booking_source</span><span class="type">VARCHAR</span></div>
        </div>
      </div>

      <!-- 6. encounters -->
      <div class="table-card">
        <div class="table-header"><span>encounters</span><span>CLINICAL</span></div>
        <div class="fields">
          <div class="field"><span class="pk">id (PK)</span><span class="type">UUID</span></div>
          <div class="field"><span class="fk">hospital_id (FK)</span><span class="type">UUID</span></div>
          <div class="field"><span class="fk">appointment_id (FK)</span><span class="type">UUID</span></div>
          <div class="field"><span class="fk">doctor_id (FK)</span><span class="type">UUID</span></div>
          <div class="field"><span class="fk">patient_id (FK)</span><span class="type">UUID</span></div>
          <div class="field"><span>chief_complaint</span><span class="type">TEXT</span></div>
          <div class="field"><span>vitals</span><span class="type">JSONB</span></div>
          <div class="field"><span>diagnosis</span><span class="type">TEXT</span></div>
        </div>
      </div>

      <!-- 7. prescriptions -->
      <div class="table-card">
        <div class="table-header"><span>prescriptions</span><span>PHARMACY</span></div>
        <div class="fields">
          <div class="field"><span class="pk">id (PK)</span><span class="type">UUID</span></div>
          <div class="field"><span class="fk">hospital_id (FK)</span><span class="type">UUID</span></div>
          <div class="field"><span class="fk">encounter_id (FK)</span><span class="type">UUID</span></div>
          <div class="field"><span>medications</span><span class="type">JSONB ARRAY</span></div>
          <div class="field"><span>advice</span><span class="type">TEXT</span></div>
          <div class="field"><span>created_at</span><span class="type">TIMESTAMPTZ</span></div>
        </div>
      </div>

      <!-- 8. whatsapp_sessions -->
      <div class="table-card">
        <div class="table-header green"><span>whatsapp_sessions</span><span>STATE</span></div>
        <div class="fields">
          <div class="field"><span class="pk">id (PK)</span><span class="type">UUID</span></div>
          <div class="field"><span class="fk">hospital_id (FK)</span><span class="type">UUID</span></div>
          <div class="field"><span class="fk">patient_id (FK)</span><span class="type">UUID</span></div>
          <div class="field"><span>whatsapp_number</span><span class="type">VARCHAR</span></div>
          <div class="field"><span>state</span><span class="type">VARCHAR</span></div>
          <div class="field"><span>state_data</span><span class="type">JSONB</span></div>
          <div class="field"><span>expires_at</span><span class="type">TIMESTAMPTZ</span></div>
        </div>
      </div>

      <!-- 9. whatsapp_messages -->
      <div class="table-card">
        <div class="table-header green"><span>whatsapp_messages</span><span>AUDIT</span></div>
        <div class="fields">
          <div class="field"><span class="pk">id (PK)</span><span class="type">UUID</span></div>
          <div class="field"><span class="fk">hospital_id (FK)</span><span class="type">UUID</span></div>
          <div class="field"><span>direction</span><span class="type">VARCHAR</span></div>
          <div class="field"><span>whatsapp_message_id</span><span class="type">VARCHAR UNIQUE</span></div>
          <div class="field"><span>message_type</span><span class="type">VARCHAR</span></div>
          <div class="field"><span>message_status</span><span class="type">VARCHAR</span></div>
          <div class="field"><span>metadata</span><span class="type">JSONB</span></div>
        </div>
      </div>

      <!-- 10. audit_logs -->
      <div class="table-card">
        <div class="table-header purple"><span>audit_logs</span><span>SECURITY</span></div>
        <div class="fields">
          <div class="field"><span class="pk">id (PK)</span><span class="type">UUID</span></div>
          <div class="field"><span class="fk">hospital_id (FK)</span><span class="type">UUID</span></div>
          <div class="field"><span class="fk">user_id (FK)</span><span class="type">UUID</span></div>
          <div class="field"><span>action</span><span class="type">VARCHAR</span></div>
          <div class="field"><span>resource</span><span class="type">VARCHAR</span></div>
          <div class="field"><span>metadata</span><span class="type">JSONB</span></div>
          <div class="field"><span>created_at</span><span class="type">TIMESTAMPTZ</span></div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
`;

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  console.log('1. Rendering Architectural Diagrams...');

  // Diagram 1
  await page.setContent(systemArchHtml);
  await page.screenshot({ path: path.join(IMAGES_DIR, '01_system_architecture.png'), fullPage: true });
  console.log('   ✓ Saved 01_system_architecture.png');

  // Diagram 2
  await page.setContent(cloudArchHtml);
  await page.screenshot({ path: path.join(IMAGES_DIR, '02_cloud_architecture.png'), fullPage: true });
  console.log('   ✓ Saved 02_cloud_architecture.png');

  // Diagram 3
  await page.setContent(erDiagramHtml);
  await page.screenshot({ path: path.join(IMAGES_DIR, '03_database_er_diagram.png'), fullPage: true });
  console.log('   ✓ Saved 03_database_er_diagram.png');

  console.log('\n2. Capturing Application UI Screenshots...');

  // 1. Login Page
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(IMAGES_DIR, '04_login_screen.png') });
  console.log('   ✓ Saved 04_login_screen.png');

  // 2. Supercoordinator Dashboard
  // Set localStorage user to Supercoordinator
  await page.evaluate(() => {
    const user = {
      id: '00000000-0000-0000-0000-000000000001',
      role: 'supercoordinator',
      full_name: 'Dr. Platform Operator',
      email: 'super@clinicflow.demo',
      phone_number: '+919999900000',
      is_active: true,
      hospital_id: null
    };
    localStorage.setItem('clinicflow_user', JSON.stringify(user));
  });
  await page.goto('http://localhost:5173/supercoordinator', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(IMAGES_DIR, '05_supercoordinator_dashboard.png') });
  console.log('   ✓ Saved 05_supercoordinator_dashboard.png');

  // 3. WhatsApp Monitoring & Interactive Simulator
  await page.goto('http://localhost:5173/supercoordinator/whatsapp', { waitUntil: 'networkidle0' });
  // Type 'hi' in the simulator input and send
  try {
    const inputSelector = 'input[placeholder*="Type a message"]';
    await page.waitForSelector(inputSelector, { timeout: 3000 });
    await page.type(inputSelector, 'Book Appointment');
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 600));
  } catch(e) {}
  await page.screenshot({ path: path.join(IMAGES_DIR, '06_whatsapp_simulator.png') });
  console.log('   ✓ Saved 06_whatsapp_simulator.png');

  // 4. Hospital Management & Staff Roster
  await page.goto('http://localhost:5173/supercoordinator/hospitals', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(IMAGES_DIR, '07_hospital_management.png') });
  console.log('   ✓ Saved 07_hospital_management.png');

  // 5. Doctor Dashboard & Consultation Room
  await page.evaluate(() => {
    const user = {
      id: 'd2000000-0000-0000-0000-000000000001',
      role: 'doctor',
      full_name: 'Dr. Rajesh Sharma',
      email: 'doctor@clinicflow.demo',
      phone_number: '+919820011111',
      is_active: true,
      hospital_id: 'a1000000-0000-0000-0000-000000000001'
    };
    localStorage.setItem('clinicflow_user', JSON.stringify(user));
  });
  await page.goto('http://localhost:5173/doctor', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(IMAGES_DIR, '08_doctor_dashboard.png') });
  console.log('   ✓ Saved 08_doctor_dashboard.png');

  // 6. Receptionist Front-Desk Queue
  await page.evaluate(() => {
    const user = {
      id: 'r3000000-0000-0000-0000-000000000001',
      role: 'receptionist',
      full_name: 'Pooja Verma',
      email: 'receptionist@clinicflow.demo',
      phone_number: '+919830022222',
      is_active: true,
      hospital_id: 'a1000000-0000-0000-0000-000000000001'
    };
    localStorage.setItem('clinicflow_user', JSON.stringify(user));
  });
  await page.goto('http://localhost:5173/receptionist', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(IMAGES_DIR, '09_receptionist_queue.png') });
  console.log('   ✓ Saved 09_receptionist_queue.png');

  await browser.close();
  console.log('\nAll 9 architectural diagrams and live screenshots captured successfully!');
}

main().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});
