"use client";

import { type ReactNode } from "react";
import { ConfirmProvider } from "@/components/ui/confirm";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";
import type { Locale } from "@/lib/i18n/config";

/** Root client boundary — wraps the whole app so global providers are available
 *  without forcing the server root layout into a client component. `locale`
 *  is the one the root layout read from the request (ADR-116). */
export function Providers({ children, locale }: { children: ReactNode; locale: Locale }) {
  return (
    <LanguageProvider locale={locale}>
      <ConfirmProvider>
        {children}
        <Toaster />
      </ConfirmProvider>
    </LanguageProvider>
  );
}
