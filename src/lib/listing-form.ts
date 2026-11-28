import { CATEGORIES, hasSkillLevels, type CategorySlug } from '@/constants/categories';
import type { CitySlug } from '@/constants/cities';
import { MAX_SPOKEN_LANGUAGES, SPOKEN_LANGUAGES } from '@/constants/languages';
import type { SkillLevel } from '@/constants/skill-levels';
import type { Database } from '@/lib/database.types';
import type { CostType } from '@/lib/feed';

export const TITLE_MIN_LENGTH = 3;
export const TITLE_MAX_LENGTH = 80;
export const DESCRIPTION_MAX_LENGTH = 1000;
/** The largest group a meetup can have, counting the author (listings.group_max). */
export const GROUP_LIMIT = 50;
/** The step of the minutes in the time picker. */
export const MINUTE_STEP = 5;
/** The time a new meetup starts at until someone picks another one. */
const DEFAULT_TIME = '18:00';

/** A place picked for a meetup. */
export type ListingPlace = {
  /** What the place is called, such as a park or a club. */
  name: string;
  /** The street and district, which tell places with the same name apart. */
  address: string;
  city: CitySlug;
  lat: number;
  lng: number;
};

/** What the create form holds while someone fills it in. */
export type ListingDraft = {
  category: CategorySlug | null;
  /** Who the meetup is for; null when any level is welcome. */
  skillLevel: SkillLevel | null;
  title: string;
  description: string;
  /** The day as YYYY-MM-DD, or null until one is picked. */
  day: string | null;
  /** The time as HH:MM, or null when it is agreed in the chat. */
  time: string | null;
  place: ListingPlace | null;
  /** People already going, counting the author. */
  alreadyGoing: number;
  /** The whole group, counting the author. */
  groupMax: number;
  costType: CostType;
  /** The amount in euros, as typed. */
  costText: string;
  /** Null until someone picks them: the person's own languages stand in until then. */
  languages: string[] | null;
};

/** The form with its languages settled, as it is checked and published. */
export type ListingForm = Omit<ListingDraft, 'languages'> & { languages: string[] };

/** A new form with the remembered hobby and languages. */
export function newDraft(defaults: ListingDefaults): ListingDraft {
  const category = defaults.category ?? null;
  return {
    category,
    skillLevel: null,
    title: '',
    description: '',
    day: null,
    time: DEFAULT_TIME,
    place: null,
    alreadyGoing: 1,
    groupMax: category ? suggestedGroupMax(category) : 4,
    costType: 'free',
    costText: '',
    languages: defaults.languages ? [...defaults.languages] : null,
  };
}

/** The form with the person's own languages where none are picked yet. */
export function settleDraft(draft: ListingDraft, ownLanguages: readonly string[]): ListingForm {
  return { ...draft, languages: draft.languages ?? [...ownLanguages] };
}

/** The group size a hobby suggests for a new meetup, counting the author. */
export function suggestedGroupMax(category: CategorySlug): number {
  return CATEGORIES.find((item) => item.slug === category)?.group.max ?? 4;
}

/** A date as YYYY-MM-DD in the device's time zone. */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Midnight at the start of a YYYY-MM-DD day, in the device's time zone. */
export function dayStart(day: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
}

/** When the meetup starts. Without a time it is set for the end of its day, as in the database. */
export function draftStartsAt({ day, time }: Pick<ListingDraft, 'day' | 'time'>): Date | null {
  if (!day) return null;
  const start = dayStart(day);
  const [hours, minutes] = (time ?? '23:59').split(':').map(Number);
  start.setHours(hours, minutes);
  return start;
}

/** An amount in euros as people type it, with a dot or a comma; null unless it is above zero. */
export function parseEuros(text: string): number | null {
  const normalized = text.replace(/[\s€]/g, '').replace(',', '.');
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(normalized)) return null;
  const amount = Number(normalized);
  return amount > 0 ? amount : null;
}

/** What still keeps the form from being published, one entry per field. */
export type DraftProblem = 'hobby' | 'title' | 'when' | 'past' | 'place' | 'amount' | 'languages';

export function draftProblems(draft: ListingForm, now: Date): Set<DraftProblem> {
  const problems = new Set<DraftProblem>();
  if (!draft.category) problems.add('hobby');
  if (draft.title.trim().length < TITLE_MIN_LENGTH) problems.add('title');
  const startsAt = draftStartsAt(draft);
  if (!startsAt) problems.add('when');
  else if (startsAt <= now) problems.add('past');
  if (!draft.place) problems.add('place');
  if (draft.costType !== 'free' && parseEuros(draft.costText) === null) problems.add('amount');
  if (draft.languages.length === 0) problems.add('languages');
  return problems;
}

type CreateListingArgs = Database['public']['Functions']['create_listing']['Args'];

/** The arguments of create_listing() for a form without problems (see draftProblems). */
export function createListingArgs(draft: ListingForm): CreateListingArgs {
  const { category, day, place } = draft;
  if (!category || !day || !place) throw new Error('The meetup form is not complete');
  const args = {
    p_category: category,
    p_skill_level: hasSkillLevels(category) ? draft.skillLevel : null,
    p_title: draft.title.trim(),
    p_description: draft.description.trim(),
    p_day: day,
    p_time: draft.time,
    p_city: place.city,
    p_place_name: place.name,
    p_lat: place.lat,
    p_lng: place.lng,
    p_already_going: draft.alreadyGoing,
    p_group_max: draft.groupMax,
    p_cost_type: draft.costType,
    p_cost_eur: draft.costType === 'free' ? null : parseEuros(draft.costText),
    p_languages: draft.languages,
  };
  // The generated types make every argument non-null, but the function takes null for any
  // level, a time agreed in the chat and a free meetup.
  return args as unknown as CreateListingArgs;
}

const DEFAULTS_KEY = 'listingDefaults';

/** What someone asked the form to remember for their next meetups. */
export type ListingDefaults = {
  category?: CategorySlug;
  languages?: string[];
};

/** The remembered choices, kept on the device; anything the app no longer knows is left out. */
export function loadListingDefaults(): ListingDefaults {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(DEFAULTS_KEY) ?? '{}');
    if (typeof saved !== 'object' || saved === null) return {};
    const { category, languages } = saved as Record<string, unknown>;
    return {
      category: CATEGORIES.find((item) => item.slug === category)?.slug,
      languages: Array.isArray(languages)
        ? SPOKEN_LANGUAGES.map((language) => language.code)
            .filter((code) => languages.includes(code))
            .slice(0, MAX_SPOKEN_LANGUAGES)
        : undefined,
    };
  } catch {
    return {};
  }
}

/** Remembers a choice for the next meetups, or forgets it when the value is undefined. */
export function rememberListingDefault<K extends keyof ListingDefaults>(key: K, value: ListingDefaults[K]) {
  try {
    localStorage.setItem(DEFAULTS_KEY, JSON.stringify({ ...loadListingDefaults(), [key]: value }));
  } catch {
    // The form works without remembering: the person picks again next time.
  }
}
