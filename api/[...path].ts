// A catch-all Vercel Function keeps the existing Express /api routes intact.
// Vercel passes the original request URL through to this Express application.
import app from "../server/src/index";

export default app;
