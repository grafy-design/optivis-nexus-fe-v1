"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loading } from "@/components/common/Loading";
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
  saveSubgroupIdentification,
  type IdentificationFeatureInfoData,
  type IdentificationFeatureInfoRow,
  type IdentificationSetInfoData,
} from "@/services/subgroup-service";

/**
 * TSI: Refine Cutoffs 페이지
 * 하위군 분류 기준 컷오프를 조정하는 페이지.
 * - 왼쪽 카드: Stratification Month 슬라이더 + CDF 컷오프 에디터
 * - 오른쪽 카드: Disease Progression 차트 + Slope Distribution 차트 + 그룹 테이블
 *
 * Refine Cutoffs page — interactive cutoff adjustment interface.
 * - Left card: Stratification Month slider + CDF cutoff editor
 * - Right card: Disease Progression chart + Slope Distribution chart + group table
 */

// ── 슬라이더 설정 상수 / Slider configuration constants ──────────────────────
const MONTH_STEP = 3;
const DEFAULT_MONTH_MIN = 3;
const DEFAULT_MONTH_MAX = 24;
const DEFAULT_INITIAL_MONTH = 12;

// ── 타입 정의 / Type definitions ─────────────────────────────────────────────

/** CDF 데이터 포인트 [x, y] / CDF data point [x, y] */
type CdfPoint = [x: number, y: number];

/** 컷오프 축 타입: x값 기준 또는 y 퍼센트 기준 / Cutoff axis type */
type CutoffAxisType = "x_value" | "y_percent";

/** 컷오프 좌표 / Cutoff coordinate */
type CutoffPoint = { x: number; y: number };

/** 테이블 그룹 행 / Table group row */
type TableGroupRow = {
  groupName: string;
  color: string;
  patientsN: number;
  xLabel: string;
  yLabel: string;
};

/** 그룹 메타 정보 / Group metadata */
type GroupMeta = {
  key: string;
  label: string;
  color: string;
  originalGroup?: string;
};

// ── 그룹 색상 / Group colors ──────────────────────────────────────────────────
const DEFAULT_GROUP_COLORS = ["#f97316", "#919092", "#3A11D8", "#14A38B", "#E04A7A"];

/**
 * 그룹 수에 따라 색상 배열 반환
 * Returns color array based on group count
 */
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

// ── 그룹 키/레이블 유틸리티 / Group key/label utilities ──────────────────────

/**
 * 그룹 문자열을 정규화된 키로 변환 / Normalize group string to key
 */
const normalizeGroupKey = (group: string | null | undefined, fallbackIndex: number): string => {
  const normalized = (group ?? "").trim().toLowerCase();
  if (normalized) return normalized;
  return `group${fallbackIndex + 1}`;
};

/**
 * 그룹 문자열을 표시용 레이블로 변환 / Format group string to display label
 */
const formatGroupLabel = (group: string | null | undefined, fallbackIndex: number): string => {
  const normalized = (group ?? "").trim();
  if (!normalized) return `Group ${fallbackIndex + 1}`;
  const digits = normalized.match(/\d+/);
  if (digits) return `Group ${digits[0]}`;
  const plain = normalized.replace(/_/g, " ");
  return plain.charAt(0).toUpperCase() + plain.slice(1);
};

/**
 * 그룹 키에서 정렬 순서 추출 / Extract sort order from group key
 */
const groupKeySortValue = (key: string): number => {
  const digits = key.match(/\d+/);
  if (!digits) return Number.MAX_SAFE_INTEGER;
  const parsed = Number(digits[0]);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
};

// ── 슬라이더 눈금 계산 / Slider mark calculation ─────────────────────────────

/**
 * month_min ~ month_max 범위에서 MONTH_STEP 간격의 눈금 배열 생성
 * Builds array of month marks from min to max at MONTH_STEP intervals
 */
const buildMonthMarks = (monthMin: number, monthMax: number): number[] => {
  const safeMin = Number.isFinite(monthMin) ? monthMin : DEFAULT_MONTH_MIN;
  const safeMax = Number.isFinite(monthMax) ? monthMax : DEFAULT_MONTH_MAX;
  const min = Math.min(safeMin, safeMax);
  const max = Math.max(safeMin, safeMax);

  const marks: number[] = [];
  for (let month = min; month <= max; month += MONTH_STEP) {
    marks.push(month);
  }
  if (marks.length === 0 || marks[0] !== min) marks.unshift(min);
  if (marks[marks.length - 1] !== max) marks.push(max);

  return [...new Set(marks)].sort((a, b) => a - b);
};

/**
 * 눈금 배열에서 value에 가장 가까운 값 반환
 * Returns the closest mark to the given value
 */
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

// ── 데이터 파싱/변환 유틸리티 / Data parsing/conversion utilities ─────────────

/**
 * 문자열/숫자 값을 number로 파싱 (유한하지 않으면 null 반환)
 * Parses string/number to finite number or null
 */
const parseNumber = (value: string | number | null | undefined): number | null => {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/%/g, "").trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

/**
 * 피처 데이터에서 축 타입 결정 / Resolve axis type from feature data
 */
