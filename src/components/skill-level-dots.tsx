import { StyleSheet, View } from 'react-native';

import { SKILL_LEVELS, type SkillLevel } from '@/constants/skill-levels';

const DOT_SIZE = 7;

/** One dot per level, filled up to the given one, so the level reads without its color too. */
export function SkillLevelDots({ level, color }: { level: SkillLevel; color: string }) {
  return (
    <View aria-hidden style={styles.dots}>
      {SKILL_LEVELS.map(({ value }) => (
        <View
          key={value}
          style={[styles.dot, { borderColor: color, backgroundColor: value <= level ? color : 'transparent' }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 1,
  },
});
