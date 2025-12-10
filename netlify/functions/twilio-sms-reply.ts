import type { Handler } from "@netlify/functions";
import Twilio from "twilio";

const client = Twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);

export const handler: Handler = async (event) => {
  const payload = new URLSearchParams(event.body || "");
  const from = payload.get("From");
  const body = (payload.get("Body") || "").trim();

  let reply = "Sorry, I didn't understand. Reply 1) Callback 2) Book 3) Ask a question.";
  if (body === "1") {
    // Trigger callback logic here
    reply = "We’ll call you back ASAP!";
  } else if (body === "2") {
    // Send booking link
    reply = "Book a time here: https://calendly.com/...";
  } else if (body === "3") {
    // FAQ logic or handoff
    reply = "Please reply with your question and we’ll get back to you.";
  }

  await client.messages.create({
    to: from!,
    from: process.env.TWILIO_PHONE_NUMBER!,
    body: reply
  });

  return { statusCode: 200, body: "" };
};
