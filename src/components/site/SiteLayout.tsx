import { ReactNode, useEffect, useState } from "react";
import { Navbar, AnnouncementBar } from "./Navbar";
import { Footer } from "./Footer";
import { WhatsappFab } from "./WhatsappFab";
import { CartDrawer } from "./CartDrawer";
import { api } from "@/lib/api";

export function SiteLayout({ children }: { children?: ReactNode }) {
  const [settings, setSettings] = useState<{ announcement_text?: string; whatsapp_number?: string; instagram_handle?: string } | null>(null);
  useEffect(() => { api.getSettings().then(setSettings).catch(() => {}); }, []);
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar text={settings?.announcement_text ?? "New Spring Collection is Live · Free Shipping Above ₹999 · Custom Orders Welcome — WhatsApp Us!"} />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer instagramHandle={settings?.instagram_handle ?? "kaari.handmade"} />
      <WhatsappFab number={settings?.whatsapp_number ?? "919876543210"} />
      <CartDrawer />
    </div>
  );
}

export default SiteLayout;
