-- Run this script in the Supabase SQL Editor to add the necessary columns for the checkout flow

-- Add new columns for Checkout Details
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customer_name text,
ADD COLUMN IF NOT EXISTS payment_mode text;
