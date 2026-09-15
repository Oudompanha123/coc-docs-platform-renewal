import type { ComponentType, SVGProps } from "react";
import { CoinsIcon, DocumentIcon, LayersIcon, PulseIcon, QuestionIcon, SparklesIcon, TagIcon } from "@/components/layout/icons";
import { ShieldIcon } from "@/components/auth/icons";
import type { IconKey } from "./content-types";

/** IconKey -> component, shared by the public content renderer and the
 *  admin editor's icon picker so both stay in sync with one list. */
export const ICON_MAP: Record<IconKey, ComponentType<SVGProps<SVGSVGElement>> | ComponentType<{ className?: string }>> = {
  sparkles: SparklesIcon,
  layers: LayersIcon,
  shield: ShieldIcon,
  pulse: PulseIcon,
  document: DocumentIcon,
  coins: CoinsIcon,
  tag: TagIcon,
  question: QuestionIcon,
};
