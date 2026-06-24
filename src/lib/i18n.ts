import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/locales/en/common.json";
import af from "@/locales/af/common.json";
import zu from "@/locales/zu/common.json";
import xh from "@/locales/xh/common.json";
import fr from "@/locales/fr/common.json";
import es from "@/locales/es/common.json";
import pt from "@/locales/pt/common.json";
import de from "@/locales/de/common.json";
import ar from "@/locales/ar/common.json";
import zh from "@/locales/zh/common.json";
import ja from "@/locales/ja/common.json";

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "af", label: "Afrikaans" },
  { code: "zu", label: "isiZulu" },
  { code: "xh", label: "isiXhosa" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "de", label: "Deutsch" },
  { code: "ar", label: "العربية" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
] as const;

export const LANGUAGE_NAME: Record<string, string> = Object.fromEntries(
  SUPPORTED_LANGUAGES.map((l) => [l.code, l.label]),
);

export const RTL_LANGUAGES = new Set(["ar"]);

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources: {
      en: { common: en },
      af: { common: af },
      zu: { common: zu },
      xh: { common: xh },
      fr: { common: fr },
      es: { common: es },
      pt: { common: pt },
      de: { common: de },
      ar: { common: ar },
      zh: { common: zh },
      ja: { common: ja },
    },
    lng: "en",
    fallbackLng: "en",
    defaultNS: "common",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

export function applyLanguage(code: string) {
  const lang = LANGUAGE_NAME[code] ? code : "en";
  void i18n.changeLanguage(lang);
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGUAGES.has(lang) ? "rtl" : "ltr";
  }
  if (typeof localStorage !== "undefined") {
    try { localStorage.setItem("cs_lang", lang); } catch { /* ignore */ }
  }
}

export default i18n;