# Comeback HQ — Athlete Recovery Platform

> One recovery. One timeline. One source of truth.

An athlete-first injury-recovery platform that connects an athlete with their physio, S&C coach, coach,
doctor and other authorised staff. **Recovery tracking, not medical diagnosis.**

**Stack:** React 19 · TypeScript (strict) · Vite · Tailwind CSS v4 · shadcn/ui · Supabase (Postgres, Auth, Storage, Realtime) · TanStack Query

---

## Status: Phase 1 — Foundation & architecture ✅

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Foundation: schema, RLS, auth, entitlements, AI abstraction, app shells | **Done** |
| 2 | Athlete MVP: check-in, rehab, journal, milestones, timeline | Next |
| 3 | Team sharing UI & realtime permissions | |
| 4 | Physio dashboard | |
| 5 | Coach & S&C dashboards | |
| 6 | Premium features | |
| 7 | Pro / Clinic | |
| 8 | Advanced AI, wearables, movement analysis | |

## Quick start

```bash
npm install
cp .env.example .env.local     # set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev                    # http://localhost:5173
```

Apply the database with the Supabase CLI (`supabase link` then `supabase db push`), or paste the files in
`supabase/migrations/` into the SQL editor **in filename order**.

Without credentials the app shows a setup screen. In development, fixture-driven design previews are at
`/dev/athlete`, `/dev/athlete-empty` and `/dev/pro` (excluded from production builds).

| Script | What it does |
| --- | --- |
| `npm run dev` / `build` / `preview` | Vite |
| `npm run typecheck` | `tsc -b` (strict, `noUncheckedIndexedAccess`) |
| `npm run lint` | oxlint |
| `npm test` | Vitest unit tests (domain logic, AI guardrails, permission mirror) |
| `npm run db:test` | Spins up a throwaway Postgres, applies every migration, runs the RLS test suite |
| `npm run db:types` | Same, then regenerates `src/types/database.types.ts` from the live schema |

`db:test` needs PostgreSQL 15+ server binaries (`initdb`, `pg_ctl`) — no Docker required.

---

## Architecture

```
src/
  app/            App root, providers, router
  components/
    ui/           shadcn/ui primitives (button, card, badge, progress, …)
    common/       product building blocks (ScoreRing, EmptyState, PageHeader, Disclaimer, …)
    layout/       AppShell (mobile tab bar ↔ desktop sidebar), menus, notification bell
  config/         navigation
  domain/         pure, tested business logic — no React, no Supabase
                  (recovery score, recovery day, roles, permission catalogue, restrictions, entitlements)
  features/       auth, theme, entitlements, athlete, professional, shared pages
  services/
    data/         the ONLY place that queries Supabase (typed, RLS-backed)
    realtime/     useRealtimeInvalidation — Postgres changes → query invalidation
    ai/           AI service abstraction + guardrails
  lib/            env, Supabase client, query client, dates, utils
  types/          generated DB types + domain aliases
supabase/
  migrations/     schema, RLS, RPCs, storage, realtime
  tests/          RLS test suite (+ a minimal Supabase stub for plain Postgres)
scripts/          db-test.sh, gen-types.mjs
```

Layering: **UI → features → services/data → Supabase**. Domain logic is pure and unit tested. Components never
call Supabase directly, never check a plan name, and never call an AI model.

### Data model

All tables use UUID primary keys and `created_at` / `updated_at` (trigger-maintained). Authored rows carry
`created_by` / `uploaded_by` / `set_by`. Sensitive tables are written to an append-only `audit_log`.

