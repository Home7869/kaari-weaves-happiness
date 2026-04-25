// Creates an order in the DB and (if Cashfree credentials are set) creates a
// Cashfree payment session. Returns { order_number, payment_session_id?, cashfree_order_id?, stub? }.
// If credentials are missing it falls back to "stub" mode so the front-end can demo the flow.
import { corsHeaders } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabase.ts";

const CASHFREE_BASE = (Deno.env.get("CASHFREE_ENV") ?? "sandbox").toLowerCase() === "production"
  ? "https://api.cashfree.com/pg"
  : "https://sandbox.cashfree.com/pg";

function genOrderNumber() {
  const n = Math.floor(1000 + Math.random() * 9000);
  return `KAARI-${Date.now().toString(36).toUpperCase()}-${n}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const supabase = adminClient();
  try {
    const body = await req.json();
    const { customer, items, return_url } = body;
    if (!customer?.name || !customer?.email || !customer?.phone || !customer?.address) {
      return json({ error: "Missing customer fields" }, 400);
    }
    if (!Array.isArray(items) || items.length === 0) return json({ error: "Cart is empty" }, 400);

    // Compute totals from server-side products to prevent tampering
    const ids = [...new Set(items.map((i: any) => i.product_id))];
    const { data: products, error: pErr } = await supabase
      .from("products").select("id, name, price, images").in("id", ids);
    if (pErr) throw pErr;
    const pMap = new Map(products!.map((p) => [p.id, p]));
    let subtotal = 0;
    const lineItems = items.map((i: any) => {
      const p = pMap.get(i.product_id);
      if (!p) throw new Error("Product not found: " + i.product_id);
      const qty = Math.max(1, Math.min(10, Number(i.qty) || 1));
      subtotal += p.price * qty;
      return {
        product_id: p.id, name: p.name, price: p.price, qty,
        size: i.size ?? null, color: i.color ?? null,
        image: Array.isArray(p.images) && p.images[0] ? p.images[0] : null,
      };
    });

    const { data: settings } = await supabase.from("settings").select("*").eq("id", 1).single();
    const threshold = settings?.free_shipping_threshold ?? 999;
    const shipFee = settings?.shipping_fee ?? 60;
    const shipping = subtotal >= threshold ? 0 : shipFee;
    const total = subtotal + shipping;
    const order_number = genOrderNumber();

    const cfModeEarly = (Deno.env.get("CASHFREE_ENV") ?? "sandbox").toLowerCase() === "production"
      ? "production" : "sandbox";

    // Insert order (pending)
    const { data: order, error: oErr } = await supabase.from("orders").insert({
      order_number,
      customer_name: customer.name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      shipping_address: customer.address,
      items: lineItems,
      subtotal, shipping_charges: shipping, total,
      payment_status: "pending",
      order_status: "processing",
      cashfree_mode: cfModeEarly,
    }).select().single();
    if (oErr) throw oErr;

    // Upsert customer record
    await supabase.from("customers").upsert({
      name: customer.name, email: customer.email, phone: customer.phone,
    }, { onConflict: "email" });

    // Try Cashfree
    const appId = Deno.env.get("CASHFREE_APP_ID");
    const secret = Deno.env.get("CASHFREE_SECRET_KEY");
    if (!appId || !secret || appId === "REPLACE_ME" || secret === "REPLACE_ME") {
      return json({
        stub: true,
        order_number,
        order_id: order.id,
        message: "Cashfree credentials not configured; order created in pending state for demo.",
      });
    }

    const cfRes = await fetch(`${CASHFREE_BASE}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": appId,
        "x-client-secret": secret,
      },
      body: JSON.stringify({
        order_id: order_number,
        order_amount: total,
        order_currency: "INR",
        customer_details: {
          customer_id: order.id,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone,
        },
        order_meta: {
          return_url: return_url ?? `${new URL(req.url).origin}/order-success?orderId=${order_number}`,
        },
      }),
    });
    const cfData = await cfRes.json();
    if (!cfRes.ok) {
      console.error("Cashfree create-order failed", cfData);
      return json({ error: "Payment gateway error", details: cfData, order_number }, 502);
    }

    await supabase.from("orders").update({
      payment_session_id: cfData.payment_session_id,
      cashfree_order_id: cfData.cf_order_id ?? cfData.order_id,
    }).eq("id", order.id);

    const cfMode = (Deno.env.get("CASHFREE_ENV") ?? "sandbox").toLowerCase() === "production"
      ? "production" : "sandbox";

    return json({
      order_number,
      order_id: order.id,
      payment_session_id: cfData.payment_session_id,
      cashfree_order_id: cfData.cf_order_id ?? cfData.order_id,
      cashfree_mode: cfMode,
    });
  } catch (e) {
    console.error(e);
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});

function json(d: unknown, s = 200) {
  return new Response(JSON.stringify(d), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
