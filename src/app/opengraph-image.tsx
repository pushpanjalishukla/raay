import { ImageResponse } from "next/og";

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
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 40, fontWeight: 700, letterSpacing: -1.5 }}>
          <div style={{ display: "flex", width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #ff7a2e, #e0336e)" }}>
            <svg width="56" height="56" viewBox="0 0 32 32">
              <rect x="6.5" y="7.5" width="19" height="13.5" rx="4.2" fill="#fff" />
              <path d="M10.2 20.2 L10.2 25.2 L15.4 20.6 Z" fill="#fff" />
              <rect x="10.6" y="14.6" width="2.6" height="3.6" rx="1.3" fill="#f05a3c" />
              <rect x="14.7" y="12.4" width="2.6" height="5.8" rx="1.3" fill="#ec4f4a" />
              <rect x="18.8" y="10.2" width="2.6" height="8" rx="1.3" fill="#e64258" />
            </svg>
          </div>
          raay
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
