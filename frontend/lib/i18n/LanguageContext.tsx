"use client";

// req: UI-LANG-01
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { type Language, type Translations, translations } from "./translations";

const STORAGE_KEY = "coc-docs-lang";
const DEFAULT_LANG: Language = "en";

interface LanguageContextValue {
  language: Language;
  t: Translations;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: DEFAULT_LANG,
  t: translations[DEFAULT_LANG],
  setLanguage: () => undefined,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANG);

  // Load from localStorage on mount (client-only)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored && stored in translations) {
      setLanguageState(stored);
    }
  }, []);

  // Sync <html lang> attribute and localStorage whenever language changes
  useEffect(() => {
    document.documentElement.lang = language;
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  return (
    <LanguageContext.Provider
      value={{ language, t: translations[language], setLanguage }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
