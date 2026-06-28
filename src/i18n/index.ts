import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import de from "./locales/de.json";
import it from "./locales/it.json";
import pt from "./locales/pt.json";
import nl from "./locales/nl.json";
import sv from "./locales/sv.json";
import no from "./locales/no.json";
import fi from "./locales/fi.json";
import da from "./locales/da.json";
import is from "./locales/is.json";
import ga from "./locales/ga.json";
import lb from "./locales/lb.json";
import el from "./locales/el.json";
import sq from "./locales/sq.json";
import ca from "./locales/ca.json";
import cs from "./locales/cs.json";
import sk from "./locales/sk.json";
import pl from "./locales/pl.json";
import hu from "./locales/hu.json";
import ro from "./locales/ro.json";
import bg from "./locales/bg.json";
import hr from "./locales/hr.json";
import sr from "./locales/sr.json";
import bs from "./locales/bs.json";
import sl from "./locales/sl.json";
import mk from "./locales/mk.json";
import et from "./locales/et.json";
import lv from "./locales/lv.json";
import lt from "./locales/lt.json";
import ka from "./locales/ka.json";
import hy from "./locales/hy.json";
import ru from "./locales/ru.json";
import uk from "./locales/uk.json";
import tr from "./locales/tr.json";
import ar from "./locales/ar.json";
import fa from "./locales/fa.json";
import ckb from "./locales/ckb.json";
import kmr from "./locales/kmr.json";
import hi from "./locales/hi.json";
import ur from "./locales/ur.json";
import prs from "./locales/prs.json";
import ps from "./locales/ps.json";
import bn from "./locales/bn.json";
import si from "./locales/si.json";
import ne from "./locales/ne.json";
import km from "./locales/km.json";
import kk from "./locales/kk.json";
import uz from "./locales/uz.json";
import tg from "./locales/tg.json";
import ky from "./locales/ky.json";
import zh from "./locales/zh.json";
import ko from "./locales/ko.json";
import mn from "./locales/mn.json";
import ja from "./locales/ja.json";
import id from "./locales/id.json";
import ms from "./locales/ms.json";
import th from "./locales/th.json";
import vi from "./locales/vi.json";
import fil from "./locales/fil.json";
import af from "./locales/af.json";

