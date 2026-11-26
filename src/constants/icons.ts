import type { IconName } from '@/components/icon';

/** Icons used across the app: SF Symbols on iOS, Material Symbols on Android and web. */
export const ICONS = {
  back: { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  notifications: { ios: 'bell', android: 'notifications', web: 'notifications' },
  meetups: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  create: { ios: 'plus', android: 'add', web: 'add' },
  profile: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
  // The feed's filters and cards.
  filters: { ios: 'slider.horizontal.3', android: 'tune', web: 'tune' },
  chooseMore: { ios: 'chevron.down', android: 'keyboard_arrow_down', web: 'keyboard_arrow_down' },
  more: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  time: { ios: 'clock', android: 'schedule', web: 'schedule' },
  place: { ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' },
  people: { ios: 'person.2', android: 'group', web: 'group' },
  price: { ios: 'tag', android: 'sell', web: 'sell' },
  /** A hobby that has no picture of its own yet. */
  hobby: { ios: 'sparkles', android: 'interests', web: 'interests' },
  nah: { ios: 'xmark', android: 'close', web: 'close' },
  vibe: { ios: 'bolt.fill', android: 'bolt', web: 'bolt' },
} satisfies Record<string, IconName>;