const resolveAxisType = (data: IdentificationFeatureInfoData | null): CutoffAxisType => {
  const raw = data?.axis_type ?? data?.cutoff_axis_type;
  return raw === "x_value" ? "x_value" : "y_percent";
};

/**
 * 피처 행에서 차트용 키 결정 (delta_ 접두사 우선)
 * Resolves the chart feature key from rows (prefers delta_ prefix)
 */
const resolveChartFeatureKey = (
  rows: IdentificationFeatureInfoRow[],
  outcomeKey?: string
): string | null => {
  if (rows.length === 0) return null;
  const firstRow = rows[0];
  const keys = Object.keys(firstRow);
  const deltaKey = keys.find((key) => key.toLowerCase().includes("delta_"));
  if (deltaKey) return deltaKey;
  if (outcomeKey && outcomeKey in firstRow) return outcomeKey;
  return keys.find((key) => key !== "rid" && key !== "month") ?? null;
};

// ── CDF 데이터 빌더 / CDF data builder ───────────────────────────────────────

/**
 * 피처 행 데이터에서 CDF 포인트 배열 생성
 * Builds CDF point array from feature row data
 */
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

/**
 * CDF에서 x에 가장 가까운 y 값 반환 / Find closest y for given x in CDF
 */
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

/**
 * CDF에서 y에 가장 가까운 x 값 반환 / Find closest x for given y in CDF
 */
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

/** 숫자를 퍼센트 레이블로 포맷 / Format number to percent label */
const toPercentLabel = (value: number) => `${Number(value.toFixed(2))}%`;

// ── 컷오프/그룹 테이블 빌더 / Cutoff and group table builders ─────────────────

/**
 * 초기 컷오프 포인트 배열 생성 (API 데이터 기반)
 * Builds initial cutoff points from API data
 */
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

/**
 * 컷오프 포인트와 x 값 배열로 그룹 테이블 행 생성
 * Builds group table rows from cutoff points and x values
 */
