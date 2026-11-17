/**
 * Cities people can choose as their home city.
 *
 * `slug` is the permanent key: the database stores it (`cities.slug`, together with the
 * city's coordinates and time zone) and the locale files translate it (`city.<slug>` in
 * src/i18n/locales). Never rename a slug; change its translations instead.
 */
type CityDefinition = {
  slug: string;
  country: string;
};

export const CITIES = [
  { slug: 'tallinn', country: 'EE' },
  { slug: 'tartu', country: 'EE' },
  { slug: 'helsinki', country: 'FI' },
  { slug: 'riga', country: 'LV' },
  { slug: 'vilnius', country: 'LT' },
] as const satisfies readonly CityDefinition[];

export type City = (typeof CITIES)[number];
export type CitySlug = City['slug'];
