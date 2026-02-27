"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import Image from "next/image";
import ReactECharts from "@/components/charts/DynamicECharts";
import ArrowIcon from "@/components/ui/arrow-icon";
interface FullscreenBarChartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle: string;
  percentage: string;
  optivisValue: number;
  traditionalValue: number;
  isNegative?: boolean;
  formatter?: (value: number, label?: string) => string;
}

export default function FullscreenBarChartModal({
  open,
  onOpenChange,
  title,
  subtitle,
  percentage,
  optivisValue,
  traditionalValue,
  isNegative = false,
  formatter,
}: FullscreenBarChartModalProps) {
  const [showReduction, setShowReduction] = useState(false);
  const chartRef = useRef<any>(null);

  const reduction = traditionalValue - optivisValue;

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setShowReduction(false);
    }
    onOpenChange(newOpen);
  };

  // 차트 영역 전체 클릭 감지
  useEffect(() => {
    if (!open) return;

    const chartInstance = chartRef.current?.getEchartsInstance();
    if (!chartInstance) return;

    const zr = chartInstance.getZr();

    const handleClick = () => {
      if (reduction > 0) {
        setShowReduction((prev) => !prev);
      }
    };

    zr.on("click", handleClick);

    return () => {
      zr.off("click", handleClick);
    };
  }, [open, reduction]);
  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 z-[110]" />
        <Dialog.Content className="opacity-94 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[120] w-full max-w-[1664px] h-full max-h-[830px] p-0 border-0 bg-transparent">
          <VisuallyHidden.Root>
            <Dialog.Title>{title} Fullscreen Chart</Dialog.Title>
            <Dialog.Description>
              Fullscreen view of {title} bar chart with detailed visualization
            </Dialog.Description>
          </VisuallyHidden.Root>

          {/* Background Image */}
          <div className="relative w-full h-full">
            <Image
              src="/assets/simulation/fullscreen-bg.png"
              alt="Fullscreen Background"
              fill
              className="object-cover"
              priority
            />

            {/* Header Section */}
            <div className="absolute top-6 left-6 right-6 z-10 flex items-start justify-between">
              <div className="flex flex-col gap-2">
                <h2
                  className="text-neutral-98"
                  style={{
                    fontFamily: "Inter",
                    fontStyle: "normal",
                    fontWeight: 510,
                    fontSize: "24px",
                    letterSpacing: "-0.64px",
                    lineHeight: "28.8px",
                  }}
                >
                  {title}
                </h2>
                <p
                  className="text-neutral-98"
                  style={{
                    fontFamily: "Inter",
                    fontStyle: "normal",
                    fontWeight: 590,
                    fontSize: "15px",
                    letterSpacing: "-0.6px",
                    lineHeight: "16.5px",
                  }}
                >
                  {subtitle}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <ArrowIcon
                    direction={isNegative ? "up" : "down"}
                    color="#fafafa"
                    className="w-11 h-11"
                  />
                  <p
                    className="text-neutral-98"
                    style={{
                      fontFamily: "Inter",
                      fontStyle: "normal",
                      fontWeight: 510,
                      fontSize: "60px",
                      letterSpacing: "-1.8px",
                      lineHeight: "60px",
                    }}
                  >
                    {percentage}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <Dialog.Close asChild>
                <button className="w-[120px] h-12 flex items-center justify-center hover:opacity-70 transition-opacity cursor-pointer z-10">
                  <Image
                    src="/assets/simulation/close-button.png"
                    alt="Close"
                    width={120}
                    height={48}
                    className="flex-shrink-0 w-full h-full object-contain"
                  />
                </button>
              </Dialog.Close>
            </div>

            {/* Chart Section */}
            <div className="absolute bottom-6 left-6 right-6 top-[180px] z-10">
              <div className="w-full h-full bg-neutral-95 rounded-[24px] border border-white p-6 flex flex-col">
                {/* Legend */}
                <div className="flex items-center gap-8 mb-4 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#f06600]" />
                    <span
                      style={{
                        fontFamily: "Inter",
                        fontStyle: "normal",
                        fontWeight: 590,
                        fontSize: "16px",
                        letterSpacing: "-0.64px",
                        lineHeight: "19.2px",
                        color: "#f06600",
                      }}
                    >
                      OPTIVIS NEXUS
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#231f52]" />
                    <span
                      style={{
                        fontFamily: "Inter",
                        fontStyle: "normal",
                        fontWeight: 590,
                        fontSize: "16px",
                        letterSpacing: "-0.64px",
                        lineHeight: "19.2px",
                        color: "#231f52",
                      }}
                    >
                      Traditional Design
                    </span>
                  </div>
                </div>

                {/* Chart */}
                <div className="flex-1 w-full min-h-0 relative cursor-pointer">
                  <ReactECharts
                    ref={chartRef}
                    option={{
                      grid: {
                        left: 80,
                        right: 40,
                        top: 40,
                        bottom: 80,
                        containLabel: false,
                      },
                      xAxis: {
                        type: "category",
                        data: ["Optivis", "Traditional"],
                        axisLine: {
                          show: true,
                          lineStyle: {
                            color: "#999",
                          },
                        },
                        axisTick: {
                          show: true,
                        },
                        axisLabel: {
                          show: true,
                          fontSize: 19.5,
                          fontWeight: 590,
                          color: "#484646",
                          fontFamily: "Inter",
                          letterSpacing: -0.78,
                        },
                      },
                      yAxis: {
                        type: "value",
                        name: title,
                        nameLocation: "middle",
                        nameGap: 60,
                        nameTextStyle: {
                          fontSize: 19.5,
                          fontWeight: 590,
                          letterSpacing: -0.78,
                          color: "#1c1b1c",
                          fontFamily: "Inter",
                        },
                        axisLine: {
                          show: true,
                          lineStyle: {
                            color: "#999",
                          },
                        },
                        axisTick: {
                          show: true,
                        },
                        axisLabel: {
                          show: true,
                          fontSize: 10,
                          fontWeight: 510,
                          color: "#484646",
                          fontFamily: "Inter",
                          letterSpacing: -0.2,
                        },
                        splitLine: {
                          show: true,
                          lineStyle: {
                            color: "#e0e0e0",
                            type: "dashed",
                          },
                        },
                        max: Math.max(optivisValue, traditionalValue) * 1.2,
                      },
                      series: [
                        {
                          type: "bar",
                          data: [optivisValue, traditionalValue],
                          itemStyle: {
                            color: (params: any) => {
                              return params.dataIndex === 0
                                ? "#f06600"
                                : "#231f52";
                            },
                            borderRadius: [9, 9, 9, 9],
                          },
                          barWidth: "60%",
                          label: {
                            show: true,
                            position: "insideTop",
                            formatter: (params: any) => {
                              const value = params.value;
                              return formatter
                                ? formatter(value, title)
                                : String(value);
                            },
                            color: "#ffffff",
                            fontSize: 36,
                            fontWeight: 590,
                            lineHeight: 36,
                            letterSpacing: -0.72,
                            fontFamily: "Inter",
                          },
                        },
                        // 감소량 표시용 커스텀 shape (클릭 시에만 표시, Optivis에만)
                        ...(showReduction && reduction > 0
                          ? [
                              {
                                type: "custom" as const,
                                renderItem: (params: any, api: any) => {
                                  // Optivis(첫 번째 카테고리, dataIndex 0)에만 표시
                                  if (params.dataIndex !== 0) return null;

                                  // 각 카테고리의 중심점 좌표 계산
                                  const optivisCenter = api.coord([0, 0]); // Optivis 중심
                                  const traditionalCenter = api.coord([1, 0]); // Traditional 중심

                                  // 카테고리 간격 계산
                                  const categoryGap =
                                    traditionalCenter[0] - optivisCenter[0];

                                  // barWidth가 60%이므로 실제 픽셀 너비 계산
                                  const barWidth = categoryGap * 0.6;

                                  // Optivis 바의 왼쪽 시작점과 중심점
                                  const barCenterX = optivisCenter[0];
                                  const rectX = barCenterX - barWidth / 2;

                                  // y축 위치 계산
                                  const traditionalBarCoord = api.coord([
                                    0,
                                    traditionalValue,
                                  ]);
                                  const optivisBarCoord = api.coord([
                                    0,
                                    optivisValue,
                                  ]);
                                  const rectTopY = traditionalBarCoord[1];
                                  const rectBottomY = optivisBarCoord[1];
                                  const rectHeight = rectTopY - rectBottomY;

                                  return {
                                    type: "group",
                                    children: [
                                      {
                                        // 그라데이션 영역
                                        type: "rect",
                                        shape: {
                                          x: rectX,
                                          y: rectBottomY,
                                          width: barWidth,
                                          height: rectHeight,
                                        },
                                        style: {
                                          fill: {
                                            type: "linear",
                                            x: 0,
                                            y: rectTopY,
                                            x2: 0,
                                            y2: rectBottomY,
                                            colorStops: [
                                              {
                                                offset: 0,
                                                color: "rgba(240, 102, 0, 0.6)",
                                              },
                                              {
                                                offset: 1,
                                                color: "rgb(255, 255, 255)",
                                              },
                                            ],
                                          },
                                        },
                                        silent: true,
                                      },
                                      {
                                        // 상단 보더 선
                                        type: "line",
                                        shape: {
                                          x1: rectX,
                                          y1: rectTopY,
                                          x2: rectX + barWidth,
                                          y2: rectTopY,
                                        },
                                        style: {
                                          stroke: "#f06600",
                                          lineWidth: 2,
                                        },
                                        silent: true,
                                      },
                                      {
                                        // 감소량 텍스트
                                        type: "text",
                                        position: [
                                          barCenterX,
                                          rectBottomY + rectHeight / 2,
                                        ],
                                        style: {
                                          text: `-${
                                            formatter
                                              ? formatter(reduction, title)
                                              : String(Math.round(reduction))
                                          }`,
                                          fill: "#f06600",
                                          fontSize: 36,
                                          fontWeight: 590,
                                          textAlign: "center",
                                          textVerticalAlign: "middle",
                                          fontFamily: "Inter",
                                        },
                                        silent: true,
                                      },
                                    ],
                                  };
                                },
                                // x축 카테고리 ["Optivis", "Traditional"]에 매핑
                                // Optivis에만 값 설정, Traditional은 null
                                data: [traditionalValue, null],
                                z: 10,
                              },
                            ]
                          : []),
                      ],
                      tooltip: {
                        show: false,
                      },
                    }}
                    style={{ height: "100%", width: "100%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
