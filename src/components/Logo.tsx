/**
 * Raay brand: a bold lowercase wordmark whose full stop is a small orange
 * speech bubble (राय means "opinion"), and an "r" + bubble app icon.
 */
export const RAAY_ORANGE = "#FF5A1F";
/** Geometric lowercase r in a 64×64 box (icons can't rely on web fonts). */
export const RAAY_R = "M21 46V19.5h7.6v4.9c1.8-3.4 4.8-5.4 9-5.4h4.9v7.6h-4.1c-6.1 0-9.4 3-9.4 9V46Z";
/** Speech bubble: a circle with one square corner. Fills the box "10 9 44 44". */
export const RAAY_BUBBLE = "M32 10A21 21 0 0 1 53 31A21 21 0 0 1 32 52H11V31A21 21 0 0 1 32 10Z";

/** The bubble full stop, sized in em so it scales with the wordmark. */
export function BubbleDot({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="10 9 44 44"
      className={`inline-block h-[0.25em] w-[0.25em] ml-[0.03em] align-baseline ${className}`}
      aria-hidden
    >
      <path d={RAAY_BUBBLE} fill={RAAY_ORANGE} />
    </svg>
  );
}

/** "r" + bubble on a dark rounded tile: favicon, app icon, sign-in page. */
export function LogoTile({ size = 44, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="15" fill="#121211" />
      <g transform="translate(-3.4 0)">
        <path d={RAAY_R} fill="#fff" />
        <g transform="translate(40.6 35.3) scale(0.26)">
          <path d={RAAY_BUBBLE} transform="translate(-10 -9)" fill={RAAY_ORANGE} />
        </g>
      </g>
    </svg>
  );
}

export default function Logo() {
  return (
    <span className="text-[23px] font-bold tracking-[-0.05em] leading-none whitespace-nowrap">
      raay
      <BubbleDot />
    </span>
  );
}
