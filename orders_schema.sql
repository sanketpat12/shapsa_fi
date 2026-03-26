-- ============================================================
-- SHOPSA DATABASE SCHEMA — Orders Table
-- Run this in Supabase SQL Editor
-- ============================================================

create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references auth.users(id) on delete cascade not null,
  retailer_id uuid references auth.users(id) on delete cascade not null,
  items jsonb not null,
  total_price numeric not null,
  status text default 'Pending' check (status in ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.orders enable row level security;

-- Enable Realtime for this table
alter publication supabase_realtime add table public.orders;

-- Clean up any existing policies to prevent duplicate errors
drop policy if exists "Customers can view own orders" on public.orders;
drop policy if exists "Retailers can view assigned orders" on public.orders;
drop policy if exists "Customers can insert own orders" on public.orders;
drop policy if exists "Customers can update their pending orders" on public.orders;
drop policy if exists "Retailers can update assigned orders" on public.orders;

-- Create Policies
create policy "Customers can view own orders" on public.orders for select using (auth.uid() = customer_id);
create policy "Retailers can view assigned orders" on public.orders for select using (auth.uid() = retailer_id);
create policy "Customers can insert own orders" on public.orders for insert with check (auth.uid() = customer_id);

-- Customers can only update (cancel) pending orders
create policy "Customers can update their pending orders" on public.orders for update using (auth.uid() = customer_id AND status = 'Pending');

-- Retailers can update status of their assigned orders
create policy "Retailers can update assigned orders" on public.orders for update using (auth.uid() = retailer_id);
