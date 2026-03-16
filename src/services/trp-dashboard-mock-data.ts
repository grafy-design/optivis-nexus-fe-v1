import type { DrdNonResponderSectionViewModel } from "@/lib/drd-simulation-play-converter";
import { resolveTrpDrugCatalogEntry } from "@/lib/trp-drug-catalog";
import { getTrpSimulationSelectedOutcomeLabel } from "@/lib/trp-simulation-setting";
import type {
  TrpAnalysisRequest,
  TrpSimulationDrug,
  TrpTreatmentInfoForm,
} from "@/store/trp-setup-store";

export interface TrpPrimaryOutcomeRowViewModel {
  strategyLabel: string;
  strategyKey: string;
  meanText: string;
  ciText: string;
  medianText: string;
  nntText: string;
  nntWeek24Text: string;
}

export interface TrpResponseProbabilityCellViewModel {
  text: string;
  rawValue: number | null;
  color: string;
  highlight: boolean;
}

export interface TrpResponseProbabilityRowViewModel {
  category: string;
  strategyA: TrpResponseProbabilityCellViewModel;
  strategyB: TrpResponseProbabilityCellViewModel;
  strategyC: TrpResponseProbabilityCellViewModel;
}

export interface TrpTrajectorySeriesViewModel {
  strategyLabel: string;
  color: string;
  data: Array<number | null>;
}

export interface TrpTrajectoryTargetLineViewModel {
  value: number;
  label: string;
}

export interface TrpTrajectoryEventViewModel {
  month: number;
  label: string;
}

export interface TrpTrajectoryChartViewModel {
  xAxisName: string;
  xAxisValues: number[];
  series: TrpTrajectorySeriesViewModel[];
  yAxisName: string;
  targetLine: TrpTrajectoryTargetLineViewModel | null;
  verticalEvents: TrpTrajectoryEventViewModel[];
  emptyMessage: string;
}

export interface TrpCounterfactualSeriesViewModel {
  strategyLabel: string;
  color: string;
  counts: number[];
}

export interface TrpCounterfactualChartViewModel {
  bins: number[];
  series: TrpCounterfactualSeriesViewModel[];
  emptyMessage: string;
}

export interface TrpSafetyTradeoffPointViewModel {
  strategyLabel: string;
  color: string;
  xValue: number;
  yValue: number;
  symbolSize: number;
}

export interface TrpSafetyTradeoffChartViewModel {
  points: TrpSafetyTradeoffPointViewModel[];
  aeOptions: string[];
  pointsByAe: Record<string, TrpSafetyTradeoffPointViewModel[]>;
  xAxisName: string;
  yAxisName: string;
  emptyMessage: string;
}

export interface TrpAERiskSeriesSetViewModel {
  xAxisValues: number[];
  series: TrpTrajectorySeriesViewModel[];
}

export interface TrpAERiskChartViewModel {
  aeOptions: string[];
  seriesByAe: Record<string, TrpAERiskSeriesSetViewModel>;
  yAxisName: string;
  emptyMessage: string;
}

export interface TrpSimulationResultViewModel {
  primaryOutcomeHeaders: string[];
  primaryOutcomeFootnote: string;
  primaryOutcomeRows: TrpPrimaryOutcomeRowViewModel[];
  primaryOutcomeEmptyMessage: string;
  responseProbabilityRows: TrpResponseProbabilityRowViewModel[];
  responseProbabilityEmptyMessage: string;
  trajectoryChart: TrpTrajectoryChartViewModel;
  counterfactualChart: TrpCounterfactualChartViewModel;
  safetyTradeoffChart: TrpSafetyTradeoffChartViewModel;
  aeRiskChart: TrpAERiskChartViewModel;
}

const STRATEGY_A_COLOR = "#3a11d8";
const STRATEGY_B_COLOR = "#f06600";
const STRATEGY_C_COLOR = "#24c6c9";
const TABLE_BODY_COLOR = "#787776";
const MOCK_POPULATION = 440;
const DEFAULT_FOLLOW_UP_MONTHS = 12;

const STRATEGY_COLORS = [STRATEGY_A_COLOR, STRATEGY_B_COLOR, STRATEGY_C_COLOR] as const;
const STRATEGY_LABELS = ["Strategy A", "Strategy B", "Strategy C"] as const;
const STRATEGY_KEYS = ["A", "B", "C"] as const;
const AE_OPTIONS = ["Stroke", "Hypoglycemia", "HF", "CKD"] as const;
const TOOLTIP_BAR_COLOR_BY_TYPE: Record<string, string> = {
  "GLP-1 RA": "#F06600",
  Biguanide: "#C5C0FE",
  "SGLT2 inhibitors": "#C5C0FE",
  "Insulin-based": "#C5C0FE",
  Imported: "#C5C0FE",
};

// Used by src/app/trp/simulation-result/page.tsx Clinical Endpoint selector.
export const TRP_DASHBOARD_OUTCOME_OPTIONS = [
  "HbA1c",
  "eGFR",
  "Weight",
  "Complication (ex : eGFR slope)",
] as const;

export type TrpDashboardOutcomeOption = (typeof TRP_DASHBOARD_OUTCOME_OPTIONS)[number];

export type TrpDashboardPopulationSummaryItem = {
  label: string;
  value: string;
};

