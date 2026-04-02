"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useLayoutEffect, useRef, useState } from "react";
import { useWeaponStore } from "@/store/useWeaponStore";

const KEYS = ["cp", "buff", "atk", "def"] as const;
const PARTICLES_PER = 8;

type Burst = {
  key: (typeof KEYS)[number];
  particles: { id: string; x0: number; y0: number; x1: number; y1: number; delay: number }[];
};

export function SaveFlyParticles() {
  const isSaving = useWeaponStore((s) => s.isSaving);
  const pending = useWeaponStore((s) => s.pendingSaveResult);
  const [bursts, setBursts] = useState<Burst[] | null>(null);
  const runId = useRef(0);

  useLayoutEffect(() => {
    if (!isSaving || !pending) {
      setBursts(null);
      return;
    }
    const id = ++runId.current;
    let cancelled = false;
    const sample = () => {
      if (cancelled || id !== runId.current) return;
      const list: Burst[] = [];
      for (const key of KEYS) {
        const src = document.querySelector(`[data-fly-source="${key}"]`);
        const tgt = document.querySelector(`[data-fly-target="${key}"]`);
        if (!src || !tgt) continue;
        const a = src.getBoundingClientRect();
        const b = tgt.getBoundingClientRect();
        const particles = Array.from({ length: PARTICLES_PER }, (_, i) => ({
          id: `${key}-${i}-${id}`,
          x0: a.left + Math.random() * a.width,
          y0: a.top + Math.random() * a.height,
          x1: b.left + Math.random() * Math.max(6, b.width),
          y1: b.top + Math.random() * Math.max(6, b.height),
          delay: Math.random() * 0.14,
        }));
        list.push({ key, particles });
      }
      setBursts(list);
    };
    requestAnimationFrame(() => requestAnimationFrame(sample));
    return () => {
      cancelled = true;
    };
  }, [isSaving, pending]);

  return (
    <AnimatePresence>
      {bursts && bursts.length > 0 && (
        <motion.div
          key="save-fly-particles"
          className="pointer-events-none fixed inset-0 z-[9999]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
        >
          {bursts.flatMap((b) =>
            b.particles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute h-1.5 w-1.5 rounded-full bg-[#bef528]"
                style={{
                  left: p.x0,
                  top: p.y0,
                  boxShadow: "0 0 6px rgba(190,245,40,0.85)",
                }}
                initial={{ x: 0, y: 0, opacity: 0.95, scale: 1 }}
                animate={{ x: p.x1 - p.x0, y: p.y1 - p.y0, opacity: 0, scale: 0.25 }}
                transition={{
                  duration: 0.58,
                  delay: p.delay,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            ))
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
