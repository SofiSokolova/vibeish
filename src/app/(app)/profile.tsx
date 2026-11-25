import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { HobbyTags } from '@/components/hobby-picker';
import { LanguagePicker } from '@/components/language-picker';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { spokenLanguageNames } from '@/constants/languages';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth';
import { useMyProfile, type MyProfile } from '@/lib/my-profile';

/** The signed-in person's profile as others will see it, then the app's settings. */
export default function ProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { session, signOut } = useAuth();
  const { profile, status, reload } = useMyProfile();
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
    <Screen title={t('profile.title')}>
      {profile ? (
        <ProfileDetails profile={profile} />
      ) : status === 'error' ? (
        <View style={styles.group}>
          <ThemedText type="smallBold">{t('loadError.title')}</ThemedText>
          <ThemedText themeColor="textSecondary">{t('loadError.body')}</ThemedText>
          <Button title={t('loadError.retry')} variant="secondary" onPress={reload} />
        </View>
      ) : (
        <ActivityIndicator color={theme.textSecondary} style={styles.loading} />
      )}

      <View style={[styles.section, styles.settings]}>
        <ThemedText style={styles.sectionTitle}>{t('profile.settings')}</ThemedText>
        <LanguagePicker label={t('profile.language')} />
        <View style={styles.group}>
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
      </View>
    </Screen>
  );
}

function ProfileDetails({ profile }: { profile: MyProfile }) {
  const { t } = useTranslation();
  const city = profile.homeCity ? t(`city.${profile.homeCity}`) : profile.requestedCity;
  const languages = spokenLanguageNames(profile.languages).join(', ');

  return (
    <View style={styles.section}>
      <View>
        <ThemedText style={styles.name}>{profile.displayName}</ThemedText>
        <ThemedText themeColor="textSecondary">{[city, languages].filter(Boolean).join(' · ')}</ThemedText>
      </View>

      <View style={styles.group}>
        <ThemedText type="smallBold">{t('profile.about')}</ThemedText>
        <ThemedText themeColor={profile.bio ? 'text' : 'textSecondary'}>{profile.bio || t('profile.aboutEmpty')}</ThemedText>
      </View>

      <View style={styles.group}>
        <ThemedText type="smallBold">{t('profile.hobbies')}</ThemedText>
        {Object.keys(profile.hobbies).length > 0 ? (
          <HobbyTags hobbies={profile.hobbies} />
        ) : (
          <ThemedText themeColor="textSecondary">{t('profile.hobbiesEmpty')}</ThemedText>
        )}
      </View>

      <Button title={t('profile.edit')} variant="secondary" onPress={() => router.push('/edit-profile')} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.three,
  },
  settings: {
    marginTop: Spacing.four,
  },
  group: {
    gap: Spacing.two,
  },
  name: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: 600,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: 600,
  },
  loading: {
    alignSelf: 'flex-start',
  },
});
