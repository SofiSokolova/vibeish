import { CATEGORIES, type CategorySlug } from '@/constants/categories';
import { SKILL_LEVELS, type SkillLevel } from '@/constants/skill-levels';

/** The chosen hobbies, each with a skill level, or null when the person gives none. */
export type HobbyChoices = Partial<Record<CategorySlug, SkillLevel | null>>;

/** The hobbies as complete_onboarding() and update_profile() take them. */
export function toInterestRows(hobbies: HobbyChoices) {
  return Object.entries(hobbies).map(([category, level]) => ({ category, skill_level: level ?? null }));
}

/** The hobbies from user_interests rows. Hobbies and levels the app doesn't know are left out. */
export function fromInterestRows(rows: readonly { category: string; skill_level: number | null }[]): HobbyChoices {
  const hobbies: HobbyChoices = {};
  for (const row of rows) {
    const category = CATEGORIES.find((item) => item.slug === row.category);
    if (!category) continue;
    hobbies[category.slug] = SKILL_LEVELS.find((level) => level.value === row.skill_level)?.value ?? null;
  }
  return hobbies;
}
