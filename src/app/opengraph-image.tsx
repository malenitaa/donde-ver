import { ImageResponse } from "next/og";

export const alt = "Dónde ver — buscá películas y series en tus plataformas";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PLATFORMS = [
  { label: "Netflix", color: "#E50914" },
  { label: "Max", color: "#7B2FF7" },
  { label: "Prime Video", color: "#1FA1E0" },
  { label: "Disney+", color: "#1E90FF" },
  { label: "Star+", color: "#00E8C6" },
];

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #0a0a0a 0%, #141414 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          {PLATFORMS.map((p) => (
            <div
              key={p.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 18px",
                borderRadius: 999,
                border: "1px solid #262626",
                color: "#d4d4d4",
                fontSize: 22,
              }}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  background: p.color,
                }}
              />
              {p.label}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 108, fontWeight: 700, color: "#fafafa", lineHeight: 1 }}>
            Dónde&nbsp;
            <span style={{ color: "#34d399" }}>ver</span>
          </div>
          <div style={{ display: "flex", fontSize: 34, color: "#a3a3a3", maxWidth: 900 }}>
            Buscá películas y series y encontrá al instante en cuál de tus plataformas están.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "14px 26px",
            borderRadius: 999,
            background: "#34d399",
            color: "#0a0a0a",
            fontSize: 26,
            fontWeight: 600,
            width: "auto",
            alignSelf: "flex-start",
          }}
        >
          🔎 Buscá. Filtrá por tus apps. Mirá.
        </div>
      </div>
    ),
    { ...size }
  );
}