export type TrpAnalysisResponse = {
  generatedAt: string;
  outcomeOptions: TrpDashboardOutcomeOption[];
  defaultOutcome: TrpDashboardOutcomeOption;
  populationSummary: TrpDashboardPopulationSummaryItem[];
  summaryByOutcome: Record<TrpDashboardOutcomeOption, string>;
  strategyCardsByOutcome: Record<TrpDashboardOutcomeOption, TrpDashboardStrategyCard[]>;
  resultViewModelByOutcome: Record<TrpDashboardOutcomeOption, TrpSimulationResultViewModel>;
  nonResponderSectionByOutcome: Record<
    TrpDashboardOutcomeOption,
    DrdNonResponderSectionViewModel
  >;
};

export interface TrpDashboardTooltipItem {
  label: string;
  color: string;
  offsetFraction: number;
  widthFraction: number;
}

export interface TrpDashboardTooltipMetric {
  label: string;
  value: string;
  kind?: "rating" | "text";
}

// Used by src/app/trp/simulation-result/page.tsx StrategyCard tooltip rendering.
export interface TrpDashboardTooltipData {
  axisLabels: string[];
  groups: Array<{
    label: string;
    items: TrpDashboardTooltipItem[];
  }>;
  footerMetrics: TrpDashboardTooltipMetric[];
}

// Used by src/app/trp/simulation-result/page.tsx left-panel strategy cards.
export interface TrpDashboardStrategyCard {
  name: string;
  nameColor: string;
  summary?: string;
  drugs: string[];
  lineColor: string;
  keepCurrent: boolean;
  tooltipData: TrpDashboardTooltipData;
}

const TOOLTIP_AXIS_LABELS = ["0", "3", "6", "9", "12"] as const;
const TOOLTIP_BAR_ORANGE = "#F06600";
const TOOLTIP_BAR_LAVENDER = "#C5C0FE";

export function buildMockStrategyTooltipData(
  strategyIndex: number
): TrpDashboardTooltipData {
  const presets: TrpDashboardTooltipData[] = [
    {
      axisLabels: [...TOOLTIP_AXIS_LABELS],
      groups: [
        {
          label: "GLP-1 RA",
          items: [
            {
              label: "Semaglutide",
              color: TOOLTIP_BAR_ORANGE,
              offsetFraction: 0,
              widthFraction: 0.56,
            },
            {
              label: "Exenatide",
              color: TOOLTIP_BAR_ORANGE,
              offsetFraction: 0.28,
              widthFraction: 0.54,
            },
          ],
        },
        {
          label: "SGLT2 inhibitors",
          items: [
            {
              label: "Glipizide",
              color: TOOLTIP_BAR_LAVENDER,
              offsetFraction: 0.08,
              widthFraction: 0.92,
            },
          ],
        },
      ],
      footerMetrics: [
        { label: "Model confidence", value: "★★★★☆", kind: "rating" },
        { label: "Data completeness", value: "92%", kind: "text" },
        { label: "Median follow-up", value: "14.8months", kind: "text" },
      ],
    },
    {
      axisLabels: [...TOOLTIP_AXIS_LABELS],
      groups: [
        {
          label: "Biguanide",
          items: [
            {
              label: "Metformin",
              color: TOOLTIP_BAR_LAVENDER,
              offsetFraction: 0,
              widthFraction: 0.78,
            },
          ],
        },
        {
          label: "GLP-1 RA",
          items: [
            {
              label: "Liraglutide",
              color: TOOLTIP_BAR_ORANGE,
              offsetFraction: 0.16,
              widthFraction: 0.4,
            },
          ],
        },
        {
          label: "Insulin-based",
          items: [
            {
              label: "Basal insulin",
              color: TOOLTIP_BAR_LAVENDER,
              offsetFraction: 0.34,
              widthFraction: 0.44,
            },
          ],
        },
      ],
      footerMetrics: [
        { label: "Model confidence", value: "★★★☆☆", kind: "rating" },
        { label: "Data completeness", value: "87%", kind: "text" },
        { label: "Median follow-up", value: "12.6months", kind: "text" },
      ],
    },
    {
      axisLabels: [...TOOLTIP_AXIS_LABELS],
      groups: [
        {
          label: "SGLT2 inhibitors",
          items: [
            {
              label: "Empagliflozin",
              color: TOOLTIP_BAR_LAVENDER,
              offsetFraction: 0,
              widthFraction: 0.42,
            },
          ],
        },
        {
          label: "GLP-1 RA",
          items: [
            {
              label: "Semaglutide",
              color: TOOLTIP_BAR_ORANGE,
              offsetFraction: 0.22,
              widthFraction: 0.52,
            },
          ],
        },
        {
          label: "Insulin-based",
          items: [
            {
              label: "Basal insulin",
              color: TOOLTIP_BAR_LAVENDER,
              offsetFraction: 0.12,
              widthFraction: 0.74,
            },
          ],
        },
      ],
      footerMetrics: [
        { label: "Model confidence", value: "★★★★★", kind: "rating" },
        { label: "Data completeness", value: "95%", kind: "text" },
        { label: "Median follow-up", value: "16.1months", kind: "text" },
      ],
    },
  ];

  return presets[strategyIndex] ?? presets[0];
}

type OutcomePrimaryStat = {
  mean: number;
  ciLow: number;
  ciHigh: number;
  median: number;
  nnt: number;
  week24: number;
  week24CiLow: number;
  week24CiHigh: number;
};

