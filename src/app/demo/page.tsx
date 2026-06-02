"use client";

import { useState } from "react";

export default function DemoPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", background: "#fff", color: "#000", minHeight: "100vh" }}>
        {/* Nav */}
        <nav style={{ borderBottom: "1px solid #e5e5e5", padding: "14px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "28px", fontSize: "11px", letterSpacing: "1.5px", fontWeight: 400, textTransform: "uppercase", color: "#000" }}>
            <span>New Arrivals</span>
            <span>Gifts</span>
            <span>Bags</span>
            <span style={{ fontWeight: 600 }}>Women</span>
            <span>Men</span>
            <span>Couture</span>
            <span>Discover</span>
          </div>
          <div style={{ fontSize: "20px", fontWeight: 500, letterSpacing: "3px", textTransform: "uppercase" }}>BALENCIAGA</div>
          <div style={{ display: "flex", gap: "20px", fontSize: "11px", letterSpacing: "1.5px", color: "#000", alignItems: "center" }}>
            <span>Client Services</span>
            <span>Login</span>
            <span style={{ fontSize: "16px" }}>⌕</span>
            <span style={{ fontSize: "16px" }}>♡</span>
            <span style={{ fontSize: "16px" }}>⊡</span>
          </div>
        </nav>

        {/* Breadcrumb */}
        <div style={{ padding: "12px 40px", fontSize: "11px", letterSpacing: "1px", color: "#666", textTransform: "uppercase" }}>
          Women / Ready-to-Wear / Dresses & Skirts
        </div>

        {/* Product layout */}
        <div style={{ display: "flex", maxWidth: "1400px", margin: "0 auto", padding: "0 40px" }}>
          {/* Left: Product image */}
          <div style={{ flex: "0 0 55%", position: "relative" }}>
            {/* Bookmark icon */}
            <div style={{ position: "absolute", top: "16px", right: "16px", fontSize: "20px", color: "#999", cursor: "pointer" }}>♡</div>
            <img
              src="https://balenciaga.dam.kering.com/m/6ac5481d3d04cacc/Large-A00178TUVM51000_F.jpg"
              alt="Long Sleeve Maxi Dress in Black"
              style={{ width: "100%", maxHeight: "85vh", objectFit: "contain", background: "#f8f8f8" }}
              onError={(e) => {
                // Fallback if image blocked
                (e.target as HTMLImageElement).style.background = "#f0f0f0";
                (e.target as HTMLImageElement).style.minHeight = "600px";
                (e.target as HTMLImageElement).alt = "Product Image";
              }}
            />
          </div>

          {/* Right: Product info */}
          <div style={{ flex: "0 0 45%", paddingLeft: "60px", paddingTop: "20px" }}>
            <h1 style={{ fontSize: "13px", fontWeight: 500, letterSpacing: "2px", textTransform: "uppercase", marginBottom: "8px", fontFamily: "inherit" }}>
              Women&apos;s Long Sleeve Maxi Dress in Black
            </h1>
            <p style={{ fontSize: "14px", fontWeight: 400, marginBottom: "16px" }}>£ 895</p>

            <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: "16px", marginBottom: "20px" }}>
              <p style={{ fontSize: "12px", color: "#666", lineHeight: 1.6 }}>
                Long Sleeve Maxi Dress in black very transparent jersey
              </p>
            </div>

            {/* TRY ON button — VUAL */}
            <button
              onClick={() => setShowModal(true)}
              style={{
                width: "100%",
                padding: "14px",
                marginBottom: "20px",
                fontSize: "11px",
                fontWeight: 400,
                letterSpacing: "3px",
                textTransform: "uppercase",
                background: "transparent",
                color: "#000",
                border: "1px solid #000",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = "#000";
                (e.target as HTMLElement).style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = "transparent";
                (e.target as HTMLElement).style.color = "#000";
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                <path d="M12 8v8M8 12h8" />
              </svg>
              Try On in Your World
            </button>

            <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: "16px" }}>
              {/* Size */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: 400 }}>Size: (FR/EUR)</span>
                <span style={{ fontSize: "12px", textDecoration: "underline", cursor: "pointer" }}>Size guide</span>
              </div>
              <select style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: "12px",
                border: "1px solid #ccc",
                borderRadius: "0",
                appearance: "none",
                background: "#fff url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 12 12\"><path fill=\"%23666\" d=\"M6 8L1 3h10z\"/></svg>') no-repeat right 16px center",
                marginBottom: "16px",
                cursor: "pointer",
              }}>
                <option>Select Size</option>
                <option>34</option>
                <option>36</option>
                <option>38</option>
                <option>40</option>
                <option>42</option>
              </select>

              <p style={{ fontSize: "11px", color: "#999", textAlign: "center", marginBottom: "12px" }}>
                Estimated delivery date: 03/06/2026 - 06/06/2026
              </p>

              {/* Add to basket */}
              <button style={{
                width: "100%",
                padding: "16px",
                fontSize: "12px",
                fontWeight: 500,
                letterSpacing: "2px",
                textTransform: "uppercase",
                background: "#000",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                marginBottom: "12px",
              }}>
                Add to Basket
              </button>

              <p style={{ fontSize: "12px", textAlign: "center", textDecoration: "underline", cursor: "pointer", marginBottom: "24px" }}>
                Reserve in store
              </p>
            </div>

            {/* Accordions */}
            {["Product Details", "Size & Fit", "Free Shipping, Free Returns", "Product Care", "Sustainability"].map((label) => (
              <div key={label} style={{ borderTop: "1px solid #e0e0e0", padding: "16px 0", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                <span style={{ fontSize: "12px", fontWeight: 500, letterSpacing: "1px", textTransform: "uppercase" }}>{label}</span>
                <span style={{ fontSize: "18px", color: "#999" }}>∨</span>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #e0e0e0" }} />

            <p style={{ fontSize: "10px", color: "#999", textAlign: "center", marginTop: "24px", lineHeight: 1.6 }}>
              You can pay securely with credit card (VISA, Mastercard, American Express), Klarna, Apple Pay or Paypal.
            </p>
          </div>
        </div>

        {/* Powered by VUAL — subtle */}
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
              width: "90vw",
              maxWidth: "480px",
              height: "85vh",
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
              src="/"
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
