
-- ============= KAARI E-COMMERCE SCHEMA =============

-- Products
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  price INTEGER NOT NULL,
  original_price INTEGER,
  badge TEXT,
  sizes TEXT[] DEFAULT '{}',
  colors JSONB DEFAULT '[]'::jsonb,
  images TEXT[] DEFAULT '{}',
  stock_status TEXT NOT NULL DEFAULT 'in_stock',
  care_instructions TEXT DEFAULT '',
  shipping_info TEXT DEFAULT '',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  rating NUMERIC(2,1) NOT NULL DEFAULT 5.0,
  review_count INTEGER NOT NULL DEFAULT 0,
  sold_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_active ON public.products(is_active);
CREATE INDEX idx_products_featured ON public.products(is_featured);

-- Orders
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address JSONB NOT NULL,
  items JSONB NOT NULL,
  subtotal INTEGER NOT NULL,
  shipping_charges INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_session_id TEXT,
  cashfree_order_id TEXT,
  order_status TEXT NOT NULL DEFAULT 'processing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX idx_orders_order_status ON public.orders(order_status);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);

-- Customers (derived from orders)
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reviews
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT DEFAULT '',
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_product ON public.reviews(product_id);

-- Settings (single-row config table)
CREATE TABLE public.settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  whatsapp_number TEXT DEFAULT '919876543210',
  free_shipping_threshold INTEGER NOT NULL DEFAULT 999,
  shipping_fee INTEGER NOT NULL DEFAULT 60,
  announcement_text TEXT DEFAULT 'New Spring Collection is Live · Free Shipping Above ₹999 · Custom Orders Welcome — WhatsApp Us!',
  instagram_handle TEXT DEFAULT 'kaari.handmade',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT settings_singleton CHECK (id = 1)
);

INSERT INTO public.settings (id) VALUES (1);

-- ============= TIMESTAMPS TRIGGER =============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============= RLS POLICIES =============
-- Strategy: Public can READ active products, reviews, settings.
-- All writes/admin reads happen ONLY through edge functions using the service role key
-- (which bypasses RLS). The admin password is verified inside the edge function.
-- Customer order creation also goes through an edge function.

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Public read of active products
CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT USING (is_active = true);

-- Public read of reviews
CREATE POLICY "Public can view reviews" ON public.reviews
  FOR SELECT USING (true);

-- Public read of settings
CREATE POLICY "Public can view settings" ON public.settings
  FOR SELECT USING (true);

-- Orders: NO public access. Edge functions with service role manage all reads/writes.
-- Customers: NO public access. Edge functions only.
-- (No SELECT policies created for orders/customers => denied for anon/authenticated.)

-- ============= STORAGE BUCKET FOR PRODUCT IMAGES =============
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Uploads/deletes are done from edge functions with the service role key.

