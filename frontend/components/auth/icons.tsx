/**
 * The sign-in screens' icons — Lucide, the same set as
 * `components/layout/icons.tsx` (ADR-104 r2.5).
 *
 * These were hand-drawn 1.6px-stroke SVGs, which sat visibly thinner than
 * the 2px Lucide glyphs everywhere else in the app. The export names are kept
 * so no importer changes; only `GoogleIcon` stays bespoke, because it is
 * Google's own multi-colour mark and not an icon a set can supply.
 *
 * // req: ADR-104
 */
import type { SVGProps } from "react";
import { Eye, EyeOff, FileText, Lock, Mail, Phone, Plus, Shield, User, type LucideIcon } from "lucide-react";

type IconProps = { className?: string };

/** Decorative by default — the control around an icon carries its name. */
function lucide(Icon: LucideIcon) {
  function Wrapped({ className }: IconProps) {
    return <Icon aria-hidden="true" className={className} />;
  }
  Wrapped.displayName = `${Icon.displayName ?? "Lucide"}Icon`;
  return Wrapped;
}

export const PersonIcon = lucide(User);
export const MailIcon = lucide(Mail);
export const PhoneIcon = lucide(Phone);
export const LockIcon = lucide(Lock);
export const EyeIcon = lucide(Eye);
export const EyeOffIcon = lucide(EyeOff);
export const DocumentIcon = lucide(FileText);
export const ShieldIcon = lucide(Shield);
export const PlusIcon = lucide(Plus);

export function GoogleIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} {...props}>
      <path
        d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.63h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81Z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.95-1.07 7.94-2.92l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.28v3.1A11.998 11.998 0 0 0 12 24Z"
        fill="#34A853"
      />
      <path d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.28a12 12 0 0 0 0 10.78l4.01-3.1Z" fill="#FBBC05" />
      <path
        d="M12 4.75c1.76 0 3.34.6 4.59 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.28 6.61l4.01 3.1C6.23 6.87 8.88 4.75 12 4.75Z"
        fill="#EA4335"
      />
    </svg>
  );
}
