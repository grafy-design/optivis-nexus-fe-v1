"use client";

import { useState, useMemo } from "react";
import { SmallerSampleChart } from "@/components/charts/SmallerSampleChart";
import { SmallerNToScreenChart } from "@/components/charts/SmallerNToScreenChart";
import { LowerCostChart } from "@/components/charts/LowerCostChart";
import { SingleBarChart } from "@/components/charts/SingleBarChart";
import { ComparisonBarChart } from "@/components/charts/ComparisonBarChart";
import ArrowIcon from "@/components/ui/arrow-icon";
import FullscreenIcon from "@/components/ui/fullscreen-icon";
import InfoIcon from "@/components/ui/info-icon";
import { FormulaTooltip } from "@/components/math/FormulaTooltip";
import FullscreenChartModal from "@/components/ui/fullscreen-chart-modal";
import FullscreenBarChartModal from "@/components/ui/fullscreen-bar-chart-modal";
import type { TrialDesignConditionsSummary } from "@/services/studyService";

interface ChartData {
  optivis: number[][];
  traditional: number[][];
}

interface ChartDataToUse {
  smallerSample: ChartData;
  smallerNToScreen: ChartData;
  lowerCost: ChartData;
}

interface ReductionViewChart {
  label: string;
  change: string;
  optivis: number;
  traditional: number;
  isNegative?: boolean;
}

interface SimulationData {
  smallerSample: {
    percentage: string;
    isNegative?: boolean;
    chartData?: ChartData;
  };
  smallerNToScreen: {
    percentage: string;
    isNegative?: boolean;
    subtitle: string;
    chartData?: ChartData;
  };
  lowerCost: {
    percentage: string;
    isNegative?: boolean;
    subtitle: string;
    chartData?: ChartData;
  };
  comparisonTable: {
    enrollment: {
      optivis: string;
      traditional: string;
    };
    primaryEndpointPower: {
      optivis: string;
      traditional: string;
    };
    secondaryEndpointPower: {
      optivis: string;
      traditional: string;
    };
    sampleSize: {
      optivis: {
        treatmentGroup1: string | null;
        treatmentGroup2: string | null;
        treatmentGroup3: string | null;
        controlGroup: string;
        total: string;
      };
      traditional: {
        treatmentGroup1: string | null;
        treatmentGroup2: string | null;
        treatmentGroup3: string | null;
        controlGroup: string;
        total: string;
      };
    };
  };
  reductionView: {
    charts: ReductionViewChart[];
  };
}

interface ApiData {
  result_formula?: {
    OPTIVIS?: Array<{
      beta: number;
      inverse_phi: number;
      alpha: number;
      tau: number;
      sigma: number;
    }>;
  };
  result_trialdesignconditionsummary?: TrialDesignConditionsSummary;
}

interface RightPanelProps {
  activeTab: "compare" | "reduction";
  setActiveTab: (tab: "compare" | "reduction") => void;
  isApplied: boolean;
  simulationData: SimulationData | null;
  chartDataToUse: ChartDataToUse | null;
  getHighlightXValue: (
    optivisData: number[][],
    chartType?: "sampleSize" | "enrollment" | "cost"
  ) => number | undefined;
  apiData: ApiData | null;
}

// API endpoint 값을 UI 텍스트로 변환하는 함수
const convertEndpointToDisplayText = (endpoint: string): string => {
  const endpointMap: Record<string, string> = {
    ADTOT70: "ADAS-Cog Total Score",
    MMTOTSCORE: "MMSE Total Score",
    CDTOTSCORE: "CDR Total Score",
  };
  return endpointMap[endpoint] || endpoint;
};

