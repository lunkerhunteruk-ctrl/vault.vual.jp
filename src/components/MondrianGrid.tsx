"use client";

import { useRef } from "react";
import Image from "next/image";
import { VaultMedia } from "@/data/types";
import { HlsVideo } from "./HlsVideo";

interface PlacedCell {
  colStart: number;
  colEnd: number;
  rowStart: number;
  rowEnd: number;
}

// 8 images (all 3:4). 12×15 grid, no overlap, no gaps.
function layout8Images(): PlacedCell[] {
  return [
    { colStart: 1, colEnd: 7, rowStart: 1, rowEnd: 7 },
    { colStart: 7, colEnd: 10, rowStart: 1, rowEnd: 4 },
    { colStart: 10, colEnd: 13, rowStart: 1, rowEnd: 4 },
    { colStart: 7, colEnd: 13, rowStart: 4, rowEnd: 10 },
    { colStart: 1, colEnd: 4, rowStart: 7, rowEnd: 10 },
    { colStart: 4, colEnd: 7, rowStart: 7, rowEnd: 10 },
    { colStart: 1, colEnd: 7, rowStart: 10, rowEnd: 16 },
    { colStart: 7, colEnd: 13, rowStart: 10, rowEnd: 16 },
  ];
}

// Video (9:16) + 8 images. 12×16 grid, no overlap, no gaps.
// i6/i7 are 3×4 (slight crop), i8 is 12×4 (wide cinematic).
function videoPlus8Layout(): PlacedCell[] {
  return [
    { colStart: 1, colEnd: 7, rowStart: 1, rowEnd: 9 },     // VIDEO 6×8 (9:16)
    { colStart: 7, colEnd: 10, rowStart: 1, rowEnd: 4 },    // i1 3×3
    { colStart: 10, colEnd: 13, rowStart: 1, rowEnd: 4 },   // i2 3×3
    { colStart: 7, colEnd: 10, rowStart: 4, rowEnd: 7 },    // i3 3×3
    { colStart: 10, colEnd: 13, rowStart: 4, rowEnd: 7 },   // i4 3×3
    { colStart: 7, colEnd: 13, rowStart: 7, rowEnd: 13 },   // i5 6×6
    { colStart: 1, colEnd: 4, rowStart: 9, rowEnd: 13 },    // i6 3×4
    { colStart: 4, colEnd: 7, rowStart: 9, rowEnd: 13 },    // i7 3×4
    { colStart: 1, colEnd: 7, rowStart: 13, rowEnd: 19 },   // i8 6×6 (left, right is negative space)
  ];
}

function rowSpanForAspect(aspect: string, colSpan: number): number {
  const [w, h] = aspect.split(":").map(Number);
  return Math.round(colSpan * (3 * h) / (4 * w));
}

function layoutFallback(media: { aspect: string }[]): PlacedCell[] {
  const placements: PlacedCell[] = [];
  let row = 1;
  for (let i = 0; i < media.length; i += 2) {
    const span = rowSpanForAspect(media[i].aspect, 6);
    placements.push({ colStart: 1, colEnd: 7, rowStart: row, rowEnd: row + span });
    if (i + 1 < media.length) {
      const span2 = rowSpanForAspect(media[i + 1].aspect, 6);
      placements.push({ colStart: 7, colEnd: 13, rowStart: row, rowEnd: row + span2 });
      row += Math.max(span, span2);
    } else {
      row += span;
    }
  }
  return placements;
}

interface MondrianGridProps {
  media: (VaultMedia & { locationId: string })[];
  onImageClick: (media: VaultMedia & { locationId: string }) => void;
  onVideoClick: (src: string) => void;
}

export function MondrianGrid({ media, onImageClick, onVideoClick }: MondrianGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  const hasVideo = media.some((m) => m.type === "video");
  const imageCount = media.filter((m) => m.type === "image").length;

  let placements: PlacedCell[];
  if (hasVideo && imageCount === 8) {
    placements = videoPlus8Layout();
  } else if (!hasVideo && imageCount === 8) {
    placements = layout8Images();
  } else {
    placements = layoutFallback(media.map((m) => ({ aspect: m.aspect })));
  }

  const maxRow = Math.max(...placements.map((p) => p.rowEnd)) - 1;

  return (
    <div
      ref={gridRef}
      className="grid gap-[2px]"
      style={{
        gridTemplateColumns: "repeat(12, 1fr)",
        gridTemplateRows: `repeat(${maxRow}, calc(100vw / 12 * 4 / 3))`,
      }}
    >
      {media.map((item, i) => {
        const p = placements[i % placements.length];
        const isVideo = item.type === "video";

        return (
          <div
            key={i}
            className="relative overflow-hidden cursor-pointer group"
            style={{
              gridColumn: `${p.colStart} / ${p.colEnd}`,
              gridRow: `${p.rowStart} / ${p.rowEnd}`,
            }}
            onClick={() => isVideo ? onVideoClick(item.file) : onImageClick(item)}
          >
            {isVideo ? (
              <HlsVideo
                src={item.file}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <Image
                src={item.file}
                alt=""
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
                loading="lazy"
              />
            )}
            {!isVideo && (
              <>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-[10px] tracking-[3px] text-white/70 font-light">
                    STEP IN
                  </span>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
