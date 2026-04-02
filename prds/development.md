这份技术文档旨在为 Cursor 提供一套**工业级、低耦合**的开发方案。核心思路是利用成熟的 React 生态组件，通过组合“积木”的方式快速实现复杂的调校表演逻辑。

---

# 技术架构文档 (Technical Specification)

## 1. 核心技术栈 (Technology Stack)

为了保证 Cursor 生成代码的质量，选用了 AI 最为熟悉的成熟库：

| 维度 | 选型 | 理由 |
| --- | --- | --- |
| **基础框架** | **Next.js 14+ (App Router)** | 标准化架构，利于管理组件生命周期。 |
| **样式/UI** | **Tailwind CSS + shadcn/ui** | 游戏化 UI 的快速实现首选，Cursor 对其 API 调用极其精准。 |
| **动效/表演** | **Framer Motion** | 核心组件。负责品质闪烁、游标晃动、数值飞入等所有视觉表演。 |
| **状态管理** | **Zustand** | 处理保底计数、材料扣除、五阶段状态流，逻辑清晰且易于持久化。 |
| **数据持久化** | **Zustand Persist (LocalStorage)** | 纯本地存储，无需数据库，刷新页面数据不丢失。 |

---

## 2. 系统核心逻辑实现方案

### A. 五阶段表演控制器 (Sequence Controller)

不要让 Cursor 使用复杂的 `setTimeout` 嵌套。推荐使用状态机思维：

* **定义状态**：`IDLE` (待机) -> `ROLLING_QUALITY` (随机品质) -> `SELECT_BUFF` (选中Buff) -> `SLIDER_ANIM` (游标晃动) -> `CALC_CP` (计算战力) -> `RESULT` (结果展示)。
* **实现**：使用 `async/await` 配合自定义的 `delay` 函数，控制每一阶段 UI 的顺序解锁。

### B. 游标进度条实现 (Visual Gauges)

* **方案**：使用 `shadcn/ui` 的 `Progress` 组件作为底座。
* **动效**：游标（Pointer）是一个独立的 `motion.div`。
* **物理效果**：使用 Framer Motion 的 `type: "spring"` 属性。通过调整 `stiffness` (劲度) 和 `damping` (阻尼)，模拟真实指针摆动并最终定格的效果。

### C. 阶梯式 Handling Buff 揭示

* **方案**：将所有选项渲染为一组 `Badge` 或自定义卡片。
* **逻辑**：根据随机出的品质索引，触发对应索引项的 `scale: 1.2` 和 `brightness-125` 动画，同时置灰非目标选项。

---

## 3. 数据模型与算法 (The "Brain")

### 3.1 属性配置常量

```typescript
const QUALITY_CONFIG = {
  GREEN: { buff: "+2%", atk: [50, 150], def: [100, 250], color: "#4ADE80" },
  BLUE:  { buff: "+4%", atk: [151, 300], def: [251, 450], color: "#60A5FA" },
  // ... 以此类推，确保区间不重叠
};

```

### 3.2 保底逻辑 (Pity System)

* 在 Zustand Store 中维护 `pityCount: number`。
* `performRefine` 函数执行时，判断 `isAdvanced` 为真且 `pityCount >= 9`，则直接返回 `GOLD` 品质，否则按权重随机。

---

## 4. 给 Cursor 的开发路线图 (Development Roadmap)

### 第一阶段：基础设施 (The Foundation)

> "安装 `framer-motion`, `lucide-react`, `zustand`。配置 `shadcn/ui` 的 Checkbox 和 Button 组件。建立 `useWeaponStore.ts` 处理基础数值逻辑。"

### 第二阶段：右侧控制面板 (Action Panel)

> "构建 `RefinePanel` 组件。实现材料切换逻辑（普通/高级模式图标切换）。编写五阶段异步函数逻辑，用 `console.log` 模拟每一阶段的完成。"

### 第三阶段：游标与揭示组件 (Visual Components)

> "实现 `NumberTicker` 数字滚动组件和 `RefineSlider` 游标进度条。确保游标晃动符合物理直觉，并能在指定品质区间内定格。"

### 第四阶段：整合与动效 (Polishing)

> "实现左侧沉浸式背景。添加‘高级调校’水印。最后实现点击 `SAVE` 时数值飞入左侧详情栏的 `layoutId` 跨组件动画。"

---

## 5. 开发者备注 (完全本地化要求)

* **No External API**：所有图片资源请存放在 `/public` 目录下。
* **Local Assets**：使用 `Lucide-React` 提供战术风格图标。
* **Mock Data**：初始状态直接写入 Store 的 `initialState` 中。

---

**下一步建议：**
你可以先让 Cursor 编写 **`useWeaponStore.ts`**。这是项目的“大脑”，包含了保底计数、多阶段状态管理以及最重要的品质-数值映射逻辑。只要 Store 写对了，后面的 UI 表现就是顺理成章的。