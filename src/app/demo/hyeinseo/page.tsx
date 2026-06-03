"use client";

import { useState } from "react";

export default function HyeinSeoDemoPage() {
  const [showModal, setShowModal] = useState(false);
  const [showExperience, setShowExperience] = useState(false);
  const [selectedColor, setSelectedColor] = useState("Melange Grey");

  return (
    <>
      <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", background: "#fff", color: "#000", minHeight: "100vh" }}>
        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px" }}>
          <nav style={{ display: "flex", gap: "32px", fontSize: "12px", fontWeight: 400 }}>
            <span style={{ cursor: "pointer" }}>Shop</span>
            <span
              onClick={() => setShowExperience(true)}
              style={{ cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px" }}
            >
              Experience
            </span>
            <span style={{ cursor: "pointer" }}>Explore</span>
            <span style={{ cursor: "pointer" }}>Search</span>
          </nav>
          <div style={{ display: "flex", gap: "16px", fontSize: "12px", fontWeight: 400, alignItems: "center" }}>
            <span style={{ cursor: "pointer" }}>Login</span>
            <span style={{ cursor: "pointer" }}>Cart</span>
          </div>
        </header>

        {/* Breadcrumb */}
        <div style={{ padding: "4px 24px 16px", fontSize: "11px", color: "#999" }}>
          Shop &gt; New In &gt; Tops
        </div>

        {/* Product layout */}
        <div style={{ display: "flex", maxWidth: "1400px", margin: "0 auto", padding: "0 24px 60px" }}>
          {/* Left: Product image grid */}
          <div style={{ flex: "0 0 55%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
            <img src="/demo-assets/hyeinseo-look.webp" alt="Macrame Backstrap Top front" style={{ width: "100%", objectFit: "cover" }} />
            <img src="/demo-assets/hyeinseo-look.webp" alt="Macrame Backstrap Top side" style={{ width: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
            <img src="/demo-assets/hyeinseo-look.webp" alt="Macrame Backstrap Top detail" style={{ width: "100%", objectFit: "cover", filter: "brightness(1.05)" }} />
            <img src="/demo-assets/hyeinseo-look.webp" alt="Macrame Backstrap Top back" style={{ width: "100%", objectFit: "cover", transform: "scaleX(-1)", filter: "brightness(0.95)" }} />
          </div>

          {/* Right: Product info */}
          <div style={{ flex: "0 0 45%", paddingLeft: "48px", paddingTop: "4px" }}>
            <p style={{ fontSize: "11px", color: "#999", marginBottom: "4px" }}>Search</p>
            <h2 style={{ fontSize: "14px", fontWeight: 400, marginBottom: "4px", fontFamily: "inherit" }}>
              Macrame Backstrap Top
            </h2>
            <p style={{ fontSize: "12px", color: "#999", textDecoration: "line-through", marginBottom: "2px" }}>145.00 GBP</p>
            <p style={{ fontSize: "13px", fontWeight: 400, marginBottom: "16px" }}>125.00 GBP</p>

            <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.7, marginBottom: "20px" }}>
              Top with a draped silhouette and a diagonal-cut hem. Left side seam opens with six self-fabric covered buttons. Tonal silkscreen print at the side opening. Macrame strap detail hangs from the back of the neck, continues to the front, and fastens through loop holes under both arms.
            </p>

            {/* Color */}
            <div style={{ marginBottom: "12px" }}>
              <span style={{ fontSize: "11px", marginRight: "16px" }}>Color</span>
              {["Melange Grey", "Mist Grey", "Black"].map((color) => (
                <span
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  style={{
                    fontSize: "11px",
                    marginRight: "12px",
                    cursor: "pointer",
                    textDecoration: selectedColor === color ? "underline" : "none",
                    textUnderlineOffset: "3px",
                    color: selectedColor === color ? "#000" : "#999",
                  }}
                >
                  {color}
                </span>
              ))}
            </div>

            {/* Size */}
            <div style={{ marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", marginRight: "16px" }}>Size</span>
              {["2", "3", "4"].map((size) => (
                <span key={size} style={{ fontSize: "11px", marginRight: "12px", cursor: "pointer", color: "#999" }}>{size}</span>
              ))}
            </div>

            {/* Quantity */}
            <div style={{ marginBottom: "16px" }}>
              <span style={{ fontSize: "11px", marginRight: "16px" }}>Quantity</span>
              <span style={{ fontSize: "11px", color: "#999" }}>1</span>
            </div>

            {/* TRY ON button — VUAL */}
            <button
              onClick={() => setShowModal(true)}
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: "8px",
                fontSize: "10px",
                fontWeight: 400,
                letterSpacing: "3px",
                textTransform: "uppercase",
                background: "#000",
                color: "#fff",
                border: "1px solid #000",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#222"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#000"; }}
            >
              Try On in Our World
            </button>

            {/* Add to cart / Wishlist */}
            <div style={{ fontSize: "11px", borderTop: "1px solid #eee", borderBottom: "1px solid #eee" }}>
              <div style={{ padding: "10px 0", cursor: "pointer" }}>Add to cart</div>
              <div style={{ padding: "10px 0", cursor: "pointer", borderTop: "1px solid #eee" }}>Add to wishlist</div>
            </div>

            {/* Accordions */}
            <div style={{ marginTop: "4px" }}>
              {["Details", "Size guide", "Returns & Exchanges", "Shipping"].map((label) => (
                <div key={label} style={{ padding: "10px 0", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", borderBottom: "1px solid #eee", fontSize: "11px" }}>
                  <span>{label}</span>
                  <span style={{ color: "#999" }}>+</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer logo */}
        <div style={{ padding: "40px 24px", fontSize: "32px", fontWeight: 700, letterSpacing: "3px" }}>
          HYEIN SEO
        </div>

        {/* Powered by VUAL */}
        <div style={{ position: "fixed", bottom: "12px", right: "16px", fontSize: "8px", letterSpacing: "2px", color: "rgba(0,0,0,0.2)", zIndex: 10 }}>
          POWERED BY VUAL
        </div>
      </div>

      {/* TRY ON Modal */}
      {showModal && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{ position: "relative", width: "92vw", maxWidth: "520px", height: "95vh", borderRadius: "12px", overflow: "hidden", background: "#0a0a0a" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setShowModal(false)} style={{ position: "absolute", top: "12px", right: "12px", zIndex: 10, width: "32px", height: "32px", borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            <iframe src="https://hyeinseo.vault.vual.jp/tryon?look=hyeinseo/look1&city=SEOUL" style={{ width: "100%", height: "100%", border: "none" }} />
          </div>
        </div>
      )}

      {/* Experience Full Screen */}
      {showExperience && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#0a0a0a", overflow: "auto" }}>
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", background: "linear-gradient(180deg, rgba(10,10,10,0.95) 0%, transparent 100%)" }}>
            <span style={{ fontSize: "12px", letterSpacing: "3px", color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>HYEIN SEO — EXPERIENCE</span>
            <button onClick={() => setShowExperience(false)} style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
          <iframe src="https://hyeinseo.vault.vual.jp" style={{ width: "100%", height: "100%", border: "none" }} />
        </div>
      )}
    </>
  );
}
