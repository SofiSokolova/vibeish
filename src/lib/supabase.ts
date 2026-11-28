// Keeps the auth session in SQLite on Android and iOS; on web the browser's own localStorage is used.
import 'expo-sqlite/localStorage/install';

import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { AppState, Platform } from 'react-native';

// Generated from the linked project with `npm run db:types`; regenerate after every migration.
import type { Database } from './database.types';

// Both values are public by design: they ship inside the app. See .env.example.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Supabase is not configured: copy .env.example to .env and set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
  );
}

/**
 * In development the database may run on this computer (`npx supabase start`, set up in
 * .env.development.local). A phone can't reach it at 127.0.0.1, so it uses the computer's address
 * on the network, the one it loads the app from.
 */
function reachableUrl(url: string): string {
  if (!__DEV__ || Platform.OS === 'web') return url;
  const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
  return devHost ? url.replace(/\/\/(127\.0\.0\.1|localhost)(?=[:/]|$)/, `//${devHost}`) : url;
}

export const supabase = createClient<Database>(reachableUrl(supabaseUrl), supabasePublishableKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Only the web app gets sign-in redirects that carry the session in the URL.
    detectSessionInUrl: Platform.OS === 'web',
  },
});

// On mobile, keep refreshing the session only while the app is in the foreground.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
