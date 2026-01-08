-- Run this in your Supabase SQL Editor to create the necessary tables

-- 1. Users Table
create table public.users (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  password text not null, -- Storing plain text as per legacy app
  name text not null,
  role text not null check (role in ('admin', 'auxiliar')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Products (Inventory) Table
create table public.products (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  name text not null,
  price numeric not null default 0,
  search_string text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Routes (Rutas) Table
create table public.routes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id),
  username text not null,
  user_name text,
  date date default current_date,
  start_time text,
  end_time text,
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Return Items (Devoluciones) Table - Renamed from 'returns' to avoid reserved keyword
create table public.return_items (
  id uuid default gen_random_uuid() primary key,
  route_id uuid references public.routes(id),
  invoice text,
  sheet text,
  product_code text,
  product_name text,
  quantity integer default 1,
  total numeric default 0,
  reason text,
  evidence text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) but allow public access for now
alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.routes enable row level security;
alter table public.return_items enable row level security;

create policy "Enable all access for all users" on public.users for all using (true) with check (true);
create policy "Enable all access for all users" on public.products for all using (true) with check (true);
create policy "Enable all access for all users" on public.routes for all using (true) with check (true);
create policy "Enable all access for all users" on public.return_items for all using (true) with check (true);
