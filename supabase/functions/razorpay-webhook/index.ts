// Razorpay Webhook Edge Function
// Deploy: supabase functions deploy razorpay-webhook
// Set secret: supabase secrets set RAZORPAY_WEBHOOK_SECRET=your_secret

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";

const WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req: Request) => {
  // Only accept POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Read body
  const body = await req.text();

  // Verify Razorpay signature (HMAC SHA256)
  const signature = req.headers.get("x-razorpay-signature");
  if (!signature || !WEBHOOK_SECRET) {
    console.error("[razorpay-webhook] Missing signature or webhook secret");
    return new Response("Unauthorized", { status: 401 });
  }

  const expectedSignature = hmac("sha256", WEBHOOK_SECRET, body, "utf8", "hex");
  if (signature !== expectedSignature) {
    console.error("[razorpay-webhook] Invalid signature");
    return new Response("Invalid signature", { status: 401 });
  }

  // Parse payload
  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const event = payload.event;
  console.log("[razorpay-webhook] Event:", event);

  // Handle payment.captured — this means payment was successfully captured
  if (event === "payment.captured") {
    const payment = payload.payload?.payment?.entity;
    if (!payment) {
      console.error("[razorpay-webhook] No payment entity in payload");
      return new Response("No payment entity", { status: 400 });
    }

    const razorpayPaymentId = payment.id;
    const razorpayOrderId = payment.order_id;
    const notes = payment.notes ?? {};

    // We expect registration_id in payment notes (set during order creation)
    const registrationId = notes.registration_id;

    if (!registrationId) {
      console.warn("[razorpay-webhook] No registration_id in notes, trying order_id match");
    }

    // Connect to Supabase with service role (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find the registration
    let query = supabase.from("registrations").select("id, payment_status");
    if (registrationId) {
      query = query.eq("id", registrationId);
    } else if (razorpayOrderId) {
      query = query.eq("razorpay_order_id", razorpayOrderId);
    } else {
      console.error("[razorpay-webhook] Cannot identify registration");
      return new Response("Cannot identify registration", { status: 400 });
    }

    const { data: registration, error: fetchError } = await query.single();
    if (fetchError || !registration) {
      console.error("[razorpay-webhook] Registration not found:", fetchError);
      return new Response("Registration not found", { status: 404 });
    }

    // Only update if not already paid (idempotent)
    if (registration.payment_status === "paid") {
      console.log("[razorpay-webhook] Already paid, skipping");
      return new Response(JSON.stringify({ status: "already_paid" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Mark as paid
    const { error: updateError } = await supabase
      .from("registrations")
      .update({
        payment_status: "paid",
        razorpay_payment_id: razorpayPaymentId,
      })
      .eq("id", registration.id);

    if (updateError) {
      console.error("[razorpay-webhook] Update failed:", updateError);
      return new Response("Update failed", { status: 500 });
    }

    console.log("[razorpay-webhook] Payment confirmed for registration:", registration.id);
    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Handle payment.failed — mark registration as failed and release seats
  if (event === "payment.failed") {
    const payment = payload.payload?.payment?.entity;
    const notes = payment?.notes ?? {};
    const registrationId = notes.registration_id;

    if (registrationId) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Get registration details for seat release
      const { data: reg } = await supabase
        .from("registrations")
        .select("id, event_id, quantity, payment_status")
        .eq("id", registrationId)
        .single();

      if (reg && reg.payment_status !== "paid") {
        // Mark as failed
        await supabase
          .from("registrations")
          .update({ payment_status: "failed", ticket_status: "cancelled" })
          .eq("id", registrationId);

        // Release seats
        const { data: event } = await supabase
          .from("events")
          .select("available_seats, total_seats")
          .eq("id", reg.event_id)
          .single();

        if (event) {
          await supabase
            .from("events")
            .update({
              available_seats: Math.min(event.total_seats, event.available_seats + reg.quantity),
            })
            .eq("id", reg.event_id);
        }

        console.log("[razorpay-webhook] Payment failed, seats released for:", registrationId);
      }
    }

    return new Response(JSON.stringify({ status: "ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Other events — acknowledge but don't process
  console.log("[razorpay-webhook] Unhandled event:", event);
  return new Response(JSON.stringify({ status: "ignored" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