-- ============= SEED PRODUCTS =============
INSERT INTO public.products (slug, name, category, description, price, original_price, badge, sizes, colors, stock_status, care_instructions, shipping_info, is_featured, rating, review_count, sold_count) VALUES
('boho-scrunchie-set', 'Boho Scrunchie Set', 'hair', 'A set of 3 hand-crocheted scrunchies in dreamy boho tones. Soft on the hair, zero damage.', 349, 499, 'new', '{"Free Size"}', '[{"name":"Maroon Cherry","hex":"#8B1F2A"},{"name":"Warm Gold","hex":"#c9a06e"},{"name":"Ivory Cream","hex":"#f9f4ef"}]'::jsonb, 'in_stock', 'Hand wash in cold water with mild detergent. Air dry flat. Do not wring.', 'Ships in 2-3 working days. Free shipping above ₹999.', true, 4.8, 32, 84),
('cherry-peplum-heart-top', 'Cherry Peplum Heart Top', 'wearables', 'Hand-crocheted peplum top with cherry heart embellishments and gold straps. Made to order in your size.', 1299, 1599, 'new', '{"XS","S","M","L","XL"}', '[{"name":"Maroon Cherry","hex":"#8B1F2A"},{"name":"Deep Plum","hex":"#3a2060"},{"name":"Ivory Cream","hex":"#f9f4ef"}]'::jsonb, 'made_to_order', 'Hand wash only with cold water. Lay flat to dry. Iron on low heat if needed.', 'Made to order in 7-10 working days. Free shipping above ₹999.', true, 4.9, 28, 47),
('lotus-gold-bouquet', 'Lotus Gold Bouquet', 'bouquets', 'A handcrafted crochet bouquet of golden lotuses with maroon centers and forest-green stems. A gift that lasts a lifetime.', 899, NULL, 'hot', '{}', '[{"name":"Warm Gold","hex":"#c9a06e"},{"name":"Maroon Cherry","hex":"#8B1F2A"}]'::jsonb, 'in_stock', 'Dust gently with a soft brush. Avoid direct sunlight to keep colours vibrant.', 'Ships in 3-5 working days. Free shipping above ₹999.', true, 5.0, 41, 112),
('pastel-bunny-doll', 'Pastel Bunny Doll', 'dolls', 'A soft, huggable hand-crocheted bunny doll in pastel tones. Perfect for nursery decor or gifting.', 649, 799, 'new', '{}', '[{"name":"Ivory Cream","hex":"#f9f4ef"},{"name":"Warm Gold","hex":"#c9a06e"}]'::jsonb, 'in_stock', 'Spot clean only. Do not machine wash. Keep away from open flame.', 'Ships in 2-4 working days.', false, 4.7, 22, 56),
('boho-sunburst-handbag', 'Boho Sunburst Handbag', 'handbags', 'A statement crochet handbag with sunburst motif and lined interior. Roomy enough for daily essentials.', 1499, NULL, 'custom', '{}', '[{"name":"Warm Gold","hex":"#c9a06e"},{"name":"Maroon Cherry","hex":"#8B1F2A"},{"name":"Forest Green","hex":"#2a4a2e"}]'::jsonb, 'made_to_order', 'Spot clean only. Avoid heavy or sharp objects to retain shape.', 'Made to order in 10-14 working days.', true, 4.8, 18, 33),
('orange-bloom-gajra', 'Orange Bloom Gajra', 'gajra', 'A vibrant orange crochet gajra perfect for festive occasions. Reusable and fade-free.', 299, 399, 'hot', '{"Free Size"}', '[{"name":"Marigold Orange","hex":"#e07a3c"},{"name":"Maroon Cherry","hex":"#8B1F2A"}]'::jsonb, 'in_stock', 'Hand wash in cold water if needed. Air dry away from direct sunlight.', 'Ships in 2-3 working days.', false, 4.9, 29, 78),
('unicorn-keychain', 'Unicorn Keychain', 'keychains', 'A whimsical hand-crocheted unicorn keychain with gold horn detailing. Adorable on bags and keys.', 199, 249, 'hot', '{}', '[{"name":"Ivory Cream","hex":"#f9f4ef"},{"name":"Warm Gold","hex":"#c9a06e"}]'::jsonb, 'in_stock', 'Spot clean only.', 'Ships in 1-2 working days.', false, 4.6, 51, 144),
('bridal-red-gajra', 'Bridal Red Gajra', 'gajra', 'A statement bridal gajra in deep crimson with gold accents. The perfect crown for your special day.', 349, NULL, 'new', '{"Free Size"}', '[{"name":"Maroon Cherry","hex":"#8B1F2A"},{"name":"Warm Gold","hex":"#c9a06e"}]'::jsonb, 'made_to_order', 'Hand wash in cold water if needed. Air dry flat.', 'Made to order in 5-7 working days.', true, 5.0, 14, 21);

-- Seed reviews for the cherry peplum top
INSERT INTO public.reviews (product_id, reviewer_name, rating, review_text, verified)
SELECT id, 'Priya S.', 5, 'Absolutely gorgeous! The fit is perfect and the cherry detailing is even more beautiful in person. Worth every rupee.', true
FROM public.products WHERE slug = 'cherry-peplum-heart-top';

INSERT INTO public.reviews (product_id, reviewer_name, rating, review_text, verified)
SELECT id, 'Ananya R.', 5, 'Got so many compliments wearing this! The craftsmanship is incredible. Will definitely order more from Kaari.', true
FROM public.products WHERE slug = 'cherry-peplum-heart-top';
