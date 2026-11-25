import '@/i18n';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ProfileLoadError } from '@/components/profile-load-error';
import { AuthProvider, useAuth } from '@/lib/auth';
import { MyProfileProvider } from '@/lib/my-profile';

// The splash screen stays up until we know whether to show sign-in, onboarding or the app.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <MyProfileProvider>
          <RootNavigator />
        </MyProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

/**
 * Exactly one part of the app is open at a time: sign-in, onboarding (signed in, no profile
 * yet) or the tabs in (app) with the screens that open over them, like the profile editor.
 * Protected routes send anyone who opens another part's address to the open one.
 */
function RootNavigator() {
  const { isReady, session, profileStatus } = useAuth();

  if (!isReady) return null;

  const signedIn = session !== null;

  return (
    <>
      <AnimatedSplashOverlay />
      {signedIn && profileStatus === 'error' ? (
        <ProfileLoadError />
      ) : (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={signedIn && profileStatus === 'complete'}>
            <Stack.Screen name="(app)" />
            {/* Opens over the tabs, without the tab bar. */}
            <Stack.Screen name="edit-profile" />
          </Stack.Protected>
          <Stack.Protected guard={signedIn && profileStatus === 'missing'}>
            <Stack.Screen name="onboarding" />
          </Stack.Protected>
          {/* Stays open while the profile of someone who has just signed in is being checked. */}
          <Stack.Protected guard={!signedIn || profileStatus === 'loading'}>
            <Stack.Screen name="sign-in" />
          </Stack.Protected>
        </Stack>
      )}
    </>
  );
}
