// RideIcons.jsx
// Small inline icon set in a lucide-style visual language (24x24 viewBox,
// stroke=currentColor, strokeWidth 2, rounded caps/joins) — replaces emoji
// across RideDetailPage. Kept as local components rather than adding
// lucide-react as a dependency, since I haven't seen your package.json and
// don't want to guess whether it's already installed. If it IS already in
// your project, these are drop-in replaceable later — same idea
// (currentColor stroke icons) — without touching any layout code.
export function IconArrowLeft({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

export function IconArrowRight({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconArrowDown({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
  );
}

export function IconHeart({ className, filled }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20.5s-7-4.35-9.5-8.5C.8 8.5 1.8 4.8 5.2 3.7c2.3-.7 4.6.2 6.8 2.6 2.2-2.4 4.5-3.3 6.8-2.6 3.4 1.1 4.4 4.8 2.7 8.3-2.5 4.15-9.5 8.5-9.5 8.5Z" />
    </svg>
  );
}

export function IconCalendar({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
    </svg>
  );
}

export function IconClock({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function IconUsers({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20c0-3.4 3-6 6.5-6s6.5 2.6 6.5 6" />
      <circle cx="17" cy="9" r="2.6" />
      <path d="M15 14.2c2.6.6 4.5 2.5 5 5.8" />
    </svg>
  );
}

export function IconUserRound({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  );
}

export function IconCar({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 13l1.6-4.8A2 2 0 0 1 7 6.8h10a2 2 0 0 1 1.9 1.4L20.5 13" />
      <rect x="2.5" y="13" width="19" height="5.5" rx="1.5" />
      <circle cx="7" cy="18.5" r="1.6" />
      <circle cx="17" cy="18.5" r="1.6" />
    </svg>
  );
}

export function IconBike({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="17.5" r="3.2" />
      <circle cx="18.5" cy="17.5" r="3.2" />
      <path d="M5.5 17.5l3.8-8h4.2l3.4 5.5M9.3 9.5h3.4" />
    </svg>
  );
}

export function IconStar({ className, filled }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2.5 14.9 9 22 9.6 16.7 14.3 18.3 21.3 12 17.6 5.7 21.3 7.3 14.3 2 9.6 9.1 9" />
    </svg>
  );
}

export function IconShieldCheck({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.5l7.5 3.3v5.4c0 5.2-3.4 8.9-7.5 10.3-4.1-1.4-7.5-5.1-7.5-10.3V5.8Z" />
      <path d="M8.7 12.2l2.3 2.3 4.3-4.6" />
    </svg>
  );
}

export function IconPencil({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4.2 1 1-4.2Z" />
    </svg>
  );
}

export function IconTrash({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 6.5h17" />
      <path d="M8.5 6.5V4.2A1.7 1.7 0 0 1 10.2 2.5h3.6a1.7 1.7 0 0 1 1.7 1.7v2.3" />
      <path d="M18.8 6.5l-.9 13a2 2 0 0 1-2 1.9H8.1a2 2 0 0 1-2-1.9l-.9-13" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

export function IconCheck({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function IconX({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}