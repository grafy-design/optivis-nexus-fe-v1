/**
 * TSI 차트 공통 스타일 시스템
 *
 * 모든 TSI 영역 ECharts 차트에서 반복되는 스타일을 중앙 관리합니다.
 * - 툴팁 (tooltip) 스타일 + HTML formatter
 * - 축 (axis) 스타일
 * - 호버/emphasis 패턴
 * - 색상 팔레트
 * - 애니메이션 설정
 * - 유틸리티 함수
 */

// ─── 색상 상수 ───────────────────────────────────────────────
// ECharts Canvas2D는 CSS var()를 해석할 수 없으므로 직접 색상값 사용

export const CHART_COLORS = {
  /** 축 라벨/이름 텍스트 */
  NEUTRAL_50: "#787776",
  /** 축선/tick lineStyle */
  AXIS_LINE: "#787776",
  /** 진한 텍스트/축 (XS/M/L) */
  NEUTRAL_30: "#484646",
  /** splitLine 기본 (연한) */
  NEUTRAL_95: "#efeff4",
  /** hover 강조 텍스트 */
  PRIMARY_15: "#262255",
  /** splitLine */
  SPLIT_LINE: "#e3e1e5",
  /** splitLine 보조 */
  SPLIT_LINE_ALT: "#E2E1E5",
  /** splitLine 대시 */
  SPLIT_LINE_DASHED: "#efeff4",
  /** 가이드라인 */
  GUIDE_LINE: "#D2D2DA",
  /** 가이드라인 보조 */
  GUIDE_LINE_ALT: "#c7c5c9",
} as const;

/** MultiLineWithErrorBar 기본 그룹 색상 팔레트 */
export const GROUP_COLORS = [
  "#F07A22", // 오렌지
  "#4B3DF2", // 보라
  "#262255", // 딥퍼플
  "#E04A7A", // 핑크
  "#8C62FF", // 라이트퍼플
  "#2F89FC", // 블루
  "#F1B316", // 옐로우
] as const;

/** 히스토그램 보라 그라데이션 팔레트 (밝은순) */
export const HISTOGRAM_PALETTE = [
  "rgba(203,198,232,0.9)",
  "rgba(176,170,220,0.9)",
  "rgba(150,143,200,0.9)",
  "rgba(124,116,180,0.9)",
  "rgba(58,52,110,0.95)",
  "rgba(40,37,86,0.95)",
] as const;

/** SubgroupProportion 팔레트 */
export const SUBGROUP_PALETTE = {
  base: [
    "rgba(176,170,220,0.9)",
    "rgba(124,116,180,0.9)",
    "rgba(58,52,110,0.95)",
    "rgba(40,37,86,0.95)",
  ],
  emphasis: [
    "#a18af4",
    "#7654f0",
    "#3609a1",
    "#231368",
  ],
} as const;

/** Scatter 팔레트 */
export const SCATTER_PALETTE = {
  base: [
    "rgba(90,83,160,0.6)",
    "rgba(166,160,220,0.6)",
  ],
  emphasis: [
    "rgba(90,83,160,1)",
    "rgba(166,160,220,1)",
  ],
} as const;

/** SHAP 색상 매핑 */
export const SHAP_COLORS = {
  low: "#D8D3FF",
  high: "#231F52",
  emphasisLow: "#BFB0F8",
  emphasisHigh: "#231368",
} as const;

/** 리포트 페이지 색상 */
export const REPORT_COLORS = {
  modelBased: {
    risk: ["#A6A3E3", "#6E6AA7", "#272354"],
    stack: { within: "#9C97D0", explained: "#26225B" },
    bars: { high: "#26225B", middle: "#7A74AC", low: "#A39ED5", default: "#26225B" },
  },
  featureBased: {
    risk: ["#26225B", "#EF6A00", "#4327E6"],
    stack: { within: "#B7B7BC", explained: "#EF6A00" },
    bars: { high: "#4327E6", middle: "#EF6A00", low: "#26225B", default: "#26225B" },
  },
} as const;

/** Cutoff 세그먼트 색상 */
export const CUTOFF_SEGMENT_COLORS = [
  { line: "#f97316", area: "rgba(249,115,22,0.1)" },
  { line: "#919092", area: "rgba(145,144,146,0.1)" },
  { line: "#262255", area: "rgba(38,34,85,0.1)" },
] as const;

// ─── ATS Report 색상 ────────────────────────────────────────

