import type { SVGProps } from "react";

export type IconComponent = (props: SVGProps<SVGSVGElement>) => React.JSX.Element;

function base(props: SVGProps<SVGSVGElement>) {
  return { viewBox: "0 0 24 24", fill: "none" as const, "aria-hidden": true as const, ...props };
}

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M4 11.5 12 4l8 7.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function FolderIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path
        d="M4 6.5A1.5 1.5 0 0 1 5.5 5h4l2 2.5h7A1.5 1.5 0 0 1 20 9v8.5A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-11Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LayersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M12 3.5 4 8l8 4.5L20 8l-8-4.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M4 12l8 4.5L20 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16l8 4.5L20 16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SparklesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path
        d="M11 3.5c.4 2.3 1 3.7 2 4.7 1 1 2.4 1.6 4.7 2-2.3.4-3.7 1-4.7 2-1 1-1.6 2.4-2 4.7-.4-2.3-1-3.7-2-4.7-1-1-2.4-1.6-4.7-2 2.3-.4 3.7-1 4.7-2 1-1 1.6-2.4 2-4.7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M18.5 16v3.5M20.25 17.75h-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function PlugIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M9 3.5v4M15 3.5v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path
        d="M6.5 7.5h11v3a5.5 5.5 0 0 1-11 0v-3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M12 16v4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function PulseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path
        d="M3.5 12h3.5l2-5.5 3 11 2-8 1.5 2.5h4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HeartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path
        d="M12 20s-7-4.4-9.3-9A5 5 0 0 1 12 6.5 5 5 0 0 1 21.3 11c-2.3 4.6-9.3 9-9.3 9Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="8.5" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M2.8 19c1.1-3 3.4-4.5 6.2-4.5s5.1 1.5 6.2 4.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M15.5 6a3 3 0 0 1 0 5.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16 14.6c2.2.4 3.8 1.8 4.7 4.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function CameraIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path
        d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function MonitorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function GearIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 3.8v2.1M12 18.1v2.1M20.2 12h-2.1M5.9 12H3.8M17.6 6.4l-1.5 1.5M7.9 16.1l-1.5 1.5M17.6 17.6l-1.5-1.5M7.9 7.9 6.4 6.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SettingsIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.43 13c.04-.32.07-.65.07-1s-.03-.68-.07-1l2.11-1.63a.5.5 0 0 0 .12-.63l-2-3.46a.5.5 0 0 0-.61-.22l-2.49.99a7.5 7.5 0 0 0-1.68-.97l-.38-2.65A.49.49 0 0 0 14 2h-4a.49.49 0 0 0-.49.43l-.38 2.65a7.5 7.5 0 0 0-1.68.97l-2.49-.99a.49.49 0 0 0-.61.22l-2 3.46a.49.49 0 0 0 .12.63L4.57 11c-.04.32-.07.64-.07 1s.03.68.07 1l-2.11 1.63a.5.5 0 0 0-.12.63l2 3.46c.12.22.38.3.61.22l2.49-.99c.52.38 1.08.7 1.68.97l.38 2.65c.06.25.26.43.49.43h4c.23 0 .43-.18.49-.43l.38-2.65a7.5 7.5 0 0 0 1.68-.97l2.49.99c.23.08.49 0 .61-.22l2-3.46a.49.49 0 0 0-.12-.63L19.43 13Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path
        d="M20 14.2A8.2 8.2 0 1 1 9.8 4a6.6 6.6 0 0 0 10.2 10.2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BellIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path
        d="M6 10.5a6 6 0 0 1 12 0c0 4 1.5 5 1.5 5h-15s1.5-1 1.5-5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M10 18.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function MailIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <rect x="3" y="5.5" width="18" height="13" rx="1.6" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4 6.5 12 13l8-6.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChevronDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M6 9.5 12 15l6-5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function UserPlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="8.5" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M2.8 19.3c1.1-3.2 3.5-4.8 6.2-4.8s5.1 1.6 6.2 4.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M18 7.5v5M20.5 10h-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function BarChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M5 20V10M12 20V4M19 20v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function DatabaseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <ellipse cx="12" cy="6" rx="7" ry="2.6" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function DocumentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path
        d="M7 3.5h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M14 3.5V8h4" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 12.5h6M9 15.5h6M9 18.5h3.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.1 5.9l-1.7 1.7M7.6 16.5l-1.7 1.7M18.1 18.1l-1.7-1.7M7.6 7.5 5.9 5.9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PersonIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function LogOutIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M9 20H5.5a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 5.5 4H9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.5 16.5 20 12l-4.5-4.5M20 12H9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...base(props)}>
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
