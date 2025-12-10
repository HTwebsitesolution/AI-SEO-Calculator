import type { Handler } from "@netlify/functions";
import fetch from "node-fetch";

export const handler: Handler = async (event) => {
  const { name, params } = JSON.parse(event.body || "{}");
  const mid = process.env.GA4_MEASUREMENT_ID!;
  const sec = process.env.GA4_API_SECRET!;
  const res = await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${mid}&api_secret=${sec}`, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify({ client_id: "server-evt", events: [{ name, params }] })
  });
  return { statusCode: res.ok ? 200 : 500, body: "" };
};
