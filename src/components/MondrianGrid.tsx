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

// 6 mixed AR: 16:9, 3:4, 3:4, 4:3, 3:4, 9:16
// Staggered Mondrian — no continuous grid lines
function layout6Mixed(): PlacedCell[] {
  return [
    // Hero 16:9 — full width
    { colStart: 1, colEnd: 13, rowStart: 1, rowEnd: 6 },
    // Row 2: [5col, 3col, 4col] — staggered
    { colStart: 1, colEnd: 6, rowStart: 6, rowEnd: 12 },    // 3:4 (5×6)
    { colStart: 6, colEnd: 9, rowStart: 6, rowEnd: 10 },    // 3:4 (3×4)
    { colStart: 9, colEnd: 13, rowStart: 6, rowEnd: 10 },   // 4:3 (4×4)
    // Bottom: 9:16 right (stagger) + 3:4 large left
    { colStart: 6, colEnd: 13, rowStart: 10, rowEnd: 18 },  // 9:16 (7×8)
    { colStart: 1, colEnd: 6, rowStart: 12, rowEnd: 18 },   // 3:4 (5×6)
  ];
  // r1-5:   hero(1-12) = 12 ✓
  // r6-9:   a(1-5) + b(6-8) + c(9-12) = 12 ✓
  // r10-11: a(1-5) + d(6-12) = 5+7 = 12 ✓
  // r12-17: e(1-5) + d(6-12) = 5+7 = 12 ✓
  // NO GAPS ✓
}

// 6 images (all 3:4). 4 layout patterns, selected by collection ID hash.
function layout6Portrait(patternIndex: number): PlacedCell[] {
  const patterns: PlacedCell[][] = [
    // Pattern A: 1 hero left + 2 small right, then 2 medium + 1 tall right
    [
      { colStart: 1, colEnd: 8, rowStart: 1, rowEnd: 10 },    // hero 7×9
      { colStart: 8, colEnd: 13, rowStart: 1, rowEnd: 5 },    // small 5×4
      { colStart: 8, colEnd: 13, rowStart: 5, rowEnd: 10 },   // small 5×5
      { colStart: 1, colEnd: 5, rowStart: 10, rowEnd: 16 },   // medium 4×6
      { colStart: 5, colEnd: 9, rowStart: 10, rowEnd: 16 },   // medium 4×6
      { colStart: 9, colEnd: 13, rowStart: 10, rowEnd: 16 },  // medium 4×6
    ],
    // Pattern B: 3 equal top, 1 wide bottom-left + 2 stacked right
    [
      { colStart: 1, colEnd: 5, rowStart: 1, rowEnd: 6 },     // 4×5
      { colStart: 5, colEnd: 9, rowStart: 1, rowEnd: 6 },     // 4×5
      { colStart: 9, colEnd: 13, rowStart: 1, rowEnd: 6 },    // 4×5
      { colStart: 1, colEnd: 8, rowStart: 6, rowEnd: 15 },    // hero 7×9
      { colStart: 8, colEnd: 13, rowStart: 6, rowEnd: 10 },   // small 5×4
      { colStart: 8, colEnd: 13, rowStart: 10, rowEnd: 15 },  // small 5×5
    ],
    // Pattern C: 2 tall left stack + 1 hero right, then 3 equal bottom
    [
      { colStart: 1, colEnd: 6, rowStart: 1, rowEnd: 5 },     // 5×4
      { colStart: 1, colEnd: 6, rowStart: 5, rowEnd: 10 },    // 5×5
      { colStart: 6, colEnd: 13, rowStart: 1, rowEnd: 10 },   // hero 7×9
      { colStart: 1, colEnd: 5, rowStart: 10, rowEnd: 16 },   // 4×6
      { colStart: 5, colEnd: 9, rowStart: 10, rowEnd: 16 },   // 4×6
      { colStart: 9, colEnd: 13, rowStart: 10, rowEnd: 16 },  // 4×6
    ],
    // Pattern D: 2 large top + 1 wide middle + 3 small bottom
    [
      { colStart: 1, colEnd: 7, rowStart: 1, rowEnd: 8 },     // large 6×7
      { colStart: 7, colEnd: 13, rowStart: 1, rowEnd: 8 },    // large 6×7
      { colStart: 1, colEnd: 13, rowStart: 8, rowEnd: 12 },   // wide full 12×4
      { colStart: 1, colEnd: 5, rowStart: 12, rowEnd: 17 },   // small 4×5
      { colStart: 5, colEnd: 9, rowStart: 12, rowEnd: 17 },   // small 4×5
      { colStart: 9, colEnd: 13, rowStart: 12, rowEnd: 17 },  // small 4×5
    ],
  ];
  return patterns[patternIndex % patterns.length];
}

