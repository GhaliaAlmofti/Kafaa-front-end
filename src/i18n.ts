import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en';
import ar from './locales/ar';

const STORAGE_KEY = 'kafaa_lang';

function applyDocumentLang(lng: string) {
  const isRtl = lng.startsWith('ar');
  document.documentElement.lang = isRtl ? 'ar' : 'en';
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
}

function getStoredLang(): string {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s === 'ar' || s === 'en') return s;
  } catch {
    /* ignore */
  }
  return 'en';
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
  },
  lng: getStoredLang(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    /* ignore */
  }
  applyDocumentLang(lng);
});

applyDocumentLang(i18n.language);

export default i18n;
