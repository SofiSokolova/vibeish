import AppTabs from '@/components/app-tabs';

/** The signed-in part of the app: the five tabs. The root layout only opens it once onboarding is done. */
export default function AppLayout() {
  return <AppTabs />;
}