export const ATS_REPORT_COLORS = {
  /** Proposed / primary bar */
  proposed: "#262255",
  /** Standard ANCOVA 라인/점 */
  standard: "#7571A9",
  /** Unadjusted 라인/점/바 */
  unadjusted: "#AAA5E1",
  /** Standard Design 바 */
  standardBar: "#A692D6",
  /** Expected/마크라인 보라 */
  markLine: "#704ef3",
  /** 그라데이션 상단 연보라 */
  gradientTop: "#E9DDFF",
  /** Non-significant zone */
  nsZone: "rgba(0,0,0,0.06)",
  /** 가이드 점선 (회색) */
  guideDashed: "#999999",
  /** 구분선 */
  divider: "#E5E5E5",
  /** splitLine */
  splitLine: "#E8E8E8",
} as const;

// ─── DRD 색상 ───────────────────────────────────────────────

export const DRD_COLORS = {
  strategyA: "#3A11D8",
  strategyB: "#F06600",
  strategyC: "#24C6C9",
  primary: "#262255",
  neutral10: "#1c1b1b",
  neutral30: "#484646",
  neutral40: "#5f5e5e",
  neutral60: "#929090",
  tableBody: "#787776",
  markLine: "#7a7793",
} as const;

// ─── Comparison/Single Bar 색상 ─────────────────────────────

export const COMPARISON_COLORS = {
  optivis: "#F06600",
  traditional: "#231F52",
  label: "#FFFFFF",
} as const;

// ─── 유틸리티 함수 ──────────────────────────────────────────

/** HEX → rgba 변환 */
export function hexToRgba(hex: string, alpha: number): string {
  if (hex.startsWith("rgba(") || hex.startsWith("rgb(")) return hex;
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => `${c}${c}`).join("") : h;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return `rgba(120,120,120,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

/** 축 간격(interval) 자동 계산 — 5등분 기준 nice number */
export function getNiceInterval(maxValue: number): number {
  if (maxValue <= 0) return 1;
  const rough = maxValue / 5;
  const power = Math.pow(10, Math.floor(Math.log10(rough)));
  const scaled = rough / power;
  if (scaled <= 1) return 1 * power;
  if (scaled <= 2) return 2 * power;
  if (scaled <= 5) return 5 * power;
  return 10 * power;
}

// ─── 폰트 상수 ──────────────────────────────────────────────

export const CHART_FONT = {
  family: "Inter, sans-serif",
  familyShort: "Inter",
} as const;

// ─── 사이즈 변형 시스템 ──────────────────────────────────────

export type ChartSizeVariant = "XS" | "S" | "M" | "L";

export type ChartSizeStyle = {
  labelFontSize: number;
  labelFontWeight: number;
  numberFontSize: number;
  numberFontWeight?: number;
  axisColor: string;
  numberColor?: string;
  axisLineColor?: string;
  axisWidth: number;
  splitLineColor: string;
  labelDecimalPlaces?: number;
};

export const CHART_SIZE_STYLES: Record<ChartSizeVariant, ChartSizeStyle> = {
  XS: { labelFontSize: 9, labelFontWeight: 400, numberFontSize: 9, axisColor: CHART_COLORS.NEUTRAL_30, axisWidth: 1, splitLineColor: CHART_COLORS.NEUTRAL_95 },
  S:  { labelFontSize: 10.5, labelFontWeight: 600, numberFontSize: 10.5, numberFontWeight: 600, axisColor: CHART_COLORS.NEUTRAL_50, numberColor: CHART_COLORS.NEUTRAL_50, axisLineColor: CHART_COLORS.AXIS_LINE, axisWidth: 1, splitLineColor: CHART_COLORS.NEUTRAL_95, labelDecimalPlaces: 0 },
  M:  { labelFontSize: 15, labelFontWeight: 600, numberFontSize: 9, axisColor: CHART_COLORS.NEUTRAL_30, axisWidth: 1, splitLineColor: CHART_COLORS.NEUTRAL_95 },
  L:  { labelFontSize: 19.5, labelFontWeight: 600, numberFontSize: 9, axisColor: CHART_COLORS.NEUTRAL_30, axisWidth: 1, splitLineColor: CHART_COLORS.NEUTRAL_95 },
};

// ─── 공통 툴팁 스타일 ────────────────────────────────────────

/** 기본 툴팁 스타일 (모든 차트 공통) */
export const tooltipBase = {
  padding: [4, 6] as [number, number],
  borderWidth: 0,
  borderColor: "transparent",
  extraCssText: "box-shadow: 0 2px 8px rgba(0,0,0,0.1);",
  textStyle: {
    fontFamily: CHART_FONT.familyShort,
    fontSize: 12,
    fontWeight: 600,
  },
} as const;

/** axis trigger + shadow axisPointer (바 차트용) */
export const tooltipAxisShadow = {
  ...tooltipBase,
  trigger: "axis" as const,
  axisPointer: {
    type: "shadow" as const,
    triggerEmphasis: false,
    z: -1,
  },
};

/** axis trigger + shadow (투명 배경, tsi-report용) */
export const tooltipAxisShadowLight = {
  ...tooltipBase,
  trigger: "axis" as const,
  axisPointer: {
    type: "shadow" as const,
    z: -1,
    shadowStyle: { color: "rgba(150,150,150,0.08)" },
  },
  confine: true,
};

/** axis trigger + cross axisPointer (라인 차트용) */
export const tooltipAxisCross = {
  ...tooltipBase,
  trigger: "axis" as const,
  axisPointer: {
    type: "cross" as const,
    lineStyle: { color: CHART_COLORS.AXIS_LINE, type: "dashed" as const },
    crossStyle: { color: CHART_COLORS.AXIS_LINE, type: "dashed" as const },
  },
};

/** item trigger (scatter/forest용) */
export const tooltipItem = {
  ...tooltipBase,
  trigger: "item" as const,
};

// ─── 툴팁 HTML 빌더 ─────────────────────────────────────────

/**
 * 툴팁 내부 한 행 HTML 생성
 * 좌측: marker + 라벨 (9px, 500), 우측: 값 (13px, 600)
 */
export function tooltipRow(marker: string, label: string, value: string): string {
  return `<div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline"><span style="font-size:9px;font-weight:500">${marker}${label}</span><span style="font-size:13px;font-weight:600">${value}</span></div>`;
}

