import {
  BanIcon,
  BellIcon,
  DatabaseIcon,
  DocumentIcon,
  GlobeIcon,
  HeartIcon,
  QuestionIcon,
  SparklesIcon,
  TagIcon,
  type IconComponent,
} from "@/components/layout/icons";
import { EyeIcon, LockIcon, PersonIcon, ShieldIcon } from "@/components/auth/icons";
import { HistoryIcon, KeyIcon, ServerIcon, ShieldCheckIcon, SlidersIcon } from "@/components/legal/icons";

/**
 * Icon options for both a highlight card and a section tile's icon picker
 * (task spec C). Keys are the opaque strings stored in `LegalHighlight.icon`
 * / `LegalSection.icon` and seeded by the legal-pages migration — adding an
 * option here never requires a migration, removing one would strand any
 * highlight/section already using it (none of these are removed for that
 * reason).
 */
export const LEGAL_ICON_OPTIONS: { key: string; label: string; Icon: IconComponent }[] = [
  { key: "person", label: "Person", Icon: PersonIcon },
  { key: "document", label: "Document", Icon: DocumentIcon },
  { key: "ban", label: "Not allowed", Icon: BanIcon },
  { key: "eye", label: "Visibility", Icon: EyeIcon },
  { key: "lock", label: "Security", Icon: LockIcon },
  { key: "heart", label: "Care", Icon: HeartIcon },
  { key: "shield", label: "Protection", Icon: ShieldIcon },
  { key: "shieldCheck", label: "Verified", Icon: ShieldCheckIcon },
  { key: "bell", label: "Notice", Icon: BellIcon },
  { key: "globe", label: "Global", Icon: GlobeIcon },
  { key: "tag", label: "Label", Icon: TagIcon },
  { key: "question", label: "Help", Icon: QuestionIcon },
  { key: "sparkles", label: "Highlight", Icon: SparklesIcon },
  { key: "history", label: "History", Icon: HistoryIcon },
  { key: "key", label: "Access", Icon: KeyIcon },
  { key: "database", label: "Data", Icon: DatabaseIcon },
  { key: "server", label: "Service", Icon: ServerIcon },
  { key: "sliders", label: "Settings", Icon: SlidersIcon },
];

const BY_KEY = new Map(LEGAL_ICON_OPTIONS.map((o) => [o.key, o]));

/** Falls back to the first option rather than rendering nothing for an
 *  icon key older content or a future admin tool might store that isn't
 *  in this list — same "render something true" reasoning the block-body
 *  renderer uses for an unrecognised value. */
export function legalIconFor(key: string): IconComponent {
  return (BY_KEY.get(key) ?? LEGAL_ICON_OPTIONS[0]!).Icon;
}
