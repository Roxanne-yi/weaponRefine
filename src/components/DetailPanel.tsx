"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useWeaponStore } from "@/store/useWeaponStore";
import { QUALITY_CONFIG, type QualityKey } from "@/lib/constants";
import { DETAIL_CARD } from "@/lib/figma-tokens";
import { figmaAssets } from "@/lib/figma-assets";
import { cn } from "@/lib/utils";

const QUALITY_LABELS: Record<QualityKey, string> = {
  GREEN: "Green",
  BLUE: "Blue",
  PURPLE: "Purple",
  GOLD: "Gold",
};

const QUALITY_ICON: Record<QualityKey, string> = {
  GREEN: figmaAssets.qualityGreen,
  BLUE: figmaAssets.qualityBlue,
  PURPLE: figmaAssets.qualityPurple,
  GOLD: figmaAssets.qualityGold,
};

export function DetailPanel() {
  const { saved, isSaving, pendingSaveResult } = useWeaponStore();
  const [highlight, setHighlight] = useState(false);

  const displayStats = isSaving && pendingSaveResult ? pendingSaveResult : saved;
  const config = QUALITY_CONFIG[displayStats.quality];
  const prevSaving = useRef(false);

  useEffect(() => {
    if (prevSaving.current && !isSaving) {
      setHighlight(true);
      const t = setTimeout(() => setHighlight(false), 220);
      return () => clearTimeout(t);
    }
    prevSaving.current = isSaving;
  }, [isSaving]);

  return (
    <div style={{ width: 600 }}>
      <motion.div
        layout
        className={cn(
          "relative overflow-hidden transition-shadow duration-200",
          highlight && "shadow-[0_0_20px_rgba(190,245,40,0.2)]"
        )}
      >
        {/* 倍镜信息条 - Figma Scope Info Background */}
        <div className="relative h-12 w-full">
          <Image src={figmaAssets.scopeInfoBackground} alt="" fill className="object-cover object-center" unoptimized />
          <div className="absolute inset-0 flex items-center justify-between px-3">
            <h3 className="font-bold uppercase leading-none text-white" style={{ fontSize: DETAIL_CARD.titleFontSize }}>
              倍镜
            </h3>
            <div className="flex items-center gap-1.5">
              <div className="relative h-8 w-8 shrink-0">
                <Image src={QUALITY_ICON[displayStats.quality]} alt="" fill className="object-contain" unoptimized />
              </div>
              <span className="font-medium" style={{ fontSize: 32, color: config.color }}>
                {QUALITY_LABELS[displayStats.quality]}
              </span>
            </div>
          </div>
        </div>
        {/* 属性行 - Figma Combat Power Background 每行；飞入时略压暗避免与胶囊重复抢视觉 */}
        <div
          className={cn(
            "mt-0 flex flex-col gap-0 transition-opacity duration-200",
            isSaving && "pointer-events-none opacity-40"
          )}
        >
          {(
            [
              { label: "Combat Power", value: displayStats.cp, layoutId: "stat-cp", bold: true },
              { label: "Handling Buff", value: displayStats.handlingBuff, layoutId: "stat-buff", bold: false },
              { label: "Weapon Attack", value: displayStats.atk, layoutId: "stat-atk", bold: false },
              { label: "Character Defense", value: displayStats.def, layoutId: "stat-def", bold: false },
            ] as const
          ).map(({ label, value, layoutId, bold }) => {
            const flyTarget =
              layoutId === "stat-cp"
                ? "cp"
                : layoutId === "stat-buff"
                  ? "buff"
                  : layoutId === "stat-atk"
                    ? "atk"
                    : "def";
            return (
            <div key={layoutId} className="relative h-[52px] w-full">
              <Image src={figmaAssets.combatPowerBackground} alt="" fill className="object-cover object-center" unoptimized />
              <div className="absolute inset-0 flex items-center justify-between px-3">
                <span className="font-medium text-[#d8d8d8]" style={{ fontSize: label === "Combat Power" ? 36 : 30 }}>
                  {label}
                </span>
                <span className={bold ? "font-black text-white" : "font-medium text-[#d8d8d8]"} style={{ fontSize: label === "Combat Power" ? 35 : 30 }}>
                  <motion.span
                    layoutId={layoutId}
                    data-fly-target={flyTarget}
                    transition={{ type: "spring", stiffness: 320, damping: 28 }}
                  >
                    {value}
                  </motion.span>
                </span>
              </div>
            </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
