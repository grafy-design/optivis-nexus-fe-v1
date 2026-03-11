type UnknownRecord = Record<string, unknown>;

const STRATEGY_A_COLOR = "#3a11d8";
const STRATEGY_B_COLOR = "#f06600";
const STRATEGY_C_COLOR = "#24c6c9";

const PRIMARY_OUTCOME_FALLBACK_MESSAGE =
  "Primary outcome summary is unavailable.";
const RESPONSE_PROBABILITY_FALLBACK_MESSAGE =
  "Response probability data is unavailable.";
const TRAJECTORY_FALLBACK_MESSAGE =
  "Simulated trajectory data is unavailable.";
const COUNTERFACTUAL_FALLBACK_MESSAGE =
  "Counterfactual comparison data is unavailable.";
const SAFETY_TRADEOFF_FALLBACK_MESSAGE =
  "Safety trade-off data is unavailable.";
const AE_RISK_FALLBACK_MESSAGE = "AE risk data is unavailable.";
const DEFAULT_TRAJECTORY_X_AXIS_NAME = "Time since symptom onset (Months)";

const OUTCOME_KEYS = [
  "outcome",
  "outcome_name",
  "primary_outcome",
  "measurement",
  "target_feature",
  "feature_name",
  "feature",
  "metric",
];

const STRATEGY_TEXT_KEYS = [
  "strategy",
  "strategy_name",
  "strategy_label",
  "scenario",
  "scenario_name",
  "scenario_id",
  "label",
  "group",
  "arm",
];

const EMPTY_RESPONSE_PROBABILITY_CELL: DrdResponseProbabilityCellViewModel = {
  text: "-",
  rawValue: null,
  color: "#787776",
  highlight: false,
};

const RESPONSE_CATEGORY_ORDER = [
  "strong responder",
  "partial responder",
  "non responder",
  "deteriorator",
];

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseMaybeJson = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const unwrapPayload = (value: unknown): UnknownRecord | null => {
  const parsed = parseMaybeJson(value);
  if (!isRecord(parsed)) return null;

  const parsedData = parseMaybeJson(parsed.data);
  if (isRecord(parsedData)) return parsedData;

  return parsed;
};

const toRecords = (value: unknown): UnknownRecord[] => {
  const parsed = parseMaybeJson(value);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => parseMaybeJson(item))
    .filter((item): item is UnknownRecord => isRecord(item));
};

const pickText = (record: UnknownRecord, keys: string[]): string => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
  }
  return "";
};

const pickNumber = (record: UnknownRecord, keys: string[]): number | null => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const normalizeComparable = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "");

const normalizeOutcomeTokens = (value: string): string[] =>
  value
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter(
      (token) =>
        token.length > 1 &&
        !["complication", "ex", "at", "week", "month", "months"].includes(token)
    );

const outcomeMatches = (
  record: UnknownRecord,
  selectedOutcome: string
): boolean => {
  const candidate = pickText(record, OUTCOME_KEYS);
  if (!candidate) return true;

  const normalizedCandidate = normalizeComparable(candidate);
  const normalizedOutcome = normalizeComparable(selectedOutcome);
  if (
    normalizedCandidate.includes(normalizedOutcome) ||
    normalizedOutcome.includes(normalizedCandidate)
  ) {
    return true;
  }

  const candidateTokens = new Set(normalizeOutcomeTokens(candidate));
  const outcomeTokens = normalizeOutcomeTokens(selectedOutcome);
  return outcomeTokens.some((token) => candidateTokens.has(token));
};