/**
 * 툴팁 내부 행 HTML — 색상 dot 사용 (tsi-report 스타일)
 * marker 대신 직접 컬러 dot을 렌더링
 */
export function tooltipDotRow(dotColor: string, label: string, value: string): string {
  return `<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:1px 0"><span style="display:flex;align-items:center;gap:6px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${dotColor};flex-shrink:0"></span><span style="color:#787776;font-size:9px">${label}</span></span><span style="color:#787776;font-size:13px;font-weight:600">${value}</span></div>`;
}

/** 툴팁 제목 행 (12px, 600, 하단 마진) */
export function tooltipTitle(text: string): string {
  return `<div style="font-size:12px;font-family:Inter;color:#787776;font-weight:600;margin-bottom:4px">${text}</div>`;
}

/** 툴팁 소제목 행 (9px, 500, 하단 마진) */
export function tooltipSubTitle(text: string): string {
  return `<div style="font-size:9px;font-weight:500;margin-bottom:4px">${text}</div>`;
}

/** 툴팁 구분선 + 합계 행 */
export function tooltipTotalRow(label: string, value: string): string {
  return `<div style="display:flex;justify-content:space-between;padding:1px 0;border-top:1px solid #e3e1e5;margin-top:2px;padding-top:3px"><span style="color:#787776;font-size:9px">${label}</span><span style="color:#787776;font-size:13px;font-weight:600">${value}</span></div>`;
}

/** 툴팁 전체 래퍼 (font-family 적용) */
export function tooltipWrap(innerHtml: string): string {
  return `<div style="font-family:Inter,sans-serif">${innerHtml}</div>`;
}

/**
 * 기본 axis 툴팁 formatter
 * params → 제목 + 각 시리즈별 marker/name/value 행
 */
export function defaultAxisFormatter(
  params: any,
  valueFormatter: (value: any) => string = (v) => String(v ?? 0),
): string {
  const items = Array.isArray(params) ? params : [params];
  const title = items[0]?.axisValueLabel ?? "";
  const rows = items
    .map((item: any) => tooltipRow(item.marker ?? "", item.seriesName ?? "", valueFormatter(item.value)))
    .join("");
  return tooltipWrap(
    (title ? tooltipSubTitle(title) : "") + rows,
  );
}

// ─── 공통 축 스타일 ─────────────────────────────────────────

