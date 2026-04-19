/**
 * BookLoader — reusable loading animation
 *
 * Shows an open book with continuously flipping pages and the MeStory logo.
 *
 * Variants:
 *  - "fullscreen"  — takes the whole viewport (replaces LoadingScreen)
 *  - "overlay"     — absolute overlay over parent container (semi-transparent bg)
 *  - "inline"      — small inline spinner (replaces Loader2 in buttons / cards)
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';

interface BookLoaderProps {
  variant?: 'fullscreen' | 'overlay' | 'inline';
  /** Message shown below the book — defaults to 'טוען...' */
  message?: string;
  /** Show the MeStory logo above the book (default true for fullscreen/overlay) */
  showLogo?: boolean;
  className?: string;
}

// ─── Animated open-book SVG ──────────────────────────────────────────────────
function BookAnimation({ size = 120 }: { size?: number }) {
  // We cycle through 3 pages flipping in sequence
  const [activeFlip, setActiveFlip] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActiveFlip(p => (p + 1) % 3), 600);
    return () => clearInterval(id);
  }, []);

  const s = size;
  const half = s / 2;
  const pageW = half - 6;       // width of each page half
  const pageH = s * 0.72;       // height of the open book
  const spineW = 10;            // width of spine
  const topY = (s - pageH) / 2; // vertical centering

  // Gold shades
  const gold   = '#c9a84c';
  const goldDk = '#8b6914';
  const goldLt = '#f0d080';
  const cream  = '#fdf6e3';
  const creamDk= '#e8dcc8';
  const shadow = 'rgba(0,0,0,0.18)';

  // Tiny "text lines" drawn on each page
  const lineStroke = '#c8b89a';
  const lines = (x0: number, width: number) =>
    [0.22, 0.32, 0.42, 0.52, 0.62, 0.72, 0.82].map(frac => (
      <line
        key={frac}
        x1={x0 + 8}
        y1={topY + pageH * frac}
        x2={x0 + width - 8}
        y2={topY + pageH * frac}
        stroke={lineStroke}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    ));

  // The flipping page starts on the right half and rotates to the left
  // We use a CSS transform-origin at the spine centre
  const flipVariants = {
    idle:     { rotateY: 0,    opacity: 1,   transition: { duration: 0 } },
    flipping: { rotateY: -180, opacity: 1,   transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] } },
    gone:     { rotateY: -180, opacity: 0,   transition: { duration: 0 } },
  };

  const getFlipState = (idx: number) => {
    if (activeFlip === idx) return 'flipping';
    if (activeFlip > idx || (activeFlip === 0 && idx === 2)) return 'idle';
    return 'idle';
  };

  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.35))' }}
    >
      <defs>
        <linearGradient id="bgLeft" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={cream} />
          <stop offset="100%" stopColor={creamDk} />
        </linearGradient>
        <linearGradient id="bgRight" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cream} />
          <stop offset="100%" stopColor={creamDk} />
        </linearGradient>
        <linearGradient id="spine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={goldDk} />
          <stop offset="50%" stopColor={gold} />
          <stop offset="100%" stopColor={goldDk} />
        </linearGradient>
        <linearGradient id="cover" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gold} />
          <stop offset="100%" stopColor={goldDk} />
        </linearGradient>
        <linearGradient id="flipPage" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e8dcc8" />
          <stop offset="100%" stopColor="#f8f0e0" />
        </linearGradient>
        {/* Shadow under the open book */}
        <filter id="bookShadow" x="-10%" y="-5%" width="120%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="rgba(0,0,0,0.25)" />
        </filter>
      </defs>

      {/* ── Left page (static) ── */}
      <rect
        x={half - spineW / 2 - pageW}
        y={topY}
        width={pageW}
        height={pageH}
        rx="3"
        fill="url(#bgLeft)"
        stroke={creamDk}
        strokeWidth="0.5"
      />
      {lines(half - spineW / 2 - pageW, pageW)}

      {/* ── Right page (static base) ── */}
      <rect
        x={half + spineW / 2}
        y={topY}
        width={pageW}
        height={pageH}
        rx="3"
        fill="url(#bgRight)"
        stroke={creamDk}
        strokeWidth="0.5"
      />
      {lines(half + spineW / 2, pageW)}

      {/* ── 3 stacked flipping pages (CSS 3D + framer) ── */}
      {[0, 1, 2].map(idx => (
        <motion.g
          key={idx}
          style={{
            originX: `${half + spineW / 2}px`,
            originY: `${topY + pageH / 2}px`,
            transformOrigin: `${half + spineW / 2}px ${topY + pageH / 2}px`,
          }}
          variants={flipVariants}
          animate={getFlipState(idx)}
        >
          <rect
            x={half + spineW / 2}
            y={topY + idx * 1.5}
            width={pageW - idx}
            height={pageH - idx * 3}
            rx="2"
            fill="url(#flipPage)"
            stroke={creamDk}
            strokeWidth="0.5"
            opacity={1 - idx * 0.15}
          />
          {/* Subtle page curl line */}
          <line
            x1={half + spineW / 2 + pageW - idx - 1}
            y1={topY + pageH - idx * 3 - 6}
            x2={half + spineW / 2 + pageW - idx + 4}
            y2={topY + pageH - idx * 3 + 4}
            stroke={creamDk}
            strokeWidth="1"
            strokeLinecap="round"
          />
        </motion.g>
      ))}

      {/* ── Spine ── */}
      <rect
        x={half - spineW / 2}
        y={topY}
        width={spineW}
        height={pageH}
        fill="url(#spine)"
      />
      {/* Spine highlight */}
      <rect
        x={half - spineW / 2 + 2}
        y={topY + 4}
        width={2}
        height={pageH - 8}
        rx="1"
        fill={goldLt}
        opacity="0.5"
      />

      {/* ── Book cover edges (bottom/top strips) ── */}
      <rect x={half - spineW / 2 - pageW} y={topY} width={pageW + spineW / 2} height={4} rx="1" fill={gold} opacity="0.5" />
      <rect x={half} y={topY} width={pageW + spineW / 2} height={4} rx="1" fill={gold} opacity="0.5" />
      <rect x={half - spineW / 2 - pageW} y={topY + pageH - 4} width={pageW + spineW / 2} height={4} rx="1" fill={goldDk} opacity="0.6" />
      <rect x={half} y={topY + pageH - 4} width={pageW + spineW / 2} height={4} rx="1" fill={goldDk} opacity="0.6" />

      {/* ── Small decorative star on spine ── */}
      <text x={half} y={topY + pageH / 2 + 4} textAnchor="middle" fontSize="8" fill={goldLt} opacity="0.8">✦</text>

      {/* ── Ground shadow ── */}
      <ellipse
        cx={half}
        cy={topY + pageH + 10}
        rx={pageW * 0.9}
        ry={6}
        fill={shadow}
      />
    </svg>
  );
}

