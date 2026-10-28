-- DIREITA NEGÓCIOS DF · MVP GRÁTIS
-- Instalação: execute uma única vez no SQL Editor do projeto Supabase atual.
-- Sem cobrança, sem assinatura e sem tratamento de filiação política de consumidores.
-- Não apaga tabelas eleitorais e votos anteriores.

create table if not exists public.marketplace_categories (
 id text primary key check (id ~ '^[a-z0-9-]{3,50}$'),
 name text not null
);
create table if not exists public.marketplace_regions (
 id text primary key check (id ~ '^[a-z0-9-]{3,70}$'),
 name text not null
);
insert into public.marketplace_categories(id,name) values
 ('alimentacao','Alimentação'),
 ('restaurantes','Restaurantes'),
 ('automotivo','Automotivo'),
 ('beleza','Beleza e estética'),
 ('reformas','Construção e reformas'),
 ('juridico','Serviços jurídicos'),
 ('saude','Saúde e bem-estar'),
 ('moda','Moda e acessórios'),
 ('tecnologia','Tecnologia'),
 ('educacao','Aulas e educação'),
 ('casa','Casa e decoração'),
 ('pets','Animais e pet'),
 ('eventos','Eventos e festas'),
 ('servicos','Serviços gerais'),
 ('outros','Outros')
on conflict(id) do update set name=excluded.name;
insert into public.marketplace_regions(id,name) values
 ('plano-piloto','Plano Piloto'),
 ('gama','Gama'),
 ('taguatinga','Taguatinga'),
 ('brazlandia','Brazlândia'),
 ('sobradinho','Sobradinho'),
 ('planaltina','Planaltina'),
 ('paranoa','Paranoá'),
 ('nucleo-bandeirante','Núcleo Bandeirante'),
 ('ceilandia','Ceilândia'),
 ('guara','Guará'),
 ('cruzeiro','Cruzeiro'),
 ('samambaia','Samambaia'),
 ('santa-maria','Santa Maria'),
 ('sao-sebastiao','São Sebastião'),
 ('recanto-das-emas','Recanto das Emas'),
 ('lago-sul','Lago Sul'),
 ('riacho-fundo','Riacho Fundo'),
 ('lago-norte','Lago Norte'),
 ('candangolandia','Candangolândia'),
 ('aguas-claras','Águas Claras'),
 ('riacho-fundo-ii','Riacho Fundo II'),
 ('sudoeste-octogonal','Sudoeste/Octogonal'),
 ('varjao','Varjão'),
 ('park-way','Park Way'),
 ('scia-estrutural','SCIA/Estrutural'),
 ('sobradinho-ii','Sobradinho II'),
 ('jardim-botanico','Jardim Botânico'),
 ('itapoa','Itapoã'),
 ('sia','Setor de Indústria e Abastecimento'),
 ('vicente-pires','Vicente Pires'),
 ('fercal','Fercal'),
 ('sol-nascente-por-do-sol','Sol Nascente/Pôr do Sol'),
 ('arniqueira','Arniqueira'),
 ('arapoanga','Arapoanga'),
 ('agua-quente','Água Quente')
on conflict(id) do update set name=excluded.name;

create table if not exists public.marketplace_admins (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);

