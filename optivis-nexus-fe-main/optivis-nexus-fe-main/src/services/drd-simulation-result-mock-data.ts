import type { DrdNonResponderSectionViewModel } from "@/lib/drd-simulation-play-converter";
import type {
  DrdAERiskChartViewModel,
  DrdResponseProbabilityCellViewModel,
  DrdSimulationResultViewModel,
} from "@/lib/drd-simulation-result-mapper";

const STRATEGY_A_COLOR = "#3a11d8";
const STRATEGY_B_COLOR = "#f06600";
const STRATEGY_C_COLOR = "#24c6c9";
const TABLE_BODY_COLOR = "#787776";

const buildBins = (start: number, step: number, count: number): number[] =>
  Array.from({ length: count }, (_, index) =>
    Number((start + step * index).toFixed(1))
  );

const createResponseCell = (
  text: string,
  rawValue: number,
  color: string,
  highlight: boolean
): DrdResponseProbabilityCellViewModel => ({
  text,
  rawValue,
  color,
  highlight,
});

const createAeSeriesSet = (
  strategyA: number[],
  strategyB: number[],
  strategyC: number[]
): DrdAERiskChartViewModel["seriesByAe"][string] => ({
  xAxisValues: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
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

export interface DrdSimulationMockStrategy {
  name: string;
  nameColor: string;
  target: string;
  drugs: string[];
  extraDrug?: string;
  lineColor: string;
  tooltipData: {
    groups: Array<{
      label: string;
      items: string[];
      color: string;
    }>;
  };
}

export const DRD_SIMULATION_RESULT_USE_MOCK = true;

export const DRD_SIMULATION_RESULT_MOCK_STRATEGIES: DrdSimulationMockStrategy[] = [
  {
    name: "Strategy A",
    nameColor: STRATEGY_A_COLOR,
    target: "HbA1c / Increase 10% / 3 Months",
    drugs: ["Basal insulin", "SGLT2 inhibitors"],
    extraDrug: "Dapagliflozin, Empagliflozin",
    lineColor: STRATEGY_A_COLOR,
    tooltipData: {
      groups: [
        { label: "GLP-1 RA", items: ["Semaglutide", "Exenatide"], color: STRATEGY_B_COLOR },
        { label: "SGLT2 inhibitors", items: ["Glipizide"], color: "#c5c0fe" },
      ],
    },
  },
  {
    name: "Strategy B",
    nameColor: STRATEGY_B_COLOR,
    target: "HbA1c / Stable 0% / 6 Months",
    drugs: ["Basal insulin", "Metformin"],
    lineColor: STRATEGY_B_COLOR,
    tooltipData: {
      groups: [
        { label: "GLP-1 RA", items: ["Semaglutide"], color: STRATEGY_B_COLOR },
        { label: "Biguanide", items: ["Metformin"], color: "#c5c0fe" },
      ],
    },
  },
  {
    name: "Strategy C",
    nameColor: STRATEGY_C_COLOR,
    target: "HbA1c / Decrease -10% / 6 Months",
    drugs: ["Basal insulin", "SGLT2 inhibitors"],
    extraDrug: "Dapagliflozin",
    lineColor: STRATEGY_C_COLOR,
    tooltipData: {
      groups: [
        { label: "GLP-1 RA", items: ["Semaglutide", "Exenatide"], color: STRATEGY_B_COLOR },
        { label: "SGLT2 inhibitors", items: ["Dapagliflozin"], color: "#c5c0fe" },
      ],
    },
  },
];

export const DRD_SIMULATION_RESULT_MOCK_SUMMARY_TEXT =
  "Based on counterfactual simulation adjusted for baseline severity, Strategy A demonstrates greater HbA1c reduction and faster response, at the cost of increased hypoglycemia risk. Key drivers include longer DM duration and adherence level.";

export const DRD_SIMULATION_RESULT_MOCK_POPULATION_SUMMARY = [
  { label: "Population", value: "N=440" },
  { label: "Follow-up", value: "12months" },
];

export const DRD_SIMULATION_RESULT_MOCK_VIEW_MODEL: DrdSimulationResultViewModel = {
  primaryOutcomeRows: [
    {
      strategyLabel: "Strategy A",
      strategyKey: "A",
      meanText: "-1.1%",
      ciText: "(-0.9, -1.3)",
      medianText: "-1.0",
      nntText: "6.2",
      nntWeek24Text: "48% (CI 44~52%)",
    },
    {
      strategyLabel: "Strategy B",
      strategyKey: "B",
      meanText: "-0.6%",
      ciText: "(-0.9, -1.3)",
      medianText: "-0.5",
      nntText: "11.4",
      nntWeek24Text: "26% (CI 22~30%)",
    },
    {
      strategyLabel: "Strategy C",
      strategyKey: "C",
      meanText: "-0.6%",
      ciText: "(-0.9, -1.3)",
      medianText: "-0.5",
      nntText: "11.4",
      nntWeek24Text: "26% (CI 22~30%)",
    },
  ],
  primaryOutcomeEmptyMessage: "Primary outcome summary is unavailable.",
  responseProbabilityRows: [
    {
      category: "Strong responder",
      strategyA: createResponseCell("32%(399)", 0.32, STRATEGY_A_COLOR, true),
      strategyB: createResponseCell("25%(275)", 0.25, TABLE_BODY_COLOR, false),
      strategyC: createResponseCell("25%(275)", 0.25, TABLE_BODY_COLOR, false),
    },
    {
      category: "Partial responder",
      strategyA: createResponseCell("21%(262)", 0.21, TABLE_BODY_COLOR, false),
      strategyB: createResponseCell("28%(298)", 0.28, TABLE_BODY_COLOR, false),
      strategyC: createResponseCell("28%(298)", 0.28, TABLE_BODY_COLOR, false),
    },
    {
      category: "Non responder",
      strategyA: createResponseCell("18%(225)", 0.18, TABLE_BODY_COLOR, false),
      strategyB: createResponseCell("37%(420)", 0.37, STRATEGY_B_COLOR, true),
      strategyC: createResponseCell("37%(420)", 0.37, STRATEGY_C_COLOR, true),
    },
    {
      category: "Deteriorator",
      strategyA: createResponseCell("6%(75)", 0.06, TABLE_BODY_COLOR, false),
      strategyB: createResponseCell("10%(88)", 0.1, TABLE_BODY_COLOR, false),
      strategyC: createResponseCell("10%(88)", 0.1, TABLE_BODY_COLOR, false),
    },
  ],
  responseProbabilityEmptyMessage: "Response probability data is unavailable.",
  trajectoryChart: {
    xAxisName: "Time since symptom onset (Months)",
    xAxisValues: [0, 3, 6, 9, 12, 15, 18, 21, 24],
    series: [
      {
        strategyLabel: "Strategy A",
        color: STRATEGY_A_COLOR,
        data: [0, -0.3, -0.8, -1.4, -1.8, -2.2, -2.6, -2.7, -2.5],
      },
      {
        strategyLabel: "Strategy B",
        color: STRATEGY_B_COLOR,
        data: [0, -0.1, -0.4, -0.9, -1.5, -2.0, -2.4, -2.6, -2.4],
      },
      {
        strategyLabel: "Strategy C",
        color: STRATEGY_C_COLOR,
        data: [0, 0.1, -0.1, -0.6, -1.0, -1.8, -2.2, -2.3, -2.2],
      },
    ],
    yAxisName: "Reduction in HbA1c",
    targetLine: {
      value: -1,
      label: "Target : -1.0% at Month 12",
    },
    verticalEvents: [
      { month: 9, label: "B: Add-on" },
      { month: 15, label: "A: Switch" },
    ],
    emptyMessage: "Simulated trajectory data is unavailable.",
  },
  counterfactualChart: {
    bins: buildBins(-2, 0.1, 31),
    series: [
      {
        strategyLabel: "Strategy A",
        color: STRATEGY_A_COLOR,
        counts: [0, 0, 0, 0, 0, 1, 1, 2, 5, 9, 11, 12, 14, 24, 25, 19, 22, 23, 30, 48, 46, 22, 11, 5, 0, 0, 0, 0, 0, 0, 0],
      },
      {
        strategyLabel: "Strategy B",
        color: STRATEGY_B_COLOR,
        counts: [0, 0, 0, 0, 3, 3, 4, 5, 13, 14, 18, 19, 23, 31, 32, 23, 28, 27, 36, 48, 29, 18, 12, 9, 0, 0, 0, 0, 0, 0, 0],
      },
      {
        strategyLabel: "Strategy C",
        color: STRATEGY_C_COLOR,
        counts: [6, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 20, 21, 22, 23, 24, 26, 29, 35, 42, 48, 43, 38, 30, 22, 17, 14, 11, 9],
      },
    ],
    emptyMessage: "Counterfactual comparison data is unavailable.",
  },
  safetyTradeoffChart: {
    points: [
      {
        strategyLabel: "Strategy C",
        color: STRATEGY_C_COLOR,
        xValue: 2.5,
        yValue: 2.8,
        symbolSize: 46,
      },
      {
        strategyLabel: "Strategy A",
        color: STRATEGY_A_COLOR,
        xValue: 3.5,
        yValue: 2.2,
        symbolSize: 62,
      },
      {
        strategyLabel: "Strategy B",
        color: STRATEGY_B_COLOR,
        xValue: 8.5,
        yValue: 6.0,
        symbolSize: 96,
      },
    ],
    xAxisName: "Delta HbA1c",
    yAxisName: "AE probability (%)",
    emptyMessage: "Safety trade-off data is unavailable.",
  },
  aeRiskChart: {
    aeOptions: ["Stroke", "Hypoglycemia", "Weight gain", "Heart failure"],
    seriesByAe: {
      Stroke: createAeSeriesSet(
        [0, 0.2, 0.6, 1.2, 2.0, 3.0, 6.0, 6.4, 6.8, 7.2, 7.8],
        [0, 0.3, 0.9, 1.8, 3.0, 4.5, 6.0, 6.5, 7.0, 7.5, 8.0],
        [0, 0.1, 0.3, 0.7, 1.2, 2.0, 2.8, 3.6, 4.2, 4.8, 5.2]
      ),
      Hypoglycemia: createAeSeriesSet(
        [0, 0.4, 1.0, 1.8, 2.9, 4.2, 5.8, 6.3, 7.1, 7.6, 8.4],
        [0, 0.5, 1.2, 2.1, 3.6, 4.9, 6.6, 7.2, 7.9, 8.5, 9.1],
        [0, 0.2, 0.4, 0.9, 1.6, 2.4, 3.1, 3.9, 4.5, 5.1, 5.7]
      ),
      "Weight gain": createAeSeriesSet(
        [0, 0.1, 0.2, 0.5, 0.9, 1.4, 1.9, 2.3, 2.7, 3.1, 3.4],
        [0, 0.2, 0.4, 0.8, 1.3, 1.9, 2.7, 3.2, 3.7, 4.2, 4.8],
        [0, 0.1, 0.2, 0.4, 0.7, 1.0, 1.4, 1.8, 2.1, 2.4, 2.8]
      ),
      "Heart failure": createAeSeriesSet(
        [0, 0.1, 0.3, 0.6, 1.0, 1.5, 2.0, 2.6, 3.1, 3.5, 4.0],
        [0, 0.2, 0.5, 0.9, 1.5, 2.2, 2.9, 3.5, 4.0, 4.5, 5.0],
        [0, 0.1, 0.2, 0.4, 0.7, 1.0, 1.3, 1.7, 2.1, 2.4, 2.7]
      ),
    },
    yAxisName: "AE probability (%)",
    emptyMessage: "AE risk data is unavailable.",
  },
};

export const DRD_SIMULATION_RESULT_MOCK_NON_RESPONDER_SECTION: DrdNonResponderSectionViewModel =
  {
    title: "Non responder Identification",
    description:
      "Top contributing factors ranked by impact score, where higher scores indicate stronger contribution to non-response.",
    strategies: [
      {
        strategyName: "Strategy A",
        features: [
          { rank: "1", condition: "DM duration > 7y", score: "0.32" },
          { rank: "2", condition: "Age > 70", score: "0.31" },
          { rank: "3", condition: "CKD stage >=3", score: "0.18" },
        ],
      },
      {
        strategyName: "Strategy B",
        features: [
          { rank: "1", condition: "Hypoglycemia history", score: "0.35" },
          { rank: "2", condition: "Low treatment adherence", score: "0.27" },
          { rank: "3", condition: "eGFR < 45", score: "0.19" },
        ],
      },
      {
        strategyName: "Strategy C",
        features: [
          { rank: "1", condition: "BMI > 30", score: "0.29" },
          { rank: "2", condition: "Baseline HbA1c > 8.5", score: "0.24" },
          { rank: "3", condition: "Heart failure history", score: "0.17" },
        ],
      },
    ],
  };
