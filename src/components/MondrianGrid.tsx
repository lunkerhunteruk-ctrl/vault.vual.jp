"use client";

import { useRef } from "react";
import { VaultMedia } from "@/data/types";
import { InteractiveCell } from "./InteractiveCell";

interface PlacedCell {
  colStart: number;
  colEnd: number;
  rowStart: number;
  rowEnd: number;
}

// 4 images (all 3:4). 12×12 grid, no overlap, no gaps.
// 1 large + 3 small, or 2 large + 2 small
function layout4Images(): PlacedCell[] {
  return [
    { colStart: 1, colEnd: 7, rowStart: 1, rowEnd: 7 },     // A 6×6 large
    { colStart: 7, colEnd: 13, rowStart: 1, rowEnd: 7 },    // B 6×6 large
    { colStart: 1, colEnd: 7, rowStart: 7, rowEnd: 13 },    // C 6×6 large
    { colStart: 7, colEnd: 13, rowStart: 7, rowEnd: 13 },   // D 6×6 large
  ];
  // r1-6:  A(1-6) + B(7-12) = 12 ✓
  // r7-12: C(1-6) + D(7-12) = 12 ✓
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

// Video (9:16) + 12 images. No overlap, no gaps.
function videoPlus12Layout(): PlacedCell[] {
  return [
    // VIDEO: 6×8 (9:16)
    { colStart: 1, colEnd: 7, rowStart: 1, rowEnd: 9 },
    // i1-i4: 4 small right of video
    { colStart: 7, colEnd: 10, rowStart: 1, rowEnd: 4 },
    { colStart: 10, colEnd: 13, rowStart: 1, rowEnd: 4 },
    { colStart: 7, colEnd: 10, rowStart: 4, rowEnd: 7 },
    { colStart: 10, colEnd: 13, rowStart: 4, rowEnd: 7 },
    // i5: 6×6 large right
    { colStart: 7, colEnd: 13, rowStart: 7, rowEnd: 13 },
    // i6-i7: 2 small below video
    { colStart: 1, colEnd: 4, rowStart: 9, rowEnd: 12 },
    { colStart: 4, colEnd: 7, rowStart: 9, rowEnd: 12 },
    // i8: 6×6 large left
    { colStart: 1, colEnd: 7, rowStart: 12, rowEnd: 18 },
    // i9-i10: 2 small right
    { colStart: 7, colEnd: 10, rowStart: 13, rowEnd: 16 },
    { colStart: 10, colEnd: 13, rowStart: 13, rowEnd: 16 },
    // i11: 6×6 large right
    { colStart: 7, colEnd: 13, rowStart: 16, rowEnd: 22 },
    // i12: 6×6 large left (negative space right)
    { colStart: 1, colEnd: 7, rowStart: 18, rowEnd: 24 },
  ];
  // r1-3:   VID(1-6) + i1(7-9) + i2(10-12)     = 12 ✓
  // r4-6:   VID(1-6) + i3(7-9) + i4(10-12)     = 12 ✓
  // r7-8:   VID(1-6) + i5(7-12)                 = 12 ✓
  // r9-11:  i6(1-3) + i7(4-6) + i5(7-12)        = 12 ✓
  // r12:    i8(1-6) + i5(7-12)                   = 12 ✓
  // r13-15: i8(1-6) + i9(7-9) + i10(10-12)      = 12 ✓
  // r16-17: i8(1-6) + i11(7-12)                  = 12 ✓
  // r18-21: i12(1-6) + i11(7-12)                 = 12 ✓
  // r22-23: i12(1-6) only                        = negative space ✓
}

function rowSpanForAspect(aspect: string, colSpan: number): number {
  const [w, h] = aspect.split(":").map(Number);
  return Math.round(colSpan * (3 * h) / (4 * w));
}

// Dynamic Mondrian layout — staggered splits, no continuous grid lines
function layoutMondrian(media: { aspect: string; type: string }[]): PlacedCell[] {
  const placements: PlacedCell[] = [];
  let row = 1;
  let i = 0;

  // Split patterns that don't share a common center line
  // [leftCols, rightCols] — must sum to 12
  const splits: [number, number][] = [
    [5, 7], [7, 5], [4, 8], [8, 4], [5, 7], [7, 5],
  ];
  // Triple splits
  const tripleSplits: [number, number, number][] = [
    [4, 4, 4], [3, 5, 4], [5, 3, 4], [4, 5, 3],
  ];

  let splitIdx = 0;

  const nextSplit = (): [number, number] => {
    const s = splits[splitIdx % splits.length];
    splitIdx++;
    return s;
  };

  const nextTriple = (): [number, number, number] => {
    const s = tripleSplits[splitIdx % tripleSplits.length];
    splitIdx++;
    return s;
  };

  while (i < media.length) {
    const remaining = media.length - i;

    // Full width only for 16:9
    if (remaining >= 3 && media[i].aspect === "16:9") {
      // Wide image full width, then 2 below with staggered split
      const spanWide = rowSpanForAspect(media[i].aspect, 12);
      placements.push({ colStart: 1, colEnd: 13, rowStart: row, rowEnd: row + spanWide });
      row += spanWide;

      const [lc, rc] = nextSplit();
      const spanB = rowSpanForAspect(media[i + 1].aspect, lc);
      const spanC = rowSpanForAspect(media[i + 2].aspect, rc);
      placements.push({ colStart: 1, colEnd: 1 + lc, rowStart: row, rowEnd: row + spanB });
      placements.push({ colStart: 1 + lc, colEnd: 13, rowStart: row, rowEnd: row + spanC });
      row += Math.max(spanB, spanC);
      i += 3;
      continue;
    }

    // Try triple split for 3+ items
    if (remaining >= 3) {
      const [c1, c2, c3] = nextTriple();
      const s1 = rowSpanForAspect(media[i].aspect, c1);
      const s2 = rowSpanForAspect(media[i + 1].aspect, c2);
      const s3 = rowSpanForAspect(media[i + 2].aspect, c3);
      const maxSpan = Math.max(s1, s2, s3);

      placements.push({ colStart: 1, colEnd: 1 + c1, rowStart: row, rowEnd: row + s1 });
      placements.push({ colStart: 1 + c1, colEnd: 1 + c1 + c2, rowStart: row, rowEnd: row + s2 });
      placements.push({ colStart: 1 + c1 + c2, colEnd: 13, rowStart: row, rowEnd: row + s3 });
      row += maxSpan;
      i += 3;
      continue;
    }

    if (remaining >= 2) {
      // Staggered 2-column
      const [lc, rc] = nextSplit();
      const spanA = rowSpanForAspect(media[i].aspect, lc);
      const spanB = rowSpanForAspect(media[i + 1].aspect, rc);
      placements.push({ colStart: 1, colEnd: 1 + lc, rowStart: row, rowEnd: row + spanA });
      placements.push({ colStart: 1 + lc, colEnd: 13, rowStart: row, rowEnd: row + spanB });
      row += Math.max(spanA, spanB);
      i += 2;
      continue;
    }

    // Single: left-aligned with varied width
    const colW = [7, 8, 5][splitIdx % 3];
    const spanA = rowSpanForAspect(media[i].aspect, colW);
    placements.push({ colStart: 1, colEnd: 1 + colW, rowStart: row, rowEnd: row + spanA });
    row += spanA;
    splitIdx++;
    i += 1;
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
  if (hasVideo && imageCount === 12) {
    placements = videoPlus12Layout();
  } else if (hasVideo && imageCount === 8) {
    placements = videoPlus8Layout();
  } else if (!hasVideo && imageCount === 8) {
    placements = layout8Images();
  } else if (!hasVideo && imageCount === 4) {
    placements = layout4Images();
  } else {
    placements = layoutMondrian(media.map((m) => ({ aspect: m.aspect, type: m.type })));
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
          <InteractiveCell
            key={i}
            item={item}
            isVideo={isVideo}
            style={{
              gridColumn: `${p.colStart} / ${p.colEnd}`,
              gridRow: `${p.rowStart} / ${p.rowEnd}`,
            }}
            onImageClick={() => onImageClick(item)}
            onVideoClick={() => onVideoClick(item.file)}
          />
        );
      })}
    </div>
  );
}
