import React from 'react';

export type OrnamentCategory =
  | 'dividers'
  | 'corners'
  | 'frames'
  | 'chapter-openers'
  | 'drop-cap-frames';

export interface OrnamentDef {
  id: string;
  name: string;
  nameHe: string;
  category: OrnamentCategory;
  viewBox: string;
  svgContent: string;
}

export const ORNAMENTS: OrnamentDef[] = [
  // ─── DIVIDERS ───────────────────────────────────────────────────────────────
  {
    id: 'divider-classic',
    name: 'Classic Diamond',
    nameHe: 'יהלום קלאסי',
    category: 'dividers',
    viewBox: '0 0 400 20',
    svgContent: `
      <line x1="0" y1="9" x2="170" y2="9" stroke="currentColor" stroke-width="1"/>
      <line x1="0" y1="12" x2="165" y2="12" stroke="currentColor" stroke-width="0.4"/>
      <polygon points="200,3 208,10 200,17 192,10" fill="currentColor"/>
      <line x1="230" y1="9" x2="400" y2="9" stroke="currentColor" stroke-width="1"/>
      <line x1="235" y1="12" x2="400" y2="12" stroke="currentColor" stroke-width="0.4"/>
    `,
  },
  {
    id: 'divider-floral',
    name: 'Floral',
    nameHe: 'פרחוני',
    category: 'dividers',
    viewBox: '0 0 400 24',
    svgContent: `
      <line x1="0" y1="12" x2="150" y2="12" stroke="currentColor" stroke-width="0.8"/>
      <circle cx="170" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="1"/>
      <circle cx="200" cy="12" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/>
      <circle cx="200" cy="12" r="2.5" fill="currentColor"/>
      <circle cx="230" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="1"/>
      <line x1="250" y1="12" x2="400" y2="12" stroke="currentColor" stroke-width="0.8"/>
      <line x1="185" y1="6" x2="185" y2="18" stroke="currentColor" stroke-width="0.5" opacity="0.4"/>
      <line x1="215" y1="6" x2="215" y2="18" stroke="currentColor" stroke-width="0.5" opacity="0.4"/>
    `,
  },
  {
    id: 'divider-wave',
    name: 'Wave',
    nameHe: 'גל',
    category: 'dividers',
    viewBox: '0 0 400 14',
    svgContent: `
      <path d="M0,7 Q20,1 40,7 Q60,13 80,7 Q100,1 120,7 Q140,13 160,7
               Q180,1 200,7 Q220,13 240,7 Q260,1 280,7 Q300,13 320,7
               Q340,1 360,7 Q380,13 400,7"
            fill="none" stroke="currentColor" stroke-width="1.5"/>
    `,
  },
  {
    id: 'divider-dots',
    name: 'Dots',
    nameHe: 'נקודות',
    category: 'dividers',
    viewBox: '0 0 400 10',
    svgContent: `
      <circle cx="140" cy="5" r="2"   fill="currentColor" opacity="0.5"/>
      <circle cx="160" cy="5" r="2.5" fill="currentColor" opacity="0.7"/>
      <circle cx="180" cy="5" r="3"   fill="currentColor"/>
      <circle cx="200" cy="5" r="3.5" fill="currentColor"/>
      <circle cx="220" cy="5" r="3"   fill="currentColor"/>
      <circle cx="240" cy="5" r="2.5" fill="currentColor" opacity="0.7"/>
      <circle cx="260" cy="5" r="2"   fill="currentColor" opacity="0.5"/>
    `,
  },
  {
    id: 'divider-hebrew',
    name: 'Hebrew Star',
    nameHe: 'מגן דוד',
    category: 'dividers',
    viewBox: '0 0 400 28',
    svgContent: `
      <line x1="0"   y1="14" x2="165" y2="14" stroke="currentColor" stroke-width="0.8"/>
      <polygon points="200,4 206,16 194,16"  fill="none" stroke="currentColor" stroke-width="1.2"/>
      <polygon points="200,24 194,12 206,12" fill="none" stroke="currentColor" stroke-width="1.2"/>
      <line x1="235" y1="14" x2="400" y2="14" stroke="currentColor" stroke-width="0.8"/>
    `,
  },
  {
    id: 'divider-ornate',
    name: 'Ornate Scrollwork',
    nameHe: 'גלילות מפואר',
    category: 'dividers',
    viewBox: '0 0 400 24',
    svgContent: `
      <path d="M0,12 L155,12" stroke="currentColor" stroke-width="1"/>
      <path d="M155,12 Q165,6 175,12 Q185,18 195,12"
            fill="none" stroke="currentColor" stroke-width="1.2"/>
      <circle cx="200" cy="12" r="3" fill="currentColor"/>
      <path d="M205,12 Q215,6 225,12 Q235,18 245,12"
            fill="none" stroke="currentColor" stroke-width="1.2"/>
      <path d="M245,12 L400,12" stroke="currentColor" stroke-width="1"/>
    `,
  },
  {
    id: 'divider-modern',
    name: 'Modern',
    nameHe: 'מודרני',
    category: 'dividers',
    viewBox: '0 0 400 8',
    svgContent: `
      <line x1="0"   y1="4" x2="150" y2="4" stroke="currentColor" stroke-width="2"/>
      <line x1="162" y1="4" x2="238" y2="4" stroke="currentColor" stroke-width="1"/>
      <line x1="250" y1="4" x2="400" y2="4" stroke="currentColor" stroke-width="2"/>
      <rect x="152" y="2" width="8" height="4" fill="currentColor"/>
      <rect x="240" y="2" width="8" height="4" fill="currentColor"/>
    `,
  },

  // ─── CORNER DECORATIONS ─────────────────────────────────────────────────────
  {
    id: 'corner-flourish',
    name: 'Flourish',
    nameHe: 'פריחה',
    category: 'corners',
    viewBox: '0 0 60 60',
    svgContent: `
      <path d="M2,2 L58,2 L58,4 L4,4 L4,58 L2,58 Z" fill="currentColor" opacity="0.4"/>
      <path d="M6,6 Q6,20 6,30 Q20,6 30,6"
            fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="6"  cy="6"  r="3" fill="currentColor"/>
      <circle cx="30" cy="6"  r="2" fill="currentColor" opacity="0.6"/>
      <circle cx="6"  cy="30" r="2" fill="currentColor" opacity="0.6"/>
    `,
  },
  {
    id: 'corner-floral',
    name: 'Floral',
    nameHe: 'פרחוני פינה',
    category: 'corners',
    viewBox: '0 0 60 60',
    svgContent: `
      <path d="M0,0 L50,0 L50,3 L3,3 L3,50 L0,50 Z" fill="currentColor" opacity="0.5"/>
      <circle cx="12" cy="12" r="4"   fill="none" stroke="currentColor" stroke-width="1.2"/>
      <circle cx="12" cy="12" r="2"   fill="currentColor"/>
      <path d="M16,12 Q20,8 24,12"  fill="none" stroke="currentColor" stroke-width="1"/>
      <path d="M12,16 Q8,20 12,24"  fill="none" stroke="currentColor" stroke-width="1"/>
      <path d="M8,12  Q4,8  8,4"    fill="none" stroke="currentColor" stroke-width="0.8" opacity="0.5"/>
    `,
  },
  {
    id: 'corner-geometric',
    name: 'Geometric',
    nameHe: 'גיאומטרי',
    category: 'corners',
    viewBox: '0 0 60 60',
    svgContent: `
      <polyline points="0,40 0,0 40,0" fill="none" stroke="currentColor" stroke-width="2"/>
      <polyline points="0,30 0,8 8,0 30,0" fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
      <rect x="2" y="2" width="8" height="8" fill="currentColor" opacity="0.3"/>
    `,
  },
  {
    id: 'corner-hebrew',
    name: 'Menorah Corner',
    nameHe: 'פינת מנורה',
    category: 'corners',
    viewBox: '0 0 60 60',
    svgContent: `
      <path d="M2,2 L58,2 L58,4 L4,4 L4,58 L2,58 Z" fill="currentColor" opacity="0.35"/>
      <line x1="12" y1="30" x2="12" y2="14" stroke="currentColor" stroke-width="1.2"/>
      <line x1="18" y1="26" x2="18" y2="14" stroke="currentColor" stroke-width="1.2"/>
      <line x1="24" y1="22" x2="24" y2="14" stroke="currentColor" stroke-width="1.2"/>
      <line x1="18" y1="14" x2="18" y2="8"  stroke="currentColor" stroke-width="1.8"/>
      <line x1="12" y1="30" x2="24" y2="30" stroke="currentColor" stroke-width="1.2"/>
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
      <circle cx="18" cy="8"  r="2" fill="currentColor"/>
      <circle cx="24" cy="12" r="2" fill="currentColor"/>
    `,
  },

  // ─── PAGE FRAMES ────────────────────────────────────────────────────────────
  {
    id: 'frame-simple',
    name: 'Simple Frame',
    nameHe: 'מסגרת פשוטה',
    category: 'frames',
    viewBox: '0 0 200 260',
    svgContent: `
      <rect x="4"  y="4"  width="192" height="252" fill="none" stroke="currentColor" stroke-width="1.5"/>
    `,
  },
  {
    id: 'frame-double',
    name: 'Double Frame',
    nameHe: 'מסגרת כפולה',
    category: 'frames',
    viewBox: '0 0 200 260',
    svgContent: `
      <rect x="4"  y="4"  width="192" height="252" fill="none" stroke="currentColor" stroke-width="2"/>
      <rect x="10" y="10" width="180" height="240" fill="none" stroke="currentColor" stroke-width="0.8"/>
    `,
  },
  {
    id: 'frame-ornate',
    name: 'Ornate Frame',
    nameHe: 'מסגרת מפוארת',
    category: 'frames',
    viewBox: '0 0 200 260',
    svgContent: `
      <rect x="6"  y="6"  width="188" height="248" fill="none" stroke="currentColor" stroke-width="2"/>
      <rect x="12" y="12" width="176" height="236" fill="none" stroke="currentColor" stroke-width="0.8"/>
      <polygon points="100,2 103,6 100,10 97,6"  fill="currentColor"/>
      <polygon points="100,250 103,254 100,258 97,254" fill="currentColor"/>
      <polygon points="2,130 6,133 10,130 6,127"  fill="currentColor"/>
      <polygon points="190,130 194,133 198,130 194,127" fill="currentColor"/>
      <circle cx="6"   cy="6"   r="3" fill="currentColor" opacity="0.6"/>
      <circle cx="194" cy="6"   r="3" fill="currentColor" opacity="0.6"/>
      <circle cx="6"   cy="254" r="3" fill="currentColor" opacity="0.6"/>
      <circle cx="194" cy="254" r="3" fill="currentColor" opacity="0.6"/>
    `,
  },
  {
    id: 'frame-dots',
    name: 'Dotted Frame',
    nameHe: 'מסגרת נקודות',
    category: 'frames',
    viewBox: '0 0 200 260',
    svgContent: `
      <rect x="6" y="6" width="188" height="248" fill="none" stroke="currentColor"
            stroke-width="1.5" stroke-dasharray="4,4"/>
    `,
  },

  // ─── CHAPTER OPENERS ────────────────────────────────────────────────────────
  {
    id: 'opener-star',
    name: 'Star Burst',
    nameHe: 'כוכב',
    category: 'chapter-openers',
    viewBox: '0 0 80 40',
    svgContent: `
      <line x1="0"  y1="20" x2="25" y2="20" stroke="currentColor" stroke-width="0.8"/>
      <line x1="55" y1="20" x2="80" y2="20" stroke="currentColor" stroke-width="0.8"/>
      <polygon points="40,8 42,17 51,17 44,22 46,31 40,26 34,31 36,22 29,17 38,17"
               fill="currentColor" opacity="0.85"/>
    `,
  },
  {
    id: 'opener-scroll',
    name: 'Scroll',
    nameHe: 'מגילה',
    category: 'chapter-openers',
    viewBox: '0 0 80 40',
    svgContent: `
      <path d="M10,20 Q15,10 20,20 Q25,30 30,20 L50,20
               Q55,10 60,20 Q65,30 70,20"
            fill="none" stroke="currentColor" stroke-width="1.2"/>
      <circle cx="40" cy="20" r="4"   fill="none" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="40" cy="20" r="1.5" fill="currentColor"/>
    `,
  },
  {
    id: 'opener-floral',
    name: 'Floral Opener',
    nameHe: 'פתיחה פרחונית',
    category: 'chapter-openers',
    viewBox: '0 0 80 40',
    svgContent: `
      <line x1="0"  y1="20" x2="28" y2="20" stroke="currentColor" stroke-width="0.7" stroke-dasharray="3,2"/>
      <line x1="52" y1="20" x2="80" y2="20" stroke="currentColor" stroke-width="0.7" stroke-dasharray="3,2"/>
      <circle cx="40" cy="20" r="8"   fill="none" stroke="currentColor" stroke-width="1"/>
      <circle cx="40" cy="20" r="4"   fill="none" stroke="currentColor" stroke-width="0.8"/>
      <circle cx="40" cy="20" r="1.5" fill="currentColor"/>
      <circle cx="30" cy="20" r="2.5" fill="none" stroke="currentColor" stroke-width="0.8"/>
      <circle cx="50" cy="20" r="2.5" fill="none" stroke="currentColor" stroke-width="0.8"/>
      <circle cx="40" cy="10" r="2.5" fill="none" stroke="currentColor" stroke-width="0.8"/>
      <circle cx="40" cy="30" r="2.5" fill="none" stroke="currentColor" stroke-width="0.8"/>
    `,
  },

  // ─── DROP CAP FRAMES ────────────────────────────────────────────────────────
  {
    id: 'dropcap-box',
    name: 'Simple Box',
    nameHe: 'מסגרת פשוטה',
    category: 'drop-cap-frames',
    viewBox: '0 0 60 60',
    svgContent: `
      <rect x="2" y="2" width="56" height="56" fill="none" stroke="currentColor" stroke-width="2"/>
    `,
  },
  {
    id: 'dropcap-ornate',
    name: 'Ornate Box',
    nameHe: 'מסגרת מפוארת',
    category: 'drop-cap-frames',
    viewBox: '0 0 60 60',
    svgContent: `
      <rect x="2"  y="2"  width="56" height="56" fill="none" stroke="currentColor" stroke-width="2"/>
      <rect x="6"  y="6"  width="48" height="48" fill="none" stroke="currentColor" stroke-width="0.8"/>
      <polygon points="30,0 32,4 30,8 28,4"   fill="currentColor"/>
      <polygon points="30,52 32,56 30,60 28,56" fill="currentColor"/>
      <polygon points="0,30 4,32 8,30 4,28"   fill="currentColor"/>
      <polygon points="52,30 56,32 60,30 56,28" fill="currentColor"/>
    `,
  },
  {
    id: 'dropcap-circle',
    name: 'Circle Frame',
    nameHe: 'מסגרת עיגול',
    category: 'drop-cap-frames',
    viewBox: '0 0 60 60',
    svgContent: `
      <circle cx="30" cy="30" r="27" fill="none" stroke="currentColor" stroke-width="2"/>
      <circle cx="30" cy="30" r="23" fill="none" stroke="currentColor" stroke-width="0.6"/>
    `,
  },
];

