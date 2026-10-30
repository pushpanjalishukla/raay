/**
 * Raay brand: a bold lowercase wordmark with an orange full stop, and an
 * "r." app icon for places where the wordmark is too wide.
 */
export const RAAY_ORANGE = "#FF5A1F";
/** Geometric lowercase r in a 64×64 box (icons can't rely on web fonts). */
export const RAAY_R = "M21 46V19.5h7.6v4.9c1.8-3.4 4.8-5.4 9-5.4h4.9v7.6h-4.1c-6.1 0-9.4 3-9.4 9V46Z";

/** "r." on a dark rounded tile: favicon, app icon, sign-in page. */
export function LogoTile({ size = 44, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="15" fill="#121211" />
      <g transform="translate(-2.4 0)">
        <path d={RAAY_R} fill="#fff" />
        <rect x="41.4" y="37.8" width="8.2" height="8.2" fill={RAAY_ORANGE} />
      </g>
    </svg>
  );
}

export default function Logo() {
  return (
    <span className="text-[23px] font-bold tracking-[-0.055em] leading-none">
      raay<span style={{ color: RAAY_ORANGE }}>.</span>
    </span>
  );
}