type OutcomeProfile = {
  valueSuffix: string;
  fractionDigits: number;
  xAxisName: string;
  yAxisName: string;
  primaryOutcomeFootnote: string;
  primaryStats: [OutcomePrimaryStat, OutcomePrimaryStat, OutcomePrimaryStat];
  responseRows: Array<{
    category: string;
    rates: [number, number, number];
  }>;
  trajectorySeries: [number[], number[], number[]];
  counterfactualBins: number[];
  counterfactualSeries: [number[], number[], number[]];
  safetyAxisName: string;
  safetyBasePoints: Array<{
    xValue: number;
    yValue: number;
    symbolSize: number;
  }>;
  aeRiskBaseSeries: [number[], number[], number[]];
  summaryInterpretation: string;
  nonResponderConditions: [string[], string[], string[]];
};

const OUTCOME_PROFILES: Record<TrpDashboardOutcomeOption, OutcomeProfile> = {
  HbA1c: {
    valueSuffix: "%",
    fractionDigits: 1,
    xAxisName: "Time since analysis start (Months)",
    yAxisName: "Reduction in HbA1c",
    primaryOutcomeFootnote: "*Week 24 response rate for HbA1c control (< 7.0%).",
    primaryStats: [
      {
        mean: -1.1,
        ciLow: -1.3,
        ciHigh: -0.9,
        median: -1.0,
        nnt: 6.2,
        week24: 48,
        week24CiLow: 44,
        week24CiHigh: 52,
      },
      {
        mean: -0.6,
        ciLow: -0.8,
        ciHigh: -0.4,
        median: -0.5,
        nnt: 11.4,
        week24: 26,
        week24CiLow: 22,
        week24CiHigh: 30,
      },
      {
        mean: -0.8,
        ciLow: -1.0,
        ciHigh: -0.6,
        median: -0.7,
        nnt: 8.4,
        week24: 36,
        week24CiLow: 31,
        week24CiHigh: 40,
      },
    ],
    responseRows: [
      { category: "Strong responder", rates: [32, 25, 28] },
      { category: "Partial responder", rates: [21, 28, 26] },
      { category: "Non responder", rates: [18, 37, 31] },
      { category: "Deteriorator", rates: [6, 10, 8] },
    ],
    trajectorySeries: [
      [0, -0.3, -0.8, -1.2, -1.6],
      [0, -0.2, -0.5, -0.8, -1.0],
      [0, -0.2, -0.6, -0.9, -1.3],
    ],
    counterfactualBins: [-2.0, -1.5, -1.0, -0.5, 0.0, 0.5, 1.0],
    counterfactualSeries: [
      [2, 18, 54, 72, 28, 8, 2],
      [0, 9, 34, 58, 44, 16, 4],
      [1, 14, 42, 62, 35, 12, 3],
    ],
    safetyAxisName: "HbA1c reduction (%)",
    safetyBasePoints: [
      { xValue: 1.1, yValue: 2.8, symbolSize: 44 },
      { xValue: 0.6, yValue: 4.6, symbolSize: 50 },
      { xValue: 0.8, yValue: 3.5, symbolSize: 40 },
    ],
    aeRiskBaseSeries: [
      [0, 0.5, 1.2, 2.1, 3.0, 4.0, 4.8],
      [0, 0.8, 1.8, 3.0, 4.4, 5.5, 6.3],
      [0, 0.4, 1.0, 1.8, 2.7, 3.5, 4.2],
    ],
    summaryInterpretation:
      "Strategy A projects the fastest glycemic reduction, while Strategy C remains the most balanced option once AE burden is considered.",
    nonResponderConditions: [
      ["DM duration > 7y", "Baseline HbA1c > 8.5%", "CKD stage >= 3"],
      ["Low persistence proxy", "Age > 70", "History of CAD"],
      ["Weight gain trend", "Long insulin exposure", "Albuminuria A2 or higher"],
    ],
  },
  eGFR: {
    valueSuffix: "",
    fractionDigits: 1,
    xAxisName: "Time since analysis start (Months)",
    yAxisName: "Increase in eGFR",
    primaryOutcomeFootnote: "*Week 24 response rate for eGFR gain (> 3 mL/min/1.73m2).",
    primaryStats: [
      {
        mean: 4.8,
        ciLow: 3.6,
        ciHigh: 6.2,
        median: 4.3,
        nnt: 7.1,
        week24: 42,
        week24CiLow: 38,
        week24CiHigh: 46,
      },
      {
        mean: 2.6,
        ciLow: 1.2,
        ciHigh: 4.1,
        median: 2.1,
        nnt: 13.2,
        week24: 24,
        week24CiLow: 20,
        week24CiHigh: 28,
      },
      {
        mean: 3.9,
        ciLow: 2.8,
        ciHigh: 5.1,
        median: 3.4,
        nnt: 8.9,
        week24: 35,
        week24CiLow: 31,
        week24CiHigh: 39,
      },
    ],
    responseRows: [
      { category: "Strong responder", rates: [29, 22, 27] },
      { category: "Partial responder", rates: [24, 31, 28] },
      { category: "Non responder", rates: [19, 35, 29] },
      { category: "Deteriorator", rates: [8, 12, 9] },
    ],
    trajectorySeries: [
      [0, 1.2, 2.6, 3.7, 4.8],
      [0, 0.6, 1.2, 2.0, 2.6],
      [0, 1.0, 2.1, 3.1, 3.9],
    ],
    counterfactualBins: [-2, 0, 2, 4, 6, 8, 10],
    counterfactualSeries: [
      [6, 20, 38, 62, 54, 28, 10],
      [14, 30, 52, 44, 22, 8, 2],
      [9, 24, 42, 58, 40, 18, 6],
    ],
    safetyAxisName: "eGFR gain",
    safetyBasePoints: [
      { xValue: 4.8, yValue: 2.4, symbolSize: 46 },
      { xValue: 2.6, yValue: 4.1, symbolSize: 50 },
      { xValue: 3.9, yValue: 3.2, symbolSize: 42 },
    ],
    aeRiskBaseSeries: [
      [0, 0.4, 1.0, 1.9, 2.7, 3.5, 4.2],
      [0, 0.7, 1.6, 2.9, 4.1, 5.0, 5.9],
      [0, 0.5, 1.2, 2.1, 3.0, 3.8, 4.6],
    ],
    summaryInterpretation:
      "Strategy A sustains the largest renal gain, while Strategy C preserves most of the benefit with a lower AE slope than Strategy B.",
    nonResponderConditions: [
      ["Baseline eGFR < 45", "UACR > 300", "Heart failure history"],
      ["Older age", "Low persistence proxy", "Long DM duration"],
      ["Albuminuria A3", "Prior switch history", "Concurrent CKD"],
    ],
  },
  Weight: {
    valueSuffix: " kg",
    fractionDigits: 1,
    xAxisName: "Time since analysis start (Months)",
    yAxisName: "Reduction in body weight",
    primaryOutcomeFootnote: "*Week 24 response rate for > 5% body-weight reduction.",
    primaryStats: [
      {
        mean: -5.8,
        ciLow: -6.7,
        ciHigh: -4.9,
        median: -5.4,
        nnt: 5.6,
        week24: 52,
        week24CiLow: 48,
        week24CiHigh: 56,
      },
      {
        mean: -3.4,
        ciLow: -4.3,
        ciHigh: -2.5,
        median: -3.1,
        nnt: 9.8,
        week24: 31,
        week24CiLow: 27,
        week24CiHigh: 35,
      },
      {
        mean: -4.6,
        ciLow: -5.4,
        ciHigh: -3.8,
        median: -4.2,
        nnt: 7.0,
        week24: 41,
        week24CiLow: 37,
        week24CiHigh: 45,
      },
    ],
    responseRows: [
      { category: "Strong responder", rates: [34, 26, 31] },
      { category: "Partial responder", rates: [23, 29, 27] },
      { category: "Non responder", rates: [15, 33, 25] },
      { category: "Deteriorator", rates: [5, 9, 7] },
    ],
    trajectorySeries: [
      [0, -1.3, -2.9, -4.3, -5.8],
      [0, -0.8, -1.6, -2.5, -3.4],
      [0, -1.0, -2.3, -3.5, -4.6],
    ],
    counterfactualBins: [-8, -6, -4, -2, 0, 2, 4],
    counterfactualSeries: [
      [8, 34, 66, 58, 18, 6, 1],
      [4, 20, 49, 63, 34, 10, 2],
      [6, 28, 58, 60, 24, 8, 2],
    ],
    safetyAxisName: "Weight reduction (kg)",
    safetyBasePoints: [
      { xValue: 5.8, yValue: 2.7, symbolSize: 48 },
      { xValue: 3.4, yValue: 4.0, symbolSize: 50 },
      { xValue: 4.6, yValue: 3.1, symbolSize: 42 },
    ],
    aeRiskBaseSeries: [
      [0, 0.5, 1.1, 2.0, 2.8, 3.7, 4.4],
      [0, 0.8, 1.7, 2.8, 3.9, 4.8, 5.6],
      [0, 0.6, 1.3, 2.2, 3.1, 3.9, 4.7],
    ],
    summaryInterpretation:
      "Strategy A drives the largest mock weight reduction, while Strategy C keeps a competitive benefit with a more moderate safety trade-off.",
    nonResponderConditions: [
      ["Baseline BMI > 33", "Sedentary trend", "Insulin-based regimen"],
      ["Older age", "Low persistence proxy", "Prior switch history"],
      ["Weight gain trend", "Heart failure history", "Albuminuria A2 or higher"],
    ],
  },
  "Complication (ex : eGFR slope)": {
    valueSuffix: "",
    fractionDigits: 2,
    xAxisName: "Time since analysis start (Months)",
    yAxisName: "Reduction in complication slope",
    primaryOutcomeFootnote: "*Week 24 response rate for favorable complication-slope change.",
    primaryStats: [
      {
        mean: -0.34,
        ciLow: -0.42,
        ciHigh: -0.27,
        median: -0.31,
        nnt: 7.8,
        week24: 39,
        week24CiLow: 35,
        week24CiHigh: 43,
      },
      {
        mean: -0.18,
        ciLow: -0.25,
        ciHigh: -0.11,
        median: -0.15,
        nnt: 14.6,
        week24: 22,
        week24CiLow: 18,
        week24CiHigh: 26,
      },
      {
        mean: -0.27,
        ciLow: -0.34,
        ciHigh: -0.20,
        median: -0.24,
        nnt: 10.2,
        week24: 31,
        week24CiLow: 27,
        week24CiHigh: 35,
      },
    ],
    responseRows: [
      { category: "Strong responder", rates: [30, 22, 27] },
      { category: "Partial responder", rates: [25, 30, 29] },
      { category: "Non responder", rates: [20, 36, 30] },
      { category: "Deteriorator", rates: [7, 11, 9] },
    ],
    trajectorySeries: [
      [0, -0.08, -0.17, -0.26, -0.34],
      [0, -0.04, -0.09, -0.13, -0.18],
      [0, -0.06, -0.13, -0.20, -0.27],
    ],
    counterfactualBins: [-0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6],
    counterfactualSeries: [
      [4, 18, 49, 61, 24, 9, 2],
      [2, 10, 32, 56, 39, 16, 4],
      [3, 14, 42, 58, 31, 11, 3],
    ],
    safetyAxisName: "Complication reduction score",
    safetyBasePoints: [
      { xValue: 0.34, yValue: 2.5, symbolSize: 45 },
      { xValue: 0.18, yValue: 4.3, symbolSize: 50 },
      { xValue: 0.27, yValue: 3.2, symbolSize: 41 },
    ],
    aeRiskBaseSeries: [
      [0, 0.5, 1.2, 2.0, 2.9, 3.7, 4.5],
      [0, 0.8, 1.8, 3.0, 4.2, 5.1, 6.0],
      [0, 0.6, 1.4, 2.3, 3.2, 4.0, 4.8],
    ],
    summaryInterpretation:
      "Strategy A yields the strongest complication-slope improvement in the mock bundle, while Strategy C retains a steadier safety profile than Strategy B.",
    nonResponderConditions: [
      ["Existing CKD", "Long DM duration", "Albuminuria A3"],
      ["History of CAD", "Older age", "Low persistence proxy"],
      ["Baseline eGFR decline", "Insulin-based regimen", "Hypertension history"],
    ],
  },
};

