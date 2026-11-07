import 'i18next';

import type en from './locales/en.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    // en.json is the source language: every key passed to t() must exist there.
    resources: { translation: typeof en };
  }
}
