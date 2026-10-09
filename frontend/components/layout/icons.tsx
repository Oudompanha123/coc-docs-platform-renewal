/**
 * The app's icon set — Lucide, the set shadcn/ui is drawn with (ADR-104 r2.5).
 *
 * This file used to hold 53 hand-drawn SVGs, kept bespoke by ADR-104
 * decision 4. The product owner asked for shadcn's icons instead, so each
 * export below now renders its Lucide counterpart. The export names are
 * unchanged on purpose: 75 files import from here, and keeping the names
 * means the swap is this one file rather than 75 edits — and the next time
 * an icon is changed, it is still one line.
 *
 * Lucide's own geometry is kept as-is (24px grid, 2px stroke, round caps),
 * because that stroke weight is what makes it read as shadcn. A caller that
 * passes `className="h-5 w-5"` sizes it exactly as before.
 *
 * // req: ADR-104
 */
import type { SVGProps } from "react";
import {
  Activity,
  Bell,
  CalendarCheck,
  Camera,
  ChartColumn,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleCheck,
  CircleHelp,
  Clock,
  Code,
  Cog,
  Coins,
  CornerDownLeft,
  Database,
  Download,
  ExternalLink,
  FileText,
  Folder,
  Globe,
  Heart,
  History,
  House,
  Layers,
  Link,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  Monitor,
  Moon,
  Network,
  Newspaper,
  Paperclip,
  Play,
  Plug,
  Plus,
  RefreshCw,
  RotateCcw,
  Settings,
  Sparkles,
  Sun,
  SunMedium,
  Tag,
  Trash2,
  TriangleAlert,
  Upload,
  User,
  UserPlus,
  Users,
  X,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

export type IconComponent = (props: SVGProps<SVGSVGElement>) => React.JSX.Element;

/**
 * Adapts a Lucide icon to this module's `IconComponent` signature. Icons are
 * decorative by default — every call site that needs a name puts it on the
 * control around the icon — so `aria-hidden` is the default, overridable.
 */
function lucide(Icon: LucideIcon, defaults: LucideProps = {}): IconComponent {
  function Wrapped(props: SVGProps<SVGSVGElement>) {
    return <Icon aria-hidden {...defaults} {...(props as LucideProps)} />;
  }
  Wrapped.displayName = `${Icon.displayName ?? "Lucide"}Icon`;
  return Wrapped;
}

export const HomeIcon = lucide(House);
export const FolderIcon = lucide(Folder);
export const LayersIcon = lucide(Layers);
export const SparklesIcon = lucide(Sparkles);
export const PlugIcon = lucide(Plug);
export const PulseIcon = lucide(Activity);
export const HeartIcon = lucide(Heart);
export const UsersIcon = lucide(Users);
export const CameraIcon = lucide(Camera);
export const MonitorIcon = lucide(Monitor);
export const GearIcon = lucide(Cog);
export const SettingsIcon = lucide(Settings);
export const MoonIcon = lucide(Moon);
export const BellIcon = lucide(Bell);
export const MailIcon = lucide(Mail);
/** The topbar's Activity — the audit trail, not mail: a clock wound back. */
export const AuditIcon = lucide(History);
export const ChevronDownIcon = lucide(ChevronDown);
export const ChevronLeftIcon = lucide(ChevronLeft);
export const ChevronRightIcon = lucide(ChevronRight);
export const PlusIcon = lucide(Plus);
export const UserPlusIcon = lucide(UserPlus);
export const BarChartIcon = lucide(ChartColumn);
export const CoinsIcon = lucide(Coins);
export const WarningIcon = lucide(TriangleAlert);
/** Filled, as the old glyph was — an outlined triangle reads as "next", not "play". */
export const PlayIcon = lucide(Play, { fill: "currentColor" });
export const ArticleIcon = lucide(Newspaper);
export const TagIcon = lucide(Tag);
/** Distinct from {@link SunIcon} — the smaller-rayed sun. */
export const SunburstIcon = lucide(SunMedium);
export const ClockIcon = lucide(Clock);
export const QuestionIcon = lucide(CircleHelp);
export const DatabaseIcon = lucide(Database);
export const DocumentIcon = lucide(FileText);
export const SunIcon = lucide(Sun);
export const PersonIcon = lucide(User);
export const LinkIcon = lucide(Link);
export const LogOutIcon = lucide(LogOut);
export const MenuIcon = lucide(Menu);
export const XIcon = lucide(X);
export const DownloadIcon = lucide(Download);
export const UploadIcon = lucide(Upload);
export const TrashIcon = lucide(Trash2);
export const CheckCircleIcon = lucide(CircleCheck);
export const RingIcon = lucide(Circle);
/** AX Renewal's nav/page glyph — two curved arrows forming a refresh loop. */
export const RenewIcon = lucide(RefreshCw);
/** The Developer capability badge/checkbox glyph — angle brackets. */
export const CodeBracketsIcon = lucide(Code);
/** Architecture / module-coupling diagram glyph — a small graph of nodes. */
export const NodesIcon = lucide(Network);
/** The "Reopen" action on a confirmed plan section — distinct from RenewIcon's double arrow. */
export const ReopenIcon = lucide(RotateCcw);
export const ReturnIcon = lucide(CornerDownLeft);
export const ExternalLinkIcon = lucide(ExternalLink);
export const GlobeIcon = lucide(Globe);
/** The Attach flow's primary action glyph. */
export const PaperclipIcon = lucide(Paperclip);
/** The Attendance page's header glyph — a calendar with a confirmed day. */
export const CalendarCheckIcon = lucide(CalendarCheck);
/** The Announcements page's glyph — a megaphone (ADR-098). */
export const MegaphoneIcon = lucide(Megaphone);
