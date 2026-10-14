"use client";

import { type ReactNode } from "react";
import { ConfirmProvider } from "@/components/ui/confirm";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

/** Root client boundary — wraps the whole app so global providers are available
 *  without forcing the server root layout into a client component. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <ConfirmProvider>{children}</ConfirmProvider>
    </LanguageProvider>
  );
}