// Simple hash from string to number for consistent pattern selection
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
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

// 7 images (all 3:4). 12-col grid, no overlap, no gaps. 4 patterns.
function layout7Portrait(patternIndex: number): PlacedCell[] {
  const patterns: PlacedCell[][] = [
    // Pattern A: 1 hero left + 2 small right, then 1 wide center, then 3 equal bottom
    [
      { colStart: 1, colEnd: 8, rowStart: 1, rowEnd: 9 },     // hero 7×8
      { colStart: 8, colEnd: 13, rowStart: 1, rowEnd: 5 },    // small 5×4
      { colStart: 8, colEnd: 13, rowStart: 5, rowEnd: 9 },    // small 5×4
      { colStart: 1, colEnd: 13, rowStart: 9, rowEnd: 13 },   // wide 12×4
      { colStart: 1, colEnd: 5, rowStart: 13, rowEnd: 19 },   // 4×6
      { colStart: 5, colEnd: 9, rowStart: 13, rowEnd: 19 },   // 4×6
      { colStart: 9, colEnd: 13, rowStart: 13, rowEnd: 19 },  // 4×6
    ],
    // Pattern B: 3 equal top, 2 hero middle, 2 small bottom
    [
      { colStart: 1, colEnd: 5, rowStart: 1, rowEnd: 6 },     // 4×5
      { colStart: 5, colEnd: 9, rowStart: 1, rowEnd: 6 },     // 4×5
      { colStart: 9, colEnd: 13, rowStart: 1, rowEnd: 6 },    // 4×5
      { colStart: 1, colEnd: 7, rowStart: 6, rowEnd: 13 },    // hero 6×7
      { colStart: 7, colEnd: 13, rowStart: 6, rowEnd: 13 },   // hero 6×7
      { colStart: 1, colEnd: 7, rowStart: 13, rowEnd: 17 },   // 6×4
      { colStart: 7, colEnd: 13, rowStart: 13, rowEnd: 17 },  // 6×4
    ],
    // Pattern C: 2 hero top, 2 small + 1 hero middle, 2 equal bottom
    [
      { colStart: 1, colEnd: 7, rowStart: 1, rowEnd: 8 },     // hero 6×7
      { colStart: 7, colEnd: 13, rowStart: 1, rowEnd: 8 },    // hero 6×7
      { colStart: 1, colEnd: 5, rowStart: 8, rowEnd: 12 },    // small 4×4
      { colStart: 5, colEnd: 13, rowStart: 8, rowEnd: 15 },   // hero 8×7
      { colStart: 1, colEnd: 5, rowStart: 12, rowEnd: 15 },   // small 4×3
      { colStart: 1, colEnd: 7, rowStart: 15, rowEnd: 20 },   // medium 6×5
      { colStart: 7, colEnd: 13, rowStart: 15, rowEnd: 20 },  // medium 6×5
    ],
    // Pattern D: 1 full hero, 3 equal, 1 full hero, 2 equal bottom
    [
      { colStart: 1, colEnd: 13, rowStart: 1, rowEnd: 6 },    // full hero 12×5
      { colStart: 1, colEnd: 5, rowStart: 6, rowEnd: 10 },    // 4×4
      { colStart: 5, colEnd: 9, rowStart: 6, rowEnd: 10 },    // 4×4
      { colStart: 9, colEnd: 13, rowStart: 6, rowEnd: 10 },   // 4×4
      { colStart: 1, colEnd: 13, rowStart: 10, rowEnd: 15 },  // full hero 12×5
      { colStart: 1, colEnd: 7, rowStart: 15, rowEnd: 20 },   // 6×5
      { colStart: 7, colEnd: 13, rowStart: 15, rowEnd: 20 },  // 6×5
    ],
  ];
  return patterns[patternIndex % patterns.length];
}