export const LANGUAGES = [
  { code: "en", label: "English", native: "English", dir: "ltr" },
  { code: "es", label: "Spanish", native: "Español", dir: "ltr" },
  { code: "fr", label: "French", native: "Français", dir: "ltr" },
  { code: "de", label: "German", native: "Deutsch", dir: "ltr" },
  { code: "it", label: "Italian", native: "Italiano", dir: "ltr" },
  { code: "pt", label: "Portuguese", native: "Português", dir: "ltr" },
  { code: "nl", label: "Dutch", native: "Nederlands", dir: "ltr" },
  { code: "sv", label: "Swedish", native: "Svenska", dir: "ltr" },
  { code: "no", label: "Norwegian", native: "Norsk", dir: "ltr" },
  { code: "fi", label: "Finnish", native: "Suomi", dir: "ltr" },
  { code: "da", label: "Danish", native: "Dansk", dir: "ltr" },
  { code: "is", label: "Icelandic", native: "Íslenska", dir: "ltr" },
  { code: "ga", label: "Irish", native: "Gaeilge", dir: "ltr" },
  { code: "lb", label: "Luxembourgish", native: "Lëtzebuergesch", dir: "ltr" },
  { code: "el", label: "Greek", native: "Ελληνικά", dir: "ltr" },
  { code: "sq", label: "Albanian", native: "Shqip", dir: "ltr" },
  { code: "ca", label: "Catalan", native: "Català", dir: "ltr" },
  { code: "cs", label: "Czech", native: "Čeština", dir: "ltr" },
  { code: "sk", label: "Slovak", native: "Slovenčina", dir: "ltr" },
  { code: "pl", label: "Polish", native: "Polski", dir: "ltr" },
  { code: "hu", label: "Hungarian", native: "Magyar", dir: "ltr" },
  { code: "ro", label: "Romanian", native: "Română", dir: "ltr" },
  { code: "bg", label: "Bulgarian", native: "Български", dir: "ltr" },
  { code: "hr", label: "Croatian", native: "Hrvatski", dir: "ltr" },
  { code: "sr", label: "Serbian", native: "Српски", dir: "ltr" },
  { code: "bs", label: "Bosnian", native: "Bosanski", dir: "ltr" },
  { code: "sl", label: "Slovenian", native: "Slovenščina", dir: "ltr" },
  { code: "mk", label: "Macedonian", native: "Македонски", dir: "ltr" },
  { code: "et", label: "Estonian", native: "Eesti", dir: "ltr" },
  { code: "lv", label: "Latvian", native: "Latviešu", dir: "ltr" },
  { code: "lt", label: "Lithuanian", native: "Lietuvių", dir: "ltr" },
  { code: "ka", label: "Georgian", native: "ქართული", dir: "ltr" },
  { code: "hy", label: "Armenian", native: "Հայերեն", dir: "ltr" },
  { code: "ru", label: "Russian", native: "Русский", dir: "ltr" },
  { code: "uk", label: "Ukrainian", native: "Українська", dir: "ltr" },
  { code: "tr", label: "Turkish", native: "Türkçe", dir: "ltr" },
  { code: "ar", label: "Arabic", native: "العربية", dir: "rtl" },
  { code: "fa", label: "Persian", native: "فارسی", dir: "rtl" },
  { code: "ckb", label: "Kurdish (Sorani)", native: "کوردیی ناوەندی", dir: "rtl" },
  { code: "kmr", label: "Kurdish (Kurmanji)", native: "Kurmancî", dir: "ltr" },
  { code: "hi", label: "Hindi", native: "हिन्दी", dir: "ltr" },
  { code: "ur", label: "Urdu", native: "اردو", dir: "rtl" },
  { code: "prs", label: "Dari", native: "دری", dir: "rtl" },
  { code: "ps", label: "Pashto", native: "پښتو", dir: "rtl" },
  { code: "bn", label: "Bengali", native: "বাংলা", dir: "ltr" },
  { code: "si", label: "Sinhalese", native: "සිංහල", dir: "ltr" },
  { code: "ne", label: "Nepali", native: "नेपाली", dir: "ltr" },
  { code: "km", label: "Khmer", native: "ខ្មែរ", dir: "ltr" },
  { code: "kk", label: "Kazakh", native: "Қазақша", dir: "ltr" },
  { code: "uz", label: "Uzbek", native: "Oʻzbekcha", dir: "ltr" },
  { code: "tg", label: "Tajik", native: "Тоҷикӣ", dir: "ltr" },
  { code: "ky", label: "Kyrgyz", native: "Кыргызча", dir: "ltr" },
  { code: "zh", label: "Chinese", native: "中文", dir: "ltr" },
  { code: "ko", label: "Korean", native: "한국어", dir: "ltr" },
  { code: "mn", label: "Mongolian", native: "Монгол", dir: "ltr" },
  { code: "ja", label: "Japanese", native: "日本語", dir: "ltr" },
  { code: "id", label: "Indonesian", native: "Bahasa Indonesia", dir: "ltr" },
  { code: "ms", label: "Malay", native: "Bahasa Melayu", dir: "ltr" },
  { code: "th", label: "Thai", native: "ไทย", dir: "ltr" },
  { code: "vi", label: "Vietnamese", native: "Tiếng Việt", dir: "ltr" },
  { code: "fil", label: "Filipino", native: "Filipino", dir: "ltr" },
  { code: "af", label: "Afrikaans", native: "Afrikaans", dir: "ltr" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en }, es: { translation: es }, fr: { translation: fr },
      de: { translation: de }, it: { translation: it }, pt: { translation: pt },
      nl: { translation: nl }, sv: { translation: sv }, no: { translation: no },
      fi: { translation: fi }, da: { translation: da }, is: { translation: is },
      ga: { translation: ga }, lb: { translation: lb }, el: { translation: el },
      sq: { translation: sq }, ca: { translation: ca }, cs: { translation: cs },
      sk: { translation: sk }, pl: { translation: pl }, hu: { translation: hu },
      ro: { translation: ro }, bg: { translation: bg }, hr: { translation: hr },
      sr: { translation: sr }, bs: { translation: bs }, sl: { translation: sl },
      mk: { translation: mk }, et: { translation: et }, lv: { translation: lv },
      lt: { translation: lt }, ka: { translation: ka }, hy: { translation: hy },
      ru: { translation: ru }, uk: { translation: uk }, tr: { translation: tr },
      ar: { translation: ar }, fa: { translation: fa }, ckb: { translation: ckb },
      kmr: { translation: kmr }, hi: { translation: hi }, ur: { translation: ur },
      prs: { translation: prs }, ps: { translation: ps }, bn: { translation: bn },
      si: { translation: si }, ne: { translation: ne }, km: { translation: km },
      kk: { translation: kk }, uz: { translation: uz }, tg: { translation: tg },
      ky: { translation: ky }, zh: { translation: zh }, ko: { translation: ko },
      mn: { translation: mn }, ja: { translation: ja }, id: { translation: id },
      ms: { translation: ms }, th: { translation: th }, vi: { translation: vi },
      fil: { translation: fil }, af: { translation: af },
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
