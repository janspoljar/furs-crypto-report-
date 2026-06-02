"use server";

import { redirect } from "next/navigation";
import Stripe from "stripe";
import { getUserFromServer } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function createCheckoutSession() {
  const { user } = await getUserFromServer();
  if (!user) redirect("/login");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price: PRO_PRICE_ID,
        quantity: 1,
      },
    ],
    customer_email: user.email,
    metadata: {
      user_id: user.id,
    },
    success_url: `${APP_URL}/cenik?success=1`,
    cancel_url: `${APP_URL}/cenik`,
    payment_method_types: ["card", "sepa_debit"],
    locale: "sl",
    allow_promotion_codes: true,
  });

  if (!session.url) {
    throw new Error("Stripe session URL not returned.");
  }

  redirect(session.url);
}
