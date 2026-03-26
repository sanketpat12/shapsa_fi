-- ============================================================
-- SHOPSA - Required SQL Functions & Policies
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Create the decrement_stock function with SECURITY DEFINER
--    This bypasses RLS so customers can reduce stock when ordering
create or replace function public.decrement_stock(product_id uuid, qty integer)
returns void
language plpgsql
security definer
as $$
begin
  update public.products
  set stock = greatest(0, stock - qty)
  where id = product_id;
end;
$$;

-- 2. Grant execute permission to authenticated users
grant execute on function public.decrement_stock(uuid, integer) to authenticated;

-- 3. Allow authenticated users to upsert their own profile
--    (needed so customer name appears for retailer)
drop policy if exists "Users can upsert own profile" on public.profiles;
create policy "Users can upsert own profile" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- 4. Make sure profiles table allows new inserts
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);
