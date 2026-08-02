import type { Request, Response } from "express";
import app from "../server/src/index";

// A Vercel API function can receive its route-relative URL (for example,
// `/auth/login`) instead of the public `/api/auth/login` URL. The Express
// application mounts every router under `/api`, so restore that prefix only
// when Vercel has removed it.
export default function handler(req: Request, res: Response) {
  if (!req.url.startsWith("/api/")) {
    req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
  }

  return app(req, res);
}
