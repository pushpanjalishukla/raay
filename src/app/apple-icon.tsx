import { ImageResponse } from "next/og";
import { RAAY_ORANGE, RAAY_R } from "@/components/Logo";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#121211" }}>
        <svg width="180" height="180" viewBox="0 0 64 64">
          <g transform="translate(-2.4 0)">
            <path d={RAAY_R} fill="#fff" />
            <rect x="41.4" y="37.8" width="8.2" height="8.2" fill={RAAY_ORANGE} />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
