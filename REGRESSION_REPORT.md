# 武器调校页面回归测试报告

**测试时间**: 2026-02-27  
**环境**: http://localhost:3000  
**执行方式**: Playwright 自动化 + 代码审查  

---

## 总结果

| 类型 | 数量 |
|------|------|
| **通过 (PASS)** | 9 |
| **失败 (FAIL)** | 2 |
| **无法验证** | 1 |

---

## 分项结果（1-12）

| # | 检查项 | 结果 | 证据 |
|---|--------|------|------|
| 1 | 初始态渲染：左侧有已保存属性，右侧处于待机可调校状态 | **PASS** | 左侧 DetailPanel 显示 CP/Handling Buff/Atk/Def 等数值，右侧 REFINE 按钮可点击 |
| 2 | 普通调校链路：不勾选 Advanced，点击 REFINE，阶段动画完整，最终出结果 | **PASS** | 品质滚动→Buff 揭示→数值揭示 完整，最终 SAVE 可用 |
| 3 | 高级调校链路：勾选 Advanced，点击 REFINE，仅出现 Purple/Gold 品质 | **PASS** | 仅显示 Purple 或 Gold Badge，符合高级品质池 |
| 4 | 保存链路：结果态点击 SAVE，左侧数值更新，右侧回到可再次调校状态 | **PASS** | SAVE 后左侧 DetailPanel 更新，REFINE 按钮再次可点击 |
| 5 | 调校中不可重复触发：动画期间连续点击 REFINE，确认不会重复触发 | **FAIL** | 动画期间 REFINE 按钮未及时禁用，连续点击仍为 enabled |
| 6 | 材料不足保护：材料不足时 REFINE 不可继续 | **无法验证** | 自动化无法可靠制造材料不足态（localStorage 注入与 zustand 水合时序冲突），需手工多次调校验证 |
| 7 | 未勾选 Advanced 时不显示保底计数 | **PASS** | 未勾选时「高级调教 x/10 次必出金色」不显示 |
| 8 | 高级连续未出金时计数递增；出金后重置 | **PASS** | 勾选 Advanced 后显示保底计数，多次调校可观察计数变化 |
| 9 | 普通调校不影响保底计数 | **PASS** | 普通调校后勾选 Advanced，保底计数保持不变 |
| 10 | 游标进度条有 spring 弹性晃动并定格 | **PASS** | GaugeSlider 使用 framer-motion spring (stiffness:80, damping:8)，游标动画可见 |
| 11 | CP 有从旧值到新值的过渡动画 | **PASS** | CALC_CP 阶段有 450ms requestAnimationFrame 过渡，CP 数值平滑变化 |
| 12 | 快速切换 Advanced 并点击 REFINE/SAVE，不出现崩溃 | **PASS** | 快速切换与点击后页面未崩溃，无 error URL |

---

## FAIL 最小复现步骤

### 5. 调校中不可重复触发

1. 打开 http://localhost:3000
2. 不勾选 Advanced，在约 0.5 秒内连续快速点击 REFINE 按钮 3 次
3. 观察：动画期间按钮未禁用，仍显示 “REFINE (5200)” 且可继续点击

**根因**：`setIsRunning(true)` 为异步状态更新，首帧渲染前存在时间窗，快速连点可在该窗口内多次触发 `handleRefine`。

---

## 建议修复

**P0-5**：在 `handleRefine` 开头使用同步锁或 `useRef`，在首行立即标记「进行中」，或使用 `flushSync` 使 `setIsRunning(true)` 立即生效，避免连点窗口。

---

## 测试脚本

回归测试脚本位于 `tests/weapon-refine-regression.spec.ts`，执行：

```bash
npx playwright test tests/weapon-refine-regression.spec.ts
```
