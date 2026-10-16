import { SessionExpiredError } from "@/lib/auth/api";
import type { Translations } from "@/lib/i18n/translations";
import { StoreApiError } from "@/lib/store/store-api";

/**
 * A Store error in the reader's language (FR-I18N-001). The client's own
 * messages are translated; a message the backend wrote (`code: "server"`)
 * is shown as sent, since only the backend knows what it said. Anything
 * else falls back to `fallback`, the caller's "Couldn't …" for that action.
 *
 * // req: FR-I18N-001
 */
export function storeErrorMessage(err: unknown, t: Translations, fallback: string): string {
  if (err instanceof SessionExpiredError) return t.storeErrors.sessionExpired;
  if (!(err instanceof StoreApiError)) return fallback;
  switch (err.code) {
    case "network":
      return t.storeErrors.network;
    case "forbidden":
      return t.storeErrors.forbidden;
    case "tooLarge":
      return t.storeErrors.tooLarge;
    case "server":
      return err.message;
    default:
      return fallback;
  }
}
