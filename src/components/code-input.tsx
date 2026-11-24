import { Fragment, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CodeInputProps = {
  label: string;
  /** How many digits the code has. */
  length: number;
  value: string;
  onChangeText: (code: string) => void;
  /** Called with the full code as soon as the last digit is in. */
  onComplete?: (code: string) => void;
  error?: string | null;
  editable?: boolean;
  autoFocus?: boolean;
};

/**
 * A one-time code shown as one box per digit. Underneath is a single invisible text
 * field, so typing, deleting, pasting and the system's code autofill all work as usual,
 * and screen readers meet one labelled field instead of many.
 */
export function CodeInput({
  label,
  length,
  value,
  onChangeText,
  onComplete,
  error,
  editable = true,
  autoFocus = false,
}: CodeInputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(autoFocus);
  // Long codes read more easily in two halves, like 1234 5678.
  const groupSize = length > 6 && length % 2 === 0 ? length / 2 : length;
  const activeIndex = Math.min(value.length, length - 1);

  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <View>
        <View aria-hidden style={styles.cells}>
          {Array.from({ length }, (_, index) => (
            <Fragment key={index}>
              {index > 0 && index % groupSize === 0 ? (
                <View style={[styles.separator, { backgroundColor: theme.textSecondary }]} />
              ) : null}
              <View
                style={[
                  styles.cell,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: error
                      ? theme.danger
                      : focused && index === activeIndex
                        ? theme.text
                        : theme.backgroundElement,
                  },
                ]}>
                <ThemedText style={styles.digit}>{value[index] ?? ''}</ThemedText>
              </View>
            </Fragment>
          ))}
        </View>
        <TextInput
          value={value}
          onChangeText={(text) => {
            const code = text.replace(/\D/g, '').slice(0, length);
            onChangeText(code);
            if (code.length === length && code !== value) onComplete?.(code);
          }}
          // The cursor always stays at the end, so a tap on any box never puts digits in the middle.
          selection={{ start: value.length, end: value.length }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={editable}
          autoFocus={autoFocus}
          accessibilityLabel={label}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          inputMode="numeric"
          keyboardType="number-pad"
          caretHidden
          style={styles.input}
        />
      </View>
      {error ? (
        <ThemedText type="small" themeColor="danger" accessibilityLiveRegion="polite">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: Spacing.two,
  },
  cells: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  // Width follows the screen, and the height follows the width, so the boxes keep their shape on narrow phones.
  cell: {
    flex: 1,
    maxWidth: 52,
    aspectRatio: 0.8,
    maxHeight: 60,
    borderRadius: Spacing.two,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: 600,
  },
  separator: {
    width: Spacing.two,
    height: 2,
    borderRadius: 1,
    marginHorizontal: Spacing.one,
  },
  // Covers the boxes, so a tap anywhere on them focuses the field, but stays invisible.
  input: {
    ...StyleSheet.absoluteFill,
    opacity: 0,
  },
});
