import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY ?? "";

if (!supabaseUrl || !supabaseKey) {
  console.warn("SUPABASE_URL / SUPABASE_SERVICE_KEY not set — file uploads will fail");
}

// We only use Supabase Storage (no realtime subscriptions), but the client
// initializes a Realtime socket eagerly and Node < 22 has no global
// WebSocket, so we supply the `ws` package explicitly to avoid a crash.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { transport: WebSocket as never },
});
export const FILES_BUCKET = "meeting-files";
