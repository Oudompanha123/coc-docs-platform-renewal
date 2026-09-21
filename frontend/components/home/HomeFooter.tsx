"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth/SessionProvider";
import { Spinner } from "@/components/layout/Spinner";
import { productHref } from "@/lib/home/product-links";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/**
 * The Member page's own footer — same Product/Team column shape as
 * `/welcome`'s, but the marketing "Administration" and "Get Started" columns
 * make no sense for a signed-in reader: Administration listed Settings/System
 * Admin (admin-only), and Get Started listed Create an account/Log in (this
 * reader already has one). Account and Help replace them, per this task.
 */
export function HomeFooter({
  onOpenProfile,
  onOpenNotifications,
}: {
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
}) {
  const { signOut, isSigningOut } = useSession();
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element -- fixed local asset, not user content */}
            <img src="/logo-coc-docs-platform.png" alt="Coc Docs Platform" className="h-[55px] w-auto rounded-md" />
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-8 sm:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink">{t.footer.product}</p>
              <ul className="mt-3 space-y-2.5">
                <li><Link href="/home" className="text-sm text-muted hover:text-ink">{t.nav.home}</Link></li>
                <li><Link href={productHref("jex3-0")} className="text-sm text-muted hover:text-ink">Jex3.0</Link></li>
                <li><Link href={productHref("jex2-0")} className="text-sm text-muted hover:text-ink">Jex2.0</Link></li>
                <li><Link href={productHref("coach")} className="text-sm text-muted hover:text-ink">Coach</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink">{t.footer.team}</p>
              <ul className="mt-3 space-y-2.5">
                <li><Link href={productHref("team")} className="text-sm text-muted hover:text-ink">Team</Link></li>
                <li><Link href={productHref("usage")} className="text-sm text-muted hover:text-ink">Usage</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink">{t.footer.account}</p>
              <ul className="mt-3 space-y-2.5">
                <li>
                  <button type="button" onClick={onOpenProfile} className="text-sm text-muted hover:text-ink">
                    {t.footer.profile}
                  </button>
                </li>
                <li>
                  <button type="button" onClick={onOpenNotifications} className="text-sm text-muted hover:text-ink">
                    {t.footer.notifications}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    disabled={isSigningOut}
                    aria-busy={isSigningOut}
                    onClick={() => void signOut()}
                    className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink disabled:cursor-not-allowed"
                  >
                    {isSigningOut && <Spinner className="h-3.5 w-3.5 border-2" />}
                    {isSigningOut ? t.footer.loggingOut : t.footer.logout}
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink">{t.footer.help}</p>
              <ul className="mt-3 space-y-2.5">
                <li><Link href="/docs/get-started" className="text-sm text-muted hover:text-ink">{t.footer.getStarted}</Link></li>
                <li><Link href="/docs/how-to-use" className="text-sm text-muted hover:text-ink">{t.footer.howToUse}</Link></li>
                <li><Link href="/docs/faq" className="text-sm text-muted hover:text-ink">{t.footer.faq}</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <span className="text-xs text-muted">{t.footer.copyright}</span>
        </div>
      </div>
    </footer>
  );
}
