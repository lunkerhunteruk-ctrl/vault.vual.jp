"use client";

import { useState, useEffect } from "react";
import { VaultArticle } from "@/lib/articles";

// ── Block renderers ──────────────────────────────────────

function FullBleedBlock({ block, onImageClick }: { block: any; onImageClick: (src: string) => void }) {
  return (
    <section className="relative w-full" style={{ minHeight: "70vh" }}>
      {block.image && (
        <img
          src={block.image}
          alt={block.heading || ""}
          className="w-full h-full object-cover absolute inset-0 cursor-zoom-in"
          style={{ minHeight: "70vh" }}
          onClick={() => onImageClick(block.image)}
        />
      )}
      {(block.heading || block.sub) && (
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 bg-gradient-to-t from-black/60 to-transparent pointer-events-none">
          {block.heading && (
            <h2 className="text-[28px] md:text-[36px] tracking-[6px] font-light text-white text-center px-8 leading-relaxed">
              {block.heading}
            </h2>
          )}
          {block.sub && (
            <p className="text-[11px] tracking-[4px] font-light text-white/60 mt-3">{block.sub}</p>
          )}
        </div>
      )}
    </section>
  );
}

function TextImageBlock({ block, onImageClick }: { block: any; onImageClick: (src: string) => void }) {
  const isLeft = block.side === "left";
  return (
    <section className="max-w-5xl mx-auto px-6 py-16">
      <div className={`flex flex-col md:flex-row gap-8 md:gap-12 ${isLeft ? "" : "md:flex-row-reverse"}`}>
        <div className="md:w-1/2 flex items-center">
          <div className="text-[13px] md:text-[14px] leading-[2] font-light whitespace-pre-wrap" style={{ color: "var(--vault-text, #fff)" }}>
            {block.body}
          </div>
        </div>
        <div className="md:w-1/2">
          {block.image && (
            <img src={block.image} alt="" className="w-full rounded-sm object-cover cursor-zoom-in" onClick={() => onImageClick(block.image)} />
          )}
        </div>
      </div>
    </section>
  );
}

function GalleryBlock({ block, onImageClick }: { block: any; onImageClick: (src: string) => void }) {
  const images = block.images || [];
  const cols = images.length <= 2 ? images.length : images.length <= 4 ? 2 : 3;
  return (
    <section className="max-w-5xl mx-auto px-6 py-12">
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {images.map((img: string, i: number) => (
          <div key={i} className="aspect-[3/4] overflow-hidden rounded-sm">
            <img src={img} alt="" className="w-full h-full object-cover cursor-zoom-in hover:scale-[1.02] transition-transform duration-500" onClick={() => onImageClick(img)} />
          </div>
        ))}
      </div>
      {block.caption && (
        <p className="text-[10px] tracking-[2px] font-light text-center mt-4" style={{ color: "var(--vault-text-dim, rgba(255,255,255,0.35))" }}>
          {block.caption}
        </p>
      )}
    </section>
  );
}

function QuoteBlock({ block }: { block: any; onImageClick: (src: string) => void }) {
  return (
    <section className="max-w-3xl mx-auto px-8 py-20 text-center">
      <div className="w-8 h-[1px] mx-auto mb-8" style={{ background: "var(--vault-border, rgba(255,255,255,0.1))" }} />
      <blockquote className="text-[16px] md:text-[20px] leading-[2] font-light italic" style={{ color: "var(--vault-text, #fff)" }}>
        {block.text}
      </blockquote>
      {block.attribution && (
        <p className="text-[10px] tracking-[3px] font-light mt-6" style={{ color: "var(--vault-text-dim, rgba(255,255,255,0.4))" }}>
          — {block.attribution}
        </p>
      )}
      <div className="w-8 h-[1px] mx-auto mt-8" style={{ background: "var(--vault-border, rgba(255,255,255,0.1))" }} />
    </section>
  );
}

function TextOnlyBlock({ block }: { block: any }) {
  return (
    <section className="max-w-3xl mx-auto px-8 py-12">
      <div className="text-[13px] md:text-[14px] leading-[2.2] font-light whitespace-pre-wrap" style={{ color: "var(--vault-text, #fff)" }}>
        {block.body}
      </div>
    </section>
  );
}

function VideoBlock({ block }: { block: any }) {
  const src = block.src || "";
  const isStreamId = /^[a-f0-9]{32}$/.test(src);
  return (
    <section className="max-w-5xl mx-auto px-6 py-12">
      <div className="aspect-video overflow-hidden rounded-sm" style={{ background: "#000" }}>
        {isStreamId ? (
          <iframe
            src={`https://customer-iachfaxtqeo2l99t.cloudflarestream.com/${src}/iframe`}
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        ) : (
          <video src={src} controls playsInline className="w-full h-full object-contain" />
        )}
      </div>
      {block.caption && (
        <p className="text-[10px] tracking-[2px] font-light text-center mt-4" style={{ color: "var(--vault-text-dim, rgba(255,255,255,0.35))" }}>
          {block.caption}
        </p>
      )}
    </section>
  );
}

const BLOCK_RENDERERS: Record<string, React.FC<{ block: any; onImageClick: (src: string) => void }>> = {
  fullBleed: FullBleedBlock,
  textImage: TextImageBlock,
  gallery: GalleryBlock,
  quote: QuoteBlock,
  textOnly: TextOnlyBlock,
  video: VideoBlock,
};

// ── Article body: header + blocks, rendered inline (no cover, no click-to-open) ──

export function ArticleBody({ article, showHeader = true }: { article: VaultArticle; showHeader?: boolean }) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightboxSrc(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <article>
      {showHeader && (
        <header className="pt-12 pb-2 px-6 text-center max-w-3xl mx-auto">
          <p className="text-[8px] tracking-[4px] font-light mb-3" style={{ color: "var(--vault-text-dim, rgba(0,0,0,0.35))" }}>
            {article.category.toUpperCase()} · {article.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }).toUpperCase()}
          </p>
          <h2 className="text-[22px] md:text-[28px] tracking-[4px] font-light leading-relaxed" style={{ color: "var(--vault-text, #111)" }}>
            {article.title}
          </h2>
        </header>
      )}

      {article.blocks.map((block) => {
        const Renderer = BLOCK_RENDERERS[block.type];
        if (!Renderer) return null;
        return <Renderer key={block.id} block={block} onImageClick={setLightboxSrc} />;
      })}

      {lightboxSrc && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center cursor-pointer" style={{ background: "rgba(0,0,0,0.92)" }} onClick={() => setLightboxSrc(null)}>
          <img src={lightboxSrc} alt="" className="max-w-[92vw] max-h-[90vh] object-contain" onClick={(e) => e.stopPropagation()} />
          <button onClick={() => setLightboxSrc(null)} className="absolute top-6 right-6 text-white/40 hover:text-white/80 text-[20px] transition-colors cursor-pointer">✕</button>
        </div>
      )}
    </article>
  );
}
