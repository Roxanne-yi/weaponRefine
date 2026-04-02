"use client";

import { LayoutGroup } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { figmaAssets } from "@/lib/figma-assets";
import { FIGMA_DESIGN, HEADER, LEFT_TABS } from "@/lib/figma-tokens";
import { DetailPanel } from "@/components/DetailPanel";
import { RefinePanel } from "@/components/RefinePanel";
import { SaveFlyParticles } from "@/components/SaveFlyParticles";
import { ADVANCED_PITY_DISPLAY_MAX, useWeaponStore } from "@/store/useWeaponStore";

function useFigmaScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const update = () =>
      setScale(Math.min(window.innerWidth / FIGMA_DESIGN.width, window.innerHeight / FIGMA_DESIGN.height));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return scale;
}

export default function RefinePage() {
  const figmaScale = useFigmaScale();
  const materialAdvancedSelected = useWeaponStore((s) => s.materialAdvancedSelected);
  const pityCount = useWeaponStore((s) => s.pityCount);
  const scaledW = FIGMA_DESIGN.width * figmaScale;
  const scaledH = FIGMA_DESIGN.height * figmaScale;

  return (
    <LayoutGroup>
      <SaveFlyParticles />
      <div
        className="overflow-visible bg-black"
        style={{ width: scaledW, height: scaledH }}
      >
        <div
          className="relative overflow-visible text-zinc-100"
          style={{
            width: FIGMA_DESIGN.width,
            height: FIGMA_DESIGN.height,
            transform: `scale(${figmaScale})`,
            transformOrigin: "top left",
          }}
        >
        {/* 全页背景 - Figma 设计稿 Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src={figmaAssets.bg}
            alt=""
            fill
            className="object-cover object-center"
            priority
            unoptimized
          />
        </div>

        {/* 武器倍镜层：设计稿比例与位置，含阴影；略向左下偏移 */}
        <div className="absolute inset-0 z-[1] flex items-center justify-center">
          <div className="translate-x-[-240px] translate-y-[160px]">
            <div
              className="relative rotate-[4.99deg]"
              style={{ width: 432, height: 324 }}
            >
            <div className="absolute inset-0 blur-[20px] opacity-80">
              <Image
                src={figmaAssets.scopeImageShadow}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="absolute inset-0">
              <Image
                src={figmaAssets.scopeImage}
                alt="武器倍镜"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
          </div>
        </div>

        {/* 高级材料选中时显示保底进度（与右侧面板勾选联动，右侧面板内重复文案已移除） */}
        {materialAdvancedSelected && (
          <div
            className="absolute left-[195px] top-[955px] z-10 flex max-w-[min(900px,92vw)] items-center gap-2"
            aria-live="polite"
          >
            <div className="relative h-9 w-9 shrink-0">
              <Image src={figmaAssets.advancedTrainingIcon} alt="" fill className="object-contain" unoptimized />
            </div>
            <p className="font-medium text-[#dfdfdf]" style={{ fontSize: 30 }}>
              <span>
                高级调教保底 {pityCount}/{ADVANCED_PITY_DISPLAY_MAX}，第 {ADVANCED_PITY_DISPLAY_MAX} 次必出
              </span>
              <span className="text-[#fed00f]">金色</span>
            </p>
          </div>
        )}

        {/* 顶部 Tab 栏：绝对定位，避免占据文档流把主内容顶下 ~110px */}
        <header
          className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between"
          style={{ height: HEADER.height, width: "100%" }}
        >
          <div className="absolute inset-0">
            <Image
              src={figmaAssets.topBarBackground}
              alt=""
              fill
              className="object-cover object-center"
              unoptimized
            />
          </div>
          <nav className="relative flex items-center gap-[48px] pl-[75px]">
            <button type="button" className="px-1 py-2 uppercase leading-none hover:opacity-90" style={{ fontSize: HEADER.tabFontSize, fontWeight: HEADER.tabFontWeight, color: "rgba(255,255,255,0.7)" }}>
              熟练度
            </button>
            <button type="button" className="px-1 py-2 uppercase leading-none hover:opacity-90" style={{ fontSize: HEADER.tabFontSize, fontWeight: HEADER.tabFontWeight, color: "rgba(255,255,255,0.7)" }}>
              改装
            </button>
            <button type="button" className="relative flex h-[125px] w-[280px] items-center justify-center uppercase leading-none text-white" style={{ fontSize: HEADER.tabFontSize, fontWeight: HEADER.tabFontWeight }}>
              <Image src={figmaAssets.tabSelected} alt="" fill className="object-cover object-center" unoptimized />
              <span className="relative z-10">调校</span>
            </button>
          </nav>
          <div className="absolute right-[143px] top-[calc(50%-9.5px)] -translate-y-1/2">
            <div className="relative flex items-center justify-end gap-[3px] bg-black/25 px-[10px] py-px">
              <div className="relative h-[58px] w-[58px] shrink-0">
                <Image src={figmaAssets.currencyIcon} alt="" fill className="object-cover" unoptimized />
              </div>
              <span className="font-medium tabular-nums text-white" style={{ fontSize: HEADER.currencyFontSize }}>
                111,111
              </span>
              <div className="relative h-12 w-[54px] shrink-0">
                <div className="absolute right-0 top-0 h-12 w-12 overflow-hidden rounded-[3px]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- MCP 精灵图需按绝对比例裁切 */}
                  <img
                    alt="+"
                    src={figmaAssets.currencyPlus}
                    className="absolute left-[-706.25%] top-[-22.92%] h-[164.58%] w-[1475%] max-w-none"
                  />
                </div>
              </div>
            </div>
          </div>
          <button type="button" className="relative mr-3 flex h-[58px] w-[58px] items-center justify-center overflow-hidden hover:opacity-90">
            <Image src={figmaAssets.closeBtn} alt="关闭" fill className="object-cover" unoptimized />
          </button>
        </header>

        {/* 主内容：铺满画布，坐标与 Figma 1920 原点在页面顶部对齐 */}
        <main className="absolute inset-0 z-10">
          <div
            className="absolute z-20 flex flex-col items-center border-r border-white/25 py-2"
            style={{
              left: 32,
              width: LEFT_TABS.width,
              top: LEFT_TABS.topOffset,
              gap: LEFT_TABS.iconGap,
            }}
          >
            {figmaAssets.tabIcons.map((src, idx) => (
              <button
                key={idx}
                type="button"
                className="relative grid place-content-center text-zinc-300/75 hover:opacity-100 hover:brightness-110"
                style={{ width: LEFT_TABS.iconSize, height: LEFT_TABS.iconSize }}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  className="object-contain p-1"
                  unoptimized
                />
              </button>
            ))}
          </div>

          <div className="absolute" style={{ left: 189, top: 210, width: 600 }}>
            <DetailPanel />
          </div>

          <div className="absolute" style={{ left: 1297, top: 150, width: 572, height: 930 }}>
            <RefinePanel />
          </div>
        </main>
        </div>
      </div>
    </LayoutGroup>
  );
}
