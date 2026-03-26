-- ============================================================
-- SHOPSA PROFILE RECOVERY & SYNC
-- Run this in your Supabase SQL Editor to fix "Unknown Customer"
-- ============================================================

-- 1. Create profiles table if it doesn't exist
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  role text,
  avatar text,
  store_name text,
  join_date date,
  total_orders integer default 0,
  total_spent numeric default 0,
  total_products integer default 0,
  total_revenue numeric default 0
);

-- 2. Make sure role and name can be null if needed (handle existing constraints)
alter table public.profiles alter column name drop not null;
alter table public.profiles alter column role drop not null;

-- 3. Enable RLS
alter table public.profiles enable row level security;

-- 4. Create policies
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- 5. Sync existing users from auth.users (Recovery)
-- This takes metadata (name, role) from the auth.users table and puts it into profiles
-- Defaults to 'customer' for role if missing
insert into public.profiles (id, email, name, role, join_date)
select 
  id, 
  email, 
  coalesce((raw_user_meta_data->>'name'), email) as name, 
  coalesce((raw_user_meta_data->>'role'), 'customer') as role,
  coalesce((raw_user_meta_data->>'join_date'), (created_at::text))::date as join_date
from auth.users
on conflict (id) do update set
  name = excluded.name,
  role = excluded.role,
  email = excluded.email,
  join_date = excluded.join_date;

-- 5. Helpful view to check if sync worked
-- select * from public.profiles;
