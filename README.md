# Vibeish

Friends with no benefits. Find your people through the things you love doing: swipe through plans nearby, ask to join, meet up.

Expo (Android and web) · Supabase · interface in English, Estonian, Russian, Ukrainian, Finnish and Latvian.

**Status:** early development. The app skeleton, translations, database schema, sign-in with an email code and onboarding are done; listings and the swipe feed come next.

## What's inside

- **App:** Expo SDK 58 with Expo Router, one TypeScript codebase for Android and web. Native tab bar on Android; on the web, a floating top bar on wide screens and an app-like bottom bar on phones.
- **Database:** Supabase Postgres with row level security on every table, column-level grants, and security definer functions for multi-step actions such as accepting an applicant. The access rules are covered by tests that run the migrations in an in-memory Postgres (PGlite), so no Docker is needed.
- **Translations:** six languages with typed keys and a check that every language has every key.

## Getting started

Requires Node.js 22.13 or newer (26 LTS recommended).

```bash
npm install
cp .env.example .env   # Supabase URL and publishable key
npx expo start         # press w for web, or scan the QR code with Expo Go
```

## Checks

```bash
npm run typecheck
npx expo lint
npm run i18n:check
npm run db:test        # database schema and access rules, no Docker needed
```

## License

© 2026 Sofiia Sokolova. All rights reserved. The code is public so it can be read as a portfolio project; please ask before reusing any of it.
