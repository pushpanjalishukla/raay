import { ImageResponse } from "next/og";
import { RAAY_BUBBLE, RAAY_ORANGE, RAAY_R } from "@/components/Logo";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#121211" }}>
        <svg width="180" height="180" viewBox="0 0 64 64">
          <g transform="translate(-3.4 0)">
            <path d={RAAY_R} fill="#fff" />
            <g transform="translate(40.6 35.3) scale(0.26)">
              <path d={RAAY_BUBBLE} transform="translate(-10 -9)" fill={RAAY_ORANGE} />
            </g>
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
