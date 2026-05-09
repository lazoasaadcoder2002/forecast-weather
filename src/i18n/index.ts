import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";
import it from "./locales/it.json";
import pt from "./locales/pt.json";
import ru from "./locales/ru.json";
import pl from "./locales/pl.json";
import nl from "./locales/nl.json";
import uk from "./locales/uk.json";
import tr from "./locales/tr.json";
import ar from "./locales/ar.json";
import fa from "./locales/fa.json";
import hi from "./locales/hi.json";
import ur from "./locales/ur.json";
import zh from "./locales/zh.json";
import ko from "./locales/ko.json";
import mn from "./locales/mn.json";
import ja from "./locales/ja.json";
import id from "./locales/id.json";
import ms from "./locales/ms.json";
import th from "./locales/th.json";
import vi from "./locales/vi.json";
import fil from "./locales/fil.json";

export const LANGUAGES = [
  { code: "en", label: "English", native: "English", dir: "ltr" },
  { code: "es", label: "Spanish", native: "Español", dir: "ltr" },
  { code: "fr", label: "French", native: "Français", dir: "ltr" },
  { code: "de", label: "German", native: "Deutsch", dir: "ltr" },
  { code: "it", label: "Italian", native: "Italiano", dir: "ltr" },
  { code: "pt", label: "Portuguese", native: "Português", dir: "ltr" },
  { code: "ru", label: "Russian", native: "Русский", dir: "ltr" },
  { code: "pl", label: "Polish", native: "Polski", dir: "ltr" },
  { code: "nl", label: "Dutch", native: "Nederlands", dir: "ltr" },
  { code: "uk", label: "Ukrainian", native: "Українська", dir: "ltr" },
  { code: "tr", label: "Turkish", native: "Türkçe", dir: "ltr" },
  { code: "ar", label: "Arabic", native: "العربية", dir: "rtl" },
  { code: "fa", label: "Persian", native: "فارسی", dir: "rtl" },
  { code: "hi", label: "Hindi", native: "हिन्दी", dir: "ltr" },
  { code: "ur", label: "Urdu", native: "اردو", dir: "rtl" },
  { code: "zh", label: "Chinese", native: "中文", dir: "ltr" },
  { code: "ko", label: "Korean", native: "한국어", dir: "ltr" },
  { code: "mn", label: "Mongolian", native: "Монгол", dir: "ltr" },
  { code: "ja", label: "Japanese", native: "日本語", dir: "ltr" },
  { code: "id", label: "Indonesian", native: "Bahasa Indonesia", dir: "ltr" },
  { code: "ms", label: "Malay", native: "Bahasa Melayu", dir: "ltr" },
  { code: "th", label: "Thai", native: "ไทย", dir: "ltr" },
  { code: "vi", label: "Vietnamese", native: "Tiếng Việt", dir: "ltr" },
  { code: "fil", label: "Filipino", native: "Filipino", dir: "ltr" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en }, es: { translation: es }, fr: { translation: fr },
      de: { translation: de }, it: { translation: it }, pt: { translation: pt },
      ru: { translation: ru }, pl: { translation: pl }, nl: { translation: nl },
      uk: { translation: uk }, tr: { translation: tr }, ar: { translation: ar },
      fa: { translation: fa }, hi: { translation: hi }, ur: { translation: ur }, zh: { translation: zh },
      ko: { translation: ko }, mn: { translation: mn }, ja: { translation: ja }, id: { translation: id },
      ms: { translation: ms }, th: { translation: th }, vi: { translation: vi },
      fil: { translation: fil },
    },
    fallbackLng: "en",
    supportedLngs: LANGUAGES.map((l) => l.code),
    interpolation: { escapeValue: false },
    detection: { order: ["localStorage", "navigator"], caches: ["localStorage"] },
  });

const applyDir = (lng: string) => {
  const lang = LANGUAGES.find((l) => l.code === lng) ?? LANGUAGES[0];
  document.documentElement.dir = lang.dir;
  document.documentElement.lang = lang.code;
};
applyDir(i18n.language);
i18n.on("languageChanged", applyDir);

export default i18n;
