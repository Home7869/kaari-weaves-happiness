import { corsHeaders } from "../_shared/cors.ts";
import { getAdminToken, verifyAdminToken } from "../_shared/admin.ts";
import { adminClient } from "../_shared/supabase.ts";

function slugify(s: string) {
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!(await verifyAdminToken(getAdminToken(req)))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = adminClient();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  try {
    if (req.method === "GET") {
      if (id) {
        const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
        if (error) throw error;
        return json(data);
      }
      const { data, error } = await supabase
        .from("products").select("*").order("created_at", { ascending: false }).limit(1000);
      if (error) throw error;
      return json(data);
    }

    if (req.method === "POST") {
      const body = await req.json();
      if (!body.name || typeof body.price !== "number") {
        return json({ error: "name and price required" }, 400);
      }
      const slug = body.slug ? slugify(body.slug) : slugify(body.name) + "-" + Date.now().toString(36);
      const insert = sanitize({ ...body, slug });
      const { data, error } = await supabase.from("products").insert(insert).select().single();
      if (error) throw error;
      return json(data);
    }

    if (req.method === "PUT") {
      if (!id) return json({ error: "id required" }, 400);
      const body = await req.json();
      const update = sanitize(body);
      if (update.slug) update.slug = slugify(update.slug);
      const { data, error } = await supabase.from("products").update(update).eq("id", id).select().single();
      if (error) throw error;
      return json(data);
    }

    if (req.method === "DELETE") {
      if (!id) return json({ error: "id required" }, 400);
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});

function sanitize(b: any) {
  const allowed = [
    "slug", "name", "category", "description", "price", "original_price", "badge",
    "sizes", "colors", "images", "stock_status", "care_instructions", "shipping_info",
    "is_featured", "is_active", "rating",
  ];
  const out: Record<string, unknown> = {};
  for (const k of allowed) if (k in b) out[k] = b[k];
  return out;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
