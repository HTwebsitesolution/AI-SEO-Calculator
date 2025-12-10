import type { Handler } from "@netlify/functions";
// Save deployment config to DB and trigger play deployment.

export const handler: Handler = async (event) => {
  // TODO: Parse config, save to DB, trigger deployment logic
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