/** 축 라벨 기본 스타일 (10px, 500, Inter) */
export const axisLabelBase = {
  color: CHART_COLORS.NEUTRAL_50,
  fontSize: 10,
  fontWeight: 500,
  fontFamily: CHART_FONT.family,
} as const;

/** 축 이름 기본 스타일 */
export const axisNameBase = {
  color: CHART_COLORS.NEUTRAL_50,
  fontSize: 10,
  fontWeight: 500,
  fontFamily: CHART_FONT.family,
} as const;

/** 축선 기본 스타일 */
export const axisLineBase = {
  show: true,
  lineStyle: { color: CHART_COLORS.AXIS_LINE },
} as const;

/** 축선 (width 포함, tsi-report용) */
export const axisLineWithWidth = {
  show: true,
  lineStyle: { color: CHART_COLORS.AXIS_LINE, width: 1 },
} as const;

/** 축 tick 숨김 */
export const axisTickHidden = { show: false } as const;

/** 축 tick 표시 */
export const axisTickVisible = {
  show: true,
  lineStyle: { color: CHART_COLORS.AXIS_LINE },
} as const;

/** 축 tick (길이 포함) */
export const axisTickWithLength = (length = 4) => ({
  show: true,
  length,
  lineStyle: { color: CHART_COLORS.AXIS_LINE },
});

/** splitLine 숨김 */
export const splitLineHidden = { show: false } as const;

/** splitLine 표시 */
export const splitLineVisible = (color = CHART_COLORS.SPLIT_LINE) => ({
  show: true,
  lineStyle: { color, width: 1 },
});

/** splitLine dashed */
export const splitLineDashed = (color = CHART_COLORS.NEUTRAL_95) => ({
  show: true,
  lineStyle: { color, type: "dashed" as const },
});

/**
 * Y축 edge label formatter
 * 상단 끝 라벨을 아래로, 하단 끝 라벨을 위로 치우치게 하여 축 영역 내에 텍스트가 유지되도록 함
 */
export function edgeLabelFormatter(
  yMax: number,
  yMin = 0,
  formatFn: (v: number) => string = (v) => v.toFixed(1),
): (value: number) => string {
  return (value: number) => {
    const label = formatFn(value);
    if (Math.abs(value - yMax) < 0.001) return `\n${label}`;
    if (Math.abs(value - yMin) < 0.001) return `${label}\n`;
    return label;
  };
}

/**
 * X축 edge label rich text 설정 생성
 * 첫 번째 라벨을 오른쪽 정렬, 마지막 라벨을 왼쪽 정렬하여 overflow 방지
 */
export function xAxisEdgeLabelRich(opts?: {
  width?: number;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
}) {
  const { width = 20, fontSize = 10, fontWeight = 500, color = CHART_COLORS.NEUTRAL_50 } = opts ?? {};
  const base = { fontSize, fontWeight, fontFamily: CHART_FONT.family, color };
  return {
    rich: {
      lEdge: { width, align: "right" as const, ...base },
      rEdge: { width, align: "left" as const, ...base },
    },
    edgeFormatter: (value: string, index: number, total: number) => {
      if (index === 0) return `{lEdge|${value}}`;
      if (index === total - 1) return `{rEdge|${value}}`;
      return String(value);
    },
  };
}

// ─── 공통 애니메이션 설정 ────────────────────────────────────

/** 애니메이션 비활성화 */
export const animationNone = { animation: false } as const;

/** 기본 애니메이션 (300ms cubicOut) */
export const animationDefault = {
  animation: true,
  animationDuration: 300,
  animationEasing: "cubicOut",
} as const;

/** 업데이트 포함 애니메이션 (MultiLineWithErrorBar용) */
export const animationWithUpdate = {
  ...animationDefault,
  animationDurationUpdate: 150,
} as const;

// ─── 공통 emphasis/blur 패턴 ────────────────────────────────

/** Scatter/SHAP focus emphasis — 시리즈 단위 포커스 */
export function focusEmphasis(opts?: { scale?: number; opacity?: number }) {
  const { scale = 1.4, opacity = 1 } = opts ?? {};
  return {
    emphasis: {
      focus: "series" as const,
      itemStyle: { opacity },
      scale,
    },
    blur: {
      itemStyle: { opacity: 0.08 },
    },
  };
}

/** 바 차트 호버 — emphasis 비활성화 후 수동 opacity 제어 */
export const barEmphasisDisabled = { emphasis: { disabled: true } } as const;

