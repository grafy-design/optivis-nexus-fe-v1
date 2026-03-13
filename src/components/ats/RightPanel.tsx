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
        className="figma-nine-slice figma-home-panel-right flex flex-col overflow-hidden relative w-full h-full"
      >
        <div className="flex flex-col w-full h-full p-0 gap-3 [@media(max-width:1470px)]:gap-2">
          {/* Top Section - Tab Bar and Legend */}
          <div className="flex items-center justify-between flex-shrink-0 pr-1">
            {/* Tab Bar */}
            <div className="bg-white rounded-full p-1">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab("compare")}
                  className={`px-4 py-2.5 rounded-full transition-all cursor-pointer ${
                    activeTab === "compare"
                      ? "bg-primary-20 text-white text-body5m"
                      : "text-neutral-30 text-body5"
                  }`}
                >
                  Compare View
                </button>
                <button
                  onClick={() => setActiveTab("reduction")}
                  disabled={!isApplied}
                  className={`px-4 py-2.5 rounded-full transition-all ${
                    !isApplied ? "cursor-not-allowed" : "cursor-pointer"
                  } ${
                    activeTab === "reduction"
                      ? "bg-primary-20 text-white text-body5m"
                      : "text-neutral-30 text-body5"
                  }`}
                >
                  Reduction View
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 [@media(max-width:1470px)]:gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-secondary-60 flex-shrink-0" />
                <span className="text-body4 text-secondary-60">
                  OPTIVIS NEXUS
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary-15 flex-shrink-0" />
                <span className="text-body4 text-primary-15">
                  Traditional Design
                </span>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex gap-4 [@media(max-width:1470px)]:gap-3 min-h-0 mt-auto">
            {/* Left Area - Smaller Sample, Smaller N to screen, Lower cost */}
            <div className="flex-1 min-w-0 flex flex-col gap-3 [@media(max-width:1470px)]:gap-2">
              {activeTab === "compare" ? (
                /* Smaller Sample Card - Compare View */
                <div
                  className="rounded-[14px] overflow-hidden flex-[3] min-h-0"
                  style={{
                    background: "var(--primary-15)",
                  }}
                >
                  <div className="flex flex-col w-full h-full p-4 gap-12">
                    {/* Card Header */}
                    <div className="flex items-start justify-between flex-shrink-0">
                      <div className="flex flex-col gap-0.25">
                        <h3 className="text-body2m text-neutral-98">
                          Smaller Sample
                        </h3>
                        <p className="text-small1 text-neutral-98">
                          Sample Size vs CI Width
                        </p>
                          <div className={`flex items-center gap-0 mt-1${isApplied ? "" : " invisible"}`}>
                            <ArrowIcon
                              direction={simulationData?.smallerSample?.isNegative ? "up" : "down"}
                              color="white"
                              size="xl"
                            />
                            <p className="text-h2 text-neutral-99" style={{ lineHeight:"-0.1px"}}>
                              {simulationData?.smallerSample?.percentage ||
                                "--"}
                            </p>
                          </div>
                      </div>
                      {isApplied && (
                        <button
                          onClick={() => handleFullscreenClick("smallerSample")}
                        >
                          <FullscreenIcon backgroundColor="var(--primary-10)" />
                        </button>
                      )}
                    </div>
                    {/* Chart Area */}
                    <div
                      className="flex-1 min-h-0 bg-neutral-100 rounded-[8px] p-1"
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
                  className="rounded-[14px] overflow-hidden flex-[3] min-h-0 bg-primary-15 gap-1"
                >
                  <div className="flex flex-col w-full h-full p-4 gap-12">
                    {/* Card Header */}
                    <div className="flex items-start justify-between flex-shrink-0">
                      <div className="flex flex-col gap-0.25">
                        <h3 className="text-body2m text-neutral-98">
                          Smaller Sample
                        </h3>
                        <p className="text-small1 text-neutral-98">
                          Sample Size vs Power
                        </p>
                      {isApplied &&
                        simulationData?.smallerSample?.percentage && (
                          <div className="flex items-center gap-0 mt-1 invisible">
                            <ArrowIcon
                              direction="down"
                              color="white"
                              size="xl"
                            />
                            <p className="text-h2 text-neutral-99">
                              {simulationData.smallerSample.percentage}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Chart Area */}
                    <div
                      className="flex-1 min-h-0 bg-neutral-100 rounded-[8px] overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-4 [@media(max-width:1470px)]:gap-3 h-full p-3 " style={{ gridTemplateRows: "1fr" }}>
                        {/* Sample Size Section */}
                        {reductionCharts.find(
                          (c) => c.label === "Sample Size"
                        ) &&
                          (() => {
                            const chart = reductionCharts.find(
                              (c) => c.label === "Sample Size"
                            )!;
                            return (
                              <div className="flex flex-col h-full gap-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex flex-col gap-1">
                                    <h4 className="text-body4 text-[var(--text-primary)]">
                                      {chart.label}
                                    </h4>
                                    <div className="flex items-center gap-0.5 ">
                                      <ArrowIcon
                                        direction={
                                          chart.isNegative ? "up" : "down"
                                        }
                                        color="var(--text-accent)"
                                        size="l"
                                      />
                                      <span className="text-h3 text-[var(--text-accent)]">
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
                                    <FullscreenIcon size="m" />
                                  </button>
                                </div>
                                <div className="flex-1 min-h-0 overflow-hidden">
                                  <ComparisonBarChart
                                    optivisValue={chart.optivis}
                                    traditionalValue={chart.traditional}
                                    height="100%"
                                    label={chart.label}
                                    size="m"
                                  />
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
                              <div className="flex flex-col h-full gap-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex flex-col gap-1">
                                    <h4 className="text-body4 text-[var(--text-primary)]">
                                      {chart.label}
                                    </h4>
                                    <div className="flex items-center gap-0.5">
                                      <ArrowIcon
                                        direction={
                                          chart.isNegative ? "up" : "down"
                                        }
                                        color="var(--text-accent)"
                                        size="l"
                                      />
                                      <span className="text-h3 text-[var(--text-accent)]" style={{ letterSpacing: "-1.25px"}}>
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
                                    <FullscreenIcon size="m" />
                                  </button>
                                </div>
                                <div className="flex-1 min-h-0 overflow-hidden">
                                  <ComparisonBarChart
                                    optivisValue={chart.optivis}
                                    traditionalValue={chart.traditional}
                                    height="100%"
                                    label={chart.label}
                                    size="m"
                                  />
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
              <div className="flex gap-3 [@media(max-width:1470px)]:gap-2 flex-[2] min-h-0 ">
                {/* Smaller N to screen Card */}
                <div
                  className="flex-1 min-w-0 rounded-[20px] overflow-hidden bg-layer-secondary"
                >
                  <div className="flex flex-col w-full h-full p-4 gap-8 [@media(max-width:1470px)]:gap-3">
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-0.5">
                      {activeTab === "compare" ? (
                        <>
                          <div className="flex flex-col gap-0.25">
                            <h3 className="text-body4 text-neutral-30">
                              Smaller N to screen
                            </h3>
                            <p className="text-small1 text-neutral-30">
                              {isApplied && simulationData
                                ? simulationData.smallerNToScreen.subtitle
                                : "at the same Power"}
                            </p>
                              <div className={`flex items-center gap-0.5 mt-0.5${isApplied ? "" : " invisible"}`}>
                                <ArrowIcon
                                  direction={
                                    simulationData?.smallerNToScreen?.isNegative
                                      ? "up"
                                      : "down"
                                  }
                                  color="var(--text-accent)"
                                  size="m"
                                />
                                <p className="text-body1 text-[var(--text-accent)]">
                                  {simulationData?.smallerNToScreen
                                    ?.percentage || "--"}
                                </p>
                              </div>
                          </div>
                          {isApplied && (
                            <button
                              onClick={() =>
                                handleFullscreenClick("smallerNToScreen")
                              }
                            >
                              <FullscreenIcon size="m" />
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
                                <h3 className="text-body5 text-[var(--text-accent)]">
                                  {chart.label}
                                </h3>
                                <div className="flex items-center gap-1 ">
                                  <ArrowIcon
                                    direction={chart.isNegative ? "up" : "down"}
                                    color="var(--text-accent)"
                                    size="m"
                                  />
                                  <p className="text-body1 text-[var(--text-accent)]">
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
                                  <FullscreenIcon size="m" />
                                </button>
                              )}
                            </>
                          ) : null;
                        })()
                      ) : null}
                    </div>
                    {/* Chart Area */}
                    <div
                      className="mt-auto bg-white/60 rounded-[8px] flex-1 min-h-0 p-1"
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
                            <div className="h-full pt-2 px-2 pb-2">
                              <ComparisonBarChart
                                optivisValue={chart.optivis}
                                traditionalValue={chart.traditional}
                                height="100%"
                                label={chart.label}
                                size="m"
                              />
                            </div>
                          ) : null;
                        })()
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Lower cost Card */}
                <div
                  className="flex-1 min-w-0 rounded-[20px] overflow-hidden"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.6)",
                  }}
                >
                  <div className="flex flex-col w-full h-full p-4 gap-6 [@media(max-width:1470px)]:gap-3">
                    {/* Card Header */}
                    <div className="flex items-start justify-between gap-0.5">
                      {activeTab === "compare" ? (
                        <>
                          <div className="flex flex-col gap-0.25">
                            <h3 className="text-body4 text-neutral-30">
                              Lower cost
                            </h3>
                            <p className="text-small1 text-neutral-30">
                              {isApplied && simulationData
                                ? simulationData.lowerCost.subtitle
                                : "at the same sample size"}
                            </p>
                              <div className={`flex items-center gap-0.5${isApplied ? "" : " invisible"}`}>
                                <ArrowIcon
                                  direction={
                                    simulationData?.lowerCost?.isNegative
                                      ? "up"
                                      : "down"
                                  }
                                  color="var(--text-accent)"
                                  size="m"
                                />
                                <p className="text-body1 text-[var(--text-accent)]">
                                  {simulationData?.lowerCost?.percentage ||
                                    "--"}
                                </p>
                              </div>
                          </div>
                          {isApplied && (
                            <button
                              onClick={() => handleFullscreenClick("lowerCost")}
                            >
                              <FullscreenIcon size="m" />
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
                                <h3 className="text-body5 text-[var(--text-accent)]">
                                  {chart.label}
                                </h3>
                                <div className="flex items-center gap-1 ">
                                  <ArrowIcon
                                    direction={chart.isNegative ? "up" : "down"}
                                    color="var(--text-accent)"
                                    size="m"
                                  />
                                  <p className="text-body1 text-[var(--text-accent)]">
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
                                  <FullscreenIcon size="m" />
                                </button>
                              )}
                            </>
                          ) : null;
                        })()
                      ) : null}
                    </div>
                    {/* Chart Area */}
                    <div
                      className="mt-auto bg-white/60 rounded-[8px] flex-1 min-h-0 p-1"
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
                            <div className="h-full pt-2 px-2 pb-2">
                              <ComparisonBarChart
                                optivisValue={chart.optivis}
                                traditionalValue={chart.traditional}
                                height="100%"
                                label={chart.label}
                                size="m"
                              />
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
            <div className="w-[min(34%,460px)] flex-shrink-0 flex flex-col gap-3 [@media(max-width:1470px)]:gap-2 min-h-0">
              {/* OPTIVIS NEXUS vs Traditional Design Card */}
              <div className="bg-white rounded-[20px] flex flex-col flex-1 min-h-[300px] overflow-hidden p-4 gap-12 [@media(max-width:1470px)]:gap-6">
                {/* Title */}
                <div className="shrink-0">
                  <h3 className="text-body4 text-text-primary">
                    OPTIVIS NEXUS vs Traditional Design
                  </h3>
                </div>

                {/* Table Content */}
                <div className="flex-1 min-h-0 flex flex-col justify-end overflow-x-hidden overflow-y-auto">
                  {/* Table Container (Header + Body) */}
                  <div className="flex flex-col">
                  {/* Header: OPTIVIS/Traditional 컬럼 헤더 */}
                  <div className="flex items-center flex-shrink-0 border-b border-neutral-80 pb-1">
                    <div className="flex-[2] min-w-0"></div>
                    <div className="flex-1 min-w-0 flex items-center gap-1">
                      <span className="text-body5 text-secondary-60">
                        OPTIVIS
                      </span>
                      <FormulaTooltip
                        {...sampleSizeFormulaProps}
                        side="left"
                        align="start"
                        trigger={
                          <button className="flex-shrink-0 cursor-pointer hover:opacity-70 transition-opacity">
                            <InfoIcon
                              className="flex-shrink-0"
                              color="var(--secondary-60)"
                            />
                          </button>
                        }
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-1">
                      <span className="text-body5 text-primary-20">
                        Traditional
                      </span>
                      <FormulaTooltip
                        {...sampleSizeFormulaProps}
                        side="left"
                        align="start"
                        trigger={
                          <button className="flex-shrink-0 cursor-pointer hover:opacity-70 transition-opacity">
                            <InfoIcon
                              className="flex-shrink-0"
                              color="var(--primary-15)"
                            />
                          </button>
                        }
                      />
                    </div>
                  </div>

                  {/* Table Rows */}
                  <div className="flex flex-col flex-1 min-h-0 justify-end">
                    {/* Enrollment Row */}
                    <div className="flex items-center border-b border-neutral-80 py-4 [@media(max-width:1470px)]:py-2">
                      <div className="flex-[2] min-w-0 flex items-center">
                        <div className="flex flex-col">
                          <span className="text-body5 text-neutral-30">
                            Enrollment
                          </span>
                          <span className="text-small1 text-neutral-60">
                            Est. Enrollment Period in Months
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-body2 text-secondary-60">
                          {isApplied && simulationData
                            ? simulationData.comparisonTable.enrollment
                                .optivis
                            : "-"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-body2 text-primary-20">
                          {isApplied && simulationData
                            ? simulationData.comparisonTable.enrollment
                                .traditional
                            : "-"}
                        </span>
                      </div>
                    </div>

                    {/* Primary Endpoint Power Row */}
                    <div className="flex items-center border-b border-neutral-80 py-4 [@media(max-width:1470px)]:py-2">
                      <div className="flex-[2] min-w-0 flex items-center">
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
                      <div className="flex-1 min-w-0">
                        <span className="text-body2 text-secondary-60">
                          {isApplied && simulationData
                            ? simulationData.comparisonTable
                                .primaryEndpointPower.optivis
                            : "-"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-body2 text-primary-20">
                          {isApplied && simulationData
                            ? simulationData.comparisonTable
                                .primaryEndpointPower.traditional
                            : "-"}
                        </span>
                      </div>
                    </div>

                    {/* Secondary Endpoint Power Row */}
                    {apiData?.result_trialdesignconditionsummary
                      ?.secondary_endpoint && (
                      <div className="flex items-center border-b border-neutral-80 py-3">
                        <div className="flex-[2] min-w-0 flex items-center">
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
                        <div className="flex-1 min-w-0">
                          <span className="text-body2 text-secondary-60">
                            {isApplied && simulationData
                              ? simulationData.comparisonTable
                                  .secondaryEndpointPower.optivis
                              : "-"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-body2 text-primary-20">
                            {isApplied && simulationData
                              ? simulationData.comparisonTable
                                  .secondaryEndpointPower.traditional
                              : "-"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Sample Size Row (Formula & Used Value는 OPTIVIS/Traditional 헤더 info 아이콘에서 표시) */}
                    <div className="flex flex-col pt-4 pb-0 justify-center [@media(max-width:1470px)]:pt-2">
                      <span className="text-body5 text-neutral-30">Sample Size</span>
                      {/* Treatment Group 1 */}
                      <div className="flex items-center">
                        <div className="flex-[2] min-w-0">
                          <span className="text-small1 text-neutral-60">Treatment Group 1</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-body2 text-secondary-60">
                            {isApplied && simulationData
                              ? simulationData.comparisonTable.sampleSize.optivis.treatmentGroup1 ?? "-"
                              : "-"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-body2 text-primary-20">
                            {isApplied && simulationData
                              ? simulationData.comparisonTable.sampleSize.traditional.treatmentGroup1 ?? "-"
                              : "-"}
                          </span>
                        </div>
                      </div>
                      {/* Treatment Group 2 */}
                      {isApplied &&
                        simulationData &&
                        (simulationData.comparisonTable.sampleSize.optivis.treatmentGroup2 !== null ||
                          simulationData.comparisonTable.sampleSize.traditional.treatmentGroup2 !== null) && (
                          <div className="flex items-center">
                            <div className="flex-[2] min-w-0">
                              <span className="text-small1 text-neutral-60">Treatment Group 2</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-body2 text-secondary-60">
                                {simulationData.comparisonTable.sampleSize.optivis.treatmentGroup2 ?? "-"}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-body2 text-primary-20">
                                {simulationData.comparisonTable.sampleSize.traditional.treatmentGroup2 ?? "-"}
                              </span>
                            </div>
                          </div>
                        )}
                      {/* Treatment Group 3 */}
                      {isApplied &&
                        simulationData &&
                        (simulationData.comparisonTable.sampleSize.optivis.treatmentGroup3 !== null ||
                          simulationData.comparisonTable.sampleSize.traditional.treatmentGroup3 !== null) && (
                          <div className="flex items-center">
                            <div className="flex-[2] min-w-0">
                              <span className="text-small1 text-neutral-60">Treatment Group 3</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-body2 text-secondary-60">
                                {simulationData.comparisonTable.sampleSize.optivis.treatmentGroup3 ?? "-"}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-body2 text-primary-20">
                                {simulationData.comparisonTable.sampleSize.traditional.treatmentGroup3 ?? "-"}
                              </span>
                            </div>
                          </div>
                        )}
                      {/* Control Group */}
                      <div className="flex items-center">
                        <div className="flex-[2] min-w-0">
                          <span className="text-small2 text-neutral-60">Control Group</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-body2 text-secondary-60">
                            {isApplied && simulationData
                              ? simulationData.comparisonTable.sampleSize.optivis.controlGroup
                              : "-"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-body2 text-primary-20">
                            {isApplied && simulationData
                              ? simulationData.comparisonTable.sampleSize.traditional.controlGroup
                              : "-"}
                          </span>
                        </div>
                      </div>
                      {/* Total */}
                      <div className="flex items-center">
                        <div className="flex-[2] min-w-0">
                          <span className="text-small2 text-neutral-60">Total</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-body2 text-secondary-60">
                            {isApplied && simulationData
                              ? simulationData.comparisonTable.sampleSize.optivis.total
                              : "-"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-body2 text-primary-20">
                            {isApplied && simulationData
                              ? simulationData.comparisonTable.sampleSize.traditional.total
                              : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* End Table Container */}
                  </div>
                </div>
              </div>

              {/* Reduction View Card / Compare View Card */}
              <div className="bg-white rounded-[20px] flex flex-col flex-1 min-h-0 overflow-hidden p-4 gap-8 [@media(max-width:1470px)]:gap-4">
                {/* Title */}
                <div className="flex-shrink-0 ">
                  <h3 className="text-body4 text-text-primary">
                    {activeTab === "compare"
                      ? "Reduction View"
                      : "Compare View"}
                  </h3>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
                  {activeTab === "compare" ? (
                    isApplied ? (
                      <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full min-h-0 overflow-hidden">
                        {reductionCharts.map(
                          (chart, index) => (
                            <div key={index} className="flex flex-col min-h-0 min-w-0 overflow-hidden">
                              {/* 라벨 + 수치 + 버튼 */}
                              <div className="flex-1 flex items-start justify-between h-fit">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-small1 text-[var(--text-primary)]">
                                    {chart.label}
                                  </span>
                                  <div className="flex items-center gap-0.5">
                                    <ArrowIcon
                                      direction={
                                        chart.isNegative ? "up" : "down"
                                      }
                                      color="var(--text-accent)"
                                      size="m"
                                    />
                                    <span className="text-body2m text-[var(--text-accent)]">
                                      {chart.change}
                                    </span>
                                  </div>
                                </div>
                                <button
                                  className="shrink-0"
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
                                  <FullscreenIcon size="s" />
                                </button>
                              </div>
                              {/* 그래프 */}
                              <div className="flex-1 min-h-0 min-w-0 w-full overflow-hidden">
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
                      <div className="flex-1 bg-neutral-98 rounded-[8px] ">
                        {/* Empty state */}
                      </div>
                    )
                  ) : /* Compare View Charts - when activeTab is "reduction" */
                  isApplied && chartDataToUse ? (
                    <div className="flex flex-col gap-4 [@media(max-width:1470px)]:gap-1 h-full overflow-x-hidden">
                      {/* Smaller Sample Chart - Single */}
                      {chartDataToUse.smallerSample.optivis.length > 0 && (
                        <div className="flex flex-col gap-0 flex-1 min-h-0">
                          <div className="flex items-start justify-between">
                            <div className="flex flex-col gap-0.5">
                              <h4 className="text-small1 text-text-primary">
                                Smaller Sample
                              </h4>
                              {simulationData && (
                                <div className="flex items-center gap-0">
                                  <ArrowIcon
                                    direction={
                                      simulationData?.smallerSample?.isNegative
                                        ? "up"
                                        : "down"
                                    }
                                    color="var(--text-accent)"
                                    size="m"
                                  />
                                  <span className="text-body2m text-[var(--text-primary)]">
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
                              <FullscreenIcon size="s" />
                            </button>
                          </div>
                            <div
                              className="bg-white rounded-[8px] w-full flex-1 min-h-0"
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
                      <div className="grid grid-cols-2 gap-4 [@media(max-width:1470px)]:gap-2 flex-1 min-h-0">
                        {/* Smaller N to screen Chart */}
                        {chartDataToUse.smallerNToScreen.optivis.length > 0 && (
                          <div className="flex flex-col gap-0 flex-1 min-h-0">
                            <div className="flex items-start justify-between">
                              <div className="flex flex-col gap-0.5">
                                <h4 className="text-small1 text-text-primary">
                                  Smaller N to screen
                                </h4>
                                {simulationData && (
                                  <div className="flex items-center gap-0 ">
                                    <ArrowIcon
                                      direction={
                                        simulationData?.smallerNToScreen
                                          ?.isNegative
                                          ? "up"
                                          : "down"
                                      }
                                      color="var(--text-accent)"
                                      size="m"
                                    />
                                    <span className="text-body2m text-neutral-30">
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
                                <FullscreenIcon size="s" />
                              </button>
                            </div>
                            <div
                              className="bg-white rounded-[8px] w-full flex-1 min-h-0"
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
                          <div className="flex flex-col gap-0 flex-1 min-h-0">
                            <div className="flex items-start justify-between">
                              <div className="flex flex-col gap-0.5">
                                <h4 className="text-small1 text-text-primary">
                                  Lower cost
                                </h4>
                                {simulationData && (
                                  <div className="flex items-center gap-0 ">
                                    <ArrowIcon
                                      direction={
                                        simulationData?.lowerCost?.isNegative
                                          ? "up"
                                          : "down"
                                      }
                                      color="var(--text-accent)"
                                      size="m"
                                    />
                                    <span className="text-body2m text-neutral-30">
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
                                <FullscreenIcon size="s" />
                              </button>
                            </div>
                            <div
                              className="bg-white rounded-[8px] w-full flex-1 min-h-0"
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
                    <div className="flex-1 bg-neutral-98 rounded-[8px] border border-neutral-90">
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
