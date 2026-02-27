"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import Select from "@/components/ui/select";
import {
  MultiLineWithErrorBar,
  type ErrorBarGroup,
} from "@/components/charts/MultiLineWithErrorBar";
import { DensityChart } from "@/components/charts/DensityChart";
import { RefineCutoffChartEditor } from "./components/RefineCutoffChartEditor";
import {
  getIdentificationFeatureInfo,
  getIdentificationSetInfo,
  type IdentificationFeatureInfoData,
  type IdentificationFeatureInfoRow,
  type IdentificationSetInfoData,
} from "@/services/subgroupService";

const MONTH_STEP = 3;
const DEFAULT_MONTH_MIN = 3;
const DEFAULT_MONTH_MAX = 24;
const DEFAULT_INITIAL_MONTH = 12;

type CdfPoint = [x: number, y: number];
type CutoffAxisType = "x_value" | "y_percent";
type CutoffPoint = { x: number; y: number };
type TableGroupRow = {
  groupName: string;
  color: string;
  patientsN: number;
  xLabel: string;
  yLabel: string;
};
type GroupMeta = {
  key: string;
  label: string;
  color: string;
  originalGroup?: string;
};

const DEFAULT_GROUP_COLORS = ["#f97316", "#919092", "#3A11D8", "#14A38B", "#E04A7A"];

const resolveGroupColors = (groupCount: number): string[] => {
  if (groupCount <= 0) return [];
  if (groupCount === 1) return ["#3A11D8"];
  if (groupCount === 2) return ["#f97316", "#3A11D8"];
  if (groupCount === 3) return ["#f97316", "#919092", "#3A11D8"];

  return Array.from(
    { length: groupCount },
    (_, index) => DEFAULT_GROUP_COLORS[index % DEFAULT_GROUP_COLORS.length]
  );
};

const normalizeGroupKey = (group: string | null | undefined, fallbackIndex: number): string => {
  const normalized = (group ?? "").trim().toLowerCase();
  if (normalized) {
    return normalized;
  }
  return `group${fallbackIndex + 1}`;
};

const formatGroupLabel = (group: string | null | undefined, fallbackIndex: number): string => {
  const normalized = (group ?? "").trim();
  if (!normalized) {
    return `Group ${fallbackIndex + 1}`;
  }

  const digits = normalized.match(/\d+/);
  if (digits) {
    return `Group ${digits[0]}`;
  }

  const plain = normalized.replace(/_/g, " ");
  return plain.charAt(0).toUpperCase() + plain.slice(1);
};

const groupKeySortValue = (key: string): number => {
  const digits = key.match(/\d+/);
  if (!digits) return Number.MAX_SAFE_INTEGER;
  const parsed = Number(digits[0]);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
};

const buildMonthMarks = (monthMin: number, monthMax: number): number[] => {
  const safeMin = Number.isFinite(monthMin) ? monthMin : DEFAULT_MONTH_MIN;
  const safeMax = Number.isFinite(monthMax) ? monthMax : DEFAULT_MONTH_MAX;
  const min = Math.min(safeMin, safeMax);
  const max = Math.max(safeMin, safeMax);

  const marks: number[] = [];
  for (let month = min; month <= max; month += MONTH_STEP) {
    marks.push(month);
  }

  if (marks.length === 0 || marks[0] !== min) {
    marks.unshift(min);
  }
  if (marks[marks.length - 1] !== max) {
    marks.push(max);
  }

  return [...new Set(marks)].sort((a, b) => a - b);
};

const findClosestMonthMark = (value: number, marks: number[]): number => {
  if (marks.length === 0) return DEFAULT_INITIAL_MONTH;

  let closest = marks[0];
  let minDiff = Math.abs(marks[0] - value);

  for (let i = 1; i < marks.length; i++) {
    const diff = Math.abs(marks[i] - value);
    if (diff < minDiff) {
      minDiff = diff;
      closest = marks[i];
    }
  }

  return closest;
};

const parseNumber = (value: string | number | null | undefined): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const parsed = Number(value.replace(/%/g, "").trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const resolveAxisType = (data: IdentificationFeatureInfoData | null): CutoffAxisType => {
  const raw = data?.axis_type ?? data?.cutoff_axis_type;
  return raw === "x_value" ? "x_value" : "y_percent";
};

const resolveChartFeatureKey = (
  rows: IdentificationFeatureInfoRow[],
  outcomeKey?: string
): string | null => {
  if (rows.length === 0) {
    return null;
  }
  const firstRow = rows[0];
  const keys = Object.keys(firstRow);
  const deltaKey = keys.find((key) => key.toLowerCase().includes("delta_"));
  if (deltaKey) return deltaKey;
  if (outcomeKey && outcomeKey in firstRow) return outcomeKey;
  return keys.find((key) => key !== "rid" && key !== "month") ?? null;
};

const buildCdfData = (
  rows: IdentificationFeatureInfoRow[],
  outcomeKey: string | undefined,
  selectedMonth: number
): CdfPoint[] => {
  const monthRows = rows.filter((row) => row.month === selectedMonth);
  const sourceRows = monthRows.length > 0 ? monthRows : rows;
  const featureKey = resolveChartFeatureKey(sourceRows, outcomeKey);
  if (!featureKey) return [];

  const values = sourceRows
    .map((row) => parseNumber(row[featureKey]))
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b);

  if (values.length === 0) return [];
  return values.map((x, index): CdfPoint => [x, ((index + 1) / values.length) * 100]);
};

