/**
 * High-Risk Subgroup Page — Default Settings Step 1: High-Risk Subgroup
 *
 * 역할:
 *   질병 진행 기울기(slope)를 기반으로 고위험 서브그룹을 선택하는 설정 페이지입니다.
 *   미리 정의된 서브그룹 목록(CKD 1/2 Stage, Set 1/4)을 아코디언 테이블로 표시하며,
 *   각 항목은 Slow / Rapid 두 가지 서브 행을 가집니다.
 *   라디오 버튼으로 하나의 서브 행을 선택한 뒤 Confirm하면 설정이 저장됩니다.
 *
 * 레이아웃:
 *   ┌─────────────────────┬──────────────────────────────────────────────────┐
 *   │ 왼쪽: Navy Glass     │ 오른쪽: "Load Subgroup" 아코디언 테이블           │
 *   │ - Filtered % 카드   │                                                  │
 *   │ - 4-Step 사이드바   │                                                  │
 *   └─────────────────────┴──────────────────────────────────────────────────┘
 *
 * 주요 상태:
 *   - selectedSubRow: 현재 선택된 서브 행 ID (e.g. "ckd1-slow")
 *   - expandedRows: 현재 열린 부모 행 Set (한 번에 여러 개 열릴 수 있음)
 *   - showSubgroupModal: "Go to Create Subgroup" 확인 모달 표시 여부
 *
 * 저장:
 *   Confirm 클릭 시 API로 조회한 현재 서브그룹 목록에서 선택 행을 찾아
 *   저장 API를 호출하고 완료 상태를 true로 설정합니다.
 */
"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loading } from "@/components/common/Loading";
import { useDefaultSettingStore } from "@/store/defaultSettingStore";
import { useSimulationStore } from "@/store/simulationStore";
import {
  getDrdSubgroupsList,
  saveDrdSubgroups,
  type DRDSubgroupChildItem,
  type DRDSubgroupItem,
} from "@/services/drd-service";
import { mapDrdInfoApisToDefaultSettingHydration } from "@/lib/drd-default-setting-mapper";
import RadioButton from "@/components/ui/radio-button";

/** 왼쪽 사이드바 4개 스텝 아이콘 클릭 시 이동할 경로 매핑 */
const stepRoutes: Record<string, string> = {
  "patient-disease-info": "/drd/patient-disease-info",
  filter: "/drd/filter",
  "high-risk": "/drd/high-risk-subgroup",
  "medical-history": "/drd/medical-history",
};

// ── 아이콘 SVG 컴포넌트 ──────────────────────────────────────────────────

function IconVirusGray({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 25 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12.0312" cy="12" r="12" fill="#919092" />
      <g clipPath="url(#clip0_iconvirusgray_hrsg)">
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
        <clipPath id="clip0_iconvirusgray_hrsg">
          <rect width="21" height="21" fill="white" transform="translate(1.5 1.5)" />
        </clipPath>
      </defs>
    </svg>
  );
}

function IconFunnelGray({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="12" fill="#919092" />
      <g clipPath="url(#clip0_iconfunnelgray_hrsg)">
        <path
          d="M4.29556 6.53508C4.21017 6.4411 4.15387 6.32437 4.1335 6.19904C4.11313 6.0737 4.12955 5.94515 4.18079 5.82897C4.23202 5.71279 4.31586 5.61396 4.42214 5.54447C4.52842 5.47499 4.65257 5.43783 4.77955 5.4375H19.217C19.3442 5.43751 19.4685 5.47444 19.5751 5.5438C19.6816 5.61317 19.7657 5.71197 19.8171 5.82822C19.8685 5.94447 19.8851 6.07315 19.8648 6.19863C19.8445 6.32412 19.7882 6.441 19.7027 6.53508L13.967 12.6562V17.4674C13.9671 17.5755 13.9405 17.6819 13.8896 17.7772C13.8386 17.8725 13.7649 17.9537 13.675 18.0137L11.05 19.7634C10.9513 19.8293 10.8365 19.8672 10.718 19.873C10.5994 19.8788 10.4815 19.8524 10.3768 19.7965C10.2721 19.7406 10.1845 19.6573 10.1233 19.5556C10.0622 19.4539 10.0298 19.3374 10.0295 19.2187V12.6562L4.29556 6.53508Z"
          stroke="white"
          strokeWidth="1.3125"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <defs>
        <clipPath id="clip0_iconfunnelgray_hrsg">
          <rect width="21" height="21" fill="white" transform="translate(1.5 1.5)" />
        </clipPath>
      </defs>
    </svg>
  );
}