type SafetyAeOffsets = {
  xValue: number;
  yValue: number;
};

const SAFETY_AE_OFFSETS: Record<(typeof AE_OPTIONS)[number], SafetyAeOffsets> = {
  Stroke: { xValue: 0, yValue: 0.8 },
  Hypoglycemia: { xValue: 0, yValue: 1.6 },
  HF: { xValue: -0.1, yValue: 0.4 },
  CKD: { xValue: -0.05, yValue: 0.2 },
};

const AE_RISK_OFFSETS: Record<(typeof AE_OPTIONS)[number], number> = {
  Stroke: 0.4,
  Hypoglycemia: 1.1,
  HF: 0.2,
  CKD: 0.6,
};

const createResponseCell = (
  rate: number,
  population = MOCK_POPULATION
): TrpResponseProbabilityCellViewModel => ({
  text: `${rate}% (${Math.round((population * rate) / 100)})`,
  rawValue: rate,
  color: TABLE_BODY_COLOR,
  highlight: false,
});

const createResponseRow = (
  category: string,
  rates: [number, number, number]
): TrpResponseProbabilityRowViewModel => ({
  category,
  strategyA: createResponseCell(rates[0]),
  strategyB: createResponseCell(rates[1]),
  strategyC: createResponseCell(rates[2]),
});

