import { ImageResponse } from "next/og";
import { RAAY_EYE, RAAY_ORANGE } from "@/components/Logo";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#121211" }}>
        <svg width="180" height="180" viewBox="0 0 64 64">
          <g transform="translate(-3.84 -7.2) scale(1.12)">
            <path d={RAAY_EYE} fill="#F2EFE9" stroke="#F2EFE9" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="32" cy="32" r="5.2" fill={RAAY_ORANGE} />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
