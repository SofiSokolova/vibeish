/**
 * Cities people can choose as their home city.
 *
 * `slug` is the permanent key: the database stores it (`cities.slug`, together with the
 * city's coordinates and time zone) and the locale files translate it (`city.<slug>` in
 * src/i18n/locales). Never rename a slug; change its translations instead.
 *
 * `center` is the same point as `cities.lat` and `cities.lng`; place search looks around it.
 */
type CityDefinition = {
  slug: string;
  country: string;
  center: { lat: number; lng: number };
};

export const CITIES = [
  { slug: 'tallinn', country: 'EE', center: { lat: 59.437, lng: 24.7536 } },
  { slug: 'tartu', country: 'EE', center: { lat: 58.378, lng: 26.729 } },
  { slug: 'helsinki', country: 'FI', center: { lat: 60.1699, lng: 24.9384 } },
  { slug: 'riga', country: 'LV', center: { lat: 56.9496, lng: 24.1052 } },
  { slug: 'vilnius', country: 'LT', center: { lat: 54.6872, lng: 25.2797 } },
] as const satisfies readonly CityDefinition[];

export type City = (typeof CITIES)[number];
export type CitySlug = City['slug'];
