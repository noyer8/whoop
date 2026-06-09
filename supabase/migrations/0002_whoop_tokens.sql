-- Stockage du token OAuth Whoop.
-- Les refresh tokens Whoop tournent à chaque rafraîchissement (scope offline),
-- donc on les persiste en DB plutôt qu'en variable d'env figée.
-- Table mono-ligne (id = true).

create table if not exists public.whoop_tokens (
  id            boolean primary key default true check (id),
  access_token  text,
  refresh_token text,
  expires_at    timestamptz,           -- expiration de l'access token
  scope         text,
  updated_at    timestamptz not null default now()
);

alter table public.whoop_tokens enable row level security;
