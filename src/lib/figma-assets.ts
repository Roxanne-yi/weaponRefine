/**
 * 本地切图目录：`public/figma-assets/`（由 Figma MCP asset 导出，避免 URL 过期）
 * 重新拉取：npm run figma:assets
 * 设计文件 fileKey: E2P0A8fSPLQ9jtZTZiwDvB；节点 14218:272 / 14218:9867 等
 *
 * 与 `next.config.ts` 的 `basePath` 对齐（由 `NEXT_PUBLIC_BASE_PATH` 注入），
 * 便于 GitHub Pages 子路径部署（如 `/weaponRefine`）。
 */
const publicBase = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
const B = `${publicBase}/figma-assets`;

function png(id: string) {
  return `${B}/${id}.png`;
}

function asset(filename: string) {
  return `${B}/${filename}`;
}

export const figmaAssets = {
  /** 整页背景 - Background Image */
  bg: png("a589d0a1-772f-480a-9f3f-9a0e848f5017"),
  /** 蓝图/武器区背景（与 bg 同源或单独层） */
  backgroundImage: png("a589d0a1-772f-480a-9f3f-9a0e848f5017"),
  /** 武器倍镜主图 + 阴影（Scope Image shadow 同图） */
  scopeImage: png("d2783e50-b0f8-406c-b50b-fb6163001fe1"),
  scopeImageShadow: png("d2783e50-b0f8-406c-b50b-fb6163001fe1"),
  /** 顶栏背景 */
  topBarBackground: png("044e464f-81ca-45df-bafd-7c7d4b6a4196"),
  /** 关闭按钮 */
  closeBtn: png("53b58a61-06a4-40c0-83d2-cdd37bd4619c"),
  /** 货币图标（右上角代币栏新版） */
  currencyIcon: png("3b48c5be-064e-4427-b660-ee133a993cc3"),
  /** 货币补充图标（右上角代币栏新版，精灵图裁切） */
  currencyPlus: png("8a7930db-d407-4413-b60d-9423ce9115e4"),
  /** 页签选中态（顶栏调校高亮） */
  tabSelected: png("5b76d32e-93dc-463d-9345-835d49ec6792"),
  /** 左侧配件 Tab 图标 6 个 */
  tabIcons: [
    png("adebb334-3bdb-4e31-9fab-e2cf36460731"),
    png("65d9e58c-842b-4e45-bb4c-5205c9842019"),
    png("c6cba9e2-0a5f-40b4-ab9a-585148f1718a"),
    png("9bc45b51-9ba3-475b-b144-959b702c77d8"),
    png("8e7cc149-f060-4785-b538-f6d62a14f178"),
    png("562151bf-74d6-46c4-a34b-ea879ee1dd70"),
  ],
  /** 右侧面板背景 */
  rightPanelBackground: png("ce8dbcba-0075-4d2b-99be-22e335631944"),
  /** 品质图标 绿/蓝/紫（14218:272 Random Quality Icons） */
  qualityGreen: png("4babd8a1-5261-46cf-a50b-99c0f3d2dc45"),
  qualityBlue: png("828ea5cc-2ee3-4113-a962-8f7feb1676ee"),
  qualityPurple: png("3a71bee2-e280-49f4-8d23-9c50a3f40b89"),
  /** 金色品质 14454:1086（与紫钻独立资源） */
  qualityGold: png("16e383ec-e117-48d7-b29b-f704651ef037"),
  /** 14218:9867 品质揭示区域：装饰框 / 光效 / 侧向选中指示条 */
  qualityRevealOrnament: png("5b15e86f-1ccf-4c6d-9e4b-54b222ae77fb"),
  qualityRevealGlow: png("7cf5f6d9-2977-47be-9076-f9a31a19884c"),
  qualitySelectedIndicator: asset("7d938d0d-87b0-46c7-8913-a506881047f8.svg"),
  /** 帮助图标底 */
  helpIconBackground: png("55a3b3b8-f59f-420c-8412-47e935dc4fe4"),
  /** Handling Buff / Combat Stats 标题底图（新版） */
  handlingBuffLabelBg: png("a7dd976e-a25d-4c29-986b-5f5fee10045a"),
  /** Buff 数值底图 Value bg */
  valueBg: png("14a6f881-fc3d-4f47-bb5d-6f1bb9c1756f"),
  /** 战力条（Weapon Attack 数值范围） */
  weaponAttackBar: png("71bfa9e4-2b47-4773-8173-c53268eb0cfd"),
  /** 数值详情按钮 */
  btnDetail: png("711188aa-bf11-4235-b0b3-e4aa7346828c"),
  /** 普通材料 - 物品卡（新版，含图案） */
  itemQualityBar: png("adb81cfe-bfad-47eb-9290-b3e937482b2e"),
  itemQualityStrip: png("3fe23214-3b0d-488d-9b20-1649a8108a8b"),
  /** 普通材料图标 */
  normalMaterialIcon: png("1cec5225-6d9b-47f1-a2d3-e2b09c189ea2"),
  /** 高级材料 - 物品卡（新版，含图案） */
  itemBackgroundAdvanced: png("61999d1b-15cf-40ee-84e2-aeba45a4e13e"),
  /** 高级品质条 */
  itemAdvancedQualityStrip: png("45eb6a38-8458-4d82-bf6d-6527c256833c"),
  /** 高级材料图标 */
  advancedMaterialIcon: png("9baeab82-4a90-41dd-8b38-6152f2e18cca"),
  /** 复选框未选中（14439:1250） */
  checkbox: png("55caae55-2b97-4432-b38e-919fba3fd17e"),
  /** REFINE 右侧装饰底纹（两层，见 MCP btn_refine / btn_right） */
  btnRightCap: png("0aa1fa60-106e-40ec-b86a-f640f23458e6"),
  btnRightCapAccent: png("5c5d8483-0b66-4428-b7e5-7e826175a0b9"),
  /** SAVE 默认态（不可点）右侧整块装饰，与 REFINE 右侧层不同 */
  btnSaveRightDisabledCap: png("cfce989a-83ef-43db-b0d8-4e422b5d08dc"),
  /** REFINE 按钮上的消耗货币图标 */
  currencyOnRefineBtn: png("563fcf65-5edc-415d-9518-2e8bf42f5637"),
  /** 结果态「保存」旁提示气泡底图 */
  saveTooltipBg: png("82599e82-5260-406c-87b0-e700bc676227"),
  /** 左侧 - 倍镜信息条底图 Scope Info Background */
  scopeInfoBackground: png("3d2e15a4-4f36-4ed3-942d-fc5b22e8c5d4"),
  /** 左侧 - 每行属性底图 Combat Power Background */
  combatPowerBackground: png("3526a457-ae14-4692-aad9-ce4589c1ba16"),
  /** 左侧 - 帮助按钮 */
  helpBtn: png("c895f51d-196e-4306-8d66-4992ac15b45a"),
  /** 高级调教保底提示图标 */
  advancedTrainingIcon: png("c7c91ea9-801c-467b-936c-0c9c7714c6f8"),
  /** 分割线等 */
  divider: asset("058656d1-51b5-4e1c-aaad-e230e7b0d095.svg"),
  /** CONSUMPTION 标题左右衬线（14439:1230） */
  consumptionSerifLeft: png("87a80876-98e1-4d2a-991a-a3cad2423151"),
  consumptionSerifRight: png("dc195fa3-048c-474b-85f2-8c235fb342f5"),
  dividerVertical: asset("b072edd8-fc3e-4825-8775-569227a2e9bb.svg"),
  /** Advanced 标签底图（新版） */
  advancedLabelBg: png("7d7cbd8d-18d0-48f2-b84f-2237f7f82b79"),
} as const;

/** 兼容旧引用：SAVE/REFINE 按钮图（当前用顶栏关闭按钮样式 + 文案，如需整图可再拉） */
export const figmaAssetsLegacy = {
  btnSave: figmaAssets.rightPanelBackground,
  btnRefine: figmaAssets.rightPanelBackground,
  itemBackground: figmaAssets.itemQualityBar,
} as const;
