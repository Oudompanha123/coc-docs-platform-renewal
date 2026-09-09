/**
 * Minimal typing + a small wrapper around Google Identity Services (GSI),
 * covering only what this app uses. The script itself is loaded via
 * `next/script` on the page that needs it (`https://accounts.google.com/gsi/client`).
 *
 * We render our own "Continue with Google" button (to match the approved
 * mockup) rather than Google's own `renderButton`, so sign-in is driven
 * directly through `initialize()` + `prompt()`.
 * See https://developers.google.com/identity/gsi/web/reference/js-reference
 */

export interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdConfiguration {
  client_id: string;
  nonce: string;
  callback: (response: GoogleCredentialResponse) => void;
}

interface GoogleMomentNotification {
  isNotDisplayed(): boolean;
  isSkippedMoment(): boolean;
  isDismissedMoment(): boolean;
}

interface GoogleAccountsId {
  initialize(config: GoogleIdConfiguration): void;
  prompt(listener?: (notification: GoogleMomentNotification) => void): void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}

/** The user closed Google's prompt themselves — not a failure, nothing to alert about. */
export class GoogleSignInCancelledError extends Error {}

/**
 * Starts one Google sign-in attempt bound to `nonce` (see FR-AUTH-001,
 * TM-001 — the backend rejects any token whose nonce claim doesn't match the
 * `coc_oidc_nonce` cookie it issued). Resolves with the raw ID token
 * credential to hand to `POST /api/auth/login`.
 */
export function promptGoogleSignIn(options: { clientId: string; nonce: string }): Promise<string> {
  return new Promise((resolve, reject) => {
    const accountsId = window.google?.accounts?.id;
    if (!accountsId) {
      reject(new Error("Google Sign-In hasn't finished loading yet. Please try again in a moment."));
      return;
    }

    accountsId.initialize({
      client_id: options.clientId,
      nonce: options.nonce,
      callback: (response) => {
        if (response?.credential) {
          resolve(response.credential);
        } else {
          reject(new Error("Google did not return a credential."));
        }
      },
    });

    accountsId.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        reject(
          new Error(
            "Google sign-in couldn't be shown. Check that pop-ups and third-party cookies are allowed for this site.",
          ),
        );
      } else if (notification.isDismissedMoment()) {
        reject(new GoogleSignInCancelledError());
      }
    });
  });
}
