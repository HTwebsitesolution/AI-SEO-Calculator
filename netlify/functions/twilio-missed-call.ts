import type { Handler } from "@netlify/functions";
import Twilio from "twilio";

const client = Twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

export const handler: Handler = async (event) => {
  const payload = new URLSearchParams(event.body || ""); // Twilio webhook form-encoded
  const from = payload.get("From"); // caller
  const to   = payload.get("To");   // your business number
  const status = payload.get("CallStatus"); // "busy" | "no-answer" | ...

  if (status === "no-answer" || status === "busy" || status === "failed") {
    await client.messages.create({
      to: from!,
      from: process.env.TWILIO_PHONE_NUMBER!,
      body: "Sorry we missed you. Reply 1) Callback 2) Book 3) Ask a question."
    });
    // TODO: record event to DB + GA4 via Measurement Protocol
  }
  return { statusCode: 200, body: "" };
};
