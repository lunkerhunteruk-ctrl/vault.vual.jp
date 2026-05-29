"use client";

import { useState, useEffect } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("vault-theme");
    if (saved === "dark") {
      setIsDark(true);
      document.documentElement.removeAttribute("data-theme");
    }
    // light is already set via layout.tsx data-theme="light"
  }, []);

  const toggle = () => {
    const next = isDark ? "light" : "dark";
    setIsDark(!isDark);
    if (next === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem("vault-theme", next);
  };

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="group relative cursor-pointer"
      style={{ outline: "none" }}
    >
      {/* Liquid glass track */}
      <div
        className="relative transition-all duration-500 ease-in-out"
        style={{
          width: 56,
          height: 28,
          borderRadius: 14,
          background: isDark
            ? "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)"
            : "linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0.05) 100%)",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(201,168,76,0.25)"}`,
          boxShadow: isDark
            ? "inset 0 1px 2px rgba(0,0,0,0.3), 0 0 8px rgba(0,212,255,0.05)"
            : "inset 0 1px 2px rgba(0,0,0,0.05), 0 0 8px rgba(201,168,76,0.1)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        {/* Glass highlight on track */}
        <div
          className="absolute top-0 left-0 right-0 transition-opacity duration-500"
          style={{
            height: "50%",
            borderRadius: "14px 14px 0 0",
            background: isDark
              ? "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, transparent 100%)"
              : "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 100%)",
          }}
        />

        {/* Liquid glass thumb */}
        <div
          className="absolute top-[2px] transition-all duration-500 ease-[cubic-bezier(0.68,-0.15,0.32,1.15)]"
          style={{
            left: isDark ? 28 : 2,
            width: 24,
            height: 24,
            borderRadius: 12,
            background: isDark
              ? "linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)"
              : "linear-gradient(145deg, rgba(201,168,76,0.35) 0%, rgba(201,168,76,0.15) 100%)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(201,168,76,0.4)"}`,
            boxShadow: isDark
              ? "0 2px 8px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.1)"
              : "0 2px 8px rgba(201,168,76,0.2), inset 0 1px 1px rgba(255,255,255,0.6)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          {/* Inner glass reflection */}
          <div
            className="absolute transition-opacity duration-500"
            style={{
              top: 2,
              left: 3,
              width: 16,
              height: 8,
              borderRadius: "8px 8px 4px 4px",
              background: isDark
                ? "linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)"
                : "linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 100%)",
            }}
          />
        </div>
      </div>
    </button>
  );
}
