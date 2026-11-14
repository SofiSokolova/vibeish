@AGENTS.md

# Vibeish

An app and website for finding friends through shared activities; hobbies are the excuse to meet, not the limit. People swipe through activity listings near them ("table tennis on Saturday, one more player needed"), ask to join with a short note, and the listing's author picks who comes; the chosen people get a group chat. The brand is playful and youthful (slogan: "friends with no benefits"), never dating-like. Product decisions and the MVP plan: [docs/MVP.md](docs/MVP.md) (in Russian).

## Stack

- Expo SDK 58 + Expo Router (routes in `src/app`), TypeScript, one codebase for Android and web. iOS comes later.
- Supabase: Postgres, Auth, Realtime (chat), Storage, Edge Functions. Client in `src/lib/supabase.ts`, settings in `.env` (see `.env.example`). Schema in `supabase/migrations`; coordinates are plain lat/lng with haversine distance (no PostGIS yet).
- i18next + react-i18next + expo-localization, set up in `src/i18n`.
- Node.js 22.13 or newer (24 LTS recommended); older versions are unsupported by Expo SDK 58.

## Conventions

- Every user-facing string goes through `t()`. Keys live in `src/i18n/locales/*.json`; `en.json` is the source of truth and defines the TypeScript types for `t()`. After adding or changing keys, update all six locales (en, et, ru, uk, fi, lv) and run `npm run i18n:check`.
- Address the user informally (ты / ти / sina / sinä / tu) and keep ru/uk texts gender-neutral: no past-tense verbs about the user (avoid «ты откликнулся/откликнулась»).
- Hobby categories have permanent slugs in `src/constants/categories.ts`; the database stores the same slugs. Names exist only in the locale files as `category.<slug>`. Never rename a slug.
- Tabs are defined once in `src/constants/tabs.ts` and rendered by `src/components/app-tabs.tsx` (native) and `app-tabs.web.tsx` (web: floating top bar on wide screens, bottom bar on phones). Tab screens use `src/components/screen.tsx`.
- The web app is a single-page app (`web.output: "single"`): nothing is server-rendered.
- Only `EXPO_PUBLIC_*` values go into the app, and they are public by design. Server secrets belong in Supabase Edge Function secrets, never in the repo.
- Product rules the code must respect: 18+ only; reporting, blocking and moderation are free for everyone.
- Commit messages: no `Co-Authored-By` or other AI-attribution lines.

## Database

- Every schema change is a new migration in `supabase/migrations` (`YYYYMMDDHHMMSS_name.sql`). Once a migration has been applied to a real Supabase project, never edit it; add a new one.
- Every table has row level security. Clients get explicit table and column grants only (see the end of the initial migration); columns the server owns (moderation, counters, bans) are never granted.
- Multi-step actions are `security definer` functions with `set search_path = ''` that check the caller themselves. When a policy needs to look at another table, it goes through a helper function such as `is_chat_member()`, so policies never call each other in a loop.
- Reference data (categories, cities) lives in migrations. Categories must match `src/constants/categories.ts`.
- Every new access rule gets a test in `scripts/db-test.mjs`, which runs the migrations in an in-memory Postgres (PGlite) with a stand-in for Supabase's auth schema.

## Commands

- `npx expo start`: dev server (press `w` for web, or scan the QR code with Expo Go on Android)
- `npm run typecheck`, `npx expo lint`, `npm run i18n:check`: run all three before calling a task done
- `npm run db:test`: run after any change in `supabase/migrations`
