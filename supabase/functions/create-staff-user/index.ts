// ==============================================================================
// ClinicFlow — Edge Function: Create Staff User
// Uses Supabase Admin API (service_role) to create auth user + profile
// Only callable by authenticated admin/supercoordinator users
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Verify the caller is an authenticated admin or supercoordinator
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, "");

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate the caller's JWT directly using the admin client
    const { data: { user: caller }, error: callerErr } = await adminClient.auth.getUser(token);
    if (callerErr || !caller) {
      return new Response(JSON.stringify({ error: `Unauthorized: ${callerErr?.message || "Invalid user token"}` }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check caller role
    const { data: callerProfile } = await adminClient
      .from("profiles")
      .select("role, hospital_id")
      .eq("id", caller.id)
      .single();

    if (!callerProfile || !["admin", "supercoordinator"].includes(callerProfile.role)) {
      return new Response(JSON.stringify({ error: "Forbidden: only admin or supercoordinator can create staff" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Parse request body
    const body = await req.json();
    const {
      full_name,
      email,
      phone,
      password = "ClinicFlow@2024", // Default temp password
      role,
      hospital_id,
      department_id,
      specialization_id,
      license_number,
      consultation_fee = 500,
      room_number,
      available_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      start_time = "09:00:00",
      end_time = "17:00:00",
      slot_duration_minutes = 30,
    } = body;

    if (!full_name || !email || !role) {
      return new Response(JSON.stringify({ error: "full_name, email, and role are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin can only create staff in their own hospital
    const resolvedHospitalId = callerProfile.role === "supercoordinator"
      ? (hospital_id || callerProfile.hospital_id)
      : callerProfile.hospital_id;

    if (!resolvedHospitalId) {
      return new Response(JSON.stringify({ error: "hospital_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Create the auth user with admin API
    const { data: authUser, error: authErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm so they can log in immediately
      user_metadata: { full_name, role },
    });

    if (authErr) {
      return new Response(JSON.stringify({ error: authErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newUserId = authUser.user.id;

    // 4. Create / update the profile record
    const { data: profile, error: profErr } = await adminClient
      .from("profiles")
      .upsert({
        id: newUserId,
        hospital_id: resolvedHospitalId,
        role,
        full_name,
        email,
        phone: phone || null,
        is_active: true,
      })
      .select()
      .single();

    if (profErr) {
      // Rollback: delete the auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(newUserId);
      return new Response(JSON.stringify({ error: profErr.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. If doctor, create doctor_profile
    if (role === "doctor") {
      await adminClient.from("doctor_profiles").upsert({
        id: newUserId,
        hospital_id: resolvedHospitalId,
        department_id: department_id || null,
        specialization_id: specialization_id || null,
        license_number: license_number || null,
        consultation_fee: consultation_fee || 500,
        room_number: room_number || null,
        available_days,
        start_time,
        end_time,
        slot_duration_minutes,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: profile,
        temp_password: password,
        message: `Staff member ${full_name} created. They can log in with email: ${email} and password: ${password}`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[create-staff-user] Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
