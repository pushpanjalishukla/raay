import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "linear-gradient(135deg, #ff7a2e, #e0336e)" }}>
        <svg width="180" height="180" viewBox="0 0 32 32">
          <rect x="6.5" y="7.5" width="19" height="13.5" rx="4.2" fill="#fff" />
          <path d="M10.2 20.2 L10.2 25.2 L15.4 20.6 Z" fill="#fff" />
          <rect x="10.6" y="14.6" width="2.6" height="3.6" rx="1.3" fill="#f05a3c" />
          <rect x="14.7" y="12.4" width="2.6" height="5.8" rx="1.3" fill="#ec4f4a" />
          <rect x="18.8" y="10.2" width="2.6" height="8" rx="1.3" fill="#e64258" />
        </svg>
      </div>
    ),
    size,
  );
}