/**
 * 호버 인덱스 기반 바 데이터 opacity 적용
 * hoveredIdx와 일치하지 않는 인덱스는 dimOpacity로 흐리게
 */
export function applyBarHoverOpacity<T extends { value: number; itemStyle?: Record<string, any> }>(
  data: T[],
  hoveredIdx: number | null,
  dimOpacity = 0.6,
): (T | (T & { itemStyle: { opacity: number } }))[] {
  if (hoveredIdx === null) return data;
  return data.map((item, i) =>
    i === hoveredIdx
      ? item
      : { ...item, itemStyle: { ...item.itemStyle, opacity: dimOpacity } },
  );
}

// ─── 라인 그라디언트 (MultiLineWithErrorBar 호버) ───────────

/**
 * 수평 그라디언트 생성 — hoveredX 기준으로 중심부 강조, 양끝으로 갈수록 투명
 */
export function buildLineGradient(
  color: string,
  hoveredX: number | null,
  xMin: number,
  xMax: number,
  isActive: boolean,
): any {
  if (hoveredX === null) return color;
  const xRange = Math.max(xMax - xMin, 1);
  const center = (hoveredX - xMin) / xRange;
  const spread = isActive ? 0.38 : 0.18;
  const peakA = isActive ? 1 : 0.45;
  const baseA = isActive ? 0.4 : 0.06;
  const fs = Math.max(0, center - spread);
  const fe = Math.min(1, center + spread);
  const stops: { offset: number; color: string }[] = [];
  if (fs > 0.001) stops.push({ offset: 0, color: hexToRgba(color, baseA) });
  stops.push({ offset: fs, color: hexToRgba(color, baseA) });
  stops.push({ offset: center, color: hexToRgba(color, peakA) });
  stops.push({ offset: fe, color: hexToRgba(color, baseA) });
  if (fe < 0.999) stops.push({ offset: 1, color: hexToRgba(color, baseA) });
  return { type: "linear", x: 0, y: 0, x2: 1, y2: 0, colorStops: stops };
}

// ─── 공통 grid 프리셋 ───────────────────────────────────────

/** 소형 차트 grid (히스토그램, scatter 등) */
export const gridCompact = { left: 42, right: 4, top: 8, bottom: 16 } as const;

/** 중형 차트 grid (containLabel 포함) */
export const gridContained = {
  left: 12,
  right: 12,
  top: 0,
  bottom: 0,
  containLabel: true,
} as const;

/** 꽉 찬 grid (ComparisonBar, SingleBar 등) */
export const gridFull = { left: 0, right: 0, top: 0, bottom: 0 } as const;

/** tsi-report stacked variance grid */
export const gridStackedVariance = {
  left: 16,
  right: 6,
  top: 10,
  bottom: 24,
  containLabel: true,
} as const;

/** tsi-report variance by group grid */
export const gridVarianceByGroup = {
  left: 18,
  right: 6,
  top: 4,
  bottom: 0,
  containLabel: true,
} as const;

// ─── 공통 legend 스타일 ─────────────────────────────────────

/** legend 숨김 */
export const legendHidden = { show: false } as const;

/** tsi-report stacked variance legend */
export const legendBottom = {
  show: true,
  bottom: 0,
  itemWidth: 48,
  itemHeight: 14,
  itemGap: 24,
  icon: "roundRect",
  textStyle: {
    color: CHART_COLORS.NEUTRAL_50,
    fontSize: 9,
    fontFamily: CHART_FONT.familyShort,
  },
} as const;

// ─── 바 borderRadius 프리셋 ─────────────────────────────────

export const BAR_RADIUS = {
  /** 상단만 둥근 (히스토그램) */
  topSmall: [3, 3, 0, 0] as [number, number, number, number],
  /** 상단만 둥근 (ComparisonBar/SingleBar) */
  topMedium: [8, 8, 0, 0] as [number, number, number, number],
  /** 전체 둥근 — 6px (SubgroupProportion, MultiRankingBar) */
  allSmall: [6, 6, 6, 6] as [number, number, number, number],
  /** 전체 둥근 — 8px (VarianceByGroup) */
  allMedium: [8, 8, 8, 8] as [number, number, number, number],
  /** 전체 둥근 — 12px (StackedVariance) */
  allLarge: [12, 12, 12, 12] as [number, number, number, number],
} as const;
