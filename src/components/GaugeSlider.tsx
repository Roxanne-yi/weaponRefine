"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect, useRef } from "react";
import {
  combatStatBandWidthsPct,
  qualityAtkPctRange,
  qualityDefPctRange,
  type QualityKey,
} from "@/lib/constants";

interface GaugeSliderProps {
  targetValue: number; // 0-100 最终游标位置
  qualityColor: string;
  active: boolean;
  /** 若提供则在 active 时做两阶段揭示：先快进到该品质区间内，再缓移到 targetValue */
  revealBandQuality?: QualityKey | null;
  /** 与 QUALITY_CONFIG 中 atk/def 区间对应 */
  statKind: "atk" | "def";
  /** 游标动画整段结束（含两阶段或 spring） */
  onRevealComplete?: (kind: "atk" | "def") => void;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/** 品质带内、与最终结果拉开一点距离，便于第二阶段慢慢对上 */
function pickTeaserPct(lo: number, hi: number, final: number): number {
  const span = Math.max(hi - lo, 1e-6);
  const pull = span * 0.24;
  const mid = lo + span / 2;
  let p = final >= mid ? final - pull : final + pull;
  p = clamp(p, lo, hi);
  if (Math.abs(p - final) < span * 0.1) {
    p = clamp(lo + span * 0.3, lo, hi);
  }
  return p;
}

export function GaugeSlider({
  targetValue,
  qualityColor,
  active,
  revealBandQuality,
  statKind,
  onRevealComplete,
}: GaugeSliderProps) {
  const controls = useAnimation();
  const onDoneRef = useRef(onRevealComplete);
  onDoneRef.current = onRevealComplete;

  const [wGreen, wBlue, wPurple, wGold] = combatStatBandWidthsPct(statKind);

  useEffect(() => {
    let cancelled = false;

    if (!active) {
      controls.stop();
      controls.set({ left: "0%" });
      return () => {
        cancelled = true;
      };
    }

    const fireComplete = () => {
      if (!cancelled) onDoneRef.current?.(statKind);
    };

    const run = async () => {
      const toLeft = (pct: number) => `calc(${pct}% - 2px)` as const;

      if (revealBandQuality) {
        const [lo, hi] =
          statKind === "atk"
            ? qualityAtkPctRange(revealBandQuality)
            : qualityDefPctRange(revealBandQuality);
        const teaser = pickTeaserPct(lo, hi, targetValue);

        await controls.start({
          left: toLeft(teaser),
          transition: { duration: 0.34, ease: [0.45, 0, 0.85, 1] },
        });
        if (cancelled) return;

        await controls.start({
          left: toLeft(targetValue),
          transition: { duration: 1.45, ease: [0.2, 0.85, 0.35, 1] },
        });
        fireComplete();
        return;
      }

      if (!cancelled) {
        await controls.start({
          left: toLeft(targetValue),
          transition: {
            type: "spring",
            stiffness: 80,
            damping: 8,
            mass: 1.2,
          },
        });
        fireComplete();
      }
    };

    run();

    return () => {
      cancelled = true;
      controls.stop();
    };
  }, [active, targetValue, revealBandQuality, statKind, controls]);

  return (
    <div className="relative h-4 w-full overflow-hidden rounded-full border border-white/10 bg-zinc-800">
      <div className="absolute inset-0 flex h-full">
        <div
          className="h-full shrink-0 border-r border-white/5 bg-green-500/20"
          style={{ width: `${wGreen}%` }}
        />
        <div
          className="h-full shrink-0 border-r border-white/5 bg-blue-500/20"
          style={{ width: `${wBlue}%` }}
        />
        <div
          className="h-full shrink-0 border-r border-white/5 bg-purple-500/20"
          style={{ width: `${wPurple}%` }}
        />
        <div className="h-full shrink-0 bg-yellow-500/20" style={{ width: `${wGold}%` }} />
      </div>
      <motion.div
        animate={controls}
        initial={{ left: "0%" }}
        className="absolute bottom-0 top-0 z-10 w-1"
        style={{
          backgroundColor: qualityColor,
          boxShadow: "0 0 10px rgba(255,255,255,0.8)",
        }}
      />
    </div>
  );
}