const normalizeStrategyLabel = (value: string): string => {
  const normalized = normalizeComparable(value);
  if (!normalized) return "";
  if (
    normalized === "a" ||
    normalized === "strategya" ||
    normalized === "scenarioa" ||
    normalized === "arma" ||
    normalized.endsWith("strategya") ||
    normalized.endsWith("scenarioa") ||
    normalized.endsWith("strategya")
  ) {
    return "Strategy A";
  }
  if (
    normalized === "b" ||
    normalized === "strategyb" ||
    normalized === "scenariob" ||
    normalized === "armb" ||
    normalized.endsWith("strategyb") ||
    normalized.endsWith("scenariob")
  ) {
    return "Strategy B";
  }
  if (
    normalized === "c" ||
    normalized === "strategyc" ||
    normalized === "scenarioc" ||
    normalized === "armc" ||
    normalized.endsWith("strategyc") ||
    normalized.endsWith("scenarioc")
  ) {
    return "Strategy C";
  }
  return value.trim();
};

const getStrategyLabel = (record: UnknownRecord): string =>
  normalizeStrategyLabel(pickText(record, STRATEGY_TEXT_KEYS));

const getStrategyColor = (strategyLabel: string): string => {
  if (strategyLabel === "Strategy A") return STRATEGY_A_COLOR;
  if (strategyLabel === "Strategy B") return STRATEGY_B_COLOR;
  if (strategyLabel === "Strategy C") return STRATEGY_C_COLOR;
  return "#787776";
};

const strategySortValue = (strategyLabel: string): number => {
  if (strategyLabel === "Strategy A") return 0;
  if (strategyLabel === "Strategy B") return 1;
  if (strategyLabel === "Strategy C") return 2;
  return 99;
};

const formatNumber = (value: number, fractionDigits = 1): string => {
  const safeDigits = Number.isInteger(fractionDigits) ? fractionDigits : 1;
  return value.toFixed(safeDigits);
};