const createAeSeriesSet = (
  strategyA: number[],
  strategyB: number[],
  strategyC: number[]
): TrpAERiskSeriesSetViewModel => ({
  xAxisValues: [0, 2, 4, 6, 8, 10, 12],
  series: [
    {
      strategyLabel: "Strategy A",
      color: STRATEGY_A_COLOR,
      data: strategyA,
    },
    {
      strategyLabel: "Strategy B",
      color: STRATEGY_B_COLOR,
      data: strategyB,
    },
    {
      strategyLabel: "Strategy C",
      color: STRATEGY_C_COLOR,
      data: strategyC,
    },
  ],
});

function formatSignedMetric(value: number, fractionDigits: number, suffix: string) {
  const formatted = value.toFixed(fractionDigits);
  const signed = value > 0 ? `+${formatted}` : formatted;
  return `${signed}${suffix}`;
}

function buildPrimaryOutcomeRows(profile: OutcomeProfile): TrpPrimaryOutcomeRowViewModel[] {
  return profile.primaryStats.map((stat, index) => ({
    strategyLabel: STRATEGY_LABELS[index],
    strategyKey: STRATEGY_KEYS[index],
    meanText: formatSignedMetric(stat.mean, profile.fractionDigits, profile.valueSuffix),
    ciText: `(${formatSignedMetric(stat.ciLow, profile.fractionDigits, profile.valueSuffix)}, ${formatSignedMetric(stat.ciHigh, profile.fractionDigits, profile.valueSuffix)})`,
    medianText: formatSignedMetric(stat.median, profile.fractionDigits, profile.valueSuffix),
    nntText: stat.nnt.toFixed(1),
    nntWeek24Text: `${stat.week24}% (CI ${stat.week24CiLow}~${stat.week24CiHigh}%)`,
  }));
}

