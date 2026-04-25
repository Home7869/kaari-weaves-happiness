ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cashfree_mode text,
  ADD COLUMN IF NOT EXISTS webhook_received_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_cashfree_mode ON public.orders (cashfree_mode);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);