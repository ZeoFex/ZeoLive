import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 40,
          background:
            "linear-gradient(145deg, #19b7f5 0%, #0066cc 48%, #004f9a 100%)",
          color: "white",
          fontSize: 58,
          fontWeight: 800,
          letterSpacing: 3,
          fontFamily: "system-ui, sans-serif",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28)",
        }}
      >
        ZTL
      </div>
    ),
    { ...size }
  );
}
