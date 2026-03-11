/**
 * DRD 왼쪽 패널 4-Step 데이터 상수 및 헬퍼 함수
 *
 * Default Settings 하위 4개 페이지(Patient/Disease Info, Filter, High-Risk Subgroup, Medical History)에서
 * 왼쪽 패널 하단 스텝 카드에 사용되는 공통 데이터를 정의합니다.
 */

import {
  IconVirusGray,
  IconVirusOrange,
  IconFunnelGray,
  IconFunnelActive,
  IconAsteriskGray,
  IconAsteriskOrange,
  IconClockGray,
  IconClockOrange,
} from "@/components/ui/drd-step-icons";

/** DrdStepCard에 전달되는 스텝 아이템 타입 */
export type DrdStepItem = {
  id: string;
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  description: string;
  isActive: boolean;
  route: string;
};

/** 4-Step 기본 데이터 (비활성 상태, 회색 아이콘) */
const DEFAULT_SETTING_STEPS_BASE: Omit<DrdStepItem, "isActive">[] = [
  {
    id: "patient-disease-info",
    icon: IconVirusGray,
    title: "Patient/Disease Info",
    description:
      "Define patient groups by fixing simulation conditions and selecting control variables. Patient groups can be specified using demographic information, laboratory data, and vital signs",
    route: "/drd/patient-disease-info",
  },
  {
    id: "filter",
    icon: IconFunnelGray,
    title: "Filter",
    description:
      "Define patient groups through direct feature-based filtering. Filtering conditions are applied to selected features to construct patient groups.",
    route: "/drd/filter",
  },
  {
    id: "high-risk-subgroup",
    icon: IconAsteriskGray,
    title: "High-Risk Subgroub",
    description:
      "Select high-risk subgroups based on disease progression slopes. Prognostic scoring and loading of prior subgroup definitions are supported.",
    route: "/drd/high-risk-subgroup",
  },
  {
    id: "medical-history",
    icon: IconClockGray,
    title: "Medical History",
    description:
      "Define patient groups based on clinical history and risk profiles. Patient groups can be selected using diagnoses, comorbidities, risk factors, and key medical history.",
    route: "/drd/medical-history",
  },
];

/** 각 스텝 ID → 활성(오렌지) 아이콘 매핑 */
const ACTIVE_ICON_MAP: Record<string, React.ComponentType<{ size?: number }>> = {
  "patient-disease-info": IconVirusOrange,
  "filter": IconFunnelActive,
  "high-risk-subgroup": IconAsteriskOrange,
  "medical-history": IconClockOrange,
};

/**
 * 특정 스텝을 활성 상태로 지정한 4-Step 배열을 반환합니다.
 * 활성 스텝은 오렌지 아이콘 + isActive: true로 표시됩니다.
 *
 * @param activeStepId - 활성화할 스텝 ID (없으면 모두 비활성)
 */
export function makeDefaultSettingSteps(activeStepId?: string): DrdStepItem[] {
  return DEFAULT_SETTING_STEPS_BASE.map((step) => ({
    ...step,
    isActive: step.id === activeStepId,
    icon: step.id === activeStepId ? (ACTIVE_ICON_MAP[step.id] ?? step.icon) : step.icon,
  }));
}

/**
 * 완료 상태에 따라 아이콘을 오렌지로 표시하는 4-Step 배열을 반환합니다.
 * default-setting 페이지 전용 — 활성 스텝 없이 완료된 항목만 오렌지 아이콘으로 표시합니다.
 *
 * @param completedItems - 각 스텝 ID의 완료 여부 매핑
 */
export function makeDefaultSettingStepsWithCompletion(
  completedItems: Record<string, boolean>
): DrdStepItem[] {
  return DEFAULT_SETTING_STEPS_BASE.map((step) => ({
    ...step,
    isActive: false,
    icon: completedItems[step.id] ? (ACTIVE_ICON_MAP[step.id] ?? step.icon) : step.icon,
  }));
}
