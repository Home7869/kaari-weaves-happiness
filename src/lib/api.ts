import { supabase } from "@/integrations/supabase/client";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export const ADMIN_TOKEN_KEY = "kaari_admin_token";

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}
export function setAdminToken(t: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, t);
}
export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

async function callFn(
  path: string,
  opts: { method?: string; body?: unknown; query?: Record<string, string>; admin?: boolean; isFormData?: boolean } = {},
) {
  const headers: Record<string, string> = {
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
  };
  if (opts.admin) {
    const t = getAdminToken();
    if (t) headers["x-admin-token"] = t;
  }
  if (!opts.isFormData) headers["Content-Type"] = "application/json";

  const url = new URL(`${FN_URL}${path}`);
  if (opts.query) for (const [k, v] of Object.entries(opts.query)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    method: opts.method ?? "GET",
    headers,
    body: opts.body
      ? (opts.isFormData ? (opts.body as FormData) : JSON.stringify(opts.body))
      : undefined,
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const msg = data?.error ?? res.statusText ?? "Request failed";
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

// ---------- Public ----------
export const api = {
  // Public products via supabase-js (RLS permits SELECT on active products)
  async listProducts(opts: { category?: string; search?: string; sort?: string } = {}) {
    let q = supabase.from("products").select("*").eq("is_active", true);
    if (opts.category && opts.category !== "all") q = q.eq("category", opts.category);
    if (opts.search) q = q.ilike("name", `%${opts.search}%`);
    switch (opts.sort) {
      case "price_asc": q = q.order("price", { ascending: true }); break;
      case "price_desc": q = q.order("price", { ascending: false }); break;
      case "rating": q = q.order("rating", { ascending: false }); break;
      case "popular": q = q.order("sold_count", { ascending: false }); break;
      default: q = q.order("created_at", { ascending: false });
    }
    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  },
  async getProductBySlug(slug: string) {
    const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    return data;
  },
  async getReviews(productId: string) {
    const { data, error } = await supabase.from("reviews").select("*")
      .eq("product_id", productId).order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  async getSettings() {
    const { data, error } = await supabase.from("settings").select("*").eq("id", 1).maybeSingle();
    if (error) throw error;
    return data;
  },

  // Orders
  createOrder: (body: unknown) => callFn("/create-order", { method: "POST", body }),
  getOrder: (order_number: string) => callFn("/get-order", { query: { order_number } }),
  trackOrder: (order_number: string, email: string) =>
    callFn("/track-order", { method: "POST", body: { order_number, email } }),

  // Admin
  adminLogin: (password: string) => callFn("/admin-login", { method: "POST", body: { password } }),
  adminListProducts: () => callFn("/admin-products", { admin: true }),
  adminGetProduct: (id: string) => callFn("/admin-products", { admin: true, query: { id } }),
  adminCreateProduct: (body: unknown) => callFn("/admin-products", { method: "POST", body, admin: true }),
  adminUpdateProduct: (id: string, body: unknown) => callFn("/admin-products", { method: "PUT", body, admin: true, query: { id } }),
  adminDeleteProduct: (id: string) => callFn("/admin-products", { method: "DELETE", admin: true, query: { id } }),
  adminUpload: (file: File, slug: string) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("slug", slug);
    return callFn("/admin-upload", { method: "POST", body: fd, admin: true, isFormData: true });
  },
  adminDeleteImage: (path: string) => callFn("/admin-upload", { method: "DELETE", admin: true, body: { path } }),
  adminOrders: () => callFn("/admin-orders", { admin: true }),
  adminUpdateOrder: (id: string, body: unknown) => callFn("/admin-orders", { method: "PUT", admin: true, query: { id }, body }),
  adminCustomers: () => callFn("/admin-customers", { admin: true }),
};
