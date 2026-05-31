import { HeroAnimations } from "@/components/HeroAnimations";

function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center relative" style={{ height: "100dvh" }}>
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
            color: "var(--vault-text)",
          }}
        >
          <div>OWN NOTHING.</div>
          <div>INJECT YOUR DNA.</div>
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
    </main>
  );
}
