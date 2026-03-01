"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import Button from "@/components/ui/button";

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

const BASIS_CONTENT: Record<string, { title: string; description: string; chartSrc: string }> = {
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

function TSIBasisSelectionPageContent() {
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
      <div className="flex w-full flex-col items-center">
        {/* 타이틀: ATS처럼 카드 밖 (배경 카드와 형제) */}
        <div className="mb-2 flex w-full max-w-full justify-center">
          <div className="mx-auto w-[1772px] max-w-full flex-shrink-0">
            <div className="flex flex-shrink-0 flex-col items-start gap-1">
              <div className="text-title text-neutral-5 mb-2 text-left">
                Target Subgroup Identification
              </div>
              <p className="text-body2m mb-[34px] text-left text-neutral-50">
                Select a subgroup basis
              </p>
            </div>
          </div>
        </div>

        {/* 메인 카드 영역 (배경 이미지 카드) */}
        <div className="mx-auto min-h-[750px] w-[1772px] flex-shrink-0">
          <div
            className="relative min-h-[642px] w-full overflow-hidden rounded-[36px]"
            style={{
              backgroundImage: "url(/assets/tsi/default-setting-bg.png)",
              backgroundSize: "100% 100%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div className="relative flex h-full flex-col p-6">
              <div className="flex min-h-0 flex-1 gap-4">
                {/* 왼쪽 카드: Select a subgroup basis - 흰색 배경 */}
                <div
                  className="flex w-[462px] flex-shrink-0 flex-col overflow-hidden rounded-[16px] bg-white"
                  style={{
                    boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  {BASIS_OPTIONS.map((opt, index) => {
                    const isSelected = selectedBasis === opt.id;
                    const isDisabled = opt.disabled === true;
                    return (
                      <Button
                        unstyled
                        key={opt.id}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => !isDisabled && setSelectedBasis(opt.id)}
                        className={`border-neutral-80 flex h-[54px] w-full items-center justify-between border-b px-4 text-left last:border-b-0 ${
                          isDisabled
                            ? "bg-neutral-95 text-neutral-60 cursor-not-allowed opacity-60"
                            : isSelected
                              ? "bg-primary-15 text-white"
                              : "text-neutral-30 bg-white"
                        }`}
                      >
                        <span className="text-body2m">{opt.label}</span>
                        {!isDisabled && (
                          <ChevronRightIcon
                            className={
                              isSelected
                                ? "flex-shrink-0 text-white"
                                : "text-neutral-60 flex-shrink-0"
                            }
                          />
                        )}
                      </Button>
                    );
                  })}
                </div>

                {/* 오른쪽 카드: 문구+차트 영역 클릭 시 Subgroup Selection으로 이동 */}
                <Button
                  unstyled
                  type="button"
                  onClick={handleGoToSubgroupSelection}
                  className="bg-primary-15 flex min-w-0 flex-1 cursor-pointer overflow-hidden rounded-[24px] text-left transition-opacity hover:opacity-95"
                >
                  {(() => {
                    const content = BASIS_CONTENT[selectedBasis] ?? BASIS_CONTENT.prognostic;
                    return (
                      <>
                        <div className="flex w-[398px] flex-shrink-0 flex-col justify-start p-6">
                          <h2 className="text-h3 mb-4 text-white">{content.title}</h2>
                          <p className="text-body3m leading-[17.85px] text-white">
                            {content.description}
                          </p>
                        </div>
                        <div className="flex min-w-0 flex-1 items-center justify-center p-4">
                          <div className="relative h-[586px] w-full max-w-[816px] overflow-hidden rounded-[12px] bg-white">
                            <Image src={content.chartSrc} alt="" fill className="object-contain" />
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </Button>
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
    <Suspense fallback={null}>
      <TSIBasisSelectionPageContent />
    </Suspense>
  );
}
