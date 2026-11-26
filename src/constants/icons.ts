import type { IconName } from '@/components/icon';

/** Icons used across the app: SF Symbols on iOS, Material Symbols on Android and web. */
export const ICONS = {
  back: { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  notifications: { ios: 'bell', android: 'notifications', web: 'notifications' },
  meetups: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  create: { ios: 'plus', android: 'add', web: 'add' },
  profile: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
} satisfies Record<string, IconName>;
