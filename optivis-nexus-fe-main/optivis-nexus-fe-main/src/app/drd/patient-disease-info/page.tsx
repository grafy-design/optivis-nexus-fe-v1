/**
 * Patient / Disease Info Page — Default Settings Step 1: Patient/Disease Info
 *
 * 역할:
 *   시뮬레이션 조건을 고정하고 대조 변수를 선택하여 환자 그룹을 정의하는 설정 페이지입니다.
 *   두 컬럼으로 구성됩니다:
 *   - Baseline Variables (좌): Demographic information·Measurement 중 1개 라디오 선택
 *   - Control Variables (우): Value / Trend 모드 중 1개 선택 + 세부 트렌드(Increase·Stable·Decrease) 선택
 *
 * 레이아웃:
 *   ┌─────────────────────┬──────────────────────────────────────────────────┐
 *   │ 왼쪽: Navy Glass     │ 오른쪽: Baseline Variables | Control Variables    │
 *   │ - Filtered % 카드   │ (아코디언 섹션 + RadioButton 목록)                 │
 *   │ - 4-Step 사이드바   │                                                  │
 *   └─────────────────────┴──────────────────────────────────────────────────┘
 *
 * 주요 상태:
 *   - baselineSelection: Baseline 섹션 전체 단일 선택값 (Age | Sex | BMI | SBP | HbA1c | Glucose | eGFR | UACR)
 *   - controlMode: Control Variables 모드 (value | trend)
 *   - trendSelection: 트렌드 리스트 선택값 (Increase | Stable | Decrease)
 *   - openSections: 각 아코디언 섹션의 열림 여부
 *
 * 저장:
 *   Confirm 클릭 시 4개 값을 patientDiseaseInfoData로 저장하고
 *   patient-disease-info 완료 상태를 true로 설정한 뒤 /drd/default-setting으로 이동합니다.
 */
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loading } from "@/components/common/Loading";
import { useDefaultSettingStore } from "@/store/defaultSettingStore";
import { useSimulationStore } from "@/store/simulationStore";
import { getDrdPatientInfo, saveDrdPatientInfo } from "@/services/drd-service";
import { mapDrdInfoApisToDefaultSettingHydration } from "@/lib/drd-default-setting-mapper";
import RadioButton from "@/components/ui/radio-button";

/** 왼쪽 사이드바 4개 스텝 아이콘 클릭 시 이동할 경로 매핑 */
const stepRoutes: Record<string, string> = {
  "patient-disease-info": "/drd/patient-disease-info",
  filter: "/drd/filter",
  "high-risk": "/drd/high-risk-subgroup",
  "medical-history": "/drd/medical-history",
};

const DEMOGRAPHIC_BASELINE_OPTIONS = ["Age", "Sex"] as const;
const MEASUREMENT_BASELINE_OPTIONS = ["BMI", "SBP", "HbA1c", "Glucose", "eGFR", "UACR"] as const;
const BASELINE_RADIO_NAME = "baseline-variable";
const CONTROL_MODE_RADIO_NAME = "control-variable-mode";
const TREND_SELECTION_RADIO_NAME = "trend-selection";
const CONTROL_VALUE_OPTIONS = [
  { label: "Increase", rightValue: ">= 1.0%/year" },
  { label: "Stable", rightValue: "1.0%/year" },
  { label: "Decrease", rightValue: "<= -1.0%/year" },
] as const;

type DemographicBaselineOption = (typeof DEMOGRAPHIC_BASELINE_OPTIONS)[number];
type MeasurementBaselineOption = (typeof MEASUREMENT_BASELINE_OPTIONS)[number];
type BaselineOption = DemographicBaselineOption | MeasurementBaselineOption;
type ControlValueLabel = (typeof CONTROL_VALUE_OPTIONS)[number]["label"];
type ControlMode = "value" | "trend";

const CONTROL_FILTER_CONDITION_BASE: Record<ControlValueLabel, string> = {
  Increase: ">=1.0",
  Stable: "1.0",
  Decrease: "<=-1.0",
};

const CONTROL_VALUE_LABELS = CONTROL_VALUE_OPTIONS.map((option) => option.label);

const isDemographicBaselineOption = (value: string): value is DemographicBaselineOption =>
  (DEMOGRAPHIC_BASELINE_OPTIONS as readonly string[]).includes(value);

const isMeasurementBaselineOption = (value: string): value is MeasurementBaselineOption =>
  (MEASUREMENT_BASELINE_OPTIONS as readonly string[]).includes(value);

const normalizeControlMode = (value?: string | null): ControlMode | null => {
  const normalized = value?.trim();
  if (normalized === "value" || normalized === "trend") return normalized;
  return null;
};

const normalizeBaselineSelection = ({
  baselineDemo,
  baselineMeasure,
}: {
  baselineDemo?: string | null;
  baselineMeasure?: string | null;
}): BaselineOption | null => {
  const normalizedMeasure = baselineMeasure?.trim() ?? "";
  const normalizedDemo = baselineDemo?.trim() ?? "";

  if (isDemographicBaselineOption(normalizedMeasure)) {
    return normalizedMeasure;
  }
  if (isMeasurementBaselineOption(normalizedMeasure)) {
    return normalizedMeasure;
  }
  if (isDemographicBaselineOption(normalizedDemo)) {
    return normalizedDemo;
  }

  return null;
};

