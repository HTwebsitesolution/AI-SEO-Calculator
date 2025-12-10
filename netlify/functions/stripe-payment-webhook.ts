import type { Handler } from "@netlify/functions";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export const handler: Handler = async (event) => {
  const sig = event.headers['stripe-signature'];
  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body!,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return { statusCode: 400, body: `Webhook Error: ${(err as Error).message}` };
  }

  // Handle successful payment
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session;
    const orgId = session.metadata?.orgId;
    // TODO: Mark payment as successful in your DB for orgId
    // Example: await markPaymentSuccess(orgId, session.id);
  }

  return { statusCode: 200, body: 'ok' };
};
