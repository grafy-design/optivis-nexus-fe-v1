import type { TrpPatientDiseaseInfoFormData } from "@/lib/trp-data-load-mappers";
import {
  isTrpPatientDiseaseInfoComplete,
  isTrpTreatmentInfoComplete,
} from "@/lib/trp-setup-validation";
import type { TrpCompletedSteps, TrpTreatmentInfoForm } from "@/store/trp-setup-store";

export type TrpSetupStepState = "complete" | "active" | "warning" | "default";

export type TrpSetupStepKey =
  | "patient-disease-info"
  | "treatment-info"
  | "simulation-setting"
  | "view-summary";

export type TrpSetupSidebarStep = {
  key: TrpSetupStepKey;
  title: string;
  description: string;
  state: TrpSetupStepState;
  href: string;
  disabled: boolean;
};

type TrpSetupStepDefinition = Omit<TrpSetupSidebarStep, "state" | "disabled">;

const trpSetupStepDefinitions: readonly TrpSetupStepDefinition[] = [
  {
    key: "patient-disease-info",
    title: "Patient/Disease Info",
    description:
      "Enter the subject's basic information, baseline data, and disease-related information.",
    href: "/trp",
  },
  {
    key: "treatment-info",
    title: "Treatment Info",
    description: "Enter data on the current treatment status.",
    href: "/trp/treatment-info",
  },
  {
    key: "simulation-setting",
    title: "Simulation Setting",
    description:
      "Develop a plan to assess the subject's prognosis based on the entered information.",
    href: "/trp/simulation-setting",
  },
  {
    key: "view-summary",
    title: "View Summary",
    description: " ",
    href: "/trp/view-summary",
  },
];

const trpStepTitleMap: Record<TrpSetupStepKey, string> = Object.fromEntries(
  trpSetupStepDefinitions.map((step) => [step.key, step.title])
) as Record<TrpSetupStepKey, string>;

type TrpSetupStepFlagMap = Partial<Record<TrpSetupStepKey, boolean>>;

export function resolveTrpSetupFlowState(options: {
  activeStep: TrpSetupStepKey;
  includeSummary?: boolean;
  completedSteps: Partial<TrpCompletedSteps>;
  patientDiseaseInfo: TrpPatientDiseaseInfoFormData | null;
  treatmentInfo: TrpTreatmentInfoForm | null;
  simulationSettingComplete: boolean;
}) {
  const patientStepComplete =
    !!options.completedSteps["patient-disease-info"] &&
    isTrpPatientDiseaseInfoComplete(options.patientDiseaseInfo);
  const treatmentStepComplete =
    patientStepComplete &&
    !!options.completedSteps["treatment-info"] &&
    isTrpTreatmentInfoComplete(options.treatmentInfo);
  const simulationStepComplete =
    treatmentStepComplete &&
    !!options.completedSteps["simulation-setting"] &&
    options.simulationSettingComplete;

  const completedStepMap: TrpSetupStepFlagMap = {
    "patient-disease-info": patientStepComplete,
    "treatment-info": treatmentStepComplete,
    "simulation-setting": simulationStepComplete,
  };

  const warningStepMap: TrpSetupStepFlagMap = {
    "patient-disease-info": !patientStepComplete,
    "treatment-info": !treatmentStepComplete && patientStepComplete,
    "simulation-setting": !simulationStepComplete && treatmentStepComplete,
    "view-summary": false,
  };

  const accessMap = trpSetupStepDefinitions.reduce(
    (result, step, index) => {
      result[step.key] =
        index === 0 ||
        trpSetupStepDefinitions
          .slice(0, index)
          .every((previousStep) => completedStepMap[previousStep.key] ?? false);
      return result;
    },
    {} as Record<TrpSetupStepKey, boolean>
  );

  const steps = buildTrpSetupSteps(options.activeStep, {
    includeSummary: options.includeSummary,
    completedSteps: completedStepMap,
    warningSteps: warningStepMap,
  });

  const stepMap = Object.fromEntries(steps.map((step) => [step.key, step])) as Partial<
    Record<TrpSetupStepKey, TrpSetupSidebarStep>
  >;

  return {
    patientStepComplete,
    treatmentStepComplete,
    simulationStepComplete,
    completedStepMap,
    warningStepMap,
    accessMap,
    steps,
    stepMap,
    missingStepTitles: ([
      "patient-disease-info",
      "treatment-info",
      "simulation-setting",
    ] as const)
      .filter((stepKey) => !(completedStepMap[stepKey] ?? false))
      .map((stepKey) => trpStepTitleMap[stepKey]),
  };
}

export function buildTrpSetupSteps(
  activeStep: TrpSetupStepKey,
  options?: {
    includeSummary?: boolean;
    completedSteps?: Partial<Record<TrpSetupStepKey, boolean>>;
    warningSteps?: Partial<Record<TrpSetupStepKey, boolean>>;
  }
): TrpSetupSidebarStep[] {
  const visibleSteps = trpSetupStepDefinitions;
  const activeIndex = visibleSteps.findIndex((step) => step.key === activeStep);
  const completedSteps = options?.completedSteps ?? {};
  const warningSteps = options?.warningSteps ?? {};

  if (activeIndex < 0) {
    return visibleSteps.map((step, index) => ({
      ...step,
      state: index === 0 ? "active" : "default",
      disabled: index > 0,
    }));
  }

  return visibleSteps.map((step, index) => {
    const isActive = index === activeIndex;
    const isComplete = completedSteps[step.key] ?? false;
    const hasCompletedPrerequisites = visibleSteps
      .slice(0, index)
      .every((previousStep) => completedSteps[previousStep.key] ?? false);

    return {
      ...step,
      state: isActive
        ? "active"
        : isComplete
          ? "complete"
          : warningSteps[step.key]
            ? "warning"
            : "default",
      disabled: !isActive && !hasCompletedPrerequisites,
    };
  });
}
