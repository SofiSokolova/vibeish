import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { ICONS } from '@/constants/icons';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { GROUP_LIMIT } from '@/lib/listing-form';

/** More seats than this show as a number after the last one. */
const SEATS_SHOWN = 10;
const SEAT_SIZE = 34;

type People = { alreadyGoing: number; groupMax: number };

type PeopleFieldProps = People & {
  onChange: (value: People) => void;
};

/**
 * How many people: those already going (the author and the friends they bring) and the whole
 * group, with a row of seats that shows the free ones.
 */
export function PeopleField({ alreadyGoing, groupMax, onChange }: PeopleFieldProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const free = groupMax - alreadyGoing;
  const seats = Array.from({ length: Math.min(groupMax, SEATS_SHOWN) }, (_, index) => index);

  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{t('create.people')}</ThemedText>
      <View style={styles.steppers}>
        <Stepper
          label={t('create.alreadyGoing')}
          value={alreadyGoing}
          min={1}
          max={groupMax - 1}
          onChange={(value) => onChange({ alreadyGoing: value, groupMax })}
        />
        <Stepper
          label={t('create.total')}
          value={groupMax}
          min={alreadyGoing + 1}
          max={GROUP_LIMIT}
          onChange={(value) => onChange({ alreadyGoing, groupMax: value })}
        />
      </View>
      <View
        role="img"
        aria-label={t('create.seats', { going: alreadyGoing, total: groupMax, free })}
        style={styles.seats}>
        {seats.map((index) => {
          const you = index === 0;
          const taken = index < alreadyGoing;
          const color = you ? theme.accent : theme.picked;
          return (
            <View
              key={index}
              style={[
                styles.seat,
                taken
                  ? { borderColor: color, backgroundColor: `${color}26` }
                  : { borderColor: theme.textSecondary, borderStyle: 'dashed' },
              ]}>
              {you ? (
                <ThemedText style={styles.you}>{t('create.you')}</ThemedText>
              ) : taken ? (
                <Icon name={ICONS.person} color={theme.picked} size={18} />
              ) : null}
            </View>
          );
        })}
        {groupMax > SEATS_SHOWN ? (
          <ThemedText type="smallBold" themeColor="textSecondary">
            {`+${groupMax - SEATS_SHOWN}`}
          </ThemedText>
        ) : null}
      </View>
    </View>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={[styles.stepper, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
      <View style={styles.stepperRow}>
        <StepButton
          icon={ICONS.minus}
          label={t('create.fewer', { label })}
          disabled={value <= min}
          onPress={() => onChange(value - 1)}
        />
        <ThemedText aria-live="polite" style={styles.count}>
          {value}
        </ThemedText>
        <StepButton
          icon={ICONS.create}
          label={t('create.more', { label })}
          disabled={value >= max}
          onPress={() => onChange(value + 1)}
        />
      </View>
    </View>
  );
}

function StepButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: IconName;
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      role="button"
      aria-label={label}
      aria-disabled={disabled}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.stepButton,
        { borderColor: theme.border },
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <Icon name={icon} color={theme.text} size={20} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  steppers: {
    flexDirection: 'row',
    gap: 10,
  },
  stepper: {
    flex: 1,
    gap: 6,
    paddingTop: 10,
    paddingBottom: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  count: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: 800,
  },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  seat: {
    width: SEAT_SIZE,
    height: SEAT_SIZE,
    borderRadius: SEAT_SIZE / 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  you: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 800,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
});
