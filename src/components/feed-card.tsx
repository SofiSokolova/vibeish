import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Icon, type IconName } from '@/components/icon';
import { SkillLevelDots } from '@/components/skill-level-dots';
import { ThemedText } from '@/components/themed-text';
import { HOBBY_IMAGES } from '@/constants/hobby-images';
import { ICONS } from '@/constants/icons';
import { skillLevelInfo } from '@/constants/skill-levels';
import { Spacing } from '@/constants/theme';
import { useEffects, useTheme } from '@/hooks/use-theme';
import { formatDay, formatEuros, formatWhen, type FeedItem } from '@/lib/feed';

export const CARD_RADIUS = 26;
const PICTURE_SIZE = 56;

/**
 * A listing in the feed, as a «hobby profile»: the hobby and who it is for on top, then what,
 * when, where, how many people and what it costs, the author's note and the author with their
 * own level.
 */
export function FeedCard({ item, now }: { item: FeedItem; now: Date }) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const fx = useEffects();
  const locale = i18n.language;
  const level = item.forLevel === null ? null : skillLevelInfo(item.forLevel);
  // The hobby is written in the level's colour, which always comes with the dots; a meetup
  // for any level has empty grey dots.
  const levelColor = level ? theme[level.color] : theme.textSecondary;
  const hobbyColor = level ? theme[level.color] : fx.card.icon;
  const authorLevel = item.author.level === null ? null : skillLevelInfo(item.author.level);
  const picture = HOBBY_IMAGES[item.category];
  const when = item.timeTbd
    ? t('feed.dayTimeTbd', { day: formatDay(item.startsAt, locale) })
    : formatWhen(item.startsAt, now, locale);

  const price =
    item.costType === 'free' || item.costEur === null
      ? t('feed.free')
      : item.costType === 'split'
        ? t('feed.priceAbout', { price: formatEuros(item.costEur, locale) })
        : formatEuros(item.costEur, locale);

  return (
    <View
      style={[styles.frame, { backgroundImage: fx.card.border, padding: fx.card.borderWidth, boxShadow: fx.card.shadow }]}>
      <View
        style={[
          styles.card,
          { backgroundColor: fx.card.background, borderRadius: CARD_RADIUS - fx.card.borderWidth },
        ]}>
        <View style={[styles.header, { backgroundImage: fx.card.header }]}>
          <View aria-hidden style={[styles.picture, { filter: fx.card.iconShadow }]}>
            {picture ? (
              <Image source={picture} style={styles.picture} contentFit="contain" />
            ) : (
              <View style={[styles.pictureFallback, { backgroundColor: fx.glass, borderColor: fx.glassBorder }]}>
                <Icon name={ICONS.hobby} color={fx.card.icon} size={30} />
              </View>
            )}
          </View>
          <View style={styles.hobby}>
            <ThemedText style={[styles.category, { color: hobbyColor }]}>{t(`category.${item.category}`)}</ThemedText>
            <View style={styles.level}>
              <SkillLevelDots level={level?.value ?? null} color={levelColor} size={9} glow={fx.dotGlow} />
              <ThemedText style={[styles.levelName, { color: levelColor }]}>
                {t(`listingLevel.${level?.slug ?? 'any'}`)}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <ThemedText role="heading" numberOfLines={2} style={styles.title}>
            {item.title}
          </ThemedText>
          <View role="list" style={styles.facts}>
            <Fact icon={ICONS.time} text={when} />
            <Fact icon={ICONS.place} text={`${item.placeName}, ${t(`city.${item.city}`)}`} />
            <Fact
              icon={ICONS.people}
              text={t('feed.spots', {
                taken: item.groupMax - item.spotsLeft,
                total: item.groupMax,
                left: item.spotsLeft,
              })}
            />
            <Fact icon={ICONS.price} text={price} />
          </View>
          {item.description ? (
            <ThemedText numberOfLines={3} style={styles.note}>
              {t('feed.quote', { text: item.description })}
            </ThemedText>
          ) : null}
          <View style={styles.footer}>
            <View style={styles.author}>
              <Avatar path={item.author.avatarPath} name={item.author.name} size={38} tint={fx.author} />
              <View style={styles.authorText}>
                <ThemedText numberOfLines={1} style={styles.authorName}>
                  {item.author.name}
                </ThemedText>
                {authorLevel ? (
                  <View style={styles.level}>
                    <SkillLevelDots level={authorLevel.value} color={theme[authorLevel.color]} />
                    <ThemedText numberOfLines={1} style={[styles.authorLevel, { color: theme[authorLevel.color] }]}>
                      {t(`skillLevel.${authorLevel.slug}.title`)}
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            </View>
            {/* The listing's own screen comes in a later stage. */}
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.details,
                { backgroundColor: fx.glass, borderColor: fx.glassBorder, boxShadow: fx.glassShadow },
                pressed && styles.pressed,
              ]}>
              <ThemedText style={styles.detailsLabel}>{t('feed.details')}</ThemedText>
              <Icon name={ICONS.more} color={theme.text} size={16} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

function Fact({ icon, text }: { icon: IconName; text: string }) {
  const fx = useEffects();
  return (
    <View role="listitem" style={styles.fact}>
      <Icon name={icon} color={fx.card.icon} size={18} />
      <ThemedText numberOfLines={1} style={[styles.factText, { color: fx.card.meta }]}>
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    borderRadius: CARD_RADIUS,
  },
  card: {
    flex: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  picture: {
    width: PICTURE_SIZE,
    height: PICTURE_SIZE,
  },
  pictureFallback: {
    width: PICTURE_SIZE,
    height: PICTURE_SIZE,
    borderRadius: PICTURE_SIZE / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hobby: {
    flexShrink: 1,
    gap: Spacing.two,
  },
  category: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 800,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  level: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  levelName: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 700,
  },
  body: {
    flex: 1,
    gap: 14,
    paddingTop: 14,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  title: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: 800,
  },
  facts: {
    gap: Spacing.two,
  },
  fact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  factText: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 20,
  },
  note: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: 400,
  },
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  author: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  authorText: {
    flexShrink: 1,
    gap: 2,
  },
  authorName: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 700,
  },
  authorLevel: {
    flexShrink: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: 700,
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    minHeight: 36,
    paddingLeft: 14,
    paddingRight: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  detailsLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: 700,
  },
  pressed: {
    opacity: 0.7,
  },
});
