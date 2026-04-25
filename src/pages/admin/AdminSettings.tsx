import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";

export default function AdminSettings() {
  const [s, setS] = useState<any>(null);
  useEffect(() => { api.getSettings().then(setS).catch((e) => toast.error(e.message)); }, []);
  if (!s) return <AdminLayout><div className="text-muted-foreground">Loading…</div></AdminLayout>;

  const Row = ({ label, value }: { label: string; value: any }) => (
    <div className="flex justify-between py-3 border-b border-gold/15 last:border-0">
      <div className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="text-sm text-maroon-dp">{value}</div>
    </div>
  );

  return (
    <AdminLayout>
      <h1 className="font-display text-3xl text-maroon-dp mb-6">Settings</h1>
      <div className="bg-ivory rounded-xl border border-gold/25 p-6 max-w-2xl">
        <Row label="Announcement" value={s.announcement_text} />
        <Row label="WhatsApp number" value={s.whatsapp_number} />
        <Row label="Instagram handle" value={`@${s.instagram_handle}`} />
        <Row label="Free shipping above" value={formatINR(s.free_shipping_threshold)} />
        <Row label="Standard shipping fee" value={formatINR(s.shipping_fee)} />
        <p className="mt-6 text-xs text-muted-foreground">Editing settings coming soon. For now contact your developer to update via the database.</p>
      </div>
    </AdminLayout>
  );
}
