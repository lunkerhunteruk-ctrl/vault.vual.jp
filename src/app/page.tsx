import { HeroAnimations } from "@/components/HeroAnimations";

function HeroSection() {
  const line1 = "OWN NOTHING.";
  const line2 = "INJECT YOUR DNA.";
  const stagger = 50; // ms per char
  const startDelay = 500;
  let charIndex = 0;

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
            color: "var(--vault-text)",
            animation: `charStrike 200ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms forwards`,
          }}
        >
          {char}
        </span>
      );
    });

  return (
    <section className="flex flex-col items-center justify-center relative" style={{ height: "100dvh" }}>
      <style>{`
        @keyframes charStrike {
          0% { opacity: 0; transform: scale(1.15); }
          40% { opacity: 1; transform: scale(1.02); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div className="text-center w-full px-6 relative z-10">
        <p className="text-[11px] tracking-[8px] font-light mb-8" style={{ color: "var(--vault-text-dim)" }}>
          VAULT
        </p>
        <div
          style={{
            fontFamily: "var(--font-mono), 'Courier New', 'SF Mono', monospace",
            fontSize: "clamp(16px, 4vw, 32px)",
            fontWeight: 300,
            letterSpacing: "clamp(5px, 1.5vw, 14px)",
            lineHeight: 1.8,
            textAlign: "center",
            whiteSpace: "pre",
          }}
        >
          <div>{renderLine(line1)}</div>
          <div>{renderLine(line2)}</div>
        </div>
        <div className="mx-auto mt-8 w-[1px] h-8" style={{ background: "var(--vault-border)" }} />
        <p className="mt-4 text-[9px] tracking-[5px] font-light" style={{ color: "var(--vault-text-dim)" }}>
          by VUAL
        </p>
      </div>
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
        <div className="w-[1px] h-8 animate-pulse" style={{ background: "var(--vault-border)" }} />
      </div>
    </section>
  );
}

export default function VaultHome() {
  return (
    <main className="relative">
      <HeroSection />
      <HeroAnimations />
      {/* Spacer ensures scrollable area exists before Firebase loads */}
      <div id="vault-content-root" style={{ minHeight: "100vh" }} />
    </main>
  );
}
