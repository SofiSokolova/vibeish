import { Link, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { ICONS } from '@/constants/icons';
import { Spacing } from '@/constants/theme';
import { useEffects, useTheme } from '@/hooks/use-theme';

/** The feed's bottom bar: meetups, a new plan and the profile, each opening over the feed. */
export function FeedBottomBar() {
  const { t } = useTranslation();
  const fx = useEffects();
  const insets = useSafeAreaInsets();

  return (
    <View
      role="navigation"
      style={[
        styles.bar,
        {
          backgroundColor: fx.bar.background,
          borderTopColor: fx.bar.border,
          paddingBottom: insets.bottom + Spacing.two,
        },
      ]}>
      <BarLink href="/meetups" icon={ICONS.meetups} label={t('tabs.meetups')} />
      {/* A link's child takes one flat style object: it drops style functions and rejects arrays. */}
      <Link href="/create" asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('tabs.create')}
          style={StyleSheet.flatten([styles.create, { backgroundImage: fx.create.background }])}>
          <Icon name={ICONS.create} color={fx.create.icon} size={22} />
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
      <Pressable accessibilityRole="link" style={styles.item}>
        <Icon name={icon} color={theme.textSecondary} />
        <ThemedText themeColor="textSecondary" style={styles.label}>
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
    paddingTop: 6,
    paddingHorizontal: 28,
    borderTopWidth: 1,
  },
  item: {
    minWidth: 64,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: 700,
  },
  create: {
    width: 52,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
