"use client";

import { useState } from "react";

export default function AnderssonBellDemoPage() {
  const [showModal, setShowModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showExperience, setShowExperience] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  return (
    <>
      <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", background: "#fff", color: "#000", minHeight: "100vh" }}>
        {/* Header */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #eee" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button onClick={() => setShowMenu(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", padding: "4px" }}>
              ☰
            </button>
            <span style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "2px" }}>ADSB</span>
            <span style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "1px" }}>ANDERSSON BELL</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "16px" }}>
            <span style={{ cursor: "pointer" }}>🔍</span>
            <span style={{ cursor: "pointer" }}>👤</span>
            <span style={{ cursor: "pointer" }}>🛒</span>
          </div>
        </header>

        {/* Product layout */}
        <div style={{ display: "flex", maxWidth: "1400px", margin: "0 auto" }}>
          {/* Left: Product image */}
          <div style={{ flex: "0 0 55%", padding: "0" }}>
            <img
              src="/demo-assets/anderssonbell-look.jpg"
              alt="Unisex Heart Kelly Logo T-Shirt"
              style={{ width: "100%", objectFit: "cover" }}
            />
          </div>

          {/* Right: Product info */}
          <div style={{ flex: "0 0 45%", padding: "40px 40px 40px 48px" }}>
            <p style={{ fontSize: "11px", color: "#999", marginBottom: "4px" }}>[6/29 제작 배송]</p>
            <h1 style={{ fontSize: "13px", fontWeight: 400, letterSpacing: "0.5px", marginBottom: "8px", fontFamily: "inherit", lineHeight: 1.5 }}>
              UNISEX HEART KELLY LOGO T-SHIRT atb1882u(WHITE/GREEN)
            </h1>
            <p style={{ fontSize: "13px", fontWeight: 400, marginBottom: "24px" }}>KRW 69,000</p>

            {/* TRY ON button — VUAL */}
            <button
              onClick={() => setShowModal(true)}
              style={{
                width: "100%",
                padding: "13px",
                marginBottom: "16px",
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

            {/* Size */}
            <p style={{ fontSize: "11px", fontWeight: 400, marginBottom: "10px", textTransform: "uppercase" }}>Size</p>
            <div style={{ display: "flex", gap: "6px", marginBottom: "20px", flexWrap: "wrap" }}>
              {["XXS", "XS", "S", "M", "L", "XL", "5XL"].map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  style={{
                    padding: "8px 12px",
                    border: selectedSize === size ? "1px solid #000" : "1px solid #ddd",
                    background: selectedSize === size ? "#000" : "#fff",
                    color: selectedSize === size ? "#fff" : "#000",
                    fontSize: "11px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    minWidth: "40px",
                    textAlign: "center",
                  }}
                >
                  {size}
                </button>
              ))}
            </div>

            {/* Add to bag */}
            <button style={{
              width: "100%",
              padding: "14px",
              fontSize: "11px",
              fontWeight: 400,
              letterSpacing: "2px",
              textTransform: "uppercase",
              background: "#fff",
              color: "#000",
              border: "1px solid #000",
              cursor: "pointer",
              marginBottom: "8px",
            }}>
              Add to Bag
            </button>

            {/* Buy it now */}
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
              marginBottom: "24px",
            }}>
              Buy It Now
            </button>

            {/* Info accordions */}
            {["Item Info", "Size Info"].map((label) => (
              <div key={label} style={{ borderTop: "1px solid #e0e0e0", padding: "14px 0", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                <span style={{ fontSize: "11px", fontWeight: 400, letterSpacing: "1px", textTransform: "uppercase" }}>{label}</span>
                <span style={{ fontSize: "12px", color: "#999" }}>▼</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #e0e0e0" }} />
          </div>
        </div>

        {/* Powered by VUAL */}
        <div style={{ position: "fixed", bottom: "12px", right: "16px", fontSize: "8px", letterSpacing: "2px", color: "rgba(0,0,0,0.2)", zIndex: 10 }}>
          POWERED BY VUAL
        </div>
      </div>

      {/* Hamburger Menu Drawer */}
      {showMenu && (
        <div style={{ position: "fixed", inset: 0, zIndex: 900, display: "flex" }}>
          {/* Left: Menu */}
          <div style={{ width: "50%", background: "#000", padding: "24px 32px", display: "flex", flexDirection: "column" }}>
            <button onClick={() => setShowMenu(false)} style={{ alignSelf: "flex-end", background: "none", border: "none", color: "#fff", fontSize: "24px", cursor: "pointer", marginBottom: "32px" }}>
              ✕
            </button>
            <nav style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {["Hearts", "Men", "Women", "Unisex", "Restock", "Collaboration", "Collections", "Archive", "Brand", "Stockist", "Notice"].map((item) => (
                <span key={item} style={{ fontSize: "13px", fontWeight: 500, letterSpacing: "1px", color: "rgba(255,255,255,0.8)", cursor: "pointer", textTransform: "uppercase" }}>
                  {item}
                </span>
              ))}
              {/* EXPERIENCE — VUAL addition */}
              <span
                onClick={() => { setShowMenu(false); setShowExperience(true); }}
                style={{ fontSize: "13px", fontWeight: 500, letterSpacing: "1px", color: "#fff", cursor: "pointer", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.3)", paddingBottom: "4px", marginTop: "8px" }}
              >
                Experience ✦
              </span>
            </nav>
            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Search</span>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>Register / Login</span>
            </div>
          </div>
          {/* Right: backdrop */}
          <div onClick={() => setShowMenu(false)} style={{ flex: 1, background: "rgba(0,0,0,0.3)", cursor: "pointer" }} />
        </div>
      )}

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
            <button onClick={() => setShowModal(false)} style={{ position: "absolute", top: "12px", right: "12px", zIndex: 10, width: "32px", height: "32px", borderRadius: "50%", background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)", fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              ×
            </button>
            <iframe src="https://anderssonbell.vault.vual.jp/tryon?look=anderssonbell/look1&city=SEOUL" style={{ width: "100%", height: "100%", border: "none" }} />
          </div>
        </div>
      )}

      {/* Experience Full Screen */}
      {showExperience && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#0a0a0a", overflow: "auto" }}>
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", background: "linear-gradient(180deg, rgba(10,10,10,0.95) 0%, transparent 100%)" }}>
            <span style={{ fontSize: "12px", letterSpacing: "3px", color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>ADSB — EXPERIENCE</span>
            <button onClick={() => setShowExperience(false)} style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.5)", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
          <iframe src="https://anderssonbell.vault.vual.jp" style={{ width: "100%", height: "100%", border: "none" }} />
        </div>
      )}
    </>
  );
}
