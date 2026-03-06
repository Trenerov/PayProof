import type { VercelRequest, VercelResponse } from "@vercel/node";
import { app } from "../server/src/app.js";

export default function handler(request: VercelRequest, response: VercelResponse) {
  return app(request, response);
}
