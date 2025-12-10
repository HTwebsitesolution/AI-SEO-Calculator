import type { Handler } from "@netlify/functions";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export const handler: Handler = async (event) => {
  const { orgId } = JSON.parse(event.body || "{}" );
  // TODO: Replace with your real Stripe price ID
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: "price_XXXXX", quantity: 1 }],
    success_url: `${process.env.APP_ORIGIN}/app?success=1`,
    cancel_url: `${process.env.APP_ORIGIN}/app?canceled=1`,
    metadata: { orgId }
  });
  return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
};
