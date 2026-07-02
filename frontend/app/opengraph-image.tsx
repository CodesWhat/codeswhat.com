import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt =
  "CodesWhat — open-source developer tools for containers, security, and automation";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        padding: "72px 84px",
        background: "linear-gradient(135deg, #070809 0%, #0a110b 58%, #0e1a10 100%)",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: "#c4ff00",
        }}
      >
        Open Source · Developer Tools
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", fontSize: 108, fontWeight: 800, letterSpacing: -2 }}>
          <span>Codes</span>
          <span style={{ color: "#c4ff00" }}>What</span>
        </div>
        <div style={{ display: "flex", fontSize: 42, color: "#9aa4b2", marginTop: 14 }}>
          Where curiosity meets code
        </div>
      </div>

      <div style={{ display: "flex", fontSize: 28, letterSpacing: 1, color: "#c9d2c2" }}>
        Sockguard · Drydock · Portwing · Portkey Admin MCP
      </div>
    </div>,
    {
      ...size,
    },
  );
}