export function RightPanel({
  activeTab,
  setActiveTab,
  isApplied,
  simulationData,
  chartDataToUse,
  getHighlightXValue,
  apiData,
}: RightPanelProps) {
  const [fullscreenModalOpen, setFullscreenModalOpen] = useState(false);
  const [fullscreenChartType, setFullscreenChartType] = useState<
    "smallerSample" | "smallerNToScreen" | "lowerCost" | null
  >(null);
  const [fullscreenBarModalOpen, setFullscreenBarModalOpen] = useState(false);
  const [fullscreenBarChartProps, setFullscreenBarChartProps] = useState<{
    title: string;
    subtitle: string;
    percentage: string;
    optivisValue: number;
    traditionalValue: number;
    isNegative?: boolean;
    formatter?: (value: number, label?: string) => string;
  } | null>(null);
  const reductionCharts = Array.isArray(simulationData?.reductionView?.charts)
    ? simulationData.reductionView.charts
    : [];

  const handleFullscreenClick = (
    chartType: "smallerSample" | "smallerNToScreen" | "lowerCost"
  ) => {
    setFullscreenChartType(chartType);
    setFullscreenModalOpen(true);
  };

  const handleBarChartFullscreenClick = (
    title: string,
    subtitle: string,
    percentage: string,
    optivisValue: number,
    traditionalValue: number,
    isNegative?: boolean,
    formatter?: (value: number, label?: string) => string
  ) => {
    setFullscreenBarChartProps({
      title,
      subtitle,
      percentage,
      optivisValue,
      traditionalValue,
      isNegative,
      formatter,
    });
    setFullscreenBarModalOpen(true);
  };

  /** Formula & Used Value 툴팁용 (OPTIVIS/Traditional 헤더 info 아이콘 클릭 시, 좌측에 표시) */
  const sampleSizeFormulaProps = useMemo(
    () => ({
      formula: String.raw`\beta=\Phi\left(\Phi^{-1}\left(\alpha/2\right)+\sqrt{n}\frac{\tau}{\sigma}\right)+\Phi\left(\Phi^{-1}\left(\alpha/2\right)-\sqrt{n}\frac{\tau}{\sigma}\right)`,
      usedValues:
        isApplied && apiData?.result_formula?.OPTIVIS?.[0]
          ? [
              {
                label: String.raw`\Phi`,
                value: String(apiData.result_formula.OPTIVIS[0].beta),
              },
              {
                label: String.raw`\Phi^{-1}`,
                value: String(apiData.result_formula.OPTIVIS[0].inverse_phi),
              },
              {
                label: String.raw`\alpha`,
                value: String(apiData.result_formula.OPTIVIS[0].alpha),
              },
              {
                label: String.raw`\beta`,
                value: String(apiData.result_formula.OPTIVIS[0].beta),
              },
              {
                label: String.raw`\tau`,
                value: String(apiData.result_formula.OPTIVIS[0].tau),
              },
              {
                label: String.raw`\sigma`,
                value: String(apiData.result_formula.OPTIVIS[0].sigma),
              },
            ]
          : [
              { label: String.raw`\Phi`, value: "" },
              { label: String.raw`\Phi^{-1}`, value: "" },
              { label: String.raw`\alpha`, value: "" },
              { label: String.raw`\beta`, value: "" },
              { label: String.raw`\tau`, value: "" },
              { label: String.raw`\sigma`, value: "" },
            ],
      definitions: [
        {
          symbol: String.raw`\Phi`,
          description:
            "Represents the variance scale parameter (Φ), characterizing the dispersion of the outcome distribution beyond what is explained by the mean structure",
        },
        {
          symbol: String.raw`\Phi^{-1}`,
          description:
            "Represents the inverse of the variance scale parameter (1/Φ), commonly interpreted as statistical precision.",
        },
        {
          symbol: String.raw`\alpha`,
          description:
            "Denotes the significance level (α), defined as the probability of rejecting the null hypothesis when it is true",
        },
        {
          symbol: String.raw`\beta`,
          description:
            "Represents the effect size or regression coefficient (β), quantifying the linear influence of covariates (e.g., prognostic scores) on the outcome",
        },
        {
          symbol: String.raw`\tau`,
          description: "The expected treatment effect",
        },
        {
          symbol: String.raw`\sigma`,
          description:
            "The reduced standard deviation achieved by incorporating the prognostic score is applied",
        },
      ],
    }),
    [apiData, isApplied]
  );

  return (
    <div className="w-full h-full min-h-0">
      <div
        className="relative w-full h-full min-h-[880px] flex flex-col overflow-visible"
        style={{
          borderImage:
            'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch',
          borderStyle: "solid",
          borderWidth: "24px",
          borderColor: "transparent",
        }}
      >
        <div className="flex flex-col w-full h-full p-0">
          {/* Top Section - Tab Bar and Legend */}
          <div className="flex items-center justify-between flex-shrink-0 mb-3 px-[12px]">
            {/* Tab Bar */}
            <div className="bg-white rounded-full p-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("compare")}
                  className={`px-[18px] py-[10px] rounded-full transition-all cursor-pointer ${
                    activeTab === "compare"
                      ? "bg-primary-20 text-white text-body4m"
                      : "text-neutral-30 text-body4"
                  }`}
                >
                  Compare View
                </button>
                <button
                  onClick={() => setActiveTab("reduction")}
                  disabled={!isApplied}
                  className={`px-[18px] py-[10px] rounded-full transition-all ${
                    !isApplied ? "cursor-not-allowed" : "cursor-pointer"
                  } ${
                    activeTab === "reduction"
                      ? "bg-primary-20 text-white text-body4m"
                      : "text-neutral-30 text-body4"
                  }`}
                >
                  Reduction View
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-secondary-60 flex-shrink-0" />
                <span className="text-[15px] font-semibold text-secondary-60 leading-[16.5px] tracking-[-0.75px]">
                  OPTIVIS NEXUS
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-primary-20 flex-shrink-0" />
                <span className="text-[15px] font-semibold text-primary-20 leading-[16.5px] tracking-[-0.75px]">
                  Traditional Design
                </span>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex gap-4 min-h-0 mt-auto">
            {/* Left Area - Smaller Sample, Smaller N to screen, Lower cost */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">
              {activeTab === "compare" ? (
                /* Smaller Sample Card - Compare View */
                <div
                  className="rounded-[18px] overflow-hidden flex-[3] min-h-0"
                  style={{
                    background: "var(--primary-15)",
                  }}
                >
                  <div className="flex flex-col w-full h-full p-4">
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-4 flex-shrink-0">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-body1m text-neutral-98">
                          Smaller Sample
                        </h3>
                        <p className="text-body4 text-neutral-98">
                          Sample Size vs CI Width
                        </p>
                        {isApplied && (
                          <div className="flex items-center gap-1 mt-1">
                            <svg
                              width="44"
                              height="44"
                              viewBox="0 0 44 44"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="flex-shrink-0"
                              style={{
                                transform: simulationData?.smallerSample
                                  ?.isNegative
                                  ? "rotate(180deg)"
                                  : "none",
                                transition: "transform 0.2s",
                              }}
                            >
                              <g clipPath="url(#clip0_smaller_sample_arrow)">
                                <path
                                  d="M21.9902 -3.00195L21.9902 40.5039"
                                  stroke="white"
                                  strokeWidth="6"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M39.793 22.7061L21.9951 40.5039L4.19727 22.7061"
                                  stroke="white"
                                  strokeWidth="6"
                                  strokeLinejoin="round"
                                />
                              </g>
                              <defs>
                                <clipPath id="clip0_smaller_sample_arrow">
                                  <rect
                                    width="44"
                                    height="44"
                                    fill="white"
                                    transform="matrix(0 1 1 4.37114e-08 0 0)"
                                  />
                                </clipPath>
                              </defs>
                            </svg>
                            <p className="text-h0 text-neutral-98">
                              {simulationData?.smallerSample?.percentage ||
                                "--"}
                            </p>
                          </div>
                        )}
                      </div>
                      {isApplied && (
                        <button
                          onClick={() => handleFullscreenClick("smallerSample")}
                        >
                          <FullscreenIcon backgroundColor="#1c1942" />
                        </button>
                      )}
                    </div>
                    {/* Chart Area */}
                    <div
                      className="mt-auto bg-neutral-95 rounded-[12px]"
                      style={{ height: "66%" }}
                    >
                      {chartDataToUse &&
                      chartDataToUse.smallerSample.optivis.length > 0 ? (
                        <SmallerSampleChart
                          optivisData={chartDataToUse.smallerSample.optivis}
                          traditionalData={
                            chartDataToUse.smallerSample.traditional
                          }
                          highlightXValue={getHighlightXValue(
                            chartDataToUse.smallerSample.optivis,
                            "sampleSize"
                          )}
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : /* Sample Size & Power Card - Reduction View */
              isApplied && reductionCharts.length > 0 ? (
                <div
                  className="rounded-[18px] overflow-hidden flex-[3] min-h-0"
                  style={{
                    background: "#262255",
                  }}
                >
                  <div className="flex flex-col w-full h-full p-4">
                    {/* Card Header */}
                    <div className="flex flex-col gap-1 mb-4 flex-shrink-0">
                      <h3 className="text-body1m text-neutral-98">
                        Smaller Sample
                      </h3>
                      <p className="text-body4 text-neutral-98">
                        Sample Size vs Power
                      </p>
                      {isApplied &&
                        simulationData?.smallerSample?.percentage && (
                          <div className="flex items-center gap-1 mt-1">
                            <svg
                              width="44"
                              height="44"
                              viewBox="0 0 44 44"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="flex-shrink-0"
                              style={{
                                transform: simulationData?.smallerSample
                                  ?.isNegative
                                  ? "rotate(180deg)"
                                  : "none",
                                transition: "transform 0.2s",
                              }}
                            >
                              <g clipPath="url(#clip0_smaller_sample_reduction)">
                                <path
                                  d="M21.9902 -3.00195L21.9902 40.5039"
                                  stroke="white"
                                  strokeWidth="6"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M39.793 22.7061L21.9951 40.5039L4.19727 22.7061"
                                  stroke="white"
                                  strokeWidth="6"
                                  strokeLinejoin="round"
                                />
                              </g>
                              <defs>
                                <clipPath id="clip0_smaller_sample_reduction">
                                  <rect
                                    width="44"
                                    height="44"
                                    fill="white"
                                    transform="matrix(0 1 1 4.37114e-08 0 0)"
                                  />
                                </clipPath>
                              </defs>
                            </svg>
                            <p className="text-h0 text-neutral-98">
                              {simulationData.smallerSample.percentage}
                            </p>
                          </div>
                        )}
                    </div>
                    {/* Chart Area */}
                    <div
                      className="mt-auto bg-neutral-95 rounded-[12px]"
                      style={{ height: "66%" }}
                    >
                      <div className="grid grid-cols-2 gap-4 h-full pt-4 px-4 pb-4">
                        {/* Sample Size Section */}
                        {reductionCharts.find(
                          (c) => c.label === "Sample Size"
                        ) &&
                          (() => {
                            const chart = reductionCharts.find(
                              (c) => c.label === "Sample Size"
                            )!;
                            return (
                              <div className="flex flex-col h-full">
                                <div className="flex items-start justify-between">
                                  <div className="flex flex-col gap-1">
                                    <h4 className="text-body2 text-[#262255]">
                                      {chart.label}
                                    </h4>
                                    <div className="flex items-center gap-1 mt-1">
                                      <ArrowIcon
                                        direction={
                                          chart.isNegative ? "up" : "down"
                                        }
                                        color="#231F52"
                                      />
                                      <span className="text-h4 text-neutral-15">
                                        {chart.change}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleBarChartFullscreenClick(
                                        chart.label,
                                        "Optivis VS Traditional",
                                        chart.change,
                                        chart.optivis,
                                        chart.traditional,
                                        chart.isNegative
                                      )
                                    }
                                  >
                                    <FullscreenIcon />
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-auto items-end">
                                  {/* Sample Size - OPTIVIS */}
                                  <div className="flex flex-col gap-1">
                                    <div
                                      style={{ height: "270px", width: "100%" }}
                                    >
                                      <SingleBarChart
                                        value={chart.optivis}
                                        maxValue={Math.max(
                                          chart.optivis,
                                          chart.traditional
                                        )}
                                        color="#f06600"
                                        height="100%"
                                      />
                                    </div>
                                  </div>
                                  {/* Sample Size - Traditional */}
                                  <div className="flex flex-col gap-1">
                                    <div
                                      style={{ height: "270px", width: "100%" }}
                                    >
                                      <SingleBarChart
                                        value={chart.traditional}
                                        maxValue={Math.max(
                                          chart.optivis,
                                          chart.traditional
                                        )}
                                        color="#231f52"
                                        height="100%"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        {/* Power Section */}
                        {reductionCharts.find(
                          (c) => c.label === "Power"
                        ) &&
                          (() => {
                            const chart = reductionCharts.find(
                              (c) => c.label === "Power"
                            )!;
                            return (
                              <div className="flex flex-col h-full">
                                <div className="flex items-start justify-between">
                                  <div className="flex flex-col gap-1">
                                    <h4 className="text-body2 text-[#262255]">
                                      {chart.label}
                                    </h4>
                                    <div className="flex items-center gap-1 mt-1">
                                      <ArrowIcon
                                        direction={
                                          chart.isNegative ? "up" : "down"
                                        }
                                        color="#231F52"
                                      />
                                      <span className="text-h4 text-neutral-15">
                                        {chart.change}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleBarChartFullscreenClick(
                                        chart.label,
                                        "Optivis VS Traditional",
                                        chart.change,
                                        chart.optivis,
                                        chart.traditional,
                                        chart.isNegative
                                      )
                                    }
                                  >
                                    <FullscreenIcon />
                                  </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-auto items-end">
                                  {/* Power - OPTIVIS */}
                                  <div className="flex flex-col gap-1">
                                    <div
                                      style={{ height: "270px", width: "100%" }}
                                    >
                                      <SingleBarChart
                                        value={chart.optivis}
                                        maxValue={Math.max(
                                          chart.optivis,
                                          chart.traditional
                                        )}
                                        color="#f06600"
                                        height="100%"
                                      />
                                    </div>
                                  </div>
                                  {/* Power - Traditional */}
                                  <div className="flex flex-col gap-1">
                                    <div
                                      style={{ height: "270px", width: "100%" }}
                                    >
                                      <SingleBarChart
                                        value={chart.traditional}
                                        maxValue={Math.max(
                                          chart.optivis,
                                          chart.traditional
                                        )}
                                        color="#231f52"
                                        height="100%"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Bottom Two Cards */}
              <div className="flex gap-4 flex-[2] min-h-0">
                {/* Smaller N to screen Card */}
                <div
                  className="flex-1 min-w-0 rounded-[24px] overflow-hidden"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.6)",
                  }}
                >
                  <div className="flex flex-col w-full h-full p-4">
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-4">
                      {activeTab === "compare" ? (
                        <>
                          <div className="flex flex-col gap-1">
                            <h3 className="text-body4 text-neutral-15">
                              Smaller N to screen
                            </h3>
                            <p className="text-small1 text-neutral-15">
                              {isApplied && simulationData
                                ? simulationData.smallerNToScreen.subtitle
                                : "at the same Power"}
                            </p>
                            {isApplied && (
                              <div className="flex items-center gap-1 mt-1">
                                <ArrowIcon
                                  direction={
                                    simulationData?.smallerNToScreen?.isNegative
                                      ? "up"
                                      : "down"
                                  }
                                  color="#231F52"
                                />
                                <p className="text-h4 text-neutral-15">
                                  {simulationData?.smallerNToScreen
                                    ?.percentage || "--"}
                                </p>
                              </div>
                            )}
                          </div>
                          {isApplied && (
                            <button
                              onClick={() =>
                                handleFullscreenClick("smallerNToScreen")
                              }
                            >
                              <FullscreenIcon />
                            </button>
                          )}
                        </>
                      ) : isApplied && reductionCharts.length > 0 ? (
                        (() => {
                          const chart = reductionCharts.find(
                            (c) => c.label === "Enrollment Time"
                          );
                          return chart ? (
                            <>
                              <div className="flex flex-col gap-1">
                                <h3 className="text-body4 text-neutral-15">
                                  {chart.label}
                                </h3>
                                <div className="flex items-center gap-1 mt-1">
                                  <ArrowIcon
                                    direction={chart.isNegative ? "up" : "down"}
                                    color="#231F52"
                                  />
                                  <p className="text-h4 text-neutral-15">
                                    {chart.change}
                                  </p>
                                </div>
                              </div>
                              {isApplied && (
                                <button
                                  onClick={() => {
                                    const chart = reductionCharts.find(
                                      (c) => c.label === "Enrollment Time"
                                    );
                                    if (chart) {
                                      handleBarChartFullscreenClick(
                                        chart.label,
                                        "Optivis VS Traditional",
                                        chart.change,
                                        chart.optivis,
                                        chart.traditional,
                                        chart.isNegative
                                      );
                                    }
                                  }}
                                >
                                  <FullscreenIcon />
                                </button>
                              )}
                            </>
                          ) : null;
                        })()
                      ) : null}
                    </div>
                    {/* Chart Area */}
                    <div
                      className="mt-auto bg-white/60 rounded-[12px] flex-1 min-h-0"
                    >
                      {activeTab === "compare" ? (
                        chartDataToUse &&
                        chartDataToUse.smallerNToScreen.optivis.length > 0 ? (
                          <SmallerNToScreenChart
                            optivisData={
                              chartDataToUse.smallerNToScreen.optivis
                            }
                            traditionalData={
                              chartDataToUse.smallerNToScreen.traditional
                            }
                            highlightXValue={getHighlightXValue(
                              chartDataToUse.smallerNToScreen.optivis,
                              "enrollment"
                            )}
                          />
                        ) : null
                      ) : isApplied && reductionCharts.length > 0 ? (
                        (() => {
                          const chart = reductionCharts.find(
                            (c) => c.label === "Enrollment Time"
                          );
                          return chart ? (
                            <div className="grid grid-cols-2 gap-2 h-full pt-2 px-2 pb-2 items-end">
                              {/* Enrollment Time - OPTIVIS */}
                              <div className="flex flex-col gap-1">
                                <div style={{ height: "140px", width: "100%" }}>
                                  <SingleBarChart
                                    value={chart.optivis}
                                    maxValue={Math.max(
                                      chart.optivis,
                                      chart.traditional
                                    )}
                                    color="#f06600"
                                    height="100%"
                                  />
                                </div>
                              </div>
                              {/* Enrollment Time - Traditional */}
                              <div className="flex flex-col gap-1">
                                <div style={{ height: "140px", width: "100%" }}>
                                  <SingleBarChart
                                    value={chart.traditional}
                                    maxValue={Math.max(
                                      chart.optivis,
                                      chart.traditional
                                    )}
                                    color="#231f52"
                                    height="100%"
                                  />
                                </div>
                              </div>
                            </div>
                          ) : null;
                        })()
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Lower cost Card */}
                <div
                  className="flex-1 min-w-0 rounded-[24px] overflow-hidden"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.6)",
                  }}
                >
                  <div className="flex flex-col w-full h-full p-4">
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-4">
                      {activeTab === "compare" ? (
                        <>
                          <div className="flex flex-col gap-1">
                            <h3 className="text-body4 text-neutral-15">
                              Lower cost
                            </h3>
                            <p className="text-small1 text-neutral-15">
                              {isApplied && simulationData
                                ? simulationData.lowerCost.subtitle
                                : "at the same sample size"}
                            </p>
                            {isApplied && (
                              <div className="flex items-center gap-1  mt-1">
                                <ArrowIcon
                                  direction={
                                    simulationData?.lowerCost?.isNegative
                                      ? "up"
                                      : "down"
                                  }
                                  color="#231F52"
                                />
                                <p className="text-h4 text-neutral-15">
                                  {simulationData?.lowerCost?.percentage ||
                                    "--"}
                                </p>
                              </div>
                            )}
                          </div>
                          {isApplied && (
                            <button
                              onClick={() => handleFullscreenClick("lowerCost")}
                            >
                              <FullscreenIcon />
                            </button>
                          )}
                        </>
                      ) : isApplied && reductionCharts.length > 0 ? (
                        (() => {
                          const chart = reductionCharts.find(
                            (c) => c.label === "Cost"
                          );
                          return chart ? (
                            <>
                              <div className="flex flex-col gap-1">
                                <h3 className="text-body4 text-neutral-15">
                                  {chart.label}
                                </h3>
                                <div className="flex items-center gap-1 mt-1">
                                  <ArrowIcon
                                    direction={chart.isNegative ? "up" : "down"}
                                    color="#231F52"
                                  />
                                  <p className="text-h4 text-neutral-15">
                                    {chart.change}
                                  </p>
                                </div>
                              </div>
                              {isApplied && (
                                <button
                                  onClick={() => {
                                    const chart = reductionCharts.find(
                                      (c) => c.label === "Cost"
                                    );
                                    if (chart) {
                                      handleBarChartFullscreenClick(
                                        chart.label,
                                        "Optivis VS Traditional",
                                        chart.change,
                                        chart.optivis,
                                        chart.traditional,
                                        chart.isNegative,
                                        (val: number) => `${val}M`
                                      );
                                    }
                                  }}
                                >
                                  <FullscreenIcon />
                                </button>
                              )}
                            </>
                          ) : null;
                        })()
                      ) : null}
                    </div>
                    {/* Chart Area */}
                    <div
                      className="mt-auto bg-white/60 rounded-[12px] flex-1 min-h-0"
                    >
                      {activeTab === "compare" ? (
                        chartDataToUse &&
                        chartDataToUse.lowerCost.optivis.length > 0 ? (
                          <LowerCostChart
                            optivisData={chartDataToUse.lowerCost.optivis}
                            traditionalData={
                              chartDataToUse.lowerCost.traditional
                            }
                            highlightXValue={getHighlightXValue(
                              chartDataToUse.lowerCost.optivis,
                              "cost"
                            )}
                          />
                        ) : null
                      ) : isApplied && reductionCharts.length > 0 ? (
                        (() => {
                          const chart = reductionCharts.find(
                            (c) => c.label === "Cost"
                          );
                          return chart ? (
                            <div className="grid grid-cols-2 gap-2 h-full pt-2 px-2 pb-2 items-end">
                              {/* Cost - OPTIVIS */}
                              <div className="flex flex-col gap-1">
                                <div style={{ height: "140px", width: "100%" }}>
                                  <SingleBarChart
                                    value={chart.optivis}
                                    maxValue={Math.max(
                                      chart.optivis,
                                      chart.traditional
                                    )}
                                    color="#f06600"
                                    height="100%"
                                    formatter={(val) => `${val}M`}
                                  />
                                </div>
                              </div>
                              {/* Cost - Traditional */}
                              <div className="flex flex-col gap-1">
                                <div style={{ height: "140px", width: "100%" }}>
                                  <SingleBarChart
                                    value={chart.traditional}
                                    maxValue={Math.max(
                                      chart.optivis,
                                      chart.traditional
                                    )}
                                    color="#231f52"
                                    height="100%"
                                    formatter={(val) => `${val}M`}
                                  />
                                </div>
                              </div>
                            </div>
                          ) : null;
                        })()
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Area - OPTIVIS NEXUS vs Traditional Design, Reduction View */}
            <div className="w-[min(34%,460px)] flex-shrink-0 flex flex-col gap-4">
              {/* OPTIVIS NEXUS vs Traditional Design Card */}
              <div className="bg-white rounded-[24px] flex flex-col flex-1">
                {/* Title */}
                <div className="px-4 pt-4 pb-3 flex-shrink-0">
                  <h3 className="text-body2 text-neutral-10">
                    OPTIVIS NEXUS vs Traditional Design
                  </h3>
                </div>

                {/* Table Content */}
                <div className="flex flex-col px-4 pb-4 mt-auto">
                  {/* Header: OPTIVIS/Traditional 옆 info 아이콘 클릭 시 Formula & Used Value (좌측 표시) */}
                  <div className="flex items-end mb-0 flex-shrink-0 border-b border-neutral-80 pb-3">
                    <div className="flex-1"></div>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-1 w-[98px]">
                        <span className="text-body5m text-secondary-60">
                          OPTIVIS
                        </span>
                        <FormulaTooltip
                          {...sampleSizeFormulaProps}
                          side="left"
                          align="start"
                          trigger={
                            <button className="flex-shrink-0 mt-0.5 cursor-pointer hover:opacity-70 transition-opacity">
                              <InfoIcon
                                className="flex-shrink-0"
                                color="#f06600"
                              />
                            </button>
                          }
                        />
                      </div>
                      <div className="flex items-center gap-1 w-[98px]">
                        <span className="text-body5m text-primary-20">
                          Traditional
                        </span>
                        <FormulaTooltip
                          {...sampleSizeFormulaProps}
                          side="left"
                          align="start"
                          trigger={
                            <button className="flex-shrink-0 mt-0.5 cursor-pointer hover:opacity-70 transition-opacity">
                              <InfoIcon
                                className="flex-shrink-0"
                                color="#231f52"
                              />
                            </button>
                          }
                        />
                      </div>
                    </div>
                  </div>

                  {/* Table Rows */}
                  <div className="flex flex-col gap-0">
                    {/* Enrollment Row */}
                    <div className="flex items-end border-b border-neutral-80 py-3 flex-shrink-0">
                      <div className="flex-1 flex items-center">
                        <div className="flex flex-col">
                          <span className="text-body5 text-neutral-30">
                            Enrollment
                          </span>
                          <span className="text-small1 text-neutral-60">
                            Est. Enrollment Period in Months
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-4 items-end">
                        <div className="w-[98px]">
                          <span className="text-body1m text-secondary-60">
                            {isApplied && simulationData
                              ? simulationData.comparisonTable.enrollment
                                  .optivis
                              : "-"}
                          </span>
                        </div>
                        <div className="w-[98px]">
                          <span className="text-body1m text-primary-20">
                            {isApplied && simulationData
                              ? simulationData.comparisonTable.enrollment
                                  .traditional
                              : "-"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Primary Endpoint Power Row */}
                    <div className="flex items-end border-b border-neutral-80 py-3 flex-shrink-0">
                      <div className="flex-1 flex items-center">
                        <div className="flex flex-col">
                          <span className="text-body5 text-neutral-30">
                            Primary Endpoint Power
                          </span>
                          <span className="text-small1 text-neutral-60">
                            {apiData?.result_trialdesignconditionsummary
                              ?.primary_endpoint
                              ? convertEndpointToDisplayText(
                                  apiData.result_trialdesignconditionsummary
                                    .primary_endpoint
                                )
                              : "ADAS-Cog Total Score"}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-4 items-end">
                        <div className="w-[98px]">
                          <span className="text-body1m text-secondary-60">
                            {isApplied && simulationData
                              ? simulationData.comparisonTable
                                  .primaryEndpointPower.optivis
                              : "-"}
                          </span>
                        </div>
                        <div className="w-[98px]">
                          <span className="text-body1m text-primary-20">
                            {isApplied && simulationData
                              ? simulationData.comparisonTable
                                  .primaryEndpointPower.traditional
                              : "-"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Endpoint Power Row */}
                    {apiData?.result_trialdesignconditionsummary
                      ?.secondary_endpoint && (
                      <div className="flex items-end border-b border-neutral-80 py-3 flex-shrink-0">
                        <div className="flex-1 flex items-center">
                          <div className="flex flex-col">
                            <span className="text-body5 text-neutral-30">
                              Secondary Endpoint Power
                            </span>
                            <span className="text-small1 text-neutral-60">
                              {convertEndpointToDisplayText(
                                apiData.result_trialdesignconditionsummary
                                  .secondary_endpoint
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-4 items-end">
                          <div className="w-[98px]">
                            <span className="text-body1m text-secondary-60">
                              {isApplied && simulationData
                                ? simulationData.comparisonTable
                                    .secondaryEndpointPower.optivis
                                : "-"}
                            </span>
                          </div>
                          <div className="w-[98px]">
                            <span className="text-body1m text-primary-20">
                              {isApplied && simulationData
                                ? simulationData.comparisonTable
                                    .secondaryEndpointPower.traditional
                                : "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Sample Size Row (Formula & Used Value는 OPTIVIS/Traditional 헤더 info 아이콘에서 표시) */}
                    <div className="flex items-end py-3 flex-shrink-0">
                      <div className="flex-1 flex flex-col">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <span className="text-body5 text-neutral-30">
                              Sample Size
                            </span>
                          </div>
                          <div className="flex-1 flex flex-col gap-0.5">
                            {/* Treatment Group 1 */}
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center">
                                <span className="text-small1 text-neutral-60">
                                  Treatment Group 1
                                </span>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="w-[98px] text-left">
                                  <span className="text-body5 text-secondary-60">
                                    {isApplied && simulationData
                                      ? simulationData.comparisonTable.sampleSize
                                          .optivis.treatmentGroup1 ?? "-"
                                      : "-"}
                                  </span>
                                </div>
                                <div className="w-[98px] text-left">
                                  <span className="text-body5 text-primary-20">
                                    {isApplied && simulationData
                                      ? simulationData.comparisonTable.sampleSize
                                          .traditional.treatmentGroup1 ?? "-"
                                      : "-"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {/* Treatment Group 2 - null이 아닐 때만 표시 */}
                            {isApplied &&
                              simulationData &&
                              (simulationData.comparisonTable.sampleSize.optivis
                                .treatmentGroup2 !== null ||
                                simulationData.comparisonTable.sampleSize
                                  .traditional.treatmentGroup2 !== null) && (
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center">
                                    <span className="text-small1 text-neutral-60">
                                      Treatment Group 2
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="w-[98px] text-left">
                                      <span className="text-body5 text-secondary-60">
                                        {simulationData.comparisonTable.sampleSize
                                          .optivis.treatmentGroup2 ?? "-"}
                                      </span>
                                    </div>
                                    <div className="w-[98px] text-left">
                                      <span className="text-body5 text-primary-20">
                                        {simulationData.comparisonTable.sampleSize
                                          .traditional.treatmentGroup2 ?? "-"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            {/* Treatment Group 3 - null이 아닐 때만 표시 */}
                            {isApplied &&
                              simulationData &&
                              (simulationData.comparisonTable.sampleSize.optivis
                                .treatmentGroup3 !== null ||
                                simulationData.comparisonTable.sampleSize
                                  .traditional.treatmentGroup3 !== null) && (
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center">
                                    <span className="text-small1 text-neutral-60">
                                      Treatment Group 3
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="w-[98px] text-left">
                                      <span className="text-body5 text-secondary-60">
                                        {simulationData.comparisonTable.sampleSize
                                          .optivis.treatmentGroup3 ?? "-"}
                                      </span>
                                    </div>
                                    <div className="w-[98px] text-left">
                                      <span className="text-body5 text-primary-20">
                                        {simulationData.comparisonTable.sampleSize
                                          .traditional.treatmentGroup3 ?? "-"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            {/* Control Group */}
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center">
                                <span className="text-small1 text-neutral-60">
                                  Control Group
                                </span>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="w-[98px] text-left">
                                  <span className="text-body5 text-secondary-60">
                                    {isApplied && simulationData
                                      ? simulationData.comparisonTable.sampleSize
                                          .optivis.controlGroup
                                      : "-"}
                                  </span>
                                </div>
                                <div className="w-[98px] text-left">
                                  <span className="text-body5 text-primary-20">
                                    {isApplied && simulationData
                                      ? simulationData.comparisonTable.sampleSize
                                          .traditional.controlGroup
                                      : "-"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {/* Total */}
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center">
                                <span className="text-small1 text-neutral-60">
                                  Total
                                </span>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="w-[98px] text-left">
                                  <span className="text-body5 text-secondary-60">
                                    {isApplied && simulationData
                                      ? simulationData.comparisonTable.sampleSize
                                          .optivis.total
                                      : "-"}
                                  </span>
                                </div>
                                <div className="w-[98px] text-left">
                                  <span className="text-body5 text-primary-20">
                                    {isApplied && simulationData
                                      ? simulationData.comparisonTable.sampleSize
                                          .traditional.total
                                      : "-"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reduction View Card / Compare View Card */}
              <div className="bg-white rounded-[24px] flex flex-col flex-1">
                {/* Title */}
                <div className="px-4 pt-4 pb-3 flex-shrink-0">
                  <h3 className="text-body2 text-neutral-10">
                    {activeTab === "compare"
                      ? "Reduction View"
                      : "Compare View"}
                  </h3>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col px-4 pb-4 min-h-0 overflow-hidden">
                  {activeTab === "compare" ? (
                    isApplied ? (
                      <div className="grid grid-cols-2 gap-2 h-full">
                        {reductionCharts.map(
                          (chart, index) => (
                            <div key={index} className="flex flex-col gap-2 h-full">
                              <div className="flex items-start justify-between">
                                <div className="flex flex-col gap-2">
                                  <span className="text-body5 text-black">
                                    {chart.label}
                                  </span>
                                  <div className="flex items-center gap-1 mt-1">
                                    <ArrowIcon
                                      direction={
                                        chart.isNegative ? "up" : "down"
                                      }
                                      color="#231F52"
                                    />
                                    <span className="text-body1m text-neutral-30">
                                      {chart.change}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    const formatter =
                                      chart.label === "Cost"
                                        ? (val: number) => `${val}M`
                                        : undefined;
                                    handleBarChartFullscreenClick(
                                      chart.label,
                                      "Optivis VS Traditional",
                                      chart.change,
                                      chart.optivis,
                                      chart.traditional,
                                      chart.isNegative,
                                      formatter
                                    );
                                  }}
                                >
                                  <FullscreenIcon />
                                </button>
                              </div>
                              <div className="mt-auto" style={{ height: "120px", width: "100%" }}>
                                <ComparisonBarChart
                                  optivisValue={chart.optivis}
                                  traditionalValue={chart.traditional}
                                  height="100%"
                                  label={chart.label}
                                />
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 bg-[#f8f8f8] rounded-[12px] border border-[#e5e5e5]">
                        {/* Empty state */}
                      </div>
                    )
                  ) : /* Compare View Charts - when activeTab is "reduction" */
                  isApplied && chartDataToUse ? (
                    <div className="flex flex-col gap-2 h-full overflow-hidden">
                      {/* Smaller Sample Chart - Single */}
                      {chartDataToUse.smallerSample.optivis.length > 0 && (
                        <div className="flex flex-col gap-2 flex-1 min-h-0">
                          <div className="flex items-start justify-between">
                            <div className="flex flex-col gap-2">
                              <h4 className="text-body5 text-neutral-10">
                                Smaller Sample
                              </h4>
                              {simulationData && (
                                <div className="flex items-center gap-1 mt-1">
                                  <ArrowIcon
                                    direction={
                                      simulationData?.smallerSample?.isNegative
                                        ? "up"
                                        : "down"
                                    }
                                    color="#231F52"
                                  />
                                  <span className="text-body1m text-neutral-30">
                                    {simulationData.smallerSample.percentage ||
                                      "--"}
                                  </span>
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                handleFullscreenClick("smallerSample")
                              }
                            >
                              <FullscreenIcon />
                            </button>
                          </div>
                            <div
                              className="bg-white rounded-[12px] flex-1 min-h-0"
                            >
                            <SmallerSampleChart
                              optivisData={chartDataToUse.smallerSample.optivis}
                              traditionalData={
                                chartDataToUse.smallerSample.traditional
                              }
                              highlightXValue={getHighlightXValue(
                                chartDataToUse.smallerSample.optivis,
                                "sampleSize"
                              )}
                              compactMode={true}
                            />
                          </div>
                        </div>
                      )}
                      {/* Smaller N to screen & Lower cost - Side by side */}
                      <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
                        {/* Smaller N to screen Chart */}
                        {chartDataToUse.smallerNToScreen.optivis.length > 0 && (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-start justify-between">
                              <div className="flex flex-col gap-2">
                                <h4 className="text-body5 text-neutral-10">
                                  Smaller N to screen
                                </h4>
                                {simulationData && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <ArrowIcon
                                      direction={
                                        simulationData?.smallerNToScreen
                                          ?.isNegative
                                          ? "up"
                                          : "down"
                                      }
                                      color="#231F52"
                                    />
                                    <span className="text-body1m text-neutral-30">
                                      {simulationData.smallerNToScreen
                                        .percentage || "--"}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() =>
                                  handleFullscreenClick("smallerNToScreen")
                                }
                              >
                                <FullscreenIcon />
                              </button>
                            </div>
                            <div
                              className="bg-white rounded-[12px] flex-1 min-h-0"
                            >
                              <SmallerNToScreenChart
                                optivisData={
                                  chartDataToUse.smallerNToScreen.optivis
                                }
                                traditionalData={
                                  chartDataToUse.smallerNToScreen.traditional
                                }
                                highlightXValue={getHighlightXValue(
                                  chartDataToUse.smallerNToScreen.optivis,
                                  "enrollment"
                                )}
                                compactMode={true}
                              />
                            </div>
                          </div>
                        )}
                        {/* Lower cost Chart */}
                        {chartDataToUse.lowerCost.optivis.length > 0 && (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-start justify-between">
                              <div className="flex flex-col gap-2">
                                <h4 className="text-body5 text-neutral-10">
                                  Lower cost
                                </h4>
                                {simulationData && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <ArrowIcon
                                      direction={
                                        simulationData?.lowerCost?.isNegative
                                          ? "up"
                                          : "down"
                                      }
                                      color="#231F52"
                                    />
                                    <span className="text-body1m text-neutral-30">
                                      {simulationData.lowerCost.percentage ||
                                        "--"}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() =>
                                  handleFullscreenClick("lowerCost")
                                }
                              >
                                <FullscreenIcon />
                              </button>
                            </div>
                            <div
                              className="bg-white rounded-[12px] flex-1 min-h-0"
                            >
                              <LowerCostChart
                                optivisData={chartDataToUse.lowerCost.optivis}
                                traditionalData={
                                  chartDataToUse.lowerCost.traditional
                                }
                                highlightXValue={getHighlightXValue(
                                  chartDataToUse.lowerCost.optivis,
                                  "cost"
                                )}
                                compactMode={true}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 bg-[#f8f8f8] rounded-[12px] border border-[#e5e5e5]">
                      {/* Empty state */}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Chart Modals */}
      {fullscreenChartType === "smallerSample" && chartDataToUse && (
        <FullscreenChartModal
          open={fullscreenModalOpen}
          onOpenChange={setFullscreenModalOpen}
          title="Smaller Sample"
          subtitle="Sample Size vs CI Width"
          percentage={simulationData?.smallerSample?.percentage || "--"}
          optivisData={chartDataToUse.smallerSample.optivis}
          traditionalData={chartDataToUse.smallerSample.traditional}
          highlightXValue={getHighlightXValue(
            chartDataToUse.smallerSample.optivis,
            "sampleSize"
          )}
          xAxisName="Sample Size"
          yAxisName="CI Width"
          isNegative={simulationData?.smallerSample?.isNegative}
        />
      )}
      {fullscreenChartType === "smallerNToScreen" && chartDataToUse && (
        <FullscreenChartModal
          open={fullscreenModalOpen}
          onOpenChange={setFullscreenModalOpen}
          title="Smaller N to Screen"
          subtitle={
            simulationData?.smallerNToScreen?.subtitle ||
            "Enrollment Time vs Power"
          }
          percentage={simulationData?.smallerNToScreen?.percentage || "--"}
          optivisData={chartDataToUse.smallerNToScreen.optivis}
          traditionalData={chartDataToUse.smallerNToScreen.traditional}
          highlightXValue={getHighlightXValue(
            chartDataToUse.smallerNToScreen.optivis,
            "enrollment"
          )}
          xAxisName="Enrollment Time"
          yAxisName="Power"
          isNegative={simulationData?.smallerNToScreen?.isNegative}
        />
      )}
      {fullscreenChartType === "lowerCost" && chartDataToUse && (
        <FullscreenChartModal
          open={fullscreenModalOpen}
          onOpenChange={setFullscreenModalOpen}
          title="Lower cost"
          subtitle={
            simulationData?.lowerCost?.subtitle || "Sample Size vs Cost"
          }
          percentage={simulationData?.lowerCost?.percentage || "--"}
          optivisData={chartDataToUse.lowerCost.optivis}
          traditionalData={chartDataToUse.lowerCost.traditional}
          highlightXValue={getHighlightXValue(
            chartDataToUse.lowerCost.optivis,
            "cost"
          )}
          xAxisName="Sample Size"
          yAxisName="Cost"
          isNegative={simulationData?.lowerCost?.isNegative}
        />
      )}
      {fullscreenBarModalOpen && fullscreenBarChartProps && (
        <FullscreenBarChartModal
          open={fullscreenBarModalOpen}
          onOpenChange={setFullscreenBarModalOpen}
          title={fullscreenBarChartProps.title}
          subtitle={fullscreenBarChartProps.subtitle}
          percentage={fullscreenBarChartProps.percentage}
          optivisValue={fullscreenBarChartProps.optivisValue}
          traditionalValue={fullscreenBarChartProps.traditionalValue}
          isNegative={fullscreenBarChartProps.isNegative}
          formatter={fullscreenBarChartProps.formatter}
        />
      )}
    </div>
  );
}
