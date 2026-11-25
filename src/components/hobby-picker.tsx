import { useRef, useState, type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, useWindowDimensions, View, type ViewInstance } from 'react-native';

import { AnchoredPopover, type AnchorRect } from '@/components/anchored-popover';
import { Button } from '@/components/button';
import { SkillLevelDots } from '@/components/skill-level-dots';
import { ThemedText } from '@/components/themed-text';
import { CATEGORIES, hasSkillLevels, type CategorySlug } from '@/constants/categories';
import { SKILL_LEVELS, skillLevelInfo, type SkillLevel } from '@/constants/skill-levels';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** The chosen hobbies, each with a skill level, or null when the person gives none. */
export type HobbyChoices = Partial<Record<CategorySlug, SkillLevel | null>>;

type OpenCard = {
  slug: CategorySlug;
  anchor: AnchorRect;
  /** The screen size when the card opened. */
  screen: { width: number; height: number };
};

/**
 * Every hobby as a chip. A press picks the hobby and opens a card over the screen to choose
 * a level; a hobby with a level takes on the level's color and dots. Hobbies without levels,
 * like language exchange, are simply switched on and off.
 */
export function HobbyPicker({ value, onChange }: { value: HobbyChoices; onChange: (value: HobbyChoices) => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const screen = useWindowDimensions();
  const chips = useRef(new Map<CategorySlug, ViewInstance>());
  const [card, setCard] = useState<OpenCard | null>(null);
  const [cardVisible, setCardVisible] = useState(false);
  // After a resize or a rotation the hobby is somewhere else, so the card would point at the wrong place.
  const cardOpen =
    cardVisible && card !== null && card.screen.width === screen.width && card.screen.height === screen.height;

  function setLevel(slug: CategorySlug, level: SkillLevel | null) {
    onChange({ ...value, [slug]: level });
  }

  function removeHobby(slug: CategorySlug) {
    const next = { ...value };
    delete next[slug];
    onChange(next);
  }

  function pressHobby(slug: CategorySlug) {
    if (!hasSkillLevels(slug)) {
      if (slug in value) removeHobby(slug);
      else setLevel(slug, null);
      return;
    }
    if (!(slug in value)) setLevel(slug, null);
    const size = { width: screen.width, height: screen.height };
    // A newly picked hobby gets a check mark and grows, which can move it to the next row,
    // so it is measured on the next frame, after that change is on screen.
    requestAnimationFrame(() => {
      chips.current.get(slug)?.measureInWindow((x, y, width, height) => {
        setCard({ slug, anchor: { x, y, width, height }, screen: size });
        setCardVisible(true);
      });
    });
  }

  return (
    <View style={styles.picker}>
      <View style={styles.chips}>
        {CATEGORIES.map(({ slug }) => (
          <HobbyChip
            key={slug}
            ref={(node) => {
              if (node) chips.current.set(slug, node);
              return () => {
                chips.current.delete(slug);
              };
            }}
            label={t(`category.${slug}`)}
            picked={slug in value}
            level={value[slug] ?? null}
            opensLevels={hasSkillLevels(slug)}
            expanded={cardOpen && card.slug === slug}
            onPress={() => pressHobby(slug)}
          />
        ))}
      </View>

      {/* What the colors mean. Screen readers hear the level in each hobby's name instead. */}
      <View aria-hidden style={styles.legend}>
        {SKILL_LEVELS.map((level) => (
          <View key={level.value} style={styles.legendItem}>
            <SkillLevelDots level={level.value} color={theme[level.color]} />
            <ThemedText type="small" style={{ color: theme[level.color] }}>
              {t(`skillLevel.${level.slug}.title`)}
            </ThemedText>
          </View>
        ))}
      </View>

      <AnchoredPopover visible={cardOpen} anchor={card?.anchor ?? null} onClose={() => setCardVisible(false)}>
        {card ? (
          <LevelChoice
            slug={card.slug}
            level={value[card.slug] ?? null}
            onChoose={(level) => {
              setLevel(card.slug, level);
              setCardVisible(false);
            }}
            onRemove={() => {
              removeHobby(card.slug);
              setCardVisible(false);
            }}
          />
        ) : null}
      </AnchoredPopover>
    </View>
  );
}

type HobbyChipProps = {
  ref: Ref<ViewInstance>;
  label: string;
  picked: boolean;
  level: SkillLevel | null;
  /** Whether a press opens the level choice; otherwise it switches the hobby on and off. */
  opensLevels: boolean;
  expanded: boolean;
  onPress: () => void;
};

function HobbyChip({ ref, label, picked, level, opensLevels, expanded, onPress }: HobbyChipProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const info = level === null ? null : skillLevelInfo(level);
  const levelColor = info ? theme[info.color] : null;
  const textColor = levelColor ?? (picked ? theme.text : theme.textSecondary);
  const levelName = info ? t(`skillLevel.${info.slug}.title`) : t('hobbies.noLevel');

  return (
    <Pressable
      ref={ref}
      role={opensLevels ? 'button' : 'checkbox'}
      aria-checked={opensLevels ? undefined : picked}
      aria-expanded={opensLevels ? expanded : undefined}
      aria-label={opensLevels && picked ? t('hobbies.withLevel', { hobby: label, level: levelName }) : label}
      accessibilityHint={opensLevels ? t('hobbies.opensLevels') : undefined}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          // A hobby with a level is outlined in the level's color; one without is filled like other chosen chips.
          backgroundColor: levelColor ? 'transparent' : picked ? theme.backgroundSelected : theme.backgroundElement,
          borderColor: levelColor ?? (picked ? theme.text : 'transparent'),
        },
        pressed && styles.pressed,
      ]}>
      {picked && !info ? <ThemedText style={{ color: textColor }}>✓</ThemedText> : null}
      <ThemedText style={{ color: textColor }}>{label}</ThemedText>
      {info && levelColor ? <SkillLevelDots level={info.value} color={levelColor} /> : null}
    </Pressable>
  );
}

