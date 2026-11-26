import { Stack } from 'expo-router';

/**
 * The signed-in part of the app. The feed is the main screen; meetups, the profile and plan
 * creation open over it and lead back to it. The root layout only opens this group once
 * onboarding is done.
 */
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="meetups" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="create" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
