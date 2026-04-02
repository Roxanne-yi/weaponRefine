/**
 * 武器调校状态 - development 第 2 节 A、第 3.2 节、第 5 节
 * 五阶段: IDLE -> ROLLING_QUALITY -> SELECT_BUFF -> SLIDER_ANIM -> CALC_CP -> RESULT
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QualityKey } from "@/lib/constants";
import {
  QUALITY_CONFIG,
  NORMAL_QUALITIES,
  ADVANCED_QUALITIES,
  ADVANCED_WEIGHTS,
  calcCombatPower,
  randomInRange,
  weightedRandomIndex,
} from "@/lib/constants";

export type RefinePhase =
  | "IDLE"
  | "ROLLING_QUALITY"
  | "SELECT_BUFF"
  | "SLIDER_ANIM"
  | "CALC_CP"
  | "RESULT";

export interface RefineResult {
  quality: QualityKey;
  handlingBuff: string;
  buffValue: number;
  atk: number;
  def: number;
  cp: number;
}

export interface SavedStats {
  quality: QualityKey;
  handlingBuff: string;
  buffValue: number;
  atk: number;
  def: number;
  cp: number;
}

const PITY_THRESHOLD = 9; // 第 10 次 (0-indexed 9) 必出金
/** 高级保底展示用满次数（与 PITY_THRESHOLD+1 一致） */
export const ADVANCED_PITY_DISPLAY_MAX = PITY_THRESHOLD + 1;
const NORMAL_COST_A = 99;
const ADVANCED_COST_B = 5;
/** 演示兜底：高级材料 B 不足时补到此数量（与初始库存一致） */
const DEMO_ADVANCED_MATERIAL_B = 200;

const initialSaved: SavedStats = {
  quality: "GREEN",
  handlingBuff: "+2%",
  buffValue: 2,
  atk: 90,
  def: 100,
  cp: calcCombatPower(90, 100, 2),
};

const initialState = {
  pityCount: 0,
  inventory: { materialA: 999, materialB: DEMO_ADVANCED_MATERIAL_B },
  saved: initialSaved,
  currentResult: null as RefineResult | null,
  phase: "IDLE" as RefinePhase,
  isSaving: false,
  /** 保存飞行动画期间，左侧展示的“待写入”结果，与右侧 currentResult 一致以驱动 layout 飞入 */
  pendingSaveResult: null as RefineResult | null,
  /** 右侧面板是否勾选高级材料（供全页左下角保底提示等使用） */
  materialAdvancedSelected: false,
};

type State = typeof initialState & {
  performRefine: (isAdvanced: boolean) => boolean;
  setPhase: (phase: RefinePhase) => void;
  saveResult: () => void;
  resetAfterSave: () => void;
  canRefine: (isAdvanced: boolean) => boolean;
  /** 开始保存：设置 pendingSaveResult 与 isSaving，用于飞行动画 */
  startSaveFly: () => void;
  /** 飞行动画结束后调用：写入 saved、清空并结束保存中 */
  completeSave: () => void;
  /** 演示环境兜底：普通材料不足时自动补满，避免交互被持久化库存卡死 */
  ensureNormalMaterialReady: () => void;
  /** 演示环境兜底：高级材料不足时自动补齐，便于连续测高级调校 */
  ensureAdvancedMaterialReady: () => void;
  setMaterialAdvancedSelected: (value: boolean) => void;
};

export const useWeaponStore = create<State>()(
  persist(
    (set, get) => ({
      ...initialState,

      canRefine(isAdvanced: boolean) {
        const { inventory } = get();
        if (isAdvanced) return inventory.materialB >= ADVANCED_COST_B;
        return inventory.materialA >= NORMAL_COST_A;
      },

      performRefine(isAdvanced: boolean) {
        const state = get();
        if (!state.canRefine(isAdvanced)) return false;

        let quality: QualityKey;
        let newPity = state.pityCount;

        if (isAdvanced) {
          if (state.pityCount >= PITY_THRESHOLD) {
            quality = "GOLD";
            newPity = 0;
          } else {
            const idx = weightedRandomIndex(ADVANCED_WEIGHTS);
            quality = ADVANCED_QUALITIES[idx];
            newPity = quality === "GOLD" ? 0 : state.pityCount + 1;
          }
          set((s) => ({
            pityCount: newPity,
            inventory: {
              ...s.inventory,
              materialB: s.inventory.materialB - ADVANCED_COST_B,
            },
          }));
        } else {
          const idx = Math.floor(Math.random() * NORMAL_QUALITIES.length);
          quality = NORMAL_QUALITIES[idx];
          set((s) => ({
            inventory: {
              ...s.inventory,
              materialA: s.inventory.materialA - NORMAL_COST_A,
            },
          }));
        }

        const config = QUALITY_CONFIG[quality];
        const atk = randomInRange(config.atk[0], config.atk[1]);
        const def = randomInRange(config.def[0], config.def[1]);
        const cp = calcCombatPower(atk, def, config.buffValue);

        const result: RefineResult = {
          quality,
          handlingBuff: config.buff,
          buffValue: config.buffValue,
          atk,
          def,
          cp,
        };

        set({ currentResult: result });
        return true;
      },

      setPhase(phase: RefinePhase) {
        set({ phase });
      },

      saveResult() {
        const { currentResult } = get();
        if (!currentResult) return;
        set({
          saved: {
            quality: currentResult.quality,
            handlingBuff: currentResult.handlingBuff,
            buffValue: currentResult.buffValue,
            atk: currentResult.atk,
            def: currentResult.def,
            cp: currentResult.cp,
          },
        });
      },

      resetAfterSave() {
        set({ currentResult: null, phase: "IDLE" });
      },

      startSaveFly() {
        const { currentResult } = get();
        if (!currentResult) return;
        set({
          isSaving: true,
          pendingSaveResult: { ...currentResult },
        });
      },

      completeSave() {
        const { pendingSaveResult } = get();
        if (pendingSaveResult) {
          set({
            saved: {
              quality: pendingSaveResult.quality,
              handlingBuff: pendingSaveResult.handlingBuff,
              buffValue: pendingSaveResult.buffValue,
              atk: pendingSaveResult.atk,
              def: pendingSaveResult.def,
              cp: pendingSaveResult.cp,
            },
          });
        }
        set({
          currentResult: null,
          phase: "IDLE",
          isSaving: false,
          pendingSaveResult: null,
        });
      },

      ensureNormalMaterialReady() {
        const { inventory } = get();
        if (inventory.materialA >= NORMAL_COST_A) return;
        set((s) => ({
          inventory: {
            ...s.inventory,
            materialA: 999,
          },
        }));
      },

      ensureAdvancedMaterialReady() {
        const { inventory } = get();
        if (inventory.materialB >= ADVANCED_COST_B) return;
        set((s) => ({
          inventory: {
            ...s.inventory,
            materialB: DEMO_ADVANCED_MATERIAL_B,
          },
        }));
      },

      setMaterialAdvancedSelected(materialAdvancedSelected) {
        set({ materialAdvancedSelected });
      },
    }),
    {
      name: "weapon-refine-storage",
      partialize: (s) => ({
        pityCount: s.pityCount,
        inventory: s.inventory,
        saved: s.saved,
      }),
    }
  )
);
