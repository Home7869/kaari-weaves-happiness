import { corsHeaders } from "../_shared/cors.ts";
import { getAdminToken, verifyAdminToken } from "../_shared/admin.ts";
import { adminClient } from "../_shared/supabase.ts";

// Sanitises user-supplied text for use in a PostgREST `or(...)` filter so a
// stray comma/parenthesis can't break out of the expression.
function escapeForOr(s: string) {
  return s.replace(/[(),]/g, " ").trim();
}

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

      // Filters
      const mode = url.searchParams.get("mode");
      const paymentStatus = url.searchParams.get("payment_status");
      const qText = (url.searchParams.get("q") ?? "").trim();

      // Pagination (1-indexed page; clamp page_size to [5, 100])
      const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
      const pageSize = Math.min(100, Math.max(5, Number(url.searchParams.get("page_size") ?? "20") || 20));
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Build the filtered query (used for both stats + page).
      const buildFiltered = () => {
        let q = supabase.from("orders").select("*", { count: "exact" });
        if (mode && mode !== "all") q = q.eq("cashfree_mode", mode);
        if (paymentStatus && paymentStatus !== "all") q = q.eq("payment_status", paymentStatus);
        if (qText) {
          const safe = escapeForOr(qText);
          if (safe) q = q.or(`order_number.ilike.%${safe}%,cashfree_order_id.ilike.%${safe}%`);
        }
        return q;
      };

      // Stats: aggregate over the *entire filtered set* (not just current page)
      // so the cards reflect what the admin is actually filtering by.
      const { data: allFiltered, error: aggErr } = await buildFiltered();
      if (aggErr) throw aggErr;
      const allRows = allFiltered ?? [];
      const paid = allRows.filter((o) => o.payment_status === "paid");
      const revenue = paid.reduce((s, o) => s + (o.total ?? 0), 0);
      const pending = allRows.filter((o) => o.payment_status === "pending").length;

      // Paginated rows
      const { data: orders, error, count } = await buildFiltered()
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;

      const { count: productCount } = await supabase
        .from("products").select("*", { count: "exact", head: true });
      const { count: customerCount } = await supabase
        .from("customers").select("*", { count: "exact", head: true });

      return json({
        orders,
        page,
        page_size: pageSize,
        total: count ?? allRows.length,
        stats: {
          totalOrders: count ?? allRows.length,
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
      const body = await req.json();
      const {
        order_status,
        payment_status,
        tracking_carrier,
        tracking_number,
        tracking_url,
      } = body ?? {};

      const update: Record<string, unknown> = {};
      if (order_status) update.order_status = order_status;
      if (payment_status) update.payment_status = payment_status;
      if (typeof tracking_carrier === "string") update.tracking_carrier = tracking_carrier || null;
      if (typeof tracking_number === "string") update.tracking_number = tracking_number || null;
      if (typeof tracking_url === "string") update.tracking_url = tracking_url || null;

      // Auto-stamp shipped_at / delivered_at when admin transitions status
      if (order_status === "shipped") update.shipped_at = new Date().toISOString();
      if (order_status === "delivered") update.delivered_at = new Date().toISOString();

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
