-- Whoop Tracker — schéma initial
-- App perso mono-utilisateur. Tout l'accès DB se fait côté serveur via la
-- service_role key (qui bypass RLS). On active RLS sans policy publique pour
-- qu'aucune donnée ne soit exposée via la clé anon.

-- =========================================================================
-- Données Whoop (pull automatique via le cron)
-- =========================================================================

-- 1. Récupération
create table if not exists public.whoop_recovery (
  id             bigint generated always as identity primary key,
  whoop_id       text unique,                  -- id du cycle Whoop (dedup upsert)
  date           date not null,
  recovery_score numeric,                       -- 0-100 %
  hrv            numeric,                        -- HRV rMSSD (ms)
  resting_hr     numeric,                        -- FC repos (bpm)
  raw            jsonb,                          -- payload brut Whoop
  created_at     timestamptz not null default now()
);
create index if not exists whoop_recovery_date_idx on public.whoop_recovery (date);

-- 2. Sommeil
create table if not exists public.whoop_sleep (
  id             bigint generated always as identity primary key,
  whoop_id       text unique,                  -- id du sleep Whoop
  date           date not null,
  duration       integer,                        -- durée de sommeil (minutes)
  light          integer,                        -- sommeil léger (minutes)
  deep           integer,                        -- sommeil profond (minutes)
  rem            integer,                        -- sommeil paradoxal (minutes)
  efficiency     numeric,                        -- efficacité (%)
  raw            jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists whoop_sleep_date_idx on public.whoop_sleep (date);

-- 3. Workouts (avec temps par zone de FC)
create table if not exists public.whoop_workouts (
  id          bigint generated always as identity primary key,
  whoop_id    text unique,                       -- id du workout Whoop
  date        date not null,
  type        text,                              -- type d'activité Whoop
  strain      numeric,                           -- strain 0-21
  duration    integer,                           -- durée (minutes)
  minutes_z1  numeric,
  minutes_z2  numeric,
  minutes_z3  numeric,
  minutes_z4  numeric,
  minutes_z5  numeric,
  raw         jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists whoop_workouts_date_idx on public.whoop_workouts (date);

-- =========================================================================
-- Saisie manuelle
-- =========================================================================

-- 4. Journal d'entraînement
create table if not exists public.trainings (
  id           bigint generated always as identity primary key,
  date         date not null,
  type_seance  text not null,                    -- FB1/FB2/H1/H2/foot/course/natation/corde
  exos         jsonb,                            -- liste d'exos (texte/json)
  rpe          smallint check (rpe between 1 and 10),
  notes        text,
  created_at   timestamptz not null default now()
);
create index if not exists trainings_date_idx on public.trainings (date);

-- 5. Douleurs / blessures
create table if not exists public.pains (
  id          bigint generated always as identity primary key,
  date        date not null,
  zone        text not null,                     -- genou / tibia / etc.
  intensite   smallint not null check (intensite between 0 and 10),
  contexte    text,
  created_at  timestamptz not null default now()
);
create index if not exists pains_date_idx on public.pains (date);

-- 6. Tests / benchmarks
create table if not exists public.tests (
  id          bigint generated always as identity primary key,
  date        date not null,
  type        text not null,                     -- Bronco / sprint / etc.
  resultat    numeric,                           -- métrique principale (Bronco = secondes)
  conditions  text,
  created_at  timestamptz not null default now()
);
create index if not exists tests_date_idx on public.tests (date);

-- 7. Planning hebdo
create table if not exists public.planning (
  id            bigint generated always as identity primary key,
  semaine       text not null,                   -- ISO ex. "2026-W24"
  jour          text not null,                   -- lun/mar/.../dim
  seance_prevue text not null,
  realise       boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists planning_semaine_idx on public.planning (semaine);

-- =========================================================================
-- RLS : activé sans policy => aucun accès via anon/public.
-- L'app accède en service_role côté serveur uniquement.
-- =========================================================================
alter table public.whoop_recovery enable row level security;
alter table public.whoop_sleep    enable row level security;
alter table public.whoop_workouts enable row level security;
alter table public.trainings      enable row level security;
alter table public.pains          enable row level security;
alter table public.tests          enable row level security;
alter table public.planning       enable row level security;
