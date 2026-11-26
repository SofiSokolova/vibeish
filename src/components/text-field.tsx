import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = TextInputProps & {
  label: string;
  /** Shown under the field while there is no error. */
  hint?: string;
  error?: string | null;
};

/** A labelled text input with an optional hint or error underneath. */
export function TextField({ label, hint, error, style, ...props }: TextFieldProps) {
  const theme = useTheme();
  const note = error ?? hint;

  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={note ?? undefined}
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          {
            color: theme.text,
            backgroundColor: theme.backgroundElement,
            borderColor: error ? theme.danger : theme.backgroundElement,
          },
          style,
        ]}
        {...props}
      />
      {note ? (
        <ThemedText
          type="small"
          themeColor={error ? 'danger' : 'textSecondary'}
          accessibilityLiveRegion={error ? 'polite' : 'none'}>
          {note}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  input: {
    minHeight: 48,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
    fontFamily: Fonts.sans,
    fontSize: 16,
  },
});
