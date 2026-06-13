import { HeroAnimations } from "@/components/HeroAnimations";

function HeroSection() {
  const line1 = "OWN NOTHING.";
  const line2 = "INJECT YOUR DNA.";
  const stagger = 40; // ms per char
  const startDelay = 700;
  let charIndex = 0;

  // Small manifesto under the big VAULT wordmark.
  const renderLine = (text: string) =>
    text.split("").map((char, i) => {
      if (char === " ") {
        charIndex++;
        return <span key={i}>&nbsp;</span>;
      }
      const delay = startDelay + charIndex * stagger;
      charIndex++;
      return (
        <span
          key={i}
          style={{
            display: "inline-block",
            opacity: 0,
            color: "var(--vault-text-dim)",
            animation: `charStrike 400ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms forwards`,
          }}
        >
          {char}
        </span>
      );
    });

  return (
    <section className="flex flex-col items-center justify-center relative" style={{ height: "52vh", minHeight: 360 }}>
      <style>{`
        @keyframes charStrike {
          0% { opacity: 0; transform: scale(1.15); }
          30% { opacity: 1; transform: scale(1.04); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes vaultIn {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="text-center w-full px-6 relative z-10">
        <div id="hero-logo" className="flex justify-center mb-4" />

        {/* Big VAULT wordmark */}
        <h1
          id="hero-title"
          style={{
            fontFamily: "var(--font-display), 'Syne', sans-serif",
            fontSize: "clamp(44px, 13vw, 120px)",
            fontWeight: 700,
            letterSpacing: "clamp(4px, 2vw, 18px)",
            lineHeight: 1,
            color: "var(--vault-text)",
            opacity: 0,
            animation: "vaultIn 600ms cubic-bezier(0.16, 1, 0.3, 1) 150ms forwards",
          }}
        >
          VAULT
        </h1>

        {/* Small manifesto line */}
        <div
          className="mt-4"
          style={{
            fontFamily: "var(--font-mono), 'Courier New', 'SF Mono', monospace",
            fontSize: "clamp(8px, 1.4vw, 11px)",
            fontWeight: 300,
            letterSpacing: "clamp(3px, 1vw, 6px)",
            lineHeight: 2,
            textAlign: "center",
            whiteSpace: "pre",
          }}
        >
          <div id="hero-line1">{renderLine(line1)}</div>
          <div id="hero-line2">{renderLine(line2)}</div>
        </div>

        {/* Kept (empty) for brand-mode override; no "by VUAL" on VUAL */}
        <p id="hero-subtitle" className="mt-3 text-[9px] tracking-[5px] font-light" style={{ color: "var(--vault-text-dim)" }} />
      </div>
    </section>
  );
}

export default function VaultHome() {
  return (
    <main className="relative">
      <HeroSection />
      <HeroAnimations />
      {/* Feed (categories + articles + Experience grids) is injected here */}
      <div id="vault-content-root" style={{ minHeight: "100vh" }} />
    </main>
  );
}