const toBaselineFields = (
  baselineSelection: BaselineOption | null
): { baselineDemo: string; baselineMeasure: string } => {
  if (!baselineSelection) {
    return { baselineDemo: "", baselineMeasure: "" };
  }
  if (isDemographicBaselineOption(baselineSelection)) {
    return { baselineDemo: baselineSelection, baselineMeasure: "" };
  }
  return { baselineDemo: "", baselineMeasure: baselineSelection };
};

const normalizeTrendSelection = (value?: string | null): ControlValueLabel | null => {
  const trimmed = value?.trim() ?? "";
  if ((CONTROL_VALUE_LABELS as readonly string[]).includes(trimmed)) {
    return trimmed as ControlValueLabel;
  }
  return null;
};

const toFilterConditionByControlMode = (
  selection: ControlValueLabel,
  mode: ControlMode
): string => {
  const mappedBase = CONTROL_FILTER_CONDITION_BASE[selection];
  return mode === "trend" ? `${mappedBase}%` : mappedBase;
};

// ── 아이콘 SVG 컴포넌트 ──────────────────────────────────────────────────

function IconVirusActive({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 25 24" fill="none">
      <circle cx="12.0312" cy="12" r="12" fill="#F06600" />
      <g clipPath="url(#clip0_iconvirusactive)">
        <path
          d="M12 19.2188C15.9868 19.2188 19.2188 15.9868 19.2188 12C19.2188 8.01319 15.9868 4.78125 12 4.78125C8.01319 4.78125 4.78125 8.01319 4.78125 12C4.78125 15.9868 8.01319 19.2188 12 19.2188Z"
          stroke="white"
          strokeWidth="1.3125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10.3594 12C11.2655 12 12 11.2655 12 10.3594C12 9.45328 11.2655 8.71875 10.3594 8.71875C9.45328 8.71875 8.71875 9.45328 8.71875 10.3594C8.71875 11.2655 9.45328 12 10.3594 12Z"
          stroke="white"
          strokeWidth="1.3125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15.9375 13.3125C16.6624 13.3125 17.25 12.7249 17.25 12C17.25 11.2751 16.6624 10.6875 15.9375 10.6875C15.2126 10.6875 14.625 11.2751 14.625 12C14.625 12.7249 15.2126 13.3125 15.9375 13.3125Z"
          fill="white"
        />
        <path
          d="M12 17.25C12.7249 17.25 13.3125 16.6624 13.3125 15.9375C13.3125 15.2126 12.7249 14.625 12 14.625C11.2751 14.625 10.6875 15.2126 10.6875 15.9375C10.6875 16.6624 11.2751 17.25 12 17.25Z"
          fill="white"
        />
        <path
          d="M12 2.8125V4.78125"
          stroke="white"
          strokeWidth="1.3125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M21.1875 12H19.2188"
          stroke="white"
          strokeWidth="1.3125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M2.8125 12H4.78125"
          stroke="white"
          strokeWidth="1.3125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 19.2188V21.1875"
          stroke="white"
          strokeWidth="1.3125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.4375 5.4375L6.8952 6.8952"
          stroke="white"
          strokeWidth="1.3125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M17.1094 6.8952L18.5671 5.4375"
          stroke="white"
          strokeWidth="1.3125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M18.5671 18.5671L17.1094 17.1094"
          stroke="white"
          strokeWidth="1.3125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.4375 18.5671L6.8952 17.1094"
          stroke="white"
          strokeWidth="1.3125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_iconvirusactive">
          <rect width="21" height="21" fill="white" transform="translate(1.5 1.5)" />
        </clipPath>
      </defs>
    </svg>
  );
}

function IconFunnelGray({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="12" fill="#919092" />
      <g clipPath="url(#clip0_iconfunnelgray_pdi)">
        <path
          d="M4.29556 6.53508C4.21017 6.4411 4.15387 6.32437 4.1335 6.19904C4.11313 6.0737 4.12955 5.94515 4.18079 5.82897C4.23202 5.71279 4.31586 5.61396 4.42214 5.54447C4.52842 5.47499 4.65257 5.43783 4.77955 5.4375H19.217C19.3442 5.43751 19.4685 5.47444 19.5751 5.5438C19.6816 5.61317 19.7657 5.71197 19.8171 5.82822C19.8685 5.94447 19.8851 6.07315 19.8648 6.19863C19.8445 6.32412 19.7882 6.441 19.7027 6.53508L13.967 12.6562V17.4674C13.9671 17.5755 13.9405 17.6819 13.8896 17.7772C13.8386 17.8725 13.7649 17.9537 13.675 18.0137L11.05 19.7634C10.9513 19.8293 10.8365 19.8672 10.718 19.873C10.5994 19.8788 10.4815 19.8524 10.3768 19.7965C10.2721 19.7406 10.1845 19.6573 10.1233 19.5556C10.0622 19.4539 10.0298 19.3374 10.0295 19.2187V12.6562L4.29556 6.53508Z"
          stroke="white"
          strokeWidth="1.3125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_iconfunnelgray_pdi">
          <rect width="21" height="21" fill="white" transform="translate(1.5 1.5)" />
        </clipPath>
      </defs>
    </svg>
  );
}

