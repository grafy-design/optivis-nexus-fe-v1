"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import PrognosticChart from "./charts/PrognosticChart";
import DrugResponsivenessChart from "./charts/DrugResponsivenessChart";
import SafetyChart from "./charts/SafetyChart";

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

const DEFAULT_BASIS_ID =
  BASIS_OPTIONS.find((option) => option.disabled !== true)?.id ?? "prognostic";

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

function BasisChart({ basis }: { basis: string }) {
  if (basis === "drug-responsiveness") return <DrugResponsivenessChart />;
  if (basis === "safety") return <SafetyChart />;
  return <PrognosticChart />;
}

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
  const [titleFontSize, setTitleFontSize] = useState(42);
  useEffect(() => {
    const update = () => setTitleFontSize(window.innerWidth > 1470 ? 42 : 36);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const taskId = searchParams.get("taskId");
  const [selectedBasis, setSelectedBasis] = useState<string>(DEFAULT_BASIS_ID);
  const [hoveredBasis, setHoveredBasis] = useState<string | null>(null);
  const previewBasis = hoveredBasis ?? selectedBasis;

  const handleGoToSubgroupSelection = () => {
    if (!taskId) {
      router.push("/tsi/patients-summary");
      return;
    }

    const query = new URLSearchParams({ taskId });
    router.push(`/tsi/subgroup-selection?${query.toString()}`);
  };

  return (
    <AppLayout headerType="tsi" scaleMode="fit">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "calc(100% - 28px)",
          height: "100%",
          gap: 24,
          marginLeft: "14px",
          marginRight: "14px",
          paddingBottom: 12,
        }}
      >
        <div style={{ flexShrink: 0, padding: "0 12px" }}>
          <h1
            style={{
              fontFamily: "Poppins, Inter, sans-serif",
              fontSize: titleFontSize,
              fontWeight: 600,
              color: "rgb(17,17,17)",
              letterSpacing: "-1.5px",
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            Subgroup Configuration
          </h1>
          <span
            style={{
              fontFamily: "Inter",
              fontSize: 16,
              fontWeight: 600,
              color: "rgb(120,119,118)",
              letterSpacing: "-0.48px",
            }}
          >
            Select a subgroup basis
          </span>
        </div>

        <div
          className="flex min-h-0 flex-1 overflow-visible rounded-[36px]"
          style={{
            borderImage:
              'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch',
            borderStyle: "solid",
            borderTopWidth: "20px",
            borderBottomWidth: "28px",
            borderLeftWidth: "24px",
            borderRightWidth: "24px",
            borderColor: "transparent",
          }}
        >
          <div className="flex h-full w-full gap-4">
            <div
              className="flex w-[347px] flex-shrink-0 flex-col self-start overflow-hidden bg-white [@media(min-width:1441px)]:w-[520px]"
              style={{
                boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
                borderRadius: 24,
              }}
            >
              {BASIS_OPTIONS.map((opt) => {
                const isSelected = selectedBasis === opt.id;
                const isDisabled = opt.disabled === true;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => !isDisabled && setSelectedBasis(opt.id)}
                    onMouseEnter={() => !isDisabled && setHoveredBasis(opt.id)}
                    onMouseLeave={() => setHoveredBasis(null)}
                    className={`border-neutral-80 flex h-[54px] w-full cursor-pointer items-center justify-between border-b px-4 text-left transition-colors duration-150 last:border-b-0 ${
                      isDisabled
                        ? "bg-neutral-95 text-neutral-60 cursor-not-allowed opacity-60"
                        : isSelected
                          ? "bg-primary-15 text-white"
                          : "text-neutral-30 hover:bg-primary-15 active:bg-primary-15 bg-white hover:text-white active:text-white"
                    }`}
                  >
                    <span className="text-[15px] leading-[1.2] font-semibold tracking-[-0.04em] [@media(min-width:1441px)]:text-[19.5px]">
                      {opt.label}
                    </span>
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

            {(() => {
              const content = BASIS_CONTENT[previewBasis] ?? BASIS_CONTENT.prognostic;
              return (
                <button
                  type="button"
                  onClick={handleGoToSubgroupSelection}
                  className="bg-primary-15 flex h-full min-w-0 flex-1 cursor-pointer flex-col rounded-[24px] p-4 text-left transition-opacity hover:opacity-95"
                >
                  <div className="flex h-[120px] flex-shrink-0 flex-col justify-start">
                    <h2 className="text-body1m mb-4 text-white">{content.title}</h2>
                    <p className="text-body5m w-3/4 leading-[17.85px] text-white">
                      {content.description}
                    </p>
                  </div>
                  <div className="flex min-h-0 w-full flex-1 flex-col" style={{ marginTop: 60 }}>
                    <div className="flex min-h-0 w-full flex-1 flex-col overflow-visible rounded-[12px] bg-white p-3">
                      <div
                        className="border-neutral-80 min-h-0 w-full flex-1 overflow-hidden rounded-[8px] border"
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