type LevelChoiceProps = {
  slug: CategorySlug;
  level: SkillLevel | null;
  onChoose: (level: SkillLevel | null) => void;
  onRemove: () => void;
};

/** The card's content: the levels with a short hint each, then "no level" and "remove". */
function LevelChoice({ slug, level, onChoose, onRemove }: LevelChoiceProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={styles.choice}>
      <View>
        <ThemedText type="smallBold">{t(`category.${slug}`)}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('hobbies.levelQuestion')}
        </ThemedText>
      </View>
      <View role="radiogroup" aria-label={t('hobbies.levelQuestion')} style={styles.options}>
        {SKILL_LEVELS.map((option) => {
          const color = theme[option.color];
          const chosen = option.value === level;
          return (
            <Pressable
              key={option.value}
              role="radio"
              aria-checked={chosen}
              onPress={() => onChoose(option.value)}
              style={({ pressed }) => [
                styles.option,
                { borderColor: chosen ? color : theme.backgroundSelected },
                pressed && styles.pressed,
              ]}>
              <SkillLevelDots level={option.value} color={color} />
              <View style={styles.optionText}>
                <ThemedText style={{ color }}>{t(`skillLevel.${option.slug}.title`)}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {t(`skillLevel.${option.slug}.hint`)}
                </ThemedText>
              </View>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.choiceActions}>
        <Button variant="link" title={t('hobbies.noLevel')} onPress={() => onChoose(null)} />
        <Button variant="link" title={t('hobbies.remove')} onPress={onRemove} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  picker: {
    gap: Spacing.three,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: Spacing.three,
    rowGap: Spacing.one,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  choice: {
    gap: Spacing.two,
  },
  options: {
    gap: Spacing.two,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  optionText: {
    flex: 1,
  },
  choiceActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
