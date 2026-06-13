"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getArticleById, VaultArticle } from "@/lib/articles";
import { ArticleBody } from "@/components/ArticleBody";
import Link from "next/link";

export default function ArticleDetailPage() {
  const params = useParams();
  const [article, setArticle] = useState<VaultArticle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      getArticleById(params.id as string).then((data) => {
        setArticle(data);
        setLoading(false);
      });
    }
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--vault-bg, #0a0a0a)" }}>
        <p className="text-[11px] tracking-[3px]" style={{ color: "var(--vault-text-dim, rgba(255,255,255,0.2))" }}>LOADING</p>
      </main>
    );
  }

  if (!article) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--vault-bg, #0a0a0a)" }}>
        <p className="text-[11px] tracking-[3px]" style={{ color: "var(--vault-text-dim, rgba(255,255,255,0.3))" }}>ARTICLE NOT FOUND</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ background: "var(--vault-bg, #0a0a0a)", color: "var(--vault-text, #fff)" }}>
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between" style={{ background: "linear-gradient(to bottom, var(--vault-bg, #0a0a0a), transparent)" }}>
        <Link href="/articles" className="text-[9px] tracking-[4px] font-light hover:opacity-70 transition-opacity" style={{ color: "var(--vault-text-dim, rgba(255,255,255,0.4))" }}>
          EDITORIAL
        </Link>
        <span className="text-[8px] tracking-[3px] font-light" style={{ color: "var(--vault-text-dim, rgba(255,255,255,0.25))" }}>
          {article.category.toUpperCase()}
        </span>
      </nav>

      <div className="pt-12">
        <ArticleBody article={article} />
      </div>

      <footer className="py-20 text-center border-t" style={{ borderColor: "var(--vault-border, rgba(255,255,255,0.06))" }}>
        <Link href="/articles" className="text-[9px] tracking-[4px] font-light hover:opacity-70 transition-opacity" style={{ color: "var(--vault-text-dim, rgba(255,255,255,0.4))" }}>
          BACK TO EDITORIAL
        </Link>
        <div className="mt-6">
          <Link href="/" className="text-[8px] tracking-[5px] font-light" style={{ color: "var(--vault-text-dim, rgba(255,255,255,0.2))" }}>
            VAULT
          </Link>
        </div>
      </footer>
    </main>
  );
}
