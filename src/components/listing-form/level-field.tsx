import { useRef, useState, type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View, type ViewInstance } from 'react-native';

import { AnchoredPopover, type AnchorRect } from '@/components/anchored-popover';
import { Icon } from '@/components/icon';
import { SkillLevelDots } from '@/components/skill-level-dots';
import { ThemedText } from '@/components/themed-text';
import { ICONS } from '@/constants/icons';
import { SKILL_LEVELS, skillLevelInfo, type SkillLevel } from '@/constants/skill-levels';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Any level first, then the three levels. */
const OPTIONS: (SkillLevel | null)[] = [null, ...SKILL_LEVELS.map((level) => level.value)];

type LevelFieldProps = {
  /** Who the meetup is for; null when any level is welcome. */
  value: SkillLevel | null;
  onChange: (value: SkillLevel | null) => void;
};

/** Who the meetup is for: the level is itself the button, and the choice opens next to it. */
export function LevelField({ value, onChange }: LevelFieldProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const chip = useRef<ViewInstance>(null);
  const [anchor, setAnchor] = useState<AnchorRect | null>(null);

  const colorOf = (level: SkillLevel | null) => (level === null ? theme.textSecondary : theme[skillLevelInfo(level).color]);
  const nameOf = (level: SkillLevel | null) => t(`listingLevel.${level === null ? 'any' : skillLevelInfo(level).slug}`);
  const color = colorOf(value);

  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{t('create.level')}</ThemedText>
      <Pressable
        ref={chip as Ref<ViewInstance>}
        role="button"
        aria-label={t('create.levelLabel', { level: nameOf(value) })}
        aria-expanded={anchor !== null}
        onPress={() => chip.current?.measureInWindow((x, y, width, height) => setAnchor({ x, y, width, height }))}
        style={({ pressed }) => [
          styles.chip,
          { borderColor: color, backgroundColor: `${color}14` },
          pressed && styles.pressed,
        ]}>
        <SkillLevelDots level={value} color={color} size={9} />
        <ThemedText style={[styles.chipText, { color }]}>{nameOf(value)}</ThemedText>
        <Icon name={ICONS.chooseMore} color={color} size={16} />
      </Pressable>

      <AnchoredPopover visible={anchor !== null} anchor={anchor} onClose={() => setAnchor(null)}>
        <View role="radiogroup" aria-label={t('create.level')} style={styles.options}>
          {OPTIONS.map((option) => {
            const optionColor = colorOf(option);
            const chosen = option === value;
            return (
              <Pressable
                key={option ?? 'any'}
                role="radio"
                aria-checked={chosen}
                onPress={() => {
                  onChange(option);
                  setAnchor(null);
                }}
                style={({ pressed }) => [
                  styles.option,
                  { borderColor: chosen ? optionColor : theme.backgroundSelected },
                  pressed && styles.pressed,
                ]}>
                <SkillLevelDots level={option} color={optionColor} size={9} />
                <ThemedText style={[styles.optionText, { color: optionColor }]}>{nameOf(option)}</ThemedText>
              </Pressable>
            );
          })}
        </View>
      </AnchoredPopover>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  chip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 40,
    paddingLeft: 14,
    paddingRight: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 700,
  },
  options: {
    gap: Spacing.two,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.7,
  },
});
