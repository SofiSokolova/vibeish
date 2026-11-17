import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { LanguagePicker } from '@/components/language-picker';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { session, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutFailed, setSignOutFailed] = useState(false);
  const email = session?.user.email;

  async function handleSignOut() {
    setSigningOut(true);
    setSignOutFailed(false);
    // On success the root layout closes this screen and opens sign-in.
    if (!(await signOut())) {
      setSigningOut(false);
      setSignOutFailed(true);
    }
  }

  return (
    <Screen title={t('profile.title')} description={t('profile.body')}>
      <LanguagePicker label={t('profile.language')} />
      <View style={styles.account}>
        {email ? (
          <ThemedText type="small" themeColor="textSecondary">
            {t('profile.account', { email })}
          </ThemedText>
        ) : null}
        <Button
          title={t('profile.signOut')}
          variant="secondary"
          loading={signingOut}
          onPress={() => void handleSignOut()}
        />
        {signOutFailed ? (
          <ThemedText type="small" themeColor="danger" accessibilityLiveRegion="polite">
            {t('common.errors.network')}
          </ThemedText>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  account: {
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
});
