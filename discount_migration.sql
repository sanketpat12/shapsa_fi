-- ============================================================
-- SHOPSA: Database Migration for Deals & Addresses
-- ============================================================
-- RUN THIS IN THE SUPABASE SQL EDITOR TO ENABLE THESE FEATURES
-- ============================================================

-- 1. Add Discount and Deals metadata to products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS discount integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deal_label text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deal_active boolean DEFAULT false;

-- Enable Realtime for products so inventory and deals update instantly on screen
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;

-- 2. Add Shipping Address metadata to orders table
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS shipping_address text DEFAULT NULL;
