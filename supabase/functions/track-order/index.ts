// Public customer order tracking. Looks up an order by order_number AND
// matching customer_email (case-insensitive) so a stranger cannot enumerate
// other people's orders. Returns a sanitised view (no internal fields).
import { corsHeaders } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST" && req.method !== "GET") return json({ error: "Method not allowed" }, 405);

  try {
    let order_number = "";
    let email = "";
    if (req.method === "POST") {
      const body = await req.json();
      order_number = String(body?.order_number ?? "").trim();
      email = String(body?.email ?? "").trim().toLowerCase();
    } else {
      const u = new URL(req.url);
      order_number = (u.searchParams.get("order_number") ?? "").trim();
      email = (u.searchParams.get("email") ?? "").trim().toLowerCase();
    }
    if (!order_number || !email) return json({ error: "order_number and email are required" }, 400);

    const supabase = adminClient();
    const { data, error } = await supabase
      .from("orders")
      .select("order_number, customer_name, customer_email, items, subtotal, shipping_charges, total, payment_status, order_status, created_at, updated_at, webhook_received_at, shipping_address, cashfree_mode, tracking_carrier, tracking_number, tracking_url, shipped_at, delivered_at")
      .eq("order_number", order_number)
      .ilike("customer_email", email)
      .maybeSingle();
    if (error) throw error;
    if (!data) return json({ error: "Order not found. Please check your order number and email." }, 404);

    return json({
      order_number: data.order_number,
      customer_name: data.customer_name,
      items: data.items,
      subtotal: data.subtotal,
      shipping_charges: data.shipping_charges,
      total: data.total,
      payment_status: data.payment_status,
      order_status: data.order_status,
      created_at: data.created_at,
      updated_at: data.updated_at,
      webhook_received_at: data.webhook_received_at,
      shipping_address: data.shipping_address,
      tracking_carrier: data.tracking_carrier,
      tracking_number: data.tracking_number,
      tracking_url: data.tracking_url,
      shipped_at: data.shipped_at,
      delivered_at: data.delivered_at,
    });
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});

function json(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
