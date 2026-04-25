import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { api } from "@/lib/api";
import { formatINR } from "@/lib/format";

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const orderId = params.get("orderId") ?? "";
  const [order, setOrder] = useState<any>(null);
  useEffect(() => { if (orderId) api.getOrder(orderId).then(setOrder); }, [orderId]);

  return (
    <SiteLayout>
      <section className="bg-cream py-20 min-h-[60vh]">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 mx-auto flex items-center justify-center">
            <CheckCircle className="text-green-600" size={48} />
          </div>
          <h1 className="font-display text-5xl text-maroon-dp mt-6">Thank you!</h1>
          <p className="text-muted-foreground mt-3">Your order has been received. We'll start crafting it with love.</p>
          {order ? (
            <div className="mt-8 bg-ivory border border-gold/30 rounded-2xl p-6 text-left">
              <div className="flex justify-between items-baseline">
                <p className="text-xs uppercase tracking-[0.14em] text-maroon">Order Number</p>
                <p className="font-mono text-maroon-dp font-semibold">{order.order_number}</p>
              </div>
              <div className="flex justify-between items-baseline mt-2">
                <p className="text-xs uppercase tracking-[0.14em] text-maroon">Total</p>
                <p className="font-display text-2xl text-maroon">{formatINR(order.total)}</p>
              </div>
              <div className="flex justify-between items-baseline mt-2">
                <p className="text-xs uppercase tracking-[0.14em] text-maroon">Payment</p>
                <p className="text-sm capitalize text-maroon-dp">{order.payment_status}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-4">Estimated delivery: 5–7 working days</p>
            </div>
          ) : orderId ? (
            <p className="text-xs text-muted-foreground mt-6">Order #{orderId}</p>
          ) : null}

          <div className="flex gap-3 justify-center mt-8 flex-wrap">
            <Link to="/shop" className="px-6 py-3 bg-maroon text-gold rounded-full text-xs uppercase tracking-[0.14em]">Continue Shopping</Link>
            <a href="https://wa.me/919876543210" target="_blank" rel="noreferrer" className="px-6 py-3 border border-maroon text-maroon rounded-full text-xs uppercase tracking-[0.14em]">WhatsApp Us</a>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
