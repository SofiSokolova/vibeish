import { Link, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { ICONS } from '@/constants/icons';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** The feed's bottom bar: meetups, a new plan and the profile, each opening over the feed. */
export function FeedBottomBar() {
  const { t } = useTranslation();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      role="navigation"
      style={[styles.bar, { borderTopColor: theme.border, paddingBottom: insets.bottom + Spacing.two }]}>
      <BarLink href="/meetups" icon={ICONS.meetups} label={t('tabs.meetups')} />
      <Link href="/create" asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('tabs.create')}
          style={({ pressed }) => [styles.create, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
          <Icon name={ICONS.create} color={theme.onAccent} />
        </Pressable>
      </Link>
      <BarLink href="/profile" icon={ICONS.profile} label={t('tabs.profile')} />
    </View>
  );
}

function BarLink({ href, icon, label }: { href: Href; icon: IconName; label: string }) {
  const theme = useTheme();
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="link" style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
        <Icon name={icon} color={theme.textSecondary} />
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  item: {
    minWidth: 72,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.half,
  },
  create: {
    width: 56,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
