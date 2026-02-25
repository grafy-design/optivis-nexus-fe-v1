"use client";

import { Suspense, useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import Select from "@/components/ui/select";
import { MultiLineWithErrorBar } from "@/components/charts/MultiLineWithErrorBar";
import { DensityChart } from "@/components/charts/DensityChart";
import { RefineCutoffChartEditor } from "./components/RefineCutoffChartEditor";
import {
  getIdentificationFeatureInfo,
  getIdentificationSetInfo,
  type IdentificationFeatureInfoData,
  type IdentificationFeatureInfoRow,
} from "@/services/subgroupService";

const MOCK_UP_DISEASE_CHART_DATA: [x: number, y: number, error: number][][] = [
  [
    [0, 10, 2],
    [3, 12, 2],
    [6, 14, 3],
    [9, 15, 2],
    [12, 17, 3],
    [15, 20, 3],
    [18, 22, 4],
    [21, 25, 3],
    [24, 28, 4],
  ],
  [
    [0, 8, 1],
    [3, 9, 2],
    [6, 10, 2],
    [9, 11, 1],
    [12, 12, 2],
    [15, 13, 2],
    [18, 14, 2],
    [21, 15, 2],
    [24, 16, 3],
  ],
];

const MOCK_DENSITY_DATA = {
  orangeGroup: [0.55, 0.72, 0.84, 0.95, 1.05, 1.15],
  blueGroup: [1.65, 1.78, 1.9, 2.02, 2.1, 2.2],
};

const MOCK_TASK_ID = "test-task-id";

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

/**
 * TSI: Refine CutoffsO
 * 구조: 타이틀은 카드 밖, 왼쪽/오른쪽 카드
 * - 왼쪽 카드: 남색 카드에 슬라이더 (ATS LeftPanel 참고)
 * - 오른쪽 카드: 차트와 테이블
 */

function TSIRefineCutoffsPageContent() {
  const searchParams = useSearchParams();

  const subgroupId = searchParams.get("subgroupId");
  const router = useRouter();
  const [stratificationMonth, setStratificationMonth] = useState<number>(
    parseInt(searchParams.get("month") || "12")
  );

  const [additionalSliders, setAdditionalSliders] = useState<number[]>([]);
  const [featureInfoData, setFeatureInfoData] = useState<IdentificationFeatureInfoData | null>(
    null
  );

  const [cumulativeProportion, setCumulativeProportion] = useState(0);
  const [initialCumulativeProportion, setInitialCumulativeProportion] = useState(0);
  const [initialAdditionalSliders, setInitialAdditionalSliders] = useState<number[]>([]);
  const [tableGroupRows, setTableGroupRows] = useState<TableGroupRow[]>([]);

  const initialStratificationMonth = 12;

  const cutoffAxisType = useMemo(
    () => resolveAxisType(featureInfoData),
    [featureInfoData]
  );

  const cdfData = useMemo(
    () =>
      buildCdfData(
        featureInfoData?.rows ?? [],
        featureInfoData?.outcome,
        stratificationMonth
      ),
    [featureInfoData, stratificationMonth]
  );

  const sortedCutoffY = useMemo(
    () => [cumulativeProportion, ...additionalSliders].sort((a, b) => a - b),
    [additionalSliders, cumulativeProportion]
  );

  const cutoffXValues = useMemo(
    () => sortedCutoffY.map((y) => findClosestXForY(cdfData, y).toFixed(2)),
    [cdfData, sortedCutoffY]
  );

  const cutoffYValues = useMemo(
    () => sortedCutoffY.map((y) => `${Number(y.toFixed(2))}%`),
    [sortedCutoffY]
  );

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
    const fetchData = async () => {
      const res = await getIdentificationFeatureInfo(
        MOCK_TASK_ID,
        subgroupId ?? "",
        stratificationMonth.toString()
      );

      console.log(res.data);
      setFeatureInfoData(res.data);

      const nextAxisType = resolveAxisType(res.data);
      const nextCdfData = buildCdfData(res.data.rows, res.data.outcome, stratificationMonth);
      const initialCutoffPoints = buildInitialCutoffPoints(res.data, nextAxisType, nextCdfData);
      const initialCutoffYValues = initialCutoffPoints
        .map((point) => Number(point.y.toFixed(2)))
        .sort((a, b) => a - b);

      const nextPrimaryCutoffY = initialCutoffYValues[0] ?? 80;
      const nextAdditionalCutoffs = initialCutoffYValues.slice(1, 2);
      const nextTableRows = buildTableGroupRows(
        initialCutoffPoints,
        nextCdfData.map(([x]) => x)
      );

      setCumulativeProportion(nextPrimaryCutoffY);
      setInitialCumulativeProportion(nextPrimaryCutoffY);
      setAdditionalSliders(nextAdditionalCutoffs);
      setInitialAdditionalSliders(nextAdditionalCutoffs);
      setTableGroupRows(nextTableRows);
    };

    fetchData();
  }, [stratificationMonth, subgroupId]);

  // 뒤로가기 버튼을 눌렀을 때 Subgroup Selection으로 이동하도록 처리
  useEffect(() => {
    // 현재 페이지를 history에 추가하고, 이전 페이지를 Subgroup Selection으로 교체
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      router.push("/tsi/subgroup-section");
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router]);

  // 슬라이더 값 계산 (3~24개월, 3의 배수)
  const minMonth = 3;
  const maxMonth = 24;
  const monthRange = maxMonth - minMonth;
  const monthPercentage = ((stratificationMonth - minMonth) / monthRange) * 100;

  const handleClickGenerateSubGroup = async () => {
    await getIdentificationSetInfo(
      MOCK_TASK_ID,
      subgroupId ?? "",
      stratificationMonth.toString(),
      cutoffAxisType,
      cutoffXValues,
      cutoffYValues
    );
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
                    {/* 슬라이더 영역 - 고정 너비로 24까지만 */}
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
                                const rawMonth = minMonth + (percentage / 100) * monthRange;
                                const steppedMonth = Math.round(rawMonth / 3) * 3;
                                const clampedMonth = Math.max(
                                  minMonth,
                                  Math.min(maxMonth, steppedMonth)
                                );
                                setStratificationMonth(clampedMonth);
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
                        {[3, 6, 9, 12, 15, 18, 21, 24].map((month, index) => {
                          // 각 라벨의 위치를 정확히 계산 (슬라이더 핸들과 정렬)
                          const labelPercentage = ((month - minMonth) / monthRange) * 100;
                          const isFirst = index === 0;
                          const isLast = index === [3, 6, 9, 12, 15, 18, 21, 24].length - 1;

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
                        value={stratificationMonth.toString()}
                        options={["3", "6", "9", "12", "15", "18", "21", "24"]}
                        onChange={(value) => setStratificationMonth(parseInt(value, 10))}
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
              selectedMonth={stratificationMonth}
            />
            {/* Generate Subgroups 버튼 */}
            <button
              className="text-body4 mt-auto ml-auto flex h-[42px] w-[236px] items-center justify-center gap-2 rounded-full px-6 py-[6px] font-semibold text-white"
              style={{
                backgroundColor:
                  stratificationMonth !== initialStratificationMonth ||
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
                    <MultiLineWithErrorBar dataGroup={MOCK_UP_DISEASE_CHART_DATA} />
                  </div>
                </div>

                {/* rHTE distribution */}
                <div
                  className="overㄹflow-hidden bg-primary-15 flex h-[432px] flex-1 flex-col rounded-[24px] p-5"
                  style={{
                    boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <h4 className="text-h4 mb-4 flex-shrink-0 text-white">Slope distribution</h4>
                  <div className="flex min-h-0 flex-1 items-center justify-center rounded-[12px] bg-white">
                    <DensityChart data={MOCK_DENSITY_DATA} />
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
                    {tableGroupRows.map((row, index) => (
                      <div
                        key={`${row.groupName}-${index}`}
                        className={`flex h-[42px] items-center gap-4 ${
                          index < tableGroupRows.length - 1 ? "border-neutral-80 border-b" : ""
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