function IconAsteriskActive({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 25 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12.0312" cy="12" r="12" fill="#F06600" />
      <g clipPath="url(#clip0_iconasteriskactive_hrsg)">
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
        <clipPath id="clip0_iconasteriskactive_hrsg">
          <rect width="21" height="21" fill="white" transform="translate(1.5 1.5)" />
        </clipPath>
      </defs>
    </svg>
  );
}

function IconClockGray({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 25 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12.0312" cy="12" r="12" fill="#919092" />
      <g clipPath="url(#clip0_iconclockgray_hrsg)">
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
        <clipPath id="clip0_iconclockgray_hrsg">
          <rect width="21" height="21" fill="white" transform="translate(1.5 1.5)" />
        </clipPath>
      </defs>
    </svg>
  );
}

/**
 * 아코디언 행 헤더 오른쪽에 표시되는 화살표 아이콘.
 * open=true이면 위쪽 방향(∧), false이면 아래 방향(∨)을 표시합니다.
 */
function AccordionItem({ open = false }: { open?: boolean }) {
  const size = 20;
  if (open) {
    // 열린 아코디언: chevron up (∧)
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <path
          d="M5 12.5L10 7.5L15 12.5"
          stroke="#313030"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  // 닫힌 아코디언: chevron down (∨)
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="#313030"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── 데이터 설정 ──────────────────────────────────────────────────────────

/**
 * 왼쪽 패널 하단 4단계 설정 스텝 목록.
 * isActive: true 인 High-Risk Subgroup 항목이 현재 페이지이며 오렌지 아이콘으로 표시됩니다.
 */
const setupSteps = [
  {
    id: "patient-disease-info",
    IconComponent: IconVirusGray,
    isActive: false,
    title: "Patient/Disease Info",
    description:
      "Define patient groups by setting up simulation conditions and selecting control variables. Patient groups can be specified using demographic information, laboratory data, and vital signs.",
    titleColor: "#484646",
    descriptionColor: "#919092",
    bgColor: "transparent",
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
    IconComponent: IconAsteriskActive,
    isActive: true,
    title: "High-Risk Subgroup",
    description:
      "Select high-risk subgroups based on rate of disease progression. Prognostic scoring and loading of prior subgroup definitions are available.",
    titleColor: "#ffffff",
    descriptionColor: "#c9c5c8",
    bgColor: "#262255",
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

// ──────────────────────────────────────────────────────────────────────────

function HighRiskSubgroupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // defaultSettingStore: 코호트 수, 완료 상태, 고위험 서브그룹 데이터 관리
  const {
    setCompleted,
    markNeedsSync,
    hydratedTaskId,
    cohortCount,
    finalCohortCount,
    setHighRiskSubgroupData,
    highRiskSubgroupData,
  } = useDefaultSettingStore();
  const { taskId: simulationTaskId, setError } = useSimulationStore();
  // filteredRatio: Filtered Patients 카드 프로그레스바 비율
  const filteredRatio = cohortCount > 0 ? Math.round((finalCohortCount / cohortCount) * 100) : 0;

  const getParentRowId = (sel: string): string | null => {
    const trimmed = sel.trim();
    if (!trimmed) return null;
    const splitIndex = trimmed.lastIndexOf("-");
    if (splitIndex <= 0) return null;
    return trimmed.slice(0, splitIndex);
  };

  const resolveInitialSubRow = (): string => {
    const stored = highRiskSubgroupData;
    if (stored?.selectedSubRow?.trim()) return stored.selectedSubRow.trim();
    return "ckd1-slow";
  };

  const initialSelectedSubRow = resolveInitialSubRow();
  // selectedSubRow: 현재 라디오 선택된 서브 행 ID (기본값: "ckd1-slow")
  const [selectedSubRow, setSelectedSubRow] = useState<string>(initialSelectedSubRow);
  // expandedRows: 현재 펼쳐진 부모 행 ID Set
  const [expandedRows, setExpandedRows] = useState<Set<string>>(
    () => new Set([getParentRowId(initialSelectedSubRow) ?? "ckd1"])
  );
  // showSubgroupModal: "Go to Create Subgroup" 클릭 시 경고 모달 표시 여부
  const [showSubgroupModal, setShowSubgroupModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [loadedSubgroupList, setLoadedSubgroupList] = useState<DRDSubgroupItem[]>([]);
  const [subgroupLookup, setSubgroupLookup] = useState<
    Record<string, { parent: DRDSubgroupItem; child: DRDSubgroupChildItem }>
  >({});

  /**
   * 부모 행 클릭 시 아코디언 토글.
   * 이미 열려있으면 닫고, 닫혀있으면 열되 현재 선택된 서브 행의 부모는 유지합니다.
   */
  const toggleRow = (id: string) =>
    setExpandedRows((prev) => {
      const selectedParent = getParentRowId(selectedSubRow);
      if (prev.has(id)) {
        const next = new Set(prev);
        next.delete(id);
        return next;
      }
      // 닫혀있는 경우: 열기
      // 선택된 부모가 현재 열려있을 때만 유지, 닫혀있으면 그대로 유지
      const next = new Set<string>();
      if (selectedParent && prev.has(selectedParent)) next.add(selectedParent);
      next.add(id);
      return next;
    });

  /**
   * 서브 행 라디오 버튼 선택 시 호출됩니다.
   * 선택된 서브 행의 부모 행을 자동으로 펼쳐 항상 선택 항목이 보이도록 합니다.
   */
  const selectSubRow = (rowId: string) => {
    const nextParent = getParentRowId(rowId);
    setSelectedSubRow(rowId);
    if (nextParent) {
      setExpandedRows((prev) => {
        const next = new Set(prev);
        next.add(nextParent);
        return next;
      });
    }
  };

  const resolveTaskId = (): string | null => {
    const fromQuery =
      searchParams.get("task_id") ?? searchParams.get("taskId") ?? searchParams.get("test_id");
    const candidate = fromQuery?.trim() || simulationTaskId || hydratedTaskId;
    return candidate?.trim() || null;
  };

  const buildDrdPathWithContext = (pathname: string, taskIdOverride?: string): string => {
    const params = new URLSearchParams(searchParams.toString());
    const taskId = taskIdOverride ?? resolveTaskId();

    if (taskId) {
      params.delete("taskId");
      params.delete("test_id");
      params.set("task_id", taskId);
    }

    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  const normalize = (value: string): string =>
    value.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

  const toSubgroupPrefix = (parentName: string, parentId: number): string => {
    const normalized = normalize(parentName);
    const compact = normalized.replace(/\s+/g, "");

    if (
      (normalized.includes("ckd") || compact.includes("ckd")) &&
      (normalized.includes("stage 1") || compact.includes("stage1") || /\b1\b/.test(normalized))
    ) {
      return "ckd1";
    }
    if (
      (normalized.includes("ckd") || compact.includes("ckd")) &&
      (normalized.includes("stage 2") || compact.includes("stage2") || /\b2\b/.test(normalized))
    ) {
      return "ckd2";
    }
    if (normalized.includes("set 1") || compact.includes("set1")) return "set1";
    if (normalized.includes("set 4") || compact.includes("set4")) return "set4";
    return `group-${parentId}`;
  };

  const toSubgroupSuffix = (classification: string, fallbackIndex: number = 0): string => {
    const normalized = normalize(classification);
    const compact = normalized.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (compact) return compact;
    return `option-${fallbackIndex + 1}`;
  };

  const toSubgroupKey = (
    parentName: string,
    classification: string,
    parentId: number,
    fallbackIndex: number = 0
  ): string => {
    const prefix = toSubgroupPrefix(parentName, parentId);
    return `${prefix}-${toSubgroupSuffix(classification, fallbackIndex)}`;
  };

  const toHighRiskStoreData = (
    selectedKey: string,
    parent: DRDSubgroupItem,
    child: DRDSubgroupChildItem
  ) => {
    const cutoffConditions = child.cutoff_snapshot_json?.conditions ?? [];
    const [main, slope] = cutoffConditions;
    const condition =
      main !== undefined
        ? `${String(main.condition ?? "").trim()} ${String(main.value ?? "").trim()}`.trim()
        : String(child.cut_off_display || child.cut_off || parent.cut_off?.join(", ") || "").trim();

    return {
      selectedSubRow: selectedKey,
      parentName: parent.set_name,
      subRowName: child.classification || child.set_name || "",
      feature: child.outcome || parent.outcome || "",
      condition,
      month: String(child.month ?? parent.month ?? ""),
      slope: slope ? String(slope.value ?? "") : "",
      status:
        child.group_balance ||
        parent.group_balance ||
        (typeof parent.of_group === "number" ? `n=${parent.of_group.toLocaleString()}` : ""),
    };
  };

  useEffect(() => {
    const taskId = resolveTaskId();
    if (!taskId) return;

    let cancelled = false;
    setLoadedSubgroupList([]);
    setSubgroupLookup({});

    const loadSubgroups = async () => {
      setIsFetching(true);
      try {
        const response = await getDrdSubgroupsList({ task_id: taskId });
        if (cancelled) return;
        setLoadedSubgroupList(response.data);

        const lookup: Record<string, { parent: DRDSubgroupItem; child: DRDSubgroupChildItem }> = {};
        response.data.forEach((parent) => {
          parent.children.forEach((child, childIndex) => {
            const key = toSubgroupKey(
              parent.set_name,
              child.classification || child.set_name || "",
              parent.id,
              childIndex
            );
            if (!lookup[key]) {
              lookup[key] = { parent, child };
            }
          });
        });
        setSubgroupLookup(lookup);

        const hydration = mapDrdInfoApisToDefaultSettingHydration({
          taskId,
          patientInfo: null,
          groupManageFilterInfo: null,
          subgroups: response.data,
          medicalHistoryInfo: null,
        });

        const next = hydration.highRiskSubgroupData;
        if (next) {
          setHighRiskSubgroupData(next);
          setSelectedSubRow(next.selectedSubRow);
          const parentRowId = getParentRowId(next.selectedSubRow);
          if (parentRowId) {
            setExpandedRows(new Set([parentRowId]));
          }
        } else {
          const firstPair = response.data
            .flatMap((parent) =>
              parent.children.map((child, childIndex) => ({
                key: toSubgroupKey(
                  parent.set_name,
                  child.classification || child.set_name || "",
                  parent.id,
                  childIndex
                ),
              }))
            )
            .at(0);
          if (firstPair?.key) {
            setSelectedSubRow(firstPair.key);
            const parentRowId = getParentRowId(firstPair.key);
            if (parentRowId) {
              setExpandedRows(new Set([parentRowId]));
            }
          }
        }

        setCompleted(
          "high-risk-subgroup",
          Boolean(hydration.completedItems?.["high-risk-subgroup"])
        );
      } catch (error) {
        if (cancelled) return;
        setError(
          error instanceof Error ? error.message : "High-Risk Subgroup 조회에 실패했습니다."
        );
      } finally {
        if (!cancelled) {
          setIsFetching(false);
        }
      }
    };

    loadSubgroups();

    return () => {
      cancelled = true;
    };
  }, [
    searchParams,
    simulationTaskId,
    hydratedTaskId,
    setCompleted,
    setError,
    setHighRiskSubgroupData,
  ]);

  const handleConfirm = async (): Promise<void> => {
    if (isSaving) return;

    const taskId = resolveTaskId();
    if (!taskId) {
      setError("task_id를 확인할 수 없어 High-Risk Subgroup 저장을 진행할 수 없습니다.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      if (Object.keys(subgroupLookup).length === 0) {
        throw new Error("서브그룹 목록이 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.");
      }

      const matched = subgroupLookup[selectedSubRow];
      if (!matched) {
        throw new Error(`선택된 서브그룹 키(${selectedSubRow})와 API 응답 매핑에 실패했습니다.`);
      }

      const subgroupId = matched.child.id ?? matched.parent.id;
      if (typeof subgroupId !== "number") {
        throw new Error("subgroup_id를 확인할 수 없습니다.");
      }

      const monthValue =
        typeof matched.child.month === "number"
          ? matched.child.month
          : Number(matched.parent.month || 0);

      const payload = {
        task_id: taskId,
        subgroup_id: subgroupId,
        set_name: matched.child.set_name || matched.parent.set_name,
        outcome: matched.child.outcome || matched.parent.outcome,
        cutoff_axis_type: resolveCutoffAxisType(matched.child),
        cutoff_raw_version: 1,
        cutoff_raw_json: resolveCutoffRawJson(matched.child, matched.parent),
        month: Number.isFinite(monthValue) ? monthValue : 0,
      };

      await saveDrdSubgroups(payload);

      const nextPath = buildDrdPathWithContext("/drd/default-setting", taskId);
      try {
        setHighRiskSubgroupData(toHighRiskStoreData(selectedSubRow, matched.parent, matched.child));
        setCompleted("high-risk-subgroup", true);
        markNeedsSync();
      } finally {
        router.push(nextPath);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "High-Risk Subgroup 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (value: string | undefined): string => {
    if (!value) return "";
    const normalized = value.replace("T", " ").replace("Z", "");
    const noMs = normalized.replace(/\.\d+$/, "");
    return noMs.trim();
  };

  const formatStatus = (groupBalance: string | undefined, ofGroup?: number): string => {
    if (groupBalance && groupBalance.trim()) return groupBalance.trim();
    if (typeof ofGroup === "number") return `n=${ofGroup.toLocaleString()}`;
    return "";
  };

  const normalizeCutoffExpression = (value: string): string =>
    value.trim().toLowerCase().replace(/\s+/g, "");

  const resolveCutoffAxisType = (child: DRDSubgroupChildItem): "x_value" | "y_percent" => {
    const explicitAxisType = child.cutoff_axis_type.trim().toLowerCase();
    if (explicitAxisType === "x_value") return "x_value";
    if (explicitAxisType === "y_percent") return "y_percent";
    throw new Error(`지원하지 않는 cutoff_axis_type 입니다: ${child.cutoff_axis_type}`);
  };

  const resolveCutoffRawJson = (child: DRDSubgroupChildItem, parent: DRDSubgroupItem): string[] => {
    const rawEntries = child.cut_off?.trim() ? [child.cut_off] : (parent.cut_off ?? []);
    return rawEntries.map((entry) => normalizeCutoffExpression(String(entry))).filter(Boolean);
  };

  const getConditionAndSlope = (
    child: DRDSubgroupChildItem,
    parent: DRDSubgroupItem
  ): { condition: string; slope: string } => {
    const cutoffConditions = child.cutoff_snapshot_json?.conditions ?? [];
    const [main, slope] = cutoffConditions;
    if (main) {
      return {
        condition:
          `${String(main.condition ?? "").trim()} ${String(main.value ?? "").trim()}`.trim(),
        slope: slope ? String(slope.value ?? "").trim() : "",
      };
    }

    return {
      condition: String(
        child.cut_off_display || child.cut_off || parent.cut_off?.join(", ") || ""
      ).trim(),
      slope: "",
    };
  };

  const subgroupRows = loadedSubgroupList.map((parent) => {
    const parentRowId = toSubgroupPrefix(parent.set_name, parent.id);
    const childRows = parent.children.map((child, childIndex) => {
      const childKey = toSubgroupKey(
        parent.set_name,
        child.classification || child.set_name || "",
        parent.id,
        childIndex
      );
      const { condition, slope } = getConditionAndSlope(child, parent);

      return {
        key: childKey,
        label: child.classification || (childKey.endsWith("-rapid") ? "Rapid" : "Slow"),
        feature: child.outcome || parent.outcome || "",
        condition,
        month: String(child.month ?? parent.month ?? ""),
        slope,
        status: formatStatus(child.group_balance, undefined),
        date: formatDate(child.updated_at),
      };
    });

    const parentCondition =
      parent.cut_off?.filter((value) => Boolean(String(value).trim())).join(", ") ||
      childRows[0]?.condition ||
      "";

    return {
      parentRowId,
      setName: parent.set_name,
      feature: parent.outcome || childRows[0]?.feature || "",
      condition: parentCondition,
      month: String(parent.month ?? childRows[0]?.month ?? ""),
      slope: childRows[0]?.slope || "",
      status: formatStatus(parent.group_balance, parent.of_group),
      date: formatDate(parent.updated_at),
      childRows,
    };
  });

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
        {/* ── ② 컨텐츠 행 ──────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            flex: 1,
            gap: "0px",
            minHeight: 0,
            alignItems: "stretch",
            overflow: "hidden",
          }}
        >
          {/* {왼쪽 패널/Left Panel} */}
          {/* ── 왼쪽 패널 (Navy Glass - 9-slice) ────────────────── */}
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
            {/* Filtered Patients 카드 */}
            <div className="relative flex h-[250px] shrink-0 flex-col overflow-hidden rounded-[24px] p-[16px] shadow-[0px_0px_2px_0px_rgba(0,0,0,0.1)]">
              <div
                className="pointer-events-none absolute inset-0 z-0"
                style={{ backgroundImage: "linear-gradient(90deg, #262255 0%, #262255 100%)" }}
              />
              <div className="absolute inset-0 z-[1] bg-[rgba(38,38,38,0.25)] mix-blend-color-dodge" />

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
            {/* Setup Steps */}
            <div className="flex flex-1 flex-col gap-[8px] overflow-y-auto rounded-[24px] bg-[rgba(255,255,255,0.6)] p-[10px]">
              {setupSteps.map((step) => (
                <button
                  key={step.id}
                  onClick={() => router.push(buildDrdPathWithContext(stepRoutes[step.id]))}
                  className={[
                    "flex w-full shrink-0 cursor-pointer flex-col rounded-[24px] border-none p-[16px] pt-[12px] pb-[16px] text-left transition-colors duration-150",
                    step.bgColor === "#262255"
                      ? "hover:bg-[#2e2a66] active:bg-[#1e1a44]"
                      : "hover:bg-[#f9f8fc] active:bg-[#efeff4]",
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
              paddingBottom: "0px",
              marginLeft: "-6px",
            }}
          >
            {/* 상단: 제목 + Go to Create Subgroup 버튼 */}
            <div
              className="flex h-[40px] shrink-0 items-center justify-between pr-[4px] pl-[4px]"
              style={{ paddingTop: 0, paddingBottom: 0, paddingRight: 0 }}
            >
              <h2 className="m-0 font-['Inter'] text-[24px] leading-[1.2] font-semibold tracking-[-0.72px] text-[#484646]">
                Load Subgroup
              </h2>
              <button
                onClick={() => setShowSubgroupModal(true)}
                className="relative flex h-[42px] cursor-pointer items-center justify-center gap-[8px] overflow-hidden rounded-[100px] border-none bg-transparent px-[24px]"
              >
                <div className="absolute inset-0 rounded-[36px] bg-[#f06600]" />
                <span className="relative z-10 font-['Inter'] text-[17px] leading-[1.05] font-semibold tracking-[-0.51px] whitespace-nowrap text-white">
                  Go to Create Subgroup
                </span>
              </button>
            </div>

            {/* {테이블 영역/Table Area} */}
            {/* 테이블 영역 */}
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              <div className="flex h-full flex-col overflow-hidden rounded-[24px] bg-white">
                {/* {테이블 헤더/Table Header} */}
                {/* 테이블 헤더 */}
                <div
                  className="flex shrink-0 items-center border-b border-[#e2e1e5]"
                  style={{ padding: "12px 0" }}
                >
                  <div className="w-[7.63%] shrink-0" />
                  <div className="flex h-full w-[17.94%] shrink-0 items-center border-l border-[#e2e1e5] px-[10px]">
                    <span className="font-['Inter'] text-[12px] leading-[1.1] font-semibold tracking-[-0.36px] text-[#919092]">
                      Set Name
                    </span>
                  </div>
                  <div className="flex h-full w-[20.04%] shrink-0 items-center border-l border-[#e2e1e5] px-[10px]">
                    <span className="font-['Inter'] text-[12px] leading-[1.1] font-semibold tracking-[-0.36px] text-[#919092]">
                      Feature
                    </span>
                  </div>
                  <div className="flex h-full w-[14.31%] shrink-0 items-center border-l border-[#e2e1e5] px-[10px]">
                    <span className="font-['Inter'] text-[12px] leading-[1.1] font-semibold tracking-[-0.36px] text-[#919092]">
                      Condition
                    </span>
                  </div>
                  <div className="flex h-full w-[11.45%] shrink-0 items-center border-l border-[#e2e1e5] px-[10px]">
                    <span className="font-['Inter'] text-[12px] leading-[1.1] font-semibold tracking-[-0.36px] text-[#919092]">
                      Month
                    </span>
                  </div>
                  <div className="flex h-full w-[11.45%] shrink-0 items-center border-l border-[#e2e1e5] px-[10px]">
                    <span className="font-['Inter'] text-[12px] leading-[1.1] font-semibold tracking-[-0.36px] text-[#919092]">
                      Slope
                    </span>
                  </div>
                  <div className="flex h-full w-[17.18%] shrink-0 items-center border-l border-[#e2e1e5] px-[10px]">
                    <span className="font-['Inter'] text-[12px] leading-[1.1] font-semibold tracking-[-0.36px] text-[#919092]">
                      Status
                    </span>
                  </div>
                  <div className="flex h-full flex-1 items-center border-l border-[#e2e1e5] px-[10px]">
                    <span className="font-['Inter'] text-[12px] leading-[1.1] font-semibold tracking-[-0.36px] text-[#919092]">
                      Date
                    </span>
                  </div>
                </div>

                {/* {테이블 바디/Table Body} */}
                {/* 테이블 바디 */}
                <div className="scrollbar-hide flex flex-1 flex-col overflow-y-auto">
                  {subgroupRows.map((row) => {
                    const hasSelectedChild = row.childRows.some(
                      (childRow) => childRow.key === selectedSubRow
                    );
                    const isOpen = expandedRows.has(row.parentRowId);

                    return (
                      <div
                        key={row.parentRowId}
                        className={`flex shrink-0 flex-col ${hasSelectedChild || isOpen ? "border-solid" : "border-b border-solid border-[#919092]"}`}
                        style={{
                          background: hasSelectedChild
                            ? "rgba(243,238,255,0.6)"
                            : isOpen
                              ? "#fbfbfc"
                              : "white",
                          ...(hasSelectedChild
                            ? {
                                borderTop: "1px solid rgba(58,17,216,0.6)",
                                borderBottom: "1px solid rgba(58,17,216,0.6)",
                              }
                            : isOpen
                              ? {
                                  borderTop: "1px solid #919092",
                                  borderBottom: "1px solid #ADADAD",
                                }
                              : {}),
                        }}
                      >
                        <div
                          className={`flex cursor-pointer items-stretch overflow-clip py-[6px]${hasSelectedChild ? "[&_span]:text-[#313030]" : ""}`}
                          onClick={() => toggleRow(row.parentRowId)}
                        >
                          <div className="flex w-[7.63%] shrink-0 items-center justify-center pr-[8px] pl-[12px]">
                            <div className="flex h-[20px] w-[20px] items-center justify-center">
                              <AccordionItem open={isOpen} />
                            </div>
                          </div>
                          <div className="flex w-[17.94%] shrink-0 items-center border-l border-[#e2e1e5] px-[10px]">
                            <span className="min-w-0 flex-1 font-['Inter'] text-[15px] leading-[1.15] font-semibold tracking-[-0.75px] text-[#5f5e5e]">
                              {row.setName}
                            </span>
                          </div>
                          <div className="flex w-[20.04%] shrink-0 items-center border-l border-[#e2e1e5] px-[10px]">
                            <span className="font-['Inter'] text-[15px] leading-[1.15] font-semibold tracking-[-0.75px] text-[#5f5e5e]">
                              {row.feature}
                            </span>
                          </div>
                          <div className="flex w-[14.31%] shrink-0 items-center border-l border-[#e2e1e5] px-[10px]">
                            <span className="font-['Inter'] text-[15px] leading-[1.15] font-semibold tracking-[-0.75px] text-[#5f5e5e]">
                              {row.condition}
                            </span>
                          </div>
                          <div className="flex w-[11.45%] shrink-0 items-center border-l border-[#e2e1e5] px-[10px]">
                            <span className="font-['Inter'] text-[15px] leading-[1.15] font-semibold tracking-[-0.75px] text-[#5f5e5e]">
                              {row.month}
                            </span>
                          </div>
                          <div className="flex w-[11.45%] shrink-0 items-center border-l border-[#e2e1e5] px-[10px]">
                            <span className="font-['Inter'] text-[15px] leading-[1.15] font-semibold tracking-[-0.75px] text-[#5f5e5e]">
                              {row.slope}
                            </span>
                          </div>
                          <div className="flex w-[17.18%] shrink-0 items-center border-l border-[#e2e1e5] px-[10px]">
                            <span className="font-['Inter'] text-[15px] leading-[1.15] font-semibold tracking-[-0.75px] text-[#5f5e5e]">
                              {row.status}
                            </span>
                          </div>
                          <div className="flex flex-1 items-center border-l border-[#e2e1e5] px-[10px]">
                            <span className="font-['Inter'] text-[15px] leading-[1.15] font-semibold tracking-[-0.75px] text-[#5f5e5e]">
                              {row.date}
                            </span>
                          </div>
                        </div>

                        {isOpen &&
                          row.childRows.map((childRow, childIndex) => {
                            const isSelected = selectedSubRow === childRow.key;
                            return (
                              <div
                                key={`${childRow.key}_${childIndex}`}
                                className={`flex cursor-pointer items-center overflow-clip border-solid py-[16px] ${isSelected ? "[&_span]:text-[#313030] [&>div]:border-[#e2e1e5]" : "[&>div]:border-[#e2e1e5]"}`}
                                style={{
                                  borderTop:
                                    childIndex === 0
                                      ? `1.5px solid ${hasSelectedChild ? "#3a11d8" : "#ADADAD"}`
                                      : "1.5px solid #D8D7D9",
                                  background: "transparent",
                                  opacity: 1,
                                }}
                                onClick={() => selectSubRow(childRow.key)}
                              >
                                <div className="flex w-[7.63%] shrink-0 items-center justify-center pr-[8px] pl-[12px]">
                                  <RadioButton
                                    name="high-risk-subgroup-selection"
                                    checked={isSelected}
                                    onChange={() => selectSubRow(childRow.key)}
                                    size={16}
                                  />
                                </div>
                                <div className="flex w-[17.94%] shrink-0 items-center border-l px-[10px]">
                                  <span className="min-w-0 flex-1 font-['Inter'] text-[15px] leading-[1.15] font-semibold tracking-[-0.75px] text-[#5f5e5e]">
                                    {childRow.label}
                                  </span>
                                </div>
                                <div className="flex w-[20.04%] shrink-0 items-center border-l px-[10px]">
                                  <span className="font-['Inter'] text-[15px] leading-[1.15] font-semibold tracking-[-0.75px] text-[#5f5e5e]">
                                    {childRow.feature}
                                  </span>
                                </div>
                                <div className="flex w-[14.31%] shrink-0 items-center border-l px-[10px]">
                                  <span className="font-['Inter'] text-[15px] leading-[1.15] font-semibold tracking-[-0.75px] text-[#5f5e5e]">
                                    {childRow.condition}
                                  </span>
                                </div>
                                <div className="flex w-[11.45%] shrink-0 items-center border-l px-[10px]">
                                  <span className="font-['Inter'] text-[15px] leading-[1.15] font-semibold tracking-[-0.75px] text-[#5f5e5e]">
                                    {childRow.month}
                                  </span>
                                </div>
                                <div className="flex w-[11.45%] shrink-0 items-center border-l px-[10px]">
                                  <span className="font-['Inter'] text-[15px] leading-[1.15] font-semibold tracking-[-0.75px] text-[#5f5e5e]">
                                    {childRow.slope}
                                  </span>
                                </div>
                                <div className="flex w-[17.18%] shrink-0 items-center border-l px-[10px]">
                                  <span className="font-['Inter'] text-[15px] leading-[1.15] font-semibold tracking-[-0.75px] text-[#5f5e5e]">
                                    {childRow.status}
                                  </span>
                                </div>
                                <div className="flex flex-1 items-center border-l px-[10px]">
                                  <span className="font-['Inter'] text-[15px] leading-[1.15] font-semibold tracking-[-0.75px] text-[#5f5e5e]">
                                    {childRow.date}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* {하단 버튼/Bottom Buttons} */}
            {/* 하단 버튼 */}
            <div className="m-0 flex shrink-0 justify-end gap-[12px] p-0">
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
      {showSubgroupModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowSubgroupModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: 380,
              borderRadius: 20,
              padding: "20px 20px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 36,
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}
          >
            {/* 글래스 배경 */}
            <div
              aria-hidden="true"
              style={{ position: "absolute", inset: 0, borderRadius: 24, pointerEvents: "none" }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 24,
                  background: "rgba(255,255,255,0.6)",
                  mixBlendMode: "color-dodge",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 24,
                  background: "rgba(255,255,255,0.88)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 24,
                  background: "rgba(0,0,0,0.04)",
                  mixBlendMode: "hard-light",
                }}
              />
            </div>

            {/* 콘텐츠 */}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 24,
              }}
            >
              <p
                style={{
                  fontFamily: "Inter",
                  fontWeight: 600,
                  fontSize: 19,
                  color: "#250d0dff",
                  letterSpacing: "-0.54px",
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                Go to Create Subgroup
              </p>
              <p
                style={{
                  fontFamily: "Inter",
                  fontWeight: 500,
                  fontSize: 15,
                  color: "#484646",
                  letterSpacing: "-0.42px",
                  lineHeight: 1.35,
                  margin: 0,
                }}
              >
                If you create a new subgroup, you will leave this page and all unsaved data will be
                lost. Do you want to continue?
              </p>
            </div>

            {/* 버튼 */}
            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                gap: 8,
                justifyContent: "center",
              }}
            >
              <button
                type="button"
                onClick={() => setShowSubgroupModal(false)}
                style={{
                  width: 112,
                  height: 44,
                  borderRadius: 36,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "Inter",
                  fontWeight: 600,
                  fontSize: 15,
                  color: "#262255",
                  letterSpacing: "-0.45px",
                  background: "rgba(255,255,255,0.92)",
                  boxShadow: "0px 2px 8px 0px rgba(0,0,0,0.10), 0px 0px 0px 0.5px rgba(0,0,0,0.06)",
                  backdropFilter: "blur(8px)",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSubgroupModal(false);
                  router.push("/tsi");
                }}
                style={{
                  width: 112,
                  height: 44,
                  borderRadius: 36,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "Inter",
                  fontWeight: 600,
                  fontSize: 15,
                  color: "#262255",
                  letterSpacing: "-0.45px",
                  background: "rgba(255,255,255,0.92)",
                  boxShadow: "0px 2px 8px 0px rgba(0,0,0,0.10), 0px 0px 0px 0.5px rgba(0,0,0,0.06)",
                  backdropFilter: "blur(8px)",
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default function HighRiskSubgroupPage() {
  return (
    <Suspense fallback={null}>
      <HighRiskSubgroupPageContent />
    </Suspense>
  );
}
