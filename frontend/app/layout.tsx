import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import { TopProgressBar } from "@/components/layout/TopProgressBar";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/** Opt-in secondary font — not the default anywhere. Inter (above) stays
 *  --font-sans; this only becomes available via the separate `font-pretendard`
 *  Tailwind utility (see globals.css) for components that ask for it, e.g.
 *  Korean-language content. Static woff2 files copied from the official
 *  `pretendard` npm package's dist/web/static/woff2/ (package itself isn't a
 *  project dependency — installed once with --no-save purely to extract the
 *  7 weight files, then removed). */
const pretendard = localFont({
  src: [
    { path: "../public/fonts/pretendard/Pretendard-Light.woff2", weight: "300", style: "normal" },
    { path: "../public/fonts/pretendard/Pretendard-Regular.woff2", weight: "400", style: "normal" },
    { path: "../public/fonts/pretendard/Pretendard-Medium.woff2", weight: "500", style: "normal" },
    { path: "../public/fonts/pretendard/Pretendard-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../public/fonts/pretendard/Pretendard-Bold.woff2", weight: "700", style: "normal" },
    { path: "../public/fonts/pretendard/Pretendard-ExtraBold.woff2", weight: "800", style: "normal" },
    { path: "../public/fonts/pretendard/Pretendard-Black.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-pretendard",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SITE_NAME = "Coc Docs Platform";
const SITE_DESCRIPTION = "Internal documentation platform for Coc Docs Platform.";

export const metadata: Metadata = {
  // Required for the App Router's auto-detected app/opengraph-image.png and
  // app/twitter-image.png to become absolute URLs in a shared link's
  // preview — without it Next falls back to a default that does not point
  // at this deployment. NEXT_PUBLIC_SITE_URL degrades to localhost, same
  // "absent is a supported, non-fatal state" convention every other
  // NEXT_PUBLIC_* var in this app already follows.
  metadataBase: new URL(SITE_URL),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  // icons (favicon.ico / icon.png / apple-icon.png) are Next.js App Router
  // file-convention special files under app/ — auto-wired into <head>, no
  // entry needed here.
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning on <html> for the same reason <body> already has
    // it, and for one more.
    //
    // Browser extensions write to <html> before React hydrates — the reported
    // mismatch was data-qb-installed, from an extension — and React compares
    // the DOM it finds against the HTML the server sent. An attribute that
    // arrived in between is a difference React cannot explain, so it warns.
    //
    // lib/theme.ts also writes data-theme to document.documentElement. That
    // runs after hydration today and so is not the current cause, but it makes
    // <html> an element this application mutates, which is exactly the case
    // this attribute exists for.
    //
    // It suppresses one level only: the attributes and text of <html> itself,
    // never its descendants. A real mismatch inside the app still reports.
    <html
      lang="en"
      className={`${inter.variable} ${pretendard.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased" suppressHydrationWarning>
        <TopProgressBar />
        {children}
      </body>
    </html>
  );
}
