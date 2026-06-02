"use client";

import { useState } from "react";

export default function JuunJDemoPage() {
  const [showExperience, setShowExperience] = useState(false);

  return (
    <>
      <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", background: "#000", color: "#fff", minHeight: "100vh" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", paddingTop: "32px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: 300, letterSpacing: "2px", fontStyle: "italic", fontFamily: "Georgia, 'Times New Roman', serif" }}>
            juun.j
          </h1>
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", justifyContent: "center", gap: "28px", padding: "20px 0 32px", fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", fontWeight: 400 }}>
          <span style={{ color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>About Juun.J</span>
          <span style={{ color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>Collections</span>
          <span style={{ color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>Campaign</span>
          <span style={{ color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>Projects</span>
          <span style={{ color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>Stores</span>
          <span style={{ color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>Contact</span>
          <span style={{ color: "rgba(255,255,255,0.6)", cursor: "pointer" }}>Follow Us</span>
          <span
            onClick={() => setShowExperience(true)}
            style={{
              color: "#fff",
              cursor: "pointer",
              borderBottom: "1px solid rgba(255,255,255,0.4)",
              paddingBottom: "2px",
            }}
          >
            Experience
          </span>
        </nav>

        {/* Hero image */}
        <div style={{ display: "flex", justifyContent: "center", padding: "0 20px" }}>
          <div style={{ position: "relative", maxWidth: "420px", width: "100%" }}>
            <div style={{
              width: "100%",
              aspectRatio: "3/4",
              background: "linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Simulated campaign image */}
              <div style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(135deg, #2a2520 0%, #1a1815 40%, #252220 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <span style={{
                  fontSize: "28px",
                  fontWeight: 300,
                  fontStyle: "italic",
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  color: "rgba(255,255,255,0.9)",
                  letterSpacing: "2px",
                }}>
                  juun.j
                </span>
              </div>

              {/* Try On overlay button */}
              <button
                onClick={() => setShowExperience(true)}
                style={{
                  position: "absolute",
                  bottom: "24px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  padding: "12px 32px",
                  fontSize: "9px",
                  fontWeight: 400,
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  background: "rgba(0,0,0,0.6)",
                  backdropFilter: "blur(8px)",
                  color: "rgba(255,255,255,0.8)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  cursor: "pointer",
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(255,255,255,0.1)";
                  el.style.borderColor = "rgba(255,255,255,0.5)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.background = "rgba(0,0,0,0.6)";
                  el.style.borderColor = "rgba(255,255,255,0.2)";
                }}
              >
                Try On in Our World →
              </button>
            </div>
          </div>
        </div>

        {/* Online Shop button */}
        <div style={{ display: "flex", justifyContent: "center", padding: "40px 0 16px" }}>
          <div style={{
            padding: "14px 48px",
            border: "1px solid rgba(255,255,255,0.3)",
            fontSize: "10px",
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.6)",
            cursor: "pointer",
            textAlign: "center",
          }}>
            <div>Online Shop</div>
            <div style={{ fontSize: "8px", marginTop: "4px", color: "rgba(255,255,255,0.3)" }}>Korea</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "16px 0 32px", fontSize: "8px", letterSpacing: "2px", color: "rgba(255,255,255,0.2)" }}>
          JUUN.J SAMSUNG C&T FASHION GROUP
        </div>

        {/* Powered by VUAL */}
        <div style={{ position: "fixed", bottom: "12px", right: "16px", fontSize: "8px", letterSpacing: "2px", color: "rgba(255,255,255,0.15)", zIndex: 10 }}>
          POWERED BY VUAL
        </div>
      </div>

      {/* Experience Modal — Full screen VAULT experience */}
      {showExperience && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "#0a0a0a",
            overflow: "auto",
          }}
        >
          {/* Close bar */}
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 24px",
            background: "linear-gradient(180deg, rgba(10,10,10,0.95) 0%, transparent 100%)",
          }}>
            <span style={{ fontSize: "11px", letterSpacing: "4px", color: "rgba(255,255,255,0.3)", fontStyle: "italic", fontFamily: "Georgia, 'Times New Roman', serif" }}>
              juun.j — experience
            </span>
            <button
              onClick={() => setShowExperience(false)}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.5)",
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ×
            </button>
          </div>

          <iframe
            src="https://juunj.vault.vual.jp"
            style={{
              width: "100%",
              height: "100%",
              border: "none",
            }}
          />
        </div>
      )}
    </>
  );
}
