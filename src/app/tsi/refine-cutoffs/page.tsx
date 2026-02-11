"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AppLayout } from "@/components/layout/AppLayout";
import Select from "@/components/ui/select";
import ReactECharts from "echarts-for-react";

/**
 * TSI: Refine Cutoffs
 * 구조: 타이틀은 카드 밖, 왼쪽/오른쪽 카드
 * - 왼쪽 카드: 남색 카드에 슬라이더 (ATS LeftPanel 참고)
 * - 오른쪽 카드: 차트와 테이블
 */

export default function TSIRefineCutoffsPage() {
  const router = useRouter();
  const [stratificationMonth, setStratificationMonth] = useState(12);
  const [cumulativeProportion, setCumulativeProportion] = useState(80);
  const [safetyScoreCutoff, setSafetyScoreCutoff] = useState(1.3);
  const sliderRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(0);
  const [isEditingY, setIsEditingY] = useState(false);
  const [yInputValue, setYInputValue] = useState("");
  const yInputRef = useRef<HTMLInputElement>(null);
  const [editingAdditionalSliderIndex, setEditingAdditionalSliderIndex] =
    useState<number | null>(null);
  const [additionalSliderInputValue, setAdditionalSliderInputValue] =
    useState("");
  const additionalSliderInputRef = useRef<HTMLInputElement>(null);
  const [additionalSliders, setAdditionalSliders] = useState<number[]>([]);
  const [showAddButton, setShowAddButton] = useState(false);
  const [addButtonPosition, setAddButtonPosition] = useState<{
    x: number;
    y: number;
    proportion: number;
  } | null>(null);

  // 초기값 저장
  const initialStratificationMonth = 12;
  const initialCumulativeProportion = 80;

  // 컴포넌트 마운트 시 슬라이더 초기화
  useEffect(() => {
    setAdditionalSliders([]);
    setShowAddButton(false);
    setAddButtonPosition(null);
  }, []);

  // 뒤로가기 버튼을 눌렀을 때 Subgroup Selection으로 이동하도록 처리
  useEffect(() => {
    // 현재 페이지를 history에 추가하고, 이전 페이지를 Subgroup Selection으로 교체
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      router.push("/tsi/subgroup-selection");
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [router]);

  // 차트 컨테이너 너비 측정
  useEffect(() => {
    const updateChartWidth = () => {
      if (chartContainerRef.current) {
        setChartWidth(chartContainerRef.current.offsetWidth);
      }
    };

    updateChartWidth();
    window.addEventListener("resize", updateChartWidth);

    return () => {
      window.removeEventListener("resize", updateChartWidth);
    };
  }, []);

  // 차트 외부 클릭 시 + 버튼 숨기기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        showAddButton &&
        chartContainerRef.current &&
        !chartContainerRef.current.contains(e.target as Node)
      ) {
        setShowAddButton(false);
        setAddButtonPosition(null);
      }
    };

    if (showAddButton) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAddButton]);

  // 슬라이더 값 계산 (3~24개월, 3의 배수)
  const minMonth = 3;
  const maxMonth = 24;
  const monthRange = maxMonth - minMonth;
  const monthPercentage = ((stratificationMonth - minMonth) / monthRange) * 100;

  // Cumulative Proportion 슬라이더 (0~100%)
  const proportionPercentage = cumulativeProportion;

  // CDF 차트 데이터 생성 (로지스틱 함수 사용)
  const generateCDFData = () => {
    const data: number[][] = [];
    const minX = -5;
    const maxX = 5;
    const steps = 200;
    const stepSize = (maxX - minX) / steps;

    // 로지스틱 함수 파라미터 (S-커브 형태)
    const center = 0; // 중심점
    const steepness = 0.8; // 경사도

    for (let i = 0; i <= steps; i++) {
      const x = minX + i * stepSize;
      // 로지스틱 함수: y = 100 / (1 + e^(-steepness * (x - center)))
      const exponent = -steepness * (x - center);
      const y = 100 / (1 + Math.exp(exponent));
      data.push([x, y]);
    }
    return data;
  };

  const cdfData = useMemo(() => generateCDFData(), []);

  // 모든 슬라이더 값 정렬 (오름차순) - 기본 1개 + 추가 최대 1개 = 총 2개
  const sortedSliders = useMemo(() => {
    const limitedAdditional = additionalSliders.slice(0, 1);
    const all = [cumulativeProportion, ...limitedAdditional];
    return [...all].sort((a, b) => a - b);
  }, [cumulativeProportion, additionalSliders]);

  // 추가 슬라이더가 1개를 초과하면 자동으로 제한
  useEffect(() => {
    if (additionalSliders.length > 1) {
      console.warn(
        "[슬라이더 제한] 1개 초과 감지, 자동 제한:",
        additionalSliders.length,
      );
      setAdditionalSliders(additionalSliders.slice(0, 1));
    }
  }, [additionalSliders]);

  // cumulativeProportion에 해당하는 Safety Score 찾기
  useEffect(() => {
    // Y값에 가장 가까운 X값 찾기
    let closestIndex = 0;
    let minDiff = Infinity;
    for (let i = 0; i < cdfData.length; i++) {
      const diff = Math.abs(cdfData[i][1] - cumulativeProportion);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }
    setSafetyScoreCutoff(cdfData[closestIndex][0]);
  }, [cumulativeProportion, cdfData]);

  // 각 구간별 색상 정의
  const segmentColors = [
    { line: "#f06600", area: "rgba(240, 102, 0, 0.3)" }, // 주황색
    { line: "#3A11D8", area: "rgba(58, 17, 216, 0.3)" }, // 파란색
    { line: "#262255", area: "rgba(38, 34, 85, 0.3)" }, // 그룹3 색상
  ];

  // 차트 옵션
  const chartOption = useMemo(
    () => ({
      backgroundColor: "transparent",
      animation: false,
      grid: {
        left: "30px",
        right: "25px",
        top: "20px",
        bottom: "30px",
        containLabel: true,
      },
      xAxis: {
        type: "value",
        name: "Safety Score",
        nameLocation: "middle",
        nameGap: 25,
        min: -5,
        max: 5,
        interval: 1,
        splitLine: {
          show: false,
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
          alignWithLabel: false,
        },
        minorTick: {
          show: false,
        },
        axisLabel: {
          color: "#666",
          fontSize: 11,
          showMinLabel: true,
          showMaxLabel: true,
        },
        nameTextStyle: {
          color: "#333",
          fontSize: 9,
          fontWeight: 590,
          fontFamily: "Inter",
        },
      },
      yAxis: {
        type: "value",
        name: "cumulative proportion",
        nameLocation: "middle",
        nameGap: 30,
        nameRotate: 90,
        min: 0,
        max: 100,
        interval: 10,
        splitLine: {
          show: false,
        },
        axisLine: {
          show: true,
          onZero: false,
          lineStyle: {
            color: "#666",
          },
          symbol: ["none", "arrow"],
          symbolSize: [0, 8],
        },
        axisLabel: {
          color: "#666",
          fontSize: 11,
        },
        nameTextStyle: {
          color: "#333",
          fontSize: 9,
          fontWeight: 590,
          fontFamily: "Inter",
        },
      },
      series: (() => {
        const series: any[] = [];

        // Y값에 해당하는 Safety Score 찾기 함수
        const findSafetyScoreForProportion = (proportion: number) => {
          let closestIndex = 0;
          let minDiff = Infinity;
          for (let i = 0; i < cdfData.length; i++) {
            const diff = Math.abs(cdfData[i][1] - proportion);
            if (diff < minDiff) {
              minDiff = diff;
              closestIndex = i;
            }
          }
          return cdfData[closestIndex][0];
        };

        // 슬라이더가 없으면 기본 2개 색상
        if (sortedSliders.length === 1) {
          const cutoffScore = findSafetyScoreForProportion(sortedSliders[0]);
          series.push(
            {
              name: "CDF Orange",
              type: "line",
              data: cdfData.filter((point) => point[0] <= cutoffScore),
              smooth: true,
              lineStyle: {
                width: 2,
                color: segmentColors[0].line,
              },
              areaStyle: {
                color: {
                  type: "linear",
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: segmentColors[0].area },
                    { offset: 1, color: "rgba(240, 102, 0, 0.1)" },
                  ],
                },
              },
              symbol: "none",
            },
            {
              name: "CDF Blue",
              type: "line",
              data: cdfData.filter((point) => point[0] >= cutoffScore),
              smooth: true,
              lineStyle: {
                width: 2,
                color: segmentColors[1].line,
              },
              areaStyle: {
                color: {
                  type: "linear",
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: segmentColors[1].area },
                    { offset: 1, color: "rgba(58, 17, 216, 0.1)" },
                  ],
                },
              },
              symbol: "none",
            },
            {
              name: "Cutoff Point",
              type: "scatter",
              data: [[cutoffScore, sortedSliders[0]]],
              symbolSize: 10,
              itemStyle: {
                color: segmentColors[1].line,
              },
              z: 10,
            },
          );
        } else if (sortedSliders.length === 2) {
          // 2개 슬라이더: 3개 구간
          const score1 = findSafetyScoreForProportion(sortedSliders[0]);
          const score2 = findSafetyScoreForProportion(sortedSliders[1]);

          series.push(
            {
              name: "CDF Segment 1",
              type: "line",
              data: cdfData.filter((point) => point[0] <= score1),
              smooth: true,
              lineStyle: {
                width: 2,
                color: segmentColors[0].line,
              },
              areaStyle: {
                color: {
                  type: "linear",
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: segmentColors[0].area },
                    { offset: 1, color: "rgba(240, 102, 0, 0.1)" },
                  ],
                },
              },
              symbol: "none",
            },
            {
              name: "CDF Segment 2",
              type: "line",
              data: cdfData.filter(
                (point) => point[0] > score1 && point[0] <= score2,
              ),
              smooth: true,
              lineStyle: {
                width: 2,
                color: segmentColors[1].line,
              },
              areaStyle: {
                color: {
                  type: "linear",
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: segmentColors[1].area },
                    { offset: 1, color: "rgba(58, 17, 216, 0.1)" },
                  ],
                },
              },
              symbol: "none",
            },
            {
              name: "CDF Segment 3",
              type: "line",
              data: cdfData.filter((point) => point[0] > score2),
              smooth: true,
              lineStyle: {
                width: 2,
                color: segmentColors[2].line,
              },
              areaStyle: {
                color: {
                  type: "linear",
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: segmentColors[2].area },
                    { offset: 1, color: "rgba(38, 34, 85, 0.1)" },
                  ],
                },
              },
              symbol: "none",
            },
            {
              name: "Cutoff Points",
              type: "scatter",
              data: sortedSliders.map((prop) => [
                findSafetyScoreForProportion(prop),
                prop,
              ]),
              symbolSize: 10,
              itemStyle: {
                color: segmentColors[1].line,
              },
              z: 10,
            },
          );
        }

        // X축 라인 추가
        series.push({
          name: "X Axis Line",
          type: "line",
          data: [
            [-5, 0],
            [5, 0],
          ],
          lineStyle: {
            color: "#666",
            width: 1,
          },
          symbol: ["none", "arrow"],
          symbolSize: [0, 8],
          z: 5,
        });

        // 수직선과 수평선 - 슬라이더 개수에 맞게 생성
        sortedSliders.forEach((proportion, index) => {
          const score = findSafetyScoreForProportion(proportion);
          series.push(
            {
              name: `Vertical Line ${index}`,
              type: "line",
              data: [
                [score, 0],
                [score, 100],
              ],
              lineStyle: {
                type: "dashed",
                color: "#999",
                width: 1,
              },
              symbol: "none",
              z: 5,
            },
            {
              name: `Horizontal Line ${index}`,
              type: "line",
              data: [
                [-5, proportion],
                [5, proportion],
              ],
              lineStyle: {
                type: "dashed",
                color: "#999",
                width: 1,
              },
              symbol: "none",
              z: 5,
            },
          );
        });

        return series;
      })(),
      tooltip: {
        trigger: "none",
      },
    }),
    [cdfData, sortedSliders],
  );

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
      <div className="w-full flex flex-col items-center">
        {/* 타이틀: 카드 밖 */}
        <div className="w-full flex justify-center mb-2 max-w-full">
          <div className="w-[1772px] max-w-full flex-shrink-0 mx-auto">
            <div className="flex flex-col gap-1 flex-shrink-0 items-start">
              <div className="text-title text-neutral-5 text-left mb-2">
                Target Subgroup Identification
              </div>
              <p className="text-body2m text-neutral-50 text-left">
                Optimize study design
              </p>
            </div>
          </div>
        </div>

        {/* 메인: 왼쪽/오른쪽 카드 */}
        <div className="w-[1772px] flex-shrink-0 mx-auto flex flex-row flex-nowrap gap-2 items-stretch">
          {/* 왼쪽 카드 */}
          <div
            className="gap-3 w-[536px] h-[762px] flex-shrink-0 rounded-[36px] overflow-hidden flex flex-col p-3 bg-white"
            style={{
              backgroundImage: "url(/assets/tsi/refine-left.png)",
              backgroundSize: "536px 762px",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div className="flex flex-col w-full min-h-0 gap-0">
              {/* 남색 카드: Subgroup Creation */}
              <div
                className="rounded-[24px] flex-shrink-0 flex flex-col items-start gap-4"
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
                  <span className="text-body2 text-white font-semibold">
                    Safety Score
                  </span>
                </div>

                {/* Stratification month 슬라이더 */}
                <div className="flex flex-col gap-2 w-full">
                  <span className="text-body3m text-white">
                    Stratification month
                  </span>
                  {/* 슬라이더와 드롭다운 - 같은 선상에 배치, 우측 정렬 */}
                  <div className="flex items-start justify-between w-full">
                    {/* 슬라이더 영역 - 고정 너비로 24까지만 */}
                    <div
                      className="flex flex-col gap-1 flex-shrink-0"
                      style={{ width: "400px" }}
                    >
                      {/* 슬라이더 */}
                      <div
                        className="relative select-none h-[24px] flex items-center"
                        style={{
                          userSelect: "none",
                          width: "100%", // 부모 컨테이너의 100%
                        }}
                      >
                        {/* 슬라이더 트랙 */}
                        <div className="w-full h-[12px] rounded-full bg-neutral-50 relative">
                          {/* 채워진 부분 (주황색) */}
                          <div
                            className="h-[12px] rounded-full absolute top-0 left-0"
                            style={{
                              width: `${Math.max(0, Math.min(100, monthPercentage))}%`,
                              background: "#f06600",
                            }}
                          />
                          {/* 슬라이더 핸들 */}
                          <div
                            className="absolute top-1/2 -translate-y-1/2 w-[24px] h-[24px] rounded-full bg-white cursor-grab active:cursor-grabbing shadow-sm"
                            style={{
                              left: `calc(${Math.max(0, Math.min(100, monthPercentage))}% - 12px)`,
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const slider =
                                e.currentTarget.parentElement?.parentElement;
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
                              const handleMouseMove = (
                                moveEvent: MouseEvent,
                              ) => {
                                moveEvent.preventDefault();
                                const rect = slider.getBoundingClientRect();
                                const x = moveEvent.clientX - rect.left;
                                const percentage = Math.max(
                                  0,
                                  Math.min(100, (x / rect.width) * 100),
                                );
                                const rawMonth =
                                  minMonth + (percentage / 100) * monthRange;
                                const steppedMonth =
                                  Math.round(rawMonth / 3) * 3;
                                const clampedMonth = Math.max(
                                  minMonth,
                                  Math.min(maxMonth, steppedMonth),
                                );
                                setStratificationMonth(clampedMonth);
                              };
                              const handleMouseUp = (upEvent: MouseEvent) => {
                                upEvent.preventDefault();
                                upEvent.stopPropagation();
                                document.removeEventListener(
                                  "mousemove",
                                  handleMouseMove,
                                );
                                document.removeEventListener(
                                  "mouseup",
                                  handleMouseUp,
                                );
                                document.removeEventListener(
                                  "selectstart",
                                  preventSelect,
                                );
                                document.removeEventListener(
                                  "select",
                                  preventSelect,
                                );
                                document.removeEventListener(
                                  "dragstart",
                                  preventDrag,
                                );
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
                              document.addEventListener(
                                "mousemove",
                                handleMouseMove,
                                { passive: false },
                              );
                              document.addEventListener(
                                "mouseup",
                                handleMouseUp,
                                {
                                  passive: false,
                                },
                              );
                              document.addEventListener(
                                "selectstart",
                                preventSelect,
                              );
                              document.addEventListener(
                                "select",
                                preventSelect,
                              );
                              document.addEventListener(
                                "dragstart",
                                preventDrag,
                              );
                            }}
                          />
                        </div>
                      </div>
                      {/* 슬라이더 하단 눈금 라벨 - 정확한 위치 계산 */}
                      <div
                        className="relative text-body5 text-white/70 overflow-hidden"
                        style={{ width: "100%", height: "13px" }}
                      >
                        {[3, 6, 9, 12, 15, 18, 21, 24].map((month, index) => {
                          // 각 라벨의 위치를 정확히 계산 (슬라이더 핸들과 정렬)
                          const labelPercentage =
                            ((month - minMonth) / monthRange) * 100;
                          const isFirst = index === 0;
                          const isLast =
                            index === [3, 6, 9, 12, 15, 18, 21, 24].length - 1;

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
                        onChange={(value) =>
                          setStratificationMonth(parseInt(value, 10))
                        }
                        className="w-[52px] [&>button]:bg-neutral-95 [&>button]:h-[24px] [&>button]:py-[6px] [&>button]:px-2 [&>button]:justify-between [&>button]:items-center [&>button]:rounded-[8px] [&>button]:border-0 [&>button>span]:text-body5 [&>button>span]:text-neutral-5 [&>button>span]:font-semibold [&>button>span]:text-left [&>button>svg]:flex-shrink-0"
                      />
                    </div>
                  </div>
                </div>

                {/* Apply Criteria 버튼 */}
                <button className="w-[124px] h-[30px] rounded-full bg-neutral-70 text-body5 text-white font-semibold flex items-center justify-center ml-auto mt-auto">
                  Apply Criteria
                </button>
              </div>
            </div>

            {/* 흰색 카드: 차트 */}
            <div
              className="h-[400px] flex-shrink-0 rounded-[24px] overflow-hidden bg-white flex flex-col p-0"
              style={{
                boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div className="flex flex-col h-full">
                {/* 차트 영역 */}
                <div
                  ref={chartContainerRef}
                  className="flex-1 min-h-0 bg-white rounded-[12px] relative"
                  onMouseMove={(e) => {
                    // 추가 슬라이더는 최대 1개까지만 추가 가능 (기본 1개 포함 총 2개)
                    if (additionalSliders.length >= 1) {
                      setShowAddButton(false);
                      setAddButtonPosition(null);
                      return;
                    }

                    const rect =
                      chartContainerRef.current?.getBoundingClientRect();
                    if (!rect) return;

                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;

                    // 그리드 영역 체크 (left: 30px, top: 20px, bottom: 30px)
                    const gridLeft = 30;
                    const gridRight = 25;
                    const gridTop = 20;
                    const gridBottom = 30;
                    const gridHeight = rect.height - gridTop - gridBottom;
                    const gridWidth = rect.width - gridLeft - gridRight;
                    const gridStartY = gridTop;
                    const gridStartX = gridLeft;

                    // 클릭한 위치가 그리드 영역 내인지 확인
                    if (
                      mouseY >= gridStartY &&
                      mouseY <= gridStartY + gridHeight &&
                      mouseX >= gridStartX &&
                      mouseX <= gridStartX + gridWidth
                    ) {
                      // X 좌표를 Safety Score로 변환 (-5 ~ 5)
                      const relativeX = mouseX - gridStartX;
                      const safetyScore = -5 + (relativeX / gridWidth) * 10;

                      // 해당 Safety Score에 해당하는 CDF 값 찾기
                      let closestCdfValue = 0;
                      let minDiff = Infinity;
                      for (let i = 0; i < cdfData.length; i++) {
                        const diff = Math.abs(cdfData[i][0] - safetyScore);
                        if (diff < minDiff) {
                          minDiff = diff;
                          closestCdfValue = cdfData[i][1];
                        }
                      }

                      // Y 좌표를 cumulative proportion으로 변환 (0-100)
                      const relativeY = mouseY - gridStartY;
                      const clickProportion =
                        100 - (relativeY / gridHeight) * 100;

                      // 그래프 라인 근처인지 확인 (5% 이내)
                      if (Math.abs(clickProportion - closestCdfValue) <= 5) {
                        const clampedProportion = Math.max(
                          0,
                          Math.min(100, Math.round(clickProportion)),
                        );

                        // 기존 슬라이더와 겹치지 않는지 확인 (최소 5% 간격)
                        const allProportions = [
                          cumulativeProportion,
                          ...additionalSliders,
                        ];
                        const isOverlapping = allProportions.some(
                          (p) => Math.abs(p - clampedProportion) < 5,
                        );

                        if (!isOverlapping) {
                          setAddButtonPosition({
                            x: mouseX,
                            y: mouseY,
                            proportion: clampedProportion,
                          });
                          setShowAddButton(true);
                        } else {
                          setShowAddButton(false);
                          setAddButtonPosition(null);
                        }
                      } else {
                        setShowAddButton(false);
                        setAddButtonPosition(null);
                      }
                    } else {
                      setShowAddButton(false);
                      setAddButtonPosition(null);
                    }
                  }}
                  onMouseLeave={() => {
                    setShowAddButton(false);
                    setAddButtonPosition(null);
                  }}
                  onClick={(e) => {
                    // 슬라이더나 다른 요소 클릭 시 무시
                    if (
                      (e.target as HTMLElement).closest(".slider-handle") ||
                      (e.target as HTMLElement).closest(".add-button")
                    ) {
                      return;
                    }

                    // 추가 슬라이더는 최대 1개까지만 추가 가능 (기본 1개 포함 총 2개)
                    if (additionalSliders.length >= 1) {
                      console.log(
                        "[차트 클릭] 최대 개수 초과:",
                        additionalSliders.length,
                      );
                      return;
                    }

                    // + 버튼이 표시되어 있고 클릭한 경우
                    if (showAddButton && addButtonPosition) {
                      // 다시 한번 최대 개수 확인
                      if (additionalSliders.length >= 1) {
                        console.log(
                          "[차트 클릭] + 버튼 클릭 시 최대 개수 초과:",
                          additionalSliders.length,
                        );
                        setShowAddButton(false);
                        setAddButtonPosition(null);
                        return;
                      }

                      // 기존 슬라이더와 겹치지 않는지 확인
                      const allProportions = [
                        cumulativeProportion,
                        ...additionalSliders,
                      ];
                      const isOverlapping = allProportions.some(
                        (p) => Math.abs(p - addButtonPosition.proportion) < 5,
                      );

                      if (!isOverlapping) {
                        console.log("[차트 클릭] 슬라이더 추가:", {
                          현재개수: additionalSliders.length,
                          추가할값: addButtonPosition.proportion,
                          전체슬라이더: [
                            ...additionalSliders,
                            addButtonPosition.proportion,
                          ],
                        });
                        setAdditionalSliders([
                          ...additionalSliders,
                          addButtonPosition.proportion,
                        ]);
                        setShowAddButton(false);
                        setAddButtonPosition(null);
                      } else {
                        console.log("[차트 클릭] 겹침으로 인해 추가 불가");
                      }
                    }
                  }}
                >
                  <ReactECharts
                    option={chartOption}
                    style={{ width: "100%", height: "100%" }}
                    opts={{ renderer: "svg" }}
                  />

                  {/* 세로 슬라이더 - Y축 우측, 차트 플롯 영역에 맞춤 */}
                  <div className="absolute left-[80px] top-[20px] bottom-[50px] z-10 flex flex-col items-center justify-center pointer-events-none">
                    <div
                      ref={sliderRef}
                      className="relative w-6 h-full flex items-center justify-center pointer-events-auto"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        const slider = sliderRef.current;
                        if (!slider) return;

                        const preventSelect = (event: Event) => {
                          event.preventDefault();
                          return false;
                        };

                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          moveEvent.preventDefault();
                          const rect = slider.getBoundingClientRect();
                          const y = moveEvent.clientY - rect.top;
                          let percentage = Math.max(
                            0,
                            Math.min(
                              100,
                              ((rect.height - y) / rect.height) * 100,
                            ),
                          );

                          // 교차 방지: 추가 슬라이더들과 겹치지 않도록
                          const sorted = [...additionalSliders].sort(
                            (a, b) => a - b,
                          );
                          const currentPosition = cumulativeProportion;

                          console.log("[기본 슬라이더 드래그]", {
                            원래값: percentage,
                            추가슬라이더들: sorted,
                            현재위치: currentPosition,
                          });

                          if (sorted.length === 1) {
                            // 추가 슬라이더 1개
                            if (currentPosition < sorted[0]) {
                              // 현재가 아래에 있으면 위로 올라갈 수 없음
                              if (percentage >= sorted[0]) {
                                percentage = Math.max(0, sorted[0] - 1);
                                console.log(
                                  "[기본 슬라이더] 제한됨 - 위로 올라갈 수 없음:",
                                  percentage,
                                );
                              }
                            } else {
                              // 현재가 위에 있으면 아래로 내려갈 수 없음
                              if (percentage <= sorted[0]) {
                                percentage = Math.min(100, sorted[0] + 1);
                                console.log(
                                  "[기본 슬라이더] 제한됨 - 아래로 내려갈 수 없음:",
                                  percentage,
                                );
                              }
                            }
                          } else if (sorted.length === 2) {
                            // 추가 슬라이더 2개
                            if (currentPosition < sorted[0]) {
                              // 현재가 가장 아래: 위로 올라갈 수 없음
                              if (percentage >= sorted[0]) {
                                percentage = Math.max(0, sorted[0] - 1);
                                console.log(
                                  "[기본 슬라이더] 제한됨 - 가장 아래, 위로 올라갈 수 없음:",
                                  percentage,
                                );
                              }
                            } else if (currentPosition > sorted[1]) {
                              // 현재가 가장 위: 아래로 내려갈 수 없음
                              if (percentage <= sorted[1]) {
                                percentage = Math.min(100, sorted[1] + 1);
                                console.log(
                                  "[기본 슬라이더] 제한됨 - 가장 위, 아래로 내려갈 수 없음:",
                                  percentage,
                                );
                              }
                            } else {
                              // 현재가 중간: 양쪽 모두 제한
                              if (percentage <= sorted[0]) {
                                percentage = Math.max(0, sorted[0] + 1);
                                console.log(
                                  "[기본 슬라이더] 제한됨 - 중간, 첫번째 아래로:",
                                  percentage,
                                );
                              } else if (percentage >= sorted[1]) {
                                percentage = Math.min(100, sorted[1] - 1);
                                console.log(
                                  "[기본 슬라이더] 제한됨 - 중간, 두번째 위로:",
                                  percentage,
                                );
                              }
                            }
                          }

                          console.log(
                            "[기본 슬라이더] 최종값:",
                            Math.round(percentage),
                          );
                          setCumulativeProportion(Math.round(percentage));
                        };

                        const handleMouseUp = () => {
                          document.removeEventListener(
                            "mousemove",
                            handleMouseMove,
                          );
                          document.removeEventListener(
                            "mouseup",
                            handleMouseUp,
                          );
                          document.removeEventListener(
                            "selectstart",
                            preventSelect,
                          );
                          const bodyStyle = document.body.style as any;
                          bodyStyle.userSelect = "";
                          bodyStyle.webkitUserSelect = "";
                        };

                        document.addEventListener("mousemove", handleMouseMove);
                        document.addEventListener("mouseup", handleMouseUp);
                        document.addEventListener("selectstart", preventSelect);
                        const bodyStyle = document.body.style as any;
                        bodyStyle.userSelect = "none";
                        bodyStyle.webkitUserSelect = "none";

                        // 초기 위치 설정
                        const rect = slider.getBoundingClientRect();
                        const y = e.clientY - rect.top;
                        let percentage = Math.max(
                          0,
                          Math.min(
                            100,
                            ((rect.height - y) / rect.height) * 100,
                          ),
                        );

                        // 교차 방지: 추가 슬라이더들과 겹치지 않도록
                        const sorted = [...additionalSliders].sort(
                          (a, b) => a - b,
                        );
                        const currentPosition = cumulativeProportion;

                        if (sorted.length === 1) {
                          if (currentPosition < sorted[0]) {
                            // 현재가 아래에 있으면 위로 올라갈 수 없음
                            if (percentage >= sorted[0]) {
                              percentage = Math.max(0, sorted[0] - 1);
                            }
                          } else {
                            // 현재가 위에 있으면 아래로 내려갈 수 없음
                            if (percentage <= sorted[0]) {
                              percentage = Math.min(100, sorted[0] + 1);
                            }
                          }
                        } else if (sorted.length === 2) {
                          if (currentPosition < sorted[0]) {
                            // 현재가 가장 아래: 위로 올라갈 수 없음
                            if (percentage >= sorted[0]) {
                              percentage = Math.max(0, sorted[0] - 1);
                            }
                          } else if (currentPosition > sorted[1]) {
                            // 현재가 가장 위: 아래로 내려갈 수 없음
                            if (percentage <= sorted[1]) {
                              percentage = Math.min(100, sorted[1] + 1);
                            }
                          } else {
                            // 현재가 중간: 양쪽 모두 제한
                            if (percentage <= sorted[0]) {
                              percentage = Math.max(0, sorted[0] + 1);
                            } else if (percentage >= sorted[1]) {
                              percentage = Math.min(100, sorted[1] - 1);
                            }
                          }
                        }

                        setCumulativeProportion(Math.round(percentage));
                      }}
                    >
                      {/* 슬라이더 트랙 */}
                      <div className="absolute w-0 h-full bg-white rounded-full"></div>
                      {/* 기본 슬라이더 핸들 */}
                      {(() => {
                        console.log("[기본 슬라이더 렌더링]", {
                          cumulativeProportion,
                          additionalSliders,
                          전체슬라이더: [
                            cumulativeProportion,
                            ...additionalSliders,
                          ],
                        });
                        return (
                          <div
                            className="absolute w-[38px] h-[24px] rounded-full cursor-grab active:cursor-grabbing z-100 slider-handle"
                            style={{
                              bottom: `${cumulativeProportion}%`,
                              transform: "translateY(50%)",
                              border: `1px solid ${cumulativeProportion !== initialCumulativeProportion || additionalSliders.length > 0 ? "#BFB0F8" : "#E2E1E5"}`,
                              backgroundColor:
                                cumulativeProportion !==
                                  initialCumulativeProportion ||
                                additionalSliders.length > 0
                                  ? "#EBE6FD"
                                  : "#FFFFFF",
                            }}
                            onClick={(e) => e.stopPropagation()}
                          ></div>
                        );
                      })()}
                      {/* 추가 슬라이더 핸들들 - 같은 컨테이너 안에 (최대 1개) */}
                      {additionalSliders
                        .slice(0, 1)
                        .map((proportion, index) => {
                          console.log(
                            `[추가 슬라이더 렌더링] 인덱스: ${index}, 값: ${proportion}, 전체배열:`,
                            additionalSliders,
                          );
                          return (
                            <div
                              key={`additional-slider-${proportion}-${index}`}
                              className="absolute w-[38px] h-[24px] rounded-full cursor-grab active:cursor-grabbing z-100 slider-handle"
                              style={{
                                bottom: `${proportion}%`,
                                transform: "translateY(50%)",
                                border: "1px solid #BFB0F8",
                                backgroundColor: "#EBE6FD", // 추가 슬라이더는 항상 수정된 상태로 표시
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const sliderContainer = sliderRef.current;
                                if (!sliderContainer) return;

                                // 현재 슬라이더의 원래 인덱스 저장
                                const currentIndex = index;

                                const preventSelect = (event: Event) => {
                                  event.preventDefault();
                                  return false;
                                };

                                const handleMouseMove = (
                                  moveEvent: MouseEvent,
                                ) => {
                                  moveEvent.preventDefault();
                                  const rect =
                                    sliderContainer.getBoundingClientRect();
                                  const y = moveEvent.clientY - rect.top;
                                  let newProportion = Math.max(
                                    0,
                                    Math.min(
                                      100,
                                      Math.round(
                                        ((rect.height - y) / rect.height) * 100,
                                      ),
                                    ),
                                  );

                                  // 모든 슬라이더 값 가져오기 (현재 슬라이더 제외)
                                  const otherProportions = [
                                    cumulativeProportion,
                                    ...additionalSliders.filter(
                                      (_, i) => i !== currentIndex,
                                    ),
                                  ];
                                  const sorted = [...otherProportions].sort(
                                    (a, b) => a - b,
                                  );

                                  // 현재 슬라이더의 원래 위치
                                  const currentProportion =
                                    additionalSliders[currentIndex];

                                  console.log(
                                    `[추가 슬라이더 ${currentIndex} 드래그]`,
                                    {
                                      인덱스: currentIndex,
                                      원래값: newProportion,
                                      현재위치: currentProportion,
                                      다른슬라이더들: sorted,
                                      전체추가슬라이더: additionalSliders,
                                    },
                                  );

                                  // 교차 방지: 다른 슬라이더들 사이에만 이동 가능
                                  if (sorted.length === 1) {
                                    // 기본 슬라이더 1개만 있는 경우
                                    if (currentProportion < sorted[0]) {
                                      // 현재가 아래에 있으면 위로 올라갈 수 없음
                                      if (newProportion >= sorted[0]) {
                                        newProportion = Math.max(
                                          0,
                                          sorted[0] - 1,
                                        );
                                        console.log(
                                          `[추가 슬라이더 ${currentIndex}] 제한됨 - 위로 올라갈 수 없음:`,
                                          newProportion,
                                        );
                                      }
                                    } else {
                                      // 현재가 위에 있으면 아래로 내려갈 수 없음
                                      if (newProportion <= sorted[0]) {
                                        newProportion = Math.min(
                                          100,
                                          sorted[0] + 1,
                                        );
                                        console.log(
                                          `[추가 슬라이더 ${currentIndex}] 제한됨 - 아래로 내려갈 수 없음:`,
                                          newProportion,
                                        );
                                      }
                                    }
                                  } else if (sorted.length === 2) {
                                    // 기본 슬라이더 + 다른 추가 슬라이더 1개
                                    if (currentProportion < sorted[0]) {
                                      // 현재가 가장 아래: 위로 올라갈 수 없음
                                      if (newProportion >= sorted[0]) {
                                        newProportion = Math.max(
                                          0,
                                          sorted[0] - 1,
                                        );
                                        console.log(
                                          `[추가 슬라이더 ${currentIndex}] 제한됨 - 가장 아래, 위로 올라갈 수 없음:`,
                                          newProportion,
                                        );
                                      }
                                    } else if (currentProportion > sorted[1]) {
                                      // 현재가 가장 위: 아래로 내려갈 수 없음
                                      if (newProportion <= sorted[1]) {
                                        newProportion = Math.min(
                                          100,
                                          sorted[1] + 1,
                                        );
                                        console.log(
                                          `[추가 슬라이더 ${currentIndex}] 제한됨 - 가장 위, 아래로 내려갈 수 없음:`,
                                          newProportion,
                                        );
                                      }
                                    } else {
                                      // 현재가 중간: 양쪽 모두 제한
                                      if (newProportion <= sorted[0]) {
                                        newProportion = Math.max(
                                          0,
                                          sorted[0] + 1,
                                        );
                                        console.log(
                                          `[추가 슬라이더 ${currentIndex}] 제한됨 - 중간, 첫번째 아래로:`,
                                          newProportion,
                                        );
                                      } else if (newProportion >= sorted[1]) {
                                        newProportion = Math.min(
                                          100,
                                          sorted[1] - 1,
                                        );
                                        console.log(
                                          `[추가 슬라이더 ${currentIndex}] 제한됨 - 중간, 두번째 위로:`,
                                          newProportion,
                                        );
                                      }
                                    }
                                  }

                                  console.log(
                                    `[추가 슬라이더 ${currentIndex}] 최종값:`,
                                    newProportion,
                                  );
                                  const updatedSliders = [...additionalSliders];
                                  updatedSliders[currentIndex] = newProportion;
                                  console.log(
                                    `[추가 슬라이더 ${currentIndex}] 업데이트된 배열:`,
                                    updatedSliders,
                                  );
                                  setAdditionalSliders(updatedSliders);
                                };

                                const handleMouseUp = () => {
                                  document.removeEventListener(
                                    "mousemove",
                                    handleMouseMove,
                                  );
                                  document.removeEventListener(
                                    "mouseup",
                                    handleMouseUp,
                                  );
                                  document.removeEventListener(
                                    "selectstart",
                                    preventSelect,
                                  );
                                  const bodyStyle = document.body.style as any;
                                  bodyStyle.userSelect = "";
                                  bodyStyle.webkitUserSelect = "";
                                };

                                document.addEventListener(
                                  "mousemove",
                                  handleMouseMove,
                                );
                                document.addEventListener(
                                  "mouseup",
                                  handleMouseUp,
                                );
                                document.addEventListener(
                                  "selectstart",
                                  preventSelect,
                                );
                                const bodyStyle = document.body.style as any;
                                bodyStyle.userSelect = "none";
                                bodyStyle.webkitUserSelect = "none";
                              }}
                            ></div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Y값 라벨 - Y값의 한 틱 아래 위치에 표시 */}
                  {isEditingY ? (
                    <div
                      className="absolute z-10"
                      style={{
                        left: `70px`,
                        top: `calc(  (350px * (100 - ${Math.max(0, cumulativeProportion - 14)}) / 100))`,
                      }}
                    >
                      <input
                        ref={yInputRef}
                        type="number"
                        min="0"
                        max="100"
                        value={yInputValue}
                        onChange={(e) => setYInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const value = parseInt(yInputValue, 10);
                            if (!isNaN(value) && value >= 0 && value <= 100) {
                              setCumulativeProportion(value);
                              setIsEditingY(false);
                            }
                          } else if (e.key === "Escape") {
                            setIsEditingY(false);
                            setYInputValue("");
                          }
                        }}
                        onBlur={() => {
                          const value = parseInt(yInputValue, 10);
                          if (!isNaN(value) && value >= 0 && value <= 100) {
                            setCumulativeProportion(value);
                          }
                          setIsEditingY(false);
                          setYInputValue("");
                        }}
                        className="text-body5m px-1 py-0 border border-gray-300 rounded bg-white text-[#929090] text-center"
                        style={{
                          width: "40px",
                          height: "21px",
                        }}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div
                      className="absolute text-body5m z-10 cursor-pointer hover:opacity-70 select-none"
                      style={{
                        left: `70px`,
                        top: `calc(  (350px * (100 - ${Math.max(0, cumulativeProportion - 12)}) / 100))`,
                        color: "#929090",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        MozUserSelect: "none",
                        msUserSelect: "none",
                      }}
                      onClick={() => {
                        setIsEditingY(true);
                        setYInputValue(cumulativeProportion.toString());
                        setTimeout(() => {
                          yInputRef.current?.focus();
                        }, 0);
                      }}
                    >
                      Y={cumulativeProportion}%
                    </div>
                  )}
                  {/* X값 라벨 - 점의 우측 아래 위치에 표시 */}
                  {(() => {
                    // 점의 위치 계산
                    const gridLeft = 30;
                    const gridRight = 25;
                    const gridTop = 20;
                    const gridBottom = 30;
                    const gridHeight = 350; // 400px - 20px - 30px
                    const gridWidth = chartWidth > 0 ? chartWidth - 55 : 400; // chartWidth - gridLeft(30) - gridRight(25)
                    const chartContainerWidth =
                      chartWidth > 0 ? chartWidth : 400;

                    // 점의 X 좌표
                    const pointX =
                      gridLeft + ((safetyScoreCutoff + 5) / 10) * gridWidth;
                    // 점의 Y 좌표
                    const pointY =
                      gridTop +
                      ((100 - cumulativeProportion) / 100) * gridHeight;

                    // 라벨이 잘릴지 확인 (라벨 너비 약 60px 가정)
                    const labelWidth = 60;
                    const labelX = pointX + 18;
                    const willOverflow =
                      labelX + labelWidth > chartContainerWidth - gridRight;

                    return (
                      <div
                        className="absolute text-body5m z-10 select-none"
                        style={{
                          ...(willOverflow
                            ? {
                                right: `${chartContainerWidth - pointX + 18}px`,
                              }
                            : { left: `${pointX + 18}px` }),
                          top: `${pointY + 4}px`,
                          color: "#929090",
                          userSelect: "none",
                          WebkitUserSelect: "none",
                          MozUserSelect: "none",
                          msUserSelect: "none",
                        }}
                      >
                        X={safetyScoreCutoff.toFixed(2)}
                      </div>
                    );
                  })()}

                  {/* + 버튼 - 그래프 위 마우스 오버 시 표시 */}
                  {showAddButton && addButtonPosition && (
                    <div
                      className="absolute z-20 cursor-pointer add-button"
                      style={{
                        left: `${addButtonPosition.x}px`,
                        top: `${addButtonPosition.y}px`,
                        transform: "translate(-50%, -50%)",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        // 추가 슬라이더는 최대 1개까지만 추가 가능 (기본 1개 포함 총 2개)
                        if (additionalSliders.length >= 1) {
                          console.log(
                            "[+ 버튼 클릭] 최대 개수 초과:",
                            additionalSliders.length,
                          );
                          setShowAddButton(false);
                          setAddButtonPosition(null);
                          return;
                        }

                        // 기존 슬라이더와 겹치지 않는지 확인
                        const allProportions = [
                          cumulativeProportion,
                          ...additionalSliders,
                        ];
                        const isOverlapping = allProportions.some(
                          (p) => Math.abs(p - addButtonPosition.proportion) < 5,
                        );

                        if (!isOverlapping) {
                          console.log("[+ 버튼 클릭] 슬라이더 추가:", {
                            현재개수: additionalSliders.length,
                            추가할값: addButtonPosition.proportion,
                            전체슬라이더: [
                              ...additionalSliders,
                              addButtonPosition.proportion,
                            ],
                          });
                          setAdditionalSliders([
                            ...additionalSliders,
                            addButtonPosition.proportion,
                          ]);
                        } else {
                          console.log("[+ 버튼 클릭] 겹침으로 인해 추가 불가");
                        }
                        setShowAddButton(false);
                        setAddButtonPosition(null);
                      }}
                    >
                      <div className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center shadow-sm hover:bg-gray-50 add-button">
                        <span className="text-sm text-gray-700">+</span>
                      </div>
                    </div>
                  )}

                  {/* 추가 슬라이더 Y값 라벨들 (최대 1개) */}
                  {additionalSliders.slice(0, 1).map((proportion, index) => {
                    // 추가 슬라이더의 proportion에 해당하는 Safety Score 찾기
                    let closestIndex = 0;
                    let minDiff = Infinity;
                    for (let i = 0; i < cdfData.length; i++) {
                      const diff = Math.abs(cdfData[i][1] - proportion);
                      if (diff < minDiff) {
                        minDiff = diff;
                        closestIndex = i;
                      }
                    }
                    const additionalSliderSafetyScore =
                      cdfData[closestIndex][0];

                    return (
                      <div
                        key={`additional-slider-labels-${proportion}-${index}`}
                      >
                        {editingAdditionalSliderIndex === index ? (
                          <div
                            key={`additional-label-input-${proportion}-${index}`}
                            className="absolute z-10"
                            style={{
                              left: `70px`,
                              top: `calc(  (350px * (100 - ${Math.max(0, proportion - 12)}) / 100))`,
                            }}
                          >
                            <input
                              ref={additionalSliderInputRef}
                              type="number"
                              min="0"
                              max="100"
                              value={additionalSliderInputValue}
                              onChange={(e) =>
                                setAdditionalSliderInputValue(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const value = parseInt(
                                    additionalSliderInputValue,
                                    10,
                                  );
                                  if (
                                    !isNaN(value) &&
                                    value >= 0 &&
                                    value <= 100
                                  ) {
                                    // 교차 방지: 기본 슬라이더와 겹치지 않는지 확인
                                    const allProportions = [
                                      cumulativeProportion,
                                      ...additionalSliders.filter(
                                        (_, i) => i !== index,
                                      ),
                                    ];
                                    const isOverlapping = allProportions.some(
                                      (p) => Math.abs(p - value) < 5,
                                    );

                                    if (!isOverlapping) {
                                      const updatedSliders = [
                                        ...additionalSliders,
                                      ];
                                      updatedSliders[index] = value;
                                      setAdditionalSliders(updatedSliders);
                                      setEditingAdditionalSliderIndex(null);
                                    }
                                  }
                                } else if (e.key === "Escape") {
                                  setEditingAdditionalSliderIndex(null);
                                  setAdditionalSliderInputValue("");
                                }
                              }}
                              onBlur={() => {
                                const value = parseInt(
                                  additionalSliderInputValue,
                                  10,
                                );
                                if (
                                  !isNaN(value) &&
                                  value >= 0 &&
                                  value <= 100
                                ) {
                                  // 교차 방지: 기본 슬라이더와 겹치지 않는지 확인
                                  const allProportions = [
                                    cumulativeProportion,
                                    ...additionalSliders.filter(
                                      (_, i) => i !== index,
                                    ),
                                  ];
                                  const isOverlapping = allProportions.some(
                                    (p) => Math.abs(p - value) < 5,
                                  );

                                  if (!isOverlapping) {
                                    const updatedSliders = [
                                      ...additionalSliders,
                                    ];
                                    updatedSliders[index] = value;
                                    setAdditionalSliders(updatedSliders);
                                  }
                                }
                                setEditingAdditionalSliderIndex(null);
                                setAdditionalSliderInputValue("");
                              }}
                              className="text-body5m px-1 py-0 border border-gray-300 rounded bg-white text-[#929090] text-center"
                              style={{
                                width: "40px",
                                height: "21px",
                              }}
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div
                            key={`additional-label-${proportion}-${index}`}
                            className="absolute text-body5m z-10 cursor-pointer hover:opacity-70 select-none"
                            style={{
                              left: `70px`,
                              top: `calc(  (350px * (100 - ${Math.max(0, proportion - 12)}) / 100))`,
                              color: "#929090",
                              userSelect: "none",
                              WebkitUserSelect: "none",
                              MozUserSelect: "none",
                              msUserSelect: "none",
                            }}
                            onClick={() => {
                              setEditingAdditionalSliderIndex(index);
                              setAdditionalSliderInputValue(
                                proportion.toString(),
                              );
                              setTimeout(() => {
                                additionalSliderInputRef.current?.focus();
                              }, 0);
                            }}
                          >
                            Y={proportion}%
                          </div>
                        )}
                        {/* 추가 슬라이더 X값 라벨 - 점의 우측 아래 위치에 표시 */}
                        {(() => {
                          // 점의 위치 계산
                          const gridLeft = 30;
                          const gridRight = 25;
                          const gridTop = 20;
                          const gridBottom = 30;
                          const gridHeight = 350; // 400px - 20px - 30px
                          const gridWidth =
                            chartWidth > 0 ? chartWidth - 55 : 400; // chartWidth - gridLeft(30) - gridRight(25)
                          const chartContainerWidth =
                            chartWidth > 0 ? chartWidth : 400;

                          // 점의 X 좌표
                          const pointX =
                            gridLeft +
                            ((additionalSliderSafetyScore + 5) / 10) *
                              gridWidth;
                          // 점의 Y 좌표
                          const pointY =
                            gridTop + ((100 - proportion) / 100) * gridHeight;

                          // 라벨이 잘릴지 확인 (라벨 너비 약 60px 가정)
                          const labelWidth = 60;
                          const labelX = pointX + 18;
                          const willOverflow =
                            labelX + labelWidth >
                            chartContainerWidth - gridRight;

                          return (
                            <div
                              className="absolute text-body5m z-10 select-none"
                              style={{
                                ...(willOverflow
                                  ? {
                                      right: `${chartContainerWidth - pointX + 18}px`,
                                    }
                                  : { left: `${pointX + 18}px` }),
                                top: `${pointY + 4}px`,
                                color: "#929090",
                                userSelect: "none",
                                WebkitUserSelect: "none",
                                MozUserSelect: "none",
                                msUserSelect: "none",
                              }}
                            >
                              X= {additionalSliderSafetyScore.toFixed(2)}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Generate Subgroups 버튼 */}
            <button
              className="w-[236px] h-[42px] py-[6px] px-6 rounded-full text-body4 text-white font-semibold flex items-center justify-center gap-2 ml-auto mt-auto"
              style={{
                backgroundColor:
                  stratificationMonth !== initialStratificationMonth ||
                  cumulativeProportion !== initialCumulativeProportion ||
                  additionalSliders.length > 0
                    ? "#f06600"
                    : "#919092",
              }}
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
            className="flex-1 h-[762px] flex-shrink-0 rounded-[36px] overflow-hidden flex flex-col p-3 bg-white"
            style={{
              backgroundImage: "url(/assets/tsi/refine-right.png)",
              backgroundSize: "100% 100%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div className="flex flex-col w-full h-full  gap-0">
              {/* Set 1 타이틀 */}
              <div className="flex-shrink-0 m-3">
                <h3 className="text-body2 text-primary-15">Set 1</h3>
              </div>

              {/* 차트 2개 */}
              <div className="flex gap-3 flex-shrink-0 mb-3">
                {/* Disease Progression by Group */}
                <div
                  className="flex-1 h-[432px] rounded-[24px] overflow-hidden bg-primary-15 flex flex-col p-5"
                  style={{
                    boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <h4 className="text-h4 text-white mb-4 flex-shrink-0">
                    Disease Progression by Group
                  </h4>
                  <div className="flex-1 min-h-0 bg-white rounded-[12px] flex items-center justify-center">
                    <span className="text-neutral-50 text-sm">
                      Chart placeholder
                    </span>
                  </div>
                </div>

                {/* rHTE distribution */}
                <div
                  className="flex-1 h-[432px] rounded-[24px] overflow-hidden bg-primary-15 flex flex-col p-5"
                  style={{
                    boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <h4 className="text-h4 text-white mb-4 flex-shrink-0">
                    rHTE distribution
                  </h4>
                  <div className="flex-1 min-h-0 bg-white rounded-[12px] flex items-center justify-center">
                    <span className="text-neutral-50 text-sm">
                      Chart placeholder
                    </span>
                  </div>
                </div>
              </div>

              {/* Set 1 라벨 (하단) */}

              {/* 테이블 */}
              <div
                className="mb-3 flex-1 min-h-[145px] rounded-[24px] overflow-hidden bg-white flex flex-col"
                style={{
                  boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div className="flex flex-col h-full px-8 py-5">
                  {/* 테이블 헤더 */}
                  <div className="flex-shrink-0 h-[39px] border-b border-neutral-80 flex items-center gap-4">
                    <div className="w-[80px] text-body2 text-neutral-30 font-semibold">
                      no.
                    </div>
                    <div className="w-[240px] text-body2 text-neutral-30 font-semibold">
                      Group
                    </div>
                    <div className="w-[180px] text-body2 text-neutral-30 font-semibold">
                      Patients N
                    </div>
                    <div className="w-[290px] text-body2 text-neutral-30 font-semibold">
                      Safety Score (x)
                    </div>
                    <div className="flex-1 text-body2 text-neutral-30 font-semibold">
                      cumulative proportion (y)
                    </div>
                  </div>

                  {/* 테이블 바디 */}
                  <div className="flex-shrink-0">
                    <div className="flex h-[42px] border-b border-neutral-80 items-center gap-4">
                      <div className="w-[80px] text-body3m text-neutral-10">
                        1
                      </div>
                      <div className="w-[240px] flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span className="text-body3m text-neutral-10">
                          Group 1
                        </span>
                      </div>
                      <div className="w-[180px] text-body3m text-neutral-10">
                        250
                      </div>
                      <div className="w-[290px] text-body3m text-neutral-10">
                        X&gt;=1.3
                      </div>
                      <div className="flex-1 text-body3m text-neutral-10">
                        Y&gt;=80%
                      </div>
                    </div>
                    <div className="flex h-[42px] items-center gap-4">
                      <div className="w-[80px] text-body3m text-neutral-10">
                        2
                      </div>
                      <div className="w-[240px] flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: "#3A11D8" }}
                        ></div>
                        <span className="text-body3m text-neutral-10">
                          Group 2
                        </span>
                      </div>
                      <div className="w-[180px] text-body3m text-neutral-10">
                        150
                      </div>
                      <div className="w-[290px] text-body3m text-neutral-10">
                        X&lt;1.3
                      </div>
                      <div className="flex-1 text-body3m text-neutral-10">
                        Y&lt;80%
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 버튼들 */}
              <div className="flex-shrink-0 flex gap-2 justify-end">
                <button
                  className="h-[42px] px-6 rounded-full text-body4 text-white font-semibold"
                  style={{ backgroundColor: "#C7C5C9" }}
                >
                  Save
                </button>
                <button
                  className="h-[42px] px-6 rounded-full text-body4 text-white font-semibold"
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
