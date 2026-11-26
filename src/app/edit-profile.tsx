import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { Tag } from '@/components/chip';
import { CityChips, OTHER_CITY, OtherCityField, type CityChoice } from '@/components/city-picker';
import { Dialog } from '@/components/dialog';
import { HobbyPicker } from '@/components/hobby-picker';
import { Screen } from '@/components/screen';
import { SectionHeader } from '@/components/section-header';
import { SpokenLanguagePicker } from '@/components/spoken-language-picker';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { CATEGORIES, hasSkillLevels } from '@/constants/categories';
import { spokenLanguageNames } from '@/constants/languages';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isNetworkFailure } from '@/lib/auth-errors';
import { pickPhoto, preparePhoto, type PreparedPhoto } from '@/lib/avatar';
import { useMyProfile, type MyProfile } from '@/lib/my-profile';

// The same limits as the profiles table.
const MAX_NAME_LENGTH = 50;
const MAX_ABOUT_LENGTH = 500;

type ErrorKey =
  | 'onboarding.profile.errors.name'
  | 'onboarding.profile.errors.languages'
  | 'onboarding.city.errors.city'
  | 'onboarding.city.errors.otherCity'
  | 'common.errors.network'
  | 'common.errors.generic';

/** The lists that open in a dialog: the editor itself shows only what is chosen. */
type OpenList = 'languages' | 'hobbies' | 'city';

type PhotoErrorKey = 'editProfile.photoFailed' | 'common.errors.network' | 'common.errors.generic';

/** A photo change shown in the preview and saved only when the person agrees. */
type PendingPhoto = ({ kind: 'new' } & PreparedPhoto) | { kind: 'remove' };

const AVATAR_SIZE = 88;

/** Edits the signed-in person's profile: name, about text, languages, hobbies and city. */
export default function EditProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { profile, status, reload } = useMyProfile();

  if (profile) return <ProfileForm initial={profile} />;

  return (
    <Screen variant="standalone" title={t('editProfile.title')}>
      {status === 'error' ? (
        <>
          <ThemedText themeColor="textSecondary">{t('loadError.body')}</ThemedText>
          <Button title={t('loadError.retry')} onPress={reload} />
        </>
      ) : (
        <ActivityIndicator color={theme.textSecondary} style={styles.loading} />
      )}
    </Screen>
  );
}

/** Back to the profile, or to the profile tab when the editor was opened by its address. */
function leaveEditor() {
  if (router.canGoBack()) router.back();
  else router.replace('/profile');
}