| Area | Tables |
| --- | --- |
| Identity | `auth.users` (= "users"), `profiles`, `athletes`, `professionals` |
| Organisations | `organisations`, `organisation_members` |
| Injury & clinical | `injuries`, `injury_events` (timeline), `diagnoses`, `surgeries`, `medical_documents` |
| Rehab | `rehab_programmes` (rehab or conditioning), `rehab_phases`, `rehab_exercises`, `exercise_logs` |
| Tracking | `daily_checkins`, `recovery_scores`, `recovery_metrics` (generic time-series), `milestones` |
| Journal | `journal_entries` (**private by default**), `journal_media`, `event_media` |
| Team & access | `team_members`, `permissions`, `role_default_permissions`, `restrictions` |
| Platform | `notifications`, `ai_insights`, `subscriptions`, `plan_features`, `integration_connections`, `audit_log` |

**Built for what's next:** `recovery_metrics` (namespaced keys such as `hrv.rmssd`, `gps.total_distance_m`,
`rom.knee_flexion_deg`, with source/provider/external id for idempotent sync) and `integration_connections`
cover Apple Health / Garmin / WHOOP, GPS load and camera-based ROM. `rehab_programmes.protocol_key` anchors
sport-specific return-to-play protocols. Organisations + subscriptions cover clubs and clinics.

### Permissions (enforced in Postgres, never only in the UI)

- An athlete **owns** every row carrying their `athlete_id`.
- A professional reaches an athlete's data only through an **active** `team_members` connection **and** an
  explicit **scope** on that connection (`checkins.read`, `medical.read`, `restrictions.write`, …).
  Defaults per role apply minimum necessary access; the athlete can narrow or revoke at any time, effective
  immediately.
- Team coaches see availability only, via `get_athlete_status_board()` — no injury record, diagnosis,
  check-ins, journal or documents.
- Journal entries are visible to professionals only when the athlete shares that entry **and** the connection
  has `journal.shared.read`.
- Composite foreign keys stop a child row being attached to another athlete's record; ownership columns are
  immutable.
- Connections, invites and permission changes go through RPCs only (`invite_team_member`,
  `accept_team_invite`, `revoke_team_member`, `set_team_member_permissions`).
- Storage buckets (`journal-media`, `event-media`, `medical-documents`, `avatars`) apply the same rules.
- Realtime `postgres_changes` honours RLS, so subscribers only receive rows they may read.

`supabase/tests/rls_test.sql` checks this per role (athlete, other athlete, physio, coach, S&C, outsider, anon).

### Entitlements

Plans: **Free**, **Premium Athlete**, **Pro / Clinic**. `plan_features` in the database decides what each
plan unlocks (with limits, e.g. Free = 3 team connections, enforced in `invite_team_member`). The UI asks
`useEntitlement('ai.copilot')` or wraps content in `<FeatureGate>`. No component knows plan names or
billing.

### AI

`src/services/ai` is the single entry point: `ai.run({ capability, athleteId, … }, entitlements)`.
It checks the entitlement, sends the non-negotiable policy as the system prompt, and filters output. The AI
must never diagnose, declare clearance, override a restriction or recommend an unsafe return, and every
result carries a disclaimer. Phase 1 ships with AI **disabled**. Phase 6 swaps in `EdgeFunctionAiProvider`, so
model keys stay server-side.

### Recovery score

`domain/recovery-score.ts`: a weighted 0–100 average of the check-in metrics, with symptoms inverted. Athletes
can configure weights and which metrics count. It is always labelled a personal tracking metric, never a
medical assessment.

## Design language

Dark-first, with full light mode. The look is near-black neutrals and one "volt" accent. Big condensed display
type (Barlow Condensed) sits over Inter, with generous spacing and cards. Traffic-light colours are reserved
for restriction and availability status. Fonts are self-hosted.

## Known follow-ups

- The production bundle is about 830 kB (246 kB gzip). Route-level code splitting is planned with the Phase 2
  pages.
- The Realtime subscriptions are wired in but have not been exercised against a live Realtime server yet.
  Verify them on a Supabase project during Phase 3.
- `get_athlete_status_board` returns the primary active injury only. Multi-injury availability is a Phase 5
  decision.
