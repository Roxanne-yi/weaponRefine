/**
 * 五阶段表演流程 - development 第 2 节 A
 * IDLE -> ROLLING_QUALITY -> SELECT_BUFF -> SLIDER_ANIM -> CALC_CP -> RESULT
 * 时序拉长以增强仪式感
 */
import type { RefinePhase } from "@/store/useWeaponStore";
import { delay } from "@/lib/delay";

/** 与右侧面板品质阶梯动画共用，避免时长不一致 */
export const ROLLING_DURATION_MS = 2800;
/** 与右侧面板 Handling BUFF 递进动画共用 */
export const SELECT_BUFF_DURATION_MS = 1100;
const SLIDER_ANIM_DURATION_MS = 900;
const CALC_CP_DURATION_MS = 1100;
export async function runRefineSequence(
  setPhase: (p: RefinePhase) => void
): Promise<void> {
  setPhase("ROLLING_QUALITY");
  await delay(ROLLING_DURATION_MS);
  setPhase("SELECT_BUFF");
  await delay(SELECT_BUFF_DURATION_MS);
  setPhase("SLIDER_ANIM");
  await delay(SLIDER_ANIM_DURATION_MS);
  setPhase("CALC_CP");
  await delay(CALC_CP_DURATION_MS);
  setPhase("RESULT");
}