function ProfileForm({ initial }: { initial: MyProfile }) {
  const { t } = useTranslation();
  const { profile, save, setPhoto } = useMyProfile();
  // The saved photo comes from the live profile; a change waits in pendingPhoto until it is saved.
  const avatarPath = profile?.avatarPath ?? null;
  const [pendingPhoto, setPendingPhoto] = useState<PendingPhoto | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<PhotoErrorKey | null>(null);
  const [name, setName] = useState(initial.displayName);
  const [about, setAbout] = useState(initial.bio);
  const [languages, setLanguages] = useState(initial.languages);
  const [hobbies, setHobbies] = useState(initial.hobbies);
  const [city, setCity] = useState<CityChoice | null>(
    initial.homeCity ?? (initial.requestedCity ? OTHER_CITY : null)
  );
  const [otherCity, setOtherCity] = useState(initial.requestedCity ?? '');
  const [openList, setOpenList] = useState<OpenList | null>(null);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [saving, setSaving] = useState(false);

  async function choosePhoto() {
    setPhotoError(null);
    try {
      // Nothing shows as busy while the picker is open: on the web, closing it may never answer.
      const uri = await pickPhoto();
      if (!uri) return;
      setPhotoBusy(true);
      setPendingPhoto({ kind: 'new', ...(await preparePhoto(uri)) });
    } catch {
      setPhotoError('editProfile.photoFailed');
    }
    setPhotoBusy(false);
  }

  /** Saves the photo change on its own. Resolves to false when that failed. */
  async function savePhoto(): Promise<boolean> {
    if (!pendingPhoto) return true;
    setPhotoError(null);
    setPhotoBusy(true);
    const error = await setPhoto(pendingPhoto.kind === 'new' ? pendingPhoto.data : null);
    setPhotoBusy(false);
    if (error) {
      setPhotoError(
        isNetworkFailure(error)
          ? 'common.errors.network'
          : pendingPhoto.kind === 'new'
            ? 'editProfile.photoFailed'
            : 'common.errors.generic'
      );
      return false;
    }
    setPendingPhoto(null);
    return true;
  }

  function cancelPhoto() {
    setPendingPhoto(null);
    setPhotoError(null);
  }

  async function submit() {
    const typedCity = otherCity.trim();
    if (!name.trim()) {
      setError('onboarding.profile.errors.name');
      return;
    }
    if (languages.length === 0) {
      setError('onboarding.profile.errors.languages');
      return;
    }
    if (city === null) {
      setError('onboarding.city.errors.city');
      return;
    }
    if (city === OTHER_CITY && !typedCity) {
      setError('onboarding.city.errors.otherCity');
      return;
    }

    setSaving(true);
    setError(null);
    // A photo that is chosen but not saved yet is saved together with the rest.
    if (!(await savePhoto())) {
      setSaving(false);
      return;
    }
    const saveError = await save({
      displayName: name.trim(),
      bio: about.trim(),
      languages,
      homeCity: city === OTHER_CITY ? null : city,
      requestedCity: city === OTHER_CITY ? typedCity : null,
      hobbies,
    });
    if (saveError) {
      setSaving(false);
      setError(isNetworkFailure(saveError) ? 'common.errors.network' : 'common.errors.generic');
      return;
    }
    leaveEditor();
  }

  const errorText = error ? t(error) : null;
  const nameError = error === 'onboarding.profile.errors.name' ? errorText : null;
  const otherCityError = error === 'onboarding.city.errors.otherCity' ? errorText : null;
  // Errors that belong to no single field are shown above the save button.
  const formError = nameError || otherCityError ? null : errorText;
  const hasHobbies = Object.keys(hobbies).length > 0;
  const closeList = () => setOpenList(null);

  return (
    <>
      <Screen variant="standalone" title={t('editProfile.title')}>
        <View style={styles.group}>
          <View style={styles.photo}>
            <Avatar
              path={pendingPhoto ? null : avatarPath}
              previewUri={pendingPhoto?.kind === 'new' ? pendingPhoto.uri : null}
              name={name || initial.displayName}
              size={AVATAR_SIZE}
            />
            <View style={styles.photoActions}>
              {pendingPhoto ? (
                <>
                  <Button
                    title={
                      pendingPhoto.kind === 'new' ? t('editProfile.savePhoto') : t('editProfile.removePhotoConfirm')
                    }
                    loading={photoBusy}
                    onPress={() => void savePhoto()}
                  />
                  <Button variant="link" title={t('editProfile.cancel')} disabled={photoBusy} onPress={cancelPhoto} />
                </>
              ) : (
                <>
                  <Button
                    variant="secondary"
                    title={avatarPath ? t('editProfile.changePhoto') : t('editProfile.addPhoto')}
                    loading={photoBusy}
                    onPress={() => void choosePhoto()}
                  />
                  {avatarPath ? (
                    <Button
                      variant="link"
                      title={t('editProfile.removePhoto')}
                      disabled={photoBusy}
                      onPress={() => {
                        setPhotoError(null);
                        setPendingPhoto({ kind: 'remove' });
                      }}
                    />
                  ) : null}
                </>
              )}
            </View>
          </View>
          <ThemedText
            type="small"
            themeColor={photoError ? 'danger' : 'textSecondary'}
            accessibilityLiveRegion={photoError ? 'polite' : 'none'}>
            {photoError
              ? t(photoError)
              : pendingPhoto
                ? t(pendingPhoto.kind === 'new' ? 'editProfile.photoPreview' : 'editProfile.removePhotoQuestion')
                : t('editProfile.photoHint')}
          </ThemedText>
        </View>

        <TextField
          label={t('onboarding.profile.name')}
          hint={t('onboarding.profile.nameHint')}
          error={nameError}
          value={name}
          onChangeText={(value) => {
            setName(value);
            setError(null);
          }}
          maxLength={MAX_NAME_LENGTH}
          autoCapitalize="words"
          autoComplete="given-name"
          textContentType="givenName"
        />
        <TextField
          label={t('editProfile.about')}
          hint={t('editProfile.aboutHint')}
          value={about}
          onChangeText={setAbout}
          maxLength={MAX_ABOUT_LENGTH}
          multiline
          style={styles.about}
        />

        <View style={styles.group}>
          <SectionHeader
            title={t('onboarding.profile.languages')}
            action={{
              label: t('editProfile.change'),
              accessibilityLabel: t('editProfile.changeLanguages'),
              onPress: () => setOpenList('languages'),
            }}
          />
          {languages.length > 0 ? (
            <View style={styles.tags}>
              {spokenLanguageNames(languages).map((language) => (
                <Tag key={language} label={language} />
              ))}
            </View>
          ) : (
            <ThemedText themeColor="textSecondary">{t('onboarding.profile.errors.languages')}</ThemedText>
          )}
        </View>

        <View style={styles.group}>
          <SectionHeader
            title={t('profile.hobbies')}
            action={{
              label: hasHobbies ? t('editProfile.change') : t('editProfile.choose'),
              accessibilityLabel: t('editProfile.changeHobbies'),
              onPress: () => setOpenList('hobbies'),
            }}
          />
          {hasHobbies ? (
            <>
              {/* Levels are chosen here, on the chosen hobbies, not in the list of all hobbies. */}
              {CATEGORIES.some(({ slug }) => slug in hobbies && hasSkillLevels(slug)) ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {t('editProfile.levelsHint')}
                </ThemedText>
              ) : null}
              <HobbyPicker mode="levels" value={hobbies} onChange={setHobbies} />
            </>
          ) : (
            <ThemedText themeColor="textSecondary">{t('profile.hobbiesEmpty')}</ThemedText>
          )}
        </View>

        <View style={styles.group}>
          <SectionHeader
            title={t('onboarding.city.title')}
            action={{
              label: t('editProfile.change'),
              accessibilityLabel: t('editProfile.changeCity'),
              onPress: () => setOpenList('city'),
            }}
          />
          {city ? (
            <View style={styles.tags}>
              <Tag label={city === OTHER_CITY ? t('onboarding.city.notListed') : t(`city.${city}`)} />
            </View>
          ) : (
            <ThemedText themeColor="textSecondary">{t('onboarding.city.errors.city')}</ThemedText>
          )}
          {city === OTHER_CITY ? (
            <OtherCityField
              value={otherCity}
              onChangeText={(value) => {
                setOtherCity(value);
                setError(null);
              }}
              error={otherCityError}
              onSubmitEditing={() => void submit()}
            />
          ) : null}
        </View>

        <View style={styles.actions}>
          {formError ? (
            <ThemedText type="small" themeColor="danger" accessibilityLiveRegion="polite">
              {formError}
            </ThemedText>
          ) : null}
          <Button title={t('editProfile.save')} loading={saving} onPress={() => void submit()} />
          <Button variant="link" title={t('editProfile.cancel')} disabled={saving} onPress={leaveEditor} />
        </View>
      </Screen>

      <Dialog
        visible={openList === 'languages'}
        title={t('onboarding.profile.languages')}
        closeLabel={t('common.done')}
        onClose={closeList}>
        <ThemedText type="small" themeColor="textSecondary">
          {t('onboarding.profile.languagesHint')}
        </ThemedText>
        <SpokenLanguagePicker
          value={languages}
          onChange={(value) => {
            setLanguages(value);
            setError(null);
          }}
        />
      </Dialog>

      <Dialog visible={openList === 'hobbies'} title={t('profile.hobbies')} closeLabel={t('common.done')} onClose={closeList}>
        <ThemedText type="small" themeColor="textSecondary">
          {t('editProfile.hobbiesHint')}
        </ThemedText>
        <HobbyPicker mode="toggle" value={hobbies} onChange={setHobbies} />
      </Dialog>

      <Dialog
        visible={openList === 'city'}
        title={t('onboarding.city.title')}
        closeLabel={t('common.done')}
        onClose={closeList}>
        <ThemedText type="small" themeColor="textSecondary">
          {t('onboarding.city.body')}
        </ThemedText>
        {/* One city at a time, so picking one is enough and closes the dialog. */}
        <CityChips
          label={t('onboarding.city.title')}
          city={city}
          onChange={(value) => {
            setCity(value);
            setError(null);
            closeList();
          }}
        />
      </Dialog>
    </>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: Spacing.two,
  },
  photo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  photoActions: {
    flex: 1,
    alignItems: 'flex-start',
    gap: Spacing.one,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  about: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  actions: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  loading: {
    alignSelf: 'flex-start',
  },
});
