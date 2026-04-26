// Validates a promo code server-side. Returns { valid, code, discount, message }.
// Currently supports a single hardcoded promo "KAARI10" => 10% off, min subtotal 0, no expiry.
// Centralizing here so the same logic powers checkout UI + create-order.
import { corsHeaders } from "../_shared/cors.ts";

type PromoDef = {
  code: string;
  type: "percent" | "flat";
  value: number;
  min_subtotal: number;
  expires_at: string | null; // ISO date or null
  active: boolean;
};

const PROMOS: Record<string, PromoDef> = {
  KAARI10: { code: "KAARI10", type: "percent", value: 10, min_subtotal: 0, expires_at: null, active: true },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);
  try {
    const { code, subtotal } = await req.json();
    if (typeof code !== "string" || !code.trim()) {
      return json({ valid: false, message: "Enter a promo code" }, 400);
    }
    const sub = Math.max(0, Number(subtotal) || 0);
    const key = code.trim().toUpperCase();
    const promo = PROMOS[key];
    if (!promo || !promo.active) {
      return json({ valid: false, message: "Invalid promo code" });
    }
    if (promo.expires_at && new Date(promo.expires_at).getTime() < Date.now()) {
      return json({ valid: false, message: "This promo has expired" });
    }
    if (sub < promo.min_subtotal) {
      return json({ valid: false, message: `Minimum order ₹${promo.min_subtotal} required` });
    }
    const discount = promo.type === "percent"
      ? Math.round(sub * (promo.value / 100))
      : Math.min(sub, promo.value);
    return json({ valid: true, code: promo.code, discount, message: `${promo.value}% off applied` });
  } catch (e) {
    return json({ valid: false, message: String((e as Error).message ?? e) }, 400);
  }
});

function json(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
