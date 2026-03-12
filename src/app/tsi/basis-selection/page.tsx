"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import PrognosticChart from "./charts/PrognosticChart";
import DrugResponsivenessChart from "./charts/DrugResponsivenessChart";
import SafetyChart from "./charts/SafetyChart";

/**
 * TSI Step 3: Basis Selection
 * 하위군 분류 기준(Basis)을 선택하는 단계.
 * 왼쪽: 선택 목록 카드, 오른쪽: 선택된 기준의 설명 + 차트 카드
 *
 * Step 3: Select a subgroup basis (Prognostic / Drug Responsiveness / Safety / Multiple Conditions).
 * Left card: option list, Right card: description + chart preview for the hovered/selected option.
 */

// ── 기준 옵션 목록 / Basis option list ─────────────────────────────────
const BASIS_OPTIONS: Array<{
  id: string;
  label: string;
  disabled?: boolean;
}> = [
  { id: "prognostic",           label: "Prognostic" },
  { id: "drug-responsiveness",  label: "Drug Responsiveness" },
  { id: "safety",               label: "Safety" },
  { id: "multiple-conditions",  label: "Multiple Conditions", disabled: true },
];

// ── 기준별 설명 텍스트 / Description text per basis ─────────────────────
const BASIS_CONTENT: Record<string, { title: string; description: string }> = {
  prognostic: {
    title: "Stratify patients based on predicted disease progression metrics",
    description:
      "Patients are divided into rapid progressors and slow or stable progressors using predicted progression scores and progression slopes, reducing heterogeneity and improving trial design and analysis efficiency.",
  },
  "drug-responsiveness": {
    title: "Stratify patients based on treatment effect responsiveness",
    description:
      "Patients are divided into high responders and low or non-responders using the rHTE score, reducing overlap between treatment and control outcome distributions and making the treatment effect more detectable.",
  },
  safety: {
    title: "Stratify patients based on safety and dropout risk",
    description:
      "Patients are divided into high-risk and low-risk groups using safety risk and dropout risk scores, reducing attrition risk and operational bias and improving overall trial robustness.",
  },
  "multiple-conditions": {
    title: "Multiple Conditions",
    description: "설명 추후 전달 예정.",
  },
};

/**
 * 선택된 기준에 맞는 차트를 렌더링하는 헬퍼 컴포넌트
 * Renders the appropriate chart based on the selected basis ID
 */
function BasisChart({ basis }: { basis: string }) {
  if (basis === "drug-responsiveness") return <DrugResponsivenessChart />;
  if (basis === "safety") return <SafetyChart />;
  return <PrognosticChart />;
}

/**
 * 오른쪽 방향 꺽쇠 아이콘 / Right chevron icon for list items
 */
function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M9 18L15 12L9 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 실제 페이지 컨텐츠 (useSearchParams 사용 → Suspense 래핑 필요)
 * Actual page content, wrapped in Suspense because it calls useSearchParams
 */
function TSIBasisSelectionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [titleFontSize, setTitleFontSize] = useState(42);
  useEffect(() => {
    const update = () => setTitleFontSize(window.innerWidth > 1470 ? 42 : 36);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // URL 쿼리에서 taskId 읽기 / Read taskId from URL query
  const taskId = searchParams.get("taskId");

  // ── 선택/호버 상태 / Selection and hover state ────────────────────
  const [selectedBasis, setSelectedBasis] = useState<string | null>(null);
  const [hoveredBasis, setHoveredBasis] = useState<string | null>(null);
  const [lastPreviewBasis, setLastPreviewBasis] = useState<string>("prognostic");

  /**
   * 오른쪽 카드에 표시할 기준:
   * 호버 중 → 선택됨 → 마지막 미리보기 순으로 fallback
   * Basis to preview: hovered > selected > last previewed
   */
  const previewBasis = hoveredBasis ?? selectedBasis ?? lastPreviewBasis;

  /** 오른쪽 카드 클릭 → 현재 previewBasis를 선택으로 확정 / Right card click: confirm current preview as selection */
  const handleRightCardClick = () => {
    setSelectedBasis(previewBasis);
  };

  /** "Next" 버튼 → Subgroup Selection 페이지로 이동 / Navigate to subgroup-selection */
  const handleGoToSubgroupSelection = () => {
    const basis = selectedBasis ?? previewBasis;
    setSelectedBasis(basis);

    if (!taskId) {
      router.push("/tsi/patients-summary");
      return;
    }

    const query = new URLSearchParams({ taskId, basis });
    router.push(`/tsi/subgroup-selection?${query.toString()}`);
  };

  return (
    <AppLayout headerType="tsi">
      <div
        className="flex flex-col w-full h-full gap-6"
        style={{
          paddingBottom: 12,
        }}
      >
        {/* ── 1. 페이지 타이틀 / Page title ──────────────────────── */}
        <div className="shrink-0 px-1">
          <h1
            className="text-page-title"
            style={{ fontSize: titleFontSize }}
          >
            Subgroup Configuration
          </h1>
          <span className="text-page-subtitle">
            Select a subgroup basis
          </span>
        </div>

        {/* ── 2. 메인 카드 영역 (글래스 배경) / Main card area (glass background) ── */}
        <div
          className="figma-nine-slice figma-home-panel-middle flex flex-1 min-h-0"
        >
          <div className="flex w-full h-full gap-2">

            {/* ── 2-A. 왼쪽 카드: 기준 선택 목록 / Left card: basis option list ── */}
            <div
              className="flex flex-1 [@media(min-width:1471px)]:flex-1 flex-shrink-0 flex-col overflow-hidden bg-white self-start rounded-[20px]"
              style={{
                boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
              }}
            >
              {BASIS_OPTIONS.map((opt) => {
                const isSelected = selectedBasis === opt.id;
                const isDisabled = opt.disabled === true;
                return (
                  /* 개별 옵션 버튼 / Individual option button */
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() =>
                      !isDisabled &&
                      setSelectedBasis(opt.id === selectedBasis ? null : opt.id)
                    }
                    onMouseEnter={() => {
                      if (!isDisabled) {
                        setHoveredBasis(opt.id);
                        setLastPreviewBasis(opt.id);
                      }
                    }}
                    onMouseLeave={() => setHoveredBasis(null)}
                    className={`border-neutral-80 flex h-[54px] w-full items-center justify-between border-b px-4 text-left last:border-b-0 transition-colors duration-150 ${
                      isDisabled
                        ? "bg-neutral-95 text-neutral-60 cursor-not-allowed opacity-60"
                        : isSelected
                          ? "bg-primary-15 text-white"
                          : "text-neutral-30 bg-white hover:bg-primary-15 hover:text-white active:bg-primary-15 active:text-white"
                    }`}
                  >
                    <span className="font-semibold leading-[1.2] tracking-[-0.04em] text-[15px] [@media(min-width:1441px)]:text-[19.5px]">
                      {opt.label}
                    </span>
                    {/* 비활성화 옵션에는 아이콘 숨김 / Hide icon for disabled options */}
                    {!isDisabled && (
                      <ChevronRightIcon
                        className={
                          isSelected || hoveredBasis === opt.id
                            ? "flex-shrink-0 text-white"
                            : "text-neutral-60 flex-shrink-0"
                        }
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* ── 2-B. 오른쪽 카드: 설명 + 차트 미리보기 / Right card: description + chart preview ── */}
            {(() => {
              const content =
                BASIS_CONTENT[previewBasis] ?? BASIS_CONTENT.prognostic;
              return (
                <button
                  type="button"
                  onClick={
                    selectedBasis === previewBasis
                      ? handleGoToSubgroupSelection
                      : handleRightCardClick
                  }
                  className="bg-primary-15 flex flex-col flex-3 min-w-0 h-full cursor-pointer rounded-[20px] text-left transition-opacity hover:opacity-95 p-4"
                >
                  {/* 설명 텍스트 영역 / Description text area */}
                  <div className="flex flex-shrink-0 flex-col justify-start h-[120px]">
                    <h2 className="text-body1m mb-4 text-white">{content.title}</h2>
                    <p className="text-body5m leading-[17.85px] text-white w-3/4">
                      {content.description}
                    </p>
                  </div>

                  {/* 차트 미리보기 영역 / Chart preview area */}
                  <div className="flex flex-col flex-1 min-h-0 w-full" style={{ marginTop: 60 }}>
                    <div className="flex flex-col flex-1 min-h-0 w-full rounded-[8px] bg-white overflow-visible p-3">
                      <div
                        className="flex-1 min-h-0 w-full overflow-hidden rounded-[4px] border border-neutral-80"
                        style={{ height: "100%" }}
                      >
                        <BasisChart basis={previewBasis} />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })()}
          </div>
        </div>
        {/* ── 2 닫기 / End main card ── */}

      </div>
    </AppLayout>
  );
}

/**
 * Suspense 래퍼 / Suspense wrapper (required for useSearchParams)
 */
export default function TSIBasisSelectionPage() {
  return (
    <Suspense fallback={null}>
      <TSIBasisSelectionPageContent />
    </Suspense>
  );
}
