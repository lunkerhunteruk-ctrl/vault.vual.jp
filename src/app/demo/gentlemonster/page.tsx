"use client";

import { useState } from "react";

export default function GentleMonsterDemoPage() {
  const [showModal, setShowModal] = useState(false);
  const [showExperience, setShowExperience] = useState(false);
  const [selectedColor, setSelectedColor] = useState(0);

  const colors = [
    { swatch: "#8b2020", name: "Tortoise / Red" },
    { swatch: "#1a1a1a", name: "Black / Grey" },
    { swatch: "#2a2a3a", name: "Navy / Blue" },
    { swatch: "#d4cec4", name: "Ivory / Brown" },
  ];

  return (
    <>
      <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", background: "#fff", color: "#000", minHeight: "100vh" }}>
        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 32px" }}>
          <nav style={{ display: "flex", gap: "24px", fontSize: "12px", fontWeight: 400 }}>
            <span style={{ cursor: "pointer" }}>Sunglasses</span>
            <span style={{ cursor: "pointer" }}>Glasses</span>
            <span style={{ cursor: "pointer" }}>Collections</span>
            <span style={{ cursor: "pointer" }}>Explore</span>
            <span
              onClick={() => setShowExperience(true)}
              style={{ cursor: "pointer", textDecoration: "underline", textUnderlineOffset: "3px" }}
            >
              Experience
            </span>
          </nav>
          <h1 style={{ fontSize: "22px", fontWeight: 400, letterSpacing: "4px", fontFamily: "Georgia, 'Times New Roman', serif", position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
            GENTLE MONSTER
          </h1>
          <div style={{ display: "flex", gap: "16px", fontSize: "12px", fontWeight: 400, alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "#999" }}>Vanilla 01</span>
            <span style={{ cursor: "pointer" }}>🔍</span>
            <span style={{ cursor: "pointer" }}>👤</span>
            <span style={{ cursor: "pointer" }}>🛒</span>
          </div>
        </header>

        {/* Product layout */}
        <div style={{ display: "flex", maxWidth: "1200px", margin: "40px auto 60px", padding: "0 32px" }}>
          {/* Left: Product image */}
          <div style={{ flex: "0 0 55%", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img
              src="/demo-assets/gentlemonster-product.jpg"
              alt="Ora T9"
              style={{ width: "90%", objectFit: "contain" }}
            />
          </div>

          {/* Right: Product info */}
          <div style={{ flex: "0 0 45%", paddingLeft: "48px", paddingTop: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: 400, marginBottom: "4px", fontFamily: "inherit" }}>Ora T9</h2>
                <p style={{ fontSize: "14px", fontWeight: 400 }}>£ 225.00</p>
              </div>
              <span style={{ fontSize: "18px", cursor: "pointer", color: "#999" }}>♡</span>
            </div>

            {/* Color swatches */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "20px 0 8px" }}>
              {colors.map((c, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedColor(i)}
                  style={{
                    width: "16px",
                    height: "16px",
                    borderRadius: "2px",
                    background: c.swatch,
                    cursor: "pointer",
                    border: selectedColor === i ? "2px solid #000" : "1px solid #ddd",
                    padding: selectedColor === i ? "0" : "1px",
                  }}
                />
              ))}
              <span style={{ fontSize: "11px", color: "#666", marginLeft: "8px" }}>{colors[selectedColor].name}</span>
            </div>

            {/* TRY ON button — VUAL */}
            <button
              onClick={() => setShowModal(true)}
              style={{
                width: "100%",
                padding: "14px",
                marginTop: "16px",
                marginBottom: "12px",
                fontSize: "10px",
                fontWeight: 400,
                letterSpacing: "3px",
                textTransform: "uppercase",
                background: "transparent",
                color: "#000",
                border: "1px solid #000",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#000"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#000"; }}
            >
              Try On in Our World
            </button>

            {/* ADD TO BAG */}
            <button style={{
              width: "100%",
              padding: "14px",
              fontSize: "11px",
              fontWeight: 400,
              letterSpacing: "2px",
              textTransform: "uppercase",
              background: "#000",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              marginBottom: "20px",
            }}>
              Add to Bag
            </button>

            {/* Accordions */}
            <div style={{ borderTop: "1px solid #eee", padding: "14px 0", display: "flex", justifyContent: "space-between", cursor: "pointer", fontSize: "11px", fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" }}>
              <span>Shipping & Returns | Import Duty & Tax</span>
              <span style={{ color: "#999" }}>+</span>
            </div>

            {/* Details — open */}
            <div style={{ borderTop: "1px solid #eee", padding: "14px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", cursor: "pointer", fontSize: "11px", fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase", marginBottom: "12px" }}>
                <span>Details</span>
                <span style={{ color: "#999" }}>—</span>
              </div>
              <div style={{ fontSize: "11px", color: "#666", lineHeight: 1.8 }}>
                <p>Oval Sunglasses in Tortoise Mixed Materials</p>
                <p style={{ marginTop: "8px" }}>Bouquet Collection</p>
                <p>Tortoise Mixed Frame</p>
                <p>Red Mirror Lenses</p>
                <p>Oval Shape</p>
                <p>Loop Details Inspired by Botanical Structures</p>
                <p>Lenses Block 99.9% of UV Rays</p>
                <p>Manufacturer & Importer: IICOMBINED CO., LTD.</p>
                <p>Country of Manufacture: China</p>
                <p style={{ marginTop: "8px" }}>Not eligible for fitting customization</p>
              </div>
            </div>

            <div style={{ borderTop: "1px solid #eee", padding: "14px 0", display: "flex", justifyContent: "space-between", cursor: "pointer", fontSize: "11px", fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" }}>
              <span>Size and Fit</span>
              <span style={{ color: "#999" }}>+</span>
            </div>
            <div style={{ borderTop: "1px solid #eee" }} />
          </div>
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
            <iframe src="https://gentlemonster.vault.vual.jp/tryon?look=gentlemonster/look1&city=SEOUL" style={{ width: "100%", height: "100%", border: "none" }} />
          </div>
        </div>
      )}

      {/* Experience Full Screen */}
      {showExperience && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#0a0a0a", overflow: "auto" }}>
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", background: "linear-gradient(180deg, rgba(10,10,10,0.95) 0%, transparent 100%)" }}>
            <span style={{ fontSize: "13px", letterSpacing: "4px", color: "rgba(255,255,255,0.3)", fontFamily: "Georgia, 'Times New Roman', serif" }}>GENTLE MONSTER — EXPERIENCE</span>
            <button onClick={() => setShowExperience(false)} style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
          <iframe src="https://gentlemonster.vault.vual.jp" style={{ width: "100%", height: "100%", border: "none" }} />
        </div>
      )}
    </>
  );
}
