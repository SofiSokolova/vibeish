/**
 * Languages people can say they speak, stored in `profiles.languages` as ISO 639-1 codes
 * (at most ten). Each name is the language's own name for itself, so the list needs no
 * translation. The interface languages come first, in the language picker's order.
 */
export const SPOKEN_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'et', name: 'Eesti' },
  { code: 'ru', name: 'Русский' },
  { code: 'uk', name: 'Українська' },
  { code: 'fi', name: 'Suomi' },
  { code: 'lv', name: 'Latviešu' },
  { code: 'lt', name: 'Lietuvių' },
  { code: 'pl', name: 'Polski' },
  { code: 'de', name: 'Deutsch' },
  { code: 'sv', name: 'Svenska' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
] as const;

export const MAX_SPOKEN_LANGUAGES = 10;