// ─── Category metadata ─────────────────────────────────────────────────────

export interface OrnamentCategoryMeta {
  id: OrnamentCategory;
  label: string;
  labelHe: string;
}

export const ORNAMENT_CATEGORIES: OrnamentCategoryMeta[] = [
  { id: 'dividers',        label: 'Dividers',        labelHe: 'מפרידים'        },
  { id: 'corners',         label: 'Corners',          labelHe: 'פינות'          },
  { id: 'frames',          label: 'Frames',           labelHe: 'מסגרות'         },
  { id: 'chapter-openers', label: 'Chapter Openers',  labelHe: 'פתיחות פרק'    },
  { id: 'drop-cap-frames', label: 'Drop Cap Frames',  labelHe: 'מסגרות אות ראשה' },
];

/** Flat list of all ornament IDs — useful for pickers / validation. */
export const ORNAMENTS_LIST: string[] = ORNAMENTS.map((o) => o.id);

// ─── Renderer ──────────────────────────────────────────────────────────────

export interface OrnamentRendererProps {
  id: string;
  color?: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

export function OrnamentRenderer({
  id,
  color = 'currentColor',
  width = '100%',
  height = 'auto',
  className = '',
  style,
}: OrnamentRendererProps) {
  const ornament = ORNAMENTS.find((o) => o.id === id);
  if (!ornament) return null;

  return (
    <svg
      viewBox={ornament.viewBox}
      width={width}
      height={height}
      className={className}
      style={{ color, ...style }}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: ornament.svgContent }}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    />
  );
}

// ─── Utility helpers ───────────────────────────────────────────────────────

/** Return all ornaments belonging to a given category. */
export function getOrnamentsByCategory(category: OrnamentCategory): OrnamentDef[] {
  return ORNAMENTS.filter((o) => o.category === category);
}

/** Return the definition for a single ornament by ID. */
export function getOrnamentById(id: string): OrnamentDef | undefined {
  return ORNAMENTS.find((o) => o.id === id);
}

export default OrnamentRenderer;
