import { useEffect, useImperativeHandle, useRef, type Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { CARD_RADIUS, FeedCard } from '@/components/feed-card';
import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { ICONS } from '@/constants/icons';
import { useEffects } from '@/hooks/use-theme';
import type { FeedItem, SwipeDirection } from '@/lib/feed';

/** How far a card has to be dragged, or how fast thrown, for letting go to send it away. */
const SWIPE_DISTANCE = 110;
const SWIPE_VELOCITY = 900;
const LEAVE_MS = 220;

type SwipeHandle = { swipe: (direction: SwipeDirection) => void };

type SwipeDeckProps = {
  /** The cards still to see; the first one is on top. */
  items: FeedItem[];
  now: Date;
  /** Shows under the card that a request to join went out. */
  sent: boolean;
  onSwiped: (item: FeedItem, direction: SwipeDirection) => void;
};

/**
 * The feed's cards: the first one lies on top of the next and goes right to ask to join
 * (vibe) or left to skip (nah). It can be dragged or sent with the buttons below, which
 * screen readers use too.
 */
export function SwipeDeck({ items, now, sent, onSwiped }: SwipeDeckProps) {
  const { t } = useTranslation();
  const fx = useEffects();
  const topCard = useRef<SwipeHandle>(null);
  // How far the top card is dragged: the card underneath and the buttons follow it.
  const drag = useSharedValue(0);
  const [top, next] = items;

  const nextStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: '6deg' },
      { scale: interpolate(Math.abs(drag.get()), [0, SWIPE_DISTANCE], [0.94, 0.97], Extrapolation.CLAMP) },
    ],
  }));

  if (!top) return null;

  return (
    <View style={styles.deck}>
      <View style={styles.upper}>
        <View style={styles.stack}>
          {next ? (
            <Animated.View
              aria-hidden
              style={[
                styles.next,
                {
                  backgroundColor: fx.card.next.background,
                  borderColor: fx.card.next.border,
                  opacity: fx.card.next.opacity,
                },
                nextStyle,
              ]}
            />
          ) : null}
          <SwipeCard
            key={top.id}
            ref={topCard}
            item={top}
            now={now}
            drag={drag}
            onSwiped={(direction) => onSwiped(top, direction)}
          />
        </View>
        <SentStatus visible={sent} />
      </View>

      <View style={styles.actions}>
        <ActionButton
          direction="left"
          drag={drag}
          icon={ICONS.nah}
          label={t('feed.nah')}
          accessibilityLabel={t('feed.nahLabel')}
          surface={{ backgroundColor: fx.nah.background, borderColor: fx.nah.border, boxShadow: fx.nah.shadow }}
          iconColor={fx.nah.icon}
          labelColor={fx.nah.label}
          onPress={() => topCard.current?.swipe('left')}
        />
        <ActionButton
          direction="right"
          drag={drag}
          icon={ICONS.vibe}
          label={t('feed.vibe')}
          accessibilityLabel={t('feed.vibeLabel')}
          surface={{ backgroundImage: fx.vibe.background, borderColor: fx.vibe.border, boxShadow: fx.vibe.shadow }}
          iconColor={fx.vibe.icon}
          labelColor={fx.vibe.label}
          onPress={() => topCard.current?.swipe('right')}
        />
      </View>
    </View>
  );
}

type SwipeCardProps = {
  ref: Ref<SwipeHandle>;
  item: FeedItem;
  now: Date;
  drag: SharedValue<number>;
  onSwiped: (direction: SwipeDirection) => void;
};

