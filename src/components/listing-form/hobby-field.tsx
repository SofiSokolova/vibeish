import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/chip';
import { Dialog } from '@/components/dialog';
import { CheckRow, ChooseButton, EditButton, FieldError } from '@/components/form-controls';
import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { CATEGORIES, type CategorySlug } from '@/constants/categories';
import { HOBBY_IMAGES } from '@/constants/hobby-images';
import { ICONS } from '@/constants/icons';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const PICTURE_SIZE = 44;

type HobbyFieldProps = {
  value: CategorySlug | null;
  /** Whether the hobby is remembered for the next meetups. */
  remembered: boolean;
  onChange: (value: CategorySlug, remember: boolean) => void;
  error?: string | null;
};

/**
 * The meetup's hobby: a card with its picture and a pencil, or a «Choose» button at first.
 * The list opens in a dialog that can also remember the hobby for the next meetups.
 */
export function HobbyField({ value, remembered, onChange, error }: HobbyFieldProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(value);
  const [remember, setRemember] = useState(remembered);

  function openList() {
    setPicked(value);
    setRemember(remembered);
    setOpen(true);
  }

  function closeList() {
    setOpen(false);
    if (picked) onChange(picked, remember);
  }

  const picture = value ? HOBBY_IMAGES[value] : undefined;

  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{t('create.hobby')}</ThemedText>
      {value ? (
        <View style={[styles.card, { borderColor: theme.picked, backgroundColor: `${theme.picked}0D` }]}>
          {picture ? (
            <Image source={picture} style={styles.picture} contentFit="contain" />
          ) : (
            <View style={[styles.picture, styles.pictureFallback, { borderColor: theme.border }]}>
              <Icon name={ICONS.hobby} color={theme.picked} size={24} />
            </View>
          )}
          <ThemedText style={styles.name}>{t(`category.${value}`)}</ThemedText>
          <EditButton label={t('create.changeHobby')} onPress={openList} />
        </View>
      ) : (
        <ChooseButton label={t('create.chooseHobby')} onPress={openList} />
      )}
      <FieldError error={error} />

      <Dialog visible={open} title={t('create.hobby')} closeLabel={t('common.done')} onClose={closeList}>
        <View role="radiogroup" aria-label={t('create.hobby')} style={styles.options}>
          {CATEGORIES.map(({ slug }) => (
            <Chip key={slug} label={t(`category.${slug}`)} selected={picked === slug} onPress={() => setPicked(slug)} />
          ))}
        </View>
        <CheckRow label={t('create.remember')} checked={remember} onChange={setRemember} />
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: 10,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
    borderRadius: 20,
    borderWidth: 1,
  },
  picture: {
    width: PICTURE_SIZE,
    height: PICTURE_SIZE,
  },
  pictureFallback: {
    borderRadius: PICTURE_SIZE / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    flex: 1,
    fontSize: 17,
    lineHeight: 24,
    fontWeight: 700,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
