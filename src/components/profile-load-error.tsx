import { useTranslation } from 'react-i18next';

import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { useAuth } from '@/lib/auth';

/** Shown instead of the app when the profile of a signed-in person could not be loaded. */
export function ProfileLoadError() {
  const { t } = useTranslation();
  const { isRetrying, reloadProfile, signOut } = useAuth();

  return (
    <Screen variant="standalone" title={t('loadError.title')} description={t('loadError.body')}>
      <Button title={t('loadError.retry')} loading={isRetrying} onPress={reloadProfile} />
      <Button title={t('profile.signOut')} variant="link" onPress={() => void signOut()} />
    </Screen>
  );
}
