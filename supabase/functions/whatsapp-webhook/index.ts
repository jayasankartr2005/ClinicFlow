// ==============================================================================
// ClinicFlow — Meta WhatsApp Cloud API Webhook Edge Function
// Multi-Tenant Patient Interface with Deterministic Concurrency-Safe Scheduling
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

// Environment Configuration
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const META_WHATSAPP_TOKEN = Deno.env.get("META_WHATSAPP_ACCESS_TOKEN") || Deno.env.get("META_ACCESS_TOKEN") || "";
const META_VERIFY_TOKEN = Deno.env.get("META_WHATSAPP_VERIFY_TOKEN") || "clinicflow_verify_token_2026";
const META_API_VERSION = "v21.0";

// Create Supabase Admin client with service role for secure backend operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Helper Types
interface WhatsAppMessagePayload {
  to: string;
  type: "text" | "interactive";
  text?: { body: string };
  interactive?: any;
}

serve(async (req: Request) => {
  const url = new URL(req.url);

  // --------------------------------------------------------------------------
  // 1. Meta Webhook Verification (GET Request)
  // --------------------------------------------------------------------------
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    console.log(`[WhatsApp Webhook GET] mode=${mode}, token=${token}`);

    if (mode === "subscribe" && token === META_VERIFY_TOKEN) {
      console.log("[WhatsApp Webhook GET] Verification successful");
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }

    console.error("[WhatsApp Webhook GET] Verification failed");
    return new Response("Forbidden: Invalid verification token", { status: 403 });
  }

  // --------------------------------------------------------------------------
  // 2. Incoming Event Processing (POST Request)
  // --------------------------------------------------------------------------
  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log("[WhatsApp Webhook POST] Payload received:", JSON.stringify(body));

      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0]?.value;

      // Ignore delivery receipts, read receipts, and status updates
      if (!changes?.messages || changes.messages.length === 0) {
        return new Response(JSON.stringify({ status: "ignored_non_message" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      const incomingMsg = changes.messages[0];
      const whatsappMsgId = incomingMsg.id;
      const fromNumber = incomingMsg.from; // Sender WhatsApp phone number
      const phoneNumberId = changes.metadata?.phone_number_id || "default_test_phone_id";

      // ----------------------------------------------------------------------
      // 3. Idempotency Check: Reject Duplicate Webhook Delivery
      // ----------------------------------------------------------------------
      const { data: existingMsg } = await supabase
        .from("whatsapp_messages")
        .select("id")
        .eq("whatsapp_message_id", whatsappMsgId)
        .maybeSingle();

      if (existingMsg) {
        console.log(`[WhatsApp Webhook] Duplicate message skipped: ${whatsappMsgId}`);
        return new Response(JSON.stringify({ status: "duplicate_skipped" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // ----------------------------------------------------------------------
      // 4. Resolve Tenant Hospital
      // ----------------------------------------------------------------------
      let hospital = null;

      // A. Lookup hospital by matching Meta Phone Number ID
      if (phoneNumberId) {
        const { data: matchedHospital } = await supabase
          .from("hospitals")
          .select("*")
          .eq("whatsapp_phone_number_id", phoneNumberId)
          .eq("whatsapp_enabled", true)
          .maybeSingle();

        if (matchedHospital) {
          hospital = matchedHospital;
        }
      }

      // B. Fallback to Primary Active Hospital for free-tier development/test mode
      if (!hospital) {
        const { data: defaultHospital } = await supabase
          .from("hospitals")
          .select("*")
          .eq("whatsapp_enabled", true)
          .order("created_at")
          .limit(1)
          .maybeSingle();

        hospital = defaultHospital;
      }

      if (!hospital) {
        console.error("[WhatsApp Webhook] No active hospital configured in database");
        return new Response(JSON.stringify({ error: "Hospital not configured" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      // ----------------------------------------------------------------------
      // 5. Patient Identification
      // ----------------------------------------------------------------------
      const formattedFromNumber = fromNumber.startsWith("+") ? fromNumber : `+${fromNumber}`;
      const rawDigits = fromNumber.replace(/\D/g, "");

      // Look up patient in this hospital
      const { data: existingPatient } = await supabase
        .from("patients")
        .select("*")
        .eq("hospital_id", hospital.id)
        .or(`whatsapp_number.eq.${formattedFromNumber},whatsapp_number.eq.${rawDigits},phone_number.eq.${rawDigits}`)
        .maybeSingle();

      // Log inbound message to enforce idempotency
      await supabase.from("whatsapp_messages").insert({
        hospital_id: hospital.id,
        patient_id: existingPatient?.id || null,
        direction: "INBOUND",
        whatsapp_message_id: whatsappMsgId,
        message_type: incomingMsg.type?.toUpperCase() || "TEXT",
        message_status: "received",
        metadata: {
          from: fromNumber,
          phone_number_id: phoneNumberId,
          type: incomingMsg.type,
          text: incomingMsg.text?.body,
          interactive: incomingMsg.interactive,
        },
      });

      // ----------------------------------------------------------------------
      // 6. Session Management
      // ----------------------------------------------------------------------
      let { data: session } = await supabase
        .from("whatsapp_sessions")
        .select("*")
        .eq("hospital_id", hospital.id)
        .eq("whatsapp_number", formattedFromNumber)
        .maybeSingle();

      if (!session) {
        const { data: newSession, error: sessErr } = await supabase
          .from("whatsapp_sessions")
          .insert({
            hospital_id: hospital.id,
            patient_id: existingPatient?.id || null,
            whatsapp_number: formattedFromNumber,
            state: existingPatient ? "MAIN_MENU" : "IDLE",
            state_data: {},
            last_message_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (sessErr) {
          console.error("[WhatsApp Webhook] Failed to create session", sessErr);
        }
        session = newSession;
      } else if (existingPatient && !session.patient_id) {
        await supabase
          .from("whatsapp_sessions")
          .update({ patient_id: existingPatient.id })
          .eq("id", session.id);
        session.patient_id = existingPatient.id;
      }

      // ----------------------------------------------------------------------
      // 7. Parse User Input (Text, Button Reply, or List Reply)
      // ----------------------------------------------------------------------
      let userActionId = "";
      let userText = "";

      if (incomingMsg.type === "text") {
        userText = incomingMsg.text.body.trim();
        userActionId = userText.toLowerCase();
      } else if (incomingMsg.type === "interactive") {
        const interactive = incomingMsg.interactive;
        if (interactive.type === "button_reply") {
          userActionId = interactive.button_reply.id;
          userText = interactive.button_reply.title;
        } else if (interactive.type === "list_reply") {
          userActionId = interactive.list_reply.id;
          userText = interactive.list_reply.title;
        }
      }

      console.log(`[WhatsApp Webhook] User Action: id="${userActionId}", text="${userText}", State="${session?.state}"`);

      // ----------------------------------------------------------------------
      // 8. Deterministic Flow Engine (State Machine)
      // ----------------------------------------------------------------------
      const activePhoneNumberId = (phoneNumberId && phoneNumberId !== "123456123" && phoneNumberId !== "default_test_phone_id")
        ? phoneNumberId
        : (hospital.whatsapp_phone_number_id || "1306370622559093");

      await processConversationState(
        hospital,
        existingPatient,
        session,
        userActionId,
        userText,
        fromNumber,
        activePhoneNumberId
      );

      return new Response(JSON.stringify({ status: "success" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      console.error("[WhatsApp Webhook POST] Internal error:", err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response("Method not allowed", { status: 405 });
});

// ------------------------------------------------------------------------------
// Conversation State Processor
// ------------------------------------------------------------------------------
async function processConversationState(
  hospital: any,
  patient: any,
  session: any,
  actionId: string,
  userText: string,
  fromNumber: string,
  phoneNumberId: string
) {
  const state = session.state;
  const stateData = session.state_data || {};

  // Global reset keywords
  const isGreeting = ["hi", "hello", "hey", "menu", "start", "restart", "help"].includes(actionId);

  // A. Onboarding New Patient if Profile doesn't exist
  if (!patient) {
    // ✅ MUST check awaiting_name FIRST — before state===IDLE check
    // Otherwise every message loops back to asking for name since state stays IDLE
    if (stateData.awaiting_name && userText.length >= 2) {
      // Create new patient record
      const formattedNumber = fromNumber.startsWith("+") ? fromNumber : `+${fromNumber}`;
      const { data: newPatient, error: patErr } = await supabase
        .from("patients")
        .insert({
          hospital_id: hospital.id,
          full_name: userText,
          phone_number: fromNumber.replace(/\D/g, ""),
          whatsapp_number: formattedNumber,
        })
        .select()
        .single();

      if (patErr) {
        console.error("[WhatsApp] Error creating patient", patErr);
        await sendWhatsAppText(phoneNumberId, fromNumber, "We could not create your patient profile. Please try again shortly.");
        return;
      }

      // Log patient creation in audit logs
      await logAuditEvent(hospital.id, "WHATSAPP_PATIENT_CREATED", "patient", newPatient.id, {
        whatsapp_number: formattedNumber,
        full_name: userText,
      });

      patient = newPatient;
      await updateSession(session.id, "MAIN_MENU", {}, patient.id);

      await sendWhatsAppText(
        phoneNumberId,
        fromNumber,
        `Thank you, *${newPatient.full_name}*! Your patient profile has been registered at *${hospital.name}*.`
      );

      await sendMainMenu(phoneNumberId, fromNumber, hospital.name);
      return;
    }

    // Now show greeting / ask for name for new or returning-IDLE sessions
    if (state === "IDLE" || isGreeting) {
      await updateSession(session.id, "IDLE", { awaiting_name: true });
      await sendWhatsAppText(
        phoneNumberId,
        fromNumber,
        `Welcome to *${hospital.name}* on ClinicFlow.\n\nPlease enter your *full name* to register for consultation appointments.`
      );
      return;
    }

    // Fallback: re-prompt for name
    await sendWhatsAppText(phoneNumberId, fromNumber, `Please provide your *full name* to continue with registration at ${hospital.name}.`);
    return;
  }

  // B. Main Menu Greeting or Reset
  if (isGreeting || actionId === "btn_main_menu" || state === "IDLE") {
    await updateSession(session.id, "MAIN_MENU", {});
    await sendMainMenu(phoneNumberId, fromNumber, hospital.name);
    return;
  }

  // C. Main Menu Actions
  if (state === "MAIN_MENU") {
    if (actionId === "btn_book" || actionId.includes("book appointment")) {
      await showDoctorList(hospital, session, phoneNumberId, fromNumber);
      return;
    }

    if (actionId === "btn_my_appts" || actionId.includes("my appointments")) {
      await showPatientAppointments(hospital, patient, phoneNumberId, fromNumber);
      return;
    }

    if (actionId === "btn_records" || actionId.includes("prescriptions") || actionId.includes("reports")) {
      await showPrescriptionsAndReports(hospital, patient, phoneNumberId, fromNumber);
      return;
    }

    await sendMainMenu(phoneNumberId, fromNumber, hospital.name);
    return;
  }

  // D. Doctor Selection State
  if (state === "SELECTING_DOCTOR") {
    if (actionId.startsWith("doc_")) {
      const selectedDocId = actionId.replace("doc_", "");

      // Verify doctor belongs to this hospital
      const { data: doctor } = await supabase
        .from("profiles")
        .select("id, full_name, doctor_profile:doctor_profiles(available_days, start_time, end_time, slot_duration_minutes)")
        .eq("id", selectedDocId)
        .eq("hospital_id", hospital.id)
        .eq("role", "doctor")
        .eq("is_active", true)
        .maybeSingle();

      if (!doctor) {
        await sendWhatsAppText(phoneNumberId, fromNumber, "Invalid doctor selection. Please choose from the list:");
        await showDoctorList(hospital, session, phoneNumberId, fromNumber);
        return;
      }

      // Compute available dates (next 5 days matching doctor's schedule)
      const availableDates = getDoctorAvailableDates(doctor.doctor_profile?.available_days || []);

      if (availableDates.length === 0) {
        await sendWhatsAppText(
          phoneNumberId,
          fromNumber,
          `Dr. ${doctor.full_name} does not have any working days scheduled in the next 5 days. Please select another doctor.`
        );
        await showDoctorList(hospital, session, phoneNumberId, fromNumber);
        return;
      }

      await updateSession(session.id, "SELECTING_DATE", {
        doctor_id: doctor.id,
        doctor_name: doctor.full_name,
        available_days: doctor.doctor_profile?.available_days,
        start_time: doctor.doctor_profile?.start_time,
        end_time: doctor.doctor_profile?.end_time,
        slot_duration_minutes: doctor.doctor_profile?.slot_duration_minutes || 30,
      });

      // Send Date Selection Buttons
      const dateButtons = availableDates.slice(0, 3).map((d) => ({
        id: `date_${d.dateStr}`,
        title: d.label,
      }));

      await sendWhatsAppButtons(
        phoneNumberId,
        fromNumber,
        `Consultation with *Dr. ${doctor.full_name}*\n\nPlease choose an appointment date:`,
        dateButtons
      );
      return;
    }

    await showDoctorList(hospital, session, phoneNumberId, fromNumber);
    return;
  }

  // E. Date Selection State
  if (state === "SELECTING_DATE") {
    if (actionId.startsWith("date_")) {
      const selectedDate = actionId.replace("date_", "");
      const doctorId = stateData.doctor_id;

      // Query booked appointments for this doctor on that date to compute available slots
      const { data: bookedAppts } = await supabase
        .from("appointments")
        .select("start_time, end_time, status")
        .eq("doctor_id", doctorId)
        .eq("appointment_date", selectedDate)
        .neq("status", "cancelled");

      const slots = generateAvailableSlots(
        stateData.start_time || "09:00:00",
        stateData.end_time || "17:00:00",
        stateData.slot_duration_minutes || 30,
        bookedAppts || []
      );

      if (slots.length === 0) {
        await sendWhatsAppText(
          phoneNumberId,
          fromNumber,
          `There are no available slots for Dr. ${stateData.doctor_name} on ${selectedDate}.\n\nPlease choose another date:`
        );
        return;
      }

      await updateSession(session.id, "SELECTING_SLOT", {
        ...stateData,
        appointment_date: selectedDate,
      });

      // Present top 8 slots as interactive buttons or list
      const slotButtons = slots.slice(0, 3).map((s) => ({
        id: `slot_${s.startTime}_${s.endTime}`,
        title: s.formatted,
      }));

      await sendWhatsAppButtons(
        phoneNumberId,
        fromNumber,
        `Available slots for *Dr. ${stateData.doctor_name}* on *${selectedDate}*:`,
        slotButtons
      );
      return;
    }

    await sendWhatsAppText(phoneNumberId, fromNumber, "Please select an appointment date from the options above.");
    return;
  }

  // F. Slot Selection State
  if (state === "SELECTING_SLOT") {
    if (actionId.startsWith("slot_")) {
      const parts = actionId.replace("slot_", "").split("_");
      const startTime = parts[0];
      const endTime = parts[1];

      await updateSession(session.id, "CONFIRMING_APPOINTMENT", {
        ...stateData,
        start_time: startTime,
        end_time: endTime,
      });

      const confirmButtons = [
        { id: "btn_confirm_booking", title: "Confirm Appointment" },
        { id: "btn_cancel_booking", title: "Cancel" },
      ];

      await sendWhatsAppButtons(
        phoneNumberId,
        fromNumber,
        `📋 *Appointment Details:*\n\n` +
          `• *Hospital:* ${hospital.name}\n` +
          `• *Doctor:* Dr. ${stateData.doctor_name}\n` +
          `• *Date:* ${stateData.appointment_date}\n` +
          `• *Time:* ${formatTime12Hour(startTime)} - ${formatTime12Hour(endTime)}\n\n` +
          `Confirm this appointment booking?`,
        confirmButtons
      );
      return;
    }

    await sendWhatsAppText(phoneNumberId, fromNumber, "Please select a consultation slot from the options provided.");
    return;
  }

  // G. Confirmation & Atomic Booking State
  if (state === "CONFIRMING_APPOINTMENT") {
    if (actionId === "btn_confirm_booking") {
      // Execute Atomic Database Booking RPC
      const { data: rpcResult, error: rpcErr } = await supabase.rpc("book_appointment_atomic", {
        p_patient_id: patient.id,
        p_doctor_id: stateData.doctor_id,
        p_appointment_date: stateData.appointment_date,
        p_start_time: stateData.start_time,
        p_end_time: stateData.end_time,
        p_chief_complaint: "WhatsApp Patient Booking",
        p_hospital_id: hospital.id,
      });

      if (rpcErr || !rpcResult?.success) {
        const errorMsg = rpcResult?.error || rpcErr?.message || "Slot conflict occurred.";
        console.error("[WhatsApp Booking Conflict]", errorMsg);

        await logAuditEvent(hospital.id, "WHATSAPP_APPOINTMENT_FAILED", "appointment", null, {
          patient_id: patient.id,
          doctor_id: stateData.doctor_id,
          date: stateData.appointment_date,
          error: errorMsg,
        });

        await sendWhatsAppText(
          phoneNumberId,
          fromNumber,
          `⚠️ *Booking Conflict:*\n\n${errorMsg}\n\nPlease reply with *'menu'* to select an alternative slot.`
        );
        await updateSession(session.id, "MAIN_MENU", {});
        return;
      }

      const appointmentId = rpcResult.appointment_id;
      const shortRef = `CF-${appointmentId.slice(0, 8).toUpperCase()}`;

      // Log successful appointment
      await logAuditEvent(hospital.id, "WHATSAPP_APPOINTMENT_BOOKED", "appointment", appointmentId, {
        patient_id: patient.id,
        doctor_id: stateData.doctor_id,
        appointment_date: stateData.appointment_date,
        start_time: stateData.start_time,
        short_ref: shortRef,
      });

      await updateSession(session.id, "COMPLETED", {
        last_appointment_id: appointmentId,
      });

      await sendWhatsAppText(
        phoneNumberId,
        fromNumber,
        `✅ *Appointment Confirmed!*\n\n` +
          `• *Hospital:* ${hospital.name}\n` +
          `• *Doctor:* Dr. ${stateData.doctor_name}\n` +
          `• *Date:* ${stateData.appointment_date}\n` +
          `• *Time:* ${formatTime12Hour(stateData.start_time)}\n` +
          `• *Appointment ID:* *${shortRef}*\n\n` +
          `Thank you for booking with ClinicFlow. Please arrive 10 minutes prior to your scheduled time.`
      );
      return;
    }

    if (actionId === "btn_cancel_booking") {
      await updateSession(session.id, "MAIN_MENU", {});
      await sendWhatsAppText(phoneNumberId, fromNumber, "Booking process cancelled.");
      await sendMainMenu(phoneNumberId, fromNumber, hospital.name);
      return;
    }
  }

  // Fallback to Main Menu
  await sendMainMenu(phoneNumberId, fromNumber, hospital.name);
}

// ------------------------------------------------------------------------------
// Workflow Helpers
// ------------------------------------------------------------------------------
async function sendMainMenu(phoneNumberId: string, to: string, hospitalName: string) {
  const buttons = [
    { id: "btn_book", title: "Book Appointment" },
    { id: "btn_my_appts", title: "My Appointments" },
    { id: "btn_records", title: "Prescriptions & Reports" },
  ];

  await sendWhatsAppButtons(
    phoneNumberId,
    to,
    `🏥 Welcome to *${hospitalName}*.\n\nHow can we help you today?`,
    buttons
  );
}

async function showDoctorList(hospital: any, session: any, phoneNumberId: string, to: string) {
  const { data: doctors } = await supabase
    .from("profiles")
    .select("id, full_name, doctor_profile:doctor_profiles(consultation_fee, department:departments(name))")
    .eq("hospital_id", hospital.id)
    .eq("role", "doctor")
    .eq("is_active", true)
    .limit(10);

  if (!doctors || doctors.length === 0) {
    await sendWhatsAppText(
      phoneNumberId,
      to,
      `There are currently no doctors available for booking at ${hospital.name}. Please contact the hospital reception.`
    );
    return;
  }

  await updateSession(session.id, "SELECTING_DOCTOR", {});

  // Interactive buttons for first 3 doctors
  const buttons = doctors.slice(0, 3).map((d: any) => ({
    id: `doc_${d.id}`,
    title: `Dr. ${d.full_name.replace(/^Dr\.\s*/i, "").slice(0, 18)}`,
  }));

  const docText = doctors
    .map((d: any, idx: number) => {
      const dept = d.doctor_profile?.department?.name || "General Medicine";
      return `${idx + 1}. *Dr. ${d.full_name}* (${dept})`;
    })
    .join("\n");

  await sendWhatsAppButtons(
    phoneNumberId,
    to,
    `👨‍⚕️ *Choose a Doctor at ${hospital.name}:*\n\n${docText}`,
    buttons
  );
}

async function showPatientAppointments(hospital: any, patient: any, phoneNumberId: string, to: string) {
  const todayStr = new Date().toISOString().split("T")[0];

  const { data: appts } = await supabase
    .from("appointments")
    .select("id, appointment_date, start_time, status, doctor:profiles!appointments_doctor_id_fkey(full_name)")
    .eq("hospital_id", hospital.id)
    .eq("patient_id", patient.id)
    .gte("appointment_date", todayStr)
    .neq("status", "cancelled")
    .order("appointment_date")
    .order("start_time");

  if (!appts || appts.length === 0) {
    await sendWhatsAppText(
      phoneNumberId,
      to,
      `You have no upcoming appointments scheduled at *${hospital.name}*.\n\nReply *'menu'* to book a consultation.`
    );
    return;
  }

  const listStr = appts
    .map((a: any, idx: number) => {
      return `${idx + 1}. *${a.appointment_date}* at ${formatTime12Hour(a.start_time)}\n   • Doctor: Dr. ${a.doctor?.full_name}\n   • Status: ${a.status.toUpperCase()}\n   • Ref: CF-${a.id.slice(0, 8).toUpperCase()}`;
    })
    .join("\n\n");

  await sendWhatsAppText(
    phoneNumberId,
    to,
    `📅 *Your Upcoming Appointments at ${hospital.name}:*\n\n${listStr}\n\nReply *'menu'* to return to the main menu.`
  );
}

async function showPrescriptionsAndReports(hospital: any, patient: any, phoneNumberId: string, to: string) {
  // Query recent medical records & prescriptions
  const { data: records } = await supabase
    .from("medical_records")
    .select("id, created_at, diagnosis, doctor:profiles!medical_records_doctor_id_fkey(full_name), prescriptions(medication_name, dosage, frequency, duration)")
    .eq("hospital_id", hospital.id)
    .eq("patient_id", patient.id)
    .order("created_at", { ascending: false })
    .limit(3);

  if (!records || records.length === 0) {
    await sendWhatsAppText(
      phoneNumberId,
      to,
      `No digital prescriptions or medical reports found on file for you at *${hospital.name}*.\n\nReply *'menu'* to return to the main menu.`
    );
    return;
  }

  let text = `📑 *Your Medical Records & Prescriptions at ${hospital.name}:*\n\n`;

  records.forEach((rec: any, idx: number) => {
    const dateFormatted = rec.created_at.split("T")[0];
    text += `*Consultation #${idx + 1}* (${dateFormatted})\n`;
    text += `• Consulting Physician: Dr. ${rec.doctor?.full_name}\n`;
    text += `• Diagnosis: ${rec.diagnosis}\n`;

    if (rec.prescriptions && rec.prescriptions.length > 0) {
      text += `• Prescribed Medications:\n`;
      rec.prescriptions.forEach((rx: any) => {
        text += `   - ${rx.medication_name} (${rx.dosage}) | ${rx.frequency} for ${rx.duration}\n`;
      });
    }
    text += `\n`;
  });

  text += `Reply *'menu'* to return to the main menu.`;

  await sendWhatsAppText(phoneNumberId, to, text);
}

// ------------------------------------------------------------------------------
// Meta WhatsApp Cloud API Client
// ------------------------------------------------------------------------------
async function sendWhatsAppText(phoneNumberId: string, to: string, text: string) {
  await postToWhatsApp(phoneNumberId, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
    type: "text",
    text: { body: text },
  });
}

async function sendWhatsAppButtons(
  phoneNumberId: string,
  to: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>
) {
  // WhatsApp allows max 3 quick-reply buttons
  const validButtons = buttons.slice(0, 3).map((b) => ({
    type: "reply",
    reply: {
      id: b.id,
      title: b.title.slice(0, 20), // Meta button title limit is 20 chars
    },
  }));

  await postToWhatsApp(phoneNumberId, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: to,
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: { buttons: validButtons },
    },
  });
}

async function postToWhatsApp(phoneNumberId: string, payload: any) {
  if (!META_WHATSAPP_TOKEN) {
    console.log("[WhatsApp Mock Dispatch] Token not configured. Simulated send:", JSON.stringify(payload));
    return;
  }

  const endpoint = `https://graph.facebook.com/${META_API_VERSION}/${phoneNumberId}/messages`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${META_WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const resData = await res.json();
    if (!res.ok) {
      console.error("[Meta WhatsApp Cloud API Error]:", resData);
    } else {
      console.log("[Meta WhatsApp Message Sent]:", resData);
    }
  } catch (e) {
    console.error("[Meta WhatsApp HTTP Dispatch Error]:", e);
  }
}

// ------------------------------------------------------------------------------
// Database Helper Utilities
// ------------------------------------------------------------------------------
async function updateSession(sessionId: string, state: string, stateData: any = {}, patientId?: string) {
  const updates: any = {
    state,
    state_data: stateData,
    last_message_at: new Date().toISOString(),
  };
  if (patientId) updates.patient_id = patientId;

  await supabase.from("whatsapp_sessions").update(updates).eq("id", sessionId);
}

async function logAuditEvent(
  hospitalId: string,
  action: string,
  entityType: string,
  entityId: string | null,
  details: any = {}
) {
  try {
    await supabase.from("audit_logs").insert({
      hospital_id: hospitalId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
    });
  } catch (e) {
    console.error("[Audit Log Error]", e);
  }
}

function getDoctorAvailableDates(availableDays: string[]): Array<{ dateStr: string; label: string }> {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dates: Array<{ dateStr: string; label: string }> = [];

  const now = new Date();
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(now.getDate() + i);
    const dayName = dayNames[d.getDay()];

    if (availableDays.length === 0 || availableDays.includes(dayName)) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const label = `${d.getDate()} ${months[d.getMonth()]}`;

      dates.push({ dateStr, label });
      if (dates.length >= 4) break;
    }
  }

  return dates;
}

function generateAvailableSlots(
  startTimeStr: string,
  endTimeStr: string,
  durationMinutes: number,
  bookedAppts: Array<{ start_time: string; end_time: string; status: string }>
): Array<{ startTime: string; endTime: string; formatted: string }> {
  const slots: Array<{ startTime: string; endTime: string; formatted: string }> = [];

  const startHour = parseInt(startTimeStr.split(":")[0], 10) || 9;
  const startMin = parseInt(startTimeStr.split(":")[1], 10) || 0;
  const endHour = parseInt(endTimeStr.split(":")[0], 10) || 17;
  const endMin = parseInt(endTimeStr.split(":")[1], 10) || 0;

  const totalStart = startHour * 60 + startMin;
  const totalEnd = endHour * 60 + endMin;

  for (let cur = totalStart; cur + durationMinutes <= totalEnd; cur += durationMinutes) {
    const sH = Math.floor(cur / 60);
    const sM = cur % 60;
    const eH = Math.floor((cur + durationMinutes) / 60);
    const eM = (cur + durationMinutes) % 60;

    const startFormatted = `${String(sH).padStart(2, "0")}:${String(sM).padStart(2, "0")}:00`;
    const endFormatted = `${String(eH).padStart(2, "0")}:${String(eM).padStart(2, "0")}:00`;

    // Overlap check with active booked appointments
    const isConflict = bookedAppts.some((a) => {
      if (a.status === "cancelled") return false;
      const aStart = a.start_time.slice(0, 5);
      const aEnd = a.end_time.slice(0, 5);
      const slotStart = startFormatted.slice(0, 5);
      const slotEnd = endFormatted.slice(0, 5);

      return slotStart < aEnd && slotEnd > aStart;
    });

    if (!isConflict) {
      slots.push({
        startTime: startFormatted,
        endTime: endFormatted,
        formatted: `${formatTime12Hour(startFormatted)}`,
      });
    }
  }

  return slots;
}

function formatTime12Hour(timeStr: string): string {
  const parts = timeStr.split(":");
  let hour = parseInt(parts[0], 10) || 0;
  const min = parts[1] || "00";
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${hour}:${min} ${ampm}`;
}
