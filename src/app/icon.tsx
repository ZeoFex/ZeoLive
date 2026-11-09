import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 16,
          background:
            "linear-gradient(145deg, #19b7f5 0%, #0066cc 48%, #004f9a 100%)",
          color: "white",
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: 1.5,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        ZTL
      </div>
    ),
    { ...size }
  );
}
