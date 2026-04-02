/**
 * 品质配置 - 严格按 PRD 第 2 节 A / development 第 3.1 节
 * 各品质数值区间互不重叠
 */
export type QualityKey = "GREEN" | "BLUE" | "PURPLE" | "GOLD";

export const QUALITY_CONFIG: Record<
  QualityKey,
  { buff: string; buffValue: number; atk: [number, number]; def: [number, number]; color: string }
> = {
  GREEN: { buff: "+2%", buffValue: 2, atk: [50, 150], def: [100, 250], color: "#4ADE80" },
  BLUE: { buff: "+4%", buffValue: 4, atk: [151, 300], def: [251, 450], color: "#60A5FA" },
  PURPLE: { buff: "+6%", buffValue: 6, atk: [301, 500], def: [451, 700], color: "#A855F7" },
  GOLD: { buff: "+9%", buffValue: 9, atk: [501, 800], def: [701, 1000], color: "#FACC15" },
};

/** Combat stats 条图百分比换算（与 RefinePanel 一致） */
export const ATK_SLIDER_MAX = 800;
export const DEF_SLIDER_MAX = 1000;

/** 品质对应 Attack 在条上的占比区间 [min%, max%] */
export function qualityAtkPctRange(q: QualityKey): [number, number] {
  const [lo, hi] = QUALITY_CONFIG[q].atk;
  return [(lo / ATK_SLIDER_MAX) * 100, (hi / ATK_SLIDER_MAX) * 100];
}

/** 品质对应 Defense 在条上的占比区间 [min%, max%] */
export function qualityDefPctRange(q: QualityKey): [number, number] {
  const [lo, hi] = QUALITY_CONFIG[q].def;
  return [(lo / DEF_SLIDER_MAX) * 100, (hi / DEF_SLIDER_MAX) * 100];
}

/**
 * Combat stats 条底色素段宽度（% 之和为 100），按各品质数值上界在 0～max 上的占比划分，
 * 与 randomInRange(QUALITY_CONFIG[q].atk/def) 一致，避免「金色数值却落在紫/蓝色带」的视觉错位。
 */
export function combatStatBandWidthsPct(statKind: "atk" | "def"): [number, number, number, number] {
  const max = statKind === "atk" ? ATK_SLIDER_MAX : DEF_SLIDER_MAX;
  const key = statKind === "atk" ? "atk" : "def";
  const gHi = QUALITY_CONFIG.GREEN[key][1];
  const bHi = QUALITY_CONFIG.BLUE[key][1];
  const pHi = QUALITY_CONFIG.PURPLE[key][1];
  return [
    (gHi / max) * 100,
    ((bHi - gHi) / max) * 100,
    ((pHi - bHi) / max) * 100,
    ((max - pHi) / max) * 100,
  ];
}

/** 普通调校：品质动画与顶部钻石条仅绿→蓝→紫 */
export const QUALITY_LADDER_NORMAL: QualityKey[] = ["GREEN", "BLUE", "PURPLE"];

/** 高级调校：品质动画与顶部钻石条仅紫→金 */
export const QUALITY_LADDER_ADVANCED: QualityKey[] = ["PURPLE", "GOLD"];

/** 普通调校产出品质（绿/蓝/紫） */
export const NORMAL_QUALITIES: QualityKey[] = ["GREEN", "BLUE", "PURPLE"];

/** 高级调校产出品质（紫/金），权重 90% / 10% */
export const ADVANCED_QUALITIES: QualityKey[] = ["PURPLE", "GOLD"];
export const ADVANCED_WEIGHTS = [90, 10]; // Purple 90%, Gold 10%

/**
 * Combat Power 公式: (Atk * 2.5) + (Def * 1.5) + (BuffValue * 100)
 */
export function calcCombatPower(atk: number, def: number, buffValue: number): number {
  return Math.round(atk * 2.5 + def * 1.5 + buffValue * 100);
}

/** 在区间 [min, max] 内随机整数（含两端） */
export function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** 按权重随机选择品质索引 */
export function weightedRandomIndex(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}
