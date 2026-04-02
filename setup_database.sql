-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Products Table
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  category text,
  price numeric(10, 2) not null,
  stock integer not null default 0,
  image_url text,
  created_at timestamptz default now()
);

-- Orders Table
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  client_name text not null,
  client_email text not null,
  address text,
  phone text,
  uid_game text,
  pseudo_game text,
  payment_ref text,
  total_amount numeric(10, 2) not null,
  status text not null default 'pending',
  created_at timestamptz default now()
);

-- Order Items Table
create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade,
  product_id uuid references products(id),
  quantity integer not null,
  price_at_purchase numeric(10, 2) not null
);

-- Profiles Table (for roles)
create table if not exists profiles (
  id uuid references auth.users(id) primary key,
  email text,
  role text default 'client' check (role in ('admin', 'client')),
  created_at timestamptz default now()
);

-- Enable RLS
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table profiles enable row level security;

-- Products Policies
drop policy if exists "Allow public read access to products" on products;
create policy "Allow public read access to products"
  on products for select
  using (true);

drop policy if exists "Allow admin full access to products" on products;
create policy "Allow admin full access to products"
  on products for all
  using (exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  ));

-- Orders Policies
drop policy if exists "Allow users to see their own orders" on orders;
create policy "Allow users to see their own orders"
  on orders for select
  using (auth.uid() is not null);

drop policy if exists "Allow anyone to create an order" on orders;
create policy "Allow anyone to create an order"
  on orders for insert
  with check (true);

drop policy if exists "Allow admin full access to orders" on orders;
create policy "Allow admin full access to orders"
  on orders for all
  using (exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  ));

-- Order Items Policies
drop policy if exists "Allow anyone to insert order items" on order_items;
create policy "Allow anyone to insert order items"
  on order_items for insert
  with check (true);

drop policy if exists "Allow admin full access to order_items" on order_items;
create policy "Allow admin full access to order_items"
  on order_items for all
  using (exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  ));

-- Profiles Policies
drop policy if exists "Allow users to see their own profile" on profiles;
create policy "Allow users to see their own profile"
  on profiles for select
  using (auth.uid() = id);

drop policy if exists "Allow admin full access to profiles" on profiles;
create policy "Allow admin full access to profiles"
  on profiles for all
  using (exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  ));

-- Function to handle new user profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'client');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Insert some test products (only if they don't exist)
insert into products (name, description, category, price, stock, image_url)
select 'Robe Malagasy', 'Une belle robe traditionnelle de Madagascar.', 'Vêtements', 45000, 10, 'https://example.com/robe.jpg'
where not exists (select 1 from products where name = 'Robe Malagasy');

insert into products (name, description, category, price, stock, image_url)
select 'Sac en Raphia', 'Sac à main fait main en raphia naturel.', 'Accessoires', 25000, 20, 'https://example.com/sac.jpg'
where not exists (select 1 from products where name = 'Sac en Raphia');

insert into products (name, description, category, price, stock, image_url)
select 'Huile Essentielle', 'Huile essentielle de Ravintsara pure.', 'Bien-être', 15000, 50, 'https://example.com/huile.jpg'
where not exists (select 1 from products where name = 'Huile Essentielle');
