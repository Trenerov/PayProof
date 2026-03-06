import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const { app } = await import("../server/src/app.js");
  return app(request, response);
}
