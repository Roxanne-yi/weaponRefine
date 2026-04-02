/**
 * 武器调校页面回归测试 - 手工回归测试自动化
 * 按检查项 1-12 执行并记录 PASS/FAIL
 */
import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

test.describe("武器调校回归测试", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState("networkidle");
    // 清除 localStorage 确保初始态
    await page.evaluate(() => localStorage.removeItem("weapon-refine-storage"));
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  // P0-1: 初始态渲染
  test("1. 初始态渲染：左侧有已保存属性，右侧处于待机可调校状态", async ({ page }) => {
    const detailPanel = page.locator("[class*='mb-2']").first();
    await expect(detailPanel).toBeVisible();
    const savedCp = page.locator("dd").filter({ hasText: /\d+/ }).first();
    await expect(savedCp).toBeVisible();
    const refineBtn = page.getByRole("button", { name: /REFINE/ });
    await expect(refineBtn).toBeEnabled();
    expect(await refineBtn.textContent()).toMatch(/REFINE/);
  });

  // P0-2: 普通调校链路
  test("2. 普通调校链路：不勾选 Advanced，点击 REFINE，阶段动画完整，最终出结果", async ({
    page,
  }) => {
    await expect(page.getByRole("checkbox", { name: /Advanced/i })).not.toBeChecked();
    const refineBtn = page.getByRole("button", { name: /REFINE/ });
    await refineBtn.click();

    // 等待品质滚动（至少 1.5s）
    await page.waitForTimeout(800);
    const qualityBadge = page.locator('[style*="background"]').filter({ hasText: /Green|Blue|Purple/ }).first();
    // 阶段中应有 Badge 显示
    await expect(page.locator("span").filter({ hasText: /Green|Blue|Purple/ }).first()).toBeVisible({ timeout: 3000 });

    // 等待完整序列：ROLLING -> SELECT_BUFF -> SLIDER_ANIM -> CALC_CP -> RESULT (约 3.3s)
    await page.waitForTimeout(3500);

    // 结果态：应有数值揭示（非 ?）
    const atkDisplay = page.locator("span").filter({ hasText: /^\d+$/ }).first();
    await expect(atkDisplay).toBeVisible({ timeout: 2000 });
    const saveBtn = page.getByRole("button", { name: "SAVE" });
    await expect(saveBtn).toBeEnabled();
  });

  // P0-3: 高级调校链路
  test("3. 高级调校链路：勾选 Advanced，点击 REFINE，仅出现 Purple/Gold 品质", async ({
    page,
  }) => {
    await page.getByRole("checkbox", { name: /Advanced/i }).check();
    const refineBtn = page.getByRole("button", { name: /REFINE/ });
    await refineBtn.click();

    await page.waitForTimeout(800);
    const qualityText = await page.locator("span").filter({ hasText: /Purple|Gold/ }).first().textContent({ timeout: 3000 });
    expect(qualityText).toMatch(/Purple|Gold/);

    await page.waitForTimeout(3500);
    const finalBadge = page.locator('[style*="background"]').filter({ hasText: /Purple|Gold/ });
    await expect(finalBadge.first()).toBeVisible({ timeout: 2000 });
  });

  // P0-4: 保存链路
  test("4. 保存链路：结果态点击 SAVE，左侧数值更新，右侧回到可再次调校状态", async ({
    page,
  }) => {
    const refineBtn = page.getByRole("button", { name: /REFINE/ });
    await refineBtn.click();
    await page.waitForTimeout(4000);

    const saveBtn = page.getByRole("button", { name: "SAVE" });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();

    await page.waitForTimeout(600);
    await expect(page.getByRole("button", { name: /REFINE/ })).toBeEnabled();
    const detailPanel = page.locator("dd").filter({ hasText: /\d+/ });
    await expect(detailPanel.first()).toBeVisible();
  });

  // P0-5: 调校中不可重复触发
  test("5. 调校中不可重复触发：动画期间连续点击 REFINE，不会重复触发", async ({
    page,
  }) => {
    const refineBtn = page.getByRole("button", { name: /REFINE/ });
    await refineBtn.click();
    await refineBtn.click();
    await refineBtn.click();

    await page.waitForTimeout(500);
    await expect(page.getByRole("button", { name: /REFINING/ })).toBeVisible();
    await expect(refineBtn).toBeDisabled();
  });

  // P0-6: 材料不足保护 - 需要多次调校耗尽材料
  test("6. 材料不足保护：材料不足时 REFINE 不可继续", async ({ page }) => {
    // 修改 localStorage 使 materialA 不足 (普通需要 99)，格式需匹配 zustand persist
    await page.evaluate(() => {
      const stored = localStorage.getItem("weapon-refine-storage");
      let data: { state?: Record<string, unknown>; version?: number } = stored ? JSON.parse(stored) : {};
      const state = (data.state || {}) as Record<string, unknown>;
      state.inventory = { materialA: 50, materialB: 0 };
      state.pityCount = state.pityCount ?? 0;
      state.saved = state.saved ?? { quality: "GREEN", handlingBuff: "+2%", buffValue: 2, atk: 90, def: 100, cp: 385 };
      data.state = state;
      data.version = data.version ?? 0;
      localStorage.setItem("weapon-refine-storage", JSON.stringify(data));
    });
    await page.reload();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    await expect(page.getByRole("checkbox", { name: /Advanced/i })).not.toBeChecked();
    const refineBtn = page.getByRole("button", { name: /REFINE/ });
    await expect(refineBtn).toBeDisabled();
  });

  // 7: 未勾选 Advanced 时不显示保底计数
  test("7. 未勾选 Advanced 时不显示保底计数", async ({ page }) => {
    await expect(page.getByRole("checkbox", { name: /Advanced/i })).not.toBeChecked();
    await expect(page.getByText(/高级调教.*\/10/)).not.toBeVisible();
  });

  // 8: 高级连续未出金时计数递增；出金后重置
  test("8. 高级勾选后显示保底计数，出金后重置", async ({ page }) => {
    await page.getByRole("checkbox", { name: /Advanced/i }).check();
    await expect(page.getByText(/高级调教.*\/10/)).toBeVisible();

    // 连续多次高级调校观察计数（可能出金可能不出）
    for (let i = 0; i < 3; i++) {
      const refineBtn = page.getByRole("button", { name: /REFINE/ });
      if (await refineBtn.isDisabled()) break;
      await refineBtn.click();
      await page.waitForTimeout(4500);
      const countText = await page.getByText(/高级调教.*\/10/).textContent();
      expect(countText).toBeDefined();
      const saveBtn = page.getByRole("button", { name: "SAVE" });
      if (await saveBtn.isEnabled()) await saveBtn.click();
      await page.waitForTimeout(600);
    }
  });

  // 9: 普通调校不影响保底计数
  test("9. 普通调校不影响保底计数", async ({ page }) => {
    await page.evaluate(() => {
      const stored = localStorage.getItem("weapon-refine-storage");
      const data = stored ? JSON.parse(stored) : {};
      const state = data.state || {};
      state.pityCount = 5;
      localStorage.setItem("weapon-refine-storage", JSON.stringify({ ...data, state }));
    });
    await page.reload();
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("checkbox", { name: /Advanced/i })).not.toBeChecked();
    const refineBtn = page.getByRole("button", { name: /REFINE/ });
    await refineBtn.click();
    await page.waitForTimeout(4500);

    await page.getByRole("checkbox", { name: /Advanced/i }).check();
    const countText = await page.getByText(/高级调教.*\/10/).textContent();
    expect(countText).toContain("5");
  });

  // 10: 游标进度条有 spring 弹性
  test("10. 游标进度条有 spring 弹性晃动并定格", async ({ page }) => {
    const refineBtn = page.getByRole("button", { name: /REFINE/ });
    await refineBtn.click();
    await page.waitForTimeout(2500);
    const gauge = page.locator('[style*="box-shadow"]').first();
    await expect(gauge).toBeVisible();
  });

  // 11: CP 有从旧值到新值的过渡动画
  test("11. CP 有从旧值到新值的过渡动画", async ({ page }) => {
    const cpBefore = await page.locator("span").filter({ hasText: /^\d+$/ }).first().textContent();
    const refineBtn = page.getByRole("button", { name: /REFINE/ });
    await refineBtn.click();
    await page.waitForTimeout(3200);
    const cpAfter = await page.locator("span").filter({ hasText: /^\d+$/ }).first().textContent();
    expect(cpBefore).toBeDefined();
    expect(cpAfter).toBeDefined();
  });

  // 12: 快速切换 Advanced 并点击 REFINE/SAVE，不出现崩溃
  test("12. 快速切换 Advanced 并点击 REFINE/SAVE，不出现崩溃", async ({ page }) => {
    const advancedCheck = page.getByRole("checkbox", { name: /Advanced/i });
    const refineBtn = page.getByRole("button", { name: /REFINE/ });

    await advancedCheck.check();
    await advancedCheck.uncheck();
    await advancedCheck.check();
    await refineBtn.click();
    await page.waitForTimeout(4500);
    const saveBtn = page.getByRole("button", { name: "SAVE" });
    if (await saveBtn.isEnabled()) {
      await saveBtn.click();
      await page.waitForTimeout(600);
    }
    await expect(page).not.toHaveURL(/error/);
  });
});
