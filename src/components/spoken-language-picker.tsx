import { StyleSheet, View } from 'react-native';

import { Chip } from '@/components/chip';
import { MAX_SPOKEN_LANGUAGES, SPOKEN_LANGUAGES } from '@/constants/languages';
import { Spacing } from '@/constants/theme';

/** Every language someone may speak, as chips to switch on and off. */
export function SpokenLanguagePicker({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  function toggle(code: string) {
    if (value.includes(code)) onChange(value.filter((language) => language !== code));
    else if (value.length < MAX_SPOKEN_LANGUAGES) onChange([...value, code]);
  }

  return (
    <View style={styles.options}>
      {SPOKEN_LANGUAGES.map((language) => (
        <Chip
          key={language.code}
          role="checkbox"
          label={language.name}
          selected={value.includes(language.code)}
          onPress={() => toggle(language.code)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
