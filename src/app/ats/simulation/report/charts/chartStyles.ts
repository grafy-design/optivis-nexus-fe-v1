/** 리포트 차트 공통 스타일 — chart-styles.ts 시맨틱 토큰 기반 */

import { CHART_COLORS, CHART_FONT, ATS_REPORT_COLORS } from "@/lib/chart-styles";

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

export const CHART_GRID_DEFAULT = {
  left: "7%",
  right: "3%",
  top: "60px",
  bottom: "8%",
  containLabel: true,
};

export const CHART_AXIS_LABEL = {
  fontSize: 10.5,
  fontFamily: CHART_FONT.familyShort,
  fontWeight: "normal",
  color: CHART_COLORS.NEUTRAL_30,
};

export const CHART_AXIS_NAME = {
  nameTextStyle: {
    fontSize: 10.5,
    fontFamily: CHART_FONT.familyShort,
    fontWeight: "normal",
    color: CHART_COLORS.NEUTRAL_30,
  },
};

export const CHART_Y_AXIS_SPLIT_LINE = {
  show: true,
  lineStyle: {
    type: "dashed" as const,
    color: ATS_REPORT_COLORS.splitLine,
  },
};

export function chartTitle(text: string) {
  return { ...CHART_TITLE, text };
}

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
