import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** `radio` when only one chip in the group can be chosen, `checkbox` when several can. */
  role?: 'radio' | 'checkbox';
};

/** A choice in a wrapping row of options, such as a language or a city. */
export function Chip({ label, selected, onPress, role = 'radio' }: ChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      // aria-* rather than accessibilityState, which React Native for Web no longer reads.
      role={role}
      aria-checked={selected}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView
        type={selected ? 'backgroundSelected' : 'backgroundElement'}
        style={[styles.chip, { borderColor: selected ? theme.text : 'transparent' }]}>
        <ThemedText themeColor={selected ? 'text' : 'textSecondary'}>{label}</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

/** A chosen option shown on its own, without the other options, as in the profile editor. */
export function Tag({ label }: { label: string }) {
  return (
    <ThemedView type="backgroundElement" style={[styles.chip, styles.tag]}>
      <ThemedText>{label}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  tag: {
    borderColor: 'transparent',
  },
  chip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
