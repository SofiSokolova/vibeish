@AGENTS.md

# Hobby Buddies (working title)

An app and website for finding people to share a hobby with. People swipe through activity listings near them ("table tennis on Saturday, one more player needed"), ask to join with a short note, and the listing's author picks who comes; the chosen people get a group chat. Product decisions and the MVP plan: [docs/MVP.md](docs/MVP.md) (in Russian).

## Stack

- Expo SDK 58 + Expo Router (routes in `src/app`), TypeScript, one codebase for Android and web. iOS comes later.
- Supabase: Postgres + PostGIS, Auth, Realtime (chat), Storage, Edge Functions. Client in `src/lib/supabase.ts`, settings in `.env` (see `.env.example`).
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

## Commands

- `npx expo start`: dev server (press `w` for web, or scan the QR code with Expo Go on Android)
- `npm run typecheck`, `npx expo lint`, `npm run i18n:check`: run all three before calling a task done