// ─── Tiny inline book icon (for buttons / small placeholders) ────────────────
function MiniBookIcon({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="miniSpine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b6914" />
            <stop offset="50%" stopColor="#c9a84c" />
            <stop offset="100%" stopColor="#8b6914" />
          </linearGradient>
        </defs>
        {/* Left page */}
        <rect x="1" y="3" width="7.5" height="14" rx="1" fill="#fdf6e3" stroke="#e8dcc8" strokeWidth="0.5" />
        {/* Right page */}
        <rect x="11.5" y="3" width="7.5" height="14" rx="1" fill="#fdf6e3" stroke="#e8dcc8" strokeWidth="0.5" />
        {/* Spine */}
        <rect x="8.5" y="3" width="3" height="14" fill="url(#miniSpine)" />
        {/* Lines */}
        {[5, 7.5, 10, 12.5].map(y => (
          <line key={y} x1="2.5" y1={y} x2="7.5" y2={y} stroke="#c8b89a" strokeWidth="0.8" strokeLinecap="round" />
        ))}
        {[5, 7.5, 10, 12.5].map(y => (
          <line key={y + 20} x1="12.5" y1={y} x2="18" y2={y} stroke="#c8b89a" strokeWidth="0.8" strokeLinecap="round" />
        ))}
      </svg>
    </span>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────
export default function BookLoader({
  variant = 'fullscreen',
  message,
  showLogo,
  className = '',
}: BookLoaderProps) {
  const { language } = useLanguage();
  const isHebrew = language === 'he';
  const isFullOrOverlay = variant === 'fullscreen' || variant === 'overlay';
  const autoShowLogo = showLogo !== undefined ? showLogo : isFullOrOverlay;

  // ── Inline variant ────────────────────────────────────────────────────────
  if (variant === 'inline') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 text-memorial-gold ${className}`}
        aria-label="Loading"
      >
        <span className="book-loader-mini">
          <MiniBookIcon className="animate-pulse" />
        </span>
        {message && <span className="text-sm text-gray-400">{message}</span>}
      </span>
    );
  }

  // ── Shared animated content ───────────────────────────────────────────────
  const content = (
    <div className="flex flex-col items-center gap-4 select-none">
      {/* Logo text instead of image to avoid white-background issue */}
      {autoShowLogo && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-1 mb-2"
        >
          <img
            src="/img/new/logo-mestory-large.png"
            alt="MeStory"
            className="h-20 w-auto object-contain nav-logo-glow"
          />
        </motion.div>
      )}

      {/* Book animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45, delay: 0.1 }}
      >
        <BookAnimation size={isFullOrOverlay ? 120 : 80} />
      </motion.div>

      {/* Message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="text-memorial-gold/80 text-sm tracking-wide font-light mt-1"
      >
        {message ?? (isHebrew ? 'טוען...' : 'Loading...')}
      </motion.p>

      {/* Animated progress dots */}
      <motion.div
        className="flex gap-1.5 mt-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-memorial-gold"
            animate={{ opacity: [0.25, 1, 0.25], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.22 }}
          />
        ))}
      </motion.div>
    </div>
  );

  // ── Overlay variant ───────────────────────────────────────────────────────
  if (variant === 'overlay') {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40 rounded-inherit ${className}`}
        >
          {content}
        </motion.div>
      </AnimatePresence>
    );
  }

  // ── Fullscreen variant ────────────────────────────────────────────────────
  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center
        bg-gradient-to-br from-[#0d0d1a] via-[#12101e] to-[#0a0a14] ${className}`}
    >
      {/* Subtle starfield */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(28)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: i % 5 === 0 ? 3 : 1.5,
              height: i % 5 === 0 ? 3 : 1.5,
              left: `${(i * 37 + 11) % 100}%`,
              top: `${(i * 53 + 7) % 100}%`,
              backgroundColor: i % 3 === 0 ? '#c9a84c' : 'rgba(255,255,255,0.6)',
            }}
            animate={{ opacity: [0.1, i % 4 === 0 ? 0.9 : 0.5, 0.1], scale: [1, 1.4, 1] }}
            transition={{ duration: 2.5 + (i % 4) * 0.8, repeat: Infinity, delay: (i * 0.19) % 3 }}
          />
        ))}
      </div>

      {/* Warm glow behind the book */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 260,
          height: 260,
          background: 'radial-gradient(circle, rgba(201,168,76,0.12) 0%, transparent 70%)',
        }}
      />

      {content}
    </div>
  );
}

// Named export for convenience
export { MiniBookIcon };
