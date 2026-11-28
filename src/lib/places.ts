import { CITIES, type CitySlug } from '@/constants/cities';
import type { ListingPlace } from '@/lib/listing-form';

/**
 * Photon: komoot's public search over OpenStreetMap data (https://photon.komoot.io). It needs
 * no key and is free to use within fair limits. Only the typed text and the city's area are
 * sent, nothing about the person.
 */
const PHOTON_URL = 'https://photon.komoot.io/api/';
/** How far around the city's centre the search looks, in degrees: about 25 km each way. */
const AREA = { lat: 0.25, lng: 0.45 };
const RESULTS = 8;
/** Shorter text finds too much to be useful. */
export const MIN_QUERY_LENGTH = 2;
/** Results too wide to meet at, such as a whole city. */
const TOO_WIDE = new Set(['city', 'county', 'state', 'country']);
/** listings.place_name holds at most this many characters. */
const NAME_LIMIT = 120;

type PhotonFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    type?: string;
    name?: string;
    street?: string;
    housenumber?: string;
    locality?: string;
    district?: string;
  };
};

/**
 * Places in and around the city that match what was typed, closest to its centre first.
 * Throws when the search cannot be reached.
 */
export async function searchPlaces(city: CitySlug, query: string, signal?: AbortSignal): Promise<ListingPlace[]> {
  const text = query.trim();
  if (text.length < MIN_QUERY_LENGTH) return [];
  const { center } = CITIES.find((item) => item.slug === city) ?? CITIES[0];
  const params = new URLSearchParams({
    q: text,
    lat: String(center.lat),
    lon: String(center.lng),
    limit: String(RESULTS),
    bbox: [center.lng - AREA.lng, center.lat - AREA.lat, center.lng + AREA.lng, center.lat + AREA.lat].join(','),
  });
  const response = await fetch(`${PHOTON_URL}?${params}`, { signal });
  if (!response.ok) throw new Error(`Place search answered ${response.status}`);
  const { features } = (await response.json()) as { features: PhotonFeature[] };

  const places: ListingPlace[] = [];
  const seen = new Set<string>();
  for (const feature of features) {
    const place = toPlace(feature, city);
    const key = place ? `${place.name}|${place.address}` : '';
    if (!place || seen.has(key)) continue;
    seen.add(key);
    places.push(place);
  }
  return places;
}

/** A search result as a place to meet: its name (or the street address) and where it is. */
function toPlace({ geometry, properties }: PhotonFeature, city: CitySlug): ListingPlace | null {
  if (properties.type && TOO_WIDE.has(properties.type)) return null;
  const street = [properties.street, properties.housenumber].filter(Boolean).join(' ');
  const name = properties.name ?? street;
  if (!name) return null;
  const area = properties.locality ?? properties.district;
  const address = [properties.name ? street : '', area].filter(Boolean).join(', ');
  const [lng, lat] = geometry.coordinates;
  return { name: name.slice(0, NAME_LIMIT), address, city, lat, lng };
}
