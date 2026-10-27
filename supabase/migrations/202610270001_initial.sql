-- Aplicar uma única vez no SQL Editor do Supabase.
-- Os votos são opiniões da comunidade, NÃO declarações dos estabelecimentos.
create table if not exists public.places(
 id bigint generated always as identity primary key,
 osm_type text not null check(osm_type in ('node','way','relation')),
 osm_id text not null check(osm_id ~ '^[0-9]{1,20}$'),
 name text not null check(length(name) between 2 and 180),
 latitude double precision not null check(latitude between -16.10 and -15.42),
 longitude double precision not null check(longitude between -48.32 and -47.25),
 created_at timestamptz not null default now(),
 unique(osm_type,osm_id)
);
create table if not exists public.place_votes(
 place_id bigint not null references public.places(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 choice text not null check(choice in ('verde','vermelho')),
 updated_at timestamptz not null default now(),
 primary key(place_id,user_id)
);
create index if not exists votes_by_place on public.place_votes(place_id);
alter table public.places enable row level security;
alter table public.place_votes enable row level security;
revoke all on public.places from anon,authenticated;
revoke all on public.place_votes from anon,authenticated;
grant select on public.places to anon,authenticated;
grant select on public.place_votes to authenticated;
drop policy if exists "places public" on public.places;
create policy "places public" on public.places for select to anon,authenticated using(true);
drop policy if exists "user sees own votes" on public.place_votes;
create policy "user sees own votes" on public.place_votes for select to authenticated using(user_id=(select auth.uid()));
-- SECURITY DEFINER restringe entradas; o ID de usuário vem sempre do JWT verificado.
create or replace function public.vote_for_place(
 p_osm_type text,p_osm_id text,p_name text,p_lat double precision,p_lon double precision,p_choice text
) returns void language plpgsql security definer set search_path=''
as $$
declare v_id bigint;
begin
 if auth.uid() is null then raise exception 'Faça login'; end if;
 if p_choice not in ('verde','vermelho') then raise exception 'Opção inválida'; end if;
 if p_osm_type not in ('node','way','relation') or p_osm_id !~ '^[0-9]{1,20}$' then raise exception 'ID OSM inválido'; end if;
 if length(trim(p_name)) not between 2 and 180 or p_lat not between -16.10 and -15.42 or p_lon not between -48.32 and -47.25 then raise exception 'Lugar fora da região de teste'; end if;
 insert into public.places(osm_type,osm_id,name,latitude,longitude) values(p_osm_type,p_osm_id,trim(p_name),p_lat,p_lon)
 on conflict(osm_type,osm_id) do nothing;
 select id into v_id from public.places where osm_type=p_osm_type and osm_id=p_osm_id;
 insert into public.place_votes(place_id,user_id,choice) values(v_id,auth.uid(),p_choice)
 on conflict(place_id,user_id) do update set choice=excluded.choice,updated_at=now();
end $$;
create or replace function public.place_vote_summary(p_osm_type text,p_osm_id text)
returns table(total bigint,verdes bigint,vermelhos bigint,classificacao text)
language sql stable security definer set search_path=''
as $$
with counts as (
 select count(v.user_id)::bigint total,
 count(v.user_id) filter(where v.choice='verde')::bigint verdes,
 count(v.user_id) filter(where v.choice='vermelho')::bigint vermelhos
 from public.places p left join public.place_votes v on v.place_id=p.id
 where p.osm_type=p_osm_type and p.osm_id=p_osm_id
)
select total,verdes,vermelhos,
case when total < 20 then 'sem classificação'
when verdes::numeric/nullif(total,0)>=0.60 then 'verde'
when vermelhos::numeric/nullif(total,0)>=0.60 then 'vermelho'
else 'sem classificação' end from counts;
$$;
revoke all on function public.vote_for_place(text,text,text,double precision,double precision,text) from public;
revoke all on function public.place_vote_summary(text,text) from public;
grant execute on function public.vote_for_place(text,text,text,double precision,double precision,text) to authenticated;
grant execute on function public.place_vote_summary(text,text) to anon,authenticated;
