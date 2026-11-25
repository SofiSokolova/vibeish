/**
 * Hobby categories.
 *
 * `slug` is the permanent key: the database stores it (`categories.slug`) and the locale
 * files translate it (`category.<slug>` in src/i18n/locales). Never rename a slug;
 * change its translations instead.
 *
 * `group` is the default group size for a new listing, counting its author. `min` is
 * also how many people an interest beacon waits for before it suggests a meetup.
 *
 * `skillLevels: false` marks hobbies where a skill level says little, so people pick
 * them without one (see src/constants/skill-levels.ts).
 */
type CategoryDefinition = {
  slug: string;
  group: { min: number; max: number };
  skillLevels?: false;
};

export const CATEGORIES = [
  { slug: 'table_tennis', group: { min: 2, max: 4 } },
  { slug: 'badminton', group: { min: 2, max: 4 } },
  { slug: 'tennis', group: { min: 2, max: 4 } },
  { slug: 'board_games', group: { min: 3, max: 6 } },
  { slug: 'chess', group: { min: 2, max: 2 } },
  { slug: 'running', group: { min: 2, max: 8 } },
  { slug: 'hiking', group: { min: 2, max: 10 } },
  { slug: 'climbing', group: { min: 2, max: 4 } },
  { slug: 'football', group: { min: 6, max: 14 } },
  { slug: 'volleyball', group: { min: 6, max: 12 } },
  { slug: 'cycling', group: { min: 2, max: 8 } },
  // The languages in the profile say more than a level would.
  { slug: 'language_exchange', group: { min: 2, max: 6 }, skillLevels: false },
] as const satisfies readonly CategoryDefinition[];

export type Category = (typeof CATEGORIES)[number];
export type CategorySlug = Category['slug'];

export function hasSkillLevels(slug: CategorySlug): boolean {
  const category: CategoryDefinition | undefined = CATEGORIES.find((item) => item.slug === slug);
  return category?.skillLevels !== false;
}
