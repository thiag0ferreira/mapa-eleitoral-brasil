-- Migração complementar. Não altera nem apaga votos OpenStreetMap já salvos.
-- Persistimos apenas o identificador Place ID do Google, não dados de lugares.
create table if not exists public.google_places (
 place_id text primary key check(length(place_id) between 5 and 250),
 created_at timestamptz not null default now()
);
create table if not exists public.google_place_votes (
 place_id text not null references public.google_places(place_id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 choice text not null check(choice in ('verde','vermelho')),
 updated_at timestamptz not null default now(),
 primary key(place_id,user_id)
);
create index if not exists google_votes_by_place on public.google_place_votes(place_id);
alter table public.google_places enable row level security;
alter table public.google_place_votes enable row level security;
revoke all on public.google_places from anon,authenticated;
revoke all on public.google_place_votes from anon,authenticated;
grant select on public.google_places to anon,authenticated;
grant select on public.google_place_votes to authenticated;
drop policy if exists "read google place ids" on public.google_places;
create policy "read google place ids" on public.google_places for select to anon,authenticated using(true);
drop policy if exists "read own google votes" on public.google_place_votes;
create policy "read own google votes" on public.google_place_votes for select to authenticated using(user_id=(select auth.uid()));
create or replace function public.google_vote_for_place(p_place_id text,p_choice text)
returns void language plpgsql security definer set search_path=''
as $$
begin
 if auth.uid() is null then raise exception 'Faça login para votar'; end if;
 if p_place_id is null or length(p_place_id) not between 5 and 250 then raise exception 'Place ID inválido'; end if;
 if p_choice not in ('verde','vermelho') then raise exception 'Voto inválido'; end if;
 insert into public.google_places(place_id) values(p_place_id) on conflict do nothing;
 insert into public.google_place_votes(place_id,user_id,choice) values(p_place_id,auth.uid(),p_choice)
 on conflict(place_id,user_id) do update set choice=excluded.choice,updated_at=now();
end $$;
create or replace function public.google_place_vote_summary(p_place_id text)
returns table(total bigint,verdes bigint,vermelhos bigint,classificacao text)
language sql stable security definer set search_path=''
as $$
with counts as (
 select count(v.user_id)::bigint total,
 count(v.user_id) filter(where v.choice='verde')::bigint verdes,
 count(v.user_id) filter(where v.choice='vermelho')::bigint vermelhos
 from public.google_place_votes v where v.place_id=p_place_id
)
select total,verdes,vermelhos,
 case when total <20 then 'sem classificação'
 when verdes::numeric/nullif(total,0)>=0.60 then 'verde'
 when vermelhos::numeric/nullif(total,0)>=0.60 then 'vermelho'
 else 'sem classificação' end from counts;
$$;
revoke all on function public.google_vote_for_place(text,text) from public;
revoke all on function public.google_place_vote_summary(text) from public;
grant execute on function public.google_vote_for_place(text,text) to authenticated;
grant execute on function public.google_place_vote_summary(text) to anon,authenticated;
