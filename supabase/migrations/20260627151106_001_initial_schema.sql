-- ============================================================
-- Homepage Manager: sections, features, category/product picks
-- ============================================================

create table if not exists homepage_hero (
  id int primary key default 1,
  heading text,
  highlighted_text text,
  description text,
  image_url text,
  price_badge text,
  primary_button_text text,
  primary_button_link text,
  secondary_button_text text,
  secondary_button_link text,
  show_image boolean not null default true,
  show_price_badge boolean not null default true,
  primary_button_enabled boolean not null default true,
  secondary_button_enabled boolean not null default true,
  updated_at timestamptz default now()
);
alter table homepage_hero add column if not exists show_image boolean not null default true;
alter table homepage_hero add column if not exists show_price_badge boolean not null default true;
alter table homepage_hero add column if not exists primary_button_enabled boolean not null default true;
alter table homepage_hero add column if not exists secondary_button_enabled boolean not null default true;

create table if not exists homepage_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text unique not null check (section_key in
    ('hero','features','categories','featured_products','best_sellers','newsletter','contact_cta')),
  title text,
  subtitle text,
  is_enabled boolean not null default true,
  display_order int not null default 0,
  background_theme text not null default 'white',
  alignment text not null default 'left',
  content jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists homepage_features (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  icon text not null default 'Truck',
  display_order int not null default 0,
  is_enabled boolean not null default true,
  created_at timestamptz default now()
);

create table if not exists homepage_categories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  display_order int not null default 0,
  is_enabled boolean not null default true,
  image_override_url text,
  unique(category_id)
);

create table if not exists homepage_products (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  section_key text not null check (section_key in ('featured_products','best_sellers')),
  display_order int not null default 0,
  is_enabled boolean not null default true,
  unique(product_id, section_key)
);

-- seed section rows (safe no-op if already present)
insert into homepage_sections (section_key, title, subtitle, display_order, content) values
  ('hero', null, null, 1, '{}'),
  ('features', null, null, 2, '{}'),
  ('categories', 'Shop by Category', 'Browse our wide selection of kitchen essentials organized by category', 3, '{}'),
  ('featured_products', 'Featured Products', 'Handpicked products just for you', 4,
    '{"display_mode":"auto","count":8,"view_all_text":"View All","view_all_link":"/products?featured=true","show_view_all":true}'),
  ('best_sellers', 'Best Sellers', null, 5,
    '{"image_url":"https://images.pexels.com/photos/4227625/pexels-photo-4227625.jpeg?auto=compress&cs=tinysrgb&w=800","show_image":true,"count":4,"view_all_text":"View All Bestsellers","view_all_link":"/products?bestseller=true"}'),
  ('newsletter', 'Subscribe to Our Newsletter', 'Get the latest updates on new products, exclusive offers, and cooking tips delivered to your inbox.', 6,
    '{"placeholder":"Enter your email","button_text":"Subscribe"}'),
  ('contact_cta', 'Need Help Choosing?', 'Our team is here to help you find the perfect kitchen tools.', 7,
    '{"button_text":"Contact Us","button_link":"/contact"}')
on conflict (section_key) do nothing;

insert into homepage_features (title, description, icon, display_order) values
  ('Free Shipping', 'On orders above Rs.999', 'Truck', 1),
  ('Secure Payment', '100% secure checkout', 'Shield', 2),
  ('Easy Returns', '7-day return policy', 'RefreshCw', 3),
  ('24/7 Support', 'Dedicated customer service', 'HeadphonesIcon', 4)
on conflict do nothing;

-- storage bucket for homepage images (hero / best sellers / category overrides)
insert into storage.buckets (id, name, public)
values ('homepage-images', 'homepage-images', true)
on conflict (id) do nothing;

drop policy if exists "homepage_images_public_read" on storage.objects;
create policy "homepage_images_public_read" on storage.objects for select
  to public using (bucket_id = 'homepage-images');

drop policy if exists "homepage_images_admin_write" on storage.objects;
create policy "homepage_images_admin_write" on storage.objects for all
  to authenticated using (bucket_id = 'homepage-images' and public.is_admin())
  with check (bucket_id = 'homepage-images' and public.is_admin());

-- RLS
alter table homepage_hero enable row level security;
alter table homepage_sections enable row level security;
alter table homepage_features enable row level security;
alter table homepage_categories enable row level security;
alter table homepage_products enable row level security;

drop policy if exists "homepage_hero_public_read" on homepage_hero;
create policy "homepage_hero_public_read" on homepage_hero for select to public using (true);
drop policy if exists "homepage_hero_admin_write" on homepage_hero;
create policy "homepage_hero_admin_write" on homepage_hero for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "homepage_sections_public_read" on homepage_sections;
create policy "homepage_sections_public_read" on homepage_sections for select to public using (true);
drop policy if exists "homepage_sections_admin_write" on homepage_sections;
create policy "homepage_sections_admin_write" on homepage_sections for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "homepage_features_public_read" on homepage_features;
create policy "homepage_features_public_read" on homepage_features for select to public using (true);
drop policy if exists "homepage_features_admin_write" on homepage_features;
create policy "homepage_features_admin_write" on homepage_features for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "homepage_categories_public_read" on homepage_categories;
create policy "homepage_categories_public_read" on homepage_categories for select to public using (true);
drop policy if exists "homepage_categories_admin_write" on homepage_categories;
create policy "homepage_categories_admin_write" on homepage_categories for all
  to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "homepage_products_public_read" on homepage_products;
create policy "homepage_products_public_read" on homepage_products for select to public using (true);
drop policy if exists "homepage_products_admin_write" on homepage_products;
create policy "homepage_products_admin_write" on homepage_products for all
  to authenticated using (public.is_admin()) with check (public.is_admin());
