import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextFieldProps = TextInputProps & {
  label: string;
  /** Shown under the field while there is no error. */
  hint?: string;
  error?: string | null;
  /** Shown at the end of the label's line, such as how many characters are used. */
  counter?: string;
};

/** A labelled text input with an optional hint or error underneath. */
export function TextField({ label, hint, error, counter, style, ...props }: TextFieldProps) {
  const theme = useTheme();
  const note = error ?? hint;

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <ThemedText type="smallBold" style={styles.label}>
          {label}
        </ThemedText>
        {counter ? (
          <ThemedText type="small" themeColor="textSecondary" aria-hidden>
            {counter}
          </ThemedText>
        ) : null}
      </View>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={note ?? undefined}
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.input,
          props.multiline && styles.multiline,
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
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.three,
  },
  label: {
    flex: 1,
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
  multiline: {
    minHeight: 104,
    paddingVertical: Spacing.three,
    textAlignVertical: 'top',
  },
});
