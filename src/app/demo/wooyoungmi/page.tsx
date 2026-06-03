"use client";

import { useState } from "react";

export default function WooyoungmiDemoPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  return (
    <>
      <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", background: "#fff", color: "#000", minHeight: "100vh" }}>
        {/* Top ticker bar */}
        <div style={{ background: "#000", color: "#fff", padding: "8px 0", fontSize: "10px", letterSpacing: "1.5px", textAlign: "center", textTransform: "uppercase" }}>
          • Free Worldwide Shipping on All Orders &nbsp;&nbsp;&nbsp; • Import Duties and VAT Are Not Included &nbsp;&nbsp;&nbsp; • Free Worldwide Shipping on All Orders
        </div>

        {/* Nav */}
        <nav style={{ padding: "20px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e8e8e8" }}>
          <div style={{ display: "flex", gap: "28px", fontSize: "11px", letterSpacing: "1.5px", fontWeight: 400, textTransform: "uppercase", color: "#000" }}>
            <span>Women</span>
            <span>Men</span>
            <span>Jewelry</span>
            <span>Collection</span>
            <span>Story</span>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "16px", fontWeight: 500, letterSpacing: "5px", textTransform: "uppercase" }}>WOOYOUNGMI</div>
            <div style={{ fontSize: "9px", letterSpacing: "5px", color: "#666", marginTop: "2px" }}>PARIS</div>
          </div>
          <div style={{ display: "flex", gap: "20px", fontSize: "11px", letterSpacing: "1.5px", color: "#000" }}>
            <span>USD</span>
            <span>Search</span>
            <span>Account</span>
            <span>Bag</span>
          </div>
        </nav>

        {/* Product layout — left info, right image (matching their site) */}
        <div style={{ display: "flex", maxWidth: "1400px", margin: "0 auto", padding: "40px" }}>
          {/* Left: Product info */}
          <div style={{ flex: "0 0 45%", paddingRight: "60px", paddingTop: "20px" }}>
            <h1 style={{ fontSize: "14px", fontWeight: 400, letterSpacing: "0.5px", marginBottom: "12px", fontFamily: "inherit" }}>
              White Halter Neck Sleeveless
            </h1>
            <p style={{ fontSize: "14px", fontWeight: 400, marginBottom: "8px" }}>USD 280.00</p>

            <p style={{ fontSize: "10px", color: "#999", marginBottom: "24px" }}>M0X1TS20B1W</p>

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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#222";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#000";
              }}
            >
              Try On in Our World
            </button>

            {/* Size */}
            <div style={{ marginBottom: "8px" }}>
              <p style={{ fontSize: "12px", fontWeight: 400, marginBottom: "10px" }}>SIZE</p>
              <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                {["34", "36", "38"].map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    style={{
                      width: "40px",
                      height: "36px",
                      border: selectedSize === size ? "1px solid #000" : "1px solid #ddd",
                      background: selectedSize === size ? "#000" : "#fff",
                      color: selectedSize === size ? "#fff" : "#000",
                      fontSize: "12px",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Add to bag */}
            <button style={{
              width: "100%",
              padding: "14px",
              fontSize: "11px",
              fontWeight: 400,
              letterSpacing: "3px",
              textTransform: "uppercase",
              background: "#000",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              marginBottom: "32px",
            }}>
              Add to Bag
            </button>

            {/* Product detail */}
            <div style={{ borderTop: "1px solid #e8e8e8" }}>
              <div style={{ padding: "16px 0", cursor: "pointer" }}>
                <p style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" }}>Product Detail</p>
                <div style={{ fontSize: "11px", color: "#666", lineHeight: 1.8, marginTop: "12px" }}>
                  <p>• Halter-neck sleeveless</p>
                  <p>• Front label details</p>
                  <p>• Metal logo on the back</p>
                  <p>• Country of manufacture: South Korea</p>
                </div>
              </div>
            </div>

            {["Size Measurement", "Fabric & Care"].map((label) => (
              <div key={label} style={{ borderTop: "1px solid #e8e8e8", padding: "16px 0", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                <span style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" }}>{label}</span>
                <span style={{ fontSize: "14px", color: "#999" }}>+</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #e8e8e8" }} />
          </div>

          {/* Right: Product image */}
          <div style={{ flex: "0 0 55%", display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
            <img
              src="/demo-assets/wooyoungmi-look.jpg"
              alt="White Halter Neck Sleeveless"
              style={{ width: "85%", objectFit: "contain" }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.background = "#f5f5f5";
                (e.target as HTMLImageElement).style.minHeight = "700px";
              }}
            />
          </div>
        </div>

        {/* Powered by VUAL */}
        <div style={{ position: "fixed", bottom: "12px", right: "16px", fontSize: "8px", letterSpacing: "2px", color: "rgba(0,0,0,0.2)", zIndex: 10 }}>
          POWERED BY VUAL
        </div>
      </div>

      {/* VAULT Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              position: "relative",
              width: "92vw",
              maxWidth: "520px",
              height: "95vh",
              borderRadius: "12px",
              overflow: "hidden",
              background: "#0a0a0a",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                zIndex: 10,
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.6)",
                fontSize: "16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>

            <iframe
              src="https://wooyoungmi.vault.vual.jp/tryon?look=wooyoungmi/look1&city=SEOUL"
              style={{
                width: "100%",
                height: "100%",
                border: "none",
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
