"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { figmaAssets } from "@/lib/figma-assets";
import { REFINE_PANEL } from "@/lib/figma-tokens";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Badge } from "@/components/ui/badge";
import { useWeaponStore, type RefinePhase } from "@/store/useWeaponStore";
import {
  runRefineSequence,
  ROLLING_DURATION_MS,
  SELECT_BUFF_DURATION_MS,
} from "@/components/RefineSequence";
import { GaugeSlider } from "@/components/GaugeSlider";
import {
  ATK_SLIDER_MAX,
  DEF_SLIDER_MAX,
  QUALITY_CONFIG,
  QUALITY_LADDER_ADVANCED,
  QUALITY_LADDER_NORMAL,
  type QualityKey,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { delay } from "@/lib/delay";
import { runSteppedLadderAnimation } from "@/lib/ladderRaf";

function qualityGemAsset(q: QualityKey): string {
  switch (q) {
    case "GREEN":
      return figmaAssets.qualityGreen;
    case "BLUE":
      return figmaAssets.qualityBlue;
    case "GOLD":
      return figmaAssets.qualityGold;
    default:
      return figmaAssets.qualityPurple;
  }
}

const PHASE_RANK = {
  IDLE: 0,
  ROLLING_QUALITY: 1,
  SELECT_BUFF: 2,
  SLIDER_ANIM: 3,
  CALC_CP: 4,
  RESULT: 5,
} as const;

export function RefinePanel() {
  const [mounted, setMounted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [rollingQuality, setRollingQuality] = useState<QualityKey>("GREEN");
  const [qualityRevealKey, setQualityRevealKey] = useState(0);
  const [buffCursorIdx, setBuffCursorIdx] = useState(0);
  const [displayCp, setDisplayCp] = useState(0);
  /** 双条游标动画均结束后才显示 Attack/Defense 数字 */
  const [combatStatNumbersVisible, setCombatStatNumbersVisible] = useState(false);
  /** 最后揭示 Combat Power（在属性数字之后） */
  const [combatPowerVisible, setCombatPowerVisible] = useState(false);
  const [resultRevealed, setResultRevealed] = useState(false);
  const gaugeDoneRef = useRef({ atk: false, def: false });
  const notifyGaugeDoneRef = useRef<(kind: "atk" | "def") => void>(() => {});
  const prevPhaseForCombatStatsRef = useRef<RefinePhase | undefined>(undefined);
  const panelRootRef = useRef<HTMLDivElement | null>(null);
  const saveWrapRef = useRef<HTMLDivElement | null>(null);
  const saveTooltipRef = useRef<HTMLDivElement | null>(null);
  const prevPhaseRef = useRef<typeof phase | undefined>(undefined);
  /** 本次调校是否高级（同步写入，避免与 phase 更新竞态） */
  const refineAdvancedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    phase,
    currentResult,
    saved,
    inventory,
    isSaving,
    setPhase,
    performRefine,
    startSaveFly,
    completeSave,
    canRefine,
    ensureNormalMaterialReady,
    ensureAdvancedMaterialReady,
    materialAdvancedSelected: isAdvanced,
    setMaterialAdvancedSelected,
  } = useWeaponStore();

  useEffect(() => {
    if (!mounted) return;
    ensureNormalMaterialReady();
    ensureAdvancedMaterialReady();
  }, [
    mounted,
    inventory.materialA,
    inventory.materialB,
    ensureNormalMaterialReady,
    ensureAdvancedMaterialReady,
  ]);

  const canRefineNow = canRefine(isAdvanced) && !isRunning;
  const canSave =
    phase === "RESULT" && currentResult != null && !isSaving && resultRevealed;
  const canRevealBuff = PHASE_RANK[phase] >= PHASE_RANK.SELECT_BUFF;
  const canRevealStats = PHASE_RANK[phase] >= PHASE_RANK.SLIDER_ANIM;

  notifyGaugeDoneRef.current = (kind) => {
    gaugeDoneRef.current[kind] = true;
    if (gaugeDoneRef.current.atk && gaugeDoneRef.current.def) {
      setCombatStatNumbersVisible(true);
    }
  };
  const onAtkGaugeComplete = useCallback(() => notifyGaugeDoneRef.current("atk"), []);
  const onDefGaugeComplete = useCallback(() => notifyGaugeDoneRef.current("def"), []);

  const normalBuffOptions = ["+2%", "+4%", "+6%"];
  const advancedBuffOptions = ["+2%", "+4%", "+6%", "+9%"];
  const buffOptions = isAdvanced ? advancedBuffOptions : normalBuffOptions;

  /** 普通：仅绿→蓝→紫；高级：仅紫→金。在 ROLLING 结束时停在本次随机品质 */
  useEffect(() => {
    if (phase !== "ROLLING_QUALITY" || !currentResult) return;
    const advanced = refineAdvancedRef.current;
    const ladder = advanced ? QUALITY_LADDER_ADVANCED : QUALITY_LADDER_NORMAL;
    const targetIdx = ladder.indexOf(currentResult.quality);
    if (targetIdx < 0) {
      setRollingQuality(currentResult.quality);
      return;
    }

    setRollingQuality(ladder[0]);
    if (targetIdx === 0) return;

    const travelMs = ROLLING_DURATION_MS * 0.88;
    return runSteppedLadderAnimation({
      durationMs: travelMs,
      targetStepIndex: targetIdx,
      onStep: (idx) => setRollingQuality(ladder[idx]),
    });
  }, [phase, currentResult]);

  useEffect(() => {
    if (prevPhaseRef.current === "ROLLING_QUALITY" && phase === "SELECT_BUFF") {
      setQualityRevealKey((k) => k + 1);
    }
    prevPhaseRef.current = phase;
  }, [phase, currentResult]);

  /** 新一轮调校开始：立即隐藏战力/属性数字，避免仍处 RESULT 或首帧 ROLLING 时闪出新 CP */
  useEffect(() => {
    if (phase !== "ROLLING_QUALITY") return;
    gaugeDoneRef.current = { atk: false, def: false };
    setCombatStatNumbersVisible(false);
    setCombatPowerVisible(false);
    setDisplayCp(saved.cp);
  }, [phase, saved.cp]);

  useEffect(() => {
    if (phase !== "RESULT") {
      setResultRevealed(false);
      return;
    }
    if (!currentResult) return;
    const t = setTimeout(() => setResultRevealed(true), 800);
    return () => clearTimeout(t);
  }, [phase, currentResult]);

  useEffect(() => {
    if (!currentResult) {
      gaugeDoneRef.current = { atk: false, def: false };
      setCombatStatNumbersVisible(false);
      setCombatPowerVisible(false);
    }
  }, [currentResult]);

  useEffect(() => {
    const prev = prevPhaseForCombatStatsRef.current;
    prevPhaseForCombatStatsRef.current = phase;
    if (phase === "SLIDER_ANIM" && prev !== "SLIDER_ANIM" && currentResult) {
      gaugeDoneRef.current = { atk: false, def: false };
      setCombatStatNumbersVisible(false);
      setCombatPowerVisible(false);
    }
  }, [phase, currentResult]);

  useEffect(() => {
    if (!combatStatNumbersVisible || !currentResult) return;
    const t = window.setTimeout(() => setCombatPowerVisible(true), 420);
    return () => clearTimeout(t);
  }, [combatStatNumbersVisible, currentResult]);

  /** SELECT_BUFF：从左到右依次高亮，在阶段时长内停在结果项（与 RefineSequence 一致） */
  useEffect(() => {
    if (!currentResult) return;
    if (phase === "SELECT_BUFF") {
      const targetIdx = buffOptions.findIndex((item) => item === currentResult.handlingBuff);
      if (targetIdx < 0) {
        setBuffCursorIdx(0);
        return;
      }
      setBuffCursorIdx(0);
      if (targetIdx === 0) return;
      const travelMs = SELECT_BUFF_DURATION_MS * 0.88;
      return runSteppedLadderAnimation({
        durationMs: travelMs,
        targetStepIndex: targetIdx,
        onStep: (idx) => setBuffCursorIdx(idx),
      });
    }
    if (PHASE_RANK[phase] >= PHASE_RANK.SLIDER_ANIM) {
      const idx = buffOptions.findIndex((item) => item === currentResult.handlingBuff);
      if (idx >= 0) setBuffCursorIdx(idx);
    }
  }, [phase, buffOptions, currentResult]);

  useEffect(() => {
    if (!currentResult) {
      setDisplayCp(saved.cp);
      return;
    }
    if (!combatPowerVisible) return;
    const from = saved.cp;
    const to = currentResult.cp;
    const duration = 1100;
    const start = performance.now();
    let raf = 0;
    const tick = (ts: number) => {
      const t = Math.min(1, (ts - start) / duration);
      setDisplayCp(Math.round(from + (to - from) * t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [currentResult, combatPowerVisible, saved.cp]);

  const handleRefine = async () => {
    if (!canRefineNow) return;
    refineAdvancedRef.current = isAdvanced;
    const ok = performRefine(isAdvanced);
    if (!ok) return;
    gaugeDoneRef.current = { atk: false, def: false };
    setCombatStatNumbersVisible(false);
    setCombatPowerVisible(false);
    setDisplayCp(saved.cp);
    setIsRunning(true);
    try {
      await runRefineSequence(setPhase);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSave = async () => {
    if (!canSave) return;
    startSaveFly();
    await delay(820);
    completeSave();
  };

  const displayQuality =
    phase === "ROLLING_QUALITY"
      ? rollingQuality
      : currentResult && PHASE_RANK[phase] >= PHASE_RANK.SELECT_BUFF
        ? currentResult.quality
        : null;
  const displayAtk =
    currentResult && combatStatNumbersVisible ? currentResult.atk : "?";
  const displayDef =
    currentResult && combatStatNumbersVisible ? currentResult.def : "?";
  const panelCp = currentResult && combatPowerVisible ? displayCp : "?";

  const atkPct =
    currentResult && canRevealStats ? (currentResult.atk / ATK_SLIDER_MAX) * 100 : 0;
  const defPct =
    currentResult && canRevealStats ? (currentResult.def / DEF_SLIDER_MAX) * 100 : 0;
  const qualityPreview = isAdvanced ? "紫 / 金" : "绿 / 蓝 / 紫";

  const useAdvancedLadder =
    isRunning || currentResult != null ? refineAdvancedRef.current : isAdvanced;
  const displayLadder = useAdvancedLadder ? QUALITY_LADDER_ADVANCED : QUALITY_LADDER_NORMAL;

  const phaseHint =
    phase === "ROLLING_QUALITY"
      ? "品质判定中…"
      : phase === "SELECT_BUFF"
        ? "属性计算中…"
        : phase === "SLIDER_ANIM"
          ? "属性计算中…"
          : phase === "CALC_CP"
            ? "战力结算中…"
            : phase === "RESULT"
              ? "完成"
              : "";

  const qualityColor = displayQuality ? QUALITY_CONFIG[displayQuality].color : null;
  const ladderCurIdx =
    displayQuality != null ? displayLadder.indexOf(displayQuality) : -1;

  const showQualityRevealFigma =
    displayQuality != null && PHASE_RANK[phase] >= PHASE_RANK.SELECT_BUFF;
  /** 滚动品质阶段避免整面板跟色换阴影，减轻重绘顿挫 */
  const glowStyle =
    qualityColor && phase !== "ROLLING_QUALITY" && PHASE_RANK[phase] >= PHASE_RANK.SELECT_BUFF
      ? {
          boxShadow: `0 0 40px ${qualityColor}40, 0 10px 32px rgba(0,0,0,0.45)`,
        }
      : undefined;

  const qualityIconSrc = displayQuality ? qualityGemAsset(displayQuality) : null;

  const buffLayoutActive =
    currentResult != null && PHASE_RANK[phase] >= PHASE_RANK.SLIDER_ANIM;

  if (!mounted) {
    return <div className="relative h-full w-full" />;
  }

  return (
    <div
      ref={panelRootRef}
      className="relative flex h-full flex-col overflow-visible border-2 border-white/30 text-zinc-100 transition-shadow duration-300"
      style={{ ...glowStyle }}
    >
      <div className="absolute inset-0">
        <Image src={figmaAssets.rightPanelBackground} alt="" fill className="object-cover object-center backdrop-blur-[5px]" unoptimized />
      </div>
      <div className="relative flex flex-1 flex-col p-6" style={{ gap: REFINE_PANEL.sectionGap }}>
        {/* 品质 & CP - Figma Random Quality 区域 */}
        <div style={{ display: "flex", flexDirection: "column", gap: REFINE_PANEL.blockGap }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="font-medium capitalize text-[#8b8b8b]" style={{ fontSize: 26 }}>
                随机品质（{qualityPreview}）
              </span>
              <div className="flex flex-wrap items-center gap-2" aria-hidden>
                {displayLadder.map((q) => {
                  const i = displayLadder.indexOf(q);
                  const src = qualityGemAsset(q);
                  const isCurrent = ladderCurIdx === i;
                  const isFuture = ladderCurIdx >= 0 && i > ladderCurIdx;
                  const qc = QUALITY_CONFIG[q].color;
                  const gemStyle: CSSProperties = {
                    opacity: isFuture ? 0.32 : isCurrent ? 1 : ladderCurIdx < 0 ? 0.45 : 0.72,
                    boxShadow: isCurrent
                      ? q === "GOLD"
                        ? `0 0 0 2px ${qc}, 0 0 14px rgba(250,204,21,0.55)`
                        : `0 0 0 2px ${qc}, 0 0 12px ${qc}66`
                      : undefined,
                  };
                  return (
                    <div
                      key={q}
                      className={cn(
                        "relative z-[1] h-6 w-6 shrink-0 rounded-sm transition-[opacity,transform,box-shadow] duration-300 ease-out",
                        isCurrent && "scale-110"
                      )}
                      style={gemStyle}
                    >
                      <Image src={src} alt="" fill className="object-contain" unoptimized />
                    </div>
                  );
                })}
              </div>
            </div>
            {displayQuality && qualityIconSrc ? (
              <div className="relative mt-1 flex shrink-0 items-center gap-0.5">
                <div className="relative h-11 w-11">
                  {showQualityRevealFigma && (
                    <motion.div
                      key={`glow-${qualityRevealKey}`}
                      className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: [0, 0.9, 0.55], scale: [0.85, 1.05, 1] }}
                      transition={{ duration: 0.85, ease: "easeOut" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- MCP 光效层与绝对定位缩放 */}
                      <img
                        alt=""
                        src={figmaAssets.qualityRevealGlow}
                        className="h-full w-full object-contain"
                      />
                    </motion.div>
                  )}
                  {showQualityRevealFigma && (
                    <motion.div
                      key={`ornament-${qualityRevealKey}`}
                      className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center"
                      initial={{ opacity: 0, scale: 0.92 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 420, damping: 20, delay: 0.05 }}
                    >
                      <div className="relative h-[42px] w-[42px]">
                        <Image
                          src={figmaAssets.qualityRevealOrnament}
                          alt=""
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    </motion.div>
                  )}
                  <motion.div
                    key={phase === "ROLLING_QUALITY" ? "rolling" : `post-${qualityRevealKey}`}
                    className="relative z-[1] mx-auto mt-0.5 h-10 w-10"
                    initial={
                      phase !== "ROLLING_QUALITY" && qualityRevealKey > 0
                        ? { scale: 0.72, opacity: 0.55 }
                        : false
                    }
                    animate={
                      phase === "ROLLING_QUALITY"
                        ? { opacity: [0.93, 1, 0.93] }
                        : {
                            scale: 1,
                            opacity: 1,
                            filter:
                              displayQuality === "GOLD"
                                ? "drop-shadow(0 0 14px rgba(250,204,21,0.9))"
                                : qualityColor
                                  ? `drop-shadow(0 0 12px ${qualityColor}aa)`
                                  : "none",
                          }
                    }
                    transition={
                      phase === "ROLLING_QUALITY"
                        ? { duration: 1.75, repeat: Infinity, ease: "easeInOut" }
                        : { type: "spring", stiffness: 400, damping: 17, filter: { duration: 0.4 } }
                    }
                  >
                    <AnimatePresence mode="sync" initial={false}>
                      <motion.div
                        key={displayQuality ?? "none"}
                        className="absolute inset-0"
                        initial={{ opacity: 0.5, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0.4, scale: 0.96 }}
                        transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
                      >
                        <Image src={qualityIconSrc} alt="" fill className="object-contain" unoptimized />
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                </div>
                {showQualityRevealFigma && (
                  <div className="pointer-events-none relative h-16 w-3 shrink-0 -rotate-90 opacity-90">
                    <Image
                      src={figmaAssets.qualitySelectedIndicator}
                      alt=""
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
              </div>
            ) : (
              <span className="mt-1 shrink-0 text-zinc-500">?</span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className="font-medium capitalize leading-none"
              style={{ fontSize: REFINE_PANEL.cpLabelFontSize, color: "rgba(255,255,255,0.85)" }}
            >
              Combat Power:
            </span>
            <span
              className="min-w-[4ch] bg-black/70 px-2 py-0.5 font-medium leading-none text-[#bef528]"
              style={{ fontSize: REFINE_PANEL.cpValueFontSize }}
            >
              {typeof panelCp === "number" ? (
                <motion.span
                  layoutId="stat-cp"
                  data-fly-source="cp"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                >
                  {panelCp}
                </motion.span>
              ) : (
                "?"
              )}
            </span>
          </div>
        </div>

        {/* Handling Buff - Figma 标题底图 */}
        <div style={{ display: "flex", flexDirection: "column", gap: REFINE_PANEL.blockGap }}>
          <div className="relative w-full" style={{ height: REFINE_PANEL.sectionTitleBarHeight }}>
            <Image src={figmaAssets.handlingBuffLabelBg} alt="" fill className="object-cover object-center" unoptimized />
            <span className="absolute inset-0 flex items-center gap-2 pl-0 font-medium uppercase text-white" style={{ fontSize: REFINE_PANEL.popoverTitleFontSize }}>
              <span className="h-[22px] w-1 shrink-0 rounded-[1px] bg-[#bef528]" aria-hidden />
              Handling BUFF
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {buffOptions.map((buff, idx) => {
              const isBuffSelecting = phase === "SELECT_BUFF";
              const isCursor = isBuffSelecting && idx === buffCursorIdx;
              const isFinal =
                currentResult != null &&
                buff === currentResult.handlingBuff &&
                PHASE_RANK[phase] > PHASE_RANK.SELECT_BUFF;
              const highlighted = isCursor || isFinal;
              return (
                <motion.div
                  key={buff}
                  animate={{
                    scale: isFinal ? 1.12 : isCursor ? 1.06 : 1,
                    opacity:
                      canRevealBuff && isBuffSelecting
                        ? isCursor
                          ? 1
                          : 0.45
                        : canRevealBuff
                          ? isFinal
                            ? 1
                            : 0.5
                          : 1,
                  }}
                  transition={{ type: "tween", duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Badge
                    variant={highlighted ? "default" : "secondary"}
                    className={cn(
                      "rounded-sm border border-zinc-600/80 bg-black/50 px-3 py-1.5 font-medium",
                      highlighted &&
                        "ring-1 ring-lime-400 shadow-[0_0_12px_rgba(190,245,40,0.3)]"
                    )}
                    style={{
                      fontSize: isFinal
                        ? REFINE_PANEL.buffOptionHighlightedFontSize
                        : REFINE_PANEL.buffOptionFontSize,
                    }}
                  >
                    {buffLayoutActive && currentResult && buff === currentResult.handlingBuff ? (
                      <motion.span
                        layoutId="stat-buff"
                        data-fly-source="buff"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      >
                        {buff}
                      </motion.span>
                    ) : (
                      buff
                    )}
                  </Badge>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Combat Stats - Figma 标题底图 */}
        <div style={{ display: "flex", flexDirection: "column", gap: REFINE_PANEL.blockGap }}>
          <div className="relative w-full" style={{ height: REFINE_PANEL.sectionTitleBarHeight }}>
            <Image src={figmaAssets.handlingBuffLabelBg} alt="" fill className="object-cover object-center" unoptimized />
            <span className="absolute inset-0 flex items-center gap-2 pl-0 font-medium uppercase text-white" style={{ fontSize: REFINE_PANEL.popoverTitleFontSize }}>
              <span className="h-[22px] w-1 shrink-0 rounded-[1px] bg-[#bef528]" aria-hidden />
              Combat stats
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-5">
              <span className="font-medium text-white" style={{ fontSize: REFINE_PANEL.combatStatRowLabelFontSize }}>
                Weapon Attack
              </span>
              <span className="font-medium tabular-nums text-white" style={{ fontSize: REFINE_PANEL.combatStatRowValueFontSize }}>
                {typeof displayAtk === "number" ? (
                  <motion.span
                    layoutId="stat-atk"
                    data-fly-source="atk"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  >
                    {displayAtk}
                  </motion.span>
                ) : (
                  "?"
                )}
              </span>
            </div>
            <GaugeSlider
              targetValue={atkPct}
              qualityColor={displayQuality ? QUALITY_CONFIG[displayQuality].color : "#D8D8D8"}
              active={canRevealStats}
              revealBandQuality={currentResult?.quality ?? null}
              statKind="atk"
              onRevealComplete={onAtkGaugeComplete}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-5">
              <span className="font-medium text-white" style={{ fontSize: REFINE_PANEL.combatStatRowLabelFontSize }}>
                Character Defense
              </span>
              <span className="font-medium tabular-nums text-white" style={{ fontSize: REFINE_PANEL.combatStatRowValueFontSize }}>
                {typeof displayDef === "number" ? (
                  <motion.span
                    layoutId="stat-def"
                    data-fly-source="def"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  >
                    {displayDef}
                  </motion.span>
                ) : (
                  "?"
                )}
              </span>
            </div>
            <GaugeSlider
              targetValue={defPct}
              qualityColor={displayQuality ? QUALITY_CONFIG[displayQuality].color : "#D8D8D8"}
              active={canRevealStats}
              revealBandQuality={currentResult?.quality ?? null}
              statKind="def"
              onRevealComplete={onDefGaugeComplete}
            />
          </div>
        </div>

        {/* 材料消耗 — MCP 14439:1230：衬线 + 居中 + 数量压在卡图右下角 */}
        <div className="flex w-full flex-col items-center">
          <div className="flex w-full items-center justify-center gap-2">
            <div className="relative h-[26px] w-[106px] shrink-0 rotate-180">
              <Image
                src={figmaAssets.consumptionSerifLeft}
                alt=""
                fill
                className="object-contain object-left"
                unoptimized
              />
            </div>
            <span
              className="shrink-0 font-medium uppercase leading-none text-[#e7e7e7]"
              style={{
                fontSize: 32,
                textShadow: "0px 0px 4px rgba(0,0,0,0.5)",
              }}
            >
              CONSUMPTION
            </span>
            <div className="relative h-[26px] w-[99px] shrink-0">
              <Image
                src={figmaAssets.consumptionSerifRight}
                alt=""
                fill
                className="object-contain object-right"
                unoptimized
              />
            </div>
          </div>
          <div
            className="flex w-full items-center justify-center gap-8"
            style={{ marginTop: REFINE_PANEL.consumptionGapAfterTitle }}
          >
            <div className="relative h-[120px] w-[116px] shrink-0 overflow-hidden">
              <Image src={figmaAssets.itemQualityBar} alt="" fill className="object-cover" unoptimized />
              <span
                className="pointer-events-none absolute bottom-2 right-2 text-right font-medium tabular-nums leading-none text-[#d9d8d6]"
                style={{ fontSize: 26, textShadow: "0 1px 3px rgba(0,0,0,0.75)" }}
              >
                {inventory.materialA}/99
              </span>
            </div>
            {/* 分割线 → 勾选 → 高级材料：分割线在勾选左侧；勾选与高级卡同一组、间距更紧 */}
            <div className="flex items-center gap-4">
              <div
                className="h-[120px] w-[2px] shrink-0 overflow-hidden bg-transparent"
                aria-hidden
              >
                <div className="mx-auto h-full w-px bg-gradient-to-b from-transparent via-white/35 to-transparent" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isRunning}
                  onClick={() => setMaterialAdvancedSelected(!isAdvanced)}
                  className={cn(
                    "relative size-[34px] shrink-0 disabled:opacity-60",
                    isRunning && "cursor-not-allowed"
                  )}
                  aria-pressed={isAdvanced}
                  aria-label="切换高级材料"
                >
                  <div className="absolute inset-0 border border-[rgba(255,255,255,0.58)]">
                    <Image src={figmaAssets.checkbox} alt="" fill className="object-cover" unoptimized />
                  </div>
                  {isAdvanced && (
                    <span className="absolute inset-[7px] z-[1] bg-[#bef528]" aria-hidden />
                  )}
                </button>
                <div className="relative h-[120px] w-[120px] shrink-0">
                  <div className="absolute inset-0 overflow-hidden">
                    <Image src={figmaAssets.itemBackgroundAdvanced} alt="" fill className="object-cover" unoptimized />
                  </div>
                  <div className="pointer-events-none absolute -right-[22px] -top-[27px] z-[1] h-[44px] w-[156px]">
                    <Image src={figmaAssets.advancedLabelBg} alt="" fill className="object-cover" unoptimized />
                  </div>
                  <span
                    className="pointer-events-none absolute bottom-2 right-2 z-[1] text-right font-medium tabular-nums leading-none text-[#d9d8d6]"
                    style={{ fontSize: 26, textShadow: "0 1px 3px rgba(0,0,0,0.75)" }}
                  >
                    {inventory.materialB}/5
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 操作按钮 — MCP 14218:272 default / 14218:9867 可保存态；flex 底图 + 108px 双纹右路 */}
      <div className="relative mt-6 flex flex-col gap-2 px-6 pb-6">
        {isRunning && phaseHint && (
          <p className="text-center text-xs font-medium text-zinc-400 transition-opacity duration-150">
            {phaseHint}
          </p>
        )}
        <div className="flex gap-3">
          <div ref={saveWrapRef} className="relative shrink-0">
            {canSave && resultRevealed && (
              <div
                ref={saveTooltipRef}
                className="pointer-events-none absolute right-full top-1/2 z-50 mr-2 w-[463px] -translate-y-1/2"
                role="note"
              >
                <div className="relative h-20 w-full">
                  <Image
                    src={figmaAssets.saveTooltipBg}
                    alt=""
                    fill
                    className="object-fill"
                    unoptimized
                  />
                  <p
                    className="absolute inset-0 flex items-center justify-center px-8 text-center font-medium leading-tight text-[#e4e4e4]"
                    style={{ fontSize: REFINE_PANEL.saveTooltipFontSize }}
                  >
                    若满意当前结果，点击保存
                  </p>
                </div>
              </div>
            )}
            <button
              type="button"
              disabled={!canSave}
              onClick={handleSave}
              className="relative h-[100px] w-[187px] overflow-hidden disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 flex items-stretch justify-between">
                <div
                  className="min-h-px min-w-px flex-1"
                  style={{ backgroundColor: canSave ? "#ebebeb" : "#3f3f3f" }}
                />
                {canSave ? (
                  <div className="relative h-full w-[110px] shrink-0">
                    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
                      {/* eslint-disable-next-line @next/next/no-img-element -- MCP 指定绝对定位缩放，与 <Image fill> 对齐成本高 */}
                      <img
                        alt=""
                        src={figmaAssets.btnRightCap}
                        className="absolute left-[-16.36%] top-[-18%] h-[136%] w-[132.73%] max-w-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="relative aspect-[220/200] h-full shrink-0">
                    <Image
                      src={figmaAssets.btnSaveRightDisabledCap}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
              </div>
              <span
                className={cn(
                  "absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 font-medium uppercase",
                  canSave ? "text-black" : "text-[#6c6c6c]"
                )}
                style={{ fontSize: 42 }}
              >
                SAVE
              </span>
            </button>
          </div>
          <button
            type="button"
            disabled={!canRefineNow}
            onClick={handleRefine}
            className="relative h-[100px] w-[320px] shrink-0 overflow-hidden disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="absolute inset-0 flex items-stretch justify-between">
              <div className="h-full min-h-px min-w-px flex-1 bg-[#bef528]" />
              <div className="relative h-full w-[108px] shrink-0">
                <div className="pointer-events-none absolute inset-0" aria-hidden>
                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      alt=""
                      src={figmaAssets.btnRightCap}
                      className="absolute left-[-16.36%] top-[-18%] h-[136%] w-[132.73%] max-w-none"
                    />
                  </div>
                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      alt=""
                      src={figmaAssets.btnRightCapAccent}
                      className="absolute left-[-25.71%] top-[-30%] h-[160%] w-[151.43%] max-w-none"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div
              className={cn(
                "absolute left-1/2 z-10 flex -translate-x-1/2 flex-col items-center justify-center text-center",
                isRunning
                  ? "top-1/2 w-[min(280px,92%)] -translate-y-1/2 px-3"
                  : "top-[calc(50%-1.5px)] w-[139px] -translate-y-1/2"
              )}
            >
              <span
                className="w-full font-medium uppercase leading-tight text-black"
                style={{ fontSize: isRunning ? 38 : 42 }}
              >
                {isRunning ? "REFINING" : "REFINE"}
              </span>
              {!isRunning && (
                <div className="mt-0.5 flex items-center justify-center gap-[3px]">
                  <div className="relative h-10 w-10 shrink-0">
                    <Image src={figmaAssets.currencyOnRefineBtn} alt="" fill className="object-cover" unoptimized />
                  </div>
                  <span className="font-medium uppercase text-black" style={{ fontSize: 36 }}>
                    5200
                  </span>
                </div>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
