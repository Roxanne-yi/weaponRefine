/**
 * Figma 设计稿 1920x1080 关键尺寸与字号
 * 用于与设计稿 1:1 比例还原
 */
export const FIGMA_DESIGN = {
  width: 1920,
  height: 1080,
} as const;

/** 顶栏 */
export const HEADER = {
  height: 110,
  tabFontSize: 42,
  tabFontWeight: 900,
  currencyIconSize: 58,
  currencyFontSize: 30.616,
  closeBtnSize: 58,
  paddingX: 48,
  navGap: 48,
} as const;

/** 左侧页签区 */
export const LEFT_TABS = {
  width: 110,
  topOffset: 168,
  iconSize: 80,
  iconGap: 40,
} as const;

/** 左侧详情卡 */
export const DETAIL_CARD = {
  width: 380,
  padding: 20,
  titleFontSize: 32,
  titleFontWeight: 700,
  qualityFontSize: 22,
  rowFontSize: 18,
  labelFontSize: 14,
  borderBottomPadding: 10,
} as const;

/** 右侧调校面板 — 字号与 MCP 14218:272 / 14218:9867 一致 */
export const REFINE_PANEL = {
  sectionGap: 28,
  blockGap: 12,
  titleBarHeight: 16,
  /** Handling BUFF / Combat stats 标题条高度 */
  sectionTitleBarHeight: 41,
  popoverTitleFontSize: 32,
  popoverTitleWeight: 500,
  /** 「Combat Power:」标签 */
  cpLabelFontSize: 36,
  /** CP 数值（结果态 #bef528） */
  cpValueFontSize: 36,
  /** Buff 选项默认 / 高亮（稿中选中档约 32px，其余 26px） */
  buffOptionFontSize: 26,
  buffOptionHighlightedFontSize: 32,
  /** Combat stats 行：标签 / 数值 */
  combatStatRowLabelFontSize: 30,
  combatStatRowValueFontSize: 26,
  /** 保存操作提示正文（Roboto Medium） */
  saveTooltipFontSize: 30,
  /** CONSUMPTION 标题与下方物品框间距（稿面约 730→809） */
  consumptionGapAfterTitle: 40,
  consumptionCardMinHeight: 72,
  consumptionCardWidth: 140,
  buttonHeight: 48,
} as const;
