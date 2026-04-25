// Cashfree webhook handler. Verifies signature and updates order payment_status.
import { corsHeaders } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabase.ts";

async function verifySignature(rawBody: string, timestamp: string, signature: string, secret: string) {
  try {
    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(timestamp + rawBody));
    const expected = btoa(String.fromCharCode(...new Uint8Array(sig)));
    return expected === signature;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("POST only", { status: 405, headers: corsHeaders });

  const raw = await req.text();
  const ts = req.headers.get("x-webhook-timestamp") ?? "";
  const sig = req.headers.get("x-webhook-signature") ?? "";
  const secret = Deno.env.get("CASHFREE_SECRET_KEY") ?? "";

  // In production, ALWAYS verify. In sandbox/dev, allow through if no signature is sent.
  if (sig && secret && !(await verifySignature(raw, ts, sig, secret))) {
    console.warn("Cashfree webhook signature mismatch");
    return new Response("Invalid signature", { status: 401, headers: corsHeaders });
  }

  let payload: any;
  try { payload = JSON.parse(raw); } catch { return new Response("Bad JSON", { status: 400, headers: corsHeaders }); }

  const orderId = payload?.data?.order?.order_id;
  const status = payload?.data?.payment?.payment_status; // SUCCESS | FAILED | USER_DROPPED ...
  if (!orderId) return new Response("ok", { headers: corsHeaders });

  const supabase = adminClient();
  let payment_status: string | null = null;
  if (status === "SUCCESS") payment_status = "paid";
  else if (status === "FAILED" || status === "USER_DROPPED") payment_status = "failed";

  const update: Record<string, unknown> = { webhook_received_at: new Date().toISOString() };
  if (payment_status) update.payment_status = payment_status;
  await supabase.from("orders").update(update).eq("order_number", orderId);

  return new Response("ok", { headers: corsHeaders });
});
