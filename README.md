# Hobby Buddies (working title)

Find people to share a hobby with: swipe through activity listings nearby, ask to join, meet up.

Expo (Android and web) · Supabase · interface in English, Estonian, Russian, Ukrainian, Finnish and Latvian.

## Getting started

Requires Node.js 22.13 or newer.

```bash
npm install
cp .env.example .env   # Supabase URL and publishable key; needed once sign-in is added
npx expo start         # press w for web, or scan the QR code with Expo Go
```

## Checks

```bash
npm run typecheck
npx expo lint
npm run i18n:check
```

The product plan and decisions are in [docs/MVP.md](docs/MVP.md).