const formatSignedNumber = (
  value: number,
  fractionDigits = 1,
  suffix = ""
): string => {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatNumber(value, fractionDigits)}${suffix}`;
};

const formatPercent = (value: number, fractionDigits = 0): string => {
  const scaled = Math.abs(value) <= 1 ? value * 100 : value;
  return `${formatNumber(scaled, fractionDigits)}%`;
};

const formatCiText = (
  record: UnknownRecord,
  lowKeys: string[],
  highKeys: string[],
  digits = 1
): string => {
  const explicit = pickText(record, [
    "ci",
    "confidence_interval",
    "confidence_interval_95",
    "confidence_interval95",
    "interval_95",
  ]);
  if (explicit) return explicit;

  const low = pickNumber(record, lowKeys);
  const high = pickNumber(record, highKeys);
  if (low === null || high === null) return "-";

  return `(${formatNumber(low, digits)}, ${formatNumber(high, digits)})`;
};

const formatWeek24Text = (record: UnknownRecord): string => {
  const explicit = pickText(record, [
    "nnt_at_week_24",
    "nnt_week_24",
    "nnt_week24",
    "week_24",
    "week24",
    "week_24_text",
    "week24_text",
    "response_at_week_24",
    "response_week_24",
  ]);
  if (explicit) return explicit;

  const rate = pickNumber(record, [
    "week_24_rate",
    "week24_rate",
    "week_24_probability",
    "week24_probability",
    "week_24_response_rate",
    "week24_response_rate",
    "rate",
  ]);
  if (rate === null) return "-";

  const ciLow = pickNumber(record, [
    "week_24_ci_low",
    "week24_ci_low",
    "week_24_lower_ci",
    "week24_lower_ci",
  ]);
  const ciHigh = pickNumber(record, [
    "week_24_ci_high",
    "week24_ci_high",
    "week_24_upper_ci",
    "week24_upper_ci",
  ]);

  if (ciLow !== null && ciHigh !== null) {
    return `${formatPercent(rate)} (CI ${formatPercent(ciLow)}~${formatPercent(
      ciHigh
    )})`;
  }

  return formatPercent(rate);
};

const getSeriesRows = (
  payload: UnknownRecord,
  key: string,
  selectedOutcome: string
): UnknownRecord[] =>
  toRecords(payload[key]).filter((record) => outcomeMatches(record, selectedOutcome));

const getFirstSeriesRows = (
  payload: UnknownRecord,
  keys: string[],
  selectedOutcome: string
): UnknownRecord[] => {
  for (const key of keys) {
    const rows = getSeriesRows(payload, key, selectedOutcome);
    if (rows.length > 0) return rows;
  }
  return [];
};

const getTrajectoryMeta = (payload: UnknownRecord): UnknownRecord | null => {
  const parsed = parseMaybeJson(payload.meta);
  return isRecord(parsed) ? parsed : null;
};

const getTrajectoryAxisName = (
  meta: UnknownRecord | null,
  key: "x_label" | "y_label",
  fallback: string
): string => {
  if (!meta) return fallback;
  return pickText(meta, [key]) || fallback;
};

const getTrajectoryTargetLine = (
  meta: UnknownRecord | null
): DrdTrajectoryTargetLineViewModel | null => {
  if (!meta) return null;

  const parsed = parseMaybeJson(meta.target_line);
  if (!isRecord(parsed)) return null;

  const value = pickNumber(parsed, ["value"]);
  const label = pickText(parsed, ["label"]);
  if (value === null || !label) return null;

  return { value, label };
};

const getTrajectoryVerticalEvents = (
  meta: UnknownRecord | null
): DrdTrajectoryVerticalEventViewModel[] => {
  if (!meta) return [];

  const parsed = parseMaybeJson(meta.vertical_events);
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((item) => parseMaybeJson(item))
    .filter((item): item is UnknownRecord => isRecord(item))
    .map((item) => {
      const month = pickNumber(item, ["month"]);
      const label = pickText(item, ["label"]);
      if (month === null || !label) return null;

      return { month, label };
    })
    .filter(
      (item): item is DrdTrajectoryVerticalEventViewModel => item !== null
    )
    .sort((left, right) => left.month - right.month);
};

const toSortedNumericAxis = (values: number[]): number[] =>
  Array.from(new Set(values))
    .filter((value) => Number.isFinite(value))
    .sort((left, right) => left - right);

const buildPrimaryOutcomeRows = (
  payload: UnknownRecord,
  selectedOutcome: string
): DrdPrimaryOutcomeRowViewModel[] =>
  getSeriesRows(payload, "primary_outcome_summary", selectedOutcome)
    .map((record) => {
      const strategyLabel = getStrategyLabel(record);
      if (!strategyLabel) return null;

      const meanText =
        pickText(record, ["mean_text", "mean_display", "mean_label"]) ||
        (() => {
          const mean = pickNumber(record, [
            "mean",
            "avg",
            "average",
            "estimate",
            "change_mean",
            "delta_mean",
          ]);
          if (mean === null) return "-";
          return selectedOutcome === "HbA1c"
            ? formatSignedNumber(mean, 1, "%")
            : formatSignedNumber(mean, 2);
        })();

      const medianText =
        pickText(record, ["median_text", "median_display"]) ||
        (() => {
          const median = pickNumber(record, ["median", "med"]);
          if (median === null) return "-";
          return formatNumber(median, selectedOutcome === "HbA1c" ? 1 : 2);
        })();

      const nntText =
        pickText(record, ["nnt_text", "nnt_display"]) ||
        (() => {
          const nnt = pickNumber(record, ["nnt"]);
          return nnt === null ? "-" : formatNumber(nnt, 1);
        })();

      return {
        strategyLabel,
        strategyKey: strategyLabel.replace("Strategy ", ""),
        meanText,
        ciText: formatCiText(
          record,
          ["ci_low", "lower_ci", "ci_lower", "mean_ci_low"],
          ["ci_high", "upper_ci", "ci_upper", "mean_ci_high"],
          selectedOutcome === "HbA1c" ? 1 : 2
        ),
        medianText,
        nntText,
        nntWeek24Text: formatWeek24Text(record),
      };
    })
    .filter((row): row is DrdPrimaryOutcomeRowViewModel => row !== null)
    .sort(
      (left, right) =>
        strategySortValue(left.strategyLabel) - strategySortValue(right.strategyLabel)
    );

const buildResponseProbabilityRows = (
  payload: UnknownRecord,
  selectedOutcome: string
): DrdResponseProbabilityRowViewModel[] => {
  const rows = getSeriesRows(payload, "strategy_output", selectedOutcome)
    .map((record) => {
      const strategyLabel = getStrategyLabel(record);
      const category =
        pickText(record, [
          "response_category",
          "category",
          "response_group",
          "group",
          "class",
          "classification",
        ]) || "";
      if (!strategyLabel || !category) return null;

      const probabilityText =
        pickText(record, ["probability_text", "rate_text", "display"]) ||
        (() => {
          const probability = pickNumber(record, [
            "probability",
            "rate",
            "proportion",
            "response_rate",
          ]);
          const count = pickNumber(record, [
            "count",
            "n",
            "patient_count",
            "patients",
          ]);

          if (probability === null && count === null) return "";
          if (probability !== null && count !== null) {
            return `${formatPercent(probability)} (${Math.round(count)})`;
          }
          if (probability !== null) {
            return formatPercent(probability);
          }
          return String(Math.round(count ?? 0));
        })();

      const probability = pickNumber(record, [
        "probability",
        "rate",
        "proportion",
        "response_rate",
      ]);

      return {
        category: category.trim(),
        strategyLabel,
        strategyColor: getStrategyColor(strategyLabel),
        text: probabilityText || "-",
        rawValue: probability === null ? null : Math.abs(probability) <= 1 ? probability * 100 : probability,
      };
    })
    .filter(
      (
        row
      ): row is {
        category: string;
        strategyLabel: string;
        strategyColor: string;
        text: string;
        rawValue: number | null;
      } => row !== null
    );

  const grouped = new Map<string, Map<string, DrdResponseProbabilityCellViewModel>>();
  rows.forEach((row) => {
    const byStrategy = grouped.get(row.category) ?? new Map();
    byStrategy.set(row.strategyLabel, {
      text: row.text,
      rawValue: row.rawValue,
      color: row.strategyColor,
      highlight: false,
    });
    grouped.set(row.category, byStrategy);
  });

  return Array.from(grouped.entries())
    .map(([category, byStrategy]) => {
      const cells = ["Strategy A", "Strategy B", "Strategy C"].map((strategyLabel) => {
        const cell = byStrategy.get(strategyLabel) ?? EMPTY_RESPONSE_PROBABILITY_CELL;
        return { ...cell };
      });

      const validValues = cells
        .map((cell) => cell.rawValue)
        .filter((value): value is number => value !== null);
      const maxValue =
        validValues.length > 0 ? Math.max(...validValues) : Number.NEGATIVE_INFINITY;

      cells.forEach((cell) => {
        cell.highlight = cell.rawValue !== null && cell.rawValue === maxValue;
      });

      return {
        category,
        strategyA: cells[0],
        strategyB: cells[1],
        strategyC: cells[2],
      };
    })
    .sort((left, right) => {
      const leftIndex = RESPONSE_CATEGORY_ORDER.indexOf(left.category.toLowerCase());
      const rightIndex = RESPONSE_CATEGORY_ORDER.indexOf(right.category.toLowerCase());
      if (leftIndex === -1 && rightIndex === -1) {
        return left.category.localeCompare(right.category);
      }
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    });
};

const buildTrajectoryChart = (
  payload: UnknownRecord,
  selectedOutcome: string
): DrdTrajectoryChartViewModel => {
  const trajectoryMeta = getTrajectoryMeta(payload);
  const xAxisName = getTrajectoryAxisName(
    trajectoryMeta,
    "x_label",
    DEFAULT_TRAJECTORY_X_AXIS_NAME
  );
  const yAxisName = getTrajectoryAxisName(
    trajectoryMeta,
    "y_label",
    `Change in ${selectedOutcome}`
  );
  const targetLine = getTrajectoryTargetLine(trajectoryMeta);
  const verticalEvents = getTrajectoryVerticalEvents(trajectoryMeta);
  const rows = getFirstSeriesRows(
    payload,
    ["trajectory", "simulated_trajectory", "simulated_trajectory_stats"],
    selectedOutcome
  );
  if (rows.length === 0) {
    return {
      xAxisName,
      xAxisValues: [],
      series: [],
      yAxisName,
      targetLine,
      verticalEvents,
      emptyMessage: TRAJECTORY_FALLBACK_MESSAGE,
    };
  }

  const xValues = toSortedNumericAxis(
    rows
      .map((record) =>
        pickNumber(record, ["month", "time", "x", "x_value", "week", "year"])
      )
      .filter((value): value is number => value !== null)
  );
  if (xValues.length === 0) {
    return {
      xAxisName,
      xAxisValues: [],
      series: [],
      yAxisName,
      targetLine,
      verticalEvents,
      emptyMessage: TRAJECTORY_FALLBACK_MESSAGE,
    };
  }

  const grouped = new Map<string, Map<number, number>>();
  rows.forEach((record) => {
    const strategyLabel = getStrategyLabel(record);
    const xValue = pickNumber(record, [
      "month",
      "time",
      "x",
      "x_value",
      "week",
      "year",
    ]);
    const yValue = pickNumber(record, [
      "value",
      "mean",
      "y",
      "y_value",
      "change",
      "delta",
      "trajectory",
      "score",
    ]);

    if (!strategyLabel || xValue === null || yValue === null) return;

    const byTime = grouped.get(strategyLabel) ?? new Map<number, number>();
    byTime.set(xValue, yValue);
    grouped.set(strategyLabel, byTime);
  });

  const series = Array.from(grouped.entries())
    .map(([strategyLabel, byTime]) => ({
      strategyLabel,
      color: getStrategyColor(strategyLabel),
      data: xValues.map((xValue) => byTime.get(xValue) ?? null),
    }))
    .sort(
      (left, right) =>
        strategySortValue(left.strategyLabel) - strategySortValue(right.strategyLabel)
    );

  return {
    xAxisName,
    xAxisValues: xValues,
    series,
    yAxisName,
    targetLine,
    verticalEvents,
    emptyMessage:
      series.length > 0 ? "" : TRAJECTORY_FALLBACK_MESSAGE,
  };
};

const buildCounterfactualChart = (
  payload: UnknownRecord,
  selectedOutcome: string
): DrdCounterfactualChartViewModel => {
  const rows = getSeriesRows(payload, "counterfactual_comparison", selectedOutcome);
  if (rows.length === 0) {
    return {
      bins: [],
      series: [],
      emptyMessage: COUNTERFACTUAL_FALLBACK_MESSAGE,
    };
  }

  const bins = toSortedNumericAxis(
    rows
      .map((record) =>
        pickNumber(record, [
          "bin",
          "bucket",
          "x",
          "x_value",
          "change",
          "delta",
          "value",
          "primary_outcome_change",
        ])
      )
      .filter((value): value is number => value !== null)
  );
  if (bins.length === 0) {
    return {
      bins: [],
      series: [],
      emptyMessage: COUNTERFACTUAL_FALLBACK_MESSAGE,
    };
  }

  const grouped = new Map<string, Map<number, number>>();
  rows.forEach((record) => {
    const strategyLabel = getStrategyLabel(record);
    const bin = pickNumber(record, [
      "bin",
      "bucket",
      "x",
      "x_value",
      "change",
      "delta",
      "value",
      "primary_outcome_change",
    ]);
    const count = pickNumber(record, [
      "count",
      "patient_count",
      "n",
      "frequency",
      "value_count",
      "y",
      "y_value",
    ]);

    if (!strategyLabel || bin === null || count === null) return;

    const byBin = grouped.get(strategyLabel) ?? new Map<number, number>();
    byBin.set(bin, count);
    grouped.set(strategyLabel, byBin);
  });

  const series = Array.from(grouped.entries())
    .map(([strategyLabel, byBin]) => ({
      strategyLabel,
      color: getStrategyColor(strategyLabel),
      counts: bins.map((bin) => byBin.get(bin) ?? 0),
    }))
    .sort(
      (left, right) =>
        strategySortValue(left.strategyLabel) - strategySortValue(right.strategyLabel)
    );

  return {
    bins,
    series,
    emptyMessage:
      series.length > 0 ? "" : COUNTERFACTUAL_FALLBACK_MESSAGE,
  };
};

const buildSafetyTradeoffChart = (
  payload: UnknownRecord,
  selectedOutcome: string
): DrdSafetyTradeoffChartViewModel => {
  const rows = getSeriesRows(payload, "safety_tradeoff", selectedOutcome);
  const points = rows
    .map((record) => {
      const strategyLabel = getStrategyLabel(record);
      if (!strategyLabel) return null;

      const outcomeDelta = pickNumber(record, [
        "outcome_delta",
        "delta_outcome",
        "delta",
        "x",
        "x_value",
        "efficacy",
        "change",
      ]);
      const aeProbability = pickNumber(record, [
        "ae_probability",
        "probability",
        "risk",
        "y",
        "y_value",
        "ae_risk",
      ]);
      const sizeValue = pickNumber(record, [
        "bubble_size",
        "size",
        "count",
        "patient_count",
        "n",
      ]);

      if (outcomeDelta === null || aeProbability === null) return null;

      return {
        strategyLabel,
        color: getStrategyColor(strategyLabel),
        xValue: outcomeDelta,
        yValue: Math.abs(aeProbability) <= 1 ? aeProbability * 100 : aeProbability,
        sizeValue,
      };
    })
    .filter(
      (
        point
      ): point is {
        strategyLabel: string;
        color: string;
        xValue: number;
        yValue: number;
        sizeValue: number | null;
      } => point !== null
    )
    .sort(
      (left, right) =>
        strategySortValue(left.strategyLabel) - strategySortValue(right.strategyLabel)
    );

  if (points.length === 0) {
    return {
      points: [],
      xAxisName: `Delta ${selectedOutcome}`,
      yAxisName: "AE probability (%)",
      emptyMessage: SAFETY_TRADEOFF_FALLBACK_MESSAGE,
    };
  }

  const sizeCandidates = points
    .map((point) => point.sizeValue)
    .filter((value): value is number => value !== null);
  const minSize = sizeCandidates.length > 0 ? Math.min(...sizeCandidates) : 1;
  const maxSize = sizeCandidates.length > 0 ? Math.max(...sizeCandidates) : 1;

  return {
    points: points.map((point) => {
      const ratio =
        point.sizeValue === null || maxSize === minSize
          ? 0.5
          : (point.sizeValue - minSize) / (maxSize - minSize);

      return {
        strategyLabel: point.strategyLabel,
        color: point.color,
        xValue: point.xValue,
        yValue: point.yValue,
        symbolSize: 44 + ratio * 52,
      };
    }),
    xAxisName: `Delta ${selectedOutcome}`,
    yAxisName: "AE probability (%)",
    emptyMessage: "",
  };
};

const buildAERiskChart = (
  payload: UnknownRecord,
  selectedOutcome: string
): DrdAERiskChartViewModel => {
  const rows = getSeriesRows(payload, "ae_risk", selectedOutcome);
  if (rows.length === 0) {
    return {
      aeOptions: [],
      seriesByAe: {},
      yAxisName: "AE probability (%)",
      emptyMessage: AE_RISK_FALLBACK_MESSAGE,
    };
  }

  const byAe = new Map<string, UnknownRecord[]>();
  rows.forEach((record) => {
    const aeType =
      pickText(record, [
        "ae_type",
        "adverse_event",
        "event",
        "name",
        "category",
        "risk_type",
      ]) || "Overall";
    const bucket = byAe.get(aeType) ?? [];
    bucket.push(record);
    byAe.set(aeType, bucket);
  });

  const aeOptions = Array.from(byAe.keys()).sort((left, right) =>
    left.localeCompare(right)
  );

  const seriesByAe = Object.fromEntries(
    aeOptions.map((aeType) => {
      const aeRows = byAe.get(aeType) ?? [];
      const xValues = toSortedNumericAxis(
        aeRows
          .map((record) =>
            pickNumber(record, ["year", "month", "time", "x", "x_value", "week"])
          )
          .filter((value): value is number => value !== null)
      );

      const grouped = new Map<string, Map<number, number>>();
      aeRows.forEach((record) => {
        const strategyLabel = getStrategyLabel(record);
        const xValue = pickNumber(record, [
          "year",
          "month",
          "time",
          "x",
          "x_value",
          "week",
        ]);
        const yValue = pickNumber(record, [
          "probability",
          "risk",
          "value",
          "y",
          "y_value",
          "ae_probability",
        ]);

        if (!strategyLabel || xValue === null || yValue === null) return;

        const byTime = grouped.get(strategyLabel) ?? new Map<number, number>();
        byTime.set(xValue, Math.abs(yValue) <= 1 ? yValue * 100 : yValue);
        grouped.set(strategyLabel, byTime);
      });

      const series = Array.from(grouped.entries())
        .map(([strategyLabel, byTime]) => ({
          strategyLabel,
          color: getStrategyColor(strategyLabel),
          data: xValues.map((xValue) => byTime.get(xValue) ?? null),
        }))
        .sort(
          (left, right) =>
            strategySortValue(left.strategyLabel) - strategySortValue(right.strategyLabel)
        );

      return [
        aeType,
        {
          xAxisValues: xValues,
          series,
        },
      ];
    })
  ) as Record<string, DrdAERiskSeriesSetViewModel>;

  return {
    aeOptions,
    seriesByAe,
    yAxisName: "AE probability (%)",
    emptyMessage:
      aeOptions.length > 0 ? "" : AE_RISK_FALLBACK_MESSAGE,
  };
};

export interface DrdPrimaryOutcomeRowViewModel {
  strategyLabel: string;
  strategyKey: string;
  meanText: string;
  ciText: string;
  medianText: string;
  nntText: string;
  nntWeek24Text: string;
}

export interface DrdResponseProbabilityCellViewModel {
  text: string;
  rawValue: number | null;
  color: string;
  highlight: boolean;
}

export interface DrdResponseProbabilityRowViewModel {
  category: string;
  strategyA: DrdResponseProbabilityCellViewModel;
  strategyB: DrdResponseProbabilityCellViewModel;
  strategyC: DrdResponseProbabilityCellViewModel;
}

export interface DrdTrajectorySeriesViewModel {
  strategyLabel: string;
  color: string;
  data: Array<number | null>;
}

export interface DrdTrajectoryTargetLineViewModel {
  value: number;
  label: string;
}

export interface DrdTrajectoryVerticalEventViewModel {
  month: number;
  label: string;
}

export interface DrdTrajectoryChartViewModel {
  xAxisName: string;
  xAxisValues: number[];
  series: DrdTrajectorySeriesViewModel[];
  yAxisName: string;
  targetLine: DrdTrajectoryTargetLineViewModel | null;
  verticalEvents: DrdTrajectoryVerticalEventViewModel[];
  emptyMessage: string;
}

export interface DrdCounterfactualSeriesViewModel {
  strategyLabel: string;
  color: string;
  counts: number[];
}

export interface DrdCounterfactualChartViewModel {
  bins: number[];
  series: DrdCounterfactualSeriesViewModel[];
  emptyMessage: string;
}

export interface DrdSafetyTradeoffPointViewModel {
  strategyLabel: string;
  color: string;
  xValue: number;
  yValue: number;
  symbolSize: number;
}

export interface DrdSafetyTradeoffChartViewModel {
  points: DrdSafetyTradeoffPointViewModel[];
  xAxisName: string;
  yAxisName: string;
  emptyMessage: string;
}

export interface DrdAERiskSeriesSetViewModel {
  xAxisValues: number[];
  series: DrdTrajectorySeriesViewModel[];
}

export interface DrdAERiskChartViewModel {
  aeOptions: string[];
  seriesByAe: Record<string, DrdAERiskSeriesSetViewModel>;
  yAxisName: string;
  emptyMessage: string;
}

export interface DrdSimulationResultViewModel {
  primaryOutcomeRows: DrdPrimaryOutcomeRowViewModel[];
  primaryOutcomeEmptyMessage: string;
  responseProbabilityRows: DrdResponseProbabilityRowViewModel[];
  responseProbabilityEmptyMessage: string;
  trajectoryChart: DrdTrajectoryChartViewModel;
  counterfactualChart: DrdCounterfactualChartViewModel;
  safetyTradeoffChart: DrdSafetyTradeoffChartViewModel;
  aeRiskChart: DrdAERiskChartViewModel;
}

export const EMPTY_DRD_SIMULATION_RESULT_VIEW_MODEL: DrdSimulationResultViewModel =
  {
    primaryOutcomeRows: [],
    primaryOutcomeEmptyMessage: PRIMARY_OUTCOME_FALLBACK_MESSAGE,
    responseProbabilityRows: [],
    responseProbabilityEmptyMessage: RESPONSE_PROBABILITY_FALLBACK_MESSAGE,
    trajectoryChart: {
      xAxisName: DEFAULT_TRAJECTORY_X_AXIS_NAME,
      xAxisValues: [],
      series: [],
      yAxisName: "Change",
      targetLine: null,
      verticalEvents: [],
      emptyMessage: TRAJECTORY_FALLBACK_MESSAGE,
    },
    counterfactualChart: {
      bins: [],
      series: [],
      emptyMessage: COUNTERFACTUAL_FALLBACK_MESSAGE,
    },
    safetyTradeoffChart: {
      points: [],
      xAxisName: "Delta",
      yAxisName: "AE probability (%)",
      emptyMessage: SAFETY_TRADEOFF_FALLBACK_MESSAGE,
    },
    aeRiskChart: {
      aeOptions: [],
      seriesByAe: {},
      yAxisName: "AE probability (%)",
      emptyMessage: AE_RISK_FALLBACK_MESSAGE,
    },
  };

export const mapDrdSimulationResult = (
  value: unknown,
  selectedOutcome: string
): DrdSimulationResultViewModel => {
  const payload = unwrapPayload(value);
  if (!payload) return EMPTY_DRD_SIMULATION_RESULT_VIEW_MODEL;

  const primaryOutcomeRows = buildPrimaryOutcomeRows(payload, selectedOutcome);
  const responseProbabilityRows = buildResponseProbabilityRows(
    payload,
    selectedOutcome
  );

  return {
    primaryOutcomeRows,
    primaryOutcomeEmptyMessage:
      primaryOutcomeRows.length > 0
        ? ""
        : PRIMARY_OUTCOME_FALLBACK_MESSAGE,
    responseProbabilityRows,
    responseProbabilityEmptyMessage:
      responseProbabilityRows.length > 0
        ? ""
        : RESPONSE_PROBABILITY_FALLBACK_MESSAGE,
    trajectoryChart: buildTrajectoryChart(payload, selectedOutcome),
    counterfactualChart: buildCounterfactualChart(payload, selectedOutcome),
    safetyTradeoffChart: buildSafetyTradeoffChart(payload, selectedOutcome),
    aeRiskChart: buildAERiskChart(payload, selectedOutcome),
  };
};
