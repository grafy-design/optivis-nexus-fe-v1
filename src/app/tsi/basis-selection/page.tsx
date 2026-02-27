"use client";

import { useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";

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

const BASIS_CONTENT: Record<
  string,
  { title: string; description: string; chartSrc: string }
> = {
  prognostic: {
    title: "Stratify patients based on predicted disease progression metrics",
    description:
      "Patients are divided into rapid progressors and slow or stable progressors using predicted progression scores and progression slopes, reducing heterogeneity and improving trial design and analysis efficiency.",
    chartSrc: "/assets/tsi/chart-prognostic.png",
  },
  "drug-responsiveness": {
    title: "Stratify patients based on treatment effect responsiveness",
    description:
      "Patients are divided into high responders and low or non-responders using the rHTE score, reducing overlap between treatment and control outcome distributions and making the treatment effect more detectable.",
    chartSrc: "/assets/tsi/chart-drug-responsiveness.png",
  },
  safety: {
    title: "Stratify patients based on safety and dropout risk",
    description:
      "Patients are divided into high-risk and low-risk groups using safety risk and dropout risk scores, reducing attrition risk and operational bias and improving overall trial robustness.",
    chartSrc: "/assets/tsi/chart-safety.png",
  },
  "multiple-conditions": {
    title: "Multiple Conditions",
    description: "설명 추후 전달 예정.",
    chartSrc: "/assets/tsi/chart-prognostic.png",
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

function TSIBasisSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId");
  const [selectedBasis, setSelectedBasis] = useState<string>("prognostic");

  const handleGoToSubgroupSelection = () => {
    if (!taskId) {
      router.push("/tsi/patients-summary");
      return;
    }

    const query = new URLSearchParams({ taskId });
    router.push(`/tsi/subgroup-selection?${query.toString()}`);
  };

  return (
    <AppLayout headerType="tsi">
      <div className="w-full flex flex-col items-center">
        {/* 타이틀: ATS처럼 카드 밖 (배경 카드와 형제) */}
        <div className="w-full flex justify-center mb-2 max-w-full">
          <div className="w-[1772px] max-w-full flex-shrink-0 mx-auto">
            <div className="flex flex-col gap-1 flex-shrink-0 items-start">
              <div className="text-title text-neutral-5 text-left mb-2">
                Target Subgroup Identification
              </div>
              <p className="text-body2m text-neutral-50 text-left">
                Select a subgroup basis
              </p>
            </div>
          </div>
        </div>

        {/* 메인 카드 영역 (배경 이미지 카드) */}
        <div className="w-[1772px] min-h-[750px] flex-shrink-0 mx-auto">
          <div
            className="relative rounded-[36px] overflow-hidden w-full min-h-[642px]"
            style={{
              backgroundImage: "url(/assets/tsi/default-setting-bg.png)",
              backgroundSize: "100% 100%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div className="relative p-6 flex flex-col h-full">
              <div className="flex gap-4 flex-1 min-h-0">
                {/* 왼쪽 카드: Select a subgroup basis - 흰색 배경 */}
                <div
                  className="w-[462px] flex-shrink-0 rounded-[16px] overflow-hidden bg-white flex flex-col"
                  style={{
                    boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  {BASIS_OPTIONS.map((opt, index) => {
                    const isSelected = selectedBasis === opt.id;
                    const isDisabled = opt.disabled === true;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => !isDisabled && setSelectedBasis(opt.id)}
                        className={`w-full h-[54px] flex items-center justify-between px-4 text-left border-b border-neutral-80 last:border-b-0 ${
                          isDisabled
                            ? "bg-neutral-95 text-neutral-60 cursor-not-allowed opacity-60"
                            : isSelected
                              ? "bg-primary-15 text-white"
                              : "bg-white text-neutral-30"
                        }`}
                      >
                        <span className="text-body2m">{opt.label}</span>
                        {!isDisabled && (
                          <ChevronRightIcon
                            className={
                              isSelected
                                ? "text-white flex-shrink-0"
                                : "text-neutral-60 flex-shrink-0"
                            }
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* 오른쪽 카드: 문구+차트 영역 클릭 시 Subgroup Selection으로 이동 */}
                <button
                  type="button"
                  onClick={handleGoToSubgroupSelection}
                  className="flex-1 min-w-0 flex rounded-[24px] overflow-hidden bg-primary-15 cursor-pointer hover:opacity-95 transition-opacity text-left"
                >
                  {(() => {
                    const content =
                      BASIS_CONTENT[selectedBasis] ?? BASIS_CONTENT.prognostic;
                    return (
                      <>
                        <div className="w-[398px] flex-shrink-0 p-6 flex flex-col justify-start">
                          <h2 className="text-h3 text-white mb-4">
                            {content.title}
                          </h2>
                          <p className="text-body3m text-white leading-[17.85px]">
                            {content.description}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0 p-4 flex items-center justify-center">
                          <div className="w-full max-w-[816px] h-[586px] bg-white rounded-[12px] overflow-hidden relative">
                            <Image
                              src={content.chartSrc}
                              alt=""
                              fill
                              className="object-contain"
                            />
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function TSIBasisSelectionPage() {
  return (
    <Suspense>
      <TSIBasisSelectionContent />
    </Suspense>
  );
}
