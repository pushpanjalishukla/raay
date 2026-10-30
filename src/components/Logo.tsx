/**
 * Raay mark: an eye drawn as a speech bubble. Users speak (राय, "opinion"),
 * Raay sees what they mean. One ink colour plus the brand orange.
 */
export const RAAY_ORANGE = "#FF5A1F";
export const RAAY_EYE =
  "M10 32A25.1 25.1 0 0 1 54 32A25.1 25.1 0 0 1 24.5 43.87L10.5 51L15.5 38.83A25.1 25.1 0 0 1 10 32Z" +
  "M42.6 32A10.6 10.6 0 1 0 21.4 32A10.6 10.6 0 1 0 42.6 32Z";

/** The bare mark in the current text colour. `size` is its height in px. */
export function LogoMark({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg height={size} width={(size * 48) / 38} viewBox="8 16 48 38" className={className} aria-hidden>
      <path d={RAAY_EYE} fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="32" cy="32" r="5.2" fill={RAAY_ORANGE} />
    </svg>
  );
}

/** The mark on a dark rounded tile, for app-icon style placements. */
export function LogoTile({ size = 44, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="15" fill="#121211" />
      <g transform="translate(-3.84 -7.2) scale(1.12)">
        <path d={RAAY_EYE} fill="#F2EFE9" stroke="#F2EFE9" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="32" cy="32" r="5.2" fill={RAAY_ORANGE} />
      </g>
    </svg>
  );
}

export default function Logo() {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={21} />
      <span className="text-[21px] font-semibold tracking-[-0.045em] leading-none -mt-0.5">raay</span>
    </span>
  );
}
