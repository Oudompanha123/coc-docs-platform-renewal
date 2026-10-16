import type { SVGProps } from "react";
import type { StorePlatform } from "@/lib/store/store-api";

/*
 * The real platform marks, as path data copied from Simple Icons v13.21.0
 * (https://simpleicons.org, CC0-1.0 — public domain, so no runtime package
 * and no attribution requirement). The marks themselves remain their
 * owners' trademarks; the Store shows them only to say which platform a
 * download is for. Windows is from v9.21.0, the last release that carried
 * it. All are on a 24×24 viewBox.
 */
const ANDROID_PATH =
  "M18.4395 5.5586c-.675 1.1664-1.352 2.3318-2.0274 3.498-.0366-.0155-.0742-.0286-.1113-.043-1.8249-.6957-3.484-.8-4.42-.787-1.8551.0185-3.3544.4643-4.2597.8203-.084-.1494-1.7526-3.021-2.0215-3.4864a1.1451 1.1451 0 0 0-.1406-.1914c-.3312-.364-.9054-.4859-1.379-.203-.475.282-.7136.9361-.3886 1.5019 1.9466 3.3696-.0966-.2158 1.9473 3.3593.0172.031-.4946.2642-1.3926 1.0177C2.8987 12.176.452 14.772 0 18.9902h24c-.119-1.1108-.3686-2.099-.7461-3.0683-.7438-1.9118-1.8435-3.2928-2.7402-4.1836a12.1048 12.1048 0 0 0-2.1309-1.6875c.6594-1.122 1.312-2.2559 1.9649-3.3848.2077-.3615.1886-.7956-.0079-1.1191a1.1001 1.1001 0 0 0-.8515-.5332c-.5225-.0536-.9392.3128-1.0488.5449zm-.0391 8.461c.3944.5926.324 1.3306-.1563 1.6503-.4799.3197-1.188.0985-1.582-.4941-.3944-.5927-.324-1.3307.1563-1.6504.4727-.315 1.1812-.1086 1.582.4941zM7.207 13.5273c.4803.3197.5506 1.0577.1563 1.6504-.394.5926-1.1038.8138-1.584.4941-.48-.3197-.5503-1.0577-.1563-1.6504.4008-.6021 1.1087-.8106 1.584-.4941z";

const APPLE_PATH =
  "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701";

const WINDOWS_PATH = "M0,0H11.377V11.372H0ZM12.623,0H24V11.372H12.623ZM0,12.623H11.377V24H0Zm12.623,0H24V24H12.623";

const IOS_WORDMARK_PATH =
  "M1.1 6.05C.486 6.05 0 6.53 0 7.13A1.08 1.08 0 0 0 1.1 8.21C1.72 8.21 2.21 7.73 2.21 7.13C2.21 6.53 1.72 6.05 1.1 6.05M8.71 6.07C5.35 6.07 3.25 8.36 3.25 12C3.25 15.67 5.35 17.95 8.71 17.95C12.05 17.95 14.16 15.67 14.16 12C14.16 8.36 12.05 6.07 8.71 6.07M19.55 6.07C17.05 6.07 15.27 7.45 15.27 9.5C15.27 11.13 16.28 12.15 18.4 12.64L19.89 13C21.34 13.33 21.93 13.81 21.93 14.64C21.93 15.6 20.96 16.28 19.58 16.28C18.17 16.28 17.11 15.59 17 14.53H15C15.08 16.65 16.82 17.95 19.46 17.95C22.25 17.95 24 16.58 24 14.4C24 12.69 23 11.72 20.68 11.19L19.35 10.89C17.94 10.55 17.36 10.1 17.36 9.34C17.36 8.38 18.24 7.74 19.54 7.74C20.85 7.74 21.75 8.39 21.85 9.46H23.81C23.76 7.44 22.09 6.07 19.55 6.07M8.71 7.82C10.75 7.82 12.06 9.45 12.06 12C12.06 14.57 10.75 16.2 8.71 16.2C6.65 16.2 5.35 14.57 5.35 12C5.35 9.45 6.65 7.82 8.71 7.82M.111 9.31V17.76H2.1V9.31H.11Z";

/** Brand colours: Android's bugdroid green and Windows blue. Apple's mark is
 *  black, so iOS and macOS use the text colour and stay visible in dark mode. */
const ANDROID_GREEN = "#3DDC84";
const WINDOWS_BLUE = "#0078D4";

/**
 * The small platform mark beside a label — the Store's filter chips, the
 * platform chips on a card, the app page's tabs, the upload dialog. The real
 * logos, in colour: Android green, Windows blue, the Apple mark for iOS and
 * macOS (the label beside it says which).
 *
 * The one place the Store steps outside the neutral palette, on purpose: a
 * platform is recognised by its logo and its colour.
 */
export function PlatformIcon({ platform, ...props }: { platform: StorePlatform } & SVGProps<SVGSVGElement>) {
  const common = { viewBox: "0 0 24 24", "aria-hidden": true, ...props } as const;

  switch (platform) {
    case "android":
      return (
        <svg {...common}>
          <path d={ANDROID_PATH} fill={ANDROID_GREEN} />
        </svg>
      );
    case "windows":
      return (
        <svg {...common}>
          <path d={WINDOWS_PATH} fill={WINDOWS_BLUE} />
        </svg>
      );
    case "ios":
    case "macos":
      return (
        <svg {...common}>
          <path d={APPLE_PATH} fill="currentColor" />
        </svg>
      );
  }
}

/**
 * The large mark on a Get dialog tile: the same logos at tile size, except
 * iOS, which shows the "iOS" wordmark in Apple's gradient. With no label
 * under the tile, two identical apples would not say which is the phone.
 */
export function PlatformLogo({ platform, className }: { platform: StorePlatform; className?: string }) {
  if (platform !== "ios") {
    return <PlatformIcon platform={platform} className={`text-foreground ${className ?? ""}`} />;
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <defs>
        <linearGradient id="platform-logo-ios" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#1FA2FF" />
          <stop offset="0.45" stopColor="#7B4DFF" />
          <stop offset="0.75" stopColor="#FF3CAC" />
          <stop offset="1" stopColor="#FF9F43" />
        </linearGradient>
      </defs>
      <path d={IOS_WORDMARK_PATH} fill="url(#platform-logo-ios)" />
    </svg>
  );
}
