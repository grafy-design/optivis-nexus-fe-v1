"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import PrognosticChart from "./charts/PrognosticChart";
import DrugResponsivenessChart from "./charts/DrugResponsivenessChart";
import SafetyChart from "./charts/SafetyChart";

/**
 * TSI Step 3: Basis Selection
 * 타이틀은 카드 밖, 카드 안에: 왼쪽 = Select a subgroup basis, 오른쪽 = 설명 + 차트 (선택에 따라 변경)
 */
const BASIS_OPTIONS: Array<{
  id: string;
  label: string;
  disabled?: boolean;
}> = [
  { id: "prognostic", label: "Prognostic" },
  { id: "drug-responsiveness", label: "Drug Responsiveness" },
  { id: "safety", label: "Safety" },
  { id: "multiple-conditions", label: "Multiple Conditions", disabled: true },
];

const BASIS_CONTENT: Record<string, { title: string; description: string; chart: React.ReactNode }> = {
  prognostic: {
    title: "Stratify patients based on predicted disease progression metrics",
    description:
      "Patients are divided into rapid progressors and slow or stable progressors using predicted progression scores and progression slopes, reducing heterogeneity and improving trial design and analysis efficiency.",
    chart: <PrognosticChart />,
  },
  "drug-responsiveness": {
    title: "Stratify patients based on treatment effect responsiveness",
    description:
      "Patients are divided into high responders and low or non-responders using the rHTE score, reducing overlap between treatment and control outcome distributions and making the treatment effect more detectable.",
    chart: <DrugResponsivenessChart />,
  },
  safety: {
    title: "Stratify patients based on safety and dropout risk",
    description:
      "Patients are divided into high-risk and low-risk groups using safety risk and dropout risk scores, reducing attrition risk and operational bias and improving overall trial robustness.",
    chart: <SafetyChart />,
  },
  "multiple-conditions": {
    title: "Multiple Conditions",
    description: "설명 추후 전달 예정.",
    chart: <PrognosticChart />,
  },
};

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

function TSIBasisSelectionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId");
  const [selectedBasis, setSelectedBasis] = useState<string | null>(null);
  const [hoveredBasis, setHoveredBasis] = useState<string | null>(null);
  const previewBasis = hoveredBasis ?? selectedBasis ?? "prognostic";

  const handleGoToSubgroupSelection = () => {
    if (!taskId) {
      router.push("/tsi/patients-summary");
      return;
    }

    const query = new URLSearchParams({ taskId });
    router.push(`/tsi/subgroup-selection?${query.toString()}`);
  };

  return (
    <AppLayout headerType="tsi" scaleMode="none">
      <div style={{ display: "flex", flexDirection: "column", width: "calc(100% - 24px)", height: "100%", gap: 24, marginLeft: "8px", marginRight: "8px" }}>
        {/* Title */}
        <div style={{ flexShrink: 0, padding: "0 12px" }}>
          <h1 style={{ fontFamily: "Poppins, Inter, sans-serif", fontSize: 42, fontWeight: 600, color: "rgb(17,17,17)", letterSpacing: "-1.5px", lineHeight: 1.1, margin: 0 }}>
            Target Subgroup Identification
          </h1>
          <span style={{ fontFamily: "Inter", fontSize: 16, fontWeight: 600, color: "rgb(120,119,118)", letterSpacing: "-0.48px" }}>
            Select a subgroup basis
          </span>
        </div>

        {/* 메인 카드 영역 (배경 이미지 카드) */}
        <div className="rounded-[36px] overflow-hidden flex flex-1 min-h-0" style={{borderImage: 'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch', borderStyle: "solid", borderTopWidth: "20px", borderBottomWidth: "28px", borderLeftWidth: "24px", borderRightWidth: "24px", borderColor: "transparent"}}>
              <div className="flex w-full h-full gap-4">
                {/* 왼쪽 카드: Select a subgroup basis - 흰색 배경 */}
                <div
                  className="flex w-[520px] flex-shrink-0 flex-col overflow-hidden rounded-[16px] bg-white self-start"
                  style={{ boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)" }}
                >
                  {BASIS_OPTIONS.map((opt) => {
                    const isSelected = selectedBasis === opt.id;
                    const isDisabled = opt.disabled === true;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => !isDisabled && setSelectedBasis(opt.id === selectedBasis ? null : opt.id)}
                        onMouseEnter={() => !isDisabled && setHoveredBasis(opt.id)}
                        onMouseLeave={() => setHoveredBasis(null)}
                        className={`border-neutral-80 flex h-[54px] w-full items-center justify-between border-b px-4 text-left last:border-b-0 ${
                          isDisabled
                            ? "bg-neutral-95 text-neutral-60 cursor-not-allowed opacity-60"
                            : isSelected
                              ? "bg-primary-15 text-white hover:bg-[#2e2a66]"
                              : "text-neutral-30 bg-white hover:bg-[#efeff4]"
                        }`}
                      >
                        <span className="text-body2">{opt.label}</span>
                        {!isDisabled && (
                          <ChevronRightIcon
                            className={isSelected ? "flex-shrink-0 text-white" : "text-neutral-60 flex-shrink-0"}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* 오른쪽 카드: 문구+차트 영역 클릭 시 Subgroup Selection으로 이동 */}
                {(() => {
                  const content = BASIS_CONTENT[previewBasis] ?? BASIS_CONTENT.prognostic;
                  return (
                    <button
                      type="button"
                      onClick={handleGoToSubgroupSelection}
                      className="bg-primary-15 flex flex-col flex-1 min-w-0 h-full cursor-pointer overflow-hidden rounded-[24px] text-left transition-opacity hover:opacity-95"
                    >
                      <div className="flex flex-shrink-0 flex-col justify-start p-6" style={{ paddingBottom: 0 }}>
                        <h2 className="text-h4 mb-4 text-white">{content.title}</h2>
                        <p className="text-body4m leading-[17.85px] text-white w-3/4">
                          {content.description}
                        </p>
                      </div>
                      <div className="flex flex-1 min-h-0 w-full p-6" style={{ marginTop: 60 }}>
                        <div className="relative w-full h-full overflow-auto rounded-[12px] bg-white p-6" style={{ display: "flex" }}>
                          <div style={{ flex: 1, minWidth: 360, minHeight: 260 }}>
                            {content.chart}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })()}
              </div>
          </div>
        </div>
    </AppLayout>
  );
}

export default function TSIBasisSelectionPage() {
  return (
    <Suspense fallback={null}>
      <TSIBasisSelectionPageContent />
    </Suspense>
  );
}
