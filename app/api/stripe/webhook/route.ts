import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendProWelcomeEmail } from "@/lib/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[stripe/webhook] Invalid signature:", err.message);
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;

    if (!userId) {
      console.error("[stripe/webhook] Missing user_id in session metadata");
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    const validUntil = new Date();
    validUntil.setFullYear(validUntil.getFullYear() + 1);

    const { error } = await supabaseAdmin
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          plan: "pro",
          valid_until: validUntil.toISOString(),
          paid_override: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("[stripe/webhook] Supabase upsert error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const customerEmail = session.customer_details?.email || session.customer_email;
    if (customerEmail) {
      await sendProWelcomeEmail({ to: customerEmail, validUntil: validUntil.toISOString() });
    }

    console.log(`[stripe/webhook] Pro activated for user ${userId} until ${validUntil.toISOString()}`);
  }

  return NextResponse.json({ received: true });
}
