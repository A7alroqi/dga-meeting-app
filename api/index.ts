import type { Request, Response } from "express";
import app from "../server/src/index";

// vercel.json rewrites /api/:path* to this stable function endpoint and
// forwards the matched path as the `path` query parameter. Restore the
// original URL before passing the request to the existing Express routers.
export default function handler(req: Request, res: Response) {
  const url = new URL(req.url, "http://localhost");
  const apiPath = url.searchParams.get("path");

  if (apiPath) {
    url.searchParams.delete("path");
    const query = url.searchParams.toString();
    req.url = `/api/${apiPath}${query ? `?${query}` : ""}`;
  } else if (!req.url.startsWith("/api/")) {
    req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
  }

  return app(req, res);
}
