import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import et from './locales/et.json';
import fi from './locales/fi.json';
import lv from './locales/lv.json';
import ru from './locales/ru.json';
import uk from './locales/uk.json';

/** Interface languages, in the order the language picker shows them. English is the source language. */
export const SUPPORTED_LANGUAGES = ['en', 'et', 'ru', 'uk', 'fi', 'lv'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Each language's own name for itself. These are never translated. */
export const LANGUAGE_NAMES: Record<AppLanguage, string> = {
  en: 'English',
  et: 'Eesti',
  ru: 'Русский',
  uk: 'Українська',
  fi: 'Suomi',
  lv: 'Latviešu',
};

export const resources = {
  en: { translation: en },
  et: { translation: et },
  ru: { translation: ru },
  uk: { translation: uk },
  fi: { translation: fi },
  lv: { translation: lv },
} as const;

export function isAppLanguage(code: string | null | undefined): code is AppLanguage {
  return SUPPORTED_LANGUAGES.some((language) => language === code);
}

/** The first of the device's preferred languages that the app supports, otherwise English. */
export function detectDeviceLanguage(): AppLanguage {
  try {
    for (const locale of getLocales()) {
      if (isAppLanguage(locale.languageCode)) return locale.languageCode;
    }
  } catch {
    // getLocales() can throw outside a real device or browser; English is a safe default.
  }
  return 'en';
}

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources,
  lng: detectDeviceLanguage(),
  fallbackLng: 'en',
  supportedLngs: [...SUPPORTED_LANGUAGES],
  // React already escapes rendered strings.
  interpolation: { escapeValue: false },
  // Translations are bundled with the app, so initialise synchronously and show translated text on the first frame.
  initAsync: false,
});

export default i18n;