create table if not exists public.marketplace_businesses (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(char_length(trim(name)) between 3 and 110),
 business_type text not null default 'autonomo' check(business_type in ('autonomo','mei','empresa')),
 category_id text not null references public.marketplace_categories(id),
 region_id text not null references public.marketplace_regions(id),
 neighborhood text not null default '' check(char_length(neighborhood)<=90),
 description text not null default '' check(char_length(description)<=1500),
 whatsapp text not null check(whatsapp ~ '^[0-9]{10,13}$'),
 service_mode text not null default 'delivery' check(service_mode in ('delivery','local','appointment','online')),
 public_address text not null default '' check(char_length(public_address)<=200),
 image_url text check(image_url is null or (char_length(image_url)<=800 and image_url like 'https://%')),
 -- Autodeclaração comercial voluntária de adesão ao diretório, não identificação da orientação política pessoal.
 community_opt_in boolean not null default true,
 status text not null default 'pending' check(status in ('pending','published','rejected')),
 status_note text not null default '' check(char_length(status_note)<=300),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists marketplace_businesses_location_idx on public.marketplace_businesses(region_id,category_id,status);
create index if not exists marketplace_businesses_owner_idx on public.marketplace_businesses(owner_id,status);

create table if not exists public.marketplace_products (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.marketplace_businesses(id) on delete cascade,
 name text not null check(char_length(trim(name)) between 3 and 100),
 description text not null default '' check(char_length(description)<=900),
 price numeric(12,2) check(price is null or price between 0 and 99999999.99),
 image_url text check(image_url is null or (char_length(image_url)<=800 and image_url like 'https://%')),
 status text not null default 'pending' check(status in ('pending','published','rejected')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists marketplace_products_business_idx on public.marketplace_products(business_id,status);

create table if not exists public.marketplace_reviews (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references public.marketplace_businesses(id) on delete cascade,
 author_id uuid not null references auth.users(id) on delete cascade,
 rating integer not null check(rating between 1 and 5),
 comment text not null default '' check(char_length(comment)<=1000),
 status text not null default 'pending' check(status in ('pending','published','rejected')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(business_id,author_id)
);
create index if not exists marketplace_reviews_business_idx on public.marketplace_reviews(business_id,status);

-- Identidade de administrador gerenciada manualmente no SQL Editor.
-- A função tem assinatura sem argumentos e não retorna dados pessoais.
create or replace function public.marketplace_is_admin()
returns boolean language sql stable security definer set search_path=''
as $$
 select exists(
  select 1 from public.marketplace_admins a where a.user_id=(select auth.uid())
 );
$$;
revoke all on function public.marketplace_is_admin() from public;
revoke all on function public.marketplace_is_admin() from anon,authenticated;
grant execute on function public.marketplace_is_admin() to anon,authenticated;

alter table public.marketplace_admins enable row level security;
alter table public.marketplace_categories enable row level security;
alter table public.marketplace_regions enable row level security;
alter table public.marketplace_businesses enable row level security;
alter table public.marketplace_products enable row level security;
alter table public.marketplace_reviews enable row level security;

revoke all on public.marketplace_admins from anon,authenticated;
revoke all on public.marketplace_categories from anon,authenticated;
revoke all on public.marketplace_regions from anon,authenticated;
revoke all on public.marketplace_businesses from anon,authenticated;
revoke all on public.marketplace_products from anon,authenticated;
revoke all on public.marketplace_reviews from anon,authenticated;

grant select on public.marketplace_categories,public.marketplace_regions to anon,authenticated;
grant select on public.marketplace_businesses,public.marketplace_products,public.marketplace_reviews to anon,authenticated;
grant insert,update,delete on public.marketplace_businesses,public.marketplace_products,public.marketplace_reviews to authenticated;

drop policy if exists marketplace_categories_read on public.marketplace_categories;
create policy marketplace_categories_read on public.marketplace_categories for select to anon,authenticated using(true);
drop policy if exists marketplace_regions_read on public.marketplace_regions;
create policy marketplace_regions_read on public.marketplace_regions for select to anon,authenticated using(true);

drop policy if exists marketplace_businesses_read on public.marketplace_businesses;
create policy marketplace_businesses_read on public.marketplace_businesses for select to anon,authenticated
 using(status='published' or owner_id=(select auth.uid()) or (select public.marketplace_is_admin()));
drop policy if exists marketplace_businesses_insert on public.marketplace_businesses;
create policy marketplace_businesses_insert on public.marketplace_businesses for insert to authenticated
 with check(owner_id=(select auth.uid()) and status='pending' and community_opt_in);
drop policy if exists marketplace_businesses_owner_update on public.marketplace_businesses;
create policy marketplace_businesses_owner_update on public.marketplace_businesses for update to authenticated
 using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()) and status='pending' and community_opt_in);
drop policy if exists marketplace_businesses_admin_update on public.marketplace_businesses;
create policy marketplace_businesses_admin_update on public.marketplace_businesses for update to authenticated
 using((select public.marketplace_is_admin())) with check((select public.marketplace_is_admin()));

drop policy if exists marketplace_products_read on public.marketplace_products;
create policy marketplace_products_read on public.marketplace_products for select to anon,authenticated
 using(
  (status='published' and exists(select 1 from public.marketplace_businesses b where b.id=business_id and b.status='published'))
  or exists(select 1 from public.marketplace_businesses b where b.id=business_id and b.owner_id=(select auth.uid()))
  or (select public.marketplace_is_admin())
 );
drop policy if exists marketplace_products_owner_insert on public.marketplace_products;
create policy marketplace_products_owner_insert on public.marketplace_products for insert to authenticated
 with check(status='pending' and exists(select 1 from public.marketplace_businesses b where b.id=business_id and b.owner_id=(select auth.uid())));
drop policy if exists marketplace_products_owner_update on public.marketplace_products;
create policy marketplace_products_owner_update on public.marketplace_products for update to authenticated
 using(exists(select 1 from public.marketplace_businesses b where b.id=business_id and b.owner_id=(select auth.uid())))
 with check(status='pending' and exists(select 1 from public.marketplace_businesses b where b.id=business_id and b.owner_id=(select auth.uid())));
drop policy if exists marketplace_products_admin_update on public.marketplace_products;
create policy marketplace_products_admin_update on public.marketplace_products for update to authenticated
 using((select public.marketplace_is_admin())) with check((select public.marketplace_is_admin()));

drop policy if exists marketplace_reviews_read on public.marketplace_reviews;
create policy marketplace_reviews_read on public.marketplace_reviews for select to anon,authenticated
 using(
  (status='published' and exists(select 1 from public.marketplace_businesses b where b.id=business_id and b.status='published'))
  or author_id=(select auth.uid()) or (select public.marketplace_is_admin())
 );
drop policy if exists marketplace_reviews_insert on public.marketplace_reviews;
create policy marketplace_reviews_insert on public.marketplace_reviews for insert to authenticated
 with check(
  author_id=(select auth.uid()) and status='pending'
  and exists(select 1 from public.marketplace_businesses b where b.id=business_id and b.status='published' and b.owner_id<>(select auth.uid()))
 );
drop policy if exists marketplace_reviews_owner_update on public.marketplace_reviews;
create policy marketplace_reviews_owner_update on public.marketplace_reviews for update to authenticated
 using(author_id=(select auth.uid())) with check(author_id=(select auth.uid()) and status='pending');
drop policy if exists marketplace_reviews_admin_update on public.marketplace_reviews;
create policy marketplace_reviews_admin_update on public.marketplace_reviews for update to authenticated
 using((select public.marketplace_is_admin())) with check((select public.marketplace_is_admin()));

-- Armazenamento gratuito (dentro da franquia Supabase) para fotos de catálogo.
-- Organização do caminho: USER_ID/BUSINESS_ID/ARQUIVO.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('marketplace-images','marketplace-images',true,3145728,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;

drop policy if exists marketplace_image_upload on storage.objects;
create policy marketplace_image_upload on storage.objects for insert to authenticated
 with check(bucket_id='marketplace-images' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists marketplace_image_delete on storage.objects;
create policy marketplace_image_delete on storage.objects for delete to authenticated
 using(bucket_id='marketplace-images' and (storage.foldername(name))[1]=(select auth.uid())::text);

-- IMPORTANTE: nenhum plano pago, cobranças, preferências eleitorais de consumidores
-- ou geolocalização residencial são coletados.
