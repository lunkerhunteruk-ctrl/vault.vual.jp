"use client";

import { useState } from "react";

export default function LowClassicDemoPage() {
  const [showModal, setShowModal] = useState(false);
  const [showExperience, setShowExperience] = useState(false);

  return (
    <>
      <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", background: "#fff", color: "#000", minHeight: "100vh" }}>
        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 28px" }}>
          <h1 style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "2px" }}>LOW CLASSIC</h1>
          <nav style={{ display: "flex", gap: "24px", fontSize: "12px", fontWeight: 400, letterSpacing: "1px", alignItems: "center" }}>
            <span style={{ cursor: "pointer" }}>Archive</span>
            <span style={{ cursor: "pointer" }}>Store</span>
            <span style={{ cursor: "pointer" }}>Lounge</span>
            <span style={{ cursor: "pointer" }}>Info</span>
            <span
              onClick={() => setShowExperience(true)}
              style={{ cursor: "pointer", borderBottom: "1px solid #000", paddingBottom: "2px" }}
            >
              Experience
            </span>
            <span style={{ cursor: "pointer", fontSize: "14px" }}>🔍</span>
            <span style={{ cursor: "pointer", fontSize: "14px" }}>👤</span>
            <span style={{ cursor: "pointer", fontSize: "14px" }}>🛒</span>
          </nav>
        </header>

        {/* Product layout */}
        <div style={{ display: "flex", maxWidth: "1400px", margin: "0 auto", padding: "0 28px 60px" }}>
          {/* Left: Product images */}
          <div style={{ flex: "0 0 58%", display: "flex", gap: "4px" }}>
            <div style={{ flex: 1 }}>
              <img src="/demo-assets/lowclassic-look.jpg" alt="See Through Stitch Shirt" style={{ width: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ flex: 1 }}>
              <img src="/demo-assets/lowclassic-look.jpg" alt="See Through Stitch Shirt back" style={{ width: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
            </div>
          </div>

          {/* Right: Product info */}
          <div style={{ flex: "0 0 42%", paddingLeft: "48px", paddingTop: "8px" }}>
            {/* Accordions on left side */}
            <div style={{ marginBottom: "24px" }}>
              {["Product Information", "Details"].map((label) => (
                <div key={label} style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginRight: "24px", fontSize: "11px", fontWeight: 400, cursor: "pointer", color: "#555" }}>
                  {label} <span style={{ fontSize: "10px" }}>+</span>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "16px", marginBottom: "4px" }}>
              <p style={{ fontSize: "10px", color: "#999" }}>[8.2 순서 배송]</p>
            </div>
            <h2 style={{ fontSize: "14px", fontWeight: 400, marginBottom: "16px", fontFamily: "inherit" }}>
              See Through Stitch Shirt
            </h2>

            <p style={{ fontSize: "13px", fontWeight: 400, marginBottom: "4px" }}>Nude</p>

            {/* Color swatch */}
            <div style={{ width: "16px", height: "16px", background: "#e8ddd4", border: "1px solid #ddd", borderRadius: "2px", marginBottom: "20px" }} />

            {/* Size & Price */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", color: "#999" }}>SIZE</span>
              <select style={{ fontSize: "11px", border: "1px solid #ddd", padding: "6px 24px 6px 8px", background: "#fff", appearance: "none", cursor: "pointer" }}>
                <option>SELECT SIZE ▾</option>
                <option>S</option>
                <option>M</option>
                <option>L</option>
              </select>
            </div>

            <div style={{ marginBottom: "4px" }}>
              <p style={{ fontSize: "13px" }}>KRW 278,000</p>
              <p style={{ fontSize: "10px", color: "#999" }}>POINT 5,000</p>
              <p style={{ fontSize: "10px", color: "#999" }}>[첫 주문 시 15% Coupon]</p>
              <p style={{ fontSize: "10px", color: "#c44" }}>Pre-Order</p>
            </div>

            {/* TRY ON button — VUAL */}
            <button
              onClick={() => setShowModal(true)}
              style={{
                width: "100%",
                padding: "13px",
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

            {/* Total + Buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", borderTop: "1px solid #eee", paddingTop: "12px" }}>
              <span style={{ fontSize: "11px", fontWeight: 400 }}>Total</span>
              <span style={{ fontSize: "11px" }}>0 (0)</span>
            </div>

            <div style={{ display: "flex", gap: "4px" }}>
              <button style={{
                flex: 1,
                padding: "14px",
                fontSize: "10px",
                fontWeight: 400,
                letterSpacing: "2px",
                textTransform: "uppercase",
                background: "#000",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}>
                Buy It Now
              </button>
              <button style={{
                flex: 1,
                padding: "14px",
                fontSize: "10px",
                fontWeight: 400,
                letterSpacing: "2px",
                textTransform: "uppercase",
                background: "#fff",
                color: "#000",
                border: "1px solid #000",
                cursor: "pointer",
              }}>
                Add to Cart
              </button>
            </div>

            {/* Accordions */}
            <div style={{ marginTop: "24px" }}>
              {["Size Guide", "Shipping & Return"].map((label) => (
                <div key={label} style={{ borderTop: "1px solid #eee", padding: "14px 0", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                  <span style={{ fontSize: "11px", fontWeight: 400 }}>{label}</span>
                  <span style={{ fontSize: "12px", color: "#999" }}>+</span>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #eee" }} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "40px 28px 24px", borderTop: "1px solid #eee" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", fontSize: "10px", color: "#999" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span>CLIENT SERVICES +</span>
              <span>COMPANY +</span>
              <span>CONTACT +</span>
              <span>INFO +</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <p style={{ fontSize: "8px", color: "#bbb" }}>Business Information. info@lowclassic.com</p>
            </div>
            <div style={{ fontSize: "48px", fontWeight: 800, letterSpacing: "3px", color: "#000", lineHeight: 1 }}>
              LOW CLASSIC
            </div>
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
            <iframe src="https://lowclassic.vault.vual.jp/tryon?look=lowclassic/look1&city=SEOUL" style={{ width: "100%", height: "100%", border: "none" }} />
          </div>
        </div>
      )}

      {/* Experience Full Screen */}
      {showExperience && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#0a0a0a", overflow: "auto" }}>
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", background: "linear-gradient(180deg, rgba(10,10,10,0.95) 0%, transparent 100%)" }}>
            <span style={{ fontSize: "12px", letterSpacing: "3px", color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>LOW CLASSIC — EXPERIENCE</span>
            <button onClick={() => setShowExperience(false)} style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
          <iframe src="https://lowclassic.vault.vual.jp" style={{ width: "100%", height: "100%", border: "none" }} />
        </div>
      )}
    </>
  );
}
