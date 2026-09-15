import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
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

export const metadata: Metadata = {
  title: "Coc Docs Platform",
  description: "Internal documentation platform for Coc Docs Platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${pretendard.variable}`}>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
