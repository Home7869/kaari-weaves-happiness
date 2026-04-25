import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { CATEGORIES } from "@/lib/format";
import { toast } from "sonner";
import { ArrowLeft, Upload, X } from "lucide-react";

const empty = {
  slug: "",
  name: "",
  category: "wearables",
  description: "",
  price: 0,
  original_price: null as number | null,
  badge: "",
  sizes: [] as string[],
  colors: [] as { name: string; hex: string }[],
  images: [] as string[],
  stock_status: "in_stock",
  care_instructions: "",
  shipping_info: "",
  is_featured: false,
  is_active: true,
};

export default function AdminProductEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const [p, setP] = useState<any>(empty);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    api.adminGetProduct(id).then((data) => setP({ ...empty, ...data })).catch((e) => toast.error(e.message));
  }, [id]);

  const set = (k: string, v: any) => setP((s: any) => ({ ...s, [k]: v }));

  const slugify = (n: string) =>
    n.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const onUpload = async (files: FileList | null) => {
    if (!files || !files.length) return;
    if (!p.slug) { toast.error("Set a slug first"); return; }
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const f of Array.from(files)) {
        const res = await api.adminUpload(f, p.slug);
        uploaded.push(res.url);
      }
      set("images", [...(p.images ?? []), ...uploaded]);
      toast.success("Uploaded");
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const removeImage = (idx: number) => {
    set("images", p.images.filter((_: any, i: number) => i !== idx));
  };

  const save = async () => {
    setLoading(true);
    try {
      const body = {
        ...p,
        slug: p.slug || slugify(p.name),
        price: Number(p.price) || 0,
        original_price: p.original_price ? Number(p.original_price) : null,
      };
      if (id) await api.adminUpdateProduct(id, body);
      else await api.adminCreateProduct(body);
      toast.success("Saved");
      nav("/admin/products");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const inputCls = "w-full bg-cream border border-gold/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-maroon";
  const labelCls = "block text-xs uppercase tracking-[0.14em] text-muted-foreground mb-1.5";

  return (
    <AdminLayout>
      <button onClick={() => nav(-1)} className="flex items-center gap-2 text-sm text-muted-foreground mb-4 hover:text-maroon"><ArrowLeft size={14} />Back</button>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-display text-3xl text-maroon-dp">{id ? "Edit" : "New"} Product</h1>
        <button onClick={save} disabled={loading} className="px-5 py-2 bg-maroon text-gold rounded-lg text-xs uppercase tracking-[0.14em] disabled:opacity-50">
          {loading ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5 bg-ivory border border-gold/25 rounded-xl p-6">
          <div>
            <label className={labelCls}>Name</label>
            <input className={inputCls} value={p.name} onChange={(e) => { set("name", e.target.value); if (!id && !p.slug) set("slug", slugify(e.target.value)); }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Slug</label>
              <input className={inputCls} value={p.slug} onChange={(e) => set("slug", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select className={inputCls} value={p.category} onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.filter((c) => c.id !== "all").map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea className={`${inputCls} min-h-32`} value={p.description ?? ""} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Price (₹)</label>
              <input type="number" className={inputCls} value={p.price} onChange={(e) => set("price", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>MRP (₹)</label>
              <input type="number" className={inputCls} value={p.original_price ?? ""} onChange={(e) => set("original_price", e.target.value || null)} />
            </div>
            <div>
              <label className={labelCls}>Badge</label>
              <input className={inputCls} value={p.badge ?? ""} onChange={(e) => set("badge", e.target.value)} placeholder="New / Bestseller" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Sizes (comma)</label>
              <input className={inputCls} value={(p.sizes ?? []).join(", ")} onChange={(e) => set("sizes", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} />
            </div>
            <div>
              <label className={labelCls}>Stock status</label>
              <select className={inputCls} value={p.stock_status} onChange={(e) => set("stock_status", e.target.value)}>
                <option value="in_stock">In stock</option>
                <option value="low_stock">Low stock</option>
                <option value="out_of_stock">Out of stock</option>
                <option value="made_to_order">Made to order</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Care instructions</label>
            <textarea className={inputCls} value={p.care_instructions ?? ""} onChange={(e) => set("care_instructions", e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Shipping info</label>
            <textarea className={inputCls} value={p.shipping_info ?? ""} onChange={(e) => set("shipping_info", e.target.value)} />
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-ivory border border-gold/25 rounded-xl p-6">
            <h3 className="font-display text-lg text-maroon-dp mb-3">Visibility</h3>
            <label className="flex items-center gap-2 text-sm mb-2"><input type="checkbox" checked={p.is_active} onChange={(e) => set("is_active", e.target.checked)} />Active</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.is_featured} onChange={(e) => set("is_featured", e.target.checked)} />Featured</label>
          </div>

          <div className="bg-ivory border border-gold/25 rounded-xl p-6">
            <h3 className="font-display text-lg text-maroon-dp mb-3">Images (.webp)</h3>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {(p.images ?? []).map((url: string, i: number) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-cream group">
                  <img src={url} className="w-full h-full object-cover" />
                  <button onClick={() => removeImage(i)} className="absolute top-1 right-1 p-1 bg-maroon text-gold rounded opacity-0 group-hover:opacity-100"><X size={12} /></button>
                </div>
              ))}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onUpload(e.target.files)} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full py-2 border border-dashed border-maroon/40 rounded-lg text-sm text-maroon hover:bg-maroon/5 flex items-center justify-center gap-2 disabled:opacity-50">
              <Upload size={14} />{uploading ? "Uploading…" : "Upload images"}
            </button>
            <p className="text-[10px] text-muted-foreground mt-2">Auto-converted to .webp on upload.</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
