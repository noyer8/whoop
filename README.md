# Whoop Tracker

App perso de suivi de performance sportive (mono-utilisateur).

**Stack** : Next.js (App Router) + Tailwind · Supabase · Render · Whoop API v2.

## Setup

1. **Dépendances**

   ```bash
   npm install
   ```

2. **Variables d'environnement** — copier le template et remplir :

   ```bash
   cp .env.example .env.local
   ```

   | Variable | Source |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
   | `SUPABASE_SERVICE_ROLE_KEY` | idem (clé `service_role`, **secrète**) |
   | `WHOOP_CLIENT_ID` / `WHOOP_CLIENT_SECRET` | Whoop Developer Dashboard |
   | `WHOOP_REDIRECT_URI` | URL de callback OAuth déclarée dans l'app Whoop |
   | `WHOOP_REFRESH_TOKEN` | obtenu après le 1er consentement OAuth |
   | `CRON_SECRET` | secret au choix pour protéger l'endpoint de pull |

3. **Base de données** — créer un projet Supabase dédié, puis exécuter la
   migration `supabase/migrations/0001_init.sql` dans le SQL Editor du
   dashboard Supabase.

4. **Lancer le dev**

   ```bash
   npm run dev
   ```

## Architecture

- `src/lib/supabase/server.ts` — client Supabase service_role (serveur uniquement).
- `src/types/db.ts` — types des lignes DB.
- `supabase/migrations/` — schéma SQL (7 tables).

Accès DB **100 % côté serveur** via la `service_role` key. RLS activé sans
policy publique → aucune donnée exposée via la clé anon.

## Roadmap

1. [x] Setup projet + Supabase + migrations
2. [ ] OAuth Whoop + script de pull (whoop_recovery / sleep / workouts)
3. [ ] Cron Job Render (pull nocturne)
4. [ ] Formulaires de saisie (trainings, pains, tests, planning)
5. [ ] Dashboard + visualisations + croisements
6. [ ] Polish UI
