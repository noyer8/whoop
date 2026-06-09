-- Module blessures + timestamp dernière synchro

-- 1. Blessures (objet principal)
create table if not exists public.injuries (
  id          bigint generated always as identity primary key,
  nom         text not null,
  cause       text,
  statut      text not null default 'active' check (statut in ('active', 'retabli')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);
alter table public.injuries enable row level security;

-- 2. Points de douleur liés à une blessure
create table if not exists public.injury_pains (
  id              bigint generated always as identity primary key,
  injury_id       bigint not null references public.injuries(id) on delete cascade,
  date            date not null,
  intensite       smallint not null check (intensite between 0 and 10),
  note            text,
  training_id     bigint references public.trainings(id) on delete set null,
  whoop_workout_id text,
  created_at      timestamptz not null default now()
);
create index if not exists injury_pains_injury_idx on public.injury_pains (injury_id);
create index if not exists injury_pains_date_idx on public.injury_pains (date);
alter table public.injury_pains enable row level security;

-- 3. Timeline des soins
create table if not exists public.injury_treatments (
  id          bigint generated always as identity primary key,
  injury_id   bigint not null references public.injuries(id) on delete cascade,
  date_debut  date not null,
  date_fin    date,
  methode     text not null,
  created_at  timestamptz not null default now()
);
create index if not exists injury_treatments_injury_idx on public.injury_treatments (injury_id);
alter table public.injury_treatments enable row level security;

-- 4. Colonne last_sync dans whoop_tokens
alter table public.whoop_tokens add column if not exists last_sync timestamptz;
