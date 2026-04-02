# Weapon Refine（武器调校界面）

基于 **Next.js** 与 **Figma** 设计稿还原的游戏内「武器调校 / Refine」单页演示：包含顶栏、左侧详情、中央武器展示、右侧调校流程（品质揭示、Buff 选择、Combat stats、消耗材料与 REFINE / SAVE 等）。状态由 **Zustand** 管理，动效使用 **Framer Motion**。

---

## 环境要求

- **Node.js** 建议 **20.x** 或更高（与 `package.json` 中 `@types/node` 一致）
- **npm**（或兼容的 pnpm / yarn，下列命令以 npm 为准）

---

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 本地开发

```bash
npm run dev
```

浏览器访问 **http://localhost:3000**（默认端口以终端输出为准）。

页面按设计稿 **1920×1080** 为基准，随窗口缩小整体等比缩放。

### 3. 生产构建与启动

```bash
npm run build
npm run start
```

构建成功后，`start` 默认在 **http://localhost:3000** 提供生产模式服务。

### 4. 代码检查

```bash
npm run lint
```

---

## 切图资源（Figma MCP）

UI 使用的图片放在 **`public/figma-assets/`**，代码中通过 **`/figma-assets/...`** 引用（见 `src/lib/figma-assets.ts`），避免依赖易过期的 Figma MCP 在线地址。

- **克隆仓库后若缺少切图或图片损坏**：在项目根目录执行：

  ```bash
  npm run figma:assets
  ```

  该命令会运行 `scripts/download-figma-assets.mjs`，根据脚本内维护的 MCP asset URL 列表下载文件，并更新 **`public/figma-assets/manifest.json`**。

- **若下载失败（403/404 等）**：说明 URL 已失效，需在 Figma MCP 中重新获取资源地址，并同步更新：
  - `scripts/download-figma-assets.mjs` 中的 `URLS`
  - `src/lib/figma-assets.ts` 中的路径（与 manifest 中文件名一致）

> **仓库体积**：`public/figma-assets` 含较大 PNG 背景等文件。若使用 Git，可按团队规范考虑 Git LFS 或在 `.gitignore` 中忽略大资源后仅通过脚本拉取（需自行约定协作方式）。

---

## 如何使用（交互说明）

以下为面向试用者的操作说明，便于理解页面逻辑（具体数值以当前 `useWeaponStore` 实现为准）：

| 区域 | 说明 |
|------|------|
| **顶栏** | 页签、货币展示、关闭等装饰性布局（演示用） |
| **左侧** | 武器 / 倍镜信息与部分属性展示 |
| **中央** | 武器倍镜主视觉 |
| **右侧 Refine 面板** | 调校流程：品质揭示 → Handling BUFF 选择 → Combat stats 揭示 → 消耗材料说明 |
| **高级材料** | 勾选 **Advanced** 后使用高级材料逻辑与保底提示；**REFINE** 消耗与结果品质档位与普通模式不同 |
| **REFINE / SAVE** | 按流程推进动画与结果；满意结果后可 **SAVE**（含相关动效提示） |

---

## 端到端测试（可选）

项目包含 **Playwright** 配置（`playwright.config.ts`），测试目录为 **`tests/`**。未在 `package.json` 中配置快捷脚本时，可直接使用：

```bash
npx playwright install
npx playwright test
```

配置会在需要时自动拉起 `npm run dev`（本地已占用 3000 端口时可复用已有服务）。

---

## 目录结构（简要）

```
src/
  app/              # Next.js App Router，首页 page.tsx
  components/       # UI 组件（DetailPanel、RefinePanel 等）
  lib/              # figma-assets、设计 token、常量等
  store/            # Zustand 状态
public/
  figma-assets/     # 本地切图与 manifest.json
scripts/
  download-figma-assets.mjs
tests/              # Playwright 回归测试
```

---

## 上传到 GitHub 的建议

1. 在 GitHub 新建仓库（可不初始化 README，避免冲突）。
2. 本地执行：

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git branch -M main
   git push -u origin main
   ```

3. 若 `public/figma-assets` 体积过大，推送前请确认是否纳入版本控制或使用 LFS / 忽略策略。

---

## 技术栈

- **Next.js** 16、**React** 19、**TypeScript**
- **Tailwind CSS** 4
- **Framer Motion**、**Zustand**
- **Radix UI**、**shadcn** 相关依赖（组件库）

---

## 许可证

若需开源，请在仓库中补充 `LICENSE` 文件并写明版权与使用条款；当前仓库未默认附带许可证文件。