const findClosestYForX = (cdfData: CdfPoint[], x: number): number => {
  if (cdfData.length === 0) return 0;
  let closest = cdfData[0];
  let minDiff = Math.abs(cdfData[0][0] - x);
  for (let i = 1; i < cdfData.length; i++) {
    const diff = Math.abs(cdfData[i][0] - x);
    if (diff < minDiff) {
      minDiff = diff;
      closest = cdfData[i];
    }
  }
  return closest[1];
};

const findClosestXForY = (cdfData: CdfPoint[], y: number): number => {
  if (cdfData.length === 0) return 0;
  let closest = cdfData[0];
  let minDiff = Math.abs(cdfData[0][1] - y);
  for (let i = 1; i < cdfData.length; i++) {
    const diff = Math.abs(cdfData[i][1] - y);
    if (diff < minDiff) {
      minDiff = diff;
      closest = cdfData[i];
    }
  }
  return closest[0];
};

const toPercentLabel = (value: number) => `${Number(value.toFixed(2))}%`;

const buildInitialCutoffPoints = (
  data: IdentificationFeatureInfoData,
  axisType: CutoffAxisType,
  cdfData: CdfPoint[]
): CutoffPoint[] => {
  const xs = data.cutoff_x
    .map((value) => parseNumber(value))
    .filter((value): value is number => value !== null);
  const ys = data.cutoff_y
    .map((value) => parseNumber(value))
    .filter((value): value is number => value !== null);

  const points: CutoffPoint[] = [];

  if (axisType === "x_value") {
    xs.slice(0, 2).forEach((x) => {
      const y = cdfData.length > 0 ? findClosestYForX(cdfData, x) : 0;
      points.push({ x, y: Math.max(0, Math.min(100, Number(y.toFixed(2)))) });
    });
  } else {
    ys.slice(0, 2).forEach((rawY) => {
      const y = Math.max(0, Math.min(100, Number(rawY.toFixed(2))));
      const x = cdfData.length > 0 ? findClosestXForY(cdfData, y) : 0;
      points.push({ x, y });
    });
  }

  if (points.length === 0) {
    const fallbackY = ys[0] ?? 80;
    const clampedY = Math.max(0, Math.min(100, Number(fallbackY.toFixed(2))));
    const fallbackX = cdfData.length > 0 ? findClosestXForY(cdfData, clampedY) : 0;
    points.push({ x: fallbackX, y: clampedY });
  }

  return points.sort((a, b) => a.x - b.x).slice(0, 2);
};

const buildTableGroupRows = (cutoffs: CutoffPoint[], xValues: number[]): TableGroupRow[] => {
  const total = xValues.length;
  if (total === 0 || cutoffs.length === 0) {
    return [];
  }

  if (cutoffs.length === 1) {
    const c1 = cutoffs[0];
    const left = xValues.filter((x) => x <= c1.x).length;
    const right = total - left;

    return [
      {
        groupName: "Group 1",
        color: "#f97316",
        patientsN: left,
        xLabel: `X<=${c1.x.toFixed(2)}`,
        yLabel: `Y<=${toPercentLabel(c1.y)}`,
      },
      {
        groupName: "Group 2",
        color: "#3A11D8",
        patientsN: right,
        xLabel: `X>${c1.x.toFixed(2)}`,
        yLabel: `Y>${toPercentLabel(c1.y)}`,
      },
    ];
  }

  const [c1, c2] = cutoffs;
  const left = xValues.filter((x) => x <= c1.x).length;
  const middle = xValues.filter((x) => x > c1.x && x <= c2.x).length;
  const right = total - left - middle;

  return [
    {
      groupName: "Group 1",
      color: "#f97316",
      patientsN: left,
      xLabel: `X<=${c1.x.toFixed(2)}`,
      yLabel: `Y<=${toPercentLabel(c1.y)}`,
    },
    {
      groupName: "Group 2",
      color: "#919092",
      patientsN: middle,
      xLabel: `X>${c1.x.toFixed(2)} && X<=${c2.x.toFixed(2)}`,
      yLabel: `Y>${toPercentLabel(c1.y)} && Y<=${toPercentLabel(c2.y)}`,
    },
    {
      groupName: "Group 3",
      color: "#3A11D8",
      patientsN: right,
      xLabel: `X>${c2.x.toFixed(2)}`,
      yLabel: `Y>${toPercentLabel(c2.y)}`,
    },
  ];
};

const getExpectedGroupCount = (cutoffX: number[]): number => {
  if (cutoffX.length >= 2) return 3;
  if (cutoffX.length === 1) return 2;
  return 1;
};

const resolveGroupIndexByCutoff = (value: number, sortedCutoffX: number[]): number => {
  if (sortedCutoffX.length === 0) return 0;
  if (sortedCutoffX.length === 1) {
    return value <= sortedCutoffX[0] ? 0 : 1;
  }
  if (value <= sortedCutoffX[0]) return 0;
  if (value <= sortedCutoffX[1]) return 1;
  return 2;
};

const calculate95CiHalfWidth = (values: number[]): number => {
  if (values.length <= 1) return 0;
  const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
  const variance =
    values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / (values.length - 1);
  const stdDev = Math.sqrt(Math.max(variance, 0));
  const stdErr = stdDev / Math.sqrt(values.length);
  return Number((1.96 * stdErr).toFixed(6));
};