/** The top card. It grows into place from the card underneath and leaves off the screen. */
function SwipeCard({ ref, item, now, drag, onSwiped }: SwipeCardProps) {
  const { width } = useWindowDimensions();
  const x = useSharedValue(0);
  const appear = useSharedValue(0);
  const leaving = useSharedValue(false);
  const away = width + 200;

  useEffect(() => {
    appear.set(withTiming(1, { duration: 200 }));
  }, [appear]);

  function leave(direction: SwipeDirection) {
    'worklet';
    leaving.set(true);
    drag.set(withTiming(0, { duration: LEAVE_MS }));
    x.set(
      withTiming(direction === 'right' ? away : -away, { duration: LEAVE_MS }, (finished) => {
        if (finished) scheduleOnRN(onSwiped, direction);
      }),
    );
  }

  useImperativeHandle(ref, () => ({
    swipe: (direction) => {
      if (!leaving.get()) leave(direction);
    },
  }));

  const pan = usePanGesture({
    activeOffsetX: [-10, 10],
    onUpdate: (event) => {
      if (leaving.get()) return;
      x.set(event.translationX);
      drag.set(event.translationX);
    },
    onDeactivate: (event) => {
      if (leaving.get()) return;
      const { translationX, velocityX } = event;
      const thrown = Math.abs(velocityX) > SWIPE_VELOCITY && Math.sign(velocityX) === Math.sign(translationX);
      if (Math.abs(translationX) > SWIPE_DISTANCE || thrown) {
        leave(translationX > 0 ? 'right' : 'left');
      } else {
        x.set(withSpring(0));
        drag.set(withSpring(0));
      }
    },
  });

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(appear.get(), [0, 1], [0.6, 1]),
    transform: [
      { perspective: 900 },
      { translateX: x.get() },
      { rotateZ: `${interpolate(x.get(), [-width, 0, width], [-12, 0, 12], Extrapolation.CLAMP)}deg` },
      { rotateX: '4deg' },
      { scale: interpolate(appear.get(), [0, 1], [0.94, 1]) },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, style]}>
        <FeedCard item={item} now={now} />
      </Animated.View>
    </GestureDetector>
  );
}

type ActionButtonProps = {
  /** The way this button sends the card; it grows while the card is dragged that way. */
  direction: SwipeDirection;
  drag: SharedValue<number>;
  icon: IconName;
  label: string;
  accessibilityLabel: string;
  surface: ViewStyle;
  iconColor: string;
  labelColor: string;
  onPress: () => void;
};

function ActionButton({
  direction,
  drag,
  icon,
  label,
  accessibilityLabel,
  surface,
  iconColor,
  labelColor,
  onPress,
}: ActionButtonProps) {
  const style = useAnimatedStyle(() => {
    const toward = direction === 'right' ? drag.get() : -drag.get();
    return { transform: [{ scale: interpolate(toward, [0, SWIPE_DISTANCE], [1, 1.12], Extrapolation.CLAMP) }] };
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
      <Animated.View style={[styles.circle, surface, style]}>
        <Icon name={icon} color={iconColor} size={32} />
      </Animated.View>
      <ThemedText style={[styles.actionLabel, { color: labelColor }]}>{label}</ThemedText>
    </Pressable>
  );
}

/** Says that the request to join went out; it stays until the next card leaves. */
export function SentStatus({ visible }: { visible: boolean }) {
  const { t } = useTranslation();
  const fx = useEffects();
  return (
    <View role="status" aria-live="polite" style={styles.status}>
      {visible ? (
        <View style={[styles.sentPill, { backgroundColor: fx.sent.background }]}>
          <ThemedText
            style={[
              styles.sentText,
              { color: fx.sent.text },
              fx.sent.glow ? { textShadowColor: fx.sent.glow, textShadowRadius: 12, textShadowOffset: { width: 0, height: 0 } } : null,
            ]}>
            {t('feed.sent')}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  deck: {
    flex: 1,
  },
  upper: {
    flex: 1,
  },
  stack: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    maxHeight: 468,
    alignSelf: 'center',
    paddingTop: 8,
  },
  next: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    bottom: 18,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
  },
  card: {
    flex: 1,
  },
  status: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
  },
  sentPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  sentText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: 800,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 48,
    paddingTop: 6,
    paddingBottom: 10,
  },
  action: {
    alignItems: 'center',
    gap: 6,
  },
  circle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: 800,
    letterSpacing: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
