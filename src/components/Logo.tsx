import { useId } from "react";

/**
 * Raay mark: a speech bubble (an opinion, "राय") holding three rising bars
 * (the insight Raay pulls out of it), on the brand gradient.
 */
export function LogoMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id={`rg${id}`} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ff7a2e" />
          <stop offset="1" stopColor="#e0336e" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#rg${id})`} />
      <rect x="6.5" y="7.5" width="19" height="13.5" rx="4.2" fill="#fff" />
      <path d="M10.2 20.2 L10.2 25.2 L15.4 20.6 Z" fill="#fff" />
      <rect x="10.6" y="14.6" width="2.6" height="3.6" rx="1.3" fill={`url(#rg${id})`} />
      <rect x="14.7" y="12.4" width="2.6" height="5.8" rx="1.3" fill={`url(#rg${id})`} />
      <rect x="18.8" y="10.2" width="2.6" height="8" rx="1.3" fill={`url(#rg${id})`} />
    </svg>
  );
}

export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoMark size={size} />
      <span className="text-[19px] font-semibold tracking-[-0.04em] leading-none">raay</span>
    </span>
  );
}
