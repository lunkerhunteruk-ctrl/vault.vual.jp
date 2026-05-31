"use client";

import { useState, useEffect } from "react";

export function DeferredContent() {
  const [Content, setContent] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    // Delay import to ensure page is fully interactive first
    const t = requestIdleCallback
      ? requestIdleCallback(() => {
          import("@/components/VaultContent").then((m) => {
            setContent(() => m.VaultContent);
          });
        })
      : setTimeout(() => {
          import("@/components/VaultContent").then((m) => {
            setContent(() => m.VaultContent);
          });
        }, 50);

    return () => {
      if (typeof t === "number" && cancelIdleCallback) cancelIdleCallback(t);
    };
  }, []);

  if (!Content) return null;
  return <Content />;
}
