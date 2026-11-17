import type { Href } from 'expo-router';

/**
 * Bottom tabs, shared by the native tab bar (components/app-tabs.tsx) and the web one
 * (components/app-tabs.web.tsx). `name` is the route file in src/app/(app), `label` a locale
 * key, `sf` SF Symbols for iOS and `md` Material Symbols for Android and web.
 */
export const TABS = [
  {
    name: 'index',
    // Typed by hand: on Windows, Expo Router's typed routes list (app)/index as `/index`
    // instead of `/`, because the generator strips `/index` before it turns `\` into `/`.
    href: '/' as Href,
    label: 'tabs.feed',
    sf: { default: 'rectangle.stack', selected: 'rectangle.stack.fill' },
    md: 'style',
  },
  {
    name: 'meetups',
    href: '/meetups',
    label: 'tabs.meetups',
    sf: { default: 'calendar', selected: 'calendar' },
    md: 'calendar_month',
  },
  {
    name: 'create',
    href: '/create',
    label: 'tabs.create',
    sf: { default: 'plus.circle', selected: 'plus.circle.fill' },
    md: 'add_circle',
  },
  {
    name: 'chats',
    href: '/chats',
    label: 'tabs.chats',
    sf: { default: 'bubble.left.and.bubble.right', selected: 'bubble.left.and.bubble.right.fill' },
    md: 'forum',
  },
  {
    name: 'profile',
    href: '/profile',
    label: 'tabs.profile',
    sf: { default: 'person.crop.circle', selected: 'person.crop.circle.fill' },
    md: 'account_circle',
  },
] as const;

export type AppTab = (typeof TABS)[number];
