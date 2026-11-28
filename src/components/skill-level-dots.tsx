import { StyleSheet, View } from 'react-native';

import { SKILL_LEVELS, type SkillLevel } from '@/constants/skill-levels';

type SkillLevelDotsProps = {
  /** Null leaves every dot empty: a meetup open to any level. */
  level: SkillLevel | null;
  color: string;
  /** The width of one dot. */
  size?: number;
  /** Makes the filled dots glow, as in the night design. */
  glow?: boolean;
};

/** One dot per level, filled up to the given one, so the level reads without its color too. */
export function SkillLevelDots({ level, color, size = 7, glow = false }: SkillLevelDotsProps) {
  const large = size > 8;
  return (
    <View aria-hidden style={[styles.dots, { gap: large ? 4 : 3 }]}>
      {SKILL_LEVELS.map(({ value }) => {
        const filled = level !== null && value <= level;
        return (
          <View
            key={value}
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: large ? 1.5 : 1,
              borderColor: color,
              backgroundColor: filled ? color : 'transparent',
              boxShadow: filled && glow ? `0 0 8px ${color}` : undefined,
            }}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