function buildAeRiskSeries(profile: OutcomeProfile) {
  return Object.fromEntries(
    AE_OPTIONS.map((option) => [
      option,
      createAeSeriesSet(
        profile.aeRiskBaseSeries[0].map((value) => Number((value + AE_RISK_OFFSETS[option]).toFixed(1))),
        profile.aeRiskBaseSeries[1].map((value) => Number((value + AE_RISK_OFFSETS[option] + 0.2).toFixed(1))),
        profile.aeRiskBaseSeries[2].map((value) => Number((value + AE_RISK_OFFSETS[option] - 0.1).toFixed(1)))
      ),
    ])
  ) as Record<string, TrpAERiskSeriesSetViewModel>;
}

function buildSafetyTradeoffPoints(
  profile: OutcomeProfile
): TrpSafetyTradeoffChartViewModel["points"] {
  return profile.safetyBasePoints.map((point, index) => ({
    strategyLabel: STRATEGY_LABELS[index],
    color: STRATEGY_COLORS[index],
    xValue: point.xValue,
    yValue: point.yValue,
    symbolSize: point.symbolSize,
  }));
}

function clampFraction(value: number) {
  return Math.max(0, Math.min(1, value));
}

function formatMonthLabel(value: number) {
  const rounded = Number(value.toFixed(1));
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function buildTooltipAxisLabels(followUpMonths: number) {
  const safeFollowUpMonths = followUpMonths > 0 ? followUpMonths : DEFAULT_FOLLOW_UP_MONTHS;
  return [0, 0.25, 0.5, 0.75, 1].map((ratio) => formatMonthLabel(safeFollowUpMonths * ratio));
}

function formatTimelineRange(startMonth: number, endMonth: number) {
  return `${formatMonthLabel(startMonth)}-${formatMonthLabel(endMonth)}m`;
}

function buildTooltipGroupsFromDrugs(
  drugs: Array<{
    type: string;
    name: string;
    startMonth: number;
    endMonth: number;
  }>,
  followUpMonths: number
) {
  const safeFollowUpMonths = followUpMonths > 0 ? followUpMonths : DEFAULT_FOLLOW_UP_MONTHS;
  const grouped = new Map<string, TrpDashboardTooltipItem[]>();

  drugs.forEach((drug) => {
    const bucket = grouped.get(drug.type) ?? [];
    const slotDuration = Math.max(drug.endMonth - drug.startMonth, safeFollowUpMonths / 12);
    bucket.push({
      label: `${drug.name} (${formatTimelineRange(drug.startMonth, drug.endMonth)})`,
      color: TOOLTIP_BAR_COLOR_BY_TYPE[drug.type] ?? STRATEGY_A_COLOR,
      offsetFraction: clampFraction(drug.startMonth / safeFollowUpMonths),
      widthFraction: clampFraction(slotDuration / safeFollowUpMonths),
    });
    grouped.set(drug.type, bucket);
  });

  return Array.from(grouped.entries()).map(([label, items]) => ({
    label,
    items,
  }));
}

function getTreatmentDrugNames(form: TrpTreatmentInfoForm) {
  const names = [...form.hypoglycemicAgentDrugs, ...form.insulinBasedDrugs];
  return names.length > 0 ? names : ["Current regimen not specified"];
}

function formatTreatmentRegimen(form: TrpTreatmentInfoForm) {
  return getTreatmentDrugNames(form).join(", ");
}

function buildTooltipFooterMetrics(
  followUpMonths: number,
  strategyIndex: number
): TrpDashboardTooltipMetric[] {
  const safeFollowUpMonths = followUpMonths > 0 ? followUpMonths : DEFAULT_FOLLOW_UP_MONTHS;
  const dataCompleteness = Math.max(88, 92 - strategyIndex);
  const medianFollowUp = (safeFollowUpMonths + 2.8 - strategyIndex * 0.2).toFixed(1);

  return [
    {
      label: "Model confidence",
      value: "★★★★★",
      kind: "rating",
    },
    {
      label: "Data completeness",
      value: `${dataCompleteness}%`,
      kind: "text",
    },
    {
      label: "Median follow-up",
      value: `${medianFollowUp}months`,
      kind: "text",
    },
  ];
}

function getFallbackStrategyDrugs(
  form: TrpTreatmentInfoForm,
  followUpMonths: number,
  strategyIndex: number
) {
  const safeFollowUpMonths = followUpMonths > 0 ? followUpMonths : DEFAULT_FOLLOW_UP_MONTHS;
  const drugs = getTreatmentDrugNames(form).map((name) => ({
    type: resolveTrpDrugCatalogEntry(name)?.type ?? "Current regimen",
    name,
    startMonth: 0,
    endMonth: safeFollowUpMonths,
  }));

  return {
    names: drugs.map((drug) => drug.name),
    tooltipData: {
      axisLabels: buildTooltipAxisLabels(safeFollowUpMonths),
      groups: buildTooltipGroupsFromDrugs(drugs, safeFollowUpMonths),
      footerMetrics: buildTooltipFooterMetrics(safeFollowUpMonths, strategyIndex),
    } satisfies TrpDashboardTooltipData,
  };
}

function getAssignedStrategyDrugs(
  drugList: readonly TrpSimulationDrug[],
  strategyIndex: number,
  followUpMonths: number
) {
  const safeFollowUpMonths = followUpMonths > 0 ? followUpMonths : DEFAULT_FOLLOW_UP_MONTHS;
  const assigned = drugList
    .filter((drug) => drug.checks[strategyIndex])
    .map((drug) => {
      const slot = drug.timelineSlots[strategyIndex];
      return {
        type: drug.type,
        name: drug.name,
        startMonth: slot?.startMonth ?? 0,
        endMonth: slot?.endMonth ?? safeFollowUpMonths,
      };
    });

  return {
    names: assigned.map((drug) => drug.name),
    tooltipData: {
      axisLabels: buildTooltipAxisLabels(safeFollowUpMonths),
      groups: buildTooltipGroupsFromDrugs(assigned, safeFollowUpMonths),
      footerMetrics: buildTooltipFooterMetrics(safeFollowUpMonths, strategyIndex),
    } satisfies TrpDashboardTooltipData,
  };
}

function formatStrategySummary(
  outcomeKey: TrpDashboardOutcomeOption,
  request: TrpAnalysisRequest,
  strategyIndex: number
) {
  const strategy = request.simulationSetting.strategies[strategyIndex];
  const targetConfig = request.simulationSetting.targetConfigs[strategyIndex];
  const summaryParts: string[] = [outcomeKey];

  if (targetConfig?.label) {
    const valueLabel = targetConfig.value.trim()
      ? ` ${targetConfig.value.trim()}${targetConfig.unit}`
      : "";
    summaryParts.push(`${targetConfig.label}${valueLabel}`);
  }

  if (targetConfig?.months.trim()) {
    summaryParts.push(`${targetConfig.months.trim()} Months`);
  }

  summaryParts.push(strategy?.keepCurrent ? "Keep current" : "Adjust regimen");
  return summaryParts.join(" / ");
}

function normalizeOutcomeLabel(label: string): TrpDashboardOutcomeOption | null {
  if (
    TRP_DASHBOARD_OUTCOME_OPTIONS.includes(label as TrpDashboardOutcomeOption)
  ) {
    return label as TrpDashboardOutcomeOption;
  }

  const normalized = label.trim().toLowerCase();

  if (normalized === "egfr") {
    return "eGFR";
  }

  if (normalized === "weight" || normalized === "bmi") {
    return "Weight";
  }

  if (normalized.includes("complication")) {
    return "Complication (ex : eGFR slope)";
  }

  return null;
}

function resolveOutcomeFallbackByDisease(_disease: string) {
  return "HbA1c" as const;
}

// Used by src/app/trp/simulation-result/page.tsx default Clinical Endpoint selection.
export function resolveTrpDashboardOutcome(
  request: Pick<TrpAnalysisRequest, "patientDiseaseInfo" | "simulationSetting"> | null
) {
  if (!request) {
    return "HbA1c" as const;
  }

  if (request.simulationSetting.selectedValue !== null) {
    const requestedOutcome = getTrpSimulationSelectedOutcomeLabel(
      request.simulationSetting.selectedValue
    );
    const resolvedOutcome = normalizeOutcomeLabel(requestedOutcome);

    if (resolvedOutcome) {
      return resolvedOutcome;
    }
  }

  return resolveOutcomeFallbackByDisease(request.patientDiseaseInfo.disease);
}

// Used by src/app/trp/simulation-result/page.tsx efficacy/ae-risk view bundle.
export function buildTrpResultViewModel(
  outcomeKey: TrpDashboardOutcomeOption
): TrpSimulationResultViewModel {
  const profile = OUTCOME_PROFILES[outcomeKey];

  return {
    primaryOutcomeHeaders: ["Strategy", "Mean", "95% CI", "Median", "NNT*", "NNT at Week 24"],
    primaryOutcomeFootnote: profile.primaryOutcomeFootnote,
    primaryOutcomeRows: buildPrimaryOutcomeRows(profile),
    primaryOutcomeEmptyMessage: "",
    responseProbabilityRows: profile.responseRows.map((row) =>
      createResponseRow(row.category, row.rates)
    ),
    responseProbabilityEmptyMessage: "",
    trajectoryChart: {
      xAxisName: profile.xAxisName,
      xAxisValues: [0, 3, 6, 9, 12],
      series: profile.trajectorySeries.map((series, index) => ({
        strategyLabel: STRATEGY_LABELS[index],
        color: STRATEGY_COLORS[index],
        data: series,
      })),
      yAxisName: profile.yAxisName,
      targetLine: null,
      verticalEvents: [],
      emptyMessage: "",
    },
    counterfactualChart: {
      bins: profile.counterfactualBins,
      series: profile.counterfactualSeries.map((counts, index) => ({
        strategyLabel: STRATEGY_LABELS[index],
        color: STRATEGY_COLORS[index],
        counts,
      })),
      emptyMessage: "",
    },
    safetyTradeoffChart: {
      points: buildSafetyTradeoffPoints(profile),
      aeOptions: [...AE_OPTIONS],
      pointsByAe: Object.fromEntries(
        AE_OPTIONS.map((option) => [
          option,
          buildSafetyTradeoffPoints(profile).map((point) => ({
            ...point,
            xValue: Number((point.xValue + SAFETY_AE_OFFSETS[option].xValue).toFixed(2)),
            yValue: Number((point.yValue + SAFETY_AE_OFFSETS[option].yValue).toFixed(1)),
          })),
        ])
      ),
      xAxisName: profile.safetyAxisName,
      yAxisName: "AE probability (%)",
      emptyMessage: "",
    },
    aeRiskChart: {
      aeOptions: [...AE_OPTIONS],
      seriesByAe: buildAeRiskSeries(profile),
      yAxisName: "AE probability (%)",
      emptyMessage: "",
    },
  } satisfies TrpSimulationResultViewModel;
}

// Used by src/app/trp/simulation-result/page.tsx right-panel summary paragraph.
export function buildTrpResultSummary(
  request: TrpAnalysisRequest | null,
  outcomeKey: TrpDashboardOutcomeOption
) {
  const profile = OUTCOME_PROFILES[outcomeKey];

  if (!request) {
    return `Mock ${outcomeKey} analysis summary is unavailable.`;
  }

  const diseaseLabel =
    request.patientDiseaseInfo.disease ||
    request.selectedPatient?.primaryCondition ||
    "diabetes";
  const subjectLabel =
    request.selectedPatient?.patientId ??
    request.selectedPatient?.dataName ??
    "manual input";
  const regimenLabel = formatTreatmentRegimen(request.treatmentInfo);

  return `Mock analysis for ${subjectLabel} with ${diseaseLabel.toLowerCase()} was simulated over ${request.simulationSetting.followUpMonths} months. The current regimen is ${regimenLabel}. For ${outcomeKey}, ${profile.summaryInterpretation}`;
}

// Used by src/app/trp/simulation-result/page.tsx left-panel strategy cards.
export function buildTrpResultStrategies(
  request: TrpAnalysisRequest | null,
  outcomeKey: TrpDashboardOutcomeOption
) {
  if (!request) {
    return [] as TrpDashboardStrategyCard[];
  }

  return request.simulationSetting.strategies.map((strategy, index) => {
    const assignedDrugs = getAssignedStrategyDrugs(
      request.simulationSetting.drugList,
      index,
      request.simulationSetting.followUpMonths
    );
    const fallbackDrugs = getFallbackStrategyDrugs(
      request.treatmentInfo,
      request.simulationSetting.followUpMonths,
      index
    );
    const hasAssignedDrugs = assignedDrugs.names.length > 0;

    return {
      name: strategy.title,
      nameColor: strategy.color,
      summary: formatStrategySummary(outcomeKey, request, index),
      drugs: hasAssignedDrugs ? assignedDrugs.names : fallbackDrugs.names,
      lineColor: strategy.color,
      keepCurrent: strategy.keepCurrent,
      tooltipData: buildMockStrategyTooltipData(index),
    } satisfies TrpDashboardStrategyCard;
  });
}

// Used by src/app/trp/simulation-result/page.tsx left-panel population block.
export function buildTrpPopulationSummary(
  request: TrpAnalysisRequest | null
): TrpDashboardPopulationSummaryItem[] {
  return [
    {
      label: "Population",
      value: `N=${MOCK_POPULATION}`,
    },
    {
      label: "Follow-up",
      value: `${request?.simulationSetting.followUpMonths ?? DEFAULT_FOLLOW_UP_MONTHS} months`,
    },
  ];
}

// Used by src/app/trp/simulation-result/page.tsx AE risk non-responder section.
export function buildTrpNonResponderSection(
  outcomeKey: TrpDashboardOutcomeOption
): DrdNonResponderSectionViewModel {
  const profile = OUTCOME_PROFILES[outcomeKey];

  return {
    title: "Non responder Identification",
    description:
      "Top contributing factors ranked by impact score, where higher scores indicate stronger contribution to non-response.",
    strategies: profile.nonResponderConditions.map((conditions, index) => ({
      strategyName: STRATEGY_LABELS[index],
      features: conditions.map((condition, featureIndex) => ({
        rank: String(featureIndex + 1),
        condition,
        score: (0.36 - featureIndex * 0.07 - index * 0.01).toFixed(2),
      })),
    })),
  };
}

// Used by src/services/trp-analysis-mock-service.ts to build the mock API payload.
export function buildTrpAnalysisResponse(
  request: TrpAnalysisRequest
): TrpAnalysisResponse {
  const outcomeOptions = [...TRP_DASHBOARD_OUTCOME_OPTIONS];
  const defaultOutcome = resolveTrpDashboardOutcome(request);

  return {
    generatedAt: request.requestedAt,
    outcomeOptions,
    defaultOutcome,
    populationSummary: buildTrpPopulationSummary(request),
    summaryByOutcome: Object.fromEntries(
      outcomeOptions.map((outcome) => [outcome, buildTrpResultSummary(request, outcome)])
    ) as Record<TrpDashboardOutcomeOption, string>,
    strategyCardsByOutcome: Object.fromEntries(
      outcomeOptions.map((outcome) => [outcome, buildTrpResultStrategies(request, outcome)])
    ) as Record<TrpDashboardOutcomeOption, TrpDashboardStrategyCard[]>,
    resultViewModelByOutcome: Object.fromEntries(
      outcomeOptions.map((outcome) => [outcome, buildTrpResultViewModel(outcome)])
    ) as Record<TrpDashboardOutcomeOption, TrpSimulationResultViewModel>,
    nonResponderSectionByOutcome: Object.fromEntries(
      outcomeOptions.map((outcome) => [outcome, buildTrpNonResponderSection(outcome)])
    ) as Record<TrpDashboardOutcomeOption, DrdNonResponderSectionViewModel>,
  };
}