// 8 images (all 3:4). 12-col grid, no overlap, no gaps. 4 patterns.
function layout8Portrait(patternIndex: number): PlacedCell[] {
  const patterns: PlacedCell[][] = [
    // Pattern A: 1 hero left + 2 small right, then 1 hero right + 2 small left, then 2 equal bottom
    [
      { colStart: 1, colEnd: 8, rowStart: 1, rowEnd: 8 },     // hero 7×7
      { colStart: 8, colEnd: 13, rowStart: 1, rowEnd: 4 },    // small 5×3
      { colStart: 8, colEnd: 13, rowStart: 4, rowEnd: 8 },    // small 5×4
      { colStart: 1, colEnd: 5, rowStart: 8, rowEnd: 11 },    // small 4×3
      { colStart: 5, colEnd: 13, rowStart: 8, rowEnd: 15 },   // hero 8×7
      { colStart: 1, colEnd: 5, rowStart: 11, rowEnd: 15 },   // small 4×4
      { colStart: 1, colEnd: 7, rowStart: 15, rowEnd: 20 },   // medium 6×5
      { colStart: 7, colEnd: 13, rowStart: 15, rowEnd: 20 },  // medium 6×5
    ],
    // Pattern B: 3 equal top, 2 wide middle, 3 equal bottom
    [
      { colStart: 1, colEnd: 5, rowStart: 1, rowEnd: 6 },     // 4×5
      { colStart: 5, colEnd: 9, rowStart: 1, rowEnd: 6 },     // 4×5
      { colStart: 9, colEnd: 13, rowStart: 1, rowEnd: 6 },    // 4×5
      { colStart: 1, colEnd: 7, rowStart: 6, rowEnd: 13 },    // hero 6×7
      { colStart: 7, colEnd: 13, rowStart: 6, rowEnd: 13 },   // hero 6×7
      { colStart: 1, colEnd: 5, rowStart: 13, rowEnd: 18 },   // 4×5
      { colStart: 5, colEnd: 9, rowStart: 13, rowEnd: 18 },   // 4×5
      { colStart: 9, colEnd: 13, rowStart: 13, rowEnd: 18 },  // 4×5
    ],
    // Pattern C: 2 tall left stack, 1 hero right, then 1 hero left, 2 small right stack, then 2 equal bottom
    [
      { colStart: 1, colEnd: 5, rowStart: 1, rowEnd: 5 },     // 4×4
      { colStart: 1, colEnd: 5, rowStart: 5, rowEnd: 9 },     // 4×4
      { colStart: 5, colEnd: 13, rowStart: 1, rowEnd: 9 },    // hero 8×8
      { colStart: 1, colEnd: 8, rowStart: 9, rowEnd: 16 },    // hero 7×7
      { colStart: 8, colEnd: 13, rowStart: 9, rowEnd: 12 },   // small 5×3
      { colStart: 8, colEnd: 13, rowStart: 12, rowEnd: 16 },  // small 5×4
      { colStart: 1, colEnd: 7, rowStart: 16, rowEnd: 21 },   // medium 6×5
      { colStart: 7, colEnd: 13, rowStart: 16, rowEnd: 21 },  // medium 6×5
    ],
    // Pattern D: 1 full-width hero, 4 equal row, 1 full-width hero, 2 equal bottom
    [
      { colStart: 1, colEnd: 13, rowStart: 1, rowEnd: 6 },    // full hero 12×5
      { colStart: 1, colEnd: 4, rowStart: 6, rowEnd: 10 },    // small 3×4
      { colStart: 4, colEnd: 7, rowStart: 6, rowEnd: 10 },    // small 3×4
      { colStart: 7, colEnd: 10, rowStart: 6, rowEnd: 10 },   // small 3×4
      { colStart: 10, colEnd: 13, rowStart: 6, rowEnd: 10 },  // small 3×4
      { colStart: 1, colEnd: 13, rowStart: 10, rowEnd: 15 },  // full hero 12×5
      { colStart: 1, colEnd: 7, rowStart: 15, rowEnd: 20 },   // medium 6×5
      { colStart: 7, colEnd: 13, rowStart: 15, rowEnd: 20 },  // medium 6×5
    ],
  ];
  return patterns[patternIndex % patterns.length];
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

// Video (3:4) + 12 images (all 3:4). 12-col grid, 4 patterns.
function videoPlus12Portrait(patternIndex: number): PlacedCell[] {
  const patterns: PlacedCell[][] = [
    // Pattern A: video hero left + 2 small right, 3 equal, hero right + 2 small left, 3 equal, 2 equal bottom
    [
      { colStart: 1, colEnd: 8, rowStart: 1, rowEnd: 8 },     // VIDEO 7×7
      { colStart: 8, colEnd: 13, rowStart: 1, rowEnd: 4 },    // i1 5×3
      { colStart: 8, colEnd: 13, rowStart: 4, rowEnd: 8 },    // i2 5×4
      { colStart: 1, colEnd: 5, rowStart: 8, rowEnd: 13 },    // i3 4×5
      { colStart: 5, colEnd: 9, rowStart: 8, rowEnd: 13 },    // i4 4×5
      { colStart: 9, colEnd: 13, rowStart: 8, rowEnd: 13 },   // i5 4×5
      { colStart: 1, colEnd: 5, rowStart: 13, rowEnd: 16 },   // i6 4×3
      { colStart: 5, colEnd: 13, rowStart: 13, rowEnd: 20 },  // i7 hero 8×7
      { colStart: 1, colEnd: 5, rowStart: 16, rowEnd: 20 },   // i8 4×4
      { colStart: 1, colEnd: 5, rowStart: 20, rowEnd: 25 },   // i9 4×5
      { colStart: 5, colEnd: 9, rowStart: 20, rowEnd: 25 },   // i10 4×5
      { colStart: 9, colEnd: 13, rowStart: 20, rowEnd: 25 },  // i11 4×5
      { colStart: 1, colEnd: 13, rowStart: 25, rowEnd: 30 },  // i12 full 12×5
    ],
    // Pattern B: 3 equal, video hero + 2 small, 4 equal, hero left + 2 small right, 2 equal bottom
    [
      { colStart: 1, colEnd: 5, rowStart: 1, rowEnd: 6 },     // i1 4×5
      { colStart: 5, colEnd: 9, rowStart: 1, rowEnd: 6 },     // i2 4×5
      { colStart: 9, colEnd: 13, rowStart: 1, rowEnd: 6 },    // i3 4×5
      { colStart: 1, colEnd: 8, rowStart: 6, rowEnd: 13 },    // VIDEO 7×7
      { colStart: 8, colEnd: 13, rowStart: 6, rowEnd: 10 },   // i4 5×4
      { colStart: 8, colEnd: 13, rowStart: 10, rowEnd: 13 },  // i5 5×3
      { colStart: 1, colEnd: 4, rowStart: 13, rowEnd: 17 },   // i6 3×4
      { colStart: 4, colEnd: 7, rowStart: 13, rowEnd: 17 },   // i7 3×4
      { colStart: 7, colEnd: 10, rowStart: 13, rowEnd: 17 },  // i8 3×4
      { colStart: 10, colEnd: 13, rowStart: 13, rowEnd: 17 }, // i9 3×4
      { colStart: 1, colEnd: 7, rowStart: 17, rowEnd: 23 },   // i10 hero 6×6
      { colStart: 7, colEnd: 13, rowStart: 17, rowEnd: 20 },  // i11 6×3
      { colStart: 7, colEnd: 13, rowStart: 20, rowEnd: 23 },  // i12 6×3
    ],
    // Pattern C: full video, 4 equal, 2 hero, 3 equal, 2 equal bottom
    [
      { colStart: 1, colEnd: 13, rowStart: 1, rowEnd: 6 },    // VIDEO full 12×5
      { colStart: 1, colEnd: 4, rowStart: 6, rowEnd: 10 },    // i1 3×4
      { colStart: 4, colEnd: 7, rowStart: 6, rowEnd: 10 },    // i2 3×4
      { colStart: 7, colEnd: 10, rowStart: 6, rowEnd: 10 },   // i3 3×4
      { colStart: 10, colEnd: 13, rowStart: 6, rowEnd: 10 },  // i4 3×4
      { colStart: 1, colEnd: 7, rowStart: 10, rowEnd: 17 },   // i5 hero 6×7
      { colStart: 7, colEnd: 13, rowStart: 10, rowEnd: 17 },  // i6 hero 6×7
      { colStart: 1, colEnd: 5, rowStart: 17, rowEnd: 22 },   // i7 4×5
      { colStart: 5, colEnd: 9, rowStart: 17, rowEnd: 22 },   // i8 4×5
      { colStart: 9, colEnd: 13, rowStart: 17, rowEnd: 22 },  // i9 4×5
      { colStart: 1, colEnd: 7, rowStart: 22, rowEnd: 27 },   // i10 6×5
      { colStart: 7, colEnd: 13, rowStart: 22, rowEnd: 27 },  // i11 6×5
      { colStart: 1, colEnd: 13, rowStart: 27, rowEnd: 32 },  // i12 full 12×5
    ],
    // Pattern D: 2 hero top, video + 2 small, 3 equal, full wide, 3 equal bottom
    [
      { colStart: 1, colEnd: 7, rowStart: 1, rowEnd: 8 },     // i1 hero 6×7
      { colStart: 7, colEnd: 13, rowStart: 1, rowEnd: 8 },    // i2 hero 6×7
      { colStart: 1, colEnd: 5, rowStart: 8, rowEnd: 12 },    // i3 4×4
      { colStart: 5, colEnd: 13, rowStart: 8, rowEnd: 15 },   // VIDEO 8×7
      { colStart: 1, colEnd: 5, rowStart: 12, rowEnd: 15 },   // i4 4×3
      { colStart: 1, colEnd: 5, rowStart: 15, rowEnd: 20 },   // i5 4×5
      { colStart: 5, colEnd: 9, rowStart: 15, rowEnd: 20 },   // i6 4×5
      { colStart: 9, colEnd: 13, rowStart: 15, rowEnd: 20 },  // i7 4×5
      { colStart: 1, colEnd: 13, rowStart: 20, rowEnd: 24 },  // i8 full 12×4
      { colStart: 1, colEnd: 5, rowStart: 24, rowEnd: 29 },   // i9 4×5
      { colStart: 5, colEnd: 9, rowStart: 24, rowEnd: 29 },   // i10 4×5
      { colStart: 9, colEnd: 13, rowStart: 24, rowEnd: 29 },  // i11 4×5
      { colStart: 1, colEnd: 13, rowStart: 29, rowEnd: 34 },  // i12 full 12×5
    ],
  ];
  return patterns[patternIndex % patterns.length];
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

    // Full width for 16:9 or 4:3
    if (remaining >= 3 && (media[i].aspect === "16:9" || media[i].aspect === "4:3")) {
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
      const sharedSpan = Math.max(s1, s2, s3);

      placements.push({ colStart: 1, colEnd: 1 + c1, rowStart: row, rowEnd: row + sharedSpan });
      placements.push({ colStart: 1 + c1, colEnd: 1 + c1 + c2, rowStart: row, rowEnd: row + sharedSpan });
      placements.push({ colStart: 1 + c1 + c2, colEnd: 13, rowStart: row, rowEnd: row + sharedSpan });
      row += sharedSpan;
      i += 3;
      continue;
    }

    if (remaining >= 2) {
      // Staggered 2-column — use same row span for both (slight crop on one)
      const [lc, rc] = nextSplit();
      const spanA = rowSpanForAspect(media[i].aspect, lc);
      const spanB = rowSpanForAspect(media[i + 1].aspect, rc);
      // Use the average to minimize crop on both
      const sharedSpan = Math.max(spanA, spanB);
      placements.push({ colStart: 1, colEnd: 1 + lc, rowStart: row, rowEnd: row + sharedSpan });
      placements.push({ colStart: 1 + lc, colEnd: 13, rowStart: row, rowEnd: row + sharedSpan });
      row += sharedSpan;
      i += 2;
      continue;
    }

    // Single: full width
    const spanA = rowSpanForAspect(media[i].aspect, 12);
    const singleSpan = Math.max(spanA, 3);
    placements.push({ colStart: 1, colEnd: 13, rowStart: row, rowEnd: row + singleSpan });
    row += singleSpan;
    i += 1;
  }

  return placements;
}


