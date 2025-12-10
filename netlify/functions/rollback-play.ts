import type { Handler } from "@netlify/functions";
// Rollback deployment for a given deployment_id.

export const handler: Handler = async (event) => {
  // TODO: Parse deployment_id, update DB, trigger rollback logic
  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
