import { corsHeaders } from "../_shared/cors.ts";
import { getAdminToken, verifyAdminToken } from "../_shared/admin.ts";
import { adminClient } from "../_shared/supabase.ts";

// Accepts multipart/form-data with field "file" (must be image/webp) and "slug".
// Stores at products/{slug}/{timestamp}-{rand}.webp and returns { url, path }.
// Also supports DELETE with { path } JSON body.

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (!(await verifyAdminToken(getAdminToken(req)))) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabase = adminClient();

  try {
    if (req.method === "POST") {
      const form = await req.formData();
      const file = form.get("file");
      const slug = String(form.get("slug") ?? "misc");
      if (!(file instanceof File)) return json({ error: "file required" }, 400);
      if (file.type !== "image/webp") {
        return json({ error: "Only .webp files allowed. Convert before upload." }, 400);
      }
      if (file.size > 4 * 1024 * 1024) {
        return json({ error: "File too large (max 4MB)" }, 400);
      }
      const ts = Date.now().toString(36);
      const rand = Math.random().toString(36).slice(2, 8);
      const path = `products/${slug}/${ts}-${rand}.webp`;
      const { error: upErr } = await supabase.storage.from("product-images").upload(path, file, {
        contentType: "image/webp",
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);
      return json({ url: pub.publicUrl, path });
    }

    if (req.method === "DELETE") {
      const { path } = await req.json();
      if (!path) return json({ error: "path required" }, 400);
      const { error } = await supabase.storage.from("product-images").remove([path]);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
