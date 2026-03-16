"use client";

/**
 * HypothesisTypeModal — 가설 유형 개요를 카드 컴포넌트로 시각화하는 다이얼로그
 *
 * 주요 수정사항:
 * - 모달 배경: add-endpoints-modal과 동일한 위계 — 반투명 배경(#696969) + opacity-94 + rounded-36
 * - 닫기 버튼: GlassBtn + glass-btn-dark 클래스 + color="#ffffff" 적용 (흰색 텍스트·아이콘)
 * - 헤더 레이아웃: absolute → flex justify-between으로 변경하여 다른 모달과 위계 통일
 * - 카드 텍스트: text-body2/body5/body5m 타이포그래피 토큰 적용, text-text-accent/secondary 색상
 * - 카드 제목 하단: 구분선(border-bottom) 추가
 * - 차트 영역: min-h-[120px], pt-9로 차트 수직 중앙 배치
 */

import * as Dialog from "@radix-ui/react-dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { GlassBtn } from "@/components/layout/header/GlassBtn";

/** 가설 유형별 수직선 도식 미니 차트 */
function HypothesisChart({ type }: { type: "superiority" | "equivalence" | "noninferiority" }) {
  const W = 200, H = 52, cy = 20;
  const xNeg = 40, xZero = 100, xPos = 160; // -Δ, 0, +Δ 마커 x 위치

  const range = {
    superiority:    { from: xZero,      to: W },
    equivalence:    { from: xNeg,       to: xPos },
    noninferiority: { from: xNeg + 10,  to: W },
  }[type];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="52">
      {/* 전체 배경 회색 라인 */}
      <line x1={0} y1={cy} x2={W} y2={cy} stroke="#c4c4c4" strokeWidth="3" strokeLinecap="round" />
      {/* 가설 범위 두꺼운 진한 라인 */}
      <line x1={range.from} y1={cy} x2={range.to} y2={cy} stroke="#231f52" strokeWidth="5" strokeLinecap="round" />
      {/* 점선 수직 마커 */}
      {[xNeg, xZero, xPos].map((x, i) => (
        <line key={i} x1={x} y1={7} x2={x} y2={cy + 13} stroke="#9ca3af" strokeWidth="1" strokeDasharray="3,2" />
      ))}
      {/* 라벨 */}
      <text x={xNeg}  y={H} textAnchor="middle" fontSize="9.5" fill="#9ca3af">-Δ</text>
      <text x={xZero} y={H} textAnchor="middle" fontSize="9.5" fill="#9ca3af">0</text>
      <text x={xPos}  y={H} textAnchor="middle" fontSize="9.5" fill="#9ca3af">+Δ</text>
    </svg>
  );
}

const HYPOTHESIS_CARDS = [
  {
    type: "superiority" as const,
    title: "Superiority",
    purpose: "Chosen when the goal is to prove the new treatment is clearly better than the existing one.",
    sampleSize: "A larger treatment effect allows a smaller sample size and a more economical trial.",
  },
  {
    type: "equivalence" as const,
    title: "Equivalence",
    purpose: "Chosen when the goal is to prove the new treatment has essentially the same efficacy as the standard.",
    sampleSize: "Because the allowed difference is very small, this design requires the largest number of patients.",
  },
  {
    type: "noninferiority" as const,
    title: "Non-inferiority",
    purpose:
      "Chosen when the new treatment is expected to have similar efficacy but better safety, tolerability, or convenience, and needs to be shown as not worse than the standard.",
    sampleSize: "When the difference is clearer, fewer patients are needed, allowing a more efficient design.",
  },
] as const;

interface HypothesisTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function HypothesisTypeModal({ open, onOpenChange }: HypothesisTypeModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110]" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[120] w-[880px] h-[522px] p-0 border-0 bg-transparent"
        >
          <VisuallyHidden.Root>
            <Dialog.Description>
              Choose the hypothesis based on your study goal and margin assumptions
            </Dialog.Description>
          </VisuallyHidden.Root>

          {/* add-endpoints-modal과 동일한 위계 — 배경/opacity/radius를 내부 래퍼에 적용 */}
          <div
            className="relative w-full h-full rounded-[36px] overflow-hidden opacity-94"
            style={{ backgroundColor: "#696969ff" }}
          >
          {/* 전체 레이아웃 */}
          <div className="w-full h-full flex flex-col p-6 gap-12">

            {/* 헤더 */}
            <div className="flex-shrink-0 mb-5 flex items-start justify-between">
              <div>
                <Dialog.Title className="text-h4 text-white mb-1">
                  Hypothesis Type Overview
                </Dialog.Title>
                <p style={{ fontSize: 13, color: "#ababab" }}>
                  Choose the hypothesis based on your study goal and margin assumptions
                </p>
              </div>
              <Dialog.Close asChild>
                <GlassBtn
                  onClick={() => onOpenChange(false)}
                  iconSrc="/icons/basics/close-16.svg"
                  width={120}
                  className="glass-btn-dark"
                  color="#ffffff"
                >
                  Close
                </GlassBtn>
              </Dialog.Close>
            </div>

            {/* 카드 3개 */}
            <div className="flex gap-4 flex-1 min-h-0">
              {HYPOTHESIS_CARDS.map((card) => (
                <div
                  key={card.type}
                  className="flex-1 rounded-2xl p-5 flex flex-col"
                  style={{ backgroundColor: "#f8f8f8" }}
                >
                  {/* 미니 도식 차트 영역 */}
                  <div className="rounded-xl px-4 pt-9 pb-1 mb-2 flex-shrink-0 min-h-[120px] items-center justify-center" style={{ backgroundColor: "#e9e9e9" }}>
                    <HypothesisChart type={card.type} />
                  </div>

                  {/* 카드 제목 */}
                  <p className="text-body2 text-text-accent mb-2 flex-shrink-0" style={{borderBottomColor:"#ababab",borderBottomWidth:"1px",borderBottomStyle:"solid",paddingBottom:"4px"}}>
                    {card.title}
                  </p>

                  {/* Purpose */}
                  <div className="mb-3">
                    <p className="text-body5 text-text-accent mb-0.5">Purpose</p>
                    <p className="text-body5m text-text-secondary">{card.purpose}</p>
                  </div>

                  {/* Sample Size */}
                  <div>
                    <p className="text-body5 text-text-accent mb-0.5">Sample Size</p>
                    <p className="text-body5m text-text-secondary">{card.sampleSize}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