const buildSetOneChartData = (
  rows: IdentificationFeatureInfoRow[],
  outcomeKey: string | undefined,
  selectedMonth: number,
  sortedCutoffX: number[]
): {
  diseaseDataGroup: ErrorBarGroup[];
  densitySegmentValues: number[];
} => {
  const featureKey = resolveChartFeatureKey(rows, outcomeKey);
  const expectedGroupCount = getExpectedGroupCount(sortedCutoffX);

  if (!featureKey || rows.length === 0) {
    return {
      diseaseDataGroup: Array.from({ length: expectedGroupCount }, () => []),
      densitySegmentValues: [],
    };
  }

  const ridToRows = new Map<string, Array<{ month: number; value: number }>>();
  rows.forEach((row) => {
    const rid = String(row.rid ?? "");
    if (!rid) return;
    const value = parseNumber(row[featureKey]);
    if (value === null) return;
    const month = Number(row.month);
    if (!Number.isFinite(month)) return;
    const list = ridToRows.get(rid) ?? [];
    list.push({ month, value });
    ridToRows.set(rid, list);
  });

  const ridToGroupIndex = new Map<string, number>();
  const densitySegmentValues: number[] = [];
  ridToRows.forEach((entries, rid) => {
    if (entries.length === 0) return;
    const entriesUpToSelected = entries.filter((entry) => entry.month <= selectedMonth);
    const selectedMonthEntry =
      entriesUpToSelected.find((entry) => entry.month === selectedMonth) ??
      [...entriesUpToSelected].sort((a, b) => b.month - a.month)[0] ??
      [...entries].sort((a, b) => a.month - b.month)[0];

    if (!selectedMonthEntry) return;
    densitySegmentValues.push(selectedMonthEntry.value);
    ridToGroupIndex.set(rid, resolveGroupIndexByCutoff(selectedMonthEntry.value, sortedCutoffX));
  });

  const monthValuesByGroup = Array.from({ length: expectedGroupCount }, () => new Map<number, number[]>());
  const allMonths = new Set<number>();

  ridToRows.forEach((entries, rid) => {
    const groupIndex = ridToGroupIndex.get(rid);
    if (groupIndex === undefined) return;
    entries.forEach((entry) => {
      if (entry.month > selectedMonth) return;
      allMonths.add(entry.month);
      const monthValues = monthValuesByGroup[groupIndex];
      const values = monthValues.get(entry.month) ?? [];
      values.push(entry.value);
      monthValues.set(entry.month, values);
    });
  });

  const sortedMonths = [...allMonths].sort((a, b) => a - b);
  const diseaseDataGroup: ErrorBarGroup[] = monthValuesByGroup.map((monthMap) =>
    sortedMonths
      .map((month) => {
        const values = monthMap.get(month) ?? [];
        if (values.length === 0) return null;
        const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
        const error = calculate95CiHalfWidth(values);
        return [month, Number(mean.toFixed(6)), error] as const;
      })
      .filter((point): point is [number, number, number] => point !== null)
  );

  return {
    diseaseDataGroup,
    densitySegmentValues,
  };
};

/**
 * TSI: Refine CutoffsO
 * 구조: 타이틀은 카드 밖, 왼쪽/오른쪽 카드
 * - 왼쪽 카드: 남색 카드에 슬라이더 (ATS LeftPanel 참고)
 * - 오른쪽 카드: 차트와 테이블
 */

