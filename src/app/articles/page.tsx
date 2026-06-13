"use client";

import { useState, useEffect } from "react";
import { getPublishedArticles, VaultArticle } from "@/lib/articles";
import { ArticleBody } from "@/components/ArticleBody";
import Link from "next/link";

const CATEGORIES = ["All", "Fashion", "Art", "Lifestyle", "Culture", "Interview"] as const;

export default function ArticlesPage() {
  const [articles, setArticles] = useState<VaultArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("All");

  useEffect(() => {
    getPublishedArticles("high").then((data) => {
      setArticles(data);
      setLoading(false);
    });
  }, []);

  const filtered = activeTab === "All" ? articles : articles.filter((a) => a.category === activeTab);

  return (
    <main className="min-h-screen" style={{ background: "var(--vault-bg, #0a0a0a)", color: "var(--vault-text, #fff)" }}>
      {/* Header */}
      <div className="pt-12 pb-8 px-6 text-center">
        <Link href="/" className="text-[10px] tracking-[6px] font-light" style={{ color: "var(--vault-text-dim, rgba(255,255,255,0.3))" }}>
          VAULT
        </Link>
        <h1 className="text-[13px] tracking-[8px] font-light mt-4" style={{ color: "var(--vault-text, #fff)" }}>
          EDITORIAL
        </h1>
      </div>

      {/* Category tabs */}
      <div className="flex justify-center gap-1 px-4 mb-10">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-3 py-1.5 text-[9px] tracking-[2px] font-light rounded cursor-pointer transition-colors ${
              activeTab === cat
                ? "bg-white/12 text-white/80"
                : "text-white/30 hover:text-white/50"
            }`}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Articles feed */}
      {loading ? (
        <div className="text-center py-20">
          <p className="text-[11px] text-white/20 tracking-[3px]">LOADING</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[11px] text-white/20 tracking-[3px]">NO ARTICLES YET</p>
        </div>
      ) : (
        <div className="pb-20">
          {filtered.map((article) => (
            <div key={article.id} style={{ borderTop: "0.5px solid var(--vault-border, rgba(255,255,255,0.08))" }}>
              <ArticleBody article={article} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
