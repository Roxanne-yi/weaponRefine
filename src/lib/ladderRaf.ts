/**
 * 阶梯动画：按缓动曲线在 durationMs 内从 0 走到 targetStepIndex，
 * 与 rAF 同步，仅在步进变化时回调，避免 setTimeout 与帧不同步造成的顿挫。
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

export function runSteppedLadderAnimation(options: {
  durationMs: number;
  targetStepIndex: number;
  onStep: (stepIndex: number) => void;
}): () => void {
  const { durationMs, targetStepIndex, onStep } = options;
  if (targetStepIndex <= 0) {
    onStep(0);
    return () => {};
  }

  let lastIdx = -1;
  const start = performance.now();
  let raf = 0;

  const tick = (now: number) => {
    const elapsed = now - start;
    const u = durationMs <= 0 ? 1 : Math.min(1, elapsed / durationMs);
    const eased = easeInOutCubic(u);
    const idx = Math.min(targetStepIndex, Math.floor(eased * (targetStepIndex + 1)));
    if (idx !== lastIdx) {
      lastIdx = idx;
      onStep(idx);
    }
    if (u < 1) raf = requestAnimationFrame(tick);
  };

  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
