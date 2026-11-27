import type { CategorySlug } from '@/constants/categories';
import type { CitySlug } from '@/constants/cities';
import type { SkillLevel } from '@/constants/skill-levels';

/** A listing as a feed card shows it. */
export type FeedItem = {
  id: string;
  category: CategorySlug;
  /** The author's level in this hobby, or null when they give none. */
  level: SkillLevel | null;
  title: string;
  description: string;
  startsAt: Date;
  city: CitySlug;
  placeName: string;
  /** The largest group, counting the author. */
  groupMax: number;
  spotsLeft: number;
  costType: 'free' | 'split' | 'paid';
  /** The price in euros, or about what each person chips in when the cost is split. */
  costEur: number | null;
  author: { name: string; avatarPath: string | null };
};

/** Which way a card left the feed: right asks to join (vibe), left skips it (nah). */
export type SwipeDirection = 'left' | 'right';

/** The feed's quick date choices. */
export type DateFilter = 'today' | 'weekend';

function atMidnight(date: Date, addDays = 0): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + addDays);
}

/** Whether a listing starts on the chosen days, in the device's time zone. */
export function matchesDate(startsAt: Date, filter: DateFilter | null, now: Date): boolean {
  if (filter === null) return true;
  if (filter === 'today') return startsAt >= atMidnight(now) && startsAt < atMidnight(now, 1);
  // This weekend: the coming Saturday and Sunday, or the current ones at the weekend.
  const weekday = now.getDay();
  const saturday = atMidnight(now, weekday === 0 ? -1 : 6 - weekday);
  return startsAt >= saturday && startsAt < atMidnight(saturday, 2);
}

/** When a listing starts: the weekday and time within the coming week, the date and time after that. */
export function formatWhen(startsAt: Date, now: Date, locale: string): string {
  const withinWeek = startsAt < atMidnight(now, 7);
  const text = new Intl.DateTimeFormat(
    locale,
    withinWeek
      ? { weekday: 'short', hour: 'numeric', minute: '2-digit' }
      : { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' },
  ).format(startsAt);
  return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

/** A price in euros, with cents only when there are any. */
export function formatEuros(amount: number, locale: string): string {
  const digits = Number.isInteger(amount) ? 0 : 2;
  const options = {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  } as const;
  try {
    // "€" rather than "EUR" in every language.
    return new Intl.NumberFormat(locale, { ...options, currencyDisplay: 'narrowSymbol' }).format(amount);
  } catch {
    return new Intl.NumberFormat(locale, options).format(amount);
  }
}

/** The next time it is this weekday (0 is Sunday) and time. */
function nextTime(now: Date, weekday: number, hours: number, minutes: number): Date {
  const date = atMidnight(now, (weekday - now.getDay() + 7) % 7);
  date.setHours(hours, minutes);
  if (date <= now) date.setDate(date.getDate() + 7);
  return date;
}

/**
 * The listings from the design, which development builds show until the feed loads real
 * ones. They stand in for what people write themselves, so they are not translated.
 */
export function sampleListings(now: Date): FeedItem[] {
  return [
    {
      id: 'sample-table-tennis',
      category: 'table_tennis',
      level: 2,
      title: 'Теннис в субботу, нужен ещё один',
      description: 'Играем пару часов, ракетки есть.',
      startsAt: nextTime(now, 6, 18, 0),
      city: 'tallinn',
      placeName: 'Kadriorg',
      groupMax: 4,
      spotsLeft: 1,
      costType: 'split',
      costEur: 5,
      author: { name: 'Марта', avatarPath: null },
    },
    {
      id: 'sample-board-games',
      category: 'board_games',
      level: 1,
      title: 'Настолки и пицца в пятницу',
      description: 'Объясним правила, приходи с друзьями.',
      startsAt: nextTime(now, 5, 19, 30),
      city: 'tallinn',
      placeName: 'Telliskivi',
      groupMax: 6,
      spotsLeft: 2,
      costType: 'split',
      costEur: 10,
      author: { name: 'Артём', avatarPath: null },
    },
    {
      id: 'sample-running',
      category: 'running',
      level: 3,
      title: 'Пробежка вдоль моря, 8 км',
      description: 'Темп около 5:00 на километр, потом кофе.',
      startsAt: nextTime(now, 0, 9, 0),
      city: 'tallinn',
      placeName: 'Pirita',
      groupMax: 8,
      spotsLeft: 3,
      costType: 'free',
      costEur: null,
      author: { name: 'Лиис', avatarPath: null },
    },
  ];
}
