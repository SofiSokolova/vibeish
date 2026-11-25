import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  /** `primary` for the main action of a screen, `secondary` for others, `link` for quiet text actions. */
  variant?: 'primary' | 'secondary' | 'link';
  /** Shows a spinner and ignores presses while an action is running. */
  loading?: boolean;
};

export function Button({ title, variant = 'primary', loading = false, disabled, ...props }: ButtonProps) {
  const theme = useTheme();
  const inactive = Boolean(disabled) || loading;

  const background =
    variant === 'primary' ? theme.text : variant === 'secondary' ? theme.backgroundElement : 'transparent';
  const color = variant === 'primary' ? theme.background : variant === 'secondary' ? theme.text : theme.textSecondary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      aria-disabled={inactive}
      aria-busy={loading}
      disabled={inactive}
      style={({ pressed }) => [
        variant === 'link' ? styles.link : styles.button,
        { backgroundColor: background },
        pressed && styles.pressed,
        Boolean(disabled) && !loading && styles.disabled,
      ]}
      {...props}>
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <ThemedText
          type={variant === 'link' ? 'small' : 'default'}
          style={[{ color }, variant === 'link' && styles.linkText]}>
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  link: {
    minHeight: 40,
    paddingVertical: Spacing.two,
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
  linkText: {
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
});
