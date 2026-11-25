import type { ThemeColor } from '@/constants/theme';

/**
 * How well someone does a hobby, stored in `user_interests.skill_level` as 1–3 (null when
 * the person gives no level).
 *
 * `slug` names the level in the locale files (`skillLevel.<slug>.title` and `.hint`).
 * `color` is the level's theme color; it always comes with SkillLevelDots, so the level
 * also reads without telling colors apart.
 */
export const SKILL_LEVELS = [
  { value: 1, slug: 'beginner', color: 'levelBeginner' },
  { value: 2, slug: 'experienced', color: 'levelExperienced' },
  { value: 3, slug: 'pro', color: 'levelPro' },
] as const satisfies readonly { value: number; slug: string; color: ThemeColor }[];

export type SkillLevel = (typeof SKILL_LEVELS)[number]['value'];

export function skillLevelInfo(value: SkillLevel) {
  return SKILL_LEVELS.find((level) => level.value === value) ?? SKILL_LEVELS[0];
}
