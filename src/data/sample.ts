import { VaultTheme, VaultEntity } from "./types";

const R2_BASE = "https://pub-63bccf8e4ef949bb8384ab641631a180.r2.dev/vault/collections";
const STREAM_BASE = "https://customer-iachfaxtqeo2l99t.cloudflarestream.com";
const STREAM_SHOW01_ID = "96e6e49bcca584d5aba84bc0601de375";

export const sampleThemes: VaultTheme[] = [
  {
    id: "2026-05-20-shibuya",
    date: "5.20",
    city: "SHIBUYA",
    locations: [
      {
        id: "daily",
        name: "DAILY",
        implantPrompt: "とうきょう しぶや にちじょう",
        film: "leicaPortra800",
        media: [
          { file: `${STREAM_BASE}/${STREAM_SHOW01_ID}/downloads/default.mp4`, type: "video", aspect: "9:16" },
          { file: `${R2_BASE}/20-05-2026/look1.jpg`, type: "image", aspect: "3:4", isHero: true },
          { file: `${R2_BASE}/20-05-2026/look2.jpg`, type: "image", aspect: "3:4" },
          { file: `${R2_BASE}/20-05-2026/look3.jpg`, type: "image", aspect: "3:4" },
          { file: `${R2_BASE}/20-05-2026/look4.jpg`, type: "image", aspect: "3:4" },
          { file: `${R2_BASE}/20-05-2026/look5.jpg`, type: "image", aspect: "3:4", isCatwalk: true },
          { file: `${R2_BASE}/20-05-2026/look6.jpg`, type: "image", aspect: "3:4" },
          { file: `${R2_BASE}/20-05-2026/look7.jpg`, type: "image", aspect: "3:4" },
          { file: `${R2_BASE}/20-05-2026/look8.jpg`, type: "image", aspect: "3:4" },
        ],
      },
    ],
  },
];

export const sampleEntities: VaultEntity[] = [
  { id: "entity-001", name: "ENTITY_001", thumbnailUrl: "/entities/001.jpeg", referenceUrl: "/entities/001.jpeg" },
  { id: "entity-002", name: "ENTITY_002", thumbnailUrl: "/entities/002.jpeg", referenceUrl: "/entities/002.jpeg" },
  { id: "entity-003", name: "ENTITY_003", thumbnailUrl: "/entities/003.jpeg", referenceUrl: "/entities/003.jpeg" },
  { id: "entity-004", name: "ENTITY_004", thumbnailUrl: "/entities/004.jpeg", referenceUrl: "/entities/004.jpeg" },
  { id: "entity-005", name: "ENTITY_005", thumbnailUrl: "/entities/005.jpeg", referenceUrl: "/entities/005.jpeg" },
  { id: "entity-006", name: "ENTITY_006", thumbnailUrl: "/entities/006.jpeg", referenceUrl: "/entities/006.jpeg" },
  { id: "entity-007", name: "ENTITY_007", thumbnailUrl: "/entities/007.jpeg", referenceUrl: "/entities/007.jpeg" },
  { id: "entity-008", name: "ENTITY_008", thumbnailUrl: "/entities/008.jpeg", referenceUrl: "/entities/008.jpeg" },
  { id: "entity-009", name: "ENTITY_009", thumbnailUrl: "/entities/009.jpeg", referenceUrl: "/entities/009.jpeg" },
  { id: "entity-010", name: "ENTITY_010", thumbnailUrl: "/entities/010.jpeg", referenceUrl: "/entities/010.jpeg" },
  { id: "entity-011", name: "ENTITY_011", thumbnailUrl: "/entities/011.jpeg", referenceUrl: "/entities/011.jpeg" },
  { id: "entity-012", name: "ENTITY_012", thumbnailUrl: "/entities/012.jpeg", referenceUrl: "/entities/012.jpeg" },
];
