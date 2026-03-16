"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import TrpCtaButton from "@/components/trp/trp-cta-button";
import TrpFramePanel from "@/components/trp/trp-frame-panel";
import TrpPageTitle from "@/components/trp/trp-page-title";
import TrpSaveProgressModal from "@/components/trp/trp-save-progress-modal";
import {
  resolveTrpSetupFlowState,
  type TrpSetupStepState,
} from "@/components/trp/setup-steps";
import TrpSetupSidebarPanel from "@/components/trp/trp-setup-sidebar-panel";
import { cn } from "@/lib/cn";
import {
  buildTrpSimulationStrategySummaries,
  formatTrpSimulationFollowUpWindow,
  formatTrpSimulationSelectedValue,
  type TrpSimulationStrategyTone,
} from "@/lib/trp-simulation-setting";
import { runTrpMockAnalysis } from "@/services/trp-analysis-mock-service";
import {
  formatTreatmentRegimen,
  getTreatmentCombinationStatus,
  useTrpSetupStore,
} from "@/store/trp-setup-store";

type SummaryRow = {
  label: string;
  value: string;
};

type StrategySummary = {
  title: string;
  tone: TrpSimulationStrategyTone;
  items: string[];
};

const diseaseLabelMap: Record<string, string> = {
  diabetes: "Diabetes",
  prediabetes: "Prediabetes",
};

const sexLabelMap: Record<string, string> = {
  male: "Male",
  female: "Female",
};

const trendLabelMap: Record<string, string> = {
  stable: "Stable",
  increase: "Increase",
  decrease: "Decrease",
};

const sbpLabelMap: Record<string, string> = {
  "normal-lt-120": "Normal < 120 mmHg",
  elevated: "Elevated",
  high: "High",
};

const proxyLabelMap: Record<string, string> = {
  albuminuria: "Albuminuria",
  dipstick: "Dipstick",
  pcr: "PCR",
};

const albuminuriaLabelMap: Record<string, string> = {
  a1: "A1 < 30 mg/day",
  a2: "A2 30~300 mg/day",
  a3: "A3 > 300 mg/day",
};

function joinOrFallback(values: readonly string[], fallback = "-") {
  return values.length > 0 ? values.join(", ") : fallback;
}

function withFallback(value: string | null | undefined, fallback = "-") {
  return value && value.trim().length > 0 ? value : fallback;
}

function SaveArrowIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <path
        d="M2 1.75L8.25 5.5L2 9.25"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatusBadge({
  state,
  step,
}: {
  state: TrpSetupStepState;
  step: string;
}) {
  if (state === "complete") {
    return (
      <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#F06600] shadow-[0_4px_10px_rgba(240,102,0,0.18)]">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M3.5 8.25L6.55 11.3L12.5 4.95"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }

  if (state === "warning") {
    return (
      <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#D83C2D] shadow-[0_4px_10px_rgba(216,60,45,0.18)]">
        <span className="font-[Inter,sans-serif] text-[13px] font-bold text-white">!</span>
      </div>
    );
  }

  return (
    <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#C6C2CC]">
      <span className="font-[Inter,sans-serif] text-[11px] font-bold text-[#6E6878]">{step}</span>
    </div>
  );
}

function StepActionButton({
  disabled,
  onClick,
}: {
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-[42px] w-full items-center justify-center rounded-full px-4 font-[Inter,sans-serif] text-[13px] font-semibold tracking-[-0.02em] transition-colors",
        disabled
          ? "cursor-not-allowed bg-[#E6E3EA] text-[#AAA5B2]"
          : "bg-[#262255] text-white hover:bg-[#1F1A4B]"
      )}
    >
      Setting +
    </button>
  );
}

