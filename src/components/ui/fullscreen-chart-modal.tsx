"use client";

/**
 * FullscreenChartModal
 * ATS 시뮬레이션 리포트 차트 전체화면 모달.
 * Radix Dialog로 구성되며, 배경 이미지 + 블러 오버레이 위에
 * 헤더(타이틀·퍼센트·닫기 버튼)와 라인 차트를 렌더링한다.
 */

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
        {/* 모달 배경 딤(dim) — backdrop-blur-sm으로 뒷배경 흐림 처리 */}
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110]" />

        {/* 모달 콘텐츠 컨테이너 — 화면 중앙 고정, 최대 1664×830px */}
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[120] w-full max-w-[1664px] h-full max-h-[830px] p-0 border-0 bg-transparent">

          {/* 스크린 리더용 숨김 타이틀/설명 */}
          <VisuallyHidden.Root>
            <Dialog.Title>{title} Fullscreen Chart</Dialog.Title>
            <Dialog.Description>
              Fullscreen view of {title} chart with detailed visualization
            </Dialog.Description>
          </VisuallyHidden.Root>

          {/* 배경 이미지 + 오버레이 루트 래퍼 */}
          <div className="relative w-full h-full">

            {/* 배경 이미지 — opacity-75로 반투명 렌더링 */}
            <Image
              src="/assets/simulation/fullscreen-bg.png"
              alt="Fullscreen Background"
              fill
              priority
              className="opacity-75"
            />

            {/* backdrop-blur 레이어 — 배경 이미지 위에 추가 블러 효과 적용 */}
            <div className="rounded-[36px] absolute inset-0 backdrop-blur-md z-[1]" />

            {/* ── 헤더 섹션 ── 타이틀·퍼센트(좌) + 닫기 버튼(우) */}
            <div className="absolute top-6 left-6 right-6 z-10 flex items-start justify-between gap-2">

              {/* 좌측: 타이틀 / 서브타이틀 / 퍼센트 */}
              <div className="flex flex-col gap-0.5">
                <h2 className="text-neutral-98 text-body2" style={{ letterSpacing: "-0.64px" }}>
                  {title}
                </h2>
                <p className="text-neutral-98 text-body5" style={{ letterSpacing: "-0.6px" }}>
                  {subtitle}
                </p>

                {/* 퍼센트 표시 행 — 화살표 SVG + 수치 */}
                <div className="flex items-center gap-0 mt-1">
                  {/* 화살표 SVG — isNegative 시 180° 회전으로 하락 방향 표시 */}
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
                        strokeWidth="5"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M39.793 22.7061L21.9951 40.5039L4.19727 22.7061"
                        stroke="white"
                        strokeWidth="5"
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

                  {/* 퍼센트 수치 텍스트 */}
                  <p
                    className="text-neutral-98"
                    style={{ fontSize: "54px", fontWeight: 500, letterSpacing: "-1.8px", lineHeight: "60px" }}
                  >
                    {percentage}
                  </p>
                </div>
              </div>

              {/* 우측: 닫기 버튼 */}
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

            {/* ── 차트 섹션 ── 헤더 아래 나머지 영역 전체 */}
            <div className="absolute bottom-6 left-6 right-6 top-[180px] z-10 ">

              {/*
               * 차트 카드 — flex-col로 변경하여 legend와 차트가
               * 수직 배치되고 카드 밖으로 넘치지 않도록 수정
               */}
              <div className="w-full h-full bg-neutral-100 rounded-[24px] border border-white p-6 flex flex-col gap-6">

                {/* 범례 — flex-shrink-0으로 높이 고정 (차트에 공간 양보) */}
                <div className="flex items-center gap-8 mb-4 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-secondary-60" />
                    <span className="text-body4 text-secondary-60" style={{ letterSpacing: "-0.64px" }}>
                      OPTIVIS NEXUS
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary-15" />
                    <span className="text-body4 text-primary-15" style={{ letterSpacing: "-0.64px" }}>
                      Traditional Design
                    </span>
                  </div>
                </div>

                {/*
                 * 차트 래퍼 — flex-1 + min-h-0으로 남은 공간을 모두 차지하되
                 * 부모 컨테이너를 벗어나지 않도록 overflow 방지
                 */}
                <div className="w-full flex-1 min-h-0">
                  <LineChartWithHighlight
                    optivisData={optivisData}
                    traditionalData={traditionalData}
                    xAxisName={xAxisName}
                    yAxisName={yAxisName}
                    highlightXValue={highlightXValue}
                    grid={{
                      left: 80,
                      right: 8,
                      top: 8,
                      bottom: 54,
                      containLabel: false,
                    }}
                    xAxisConfig={{
                      nameGap: 36,
                      nameTextStyle: { fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 590, letterSpacing: -0.78, color: "#484646" },
                      scale: true,
                      axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 510, color: "#484646", margin: 8 },
                    }}
                    yAxisConfig={{
                      nameGap: 60,
                      nameTextStyle: { fontFamily: "Inter, sans-serif", fontSize: 15, fontWeight: 590, letterSpacing: -0.78, color: "#484646" },
                      scale: true,
                      axisLabel: { fontFamily: "Inter, sans-serif", fontSize: 10, fontWeight: 500, color: "#484646", margin: 8 },
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
