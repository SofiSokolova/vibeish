// Provides localStorage on Android and iOS (the browser has its own); the language choice is kept there.
import 'expo-sqlite/localStorage/install';

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

const LANGUAGE_KEY = 'vibeish.language';

/** The language chosen earlier on this device, if any. */
function readSavedLanguage(): AppLanguage | null {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    return isAppLanguage(saved) ? saved : null;
  } catch {
    return null;
  }
}

const i18n = createInstance();

void i18n.use(initReactI18next).init({
  resources,
  lng: readSavedLanguage() ?? detectDeviceLanguage(),
  fallbackLng: 'en',
  supportedLngs: [...SUPPORTED_LANGUAGES],
  // React already escapes rendered strings.
  interpolation: { escapeValue: false },
  // Translations are bundled with the app, so initialise synchronously and show translated text on the first frame.
  initAsync: false,
});

/**
 * Switches the interface language and remembers the choice on this device. Signed-in
 * users also get it saved to their profile (see lib/auth.tsx).
 */
export function setAppLanguage(language: AppLanguage) {
  try {
    localStorage.setItem(LANGUAGE_KEY, language);
  } catch {
    // Without storage the choice still applies until the app restarts.
  }
  void i18n.changeLanguage(language);
}

/** The interface language currently in use. */
export function currentLanguage(): AppLanguage {
  return isAppLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'en';
}

export default i18n;
