import '@/i18n';

import {
  Geologica_400Regular,
  Geologica_500Medium,
  Geologica_600SemiBold,
  Geologica_700Bold,
  Geologica_800ExtraBold,
} from '@expo-google-fonts/geologica';
import { useFonts, type FontFamilyDefinition } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ProfileLoadError } from '@/components/profile-load-error';
import { AppFont, Colors } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/lib/auth';
import { MyProfileProvider } from '@/lib/my-profile';

// The splash screen stays up until the font has loaded and we know whether to show sign-in,
// onboarding or the app.
SplashScreen.preventAutoHideAsync();

/** Every weight the app uses, under one family name so `fontWeight` picks the face. */
const FONT_FAMILIES: FontFamilyDefinition[] = [
  {
    fontFamily: AppFont,
    fontDefinitions: [
      { path: Geologica_400Regular, weight: 400, style: 'normal' },
      { path: Geologica_500Medium, weight: 500, style: 'normal' },
      { path: Geologica_600SemiBold, weight: 600, style: 'normal' },
      { path: Geologica_700Bold, weight: 700, style: 'normal' },
      { path: Geologica_800ExtraBold, weight: 800, style: 'normal' },
    ],
  },
];

/** React Navigation's themes with the app's colours and font, for anything it draws itself. */
function navigationTheme(base: typeof DefaultTheme, colors: (typeof Colors)['light' | 'dark']) {
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.accent,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
    },
    fonts: {
      regular: { ...base.fonts.regular, fontFamily: AppFont },
      medium: { ...base.fonts.medium, fontFamily: AppFont },
      bold: { ...base.fonts.bold, fontFamily: AppFont },
      heavy: { ...base.fonts.heavy, fontFamily: AppFont },
    },
  };
}

const LIGHT_NAVIGATION = navigationTheme(DefaultTheme, Colors.light);
const DARK_NAVIGATION = navigationTheme(DarkTheme, Colors.dark);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DARK_NAVIGATION : LIGHT_NAVIGATION}>
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
  // If the font fails to load, the app goes on with the system font rather than staying blank.
  const [fontsLoaded, fontError] = useFonts(FONT_FAMILIES);

  if (!isReady || (!fontsLoaded && !fontError)) return null;

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
