@AGENTS.md

# Vibeish

An app and website for finding friends through shared activities. People swipe through activity listings near them ("table tennis on Saturday, one more player needed"), ask to join with a short note, and the listing's author picks who comes; the chosen people get a group chat.

## Stack

- Expo SDK 58 + Expo Router (routes in `src/app`), TypeScript, one codebase for Android and web. iOS comes later.
- Supabase: Postgres, Auth, Realtime (chat), Storage, Edge Functions. Client in `src/lib/supabase.ts`, settings in `.env` (see `.env.example`). Schema in `supabase/migrations`; coordinates are plain lat/lng with haversine distance (no PostGIS yet).
- i18next + react-i18next + expo-localization, set up in `src/i18n`.
- Node.js 22.13 or newer (26 LTS recommended); older versions are unsupported by Expo SDK 58.

## Conventions

- Every user-facing string goes through `t()`. Keys live in `src/i18n/locales/*.json`; `en.json` is the source of truth and defines the TypeScript types for `t()`. After adding or changing keys, update all six locales (en, et, ru, uk, fi, lv) and run `npm run i18n:check`.
- Address users informally in every language, and keep Russian and Ukrainian texts gender-neutral: avoid past-tense verbs that describe the user, because their form depends on gender.
- Hobby categories and cities have permanent slugs in `src/constants/categories.ts` and `src/constants/cities.ts`; the database stores the same slugs. Names exist only in the locale files as `category.<slug>` and `city.<slug>`. Never rename a slug.
- A hobby's skill level is 1–3 in `user_interests.skill_level`, or null when the person gives none (`src/constants/skill-levels.ts`; names in the locale files as `skillLevel.<slug>`). Each level has its own theme color, always shown together with `SkillLevelDots` so the level reads without color. Red is not a level color: it means an error.
- Sign-in is passwordless: a code sent by email (`src/app/sign-in.tsx`). `src/lib/auth.tsx` tracks the session and whether the profile exists, and the root layout uses protected routes to open exactly one of sign-in, onboarding (`src/app/onboarding.tsx`, which ends with `complete_onboarding()`) or the tabs in `src/app/(app)`.
- The feed (`src/app/(app)/index.tsx`) is the main screen: its header has the logo, search and notifications, the Feed | Map tabs switch its view, and its bottom bar (`src/components/feed-bottom-bar.tsx`) opens meetups, plan creation and the profile. Those open over the feed in the `(app)` stack and use `src/components/screen.tsx` with `back`, which adds a back button; the feed is the only screen with a bottom bar. Icons come from `expo-symbols` through `src/components/icon.tsx`, with their names in `src/constants/icons.ts`. Light colors follow the day design and dark colors the night one (`src/constants/theme.ts`).
- The feed's cards (`src/components/feed-card.tsx`) are swiped in `src/components/swipe-deck.tsx` with the gesture handler's `usePanGesture` and Reanimated; the root layout wraps the app in `GestureHandlerRootView`, and the NAH and VIBE buttons do the same as a swipe for people who don't drag. Until the feed loads real listings, development builds show the sample ones from `src/lib/feed.ts`. Hobby pictures are Fluent Emoji 3D (MIT) in `assets/images/hobbies`, mapped in `src/constants/hobby-images.ts`; a hobby without one shows an icon.
- The neon look's gradients and shadows are CSS strings in `Effects` (`src/constants/theme.ts`, read with `useEffects()`), which React Native and the web both read in `backgroundImage` and `boxShadow`. A gradient border is an outer view with the gradient around an opaque inner one.
- A child of `<Link asChild>` takes one flat style object: Expo Router throws on a style array there and drops a style function, so use `StyleSheet.flatten`.
- The app font is Geologica from `@expo-google-fonts/geologica`. The root layout loads weights 400–800 under one family name (`AppFont` in `src/constants/theme.ts`) and keeps the splash screen up until they are ready. `ThemedText`, text inputs and tab labels set `fontFamily: Fonts.sans` and pick the weight with `fontWeight`; a new weight needs its file added to `FONT_FAMILIES` in `src/app/_layout.tsx`.
- Cards that open next to an element, like the hobby level choice, use `src/components/anchored-popover.tsx`; whole lists to choose from, like every language, open in `src/components/dialog.tsx`. Both float over the content instead of pushing it aside, and a card never opens over a dialog.
- The signed-in person's own profile comes from `useMyProfile()` in `src/lib/my-profile.tsx`, which loads it once and keeps it after a save. The profile tab shows it; `src/app/edit-profile.tsx` changes it with `update_profile()`.
- Profile photos live in the private `avatars` bucket, one folder per person (`<user id>/<file>.jpg`), and follow the same visibility as profiles. `src/lib/avatar.ts` turns a picked photo into a square JPEG before uploading it, and `src/components/avatar.tsx` shows a photo through a short-lived signed link.
- The interface language is chosen with `setAppLanguage()` from `src/i18n`, which remembers it on the device; for signed-in users `src/lib/auth.tsx` also saves it to `profile_private.ui_language`.
- The web app is a single-page app (`web.output: "single"`): nothing is server-rendered.
- Only `EXPO_PUBLIC_*` values go into the app, and they are public by design. Server secrets belong in Supabase Edge Function secrets, never in the repo.
- Product rules the code must respect: 18+ only; reporting, blocking and moderation are free for everyone.

## Database

- Every schema change is a new migration in `supabase/migrations` (`YYYYMMDDHHMMSS_name.sql`). Once a migration has been applied to a real Supabase project, never edit it; add a new one.
- Every table has row level security. The Supabase project does not expose new tables automatically, so every migration that creates a table grants privileges explicitly: clients (`anon`, `authenticated`) get only the tables and columns they need, `service_role` gets everything. Columns the server owns (moderation, counters, bans) are never granted to clients.
- Multi-step actions are `security definer` functions with `set search_path = ''` that check the caller themselves. When the caller's own rights are enough, the function is `security invoker` instead (like `update_profile()`), so every table's access rules still apply. When a policy needs to look at another table, it goes through a helper function such as `private.is_chat_member()`, so policies never call each other in a loop.
- Everything in `public` is callable through the Data API. Only functions the app calls live there; policy helpers live in the `private` schema, which the API does not expose. Supabase's advisor warning "Signed-In Users Can Execute SECURITY DEFINER Function" is expected for the app-facing functions, which check the caller themselves.
- After every migration: `npm run db:test`, `npm run db:push`, then `npm run db:types` to refresh `src/lib/database.types.ts`; check `npx supabase db advisors --remote`.
- Reference data (categories, cities) lives in migrations and must match `src/constants/categories.ts` and `src/constants/cities.ts`.
- Every new access rule gets a test in `scripts/db-test.mjs`, which runs the migrations in an in-memory Postgres (PGlite) with a stand-in for Supabase's auth and storage schemas. Storage buckets and their policies are created in migrations too.

## Commands

- `npx expo start`: dev server (press `w` for web, or scan the QR code with Expo Go on Android)
- `npm run typecheck`, `npx expo lint`, `npm run i18n:check`: run all three before calling a task done
- `npm run db:test`: run after any change in `supabase/migrations`
