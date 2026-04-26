ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_type text DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS delivery_charge integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estimated_delivery_from timestamptz,
  ADD COLUMN IF NOT EXISTS estimated_delivery_to timestamptz,
  ADD COLUMN IF NOT EXISTS promo_code text,
  ADD COLUMN IF NOT EXISTS discount integer DEFAULT 0;