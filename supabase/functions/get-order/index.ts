// Public lookup of an order by order_number for the success page.
// Returns sanitized fields only (no raw payment ids).
import { corsHeaders } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = new URL(req.url);
  const order_number = url.searchParams.get("order_number");
  if (!order_number) {
    return new Response(JSON.stringify({ error: "order_number required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabase = adminClient();
  const { data, error } = await supabase.from("orders")
    .select("order_number, customer_name, items, subtotal, shipping_charges, total, payment_status, order_status, created_at, shipping_address")
    .eq("order_number", order_number).maybeSingle();
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
