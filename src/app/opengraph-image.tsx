import { ImageResponse } from "next/og";
import { RAAY_ORANGE } from "@/components/Logo";

export const alt = "Raay: app review intelligence for Indian apps";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BARS = [
  { label: "Orders & delivery", value: 54 },
  { label: "Payments & refunds", value: 21 },
  { label: "Login & OTP", value: 12 },
  { label: "Customer support", value: 8 },
];

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#121211",
          color: "#ffffff",
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 52, fontWeight: 700, letterSpacing: -3 }}>
          raay<span style={{ color: RAAY_ORANGE }}>.</span>
        </div>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1.1, marginTop: 40, maxWidth: 1000 }}>
          Your users already told you what to fix.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 48 }}>
          {BARS.map((b) => (
            <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 26 }}>
              <div style={{ width: 290, color: "#c3c2b7", display: "flex" }}>{b.label}</div>
              <div style={{ width: b.value * 11, height: 22, background: "#3987e5", borderRadius: "0 4px 4px 0" }} />
              <div style={{ display: "flex" }}>{b.value}%</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", marginTop: "auto", fontSize: 26, color: "#8f8e86" }}>
          App review intelligence for Indian apps · Hinglish, Hindi & English
        </div>
      </div>
    ),
    size,
  );
}
