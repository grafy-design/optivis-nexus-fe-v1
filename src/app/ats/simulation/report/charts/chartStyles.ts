/** 리포트 차트 공통 스타일 — chart-styles.ts 시맨틱 토큰 기반 */

import { CHART_COLORS, CHART_FONT, ATS_REPORT_COLORS } from "@/lib/chart-styles";

/** 차트 타이틀 스타일 — 패널 좌상단 고정 배치 */
export const CHART_TITLE = {
  left: 16,
  top: 8,
  textAlign: "left" as const,
  textStyle: {
    fontFamily: CHART_FONT.familyShort,
    fontSize: 12,
    fontWeight: "normal",
    color: CHART_COLORS.NEUTRAL_30,
  },
};

/**
 * 기본 그리드 설정.
 * right·top을 0%로 통일, containLabel:true로 라벨을 그리드 안에 포함.
 * (수정: right "3%"→"0%", top "60px"→"0%" — 여백 통일)
 */
export const CHART_GRID_DEFAULT = {
  left: "7%",
  right: "0%",
  top: "0%",
  bottom: "8%",
  containLabel: true,
};

/**
 * 축 라벨 스타일.
 * margin: 2로 축소하여 라벨과 축 사이 여백 최소화.
 * (수정: margin 4→2)
 */
export const CHART_AXIS_LABEL = {
  fontSize: 10,
  fontFamily: CHART_FONT.familyShort,
  fontWeight: 500,
  color: CHART_COLORS.NEUTRAL_50,
  margin: 4,
};

/** 축 이름 텍스트 스타일 — 축 중앙 배치용 nameTextStyle */
export const CHART_AXIS_NAME = {
  nameTextStyle: {
    fontSize: 10,
    fontFamily: CHART_FONT.familyShort,
    fontWeight: 500,
    color: CHART_COLORS.NEUTRAL_50,
  },
};

/** 축 선 스타일 — show: true, NEUTRAL_50 색상 */
export const CHART_AXIS_LINE = {
  show: true,
  lineStyle: { color: CHART_COLORS.NEUTRAL_50, width: 1 },
};

/** 축 틱 스타일 — 길이 2px */
export const CHART_AXIS_TICK = {
  show: true,
  length: 2,
};

/** Y축 틱 스타일 — show: true */
export const CHART_Y_AXIS_TICK = {
  show: true,
};

/** Y축 분할선 스타일 — 점선, ATS_REPORT_COLORS.splitLine 색상 */
export const CHART_Y_AXIS_SPLIT_LINE = {
  show: true,
  lineStyle: {
    type: "dashed" as const,
    color: ATS_REPORT_COLORS.splitLine,
  },
};

/** chartTitle 헬퍼 — CHART_TITLE에 텍스트 주입 */
export function chartTitle(text: string) {
  return { ...CHART_TITLE, text };
}

/** chartGraphicDivider 헬퍼 — 타이틀 아래 구분선 그래픽 생성 */
export function chartGraphicDivider(width = 320) {
  return [
    {
      type: "line" as const,
      left: 16,
      top: 30,
      shape: { x1: 0, y1: 0, x2: width, y2: 0 },
      style: { stroke: ATS_REPORT_COLORS.divider, lineWidth: 1 },
    },
  ];
}
