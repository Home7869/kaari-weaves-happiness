import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { CATEGORIES } from "@/lib/format";
import { toast } from "sonner";
import { ArrowLeft, Upload, X, GripVertical, Plus, Loader2 } from "lucide-react";

type ColorOpt = { name: string; hex: string };

const empty = {
  slug: "",
  name: "",
  category: "wearables",
  description: "",
  price: 0,
  original_price: null as number | null,
  badge: "",
  sizes: [] as string[],
  colors: [] as ColorOpt[],
  images: [] as string[],
  stock_status: "in_stock",
  care_instructions: "",
  shipping_info: "",
  is_featured: false,
  is_active: true,
};

// Convert any browser-supported image to webp using a canvas. Falls back to original.
async function toWebp(file: File, quality = 0.86): Promise<File> {
  if (file.type === "image/webp") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    const max = 1600;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/webp", quality),
    );
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return file; // server will accept jpg/png/avif as well
  }
}

export default function AdminProductEditor() {
  const { id } = useParams();
  const nav = useNavigate();
  const [p, setP] = useState<any>(empty);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    api.adminGetProduct(id).then((data) => setP({ ...empty, ...data })).catch((e) => toast.error(e.message));
  }, [id]);

  const set = (k: string, v: any) => setP((s: any) => ({ ...s, [k]: v }));

  const slugify = (n: string) =>
    n.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleFiles = async (files: FileList | File[] | null) => {
    if (!files) return;
    const list = Array.from(files);
    if (!list.length) return;
    if (!p.slug && !p.name) { toast.error("Set product name or slug first"); return; }
    const slug = p.slug || slugify(p.name);
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const f of list) {
        if (!f.type.startsWith("image/")) { toast.error(`Skipped ${f.name}: not an image`); continue; }
        const webp = await toWebp(f);
        const res = await api.adminUpload(webp, slug);
        uploaded.push(res.url);
      }
      if (uploaded.length) {
        set("images", [...(p.images ?? []), ...uploaded]);
        toast.success(`${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded`);
      }
    } catch (e: any) { toast.error(e.message); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const removeImage = (idx: number) => set("images", p.images.filter((_: any, i: number) => i !== idx));

  // Drag-reorder images
  const onImgDragStart = (i: number) => setDragIdx(i);
  const onImgDrop = (target: number) => {
    if (dragIdx === null || dragIdx === target) return;
    const arr = [...p.images];
    const [m] = arr.splice(dragIdx, 1);
    arr.splice(target, 0, m);
    set("images", arr);
    setDragIdx(null);
  };

  // Color helpers
  const addColor = () => set("colors", [...(p.colors ?? []), { name: "", hex: "#8B1F2A" }]);
  const updateColor = (i: number, patch: Partial<ColorOpt>) =>
    set("colors", p.colors.map((c: ColorOpt, idx: number) => (idx === i ? { ...c, ...patch } : c)));
  const removeColor = (i: number) => set("colors", p.colors.filter((_: any, idx: number) => idx !== i));

  const save = async () => {
    if (!p.name?.trim()) { toast.error("Name is required"); return; }
    if (!p.price || Number(p.price) <= 0) { toast.error("Price must be greater than 0"); return; }
    setLoading(true);
    try {
      const body = {
        ...p,
        slug: p.slug || slugify(p.name),
        price: Number(p.price) || 0,
        original_price: p.original_price ? Number(p.original_price) : null,
        colors: (p.colors ?? []).filter((c: ColorOpt) => c.name?.trim()),
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
        <button onClick={save} disabled={loading} className="px-5 py-2 bg-maroon text-gold rounded-lg text-xs uppercase tracking-[0.14em] disabled:opacity-50 flex items-center gap-2">
          {loading && <Loader2 size={14} className="animate-spin" />}{loading ? "Saving…" : "Save Product"}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5 bg-ivory border border-gold/25 rounded-xl p-6">
          <div>
            <label className={labelCls}>Name *</label>
            <input className={inputCls} value={p.name} onChange={(e) => { set("name", e.target.value); if (!id && !p.slug) set("slug", slugify(e.target.value)); }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Slug</label>
              <input className={inputCls} value={p.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto from name" />
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
              <label className={labelCls}>Price (₹) *</label>
              <input type="number" min={0} className={inputCls} value={p.price} onChange={(e) => set("price", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>MRP (₹)</label>
              <input type="number" min={0} className={inputCls} value={p.original_price ?? ""} onChange={(e) => set("original_price", e.target.value || null)} />
            </div>
            <div>
              <label className={labelCls}>Badge</label>
              <input className={inputCls} value={p.badge ?? ""} onChange={(e) => set("badge", e.target.value)} placeholder="New / Bestseller" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Sizes (comma)</label>
              <input className={inputCls} value={(p.sizes ?? []).join(", ")} onChange={(e) => set("sizes", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} placeholder="S, M, L, XL" />
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

          {/* Colors */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`${labelCls} mb-0`}>Color options</label>
              <button type="button" onClick={addColor} className="text-xs text-maroon hover:text-maroon-dp flex items-center gap-1"><Plus size={12} />Add color</button>
            </div>
            <div className="space-y-2">
              {(p.colors ?? []).map((c: ColorOpt, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="color" value={c.hex || "#8B1F2A"} onChange={(e) => updateColor(i, { hex: e.target.value })} className="h-9 w-12 rounded border border-gold/30 bg-cream cursor-pointer" />
                  <input className={`${inputCls} flex-1`} placeholder="Color name (Maroon)" value={c.name} onChange={(e) => updateColor(i, { name: e.target.value })} />
                  <input className={`${inputCls} w-28`} placeholder="#hex" value={c.hex} onChange={(e) => updateColor(i, { hex: e.target.value })} />
                  <button type="button" onClick={() => removeColor(i)} className="p-2 text-destructive hover:bg-destructive/10 rounded"><X size={14} /></button>
                </div>
              ))}
              {!(p.colors?.length) && <p className="text-xs text-muted-foreground">No color options added.</p>}
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
            <label className="flex items-center gap-2 text-sm mb-2"><input type="checkbox" checked={p.is_active} onChange={(e) => set("is_active", e.target.checked)} />Active (visible on storefront)</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.is_featured} onChange={(e) => set("is_featured", e.target.checked)} />Featured on home</label>
          </div>

          <div className="bg-ivory border border-gold/25 rounded-xl p-6">
            <h3 className="font-display text-lg text-maroon-dp mb-3">Images</h3>
            <p className="text-[10px] text-muted-foreground mb-3">Drag to reorder. First image is the cover. Auto-converted to .webp.</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {(p.images ?? []).map((url: string, i: number) => (
                <div
                  key={i}
                  draggable
                  onDragStart={() => onImgDragStart(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onImgDrop(i)}
                  className={`relative aspect-square rounded-lg overflow-hidden bg-cream group border ${
                    dragIdx === i ? "border-maroon" : "border-transparent"
                  }`}
                >
                  <img src={url} className="w-full h-full object-cover" alt="" />
                  {i === 0 && <span className="absolute top-1 left-1 bg-maroon text-gold text-[9px] uppercase px-1.5 py-0.5 rounded">Cover</span>}
                  <span className="absolute bottom-1 left-1 text-gold opacity-0 group-hover:opacity-100"><GripVertical size={12} /></span>
                  <button onClick={() => removeImage(i)} className="absolute top-1 right-1 p-1 bg-maroon text-gold rounded opacity-0 group-hover:opacity-100"><X size={12} /></button>
                </div>
              ))}
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              className={`rounded-lg border-2 border-dashed p-4 text-center transition-colors ${
                dragOver ? "border-maroon bg-cream-warm" : "border-maroon/30 bg-cream/40"
              }`}
            >
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="w-full py-2 text-sm text-maroon hover:text-maroon-dp flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? "Uploading…" : "Click or drop images here"}
              </button>
              <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG, WebP, AVIF · max 8MB each</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
