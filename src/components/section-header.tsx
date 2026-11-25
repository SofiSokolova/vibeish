import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

type SectionHeaderProps = {
  title: string;
  /** A small action on the right, such as "Change". */
  action?: {
    label: string;
    /** A fuller name for screen readers, such as "Change languages". */
    accessibilityLabel?: string;
    onPress: () => void;
  };
};

/** A section's title, with an optional action at the other end of the line. */
export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <ThemedText type="smallBold" style={styles.title}>
        {title}
      </ThemedText>
      {action ? (
        <Pressable
          role="button"
          aria-label={action.accessibilityLabel ?? action.label}
          onPress={action.onPress}
          hitSlop={Spacing.two}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
          <ThemedText type="small" style={styles.actionText}>
            {action.label}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  title: {
    flex: 1,
  },
  action: {
    minHeight: 32,
    justifyContent: 'center',
  },
  actionText: {
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.7,
  },
});
