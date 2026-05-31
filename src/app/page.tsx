import { HeroSection } from "@/components/HeroSection";

export default function VaultHome() {
  return (
    <main className="relative">
      <HeroSection />
      <div style={{ height: "200vh", background: "red", opacity: 0.1 }} />
    </main>
  );
}