function TSIRefineCutoffsPageContent() {
  const searchParams = useSearchParams();

  const taskId = searchParams.get("taskId") ?? "";
  const subgroupId = searchParams.get("subgroupId");
  const initialMonthFromQuery = (() => {
    const parsed = Number.parseInt(searchParams.get("month") || "", 10);
    return Number.isFinite(parsed) ? parsed : DEFAULT_INITIAL_MONTH;
  })();
  const router = useRouter();
  const [stratificationMonth, setStratificationMonth] = useState<number>(initialMonthFromQuery);

  const [additionalSliders, setAdditionalSliders] = useState<number[]>([]);
  const [featureInfoData, setFeatureInfoData] = useState<IdentificationFeatureInfoData | null>(
    null
  );
  const [setInfoData, setSetInfoData] = useState<IdentificationSetInfoData | null>(null);

  const [cumulativeProportion, setCumulativeProportion] = useState(0);
  const [initialCumulativeProportion, setInitialCumulativeProportion] = useState(0);
  const [initialAdditionalSliders, setInitialAdditionalSliders] = useState<number[]>([]);

  const minMonth = useMemo(() => {
    const parsed = Number(featureInfoData?.month_min);
    return Number.isFinite(parsed) ? parsed : DEFAULT_MONTH_MIN;
  }, [featureInfoData?.month_min]);
  const maxMonth = useMemo(() => {
    const parsed = Number(featureInfoData?.month_max);
    if (!Number.isFinite(parsed)) {
      return DEFAULT_MONTH_MAX;
    }
    return Math.max(parsed, minMonth);
  }, [featureInfoData?.month_max, minMonth]);
  const monthMarks = useMemo(() => buildMonthMarks(minMonth, maxMonth), [maxMonth, minMonth]);
  const effectiveStratificationMonth = useMemo(
    () => findClosestMonthMark(stratificationMonth, monthMarks),
    [monthMarks, stratificationMonth]
  );
  const initialStratificationMonth = useMemo(
    () => findClosestMonthMark(initialMonthFromQuery, monthMarks),
    [initialMonthFromQuery, monthMarks]
  );

  useEffect(() => {
    if (effectiveStratificationMonth !== stratificationMonth) {
      setStratificationMonth(effectiveStratificationMonth);
    }
  }, [effectiveStratificationMonth, stratificationMonth]);

  const cutoffAxisType = useMemo(
    () => resolveAxisType(featureInfoData),
    [featureInfoData]
  );

  const cdfData = useMemo(
    () =>
      buildCdfData(
        featureInfoData?.rows ?? [],
        featureInfoData?.outcome,
        effectiveStratificationMonth
      ),
    [effectiveStratificationMonth, featureInfoData]
  );

  const sortedCutoffY = useMemo(
    () => [cumulativeProportion, ...additionalSliders].sort((a, b) => a - b),
    [additionalSliders, cumulativeProportion]
  );

  const cutoffXNumbers = useMemo(
    () => sortedCutoffY.map((y) => findClosestXForY(cdfData, y)),
    [cdfData, sortedCutoffY]
  );

  const cutoffXValues = useMemo(
    () => cutoffXNumbers.map((x) => x.toFixed(2)),
    [cutoffXNumbers]
  );

  const cutoffYValues = useMemo(
    () => sortedCutoffY.map((y) => `${Number(y.toFixed(2))}%`),
    [sortedCutoffY]
  );
  const diseaseDisplayMonth = useMemo(() => {
    const monthFromSetInfo = Number(setInfoData?.month);
    if (Number.isFinite(monthFromSetInfo) && monthFromSetInfo > 0) {
      return monthFromSetInfo;
    }
    return effectiveStratificationMonth;
  }, [effectiveStratificationMonth, setInfoData?.month]);
  const diseaseXAxisMax = useMemo(
    () => Math.max(3, Math.ceil(diseaseDisplayMonth / 3) * 3),
    [diseaseDisplayMonth]
  );

  const tableGroupRows = useMemo(() => {
    if (cdfData.length === 0) {
      return [];
    }
    const cutoffPoints = cutoffXNumbers
      .map((x, index) => ({ x, y: sortedCutoffY[index] ?? 0 }))
      .sort((a, b) => a.x - b.x)
      .slice(0, 2);

    return buildTableGroupRows(cutoffPoints, cdfData.map(([x]) => x));
  }, [cdfData, cutoffXNumbers, sortedCutoffY]);

  const setOneChartData = useMemo(
    () =>
      buildSetOneChartData(
        featureInfoData?.rows ?? [],
        featureInfoData?.outcome,
        effectiveStratificationMonth,
        cutoffXNumbers
      ),
    [cutoffXNumbers, effectiveStratificationMonth, featureInfoData]
  );

  const setInfoGroupMeta = useMemo<GroupMeta[]>(() => {
    if (!setInfoData) return [];

    const orderedKeys: string[] = [];
    const keyToOriginalGroup = new Map<string, string>();
    const seen = new Set<string>();

    const appendGroup = (group: string | null | undefined) => {
      const key = normalizeGroupKey(group, orderedKeys.length);
      if (seen.has(key)) return;
      seen.add(key);
      orderedKeys.push(key);
      keyToOriginalGroup.set(key, (group ?? "").trim());
    };

    [...(setInfoData.result_table ?? [])]
      .sort((a, b) => a.no - b.no)
      .forEach((row) => appendGroup(row.group));

    [...(setInfoData.disease_progression ?? [])]
      .sort((a, b) => {
        const groupA = normalizeGroupKey(a.group, 0);
        const groupB = normalizeGroupKey(b.group, 0);
        const byGroup = groupKeySortValue(groupA) - groupKeySortValue(groupB);
        if (byGroup !== 0) return byGroup;
        return a.month - b.month;
      })
      .forEach((row) => appendGroup(row.group));

    [...(setInfoData.slope_distribution ?? [])]
      .sort((a, b) => {
        const groupA = normalizeGroupKey(a.group, 0);
        const groupB = normalizeGroupKey(b.group, 0);
        return groupKeySortValue(groupA) - groupKeySortValue(groupB);
      })
      .forEach((row) => appendGroup(row.group));

    const colors = resolveGroupColors(orderedKeys.length);
    return orderedKeys.map((key, index) => ({
      key,
      label: formatGroupLabel(keyToOriginalGroup.get(key), index),
      color: colors[index] ?? DEFAULT_GROUP_COLORS[index % DEFAULT_GROUP_COLORS.length],
      originalGroup: keyToOriginalGroup.get(key),
    }));
  }, [setInfoData]);

  const setInfoGroupMetaByKey = useMemo(
    () => new Map(setInfoGroupMeta.map((meta) => [meta.key, meta])),
    [setInfoGroupMeta]
  );

  const setInfoTableRows = useMemo<TableGroupRow[]>(() => {
    if (!setInfoData?.result_table?.length) return [];

    const sortedRows = [...setInfoData.result_table].sort((a, b) => a.no - b.no);
    const fallbackColors = resolveGroupColors(sortedRows.length);

    return sortedRows.map((row, index) => {
      const key = normalizeGroupKey(row.group, index);
      const meta = setInfoGroupMetaByKey.get(key);
      return {
        groupName: meta?.label ?? formatGroupLabel(row.group, index),
        color: meta?.color ?? fallbackColors[index] ?? DEFAULT_GROUP_COLORS[index],
        patientsN: row.patient_number,
        xLabel: row.delta_outcome,
        yLabel: row.cumulative_proportion,
      };
    });
  }, [setInfoData, setInfoGroupMetaByKey]);

  const fallbackGroupMeta = useMemo<GroupMeta[]>(
    () =>
      tableGroupRows.map((row, index) => ({
        key: `group${index + 1}`,
        label: row.groupName,
        color: row.color,
        originalGroup: `group${index + 1}`,
      })),
    [tableGroupRows]
  );

  const activeGroupMeta = setInfoGroupMeta.length > 0 ? setInfoGroupMeta : fallbackGroupMeta;
  const activeTableRows = setInfoTableRows.length > 0 ? setInfoTableRows : tableGroupRows;

  const diseaseChartData = useMemo<{
    dataGroup: ErrorBarGroup[];
    labels: string[];
    colors: string[];
  }>(() => {
    if (setInfoData?.disease_progression?.length) {
      const grouped = new Map<string, ErrorBarGroup>();
      const keyToOriginalGroup = new Map<string, string>();

      setInfoData.disease_progression
        .filter((row) => row.month <= diseaseDisplayMonth)
        .forEach((row, index) => {
        const key = normalizeGroupKey(row.group, index);
        keyToOriginalGroup.set(key, row.group);

        const error = Math.max((row.ci_high - row.ci_low) / 2, 0);
        const points = grouped.get(key) ?? [];
        points.push([
          row.month,
          Number(row.mean.toFixed(6)),
          Number(error.toFixed(6)),
        ]);
          grouped.set(key, points);
        });

      if (grouped.size === 0) {
        return {
          dataGroup: setOneChartData.diseaseDataGroup,
          labels: tableGroupRows.map((row) => row.groupName),
          colors: tableGroupRows.map((row) => row.color),
        };
      }

      const activeKeys = activeGroupMeta.map((meta) => meta.key).filter((key) => grouped.has(key));
      const remainingKeys = [...grouped.keys()]
        .filter((key) => !activeKeys.includes(key))
        .sort((a, b) => groupKeySortValue(a) - groupKeySortValue(b));
      const orderedKeys = [...activeKeys, ...remainingKeys];
      const fallbackColors = resolveGroupColors(orderedKeys.length);

      return {
        dataGroup: orderedKeys.map((key) =>
          (grouped.get(key) ?? []).sort((a, b) => a[0] - b[0])
        ),
        labels: orderedKeys.map((key, index) => {
          const found = setInfoGroupMetaByKey.get(key);
          return found?.label ?? formatGroupLabel(keyToOriginalGroup.get(key) ?? key, index);
        }),
        colors: orderedKeys.map((key, index) => {
          const found = setInfoGroupMetaByKey.get(key);
          return found?.color ?? fallbackColors[index] ?? DEFAULT_GROUP_COLORS[index];
        }),
      };
    }

    return {
      dataGroup: setOneChartData.diseaseDataGroup,
      labels: tableGroupRows.map((row) => row.groupName),
      colors: tableGroupRows.map((row) => row.color),
    };
  }, [
    activeGroupMeta,
    diseaseDisplayMonth,
    setInfoData,
    setInfoGroupMetaByKey,
    setOneChartData,
    tableGroupRows,
  ]);

  const densitySegmentedData = useMemo<{
    values: number[];
    boundaries: number[];
    colors: string[];
    labels: string[];
  } | null>(() => {
    if (setInfoData?.slope_distribution?.length) {
      const values = setInfoData.slope_distribution.flatMap((row) =>
        (row.slope ?? []).filter((value): value is number => Number.isFinite(value))
      );

      if (values.length > 0) {
        const boundaries = (setInfoData.cutoff_x ?? [])
          .map((value) => parseNumber(value))
          .filter((value): value is number => value !== null)
          .sort((a, b) => a - b)
          .slice(0, 2);

        const segmentCount = Math.max(boundaries.length + 1, activeGroupMeta.length || 0);
        const fallbackColors = resolveGroupColors(segmentCount);

        return {
          values,
          boundaries,
          colors: Array.from(
            { length: segmentCount },
            (_, index) => activeGroupMeta[index]?.color ?? fallbackColors[index] ?? "#3A11D8"
          ),
          labels: Array.from(
            { length: segmentCount },
            (_, index) => activeGroupMeta[index]?.label ?? `Group ${index + 1}`
          ),
        };
      }
    }

    if (setOneChartData.densitySegmentValues.length === 0) {
      return null;
    }

    return {
      values: setOneChartData.densitySegmentValues,
      boundaries: cutoffXNumbers,
      colors: tableGroupRows.map((row) => row.color),
      labels: tableGroupRows.map((row) => row.groupName),
    };
  }, [activeGroupMeta, cutoffXNumbers, setInfoData, setOneChartData, tableGroupRows]);

  const isCutoffDirty = useMemo(() => {
    if (Number(cumulativeProportion.toFixed(2)) !== Number(initialCumulativeProportion.toFixed(2))) {
      return true;
    }
    if (additionalSliders.length !== initialAdditionalSliders.length) {
      return true;
    }
    return additionalSliders.some(
      (value, index) =>
        Number(value.toFixed(2)) !== Number((initialAdditionalSliders[index] ?? 0).toFixed(2))
    );
  }, [additionalSliders, cumulativeProportion, initialAdditionalSliders, initialCumulativeProportion]);

  useEffect(() => {
    let isCancelled = false;
    if (!taskId || !subgroupId) {
      setFeatureInfoData(null);
      setSetInfoData(null);
      return;
    }

    const fetchData = async () => {
      let setInfoParams: {
        month: string;
        axisType: CutoffAxisType;
        cutoffX: string[];
        cutoffY: string[];
      } | null = null;

      try {
        const requestedMonth = effectiveStratificationMonth;
        const res = await getIdentificationFeatureInfo(
          taskId,
          subgroupId,
          requestedMonth.toString()
        );

        if (isCancelled) return;
        setFeatureInfoData(res.data);

        const responseMonthMarks = buildMonthMarks(res.data.month_min, res.data.month_max);
        const resolvedMonth = findClosestMonthMark(requestedMonth, responseMonthMarks);
        if (resolvedMonth !== requestedMonth) {
          setStratificationMonth(resolvedMonth);
          return;
        }

        const nextAxisType = resolveAxisType(res.data);
        const nextCdfData = buildCdfData(
          res.data.rows,
          res.data.outcome,
          resolvedMonth
        );
        const initialCutoffPoints = buildInitialCutoffPoints(res.data, nextAxisType, nextCdfData);
        const initialCutoffYValues = initialCutoffPoints
          .map((point) => Number(point.y.toFixed(2)))
          .sort((a, b) => a - b);
        const initialCutoffXValues = initialCutoffYValues
          .map((y) => findClosestXForY(nextCdfData, y))
          .map((x) => x.toFixed(2));
        const initialCutoffYLabels = initialCutoffYValues.map((y) => `${Number(y.toFixed(2))}%`);

        const nextPrimaryCutoffY = initialCutoffYValues[0] ?? 80;
        const nextAdditionalCutoffs = initialCutoffYValues.slice(1, 2);

        setCumulativeProportion(nextPrimaryCutoffY);
        setInitialCumulativeProportion(nextPrimaryCutoffY);
        setAdditionalSliders(nextAdditionalCutoffs);
        setInitialAdditionalSliders(nextAdditionalCutoffs);

        setInfoParams = {
          month: resolvedMonth.toString(),
          axisType: nextAxisType,
          cutoffX: initialCutoffXValues,
          cutoffY: initialCutoffYLabels,
        };
      } catch (_error) {
        if (isCancelled) return;
        setFeatureInfoData(null);
        setSetInfoData(null);
        return;
      }

      if (!setInfoParams) return;

      try {
        const setInfoResponse = await getIdentificationSetInfo(
          taskId,
          subgroupId,
          setInfoParams.month,
          setInfoParams.axisType,
          setInfoParams.cutoffX,
          setInfoParams.cutoffY
        );

        if (isCancelled) return;
        setSetInfoData(setInfoResponse.data);
      } catch (_error) {
        if (isCancelled) return;
        setSetInfoData(null);
      }
    };

    setSetInfoData(null);
    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [effectiveStratificationMonth, subgroupId, taskId]);

  // 뒤로가기 버튼을 눌렀을 때 Subgroup Selection으로 이동하도록 처리
  useEffect(() => {
    // 현재 페이지를 history에 추가하고, 이전 페이지를 Subgroup Selection으로 교체
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      if (!taskId) {
        router.push("/tsi/subgroup-selection");
        return;
      }
      const query = new URLSearchParams({ taskId });
      router.push(`/tsi/subgroup-selection?${query.toString()}`);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router, taskId]);

  // 슬라이더 값 계산 (feature/info의 month_min ~ month_max 범위)
  const monthRange = Math.max(maxMonth - minMonth, 1);
  const monthPercentage = ((effectiveStratificationMonth - minMonth) / monthRange) * 100;

  const handleClickGenerateSubGroup = async () => {
    if (!taskId || !subgroupId) {
      return;
    }

    const requestParams = {
      task_id: taskId,
      subgroup_id: subgroupId,
      month: effectiveStratificationMonth.toString(),
      axis_type: cutoffAxisType,
      cutoff_x: cutoffXValues,
      cutoff_y: cutoffYValues,
    };

    const response = await getIdentificationSetInfo(
      requestParams.task_id,
      requestParams.subgroup_id,
      requestParams.month,
      requestParams.axis_type,
      requestParams.cutoff_x,
      requestParams.cutoff_y
    );

    setSetInfoData(response.data);
  };

  return (
    <AppLayout headerType="tsi">
      <style jsx global>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>
      <div className="flex w-full flex-col items-center">
        {/* 타이틀: 카드 밖 */}
        <div className="mb-2 flex w-full max-w-full justify-center">
          <div className="mx-auto w-[1772px] max-w-full flex-shrink-0">
            <div className="flex flex-shrink-0 flex-col items-start gap-1">
              <div className="text-title text-neutral-5 mb-2 text-left">
                Target Subgroup Identification
              </div>
              <p className="text-body2m text-left text-neutral-50">Optimize study design</p>
            </div>
          </div>
        </div>

        {/* 메인: 왼쪽/오른쪽 카드 */}
        <div className="mx-auto flex w-[1772px] flex-shrink-0 flex-row flex-nowrap items-stretch gap-2">
          {/* 왼쪽 카드 */}
          <div
            className="flex h-[762px] w-[536px] flex-shrink-0 flex-col gap-3 overflow-hidden rounded-[36px] bg-white p-3"
            style={{
              backgroundImage: "url(/assets/tsi/refine-left.png)",
              backgroundSize: "536px 762px",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div className="flex min-h-0 w-full flex-col gap-0">
              {/* 남색 카드: Subgroup Creation */}
              <div
                className="flex flex-shrink-0 flex-col items-start gap-4 rounded-[24px]"
                style={{
                  background: "var(--primary-15)",
                  width: "512px",
                  height: "272px",
                  padding: "16px",
                }}
              >
                {/* 상단 라벨과 타이틀 */}
                <div className="flex flex-col gap-2">
                  <span className="text-body4m text-white/70">Prognostic</span>
                  <h4 className="text-h4 text-white">Subgroup Creation</h4>
                </div>

                {/* Outcome */}
                <div className="flex flex-col gap-0">
                  <span className="text-body3m text-white">Outcome</span>
                  <span className="text-body2 font-semibold text-white">Safety Score</span>
                </div>

                {/* Stratification month 슬라이더 */}
                <div className="flex w-full flex-col gap-2">
                  <span className="text-body3m text-white">Stratification month</span>
                  {/* 슬라이더와 드롭다운 - 같은 선상에 배치, 우측 정렬 */}
                  <div className="flex w-full items-start justify-between">
                    {/* 슬라이더 영역 */}
                    <div className="flex flex-shrink-0 flex-col gap-1" style={{ width: "400px" }}>
                      {/* 슬라이더 */}
                      <div
                        className="relative flex h-[24px] items-center select-none"
                        style={{
                          userSelect: "none",
                          width: "100%", // 부모 컨테이너의 100%
                        }}
                      >
                        {/* 슬라이더 트랙 */}
                        <div className="relative h-[12px] w-full rounded-full bg-neutral-50">
                          {/* 채워진 부분 (주황색) */}
                          <div
                            className="absolute top-0 left-0 h-[12px] rounded-full"
                            style={{
                              width: `${Math.max(0, Math.min(100, monthPercentage))}%`,
                              background: "#f06600",
                            }}
                          />
                          {/* 슬라이더 핸들 */}
                          <div
                            className="absolute top-1/2 h-[24px] w-[24px] -translate-y-1/2 cursor-grab rounded-full bg-white shadow-sm active:cursor-grabbing"
                            style={{
                              left: `calc(${Math.max(0, Math.min(100, monthPercentage))}% - 12px)`,
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const slider = e.currentTarget.parentElement?.parentElement;
                              if (!slider) return;
                              const preventSelect = (event: Event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                return false;
                              };
                              const preventDrag = (event: DragEvent) => {
                                event.preventDefault();
                                return false;
                              };
                              const handleMouseMove = (moveEvent: MouseEvent) => {
                                moveEvent.preventDefault();
                                const rect = slider.getBoundingClientRect();
                                const x = moveEvent.clientX - rect.left;
                                const percentage = Math.max(
                                  0,
                                  Math.min(100, (x / rect.width) * 100)
                                );
                                const rawMonth = minMonth + (percentage / 100) * (maxMonth - minMonth);
                                const nextMonth = findClosestMonthMark(rawMonth, monthMarks);
                                setStratificationMonth(nextMonth);
                              };
                              const handleMouseUp = (upEvent: MouseEvent) => {
                                upEvent.preventDefault();
                                upEvent.stopPropagation();
                                document.removeEventListener("mousemove", handleMouseMove);
                                document.removeEventListener("mouseup", handleMouseUp);
                                document.removeEventListener("selectstart", preventSelect);
                                document.removeEventListener("select", preventSelect);
                                document.removeEventListener("dragstart", preventDrag);
                                const bodyStyle = document.body.style as any;
                                bodyStyle.userSelect = "";
                                bodyStyle.webkitUserSelect = "";
                                bodyStyle.mozUserSelect = "";
                                bodyStyle.msUserSelect = "";
                                document.body.classList.remove("no-select");
                              };
                              const bodyStyle = document.body.style as any;
                              bodyStyle.userSelect = "none";
                              bodyStyle.webkitUserSelect = "none";
                              bodyStyle.mozUserSelect = "none";
                              bodyStyle.msUserSelect = "none";
                              document.body.classList.add("no-select");
                              document.addEventListener("mousemove", handleMouseMove, {
                                passive: false,
                              });
                              document.addEventListener("mouseup", handleMouseUp, {
                                passive: false,
                              });
                              document.addEventListener("selectstart", preventSelect);
                              document.addEventListener("select", preventSelect);
                              document.addEventListener("dragstart", preventDrag);
                            }}
                          />
                        </div>
                      </div>
                      {/* 슬라이더 하단 눈금 라벨 - 정확한 위치 계산 */}
                      <div
                        className="text-body5 relative overflow-hidden text-white/70"
                        style={{ width: "100%", height: "13px" }}
                      >
                        {monthMarks.map((month, index) => {
                          // 각 라벨의 위치를 정확히 계산 (슬라이더 핸들과 정렬)
                          const labelPercentage = ((month - minMonth) / monthRange) * 100;
                          const isFirst = index === 0;
                          const isLast = index === monthMarks.length - 1;

                          // 첫 번째는 왼쪽 정렬, 마지막은 오른쪽 정렬, 나머지는 가운데 정렬
                          let transformValue = "translateX(-50%)";
                          if (isFirst) {
                            transformValue = "translateX(0)";
                          } else if (isLast) {
                            transformValue = "translateX(-100%)";
                          }

                          return (
                            <span
                              key={month}
                              className="absolute text-center whitespace-nowrap"
                              style={{
                                left: `${labelPercentage}%`,
                                transform: transformValue,
                              }}
                            >
                              {month}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    {/* 드롭다운 - 우측 정렬, 같은 선상 */}
                    <div className="flex-shrink-0">
                      <Select
                        value={effectiveStratificationMonth.toString()}
                        options={monthMarks.map((month) => month.toString())}
                        onChange={(value) =>
                          setStratificationMonth(
                            findClosestMonthMark(Number.parseInt(value, 10), monthMarks)
                          )
                        }
                        className="[&>button]:bg-neutral-95 [&>button>span]:text-body5 [&>button>span]:text-neutral-5 w-[52px] [&>button]:h-[24px] [&>button]:items-center [&>button]:justify-between [&>button]:rounded-[8px] [&>button]:border-0 [&>button]:px-2 [&>button]:py-[6px] [&>button>span]:text-left [&>button>span]:font-semibold [&>button>svg]:flex-shrink-0"
                      />
                    </div>
                  </div>
                </div>

                {/* Apply Criteria 버튼 */}
                <button className="bg-neutral-70 text-body5 mt-auto ml-auto flex h-[30px] w-[124px] items-center justify-center rounded-full font-semibold text-white">
                  Apply Criteria
                </button>
              </div>
            </div>

            <RefineCutoffChartEditor
              cumulativeProportion={cumulativeProportion}
              additionalSliders={additionalSliders}
              initialCumulativeProportion={initialCumulativeProportion}
              initialAdditionalSliders={initialAdditionalSliders}
              onCumulativeProportionChange={setCumulativeProportion}
              onAdditionalSlidersChange={setAdditionalSliders}
              maxAdditionalSliders={1}
              rows={featureInfoData?.rows}
              outcomeKey={featureInfoData?.outcome}
              selectedMonth={effectiveStratificationMonth}
            />
            {/* Generate Subgroups 버튼 */}
            <button
              className="text-body4 mt-auto ml-auto flex h-[42px] w-[236px] items-center justify-center gap-2 rounded-full px-6 py-[6px] font-semibold text-white"
              style={{
                backgroundColor:
                  effectiveStratificationMonth !== initialStratificationMonth ||
                  isCutoffDirty
                    ? "#f06600"
                    : "#919092",
              }}
              onClick={handleClickGenerateSubGroup}
            >
              Generate Subgroups
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="flex-shrink-0"
              >
                <path
                  d="M4 13.9571V4.04286C4 3.68571 4.08261 3.42381 4.24782 3.25714C4.41304 3.08571 4.60951 3 4.83724 3C5.03818 3 5.24358 3.0619 5.45345 3.18571L13.2565 8.05C13.5334 8.22143 13.7254 8.37619 13.8326 8.51429C13.9442 8.64762 14 8.80952 14 9C14 9.18571 13.9442 9.34762 13.8326 9.48571C13.7254 9.62381 13.5334 9.77857 13.2565 9.95L5.45345 14.8143C5.24358 14.9381 5.03818 15 4.83724 15C4.60951 15 4.41304 14.9143 4.24782 14.7429C4.08261 14.5714 4 14.3095 4 13.9571Z"
                  fill="white"
                />
              </svg>
            </button>
          </div>

          {/* 오른쪽 카드 */}
          <div
            className="flex h-[762px] flex-1 flex-shrink-0 flex-col overflow-hidden rounded-[36px] bg-white p-3"
            style={{
              backgroundImage: "url(/assets/tsi/refine-right.png)",
              backgroundSize: "100% 100%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div className="flex h-full w-full flex-col gap-0">
              {/* Set 1 타이틀 */}
              <div className="m-3 flex-shrink-0">
                <h3 className="text-body2 text-primary-15">Set 1</h3>
              </div>

              {/* 차트 2개 */}
              <div className="mb-3 flex flex-shrink-0 gap-3">
                {/* Disease Progression by Group */}
                <div
                  className="bg-primary-15 flex h-[432px] flex-1 flex-col overflow-hidden rounded-[24px] p-5"
                  style={{
                    boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <h4 className="text-h4 mb-4 flex-shrink-0 text-white">
                    Disease Progression by Group
                  </h4>
                  <div className="flex min-h-0 flex-1 items-center justify-center rounded-[12px] bg-white">
                    <MultiLineWithErrorBar
                      dataGroup={diseaseChartData.dataGroup}
                      seriesLabels={diseaseChartData.labels}
                      colors={diseaseChartData.colors}
                      xAxis={{
                        min: 0,
                        max: diseaseXAxisMax,
                        interval: 3,
                      }}
                      guideLineX={diseaseDisplayMonth}
                    />
                  </div>
                </div>

                {/* rHTE distribution */}
                <div
                  className="overflow-hidden bg-primary-15 flex h-[432px] flex-1 flex-col rounded-[24px] p-5"
                  style={{
                    boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <h4 className="text-h4 mb-4 flex-shrink-0 text-white">Slope distribution</h4>
                  <div className="flex min-h-0 flex-1 items-center justify-center rounded-[12px] bg-white">
                    <DensityChart
                      segmented={densitySegmentedData ?? undefined}
                    />
                  </div>
                </div>
              </div>

              {/* Set 1 라벨 (하단) */}

              {/* 테이블 */}
              <div
                className="mb-3 flex min-h-[145px] flex-1 flex-col overflow-hidden rounded-[24px] bg-white"
                style={{
                  boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div className="flex h-full flex-col px-8 py-5">
                  {/* 테이블 헤더 */}
                  <div className="border-neutral-80 flex h-[39px] flex-shrink-0 items-center gap-4 border-b">
                    <div className="text-body2 text-neutral-30 w-[80px] font-semibold">no.</div>
                    <div className="text-body2 text-neutral-30 w-[240px] font-semibold">Group</div>
                    <div className="text-body2 text-neutral-30 w-[180px] font-semibold">
                      Patients N
                    </div>
                    <div className="text-body2 text-neutral-30 w-[290px] font-semibold">
                      Safety Score (x)
                    </div>
                    <div className="text-body2 text-neutral-30 flex-1 font-semibold">
                      cumulative proportion (y)
                    </div>
                  </div>

                  {/* 테이블 바디 */}
                  <div className="flex-shrink-0">
                    {activeTableRows.map((row, index) => (
                      <div
                        key={`${row.groupName}-${index}`}
                        className={`flex h-[42px] items-center gap-4 ${
                          index < activeTableRows.length - 1 ? "border-neutral-80 border-b" : ""
                        }`}
                      >
                        <div className="text-body3m text-neutral-10 w-[80px]">{index + 1}</div>
                        <div className="flex w-[240px] items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: row.color }}
                          ></div>
                          <span className="text-body3m text-neutral-10">{row.groupName}</span>
                        </div>
                        <div className="text-body3m text-neutral-10 w-[180px]">{row.patientsN}</div>
                        <div className="text-body3m text-neutral-10 w-[290px]">{row.xLabel}</div>
                        <div className="text-body3m text-neutral-10 flex-1">{row.yLabel}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 버튼들 */}
              <div className="flex flex-shrink-0 justify-end gap-2">
                <button
                  className="text-body4 h-[42px] rounded-full px-6 font-semibold text-white"
                  style={{ backgroundColor: "#C7C5C9" }}
                >
                  Save
                </button>
                <button
                  className="text-body4 h-[42px] rounded-full px-6 font-semibold text-white"
                  style={{ backgroundColor: "#C7C5C9" }}
                >
                  Save As
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function TSIRefineCutoffsPage() {
  return (
    <Suspense fallback={null}>
      <TSIRefineCutoffsPageContent />
    </Suspense>
  );
}