function IconAsteriskGray({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 25 24" fill="none">
      <circle cx="12.0312" cy="12" r="12" fill="#919092" />
      <g clipPath="url(#clip0_iconasteriskgray_pdi)">
        <path
          d="M12 4.78125V19.2188"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.4375 8.0625L18.5625 15.9375"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.4375 15.9375L18.5625 8.0625"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_iconasteriskgray_pdi">
          <rect width="21" height="21" fill="white" transform="translate(1.5 1.5)" />
        </clipPath>
      </defs>
    </svg>
  );
}

function IconClockGray({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 25 24" fill="none">
      <circle cx="12.0312" cy="12" r="12" fill="#919092" />
      <g clipPath="url(#clip0_iconclockgray_pdi)">
        <path
          d="M12 8.0625V12L15.2812 13.9688"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.40625 10.0312H4.125V6.75"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.04531 17.2503C8.07724 18.2241 9.37323 18.8721 10.7714 19.1135C12.1695 19.3549 13.6078 19.1789 14.9065 18.6076C16.2051 18.0363 17.3067 17.0949 18.0734 15.9011C18.8402 14.7073 19.2381 13.314 19.2175 11.8954C19.197 10.4767 18.7588 9.09554 17.9578 7.92448C17.1568 6.75342 16.0284 5.84437 14.7137 5.31092C13.399 4.77747 11.9562 4.64327 10.5657 4.9251C9.17512 5.20692 7.89846 5.89227 6.8952 6.89551C5.92969 7.87332 5.13234 8.79536 4.125 10.0316"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_iconclockgray_pdi">
          <rect width="21" height="21" fill="white" transform="translate(1.5 1.5)" />
        </clipPath>
      </defs>
    </svg>
  );
}

function IconChevronDown({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 10" fill="none">
      <path
        d="M1 1L8 8L15 1"
        stroke="#484646"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── 데이터 설정 ───────────────────────────────────────────────────────────

/**
 * 왼쪽 패널 하단 4단계 설정 스텝 목록.
 * isActive: true 인 Patient/Disease Info 항목이 현재 페이지이며 오렌지 아이콘 + 네이비 배경으로 표시됩니다.
 */
const setupSteps = [
  {
    id: "patient-disease-info",
    IconComponent: IconVirusActive,
    isActive: true,
    title: "Patient/Disease Info",
    description:
      "Define patient groups by setting up simulation conditions and selecting control variables. Patient groups can be specified using demographic information, laboratory data, and vital signs.",
    titleColor: "#ffffff",
    descriptionColor: "#c9c5c8",
    bgColor: "#262255",
  },
  {
    id: "filter",
    IconComponent: IconFunnelGray,
    isActive: false,
    title: "Filter",
    description:
      "Define patient groups through direct feature-based filtering. Filtering conditions are applied to selected features to construct patient groups.",
    titleColor: "#484646",
    descriptionColor: "#919092",
    bgColor: "transparent",
  },
  {
    id: "high-risk",
    IconComponent: IconAsteriskGray,
    isActive: false,
    title: "High-Risk Subgroub",
    description:
      "Select high-risk subgroups based on rate of disease progression. Prognostic scoring and loading of prior subgroup definitions are available.",
    titleColor: "#484646",
    descriptionColor: "#919092",
    bgColor: "transparent",
  },
  {
    id: "medical-history",
    IconComponent: IconClockGray,
    isActive: false,
    title: "Medical History",
    description:
      "Define patient groups based on clinical history and risk profiles. Patient groups can be selected using diagnoses, comorbidities, risk factors, and key medical history.",
    titleColor: "#484646",
    descriptionColor: "#919092",
    bgColor: "transparent",
  },
];

// ─── 글래스 Test 버튼 ───────────────────────────────────────────────────────

/**
 * "Test Load" 버튼 — 클릭 시 HbA1c + value 모드 + Increase로 샘플 값을 채웁니다.
 */
function GlassTestButton({ disabled, onClick }: { disabled?: boolean; onClick?: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const bg = disabled
    ? "#F5F5F7"
    : pressed
      ? "radial-gradient(ellipse at center, #DDDDE6 80%, rgba(51,0,255,0.18) 100%)"
      : hovered
        ? "#EBEBEB"
        : "#F7F7F7";
  const textColor = disabled ? "#C6C5C9" : pressed ? "#3a11d8" : "#262255";
  return (
    <div
      onClick={() => !disabled && onClick?.()}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setPressed(false);
      }}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        position: "relative",
        height: 40,
        paddingLeft: 20,
        paddingRight: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        flexShrink: 0,
        borderRadius: 36,
        boxShadow: "0px 0px 2px 0px rgba(0,0,0,0.05)",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 36,
          background: "#333333",
          mixBlendMode: "color-dodge",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 36,
          background: bg,
          transition: "background 0.12s",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 36,
          border: pressed ? "2px solid rgba(58,17,216,0.19)" : "2px solid rgba(255,255,255,0.3)",
          boxShadow: "0px 0px 2px 0px rgba(0,0,0,0.05)",
          transition: "border-color 0.12s",
        }}
      />
      <span
        style={{
          position: "relative",
          zIndex: 1,
          fontFamily: "Inter, sans-serif",
          fontWeight: 600,
          fontSize: 17,
          color: textColor,
          letterSpacing: "-0.51px",
          whiteSpace: "nowrap",
          paddingTop: 2,
          transition: "color 0.12s",
        }}
      >
        Test Load
      </span>
    </div>
  );
}

function PatientDiseaseInfoPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // defaultSettingStore: 코호트 수, 완료 상태, PDI 설정 데이터 관리
  const {
    setCompleted,
    markNeedsSync,
    hydratedTaskId,
    cohortCount,
    finalCohortCount,
    setPatientDiseaseInfoData,
    patientDiseaseInfoData,
  } = useDefaultSettingStore();
  const { taskId: simulationTaskId, setError } = useSimulationStore();
  // filteredRatio: Filtered Patients 카드 프로그레스바 비율
  const filteredRatio = cohortCount > 0 ? Math.round((finalCohortCount / cohortCount) * 100) : 0;
  const initialControlMode = normalizeControlMode(patientDiseaseInfoData?.controlMode);
  const initialBaselineSelection = normalizeBaselineSelection({
    baselineDemo: patientDiseaseInfoData?.baselineDemo,
    baselineMeasure: patientDiseaseInfoData?.baselineMeasure,
  });
  const initialTrendSelection = normalizeTrendSelection(patientDiseaseInfoData?.trendSelection);
  // controlMode: Control Variables 탭 — "value"(값 기준) | "trend"(트렌드 기준)
  const [controlMode, setControlMode] = useState<ControlMode | null>(initialControlMode);
  // openSections: 아코디언 섹션 열림 여부 (demographic, measurement)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    demographic: true,
    measurement: true,
  });
  /** 아코디언 섹션 토글 */
  const toggleSection = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  // Baseline Variables — 전체 단일 선택
  const [baselineSelection, setBaselineSelection] = useState<BaselineOption | null>(
    initialBaselineSelection
  );
  // Control Variables — 트렌드 목록 선택 (Increase | Stable | Decrease)
  const [trendSelection, setTrendSelection] = useState<ControlValueLabel | null>(
    initialTrendSelection
  );

  // 초기값 상수 — isDirty 계산 및 Reset 시 복원에 사용
  const INITIAL_CONTROL_MODE = initialControlMode;
  const INITIAL_BASELINE_SELECTION = initialBaselineSelection;
  const INITIAL_TREND_SELECTION = initialTrendSelection;

  // isDirty: 초기값 대비 변경된 값이 있으면 true — Reset 버튼 활성화 기준
  const isDirty =
    controlMode !== INITIAL_CONTROL_MODE ||
    baselineSelection !== INITIAL_BASELINE_SELECTION ||
    trendSelection !== INITIAL_TREND_SELECTION;

  /** Reset 버튼 클릭 시 모든 선택을 초기값으로 복원하고 완료 상태를 해제합니다 */
  const handleReset = () => {
    setControlMode(INITIAL_CONTROL_MODE);
    setBaselineSelection(INITIAL_BASELINE_SELECTION);
    setTrendSelection(INITIAL_TREND_SELECTION);
    setCompleted("patient-disease-info", false);
  };
  // Reset 버튼 hover/active 상태 (배경색 변화용)
  const [resetHover, setResetHover] = useState(false);
  const [resetActive, setResetActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const resolveTaskId = (): string | null => {
    const fromQuery =
      searchParams.get("task_id") ?? searchParams.get("taskId") ?? searchParams.get("test_id");
    const candidate = fromQuery?.trim() || simulationTaskId || hydratedTaskId;
    return candidate?.trim() || null;
  };

  const buildDrdPathWithContext = (pathname: string): string => {
    const params = new URLSearchParams(searchParams.toString());
    const taskId = resolveTaskId();

    if (taskId) {
      params.delete("taskId");
      params.delete("test_id");
      params.set("task_id", taskId);
    }

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const handleConfirm = async (): Promise<void> => {
    if (isSaving) return;

    const taskId = resolveTaskId();
    if (!taskId) {
      setError("task_id를 확인할 수 없어 Patient/Disease Info 저장을 진행할 수 없습니다.");
      return;
    }
    if (!baselineSelection) {
      setError("Baseline Variables에서 1개 항목을 선택해 주세요.");
      return;
    }
    if (!controlMode) {
      setError("Control Variables에서 Value 또는 Trend를 선택해 주세요.");
      return;
    }
    if (!trendSelection) {
      setError("Control Variables 상세 항목을 선택해 주세요.");
      return;
    }

    const convertedFilterCondition = toFilterConditionByControlMode(trendSelection, controlMode);

    try {
      setIsSaving(true);
      setError(null);

      await saveDrdPatientInfo({
        task_id: taskId,
        measurement: baselineSelection,
        control_variable_type: controlMode === "trend" ? "Trend" : "Value",
        filter_condition: convertedFilterCondition,
      });

      setPatientDiseaseInfoData({
        ...toBaselineFields(baselineSelection),
        controlMode,
        trendSelection,
      });
      setCompleted("patient-disease-info", true);
      markNeedsSync();
      router.push(buildDrdPathWithContext("/drd/default-setting"));
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Patient/Disease Info 저장에 실패했습니다."
      );
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const taskId = resolveTaskId();
    if (!taskId) return;

    let cancelled = false;

    const loadPatientInfo = async () => {
      setIsFetching(true);
      try {
        const response = await getDrdPatientInfo({ task_id: taskId });
        if (cancelled) return;

        const hydration = mapDrdInfoApisToDefaultSettingHydration({
          taskId,
          patientInfo: response.data,
          groupManageFilterInfo: null,
          subgroups: [],
          medicalHistoryInfo: null,
        });

        const next = hydration.patientDiseaseInfoData;
        if (next) {
          const normalizedNextBaseline = normalizeBaselineSelection({
            baselineDemo: next.baselineDemo,
            baselineMeasure: next.baselineMeasure,
          });
          const normalizedNextControlMode = normalizeControlMode(next.controlMode);
          const normalizedNextTrendSelection = normalizeTrendSelection(next.trendSelection);
          setBaselineSelection(normalizedNextBaseline);
          setControlMode(normalizedNextControlMode);
          setTrendSelection(normalizedNextTrendSelection);
          setPatientDiseaseInfoData({
            ...next,
            ...toBaselineFields(normalizedNextBaseline),
            controlMode: normalizedNextControlMode ?? "",
            trendSelection: normalizedNextTrendSelection ?? "",
          });
        }

        setCompleted(
          "patient-disease-info",
          Boolean(hydration.completedItems?.["patient-disease-info"])
        );
      } catch (error) {
        if (cancelled) return;
        setError(
          error instanceof Error ? error.message : "Patient/Disease Info 조회에 실패했습니다."
        );
      } finally {
        if (!cancelled) {
          setIsFetching(false);
        }
      }
    };

    void loadPatientInfo();

    return () => {
      cancelled = true;
    };
  }, [
    searchParams,
    simulationTaskId,
    hydratedTaskId,
    setCompleted,
    setError,
    setPatientDiseaseInfoData,
  ]);

  return (
    <AppLayout headerType="drd" drdStep={1} scaleMode="none">
      <Loading isLoading={isFetching || isSaving} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "calc(100% - 24px)",
          height: "100%",
          gap: 24,
          overflow: "hidden",
          marginLeft: "8px",
          marginRight: "8px",
        }}
      >
        {/* {타이틀 영역/Title Area} */}
        {/* ── TOP: Title ───────────────────────────── */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexShrink: 0,
            padding: "0 12px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h1
              onClick={() => router.push(buildDrdPathWithContext("/drd/default-setting"))}
              style={{
                fontFamily: "Poppins, Inter, sans-serif",
                fontSize: 42,
                fontWeight: 600,
                color: "rgb(17,17,17)",
                letterSpacing: "-1.5px",
                lineHeight: 1.1,
                margin: 0,
                cursor: "pointer",
              }}
            >
              Cohort Definition
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
              Setup Required
            </span>
          </div>
        </div>

        {/* {컨텐츠 행/Content Row} */}
        {/* ── ② 컨텐츠 행 (왼쪽 패널 + 오른쪽 패널) ───────────────────────── */}
        <div className="flex min-h-0 flex-1 items-stretch" style={{ gap: "0px" }}>
          {/* {왼쪽 패널/Left Panel} */}
          {/* ── 왼쪽 패널: Navy Liquid Glass ────────────────── */}
          <div
            className="flex w-[380px] flex-shrink-0 flex-col gap-[12px] overflow-hidden rounded-[36px]"
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
            {/* {필터링된 환자 카드/Filtered Patients Card} */}
            {/* Filtered Patients 카드 (내부) */}
            <div className="relative flex h-[250px] shrink-0 flex-col overflow-hidden rounded-[24px] p-[16px] shadow-[0px_0px_2px_0px_rgba(0,0,0,0.1)]">
              {/* 카드 전용 Navy 그라디언트 필 */}
              <div
                className="pointer-events-none absolute inset-0 z-0"
                style={{
                  backgroundImage: "linear-gradient(90deg, #262255 0%, #262255 100%)",
                }}
              />
              <div className="absolute inset-0 z-[1] bg-[rgba(38,38,38,0.25)] mix-blend-color-dodge" />

              {/* 카드 내용 */}
              <div className="relative z-10 flex h-full flex-col gap-[0px]">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-[4px]">
                    <span className="font-['Inter'] text-[15px] leading-[1.18] font-semibold tracking-[-0.36px] text-white">
                      filtered patients
                    </span>
                    <span className="font-['Inter'] text-[36px] leading-none font-semibold tracking-[-1.08px] text-white">
                      {filteredRatio}%
                    </span>
                  </div>
                  <button
                    onClick={() => router.push(buildDrdPathWithContext("/drd/datasetting"))}
                    className="relative flex h-[30px] cursor-pointer items-center gap-[4px] overflow-hidden rounded-[36px] border-none bg-transparent px-[14px] py-[8px]"
                  >
                    <div className="absolute inset-0 bg-[#f06600] mix-blend-plus-lighter" />
                    <span className="relative z-10 font-['Inter'] text-[15px] leading-[1.15] font-semibold tracking-[-0.75px] text-white mix-blend-screen">
                      Add data
                    </span>
                    <span className="relative z-10 text-[16px] font-bold text-white mix-blend-screen">
                      +
                    </span>
                  </button>
                </div>

                <div style={{ marginTop: "24px" }}>
                  <div
                    className="relative h-[18px] w-full rounded-[12px]"
                    style={{ background: "rgba(255,255,255,0.2)" }}
                  >
                    <div
                      className="absolute top-0 left-0 h-full overflow-hidden rounded-[12px] bg-[#f06600] transition-all duration-300"
                      style={{ width: `${filteredRatio}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-end pr-[11.13px]">
                      <span
                        className="text-right font-['Inter'] text-[13px] leading-[1.18] font-semibold tracking-[-0.36px] text-white"
                        style={{ textShadow: "0 0 6px rgba(0,0,0,0.4)" }}
                      >
                        {finalCohortCount.toLocaleString()}/{cohortCount.toLocaleString()} patients
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-auto flex flex-col gap-[2px]">
                  <div className="font-['Inter'] text-[15px] leading-[1.15] font-semibold tracking-[-0.75px] text-white">
                    OPMD
                  </div>
                  <div className="flex gap-[11px]">
                    <div className="flex items-center gap-[3px]">
                      <span className="font-['Inter'] text-[10px] leading-[1.1] font-semibold tracking-[-0.4px] text-white">
                        Initial Cohort
                      </span>
                      <span className="w-[86px] font-['Inter'] text-[15px] leading-[1.15] font-semibold tracking-[-0.75px] text-white">
                        {cohortCount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-[3px]">
                      <span className="font-['Inter'] text-[10px] leading-[1.1] font-semibold tracking-[-0.4px] text-white">
                        Final Cohort
                      </span>
                      <span className="w-[86px] font-['Inter'] text-[15px] leading-[1.15] font-semibold tracking-[-0.75px] text-white">
                        {finalCohortCount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* {설정 단계/Setup Steps} */}
            {/* Setup Steps 하단 영역 (Light Gray/Blue Glass Overlay) */}
            <div className="flex flex-1 flex-col gap-[8px] overflow-y-auto rounded-[24px] bg-[rgba(255,255,255,0.6)] p-[10px]">
              {setupSteps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => router.push(buildDrdPathWithContext(stepRoutes[step.id]))}
                  className={[
                    "flex w-full shrink-0 cursor-pointer flex-col rounded-[24px] border-none p-[16px] pt-[12px] pb-[16px] text-left transition-colors duration-150",
                    step.isActive ? "" : "hover:bg-[#f9f8fc] active:bg-[#efeff4]",
                  ].join(" ")}
                  style={{
                    backgroundColor: step.bgColor || undefined,
                    height: 100,
                    justifyContent: "center",
                  }}
                >
                  <div className="flex items-center gap-[18px]">
                    <div className="flex shrink-0 items-center justify-center">
                      <step.IconComponent size={24} />
                    </div>
                    <span
                      className="font-['Inter'] text-[17px] leading-[1.12] font-semibold tracking-[-0.68px]"
                      style={{ color: step.titleColor }}
                    >
                      {step.title}
                    </span>
                  </div>
                  <div className="mt-0 pl-[42px]">
                    <p
                      className="m-0 font-['Inter'] text-[10px] leading-[1.1] font-semibold tracking-[-0.4px]"
                      style={{ color: step.descriptionColor }}
                    >
                      {step.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* {오른쪽 패널/Right Panel} */}
          {/* 오른쪽 상위 배경 카드: selection-bg.png → 안에 흰색 테이블 카드 */}
          <div
            className="drd-right-panel flex min-h-0 min-w-0 flex-[78] flex-col"
            style={{
              borderImage:
                'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch',
              borderStyle: "solid",
              borderTopWidth: "20px",
              borderBottomWidth: "28px",
              borderLeftWidth: "24px",
              borderRightWidth: "24px",
              borderColor: "transparent",
              gap: "12px",
              marginLeft: "-6px",
            }}
          >
            {/* 상단 섹션: 제목 + Reset */}
            <div
              className="flex h-[40px] shrink-0 items-center justify-between pr-0 pl-[8px]"
              style={{ paddingTop: 0, paddingBottom: 0, paddingRight: 0 }}
            >
              <h2 className="m-0 font-['Inter'] text-[24px] leading-[1.2] font-semibold tracking-[-0.72px] text-[#262255]">
                Patient / Disease Info
              </h2>
              <div className="flex items-center" style={{ gap: 12 }}>
                <GlassTestButton
                  onClick={() => {
                    setBaselineSelection("HbA1c");
                    setControlMode("value");
                    setTrendSelection("Increase");
                  }}
                />
                <button
                  onClick={isDirty ? handleReset : undefined}
                  onMouseEnter={() => isDirty && setResetHover(true)}
                  onMouseLeave={() => {
                    setResetHover(false);
                    setResetActive(false);
                  }}
                  onMouseDown={() => isDirty && setResetActive(true)}
                  onMouseUp={() => setResetActive(false)}
                  className="relative flex h-[40px] items-center justify-center gap-[8px] overflow-hidden rounded-[36px] border-none bg-transparent pr-[16px] pl-[20px]"
                  style={{ cursor: isDirty ? "pointer" : "default" }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background: !isDirty
                        ? "#c7c5c9"
                        : resetActive
                          ? "#313030"
                          : resetHover
                            ? "#5f5e5e"
                            : "#787776",
                    }}
                  />
                  <span
                    className="relative z-10 font-['Inter'] text-[17px] font-semibold tracking-[-0.51px]"
                    style={{ color: isDirty ? "#ffffff" : "#e3e1e5", paddingTop: 2 }}
                  >
                    Reset
                  </span>
                  <div className="relative z-10 shrink-0">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2V4C10.0845 4.00022 8.23272 4.6877 6.78115 5.93749C5.32958 7.18727 4.37462 8.9164 4.08983 10.8106C3.80504 12.7048 4.20934 14.6382 5.22923 16.2596C6.24912 17.881 7.81691 19.0826 9.64763 19.646C11.4783 20.2095 13.4505 20.0974 15.2055 19.3301C16.9606 18.5628 18.3821 17.1913 19.2117 15.4648C20.0413 13.7382 20.2239 11.7714 19.7262 9.9217C19.2286 8.07199 18.0839 6.46223 16.5 5.385V8H14.5V2H20.5V4H18C19.2425 4.93093 20.251 6.13866 20.9453 7.52734C21.6397 8.91601 22.0008 10.4474 22 12Z"
                        fill={isDirty ? "#ffffff" : "#e3e1e5"}
                        stroke={isDirty ? "#ffffff" : "#e3e1e5"}
                        strokeWidth="0.5"
                      />
                    </svg>
                  </div>
                </button>
              </div>
            </div>

            {/* {설정 패널 영역/Setting Panel Area} */}
            {/* 설정 패널 영역 (Baseline + Control) */}
            <div className="flex min-h-0 flex-1 gap-[12px]">
              {/* {Baseline Variables 섹션/Baseline Variables Section} */}
              {/* Baseline Variables 섹션 */}
              <div className="scrollbar-hide flex flex-1 flex-col gap-[20px] overflow-auto rounded-[24px] bg-[rgba(255,255,255,0.6)] p-[16px]">
                <div className="font-['Inter'] text-[17px] leading-[1.12] font-semibold tracking-[-0.68px]">
                  <span className="text-[#484646]">Baseline Variables </span>
                  <span className="text-[#3a11d8]">*</span>
                </div>

                <div className="flex flex-col gap-[12px]">
                  {/* Demographic information 그룹 */}
                  <div className="flex shrink-0 flex-col overflow-hidden rounded-[12px] bg-white pb-[8px]">
                    <button
                      onClick={() => toggleSection("demographic")}
                      className="flex h-[46px] w-full shrink-0 cursor-pointer items-center gap-[12px] border-none bg-transparent px-[12px] py-[8px] text-left"
                    >
                      <div
                        className="shrink-0 transition-transform duration-200"
                        style={{
                          transform: openSections.demographic ? "rotate(0deg)" : "rotate(-90deg)",
                        }}
                      >
                        <IconChevronDown size={14} />
                      </div>
                      <span className="font-['Inter'] text-[15px] leading-[1.15] font-semibold tracking-[-0.75px] text-[#484646]">
                        Demographic information
                      </span>
                    </button>
                    {openSections.demographic && (
                      <div className="flex flex-col gap-[12px] border-t-[1.5px] border-solid border-[#c7c5c9] py-[12px] pl-[48px]">
                        <RadioButton
                          name={BASELINE_RADIO_NAME}
                          value="Age"
                          checked={baselineSelection === "Age"}
                          onChange={() => setBaselineSelection("Age")}
                          label="Age"
                        />
                        <RadioButton
                          name={BASELINE_RADIO_NAME}
                          value="Sex"
                          checked={baselineSelection === "Sex"}
                          onChange={() => setBaselineSelection("Sex")}
                          label="Sex"
                        />
                      </div>
                    )}
                  </div>

                  {/* Measurement 그룹 */}
                  <div className="flex shrink-0 flex-col overflow-hidden rounded-[12px] bg-white pb-[8px]">
                    <button
                      onClick={() => toggleSection("measurement")}
                      className="flex h-[46px] w-full shrink-0 cursor-pointer items-center gap-[12px] border-none bg-transparent px-[12px] py-[8px] text-left"
                    >
                      <div
                        className="shrink-0 transition-transform duration-200"
                        style={{
                          transform: openSections.measurement ? "rotate(0deg)" : "rotate(-90deg)",
                        }}
                      >
                        <IconChevronDown size={14} />
                      </div>
                      <span className="font-['Inter'] text-[15px] leading-[1.15] font-semibold tracking-[-0.75px] text-[#484646]">
                        Measurement
                      </span>
                    </button>
                    {openSections.measurement && (
                      <div className="flex flex-col gap-[12px] border-t-[1.5px] border-solid border-[#c7c5c9] py-[12px] pl-[48px]">
                        {MEASUREMENT_BASELINE_OPTIONS.map((m) => (
                          <RadioButton
                            key={m}
                            name={BASELINE_RADIO_NAME}
                            value={m}
                            checked={baselineSelection === m}
                            onChange={() => setBaselineSelection(m)}
                            label={m}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* {Control Variables 섹션/Control Variables Section} */}
              {/* Control Variables 섹션 */}
              <div className="scrollbar-hide flex flex-1 flex-col gap-[20px] overflow-auto rounded-[33px] bg-[rgba(255,255,255,0.6)] p-[16px]">
                <div className="font-['Inter'] text-[17px] leading-[1.12] font-semibold tracking-[-0.68px]">
                  <span className="text-[#484646]">Control Variables </span>
                  <span className="text-[#3a11d8]">*</span>
                </div>

                <div className="flex flex-col gap-[12px] rounded-[18px] bg-white p-[16px]">
                  <div className="flex h-[18px] items-start gap-[12px]">
                    <RadioButton
                      name={CONTROL_MODE_RADIO_NAME}
                      value="value"
                      checked={controlMode === "value"}
                      label="Value"
                      onChange={() => setControlMode("value")}
                    />
                    <RadioButton
                      name={CONTROL_MODE_RADIO_NAME}
                      value="trend"
                      checked={controlMode === "trend"}
                      label="Trend"
                      onChange={() => setControlMode("trend")}
                    />
                  </div>

                  {/* 트렌드 선택 상자 */}
                  <div className="flex flex-col gap-[24px] rounded-[8px] bg-[#f9f8fc] px-[12px] py-[10px]">
                    <span className="font-['Inter'] text-[15px] leading-[1.15] font-semibold tracking-[-0.75px] text-[#484646]">
                      Select patients based on value
                    </span>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-[8px] py-[4px] pl-[24px]">
                        <span className="w-[160px] font-['Inter'] text-[15px] font-medium tracking-[-0.45px] text-[#484646]">
                          HbA1c
                        </span>
                        <span className="ml-auto w-[140px] text-left font-['Inter'] text-[15px] font-medium tracking-[-0.45px] text-[#484646]">
                          Value
                        </span>
                      </div>

                      {CONTROL_VALUE_OPTIONS.map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center gap-[8px] border-solid py-[8px]"
                          style={{ borderTop: "1.5px solid #c7c5c9" }}
                        >
                          <RadioButton
                            name={TREND_SELECTION_RADIO_NAME}
                            value={item.label}
                            checked={trendSelection === item.label}
                            onChange={() => setTrendSelection(item.label)}
                          />
                          <span className="w-[160px] font-['Inter'] text-[15px] font-medium tracking-[-0.45px] text-[#484646]">
                            {item.label}
                          </span>
                          <span className="ml-auto w-[140px] text-left font-['Inter'] text-[15px] font-medium tracking-[-0.45px] text-[#929090]">
                            {item.rightValue}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* {하단 버튼/Bottom Buttons} */}
            {/* 하단 버튼 */}
            <div className="flex shrink-0 justify-end gap-[12px]">
              <button
                onClick={() => router.push(buildDrdPathWithContext("/drd/default-setting"))}
                className="flex h-[40px] cursor-pointer items-center justify-center rounded-[36px] border-none bg-[#787776] px-[24px]"
              >
                <span className="font-['Inter'] text-[17px] leading-[1.05] font-semibold tracking-[-0.51px] text-white">
                  Cancel
                </span>
              </button>
              <button
                onClick={() => {
                  void handleConfirm();
                }}
                className="flex h-[40px] cursor-pointer items-center justify-center rounded-[36px] border-none bg-[#f06600] px-[24px]"
              >
                <span className="text-center font-['Inter'] text-[17px] leading-[1.05] font-semibold tracking-[-0.51px] text-white">
                  Confirm
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function PatientDiseaseInfoPage() {
  return (
    <Suspense fallback={null}>
      <PatientDiseaseInfoPageContent />
    </Suspense>
  );
}
