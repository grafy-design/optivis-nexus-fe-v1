"use client";

import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import Image from "next/image";
import { LineChartWithHighlight } from "@/components/charts/LineChartWithHighlight";

interface FullscreenChartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle: string;
  percentage: string;
  optivisData: number[][];
  traditionalData: number[][];
  highlightXValue?: number;
  xAxisName: string;
  yAxisName: string;
  isNegative?: boolean;
}

export default function FullscreenChartModal({
  open,
  onOpenChange,
  title,
  subtitle,
  percentage,
  optivisData,
  traditionalData,
  highlightXValue,
  xAxisName,
  yAxisName,
  isNegative = false,
}: FullscreenChartModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 z-[110]" />
        <Dialog.Content className="opacity-94 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[120] w-full max-w-[1664px] h-full max-h-[830px] p-0 border-0 bg-transparent">
          <VisuallyHidden.Root>
            <Dialog.Title>{title} Fullscreen Chart</Dialog.Title>
            <Dialog.Description>
              Fullscreen view of {title} chart with detailed visualization
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
                  {/* 화살표 SVG (모든 차트에 표시) */}
                  <svg
                    width="44"
                    height="44"
                    viewBox="0 0 44 44"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="flex-shrink-0"
                    style={{
                      transform: isNegative ? "rotate(180deg)" : "none",
                      transition: "transform 0.2s",
                    }}
                  >
                    <g clipPath="url(#clip0_fullscreen_arrow)">
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
                      <clipPath id="clip0_fullscreen_arrow">
                        <rect
                          width="44"
                          height="44"
                          fill="white"
                          transform="matrix(0 1 1 4.37114e-08 0 0)"
                        />
                      </clipPath>
                    </defs>
                  </svg>
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
              <div className="w-full h-full bg-neutral-95 rounded-[24px] border border-white p-6">
                {/* Legend */}
                <div className="flex items-center gap-8 mb-4">
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
                <div className="w-full h-full min-h-[400px]">
                  <LineChartWithHighlight
                    optivisData={optivisData}
                    traditionalData={traditionalData}
                    xAxisName={xAxisName}
                    yAxisName={yAxisName}
                    highlightXValue={highlightXValue}
                    grid={{
                      left: 80,
                      right: 40,
                      top: 40,
                      bottom: 80,
                      containLabel: false,
                    }}
                    xAxisConfig={{
                      nameGap: 35,
                      nameTextStyle: {
                        fontSize: 19.5,
                        fontWeight: 590,
                        letterSpacing: -0.78,
                        color: "#1c1b1c",
                      },
                      scale: true,
                      axisLabel: {
                        fontSize: 10,
                        fontWeight: 510,
                        color: "#484646",
                      },
                    }}
                    yAxisConfig={{
                      nameGap: 60,
                      nameTextStyle: {
                        fontSize: 19.5,
                        fontWeight: 590,
                        letterSpacing: -0.78,
                        color: "#1c1b1c",
                      },
                      scale: true,
                      axisLabel: {
                        fontSize: 10,
                        fontWeight: 510,
                        color: "#484646",
                      },
                    }}
                    showGrid={true}
                    showAxes={true}
                    showTicks={true}
                    showTooltip={true}
                    optivisColor="#f06600"
                    traditionalColor="#231f52"
                    optivisSymbolSize={8}
                    traditionalSymbolSize={8}
                    optivisLineWidth={3}
                    traditionalLineWidth={3}
                    showAreaStyle={true}
                    optivisAreaColor="rgba(240, 102, 0, 0.25)"
                    traditionalAreaColor="rgba(35, 31, 82, 0.25)"
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
