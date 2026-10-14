"use client";

/**
 * `useConfirm()` — the app's `window.confirm`, as an `AlertDialog`
 * (ADR-104 r2.16):
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: "Remove this step?", confirmLabel: "Remove", destructive: true }))) return;
 *
 * The browser's own `confirm()` draws an OS box outside the app — another
 * font, no dark mode, a title that's the site's URL — and blocks the page.
 * This resolves to `true` (the action) or `false` (Cancel / Esc).
 *
 * One `ConfirmProvider` near the root (`components/layout/Providers`)
 * renders the dialog for every caller. Without a provider — a component
 * rendered alone in a unit test — it falls back to `window.confirm`, so a
 * test that stubs that keeps working.
 *
 * Not for a decision that must be made synchronously: `beforeunload` and the
 * App Router's synchronous navigation guards still need the native one.
 *
 * // req: ADR-104
 */
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./alert-dialog";
import { LoaderCircle } from "lucide-react";
import { Alert } from "./alert";
import { Button, buttonVariants } from "./button";

export type ConfirmOptions = {
  title: string;
  description?: ReactNode;
  /** The action button's label. Defaults to "Continue". */
  confirmLabel?: string;
  /** Defaults to "Cancel". */
  cancelLabel?: string;
  /** A red action, for something that deletes or discards. */
  destructive?: boolean;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

function nativeConfirm({ title, description }: ConfirmOptions): Promise<boolean> {
  const text = typeof description === "string" ? `${title}\n\n${description}` : title;
  return Promise.resolve(typeof window !== "undefined" && window.confirm(text));
}

export function useConfirm(): ConfirmFn {
  return useContext(ConfirmContext) ?? nativeConfirm;
}

/**
 * The same dialog as `useConfirm`, controlled — for a confirmation that does
 * more than yes/no: its own body (a quoted row, a typed confirmation), work
 * that takes a moment (`busy` shows a spinner and holds the dialog open),
 * and an error from that work shown inside it. The action never closes the
 * dialog by itself; the caller closes it when the work is done.
 *
 * `notice` turns it into a one-button "OK" message — "Can't delete this
 * account" — with no action to take.
 */
export function ConfirmDialog({
  title,
  description,
  children,
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  destructive = false,
  confirmDisabled = false,
  busy = false,
  error,
  notice = false,
  icon,
  onConfirm,
  onCancel,
}: {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  confirmDisabled?: boolean;
  busy?: boolean;
  error?: string | null;
  notice?: boolean;
  /** A round icon above the title — the trash can on a delete. */
  icon?: ReactNode;
  onConfirm?: () => void;
  onCancel: () => void;
}) {
  return (
    <AlertDialog open onOpenChange={(open) => !open && !busy && onCancel()}>
      <AlertDialogContent onEscapeKeyDown={(e) => busy && e.preventDefault()}>
        <AlertDialogHeader>
          {icon && (
            <div
              className={`mb-1 flex size-10 items-center justify-center rounded-full ${
                destructive ? "bg-destructive/10 text-destructive" : "bg-muted-surface text-foreground"
              } [&_svg]:size-5`}
              aria-hidden="true"
            >
              {icon}
            </div>
          )}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : (
            <AlertDialogDescription className="sr-only">{title}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        {children && <div className="mt-4">{children}</div>}
        {error && (
          <Alert variant="destructive" className="mt-4">
            {error}
          </Alert>
        )}
        <AlertDialogFooter>
          {notice ? (
            <AlertDialogCancel className={buttonVariants({ variant: "default" })} autoFocus>
              OK
            </AlertDialogCancel>
          ) : (
            <>
              <AlertDialogCancel disabled={busy} autoFocus>
                {cancelLabel}
              </AlertDialogCancel>
              <Button type="button" variant={destructive ? "destructive" : "default"} disabled={busy || confirmDisabled} onClick={onConfirm}>
                {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
                {confirmLabel}
              </Button>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((answer: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    // A second request while one is open answers the first "no" rather than leaving it hanging.
    resolver.current?.(false);
    setRequest(options);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  function answer(value: boolean) {
    resolver.current?.(value);
    resolver.current = null;
    setRequest(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={request !== null} onOpenChange={(open) => !open && answer(false)}>
        {request && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{request.title}</AlertDialogTitle>
              {request.description ? (
                <AlertDialogDescription>{request.description}</AlertDialogDescription>
              ) : (
                <AlertDialogDescription className="sr-only">{request.title}</AlertDialogDescription>
              )}
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel autoFocus>{request.cancelLabel ?? "Cancel"}</AlertDialogCancel>
              <AlertDialogAction destructive={request.destructive} onClick={() => answer(true)}>
                {request.confirmLabel ?? "Continue"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}
