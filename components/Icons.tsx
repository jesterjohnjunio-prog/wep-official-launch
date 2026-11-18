import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;

const base = (props: P) => ({
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
});

export const Calendar = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
    <path d="M16 3v3M8 3v3M3 9.5h18" />
  </svg>
);
export const Clock = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const MapPin = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);
export const ArrowRight = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const ArrowLeft = (p: P) => (
  <svg {...base(p)}>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </svg>
);
export const Check = (p: P) => (
  <svg {...base(p)}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
export const Shield = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.3 7.5 9.5 4.3-1.2 7.5-4.9 7.5-9.5V6L12 3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
export const Alert = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.5v.01" />
  </svg>
);
export const Info = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5M12 7.5v.01" />
  </svg>
);
export const Users = (p: P) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
  </svg>
);
export const Building = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 21h18M5 21V9l7-5 7 5v12" />
    <path d="M9 21v-6h6v6M9.5 11h.01M14.5 11h.01" />
  </svg>
);
export const Copy = (p: P) => (
  <svg {...base(p)}>
    <rect x="8" y="8" width="13" height="13" rx="2.5" />
    <path d="M16 8V5.5A2.5 2.5 0 0 0 13.5 3h-8A2.5 2.5 0 0 0 3 5.5v8A2.5 2.5 0 0 0 5.5 16H8" />
  </svg>
);
export const Download = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3v12M7 10l5 5 5-5M4 20h16" />
  </svg>
);
export const Refresh = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 11a8 8 0 0 0-14.7-4.4L4 8M4 3.5V8h4.5M4 13a8 8 0 0 0 14.7 4.4L20 16M20 20.5V16h-4.5" />
  </svg>
);
export const LogOut = (p: P) => (
  <svg {...base(p)}>
    <path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15M10 16.5 5.5 12 10 7.5M5.5 12H15" />
  </svg>
);
export const Search = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);
export const X = (p: P) => (
  <svg {...base(p)}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
export const Printer = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
    <rect x="7" y="14" width="10" height="7" rx="1" />
  </svg>
);
export const Sheet = (p: P) => (
  <svg {...base(p)}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M4 9h16M4 15h16M10 3v18" />
  </svg>
);
export const FileText = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </svg>
);
export const Lock = (p: P) => (
  <svg {...base(p)}>
    <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" />
    <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
  </svg>
);
export const ChevronDown = (p: P) => (
  <svg {...base(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);
export const Sparkle = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <path d="M12 2.5c.5 4.6 2.9 7 7.5 7.5-4.6.5-7 2.9-7.5 7.5-.5-4.6-2.9-7-7.5-7.5 4.6-.5 7-2.9 7.5-7.5Z" />
    <path d="M19 15.5c.25 2 1.25 3 3.25 3.25-2 .25-3 1.25-3.25 3.25-.25-2-1.25-3-3.25-3.25 2-.25 3-1.25 3.25-3.25Z" />
  </svg>
);
export const CalendarPlus = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="4.5" width="18" height="16.5" rx="2.5" />
    <path d="M16 3v3M8 3v3M3 9.5h18M12 12.5v5M9.5 15h5" />
  </svg>
);
export const Database = (p: P) => (
  <svg {...base(p)}>
    <ellipse cx="12" cy="5.5" rx="8" ry="3" />
    <path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
  </svg>
);
/** QR-code scanner: corner brackets around a small code. */
export const ScanQr = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 8V5.5A2.5 2.5 0 0 1 5.5 3H8M16 3h2.5A2.5 2.5 0 0 1 21 5.5V8M21 16v2.5a2.5 2.5 0 0 1-2.5 2.5H16M8 21H5.5A2.5 2.5 0 0 1 3 18.5V16" />
    <rect x="7" y="7" width="4" height="4" rx="0.6" />
    <rect x="13" y="13" width="4" height="4" rx="0.6" />
    <path d="M13 7h4v2M7 15v2h2" />
  </svg>
);
export const Mail = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7 8 6 8-6" />
  </svg>
);
export const ClipboardList = (p: P) => (
  <svg {...base(p)}>
    <rect x="5" y="4" width="14" height="17" rx="2.5" />
    <path d="M9 4V3h6v1M9 10h6M9 14h6M9 18h3" />
  </svg>
);
export const Eye = (p: P) => (
  <svg {...base(p)}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
export const EyeOff = (p: P) => (
  <svg {...base(p)}>
    <path d="M10.6 5.6c.5-.1.9-.1 1.4-.1 6 0 9.5 6.5 9.5 6.5a16.6 16.6 0 0 1-2.6 3.4M6.6 6.6C3.9 8.4 2.5 12 2.5 12S6 18.5 12 18.5c1.9 0 3.6-.6 5-1.5" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
  </svg>
);
