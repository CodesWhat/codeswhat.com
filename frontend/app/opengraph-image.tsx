import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "CodesWhat - Digital Solutions & Consulting";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: "linear-gradient(to bottom right, #f5f5f5, #e5e5e5)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 72,
            fontWeight: "bold",
            marginBottom: 20,
          }}
        >
          <span style={{ color: "#171717" }}>C</span>
          <span style={{ color: "#C4FF00" }}>?</span>
          <span style={{ color: "#171717" }}>W</span>
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#525252",
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          Where curiosity meets code
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