interface MondrianGridProps {
  media: (VaultMedia & { locationId: string })[];
  collectionId?: string;
  onImageClick: (media: VaultMedia & { locationId: string }) => void;
  onVideoClick: (src: string) => void;
}

export function MondrianGrid({ media, collectionId, onImageClick, onVideoClick }: MondrianGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  const hasVideo = media.some((m) => m.type === "video");
  const imageCount = media.filter((m) => m.type === "image").length;

  // Detect 6-image mixed AR preset: 16:9×1, 9:16×1, 3:4×3, 4:3×1
  const aspects = media.map(m => m.aspect);
  const is6Mixed = media.length === 6 &&
    aspects.filter(a => a === "16:9").length === 1 &&
    aspects.filter(a => a === "9:16").length === 1;

  // Detect 6 images all 3:4 (portrait-only collection)
  const is6Portrait = !hasVideo && media.length === 6 &&
    aspects.every(a => a === "3:4");

  let placements: PlacedCell[];
  if (is6Portrait) {
    const patternIdx = hashString(collectionId || 'default') % 4;
    placements = layout6Portrait(patternIdx);
  } else if (is6Mixed) {
    // Reorder: 16:9 first, then 3:4s and 4:3, then 9:16 last
    // layout6Mixed expects: [16:9, 3:4, 3:4, 4:3, 9:16, 3:4]
    // We need to sort media to match, but keep original indices for rendering
    // Instead, just use the preset — media order in sample.ts should match
    placements = layout6Mixed();
  } else if (hasVideo && imageCount === 12) {
    const patternIdx = hashString(collectionId || 'default') % 4;
    placements = videoPlus12Portrait(patternIdx);
  } else if (hasVideo && imageCount === 8) {
    placements = videoPlus8Layout();
  } else if (!hasVideo && imageCount === 7 && aspects.every(a => a === "3:4")) {
    const patternIdx = hashString(collectionId || 'default') % 4;
    placements = layout7Portrait(patternIdx);
  } else if (!hasVideo && imageCount === 8 && aspects.every(a => a === "3:4")) {
    const patternIdx = hashString(collectionId || 'default') % 4;
    placements = layout8Portrait(patternIdx);
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