const buildTableGroupRows = (cutoffs: CutoffPoint[], xValues: number[]): TableGroupRow[] => {
  const total = xValues.length;
  if (total === 0 || cutoffs.length === 0) return [];

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

/**
 * cutoff_x 배열 길이로 예상 그룹 수 계산 / Expected group count from cutoff_x length
 */
const getExpectedGroupCount = (cutoffX: number[]): number => {
  if (cutoffX.length >= 2) return 3;
  if (cutoffX.length === 1) return 2;
  return 1;
};

/**
 * x 값과 정렬된 컷오프로 그룹 인덱스 결정
 * Determines group index for a value given sorted cutoff array
 */
const resolveGroupIndexByCutoff = (value: number, sortedCutoffX: number[]): number => {
  if (sortedCutoffX.length === 0) return 0;
  if (sortedCutoffX.length === 1) return value <= sortedCutoffX[0] ? 0 : 1;
  if (value <= sortedCutoffX[0]) return 0;
  if (value <= sortedCutoffX[1]) return 1;
  return 2;
};

/**
 * 95% CI 반너비 계산 / Calculates 95% CI half-width
 */
const calculate95CiHalfWidth = (values: number[]): number => {
  if (values.length <= 1) return 0;
  const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
  const variance =
    values.reduce((acc, value) => acc + (value - mean) ** 2, 0) / (values.length - 1);
  const stdDev = Math.sqrt(Math.max(variance, 0));
  const stdErr = stdDev / Math.sqrt(values.length);
  return Number((1.96 * stdErr).toFixed(6));
};

/**
 * Set 1 차트용 Disease Progression 데이터와 밀도 세그먼트 값 계산
 * Computes disease progression chart data and density segment values for Set 1
 */
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

  const monthValuesByGroup = Array.from(
    { length: expectedGroupCount },
    () => new Map<number, number[]>()
  );
  const allMonths = new Set<number>();

  ridToRows.forEach((entries, rid) => {
    const groupIndex = ridToGroupIndex.get(rid);
    if (groupIndex === undefined) return;
    entries.forEach((entry) => {
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

  return { diseaseDataGroup, densitySegmentValues };
};

// ── 메인 페이지 컴포넌트 / Main page component ───────────────────────────────

/**
 * TSI Refine Cutoffs 페이지 실제 컨텐츠
 * (useSearchParams 사용 → Suspense 래핑 필요)
 *
 * Actual Refine Cutoffs page content
 * (uses useSearchParams → requires Suspense wrapper)
 */
function TSIRefineCutoffsPageContent() {
  const searchParams = useSearchParams();

  // ── URL 쿼리 파라미터 / URL query parameters ──────────────────────────────
  const taskId = searchParams.get("taskId") ?? "";
  const subgroupId = searchParams.get("subgroupId");
  const setNameFromQuery = searchParams.get("setName") ?? "Set 1";
  const initialMonthFromQuery = (() => {
    const parsed = Number.parseInt(searchParams.get("month") || "", 10);
    return Number.isFinite(parsed) ? parsed : DEFAULT_INITIAL_MONTH;
  })();

  // ── Stratification Month 상태 (pending=UI, applied=실제 적용)
  //    Stratification month state (pending=UI slider, applied=actually applied)
  const [stratificationMonth, setStratificationMonth] = useState<number>(initialMonthFromQuery);
  const [appliedStratificationMonth, setAppliedStratificationMonth] =
    useState<number>(initialMonthFromQuery);
  const [applyCriteriaVersion, setApplyCriteriaVersion] = useState(0);

  // ── 화면 너비 반응형 처리 / Responsive handling based on window width ──────
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1920
  );
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const leftPanelWidth = windowWidth < 1470 ? 520 * 0.75 : 520;
  const isSmallScreen = windowWidth < 1470;
  const chartSymbolSize = isSmallScreen ? 12 : 18;
  const chartLineWidth = isSmallScreen ? 3 : 4.5;
  const chartErrorBarLineWidth = isSmallScreen ? 4 : 6;
  const chartErrorBarCapHalfWidth = isSmallScreen ? 6 : 9;

  // ── 컷오프 슬라이더 상태 / Cutoff slider state ────────────────────────────
  const [additionalSliders, setAdditionalSliders] = useState<number[]>([]);
  const [cumulativeProportion, setCumulativeProportion] = useState(0);
  const [initialCumulativeProportion, setInitialCumulativeProportion] = useState(0);
  const [initialAdditionalSliders, setInitialAdditionalSliders] = useState<number[]>([]);

  // ── API 응답 데이터 상태 / API response data state ────────────────────────
  const [featureInfoData, setFeatureInfoData] = useState<IdentificationFeatureInfoData | null>(null);
  const [setInfoData, setSetInfoData] = useState<IdentificationSetInfoData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ── 월 범위 및 눈금 계산 (메모이즈) / Month range and marks (memoized) ──────
  const minMonth = useMemo(() => {
    const parsed = Number(featureInfoData?.month_min);
    return Number.isFinite(parsed) ? parsed : DEFAULT_MONTH_MIN;
  }, [featureInfoData?.month_min]);

  const maxMonth = useMemo(() => {
    const parsed = Number(featureInfoData?.month_max);
    if (!Number.isFinite(parsed)) return DEFAULT_MONTH_MAX;
    return Math.max(parsed, minMonth);
  }, [featureInfoData?.month_max, minMonth]);

  const monthMarks = useMemo(() => buildMonthMarks(minMonth, maxMonth), [maxMonth, minMonth]);

  /** 슬라이더 값에 가장 가까운 눈금 (pending) / Pending month snapped to closest mark */
  const effectivePendingStratificationMonth = useMemo(
    () => findClosestMonthMark(stratificationMonth, monthMarks),
    [monthMarks, stratificationMonth]
  );

  /** 적용된 값에 가장 가까운 눈금 (applied) / Applied month snapped to closest mark */
  const effectiveAppliedStratificationMonth = useMemo(
    () => findClosestMonthMark(appliedStratificationMonth, monthMarks),
    [appliedStratificationMonth, monthMarks]
  );

  /** 초기 월값에 가장 가까운 눈금 / Initial month snapped to closest mark */
  const initialStratificationMonth = useMemo(
    () => findClosestMonthMark(initialMonthFromQuery, monthMarks),
    [initialMonthFromQuery, monthMarks]
  );

  // ── 눈금 스냅 동기화 / Sync state to snapped marks ────────────────────────
  useEffect(() => {
    if (effectivePendingStratificationMonth !== stratificationMonth) {
      setStratificationMonth(effectivePendingStratificationMonth);
    }
  }, [effectivePendingStratificationMonth, stratificationMonth]);

  useEffect(() => {
    if (effectiveAppliedStratificationMonth !== appliedStratificationMonth) {
      setAppliedStratificationMonth(effectiveAppliedStratificationMonth);
    }
  }, [appliedStratificationMonth, effectiveAppliedStratificationMonth]);

  // ── 파생 데이터 계산 (메모이즈) / Derived data calculations (memoized) ──────

  /** 컷오프 축 타입 / Cutoff axis type */
  const cutoffAxisType = useMemo(() => resolveAxisType(featureInfoData), [featureInfoData]);

  /** CDF 데이터 / CDF data */
  const cdfData = useMemo(
    () =>
      buildCdfData(
        featureInfoData?.rows ?? [],
        featureInfoData?.outcome,
        effectiveAppliedStratificationMonth
      ),
    [effectiveAppliedStratificationMonth, featureInfoData]
  );

  /** 정렬된 컷오프 Y 값 / Sorted cutoff Y values */
  const sortedCutoffY = useMemo(
    () => [cumulativeProportion, ...additionalSliders].sort((a, b) => a - b),
    [additionalSliders, cumulativeProportion]
  );

  /** 컷오프 X 숫자 값 / Cutoff X numeric values */
  const cutoffXNumbers = useMemo(
    () => sortedCutoffY.map((y) => findClosestXForY(cdfData, y)),
    [cdfData, sortedCutoffY]
  );

  /** 컷오프 X 문자열 값 (API 파라미터용) / Cutoff X string values (for API params) */
  const cutoffXValues = useMemo(() => cutoffXNumbers.map((x) => x.toFixed(2)), [cutoffXNumbers]);

  /** 컷오프 Y 퍼센트 문자열 값 (API 파라미터용) / Cutoff Y percent string values (for API) */
  const cutoffYValues = useMemo(
    () => sortedCutoffY.map((y) => `${Number(y.toFixed(2))}%`),
    [sortedCutoffY]
  );

  /** 질병 진행 차트의 X축 기준 월 / X-axis reference month for disease chart */
  const diseaseDisplayMonth = useMemo(() => {
    const monthFromSetInfo = Number(setInfoData?.month);
    if (Number.isFinite(monthFromSetInfo) && monthFromSetInfo > 0) return monthFromSetInfo;
    return effectiveAppliedStratificationMonth;
  }, [effectiveAppliedStratificationMonth, setInfoData?.month]);

  /** 그룹 테이블 행 데이터 / Group table row data */
  const tableGroupRows = useMemo(() => {
    if (cdfData.length === 0) return [];
    const cutoffPoints = cutoffXNumbers
      .map((x, index) => ({ x, y: sortedCutoffY[index] ?? 0 }))
      .sort((a, b) => a.x - b.x)
      .slice(0, 2);
    return buildTableGroupRows(cutoffPoints, cdfData.map(([x]) => x));
  }, [cdfData, cutoffXNumbers, sortedCutoffY]);

  /** Set 1 차트 데이터 / Set 1 chart data */
  const setOneChartData = useMemo(
    () =>
      buildSetOneChartData(
        featureInfoData?.rows ?? [],
        featureInfoData?.outcome,
        effectiveAppliedStratificationMonth,
        cutoffXNumbers
      ),
    [cutoffXNumbers, effectiveAppliedStratificationMonth, featureInfoData]
  );

  /** setInfoData에서 그룹 메타 배열 추출 / Extract group meta array from setInfoData */
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

    [...(setInfoData.result_table ?? [])].sort((a, b) => a.no - b.no).forEach((row) => appendGroup(row.group));
    [...(setInfoData.disease_progression ?? [])]
      .sort((a, b) => {
        const groupA = normalizeGroupKey(a.group, 0);
        const groupB = normalizeGroupKey(b.group, 0);
        const byGroup = groupKeySortValue(groupA) - groupKeySortValue(groupB);
        return byGroup !== 0 ? byGroup : a.month - b.month;
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

  /** setInfoData의 result_table을 테이블 행 형태로 변환 / Convert result_table to table rows */
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

  /** 폴백 그룹 메타 (setInfoData 없을 때) / Fallback group meta (when no setInfoData) */
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

  /** 실제 렌더링에 사용할 그룹 메타/테이블 행 / Active group meta/table rows for rendering */
  const activeGroupMeta = setInfoGroupMeta.length > 0 ? setInfoGroupMeta : fallbackGroupMeta;
  const activeTableRows = setInfoTableRows.length > 0 ? setInfoTableRows : tableGroupRows;

  /** 질병 진행 차트 데이터 (setInfoData 또는 계산값) / Disease chart data (from setInfoData or computed) */
  const diseaseChartData = useMemo<{
    dataGroup: ErrorBarGroup[];
    labels: string[];
    colors: string[];
  }>(() => {
    if (setInfoData?.disease_progression?.length) {
      const grouped = new Map<string, ErrorBarGroup>();
      const keyToOriginalGroup = new Map<string, string>();

      setInfoData.disease_progression.forEach((row, index) => {
        const key = normalizeGroupKey(row.group, index);
        keyToOriginalGroup.set(key, row.group);
        const error = Math.max((row.ci_high - row.ci_low) / 2, 0);
        const points = grouped.get(key) ?? [];
        points.push([row.month, Number(row.mean.toFixed(6)), Number(error.toFixed(6))]);
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
        dataGroup: orderedKeys.map((key) => (grouped.get(key) ?? []).sort((a, b) => a[0] - b[0])),
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
  }, [activeGroupMeta, setInfoData, setInfoGroupMetaByKey, setOneChartData, tableGroupRows]);

  /** 질병 진행 차트 X축 최대값 / Disease chart X-axis max */
  const diseaseXAxisMax = useMemo(() => {
    const maxMonthInChart = diseaseChartData.dataGroup.reduce((maxMonth, group) => {
      const groupMax = group.reduce((innerMax, [month]) => Math.max(innerMax, month), 0);
      return Math.max(maxMonth, groupMax);
    }, 0);
    const axisMax = Math.max(diseaseDisplayMonth, maxMonthInChart);
    return Math.max(3, Math.ceil(axisMax / 3) * 3);
  }, [diseaseChartData, diseaseDisplayMonth]);

  /** 밀도 차트 세그먼트 데이터 / Density chart segmented data */
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

    if (setOneChartData.densitySegmentValues.length === 0) return null;

    return {
      values: setOneChartData.densitySegmentValues,
      boundaries: cutoffXNumbers,
      colors: tableGroupRows.map((row) => row.color),
      labels: tableGroupRows.map((row) => row.groupName),
    };
  }, [activeGroupMeta, cutoffXNumbers, setInfoData, setOneChartData, tableGroupRows]);

  /** 컷오프가 초기값에서 변경되었는지 여부 / Whether cutoff has changed from initial */
  const isCutoffDirty = useMemo(() => {
    if (
      Number(cumulativeProportion.toFixed(2)) !== Number(initialCumulativeProportion.toFixed(2))
    ) {
      return true;
    }
    if (additionalSliders.length !== initialAdditionalSliders.length) return true;
    return additionalSliders.some(
      (value, index) =>
        Number(value.toFixed(2)) !== Number((initialAdditionalSliders[index] ?? 0).toFixed(2))
    );
  }, [additionalSliders, cumulativeProportion, initialAdditionalSliders, initialCumulativeProportion]);

  // ── 데이터 페치 Effect / Data fetch effect ────────────────────────────────
  useEffect(() => {
    let isCancelled = false;

    if (!taskId || !subgroupId) {
      setFeatureInfoData(null);
      setSetInfoData(null);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);

      try {
        let setInfoParams: {
          month: string;
          axisType: CutoffAxisType;
          cutoffX: string[];
          cutoffY: string[];
        } | null = null;

        try {
          const requestedMonth = effectiveAppliedStratificationMonth;
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
            setAppliedStratificationMonth(resolvedMonth);
            setStratificationMonth(resolvedMonth);
            return;
          }

          const nextAxisType = resolveAxisType(res.data);
          const nextCdfData = buildCdfData(res.data.rows, res.data.outcome, resolvedMonth);
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
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    setSetInfoData(null);
    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [applyCriteriaVersion, effectiveAppliedStratificationMonth, subgroupId, taskId]);

  // ── 슬라이더 퍼센트 계산 / Slider percentage calculation ──────────────────
  const monthRange = Math.max(maxMonth - minMonth, 1);
  const monthPercentage = ((effectivePendingStratificationMonth - minMonth) / monthRange) * 100;

  /** 월 슬라이더가 변경(dirty)되었는지 여부 / Whether month slider has unsaved changes */
  const isMonthDirty = effectivePendingStratificationMonth !== effectiveAppliedStratificationMonth;

  /** "Apply Criteria" 버튼 클릭 / Apply Criteria button handler */
  const handleClickApplyCriteria = () => {
    if (!taskId || !subgroupId) return;
    setAppliedStratificationMonth(effectivePendingStratificationMonth);
    setApplyCriteriaVersion((prev) => prev + 1);
  };

  /** "Generate Subgroups" 버튼 클릭 → Set Info 재조회 / Generate Subgroups handler */
  const handleClickGenerateSubGroup = async () => {
    if (!taskId || !subgroupId) return;

    const requestParams = {
      task_id: taskId,
      subgroup_id: subgroupId,
      month: effectiveAppliedStratificationMonth.toString(),
      axis_type: cutoffAxisType,
      cutoff_x: cutoffXValues,
      cutoff_y: cutoffYValues,
    };

    setIsLoading(true);
    try {
      const response = await getIdentificationSetInfo(
        requestParams.task_id,
        requestParams.subgroup_id,
        requestParams.month,
        requestParams.axis_type,
        requestParams.cutoff_x,
        requestParams.cutoff_y
      );
      setSetInfoData(response.data);
    } catch (_error) {
      setSetInfoData(null);
    } finally {
      setIsLoading(false);
    }
  };

  /** "Save" 버튼 클릭 → 컷오프 저장 / Save cutoff handler */
  const handleOnSaveRefineCutoff = async () => {
    if (!subgroupId) return;

    const parsedSubgroupId = Number.parseInt(subgroupId, 10);
    if (!Number.isFinite(parsedSubgroupId)) return;

    const parsedCutoffRawVersion = Number.parseInt(featureInfoData?.cutoff_raw_json?.[0] ?? "", 10);
    const cutoffRawVersion = Number.isFinite(parsedCutoffRawVersion) ? parsedCutoffRawVersion : 1;

    const requestParams = {
      subgroupId: parsedSubgroupId,
      cutoffAxisType,
      cutoffRawVersion,
      cutoffX: cutoffXValues,
      cutoffY: cutoffYValues,
    };

    // 저장 이벤트 연결 전에 파라미터를 먼저 콘솔로 확인한다.
    console.log("[handleOnSaveRefineCutoff] requestBody", {
      subgroup_id: requestParams.subgroupId,
      cutoff_axis_type: requestParams.cutoffAxisType,
      cutoff_raw_version: requestParams.cutoffRawVersion,
      cutoff_x: requestParams.cutoffX,
      cutoff_y: requestParams.cutoffY,
    });

    setIsLoading(true);
    try {
      await saveSubgroupIdentification(
        requestParams.subgroupId,
        requestParams.cutoffAxisType,
        requestParams.cutoffRawVersion,
        requestParams.cutoffX,
        requestParams.cutoffY
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout headerType="tsi" scaleMode="fit">
      <Loading isLoading={isLoading} />

      {/* 숫자 입력 스피너 숨김 CSS / Hide number input spinners */}
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

      {/* ── 외부 래퍼 / Outer wrapper ──────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "calc(100% - 28px)",
          height: "100%",
          gap: 24,
          marginLeft: "14px",
          marginRight: "14px",
          paddingBottom: 24,
        }}
      >

        {/* ── 1. 페이지 타이틀 / Page title ──────────────────────────── */}
        <div style={{ flexShrink: 0, padding: "0 12px" }}>
          <h1
            style={{
              fontFamily: "Poppins, Inter, sans-serif",
              fontSize: 42,
              fontWeight: 600,
              color: "rgb(17,17,17)",
              letterSpacing: "-1.5px",
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            Target Subgroup Identification
          </h1>
          <span
            style={{
              fontFamily: "Inter",
              fontSize: 16,
              fontWeight: 600,
              color: "rgb(120,119,118)",
              letterSpacing: "-0.48px",
            }}
          >
            Refine Cutoffs
          </span>
        </div>

        {/* ── 2. 왼쪽/오른쪽 카드 영역 / Left/Right card area ─────────── */}
        <div
          className="flex flex-row flex-nowrap items-stretch flex-1 min-h-0"
          style={{ minWidth: 0, gap: 0 }}
        >

          {/* ── 2-A. 왼쪽 카드: 슬라이더 + 컷오프 에디터
                     Left card: slider + cutoff editor ──────────────── */}
          <div
            className="flex min-h-0 flex-none min-w-0 flex-col gap-3 overflow-hidden rounded-[36px] p-0"
            style={{
              borderImage:
                'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch',
              width: `${leftPanelWidth}px`,
              borderStyle: "solid",
              borderTopWidth: "20px",
              borderBottomWidth: "28px",
              borderLeftWidth: "24px",
              borderRightWidth: "24px",
              borderColor: "transparent",
            }}
          >
            <div className="flex min-h-0 w-full flex-1 flex-col gap-3 overflow-y-auto">

              {/* ── 2-A-1. 남색 Subgroup Creation 카드 / Navy Subgroup Creation card ── */}
              <div
                className="flex flex-shrink-0 flex-col items-start gap-4 rounded-[24px]"
                style={{
                  background: "var(--primary-15)",
                  width: "100%",
                  height: "272px",
                  padding: "16px",
                }}
              >
                {/* 엔티티 타입 + 타이틀 / Entity type label + title */}
                <div className="flex flex-col gap-1">
                  <span className="text-body5 text-white/70">
                    {featureInfoData?.entity_type ?? "Prognostic"}
                  </span>
                  <h4 className="text-body1 text-white">Subgroup Creation</h4>
                </div>

                {/* Outcome 레이블 / Outcome label */}
                <div className="flex flex-col gap-1">
                  <span className="text-body5 text-white/70">Outcome</span>
                  <span className="text-body2 font-semibold text-white">
                    {featureInfoData?.outcome ?? ""}
                  </span>
                </div>

                {/* Stratification Month 슬라이더 영역 / Stratification Month slider area */}
                <div className="flex w-full flex-col gap-2">
                  <span className="text-body3m text-white">Stratification month</span>

                  {/* 슬라이더 + 드롭다운 / Slider + dropdown (inline) */}
                  <div className="flex w-full items-start justify-between gap-2">

                    {/* 슬라이더 트랙 + 눈금 / Slider track + tick marks */}
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <div
                        className="relative flex h-[24px] items-center select-none"
                        style={{ userSelect: "none", width: "100%" }}
                      >
                        {/* 슬라이더 트랙 / Slider track */}
                        <div className="relative h-[12px] w-full rounded-full bg-neutral-50">
                          {/* 채워진 부분 (주황색) / Filled portion (orange) */}
                          <div
                            className="absolute top-0 left-0 h-[12px] rounded-full"
                            style={{
                              width: `${Math.max(0, Math.min(100, monthPercentage))}%`,
                              background: "#f06600",
                            }}
                          />

                          {/* 슬라이더 핸들 (드래그 가능) / Slider handle (draggable) */}
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
                                const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
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
                                const bodyStyle = document.body.style;
                                bodyStyle.removeProperty("user-select");
                                bodyStyle.removeProperty("-webkit-user-select");
                                bodyStyle.removeProperty("-moz-user-select");
                                bodyStyle.removeProperty("-ms-user-select");
                                document.body.classList.remove("no-select");
                              };

                              // 드래그 중 텍스트 선택 방지 / Prevent text selection while dragging
                              const bodyStyle = document.body.style;
                              bodyStyle.setProperty("user-select", "none");
                              bodyStyle.setProperty("-webkit-user-select", "none");
                              bodyStyle.setProperty("-moz-user-select", "none");
                              bodyStyle.setProperty("-ms-user-select", "none");
                              document.body.classList.add("no-select");
                              document.addEventListener("mousemove", handleMouseMove, { passive: false });
                              document.addEventListener("mouseup", handleMouseUp, { passive: false });
                              document.addEventListener("selectstart", preventSelect);
                              document.addEventListener("select", preventSelect);
                              document.addEventListener("dragstart", preventDrag);
                            }}
                          />
                        </div>
                      </div>

                      {/* 슬라이더 하단 눈금 라벨 / Slider tick labels below track */}
                      <div
                        className="text-body5 relative overflow-hidden text-white/70"
                        style={{ width: "100%", height: "13px" }}
                      >
                        {monthMarks.map((month, index) => {
                          const labelPercentage = ((month - minMonth) / monthRange) * 100;
                          const isFirst = index === 0;
                          const isLast = index === monthMarks.length - 1;
                          // 첫 번째는 왼쪽 정렬, 마지막은 오른쪽 정렬, 나머지는 가운데 정렬
                          let transformValue = "translateX(-50%)";
                          if (isFirst) transformValue = "translateX(0)";
                          else if (isLast) transformValue = "translateX(-100%)";
                          return (
                            <span
                              key={month}
                              className="absolute text-center whitespace-nowrap"
                              style={{ left: `${labelPercentage}%`, transform: transformValue }}
                            >
                              {month}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* 월 선택 드롭다운 / Month select dropdown */}
                    <div className="flex-shrink-0">
                      <Select
                        value={effectivePendingStratificationMonth.toString()}
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

                {/* Apply Criteria 버튼 (월 변경 시 활성) / Apply Criteria button (active when month changed) */}
                <button
                  onClick={handleClickApplyCriteria}
                  style={{
                    marginTop: "auto",
                    marginLeft: "auto",
                    height: 30,
                    width: 124,
                    borderRadius: 36,
                    border: "none",
                    background: isMonthDirty ? "#F06600" : "#919092",
                    cursor: "pointer",
                    fontFamily: "Inter",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#ffffff",
                    letterSpacing: "-0.39px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Apply Criteria
                </button>
              </div>

              {/* ── 2-A-2. CDF 컷오프 에디터 / CDF cutoff editor ────── */}
              <RefineCutoffChartEditor
                cumulativeProportion={cumulativeProportion}
                additionalSliders={additionalSliders}
                onCumulativeProportionChange={setCumulativeProportion}
                onAdditionalSlidersChange={setAdditionalSliders}
                maxAdditionalSliders={1}
                rows={featureInfoData?.rows}
                outcomeKey={featureInfoData?.outcome}
                selectedMonth={effectiveAppliedStratificationMonth}
              />

            </div>

            {/* Generate Subgroups 버튼 (고정) / Generate Subgroups button (fixed at bottom) */}
            <button
              onClick={handleClickGenerateSubGroup}
              style={{
                flexShrink: 0,
                marginLeft: "auto",
                height: 40,
                paddingLeft: 24,
                paddingRight: 24,
                borderRadius: 36,
                border: "none",
                background:
                  effectiveAppliedStratificationMonth !== initialStratificationMonth || isCutoffDirty
                    ? "#F06600"
                    : "#919092",
                cursor: "pointer",
                fontFamily: "Inter",
                fontSize: 15,
                fontWeight: 600,
                color: "#ffffff",
                letterSpacing: "-0.45px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              Generate Subgroups
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ flexShrink: 0 }}
              >
                <path
                  d="M3 8L13 8M10 4L14 8L10 12"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          {/* ── 왼쪽 카드 닫기 / End left card ── */}

          {/* ── 2-B. 오른쪽 카드: 차트 + 테이블
                     Right card: charts + table ────────────────────── */}
          <div
            className="flex min-h-0 flex-1 flex-shrink-0 flex-col overflow-hidden rounded-[36px] p-0"
            style={{
              borderImage:
                'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch',
              borderStyle: "solid",
              borderTopWidth: "20px",
              borderBottomWidth: "28px",
              borderLeftWidth: "24px",
              borderRightWidth: "24px",
              borderColor: "transparent",
            }}
          >
            <div className="flex h-full w-full flex-col gap-3">

              {/* Set 타이틀 / Set title */}
              <div className="flex-shrink-0 pl-[04px] pt-[04px]">
                <h3 className="text-body1 text-primary-15">{setNameFromQuery}</h3>
              </div>

              {/* 스크롤 컨테이너: 차트 2개 + 테이블 / Scroll container: 2 charts + table */}
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">

                {/* ── 차트 2개 가로 배치 / Two charts side by side ────── */}
                <div
                  className="flex min-h-0 min-w-0 flex-shrink-0 gap-3 overflow-hidden"
                  style={{ height: "320px" }}
                >

                  {/* 차트 1: Disease Progression by Group */}
                  <div
                    className="flex w-0 min-w-0 flex-1 rounded-[24px] p-[8px]"
                    style={{
                      backgroundColor: "var(--primary-15)",
                      boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <div className="flex min-h-0 w-full flex-col gap-6">
                      <h4 className="text-body2m flex-shrink-0 text-white pt-[4px] pl-[4px]">
                        Disease Progression by Group
                      </h4>
                      <div
                        className="flex min-h-0 flex-1 rounded-[16px] bg-white p-3"
                        style={{ height: "100%" }}
                      >
                        <MultiLineWithErrorBar
                          dataGroup={diseaseChartData.dataGroup}
                          seriesLabels={diseaseChartData.labels}
                          colors={diseaseChartData.colors}
                          filledSymbol
                          lineWidth={chartLineWidth}
                          symbolSize={chartSymbolSize}
                          errorBarLineWidth={chartErrorBarLineWidth}
                          errorBarCapHalfWidth={chartErrorBarCapHalfWidth}
                          height="100%"
                          sizeVariant="S"
                          grid={{ left: 24, right: 4, top: 2, bottom: 10 }}
                          xAxis={{ min: 0, max: diseaseXAxisMax, interval: 3, name: "Month", nameGap: 8 }}
                          yAxis={{ name: "Disease progression score", nameGap: 28, showLabels: true, showTick: true }}
                          guideLineX={diseaseDisplayMonth}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 차트 2: Slope Distribution */}
                  <div
                    className="flex w-0 min-w-0 flex-1 rounded-[24px] p-[8px]"
                    style={{
                      backgroundColor: "var(--primary-15)",
                      boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <div className="flex min-h-0 w-full flex-col gap-6">
                      <h4 className="text-body2m flex-shrink-0 text-white pt-[4px] pl-[4px]">
                        Slope distribution
                      </h4>
                      <div className="flex min-h-0 flex-1 items-center justify-center rounded-[16px] bg-white p-3">
                        <DensityChart
                          segmented={densitySegmentedData ?? undefined}
                          sizeVariant="S"
                          xAxisName="Slope"
                          yAxisName="Density"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* ── 그룹 테이블 / Group table ────────────────────────── */}
                <div
                  className="flex flex-1 flex-col rounded-[24px] bg-white"
                  style={{ boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)" }}
                >
                  <div className="flex flex-col px-3 py-3">

                    {/* 테이블 헤더 / Table header */}
                    <div className="border-neutral-80 flex h-wrap flex-shrink-0 items-center gap-4 border-b pb-[4px]">
                      <div className="text-body4 text-neutral-30 flex-[8] font-semibold">no.</div>
                      <div className="text-body4 text-neutral-30 flex-[24] font-semibold">Group</div>
                      <div className="text-body4 text-neutral-30 flex-[18] font-semibold">Patients N</div>
                      <div className="text-body4 text-neutral-30 flex-[29] font-semibold">△ Outcome (x)</div>
                      <div className="text-body4 text-neutral-30 flex-[21] font-semibold">
                        cumulative proportion (y)
                      </div>
                    </div>

                    {/* 테이블 바디 / Table body */}
                    <div className="flex-shrink-0">
                      {activeTableRows.map((row, index) => (
                        <div
                          key={`${row.groupName}-${index}`}
                          className={`flex h-wrap items-center gap-4 py-[8px] ${
                            index < activeTableRows.length - 1
                              ? "border-neutral-80 border-b"
                              : ""
                          }`}
                        >
                          <div className="text-body5 text-neutral-50 flex-[8]">{index + 1}</div>
                          <div className="flex flex-[24] items-center gap-2">
                            <div
                              className="h-3 w-3 flex-shrink-0 rounded-full"
                              style={{ backgroundColor: row.color }}
                            />
                            <span className="text-body5 text-neutral-50">{row.groupName}</span>
                          </div>
                          <div className="text-body5 text-neutral-50 flex-[18]">{row.patientsN}</div>
                          <div className="text-body5 text-neutral-50 flex-[29]">{row.xLabel}</div>
                          <div className="text-body5 text-neutral-50 flex-[21]">{row.yLabel}</div>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>

              </div>
              {/* ── 스크롤 컨테이너 닫기 / End scroll container ── */}

              {/* ── 하단 버튼 영역 / Bottom action buttons ──────────────── */}
              <div className="flex flex-shrink-0 justify-end gap-2">
                {/* Save 버튼 / Save button */}
                <button
                  onClick={handleOnSaveRefineCutoff}
                  style={{
                    height: 40,
                    paddingLeft: 24,
                    paddingRight: 24,
                    borderRadius: 36,
                    border: "none",
                    background: "#787776",
                    cursor: "pointer",
                    fontFamily: "Inter",
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#ffffff",
                    letterSpacing: "-0.45px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Save
                </button>
                {/* Save As 버튼 / Save As button */}
                <button
                  style={{
                    height: 40,
                    paddingLeft: 24,
                    paddingRight: 24,
                    borderRadius: 36,
                    border: "none",
                    background: "#787776",
                    cursor: "pointer",
                    fontFamily: "Inter",
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#ffffff",
                    letterSpacing: "-0.45px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  Save As
                </button>
              </div>

            </div>
          </div>
          {/* ── 오른쪽 카드 닫기 / End right card ── */}

        </div>
        {/* ── 카드 영역 닫기 / End card area ── */}

      </div>
      {/* ── 외부 래퍼 닫기 / End outer wrapper ── */}

    </AppLayout>
  );
}

/**
 * Suspense 래퍼 (useSearchParams 사용 필요)
 * Suspense wrapper (required for useSearchParams)
 */
export default function TSIRefineCutoffsPage() {
  return (
    <Suspense fallback={null}>
      <TSIRefineCutoffsPageContent />
    </Suspense>
  );
}