function DataSection({ title, rows }: { title: string; rows: SummaryRow[] }) {
  return (
    <div className="rounded-[18px] border border-[rgba(230,229,234,0.95)] bg-[rgba(255,255,255,0.94)] px-8 py-6">
      <div className="mb-3 font-[Inter,sans-serif] text-[13px] font-bold tracking-[-0.03em] text-[#5B5858]">
        {title}
      </div>

      <div className="flex flex-col">
        {rows.map((row, index) => (
          <div
            key={`${title}-${row.label}`}
            className={cn(
              "grid [grid-template-columns:minmax(0,0.9fr)_minmax(0,1fr)] items-start gap-4 py-[7px]",
              index > 0 && "border-t border-[#D8D7DD]"
            )}
          >
            <span className="font-[Inter,sans-serif] text-[11px] leading-[1.45] font-semibold tracking-[-0.02em] text-[#8A8888]">
              {row.label}
            </span>
            <span className="font-[Inter,sans-serif] text-[11px] leading-[1.45] font-semibold tracking-[-0.02em] whitespace-pre-line text-[#5A5757]">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StrategyCard({ strategy }: { strategy: StrategySummary }) {
  const toneClass =
    strategy.tone === "violet"
      ? "text-[#4A35FF]"
      : strategy.tone === "orange"
        ? "text-[#F06600]"
        : "text-[#1A96A3]";
  const dividerClass =
    strategy.tone === "violet"
      ? "bg-[#4A35FF]"
      : strategy.tone === "orange"
        ? "bg-[#F06600]"
        : "bg-[#1A96A3]";

  return (
    <div className="rounded-[18px] border border-[rgba(230,229,234,0.95)] bg-[rgba(255,255,255,0.94)] px-6 py-5">
      <div className={cn("font-[Inter,sans-serif] text-[13px] font-bold tracking-[-0.03em]", toneClass)}>
        {strategy.title}
      </div>
      <div className={cn("my-[10px] mt-[6px] h-[2px] rounded-full", dividerClass)} />
      <ol className="m-0 pl-4 font-[Inter,sans-serif] text-[11px] leading-[1.5] font-semibold text-[#5A5757]">
        {strategy.items.map((item, index) => (
          <li key={`${strategy.title}-${index}`}>{item}</li>
        ))}
      </ol>
    </div>
  );
}

function StepCard({
  step,
  title,
  state,
  helperText,
  onSetting,
  settingDisabled,
  children,
}: {
  step: string;
  title: string;
  state: TrpSetupStepState;
  helperText?: string;
  onSetting: () => void;
  settingDisabled?: boolean;
  children: ReactNode;
}) {
  const isWarning = state === "warning";
  const isDefault = state === "default";
  const showAction = state !== "complete";

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col gap-6 rounded-[24px] border p-4 shadow-[0_16px_30px_rgba(38,34,85,0.05)] backdrop-blur-[12px]",
        isWarning
          ? "border-[#FFD4CF] bg-[rgba(255,247,246,0.82)]"
          : isDefault
            ? "border-white/70 bg-[rgba(245,244,247,0.82)]"
            : "border-white/70 bg-[rgba(255,255,255,0.66)]"
      )}
    >
      <div className="px-1">
        <div>
          <div className="mb-[2px] font-[Inter,sans-serif] text-[11px] font-semibold text-[#B0AFAF]">
            {step}
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge state={state} step={step.replace("Step ", "")} />
            <span
              className={cn(
                "font-[Inter,sans-serif] text-[17px] font-bold tracking-[-0.04em]",
                isWarning ? "text-[#B33A2B]" : "text-[#4B4848]"
              )}
            >
              {title}
            </span>
          </div>
          {helperText ? (
            <p
              className={cn(
                "mt-2 font-[Inter,sans-serif] text-[12px] leading-[1.4] font-medium",
                isWarning ? "text-[#C65548]" : isDefault ? "text-[#8C8794]" : "text-[#7B7685]"
              )}
            >
              {helperText}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex min-h-0 flex-col gap-4">{children}</div>

      {showAction ? <StepActionButton disabled={settingDisabled} onClick={onSetting} /> : null}
    </div>
  );
}

export default function TrpViewSummaryPage() {
  const router = useRouter();
  const hasHydrated = useTrpSetupStore((state) => state.hasHydrated);
  const completedSteps = useTrpSetupStore((state) => state.completedSteps);
  const selectedPatient = useTrpSetupStore((state) => state.selectedPatient);
  const patientDiseaseInfo = useTrpSetupStore((state) => state.patientDiseaseInfo);
  const treatmentSaved = useTrpSetupStore((state) => state.treatmentSaved);
  const simulationSaved = useTrpSetupStore((state) => state.simulationSaved);
  const analysisStatus = useTrpSetupStore((state) => state.analysisStatus);
  const analysisError = useTrpSetupStore((state) => state.analysisError);
  const prepareAnalysisRequest = useTrpSetupStore((state) => state.prepareAnalysisRequest);
  const setAnalysisPending = useTrpSetupStore((state) => state.setAnalysisPending);
  const setAnalysisResult = useTrpSetupStore((state) => state.setAnalysisResult);
  const setAnalysisFailure = useTrpSetupStore((state) => state.setAnalysisFailure);
  const saveCurrentSimulation = useTrpSetupStore((state) => state.saveCurrentSimulation);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [lastSavedName, setLastSavedName] = useState<string | null>(null);
  const sidebarState = useMemo(
    () =>
      resolveTrpSetupFlowState({
        activeStep: "view-summary",
        includeSummary: true,
        completedSteps,
        patientDiseaseInfo,
        treatmentInfo: treatmentSaved,
        simulationSettingComplete: completedSteps["simulation-setting"],
      }),
    [completedSteps, patientDiseaseInfo, treatmentSaved]
  );
  const {
    patientStepComplete,
    treatmentStepComplete,
    simulationStepComplete,
    stepMap,
    missingStepTitles,
  } = sidebarState;
  const hasMeaningfulTreatmentInfo =
    treatmentSaved.hypoglycemicAgentDrugs.length > 0 ||
    treatmentSaved.insulinBasedDrugs.length > 0 ||
    treatmentSaved.treatmentLineSelect.length > 0 ||
    treatmentSaved.treatmentLineFlags.length > 0 ||
    treatmentSaved.dmDuration.length > 0 ||
    treatmentSaved.cvdHistory.length > 0;

  const canApplyToAnalysis =
    patientStepComplete && treatmentStepComplete && simulationStepComplete;
  const patientSidebarStep = stepMap["patient-disease-info"];
  const treatmentSidebarStep = stepMap["treatment-info"];
  const simulationSidebarStep = stepMap["simulation-setting"];

  const patientProfileRows = useMemo<SummaryRow[]>(
    () => [
      {
        label: "Disease",
        value: withFallback(
          patientDiseaseInfo ? diseaseLabelMap[patientDiseaseInfo.disease] ?? patientDiseaseInfo.disease : ""
        ),
      },
      { label: "Age", value: patientDiseaseInfo?.age ? `${patientDiseaseInfo.age}` : "-" },
      {
        label: "Sex",
        value: withFallback(
          patientDiseaseInfo ? sexLabelMap[patientDiseaseInfo.sex] ?? patientDiseaseInfo.sex : ""
        ),
      },
      {
        label: "Height",
        value: patientDiseaseInfo?.height ? `${patientDiseaseInfo.height} cm` : "-",
      },
      {
        label: "Weight",
        value: patientDiseaseInfo?.weight ? `${patientDiseaseInfo.weight} kg` : "-",
      },
      {
        label: "BMI",
        value: patientDiseaseInfo?.bmi
          ? `${patientDiseaseInfo.bmi} kg/m² (trend: ${withFallback(
              trendLabelMap[patientDiseaseInfo.weightTrend] ?? patientDiseaseInfo.weightTrend
            )})`
          : "-",
      },
      {
        label: "Blood pressure",
        value: patientDiseaseInfo?.sbp
          ? `${sbpLabelMap[patientDiseaseInfo.sbp] ?? patientDiseaseInfo.sbp} (trend: ${withFallback(
              trendLabelMap[patientDiseaseInfo.sbpTrend] ?? patientDiseaseInfo.sbpTrend
            )})`
          : "-",
      },
      {
        label: "Related disease",
        value: selectedPatient?.relatedDisease ?? "-",
      },
      {
        label: "Medical history",
        value: joinOrFallback(patientDiseaseInfo?.medicalHistories ?? []),
      },
    ],
    [patientDiseaseInfo, selectedPatient]
  );

  const baselineRows = useMemo<SummaryRow[]>(() => {
    const renalMarkerValue = patientDiseaseInfo
      ? patientDiseaseInfo.dontKnowUacr
        ? patientDiseaseInfo.proxyMode === "albuminuria"
          ? `${proxyLabelMap.albuminuria}: ${withFallback(
              albuminuriaLabelMap[patientDiseaseInfo.albuminuriaLevel] ??
                patientDiseaseInfo.albuminuriaLevel
            )}`
          : patientDiseaseInfo.proxyMode === "dipstick"
            ? `${proxyLabelMap.dipstick}: ${withFallback(patientDiseaseInfo.dipstickLevel)}`
            : patientDiseaseInfo.proxyMode === "pcr"
              ? `${proxyLabelMap.pcr}: ${withFallback(patientDiseaseInfo.pcrValue)} mg/g`
              : "-"
        : patientDiseaseInfo.uacr
          ? `${patientDiseaseInfo.uacr} mg/g`
          : "-"
      : "-";

    return [
      {
        label: "HbA1c",
        value: patientDiseaseInfo?.hba1cValue
          ? `${patientDiseaseInfo.hba1cValue}% (${withFallback(
              trendLabelMap[patientDiseaseInfo.baselineTrend] ?? patientDiseaseInfo.baselineTrend
            )})`
          : "-",
      },
      {
        label: "Fasting glucose",
        value: patientDiseaseInfo?.fastingGlucose
          ? `${patientDiseaseInfo.fastingGlucose} mg/dL`
          : "-",
      },
      {
        label: "Random glucose",
        value: patientDiseaseInfo?.randomGlucose
          ? `${patientDiseaseInfo.randomGlucose} mg/dL`
          : "-",
      },
      {
        label: "eGFR",
        value: patientDiseaseInfo?.egfr ? `${patientDiseaseInfo.egfr} mL/min/1.73m²` : "-",
      },
      {
        label: patientDiseaseInfo?.dontKnowUacr ? "Renal proxy" : "UACR",
        value: renalMarkerValue,
      },
    ];
  }, [patientDiseaseInfo]);

  const treatmentOverviewRows = useMemo<SummaryRow[]>(
    () =>
      hasMeaningfulTreatmentInfo
        ? [
            {
              label: "Current treatment regimen",
              value: formatTreatmentRegimen(treatmentSaved),
            },
            {
              label: "Combination status",
              value: getTreatmentCombinationStatus(treatmentSaved) || "-",
            },
            {
              label: "Treatment Line",
              value: treatmentSaved.treatmentLineSelect
                ? `${treatmentSaved.treatmentLineSelect} / ${joinOrFallback(
                    treatmentSaved.treatmentLineFlags
                  )}`
                : joinOrFallback(treatmentSaved.treatmentLineFlags),
            },
            {
              label: "Prior switch history",
              value: treatmentSaved.priorSwitchHistory || "-",
            },
            {
              label: "Low Blood sugar severity",
              value: treatmentSaved.lowBloodSugarSeverity || "-",
            },
          ]
        : [
            { label: "Current treatment regimen", value: "-" },
            { label: "Combination status", value: "-" },
            { label: "Treatment Line", value: "-" },
            { label: "Prior switch history", value: "-" },
            { label: "Low Blood sugar severity", value: "-" },
          ],
    [hasMeaningfulTreatmentInfo, treatmentSaved]
  );

  const severityStatusRows = useMemo<SummaryRow[]>(
    () =>
      hasMeaningfulTreatmentInfo
        ? [
            {
              label: "DM duration",
              value: treatmentSaved.dmDuration || "-",
            },
            {
              label: "CVD History",
              value: joinOrFallback(treatmentSaved.cvdHistory, "none"),
            },
            {
              label: "Persistence(proxy)",
              value: treatmentSaved.persistenceProxy || "-",
            },
          ]
        : [
            { label: "DM duration", value: "-" },
            { label: "CVD History", value: "-" },
            { label: "Persistence(proxy)", value: "-" },
          ],
    [hasMeaningfulTreatmentInfo, treatmentSaved]
  );

  const simulationRows = useMemo<SummaryRow[]>(() => {
    if (!simulationStepComplete) {
      return [
        { label: "Selected Value", value: "-" },
        { label: "Follow-up Window", value: "-" },
      ];
    }

    return [
      { label: "Selected Value", value: formatTrpSimulationSelectedValue(simulationSaved) },
      { label: "Follow-up Window", value: formatTrpSimulationFollowUpWindow(simulationSaved) },
    ];
  }, [simulationSaved, simulationStepComplete]);

  const strategySummaries = useMemo<StrategySummary[]>(
    () => (simulationStepComplete ? buildTrpSimulationStrategySummaries(simulationSaved) : []),
    [simulationSaved, simulationStepComplete]
  );

  const handleSaveProgress = (name: string, description: string) => {
    const savedRecord = saveCurrentSimulation({
      simulationName: name,
      description,
    });

    setLastSavedName(savedRecord.simulationName);
    setIsSaveModalOpen(false);
    console.log("[TRP-005] save progress clicked", savedRecord);
  };

  const handleApplyToAnalysis = async () => {
    if (!canApplyToAnalysis) {
      console.log("[TRP-005] apply blocked - missing required steps", missingStepTitles);
      return;
    }

    const analysisRequest = prepareAnalysisRequest();

    if (!analysisRequest) {
      console.log("[TRP-005] apply blocked - failed to build analysis request");
      return;
    }

    setAnalysisPending(analysisRequest);

    try {
      const analysisResponse = await runTrpMockAnalysis(analysisRequest);
      setAnalysisResult({
        request: analysisRequest,
        response: analysisResponse,
      });
      console.log("[TRP-005] apply to analysis completed", analysisRequest);
      router.push("/trp/simulation-result");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Mock analysis failed unexpectedly.";

      setAnalysisFailure({
        request: analysisRequest,
        error: message,
      });
      console.log("[TRP-005] apply to analysis failed", message);
    }
  };

  if (!hasHydrated) {
    return null;
  }

  if (!patientSidebarStep || !treatmentSidebarStep || !simulationSidebarStep) {
    return null;
  }

  return (
    <AppLayout headerType="trp">
      <div className="flex h-full w-[calc(100%-28px)] flex-col gap-[10px] overflow-hidden px-[10px] pt-4 pr-[6px] pb-[10px]">
        <TrpPageTitle title="Default Settings" subtitle="Setup Required" />

        <div className="grid min-h-0 flex-1 grid-cols-[356px_minmax(0,1fr)] gap-[4px] overflow-hidden">
          <TrpSetupSidebarPanel steps={sidebarState.steps} panelVariant="left" />

          <TrpFramePanel variant="right" className="flex min-h-0 flex-col gap-3">
            <div className="px-2 pt-1">
              <h2 className="m-0 font-[Inter,sans-serif] text-[24px] font-bold tracking-[-0.04em] text-[#4B4848]">
                Summary
              </h2>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <div className="grid min-h-0 grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)_minmax(0,1fr)] items-start gap-3">
                <StepCard
                  step="Step 1"
                  title="Patient/Disease Info"
                  state={patientSidebarStep.state}
                  helperText={
                    patientStepComplete
                      ? undefined
                      : "Complete the required patient and baseline fields."
                  }
                  onSetting={() => router.push(patientSidebarStep.href)}
                >
                  <DataSection title="Patient profile" rows={patientProfileRows} />
                  <DataSection title="Baseline" rows={baselineRows} />
                </StepCard>

                <StepCard
                  step="Step 2"
                  title="Treatment Info"
                  state={treatmentSidebarStep.state}
                  helperText={
                    treatmentStepComplete
                      ? undefined
                      : patientStepComplete
                        ? "Complete treatment drug, line, and duration inputs."
                        : "Complete Step 1 first to unlock this step."
                  }
                  onSetting={() => router.push(treatmentSidebarStep.href)}
                  settingDisabled={treatmentSidebarStep.disabled}
                >
                  <DataSection title="Treatment Overview" rows={treatmentOverviewRows} />
                  <DataSection title="Severity Status" rows={severityStatusRows} />
                </StepCard>

                <StepCard
                  step="Step 3"
                  title="Simulation Setting"
                  state={simulationSidebarStep.state}
                  helperText={
                    simulationStepComplete
                      ? undefined
                      : treatmentStepComplete
                        ? "Review the configuration and click Apply in Step 3."
                        : "Complete Step 2 first to unlock this step."
                  }
                  onSetting={() => router.push(simulationSidebarStep.href)}
                  settingDisabled={simulationSidebarStep.disabled}
                >
                  <DataSection title="Simulation Setting" rows={simulationRows} />
                  {strategySummaries.map((strategy) => (
                    <StrategyCard key={strategy.title} strategy={strategy} />
                  ))}
                </StepCard>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3 px-1">
              <div className="min-h-[18px] font-[Inter,sans-serif] text-[12px] font-medium text-[#7E7987]">
                {analysisStatus === "failed" && analysisError
                  ? analysisError
                  : lastSavedName
                    ? `Saved as ${lastSavedName}`
                    : ""}
              </div>

              <div className="flex items-center gap-3">
                <TrpCtaButton
                  variant="secondary"
                  onClick={() => setIsSaveModalOpen(true)}
                  endIcon={<SaveArrowIcon />}
                >
                  Save Progress
                </TrpCtaButton>

                <TrpCtaButton
                  onClick={() => {
                    void handleApplyToAnalysis();
                  }}
                  disabled={!canApplyToAnalysis || analysisStatus === "running"}
                >
                  {analysisStatus === "running" ? "Applying..." : "Apply to Analysis"}
                </TrpCtaButton>
              </div>
            </div>
          </TrpFramePanel>
        </div>
      </div>

      <TrpSaveProgressModal
        open={isSaveModalOpen}
        onOpenChange={setIsSaveModalOpen}
        onSave={handleSaveProgress}
      />
    </AppLayout>
  );
}
