import { corsHeaders } from "../_shared/cors.ts";
import { getAdminToken, verifyAdminToken } from "../_shared/admin.ts";
import { adminClient } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!(await verifyAdminToken(getAdminToken(req)))) return json({ error: "Unauthorized" }, 401);

  const supabase = adminClient();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  try {
    if (req.method === "GET") {
      if (id) {
        const { data, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
        if (error) throw error;
        return json(data);
      }
      // Stats + orders for dashboard/list
      const { data: orders, error } = await supabase
        .from("orders").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      const { count: productCount } = await supabase
        .from("products").select("*", { count: "exact", head: true });
      const { count: customerCount } = await supabase
        .from("customers").select("*", { count: "exact", head: true });
      const paid = (orders ?? []).filter((o) => o.payment_status === "paid");
      const revenue = paid.reduce((s, o) => s + (o.total ?? 0), 0);
      const pending = (orders ?? []).filter((o) => o.payment_status === "pending").length;
      return json({
        orders,
        stats: {
          totalOrders: orders?.length ?? 0,
          paidOrders: paid.length,
          revenue,
          pendingOrders: pending,
          productCount: productCount ?? 0,
          customerCount: customerCount ?? 0,
        },
      });
    }

    if (req.method === "PUT") {
      if (!id) return json({ error: "id required" }, 400);
      const { order_status, payment_status } = await req.json();
      const update: Record<string, unknown> = {};
      if (order_status) update.order_status = order_status;
      if (payment_status) update.payment_status = payment_status;
      const { data, error } = await supabase.from("orders").update(update).eq("id", id).select().single();
      if (error) throw error;
      return json(data);
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
