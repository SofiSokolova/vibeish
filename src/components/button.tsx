import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useEffects, useTheme } from '@/hooks/use-theme';

type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  title: string;
  /**
   * `primary` for the main action of a screen, `accent` for one in the neon gradient (such as
   * publishing a meetup), `secondary` for others, `link` for quiet text actions.
   */
  variant?: 'primary' | 'accent' | 'secondary' | 'link';
  /** Shows a spinner and ignores presses while an action is running. */
  loading?: boolean;
};

export function Button({ title, variant = 'primary', loading = false, disabled, ...props }: ButtonProps) {
  const theme = useTheme();
  const fx = useEffects();
  const inactive = Boolean(disabled) || loading;

  const background =
    variant === 'primary'
      ? theme.text
      : variant === 'secondary'
        ? theme.backgroundElement
        : 'transparent';
  const color =
    variant === 'primary'
      ? theme.background
      : variant === 'accent'
        ? fx.create.icon
        : variant === 'secondary'
          ? theme.text
          : theme.textSecondary;

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
        variant === 'accent' && { backgroundImage: fx.create.background },
        pressed && styles.pressed,
        Boolean(disabled) && !loading && styles.disabled,
      ]}
      {...props}>
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <ThemedText
          type={variant === 'link' ? 'small' : 'default'}
          style={[{ color }, variant === 'link' && styles.linkText, variant === 'accent' && styles.accentText]}>
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
  accentText: {
    fontWeight: 800,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
});
