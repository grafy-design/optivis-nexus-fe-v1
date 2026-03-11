/**
 * Filter Page — Default Settings Step 1: Filter
 *
 * 역할:
 *   환자 코호트를 직접 피처(feature) 기반으로 필터링하는 설정 페이지입니다.
 *   Inclusion / Exclusion 두 탭으로 나뉘며, 각 탭에 여러 Section을 추가하고
 *   Section 마다 Feature·연산자(op)·값(value)을 조합한 조건을 정의합니다.
 *   섹션 내 서브 로우(SubRow)는 And / Or 논리 연산자로 메인 조건과 결합됩니다.
 *
 * 레이아웃:
 *   ┌─────────────────────┬──────────────────────────────────────────────────┐
 *   │ 왼쪽: Navy Glass     │ 오른쪽: Feature List | 메인 설정 + 수식 미리보기   │
 *   │ - Filtered % 카드   │                                                  │
 *   │ - 4-Step 사이드바   │                                                  │
 *   └─────────────────────┴──────────────────────────────────────────────────┘
 *
 * 주요 상태:
 *   - inclusionSections / exclusionSections: 각 탭의 섹션 목록
 *   - activeTab: 현재 선택된 탭 ("Inclusion" | "Exclusion")
 *   - checkedRows: 각 행의 체크박스 선택 여부 (삭제 대상 파악용)
 *   - searchQuery / searchDropdownOpen: Feature List 검색 UI
 *
 * 저장:
 *   Confirm 버튼 클릭 시 filterData를 defaultSettingStore에 저장하고
 *   filter 완료 상태를 true로 설정한 뒤 /drd/default-setting으로 이동합니다.
 */
"use client";

import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useDefaultSettingStore } from "@/store/defaultSettingStore";
import { useSimulationStore } from "@/store/simulationStore";
import { useProcessedStudyData } from "@/hooks/useProcessedStudyData";
import { RightPanel } from "@/components/drd/RightPanel";
import CustomCheckbox from "@/components/ui/custom-checkbox";
import { DrdLeftPanel } from "@/components/drd/DrdLeftPanel";
import { makeDefaultSettingSteps } from "@/components/drd/drd-step-data";
import { GlassButton, GlassTestButton } from "@/components/ui/glass-button";


/** 행 추가 버튼(+)에 사용되는 플러스 아이콘 SVG */
function IconPlus({ size = 16, color = "var(--neutral-80)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 3V13M3 8L13 8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}


/** 파일 다운로드 아이콘 (현재 비활성화 UI에 표시) */
function IconFileDownload({ size = 24, color = "var(--neutral-80)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 4V16M12 16L8 12M12 16L16 12M4 20H20" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 폴더+플러스 아이콘 (저장/불러오기 버튼용) */
function IconFolderPlus({ size = 24, color = "var(--text-header)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 7V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V9C21 7.9 20.1 7 19 7H11L9 5H5C3.9 5 3 5.9 3 7Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 11V17M15 14H9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 휴지통 아이콘 — 체크된 행 삭제 버튼에 사용 */
function IconTrash({ size = 24, color = "var(--neutral-80)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 6H20M10 11V17M14 11V17M5 6L6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19L19 6M9 6V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** INFO 카테고리에 속하는 피처(변수) 목록 — Feature List 아코디언에 표시됩니다 */
const infoFeatures = [
  "GENDER", "AGE", "ALC", "RACE", "DRUG", "HEIGHT", "WEIGHT", "EDU", "CAORBD", "TOB"
];

/**
 * 섹션 내 추가 조건 행 (And / Or 논리 연산자로 메인 조건과 결합)
 * - logic: "And" | "Or"
 * - feature: 비교할 피처명
 * - op: 비교 연산자 (>, >=, <, <=, =, !=)
 * - value: 비교 기준값
 */
type SubRow = { logic: string; feature: string; op: string; value: string };

/**
 * 필터 섹션 한 항목.
 * 메인 조건(feature + op + value)과 0개 이상의 SubRow를 포함합니다.
 */
type Section = {
  id: number;
  name: string;
  feature: string;
  op: string;
  value: string;
  subRows?: SubRow[];
};

/** 드롭다운에서 선택 가능한 피처 옵션 목록 */
const featureOptions = ["AGE", "WEIGHT [kg]", "MMTOTSCORE", "CDRTOT", "CITY", "GENDER", "ALC", "RACE", "DRUG", "HEIGHT", "EDU"];
/** 비교 연산자 목록 */
const opOptions = [">", ">=", "<", "<=", "=", "!="];
/** 서브 로우 논리 연산자 목록 */
const logicOptions = ["And", "Or"];

/** 새 섹션 초기 객체 생성 — 모든 필드가 빈 문자열인 기본 섹션 */
function makeEmptySection(id: number): Section {
  return { id, name: `Section ${id}`, feature: "", op: "", value: "" };
}


/**
 * 드롭다운 셀 컴포넌트 — 섹션 행의 Feature·Op·Logic 선택에 사용됩니다.
 * createPortal을 사용해 메뉴를 document.body에 렌더링하여
 * 부모의 overflow:hidden 제약을 우회합니다.
 * (Figma DropdownItem — node 179:24118)
 */
function DropdownCell({
  value,
  width,
  flex,
  placeholder,
  options,
  onChange,
}: {
  value: string;
  width?: number | string;
  flex?: number | string;
  placeholder?: boolean;
  options?: string[];
  onChange?: (v: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [menuPos, setMenuPos] = React.useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!wrapperRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = () => {
    if (!triggerRef.current) { setOpen(prev => !prev); return; }
    const rect = triggerRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
    setOpen(prev => !prev);
  };

  return (
    <div ref={wrapperRef} className="relative min-w-0" style={{ width, flex, flexShrink: flex ? 1 : 0 }}>
      {/* 트리거 */}
      <div
        ref={triggerRef}
        onClick={handleOpen}
        className="rounded-[4px] gap-1 w-full flex items-center cursor-pointer select-none"
        style={{
          height: 36,
          background: "var(--neutral-95)",
          paddingLeft: 12,
          paddingRight: 8,
        }}
      >
        <span
          className="flex-1 overflow-hidden text-body4m"
          style={{
            color: placeholder ? "var(--text-disabled)" : "var(--text-primary)",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {value}
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={open ? "/icons/disclosure/open-18.svg" : "/icons/disclosure/close-18.svg"}
          alt=""
          width={18}
          height={18}
          className="shrink-0 block"
        />
      </div>

      {/* 드롭다운 메뉴 — Portal로 document.body에 마운트해서 overflow:hidden 완전 우회 */}
      {open && options && options.length > 0 && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          className="fixed flex flex-col overflow-y-auto"
          style={{
            top: menuPos.top,
            left: menuPos.left,
            width: menuPos.width,
            background: "var(--neutral-95)",
            border: "1px solid var(--neutral-80)",
            padding: 8,
            zIndex: 9999,
            maxHeight: 220,
            boxShadow: "0px 4px 16px rgba(0,0,0,0.10)",
          }}
        >
          {options.map((opt, idx) => (
            <React.Fragment key={opt}>
              {idx > 0 && (
                <div className="shrink-0" style={{ height: 1, background: "var(--neutral-80)" }} />
              )}
              <button
                onMouseDown={() => { onChange?.(opt); setOpen(false); }}
                className="rounded-[4px] flex items-center cursor-pointer border-none w-full shrink-0 text-body4m"
                style={{
                  height: 36,
                  paddingLeft: 4,
                  paddingRight: 4,
                  paddingTop: 2,
                  paddingBottom: 2,
                  color: "var(--text-secondary)",
                  background: "transparent",
                  textAlign: "left",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.05)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                {opt}
              </button>
            </React.Fragment>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}


// ── 아이콘 SVG 컴포넌트 ──────────────────────────────────────────────────

/** Feature List 검색 입력창 왼쪽에 표시되는 돋보기 아이콘 */
function IconSearch({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="6" stroke="var(--neutral-80)" strokeWidth="1.5" />
      <line x1="13.5" y1="13.5" x2="17" y2="17" stroke="var(--neutral-80)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** 섹션 헤더·카테고리 열림 상태 아이콘 (아래 방향 화살표) */
function IconChevronDown({ size = 16, color = "var(--neutral-30)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 10" fill="none">
      <path d="M1 1L8 8L15 1" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 섹션 헤더·카테고리 닫힘 상태 아이콘 (오른쪽 방향 화살표) */
function IconChevronRight({ size = 16, color = "var(--neutral-30)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 16" fill="none">
      <path d="M1 1L8 8L1 15" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


// ── 데이터 설정 ───────────────────────────────────────────────────────────

/**
 * Feature List 아코디언에 표시되는 카테고리 목록.
 * active: true 인 항목(INFO)이 초기 강조 표시됩니다.
 */
const featureCategories = [
  { name: "COHORT", open: false },
  { name: "INFO", open: false, active: true },
  { name: "ADAS", open: false },
  { name: "CDR", open: false },
  { name: "CLIN", open: false },
  { name: "DRUG", open: false },
  { name: "LAB", open: false },
  { name: "MMSE", open: false },
];

// ──────────────────────────────────────────────────────────────────────────

export default function FilterPage() {
  const router = useRouter();
  // defaultSettingStore: 코호트 수, 필터 데이터, 완료 상태 관리
  const { setCompleted, cohortCount, finalCohortCount, filterData, setFilterData } = useDefaultSettingStore();
  // filteredRatio: finalCohortCount / cohortCount 백분율 (왼쪽 카드 프로그레스바)
  const filteredRatio = cohortCount > 0 ? Math.round((finalCohortCount / cohortCount) * 100) : 0;
  // checkedRows: 각 행(main/sub)의 체크박스 상태 — key: "{sectionId}-main" | "{sectionId}-sub-{idx}"
  const [checkedRows, setCheckedRows] = useState<Record<string, boolean>>({});

  // simulationStore: 우측 패널(RightPanel) 시뮬레이션 결과 데이터 참조
  const {
    activeTab: simActiveTab,
    isApplied,
    sampleSizeControl,
    nominalPower,
    apiData,
    setActiveTab: setSimActiveTab,
  } = useSimulationStore();

  // API 결과 데이터 분리 — OPTIVIS(최적화) / Traditional(전통적) 두 종류
  const optivisData = apiData?.OPTIVIS || [];
  const traditionalData = apiData?.Traditional || [];

  // useProcessedStudyData: 원시 API 데이터를 차트용으로 가공 (필터링 + 차트 포인트 생성)
  const { filteredData, chartData } = useProcessedStudyData(
    optivisData,
    traditionalData,
    nominalPower
  );

  /**
   * sampleSizeControl(목표 power)에 가장 가까운 OPTIVIS / Traditional 데이터 포인트를 찾아 반환합니다.
   * 오른쪽 패널의 강조(highlight) 포인트로 사용됩니다.
   */
  const findHighlightedData = useMemo(() => {
    if (!apiData || optivisData.length === 0) {
      return null;
    }

    const optivisToSearch =
      filteredData.optivis.length > 0 ? filteredData.optivis : optivisData;

    if (optivisToSearch.length === 0) return null;

    const targetPower = sampleSizeControl;

    let optivisIndex = 0;
    let minPowerDiff = Math.abs(
      optivisToSearch[0].primary_endpoint_power - targetPower
    );

    for (let i = 1; i < optivisToSearch.length; i++) {
      const powerDiff = Math.abs(
        optivisToSearch[i].primary_endpoint_power - targetPower
      );
      if (powerDiff < minPowerDiff) {
        minPowerDiff = powerDiff;
        optivisIndex = i;
      }
    }

    const optivisPoint = optivisToSearch[optivisIndex];
    if (!optivisPoint) return null;

    const traditionalToSearch =
      filteredData.traditional.length > 0
        ? filteredData.traditional
        : traditionalData;

    if (traditionalToSearch.length === 0) {
      return {
        optivis: optivisPoint,
        traditional: null,
      };
    }

    let traditionalIndex = 0;
    let minTraditionalPowerDiff = Math.abs(
      traditionalToSearch[0].primary_endpoint_power - targetPower
    );

    for (let i = 1; i < traditionalToSearch.length; i++) {
      const powerDiff = Math.abs(
        traditionalToSearch[i].primary_endpoint_power - targetPower
      );
      if (powerDiff < minTraditionalPowerDiff) {
        minTraditionalPowerDiff = powerDiff;
        traditionalIndex = i;
      }
    }

    const traditionalPoint = traditionalToSearch[traditionalIndex];

    return {
      optivis: optivisPoint,
      traditional: traditionalPoint,
    };
  }, [apiData, sampleSizeControl, filteredData, optivisData, traditionalData]);

  /**
   * findHighlightedData를 기반으로 오른쪽 패널에 표시할 지표(metrics)와
   * 차트 데이터를 계산합니다.
   * - traditional이 없으면 비교 수치("-")로 채워 단독 표시합니다.
   * - traditional이 있으면 OPTIVIS vs Traditional 감소율(%)을 계산합니다.
   */
  const dynamicSimulationData = useMemo(() => {
    if (!findHighlightedData) {
      return null;
    }

    const { optivis, traditional } = findHighlightedData;

    if (!traditional) {
      return {
        topMetrics: {
          nToScreen: optivis.n_to_screen.toLocaleString(),
          sampleSize: optivis.total_patient.toLocaleString(),
          enrollment: optivis.enrollment.toFixed(2),
          primaryEndpointPower: (optivis.primary_endpoint_power * 100).toFixed(
            1
          ),
          secondaryEndpointPower: optivis.secondary_endpoint_power
            ? (optivis.secondary_endpoint_power * 100).toFixed(1)
            : "0.0",
          estimatedCostReduction: "-",
          gaugeValue: optivis.primary_endpoint_power,
          gaugeText: `${(optivis.primary_endpoint_power * 100).toFixed(1)}%`,
        },
        smallerSample: {
          percentage: "-",
          chartData: {
            optivis: chartData.chart1Data.optivis,
            traditional: chartData.chart1Data.traditional,
          },
        },
        smallerNToScreen: {
          percentage: "-",
          subtitle: "Enrollment Time vs Power",
          chartData: {
            optivis: chartData.chart2Data.optivis,
            traditional: chartData.chart2Data.traditional,
          },
        },
        lowerCost: {
          percentage: "-",
          subtitle: "Sample Size vs Cost",
          chartData: {
            optivis: chartData.chart3Data.optivis,
            traditional: chartData.chart3Data.traditional,
          },
        },
        comparisonTable: {
          enrollment: {
            optivis: optivis.enrollment.toFixed(2),
            traditional: "-",
          },
          primaryEndpointPower: {
            optivis: `${(optivis.primary_endpoint_power * 100).toFixed(1)}%`,
            traditional: "-",
          },
          secondaryEndpointPower: {
            optivis: optivis.secondary_endpoint_power
              ? `${(optivis.secondary_endpoint_power * 100).toFixed(1)}%`
              : "0.0%",
            traditional: "-",
          },
          sampleSize: {
            optivis: {
              treatmentGroup1: optivis.treatment_group_1?.toString() || null,
              treatmentGroup2: optivis.treatment_group_2?.toString() || null,
              treatmentGroup3: optivis.treatment_group_3?.toString() || null,
              controlGroup: optivis.control_group?.toString() || "0",
              total: optivis.total_patient.toString(),
            },
            traditional: {
              treatmentGroup1: null,
              treatmentGroup2: null,
              treatmentGroup3: null,
              controlGroup: "-",
              total: "-",
            },
          },
        },
        reductionView: {
          charts: [
            {
              label: "Sample Size",
              change: "-",
              optivis: optivis.total_patient,
              traditional: 0,
            },
            {
              label: "Power",
              change: "-",
              optivis: Math.round(optivis.primary_endpoint_power * 100),
              traditional: 0,
            },
            {
              label: "Enrollment Time",
              change: "-",
              optivis: Math.round(optivis.enrollment),
              traditional: 0,
            },
            {
              label: "Cost",
              change: "-",
              optivis: Math.round(optivis.cost / 1000000),
              traditional: 0,
            },
          ],
        },
      };
    }

    const smallerSamplePctRaw =
      ((traditional.total_patient - optivis.total_patient) /
        traditional.total_patient) *
      100;
    const smallerSamplePct = Math.abs(smallerSamplePctRaw).toFixed(0);
    const smallerSampleIsNegative = smallerSamplePctRaw < 0;

    const smallerNToScreenPctRaw =
      ((traditional.enrollment - optivis.enrollment) / traditional.enrollment) *
      100;
    const smallerNToScreenPct = Math.abs(smallerNToScreenPctRaw).toFixed(1);
    const smallerNToScreenIsNegative = smallerNToScreenPctRaw < 0;

    const lowerCostPctRaw =
      ((traditional.cost - optivis.cost) / traditional.cost) * 100;
    const lowerCostPct = Math.abs(lowerCostPctRaw).toFixed(0);
    const lowerCostIsNegative = lowerCostPctRaw < 0;

    const sampleSizeReductionRaw =
      ((traditional.total_patient - optivis.total_patient) /
        traditional.total_patient) *
      100;
    const sampleSizeReduction = Math.abs(sampleSizeReductionRaw).toFixed(0);
    const sampleSizeIsNegative = sampleSizeReductionRaw < 0;

    const enrollmentReductionRaw =
      ((traditional.enrollment - optivis.enrollment) / traditional.enrollment) *
      100;
    const enrollmentReduction = Math.abs(enrollmentReductionRaw).toFixed(1);
    const enrollmentIsNegative = enrollmentReductionRaw < 0;

    const costReductionRaw =
      ((traditional.cost - optivis.cost) / traditional.cost) * 100;
    const costReduction = Math.abs(costReductionRaw).toFixed(0);
    const costReductionValue = Math.abs(
      (traditional.cost - optivis.cost) / 1000000
    ).toFixed(1);
    const costIsNegative = costReductionRaw < 0;

    return {
      topMetrics: {
        nToScreen: optivis.n_to_screen.toLocaleString(),
        sampleSize: optivis.total_patient.toLocaleString(),
        enrollment: optivis.enrollment.toFixed(2),
        primaryEndpointPower: (optivis.primary_endpoint_power * 100).toFixed(1),
        secondaryEndpointPower: optivis.secondary_endpoint_power
          ? (optivis.secondary_endpoint_power * 100).toFixed(1)
          : "0.0",
        estimatedCostReduction: costReduction,
        gaugeValue: optivis.primary_endpoint_power,
        gaugeText: `${(optivis.primary_endpoint_power * 100).toFixed(1)}%`,
      },
      smallerSample: {
        percentage: `${smallerSamplePct}%`,
        isNegative: smallerSampleIsNegative,
        chartData: {
          optivis: chartData.chart1Data.optivis,
          traditional: chartData.chart1Data.traditional,
        },
      },
      smallerNToScreen: {
        percentage: `${smallerNToScreenPct}%`,
        isNegative: smallerNToScreenIsNegative,
        subtitle: "Enrollment Time vs Power",
        chartData: {
          optivis: chartData.chart2Data.optivis,
          traditional: chartData.chart2Data.traditional,
        },
      },
      lowerCost: {
        percentage: `${lowerCostPct}%`,
        isNegative: lowerCostIsNegative,
        subtitle: "Sample Size vs Cost",
        chartData: {
          optivis: chartData.chart3Data.optivis,
          traditional: chartData.chart3Data.traditional,
        },
      },
      comparisonTable: {
        enrollment: {
          optivis: optivis.enrollment.toFixed(2),
          traditional: traditional.enrollment.toFixed(2),
        },
        primaryEndpointPower: {
          optivis: `${(optivis.primary_endpoint_power * 100).toFixed(1)}%`,
          traditional: `${(traditional.primary_endpoint_power * 100).toFixed(
            1
          )}%`,
        },
        secondaryEndpointPower: {
          optivis: optivis.secondary_endpoint_power
            ? `${(optivis.secondary_endpoint_power * 100).toFixed(1)}%`
            : "0.0%",
          traditional: traditional.secondary_endpoint_power
            ? `${(traditional.secondary_endpoint_power * 100).toFixed(1)}%`
            : "0.0%",
        },
        sampleSize: {
          optivis: {
            treatmentGroup1: optivis.treatment_group_1?.toString() || null,
            treatmentGroup2: optivis.treatment_group_2?.toString() || null,
            treatmentGroup3: optivis.treatment_group_3?.toString() || null,
            controlGroup: optivis.control_group?.toString() || "0",
            total: optivis.total_patient.toString(),
          },
          traditional: {
            treatmentGroup1: traditional.treatment_group_1?.toString() || null,
            treatmentGroup2: traditional.treatment_group_2?.toString() || null,
            treatmentGroup3: traditional.treatment_group_3?.toString() || null,
            controlGroup: traditional.control_group?.toString() || "0",
            total: traditional.total_patient.toString(),
          },
        },
      },
      reductionView: {
        charts: [
          {
            label: "Sample Size",
            change: `${sampleSizeReduction}%`,
            optivis: optivis.total_patient,
            traditional: traditional.total_patient,
            isNegative: sampleSizeIsNegative,
          },
          {
            label: "Power",
            change:
              optivis.primary_endpoint_power >=
              traditional.primary_endpoint_power
                ? "No loss"
                : `${(
                    (traditional.primary_endpoint_power -
                      optivis.primary_endpoint_power) *
                    100
                  ).toFixed(1)}%`,
            optivis: Math.round(optivis.primary_endpoint_power * 100),
            traditional: Math.round(traditional.primary_endpoint_power * 100),
            isNegative:
              optivis.primary_endpoint_power <
              traditional.primary_endpoint_power,
          },
          {
            label: "Enrollment Time",
            change: `${enrollmentReduction}%`,
            optivis: optivis.enrollment,
            traditional: traditional.enrollment,
            isNegative: enrollmentIsNegative,
          },
          {
            label: "Cost",
            change: `$${costReductionValue}M`,
            optivis: Math.round(optivis.cost / 1000000),
            traditional: Math.round(traditional.cost / 1000000),
            isNegative: costIsNegative,
          },
        ],
      },
    };
  }, [findHighlightedData, chartData, filteredData]);

  /**
   * 차트 타입에 따라 강조 포인트의 X축 값을 반환합니다.
   * (현재 우측 패널 미사용 — 추후 RightPanel 연동 시 활용 예정)
   */
  const getHighlightXValue = (
    _optivisData: number[][],
    chartType: "sampleSize" | "enrollment" | "cost" = "sampleSize"
  ) => {
    if (!findHighlightedData || !findHighlightedData.optivis) {
      return undefined;
    }

    const highlightedPoint = findHighlightedData.optivis;

    switch (chartType) {
      case "sampleSize":
        return highlightedPoint.total_patient;
      case "enrollment":
        return highlightedPoint.enrollment;
      case "cost":
        return highlightedPoint.total_patient;
      default:
        return highlightedPoint.total_patient;
    }
  };

  // simulationData: API 결과가 있을 때만 동적 시뮬레이션 데이터 사용, 없으면 null (RightPanel용)
  const simulationData =
    apiData && dynamicSimulationData ? dynamicSimulationData : null;

  const apiChartData = useMemo(() => {
    if (!apiData || optivisData.length === 0) {
      return null;
    }

    const chart1Optivis = chartData.chart1Data.optivis;
    const chart1Traditional = chartData.chart1Data.traditional;
    const chart2Optivis = chartData.chart2Data.optivis;
    const chart2Traditional = chartData.chart2Data.traditional;
    const chart3Optivis = chartData.chart3Data.optivis;
    const chart3Traditional = chartData.chart3Data.traditional;

    return {
      smallerSample: {
        optivis: chart1Optivis,
        traditional: chart1Traditional,
      },
      smallerNToScreen: {
        optivis: chart2Optivis,
        traditional: chart2Traditional,
      },
      lowerCost: {
        optivis: chart3Optivis,
        traditional: chart3Traditional,
      },
    };
  }, [apiData, chartData, optivisData, traditionalData]);

  // chartDataToUse: 최종적으로 사용할 차트 데이터 (RightPanel 연동 예정)
  const chartDataToUse = apiChartData;

  // 현재 선택된 탭 — "Inclusion" 또는 "Exclusion"
  const [activeTab, setActiveTab] = useState<"Inclusion" | "Exclusion">("Inclusion");
  // 각 카테고리의 아코디언 열림 여부 (카테고리명 → boolean)
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    Object.fromEntries(featureCategories.map(c => [c.name, c.open ?? false]))
  );
  // activeCat: Feature List에서 현재 선택(클릭)된 카테고리명
  const [activeCat, setActiveCat] = useState<string>("");
  // activeFeature: Feature List에서 선택된 피처명 (null이면 선택 없음)
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  // hoveredFeature: 마우스 오버 중인 피처명 (hover 스타일 적용용)
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  // searchQuery: Feature 검색 입력값
  const [searchQuery, setSearchQuery] = useState<string>("");
  // searchDropdownOpen: 검색 결과 드롭다운 표시 여부
  const [searchDropdownOpen, setSearchDropdownOpen] = useState<boolean>(false);
  // searchDropdownPos: Portal로 렌더링되는 검색 드롭다운의 fixed 위치
  const [searchDropdownPos, setSearchDropdownPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  const searchDropdownRef = React.useRef<HTMLDivElement>(null);

  // searchResults: searchQuery와 일치하는 피처를 카테고리·피처명 쌍으로 모은 배열
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: { category: string; feature: string }[] = [];
    featureCategories.forEach(cat => {
      infoFeatures.forEach(f => {
        if (f.toLowerCase().includes(q)) {
          results.push({ category: cat.name, feature: f });
        }
      });
    });
    return results;
  }, [searchQuery]);

  // groupedSearchResults: searchResults를 카테고리명 → 피처 목록 형태로 그룹화
  const groupedSearchResults = React.useMemo(() => {
    const groups: Record<string, string[]> = {};
    searchResults.forEach(({ category, feature }) => {
      if (!groups[category]) groups[category] = [];
      if (!groups[category].includes(feature)) groups[category].push(feature);
    });
    return groups;
  }, [searchResults]);

  React.useEffect(() => {
    if (!searchDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!searchContainerRef.current?.contains(target) && !searchDropdownRef.current?.contains(target)) {
        setSearchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [searchDropdownOpen]);

  // 탭별 섹션 목록 — 저장된 filterData가 있으면 복원, 없으면 빈 Section 1 하나로 시작
  const [inclusionSections, setInclusionSections] = useState<Section[]>(filterData.inclusion.length > 0 ? filterData.inclusion : [makeEmptySection(1)]);
  const [exclusionSections, setExclusionSections] = useState<Section[]>(filterData.exclusion.length > 0 ? filterData.exclusion : [makeEmptySection(1)]);
  // 각 섹션의 아코디언 열림 여부 (sectionId → boolean)
  const [inclusionOpenSections, setInclusionOpenSections] = useState<Record<number, boolean>>(filterData.inclusion.length > 0 ? Object.fromEntries(filterData.inclusion.map(s => [s.id, true])) : { 1: true });
  const [exclusionOpenSections, setExclusionOpenSections] = useState<Record<number, boolean>>(filterData.exclusion.length > 0 ? Object.fromEntries(filterData.exclusion.map(s => [s.id, true])) : { 1: true });

  // 현재 탭에 따라 참조할 섹션 데이터·setter를 통일하여 탭 공통 로직에서 사용
  const currentSections = activeTab === "Inclusion" ? inclusionSections : exclusionSections;
  const currentOpenSections = activeTab === "Inclusion" ? inclusionOpenSections : exclusionOpenSections;
  const setCurrentSections = activeTab === "Inclusion" ? setInclusionSections : setExclusionSections;
  const setCurrentOpenSections = activeTab === "Inclusion" ? setInclusionOpenSections : setExclusionOpenSections;

  // isDeleteEnabled: 하나 이상의 행이 체크되어 있으면 삭제 버튼 활성화
  const isDeleteEnabled = Object.values(checkedRows).some(Boolean);

  // hasValidRow: feature·op·value 모두 채워진 행이 하나라도 있으면 true
  const hasValidRow = (sections: Section[]) =>
    sections.some(s => s.feature && s.op && s.value);
  // isConfirmEnabled: Inclusion 또는 Exclusion 중 하나라도 유효한 행이 있으면 Confirm 버튼 활성화
  const isConfirmEnabled = hasValidRow(inclusionSections) || hasValidRow(exclusionSections);

  /**
   * 체크된 행을 삭제합니다.
   * - 메인 행이 체크된 경우: 첫 번째 섹션이면 내용만 초기화, 나머지는 섹션 자체 제거
   * - 서브 행이 체크된 경우: 해당 SubRow만 제거
   * 삭제 후 checkedRows를 초기화합니다.
   */
  const deleteCheckedRows = () => {
    if (!isDeleteEnabled) return;

    const checkedMainIds = new Set<number>();
    const checkedSubMap: Record<number, Set<number>> = {};

    Object.entries(checkedRows).forEach(([key, val]) => {
      if (!val) return;
      const mainMatch = key.match(/^(\d+)-main$/);
      const subMatch = key.match(/^(\d+)-sub-(\d+)$/);
      if (mainMatch) checkedMainIds.add(Number(mainMatch[1]));
      if (subMatch) {
        const sId = Number(subMatch[1]);
        const rIdx = Number(subMatch[2]);
        if (!checkedSubMap[sId]) checkedSubMap[sId] = new Set();
        checkedSubMap[sId].add(rIdx);
      }
    });

    const firstSectionId = currentSections.length > 0 ? Math.min(...currentSections.map(s => s.id)) : -1;

    setCurrentSections(prev =>
      prev
        .filter(s => !checkedMainIds.has(s.id) || s.id === firstSectionId)
        .map(s => {
          // 첫 번째 섹션의 main이 체크된 경우 → 내용만 초기화
          if (s.id === firstSectionId && checkedMainIds.has(s.id)) {
            return { ...s, feature: "", op: "", value: "", subRows: [] };
          }
          if (!checkedSubMap[s.id]) return s;
          return {
            ...s,
            subRows: (s.subRows ?? []).filter((_, i) => !checkedSubMap[s.id].has(i)),
          };
        })
    );
    setCheckedRows({});
  };

  /** 섹션 헤더 클릭 시 해당 섹션의 아코디언 열림/닫힘을 토글합니다 */
  const toggleSection = (id: number) => {
    setCurrentOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  /** "Add Section" 버튼 클릭 시 새 빈 섹션을 현재 탭에 추가하고 바로 열린 상태로 설정합니다 */
  const addSection = () => {
    const newId = currentSections.length > 0 ? Math.max(...currentSections.map(s => s.id)) + 1 : 1;
    const newSection = makeEmptySection(newId);
    setCurrentSections(prev => [...prev, newSection]);
    setCurrentOpenSections(prev => ({ ...prev, [newId]: true }));
  };

  /** 특정 섹션의 단일 필드(feature | op | value | name)를 업데이트합니다 */
  const updateSection = (id: number, field: keyof Section, value: string) => {
    setCurrentSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  /** 섹션 행 오른쪽 + 버튼 클릭 시 해당 섹션에 빈 SubRow를 추가합니다 */
  const addSubRow = (sectionId: number) => {
    setCurrentSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const newSubRow: SubRow = { logic: "", feature: "", op: "", value: "" };
      return { ...s, subRows: [...(s.subRows ?? []), newSubRow] };
    }));
  };

  /** 특정 섹션의 SubRow 단일 필드(logic | feature | op | value)를 업데이트합니다 */
  const updateSubRow = (sectionId: number, rIdx: number, field: keyof SubRow, value: string) => {
    setCurrentSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const subRows = (s.subRows ?? []).map((r, i) => i === rIdx ? { ...r, [field]: value } : r);
      return { ...s, subRows };
    }));
  };

  /**
   * Feature List 카테고리 클릭 시 해당 카테고리를 토글합니다.
   * 아코디언 방식이므로 다른 카테고리는 모두 닫고 하나만 열립니다.
   */
  const toggleCategory = (name: string) => {
    setOpenCategories(prev => {
      const isCurrentlyOpen = prev[name];
      // 모두 닫고, 현재 항목만 토글 (한 번에 하나만 열림)
      const allClosed = Object.fromEntries(Object.keys(prev).map(k => [k, false]));
      return { ...allClosed, [name]: !isCurrentlyOpen };
    });
  };

  /**
   * "Test Load" 버튼 클릭 시 호출됩니다.
   * Inclusion 4개 섹션 + Exclusion 1개 섹션의 샘플 데이터를 채워
   * 필터 설정 UI를 빠르게 테스트할 수 있게 합니다.
   */
  const fillTestData = () => {
    setInclusionSections([
      { id: 1, name: "Section 1", feature: "AGE", op: ">", value: "55" },
      { id: 2, name: "Section 2", feature: "WEIGHT [kg]", op: ">", value: "50" },
      { id: 3, name: "Section 3", feature: "MMTOTSCORE", op: ">=", value: "22", subRows: [
        { logic: "Or", feature: "CDRTOT", op: "=", value: "0.5" },
        { logic: "Or", feature: "CDRTOT", op: "=", value: "1.0" },
      ]},
      { id: 4, name: "Section 4", feature: "CITY", op: "=", value: "Seoul" },
    ]);
    setInclusionOpenSections({ 1: true, 2: true, 3: true, 4: true });
    setExclusionSections([
      { id: 1, name: "Section 1", feature: "BMI", op: "<", value: "34" },
    ]);
    setExclusionOpenSections({ 1: true });
    setActiveTab("Inclusion");
    setCheckedRows({});
  };

  return (
    <AppLayout headerType="drd" drdStep={1} scaleMode="none">
      <div className="flex flex-col h-full w-full overflow-hidden gap-6">
        {/* {타이틀 영역/Title Area} */}
        {/* ── TOP: Title ───────────────────────────── */}
        <div className="flex flex-row items-start justify-between shrink-0 px-1">
          <div className="flex flex-col">
            <h1 onClick={() => router.push("/drd/default-setting")} className="cursor-pointer text-page-title">
              Default Settings
            </h1>
            <span className="text-page-subtitle">
              Setup Required
            </span>
          </div>
        </div>

        {/* {컨텐츠 영역/Content Area} */}
        {/* ── 컨텐츠 영역 ──────────────────────────────────────────────── */}
        <div className="gap-1 flex flex-row flex-1 min-h-0 items-stretch overflow-hidden">
          
          {/* ── 왼쪽 패널 (Navy Glass) ────────────────── */}
          <DrdLeftPanel
            steps={makeDefaultSettingSteps("filter")}
            filteredPatientsProps={{
              filteredRatio,
              initialCohort: cohortCount,
              finalCohort: finalCohortCount,
              onAddDataClick: () => router.push("/drd/datasetting"),
            }}
          />

          {/* {오른쪽 패널/Right Panel} */}
          {/* ── 오른쪽 패널 (Light Glass) ────────────────── */}
          {/* 오른쪽 상위 배경 카드: selection-bg.png → 안에 흰색 테이블 카드 */}
             <div className="figma-nine-slice figma-home-panel-right flex flex-col rounded-[36px] overflow-hidden flex-[78] min-w-0 min-h-0 gap-3">

            <div className="shrink-0 px-[8px] flex items-center justify-between h-[40px] pt-0 pb-0 pr-0">
              <h2 className="text-body1 text-[var(--text-header)] m-0">
                Filter
              </h2>
              <GlassTestButton onClick={fillTestData} />
            </div>

            <div className="flex flex-col flex-1 min-h-0 gap-[12px]">
            <div className="flex flex-row flex-1 min-h-0 gap-[12px]">
            
              {/* {피처 리스트/Feature List} */}
              {/* Feature List (왼쪽 컬럼) */}
              <div className="w-[272px] shrink-0 flex flex-col gap-[6px]">
                <div className="px-[4px]">
                  <span className="text-body3 text-neutral-30">Feature List</span>
                </div>

                {/* 리스트 아코디언 + 검색 필드 */}
                <div className="flex-1 bg-white rounded-[20px] overflow-hidden min-h-0">
                <div className="flex flex-col overflow-y-auto h-full">
                  {/* 검색 필드 */}
                  <div ref={searchContainerRef} className="relative shrink-0">
                    <div className="h-[48px] bg-white flex items-center px-[18px] gap-[8px]" style={{ borderBottom: "1px solid var(--neutral-80)" }}>
                      <IconSearch size={20} />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search features"
                        value={searchQuery}
                        onChange={e => {
                          setSearchQuery(e.target.value);
                          if (e.target.value.trim()) {
                            const rect = searchContainerRef.current?.getBoundingClientRect();
                            if (rect) setSearchDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
                            setSearchDropdownOpen(true);
                          } else {
                            setSearchDropdownOpen(false);
                          }
                        }}
                        onFocus={() => {
                          if (searchQuery.trim()) {
                            const rect = searchContainerRef.current?.getBoundingClientRect();
                            if (rect) setSearchDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
                            setSearchDropdownOpen(true);
                          }
                        }}
                        className="placeholder:text-neutral-80 flex-1 border-none block text-body4m"
                        style={{
                          outline: "none",
                          background: "transparent",
                          color: "var(--text-primary)",
                          paddingTop: 0,
                          paddingBottom: 0,
                        }}
                      />
                    </div>

                    {/* 검색 드롭다운 */}
                    {searchDropdownOpen && typeof document !== "undefined" && createPortal(
                      <div
                        ref={searchDropdownRef}
                        className="rounded-[18px] fixed overflow-y-auto"
                        style={{
                          top: searchDropdownPos.top,
                          left: searchDropdownPos.left,
                          width: searchDropdownPos.width,
                          background: "white",
                          zIndex: 9999,
                          maxHeight: 268,
                          boxShadow: "0px 4px 16px rgba(0,0,0,0.125)",
                        }}
                      >
                        {Object.keys(groupedSearchResults).length === 0 ? (
                          <div className="flex items-center justify-center" style={{ height: 48 }}>
                            <span className="text-captionm" style={{ color: "var(--neutral-70)" }}>
                              No results found
                            </span>
                          </div>
                        ) : (
                          <>
                            {Object.entries(groupedSearchResults).map(([category, features], catIdx, arr) => (
                              <div key={category} style={{ borderBottom: catIdx < arr.length - 1 ? "1px solid #EBEBEB" : "none" }}>
                                {/* 카테고리 헤더 */}
                                <div style={{ paddingTop: 4, paddingLeft: 8, paddingRight: 8 }}>
                                  <span className="text-small1" style={{
                                    color: "var(--neutral-70)",
                                  }}>
                                    {category}
                                  </span>
                                </div>
                                {/* 항목들 */}
                                {features.map((f, fIdx) => (
                                  <div
                                    key={f}
                                    onMouseDown={() => {
                                      setActiveFeature(f);
                                      setActiveCat(category);
                                      setSearchDropdownOpen(false);
                                    }}
                                    className="flex items-center cursor-pointer"
                                    style={{
                                      height: 28,
                                      paddingLeft: 8,
                                      paddingRight: 8,
                                      borderTop: fIdx === 0 ? "none" : "1px solid #EBEBEB",
                                    }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(0,0,0,0.04)"; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                                  >
                                    <span className="flex-1 text-captionm" style={{
                                      color: "var(--text-secondary)",
                                    }}>
                                      {f}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </>
                        )}
                      </div>,
                      document.body
                    )}
                  </div>
                  {featureCategories.map((cat) => {
                    const isOpen = openCategories[cat.name];
                    const isActive = activeCat === cat.name;
                    return (
                      <div key={cat.name} className="flex flex-col border-b border-neutral-80 last:border-none">
                        <div
                          onClick={() => { toggleCategory(cat.name); setActiveCat(cat.name); }}
                          className={`flex items-center h-[48px] px-[18px] gap-[10px] cursor-pointer select-none ${isActive ? "bg-primary-15" : "hover:bg-neutral-98"}`}
                        >
                          <div className="shrink-0 w-[16px] h-[16px] flex items-center justify-center">
                            {isOpen
                              ? <IconChevronDown size={14} color={isActive ? "#ffffff" : "var(--neutral-30)"} />
                              : <IconChevronRight size={14} color={isActive ? "#ffffff" : "var(--neutral-30)"} />}
                          </div>
                          <span className={`text-body4 ${isActive ? "text-white" : "text-neutral-30"}`}>
                            {cat.name}
                          </span>
                        </div>
                        {isOpen && (
                          <div className="flex flex-col overflow-y-auto scrollbar-hide">
                            {infoFeatures.map(f => {
                              const isFeatureActive = activeFeature === f;
                              const isFeatureHovered = hoveredFeature === f;
                              return (
                                <div
                                  key={f}
                                  onClick={() => setActiveFeature(isFeatureActive ? null : f)}
                                  onMouseEnter={() => setHoveredFeature(f)}
                                  onMouseLeave={() => setHoveredFeature(null)}
                                  className={`h-[44px] flex items-center pl-[44px] text-body4m border-t border-neutral-80 first:border-none cursor-pointer select-none transition-colors ${
                                    isFeatureActive
                                      ? "bg-neutral-95 text-[var(--text-header)] font-semibold"
                                      : isFeatureHovered
                                      ? "bg-neutral-98 text-neutral-30"
                                      : "text-[var(--text-secondary)]"
                                  }`}
                                >
                                  {f}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                </div>
                </div>

              {/* {메인 설정 영역/Main Setting Area} */}
              {/* 메인 설정 영역 (오른쪽 컬럼) */}
              <div className="flex-1 rounded-[20px] bg-[rgba(255,255,255,0.6)] p-[12px] overflow-hidden min-h-0">
              <div className="flex flex-col gap-[12px] overflow-y-auto h-full">

                {/* 상단 탭 + 액션 버튼 */}
                <div className="flex justify-between items-center shrink-0">
                  {/* Inclusion / Exclusion 탭 */}
                  <div className="bg-white p-[4px] rounded-[18px] flex">
                    <button
                      onClick={() => { setActiveTab("Inclusion"); setCheckedRows({}); }}
                      className={`h-[36px] px-[18px] rounded-[36px] border-none text-body4 cursor-pointer transition-all ${activeTab === "Inclusion" ? "bg-primary-15 text-white" : "bg-transparent text-neutral-30"}`}
                    >
                      Inclusion
                    </button>
                    <button
                      onClick={() => { setActiveTab("Exclusion"); setCheckedRows({}); }}
                      className={`h-[36px] px-[18px] rounded-[36px] border-none text-body4 cursor-pointer transition-all ${activeTab === "Exclusion" ? "bg-primary-15 text-white" : "bg-transparent text-neutral-30"}`}
                    >
                      Exclusion
                    </button>
                  </div>

                  {/* 유리 스타일 버튼들 */}
                  <div className="flex items-center gap-[12px]">
                    <div className="flex gap-[4px]">
                      {/* IconFileDownload */}
                      <GlassButton height={48} width={48} disabled={!isDeleteEnabled} boxShadow="1px 1px 2px 1px rgba(0,0,0,0.113)">
                        <IconFileDownload size={24} color={isDeleteEnabled ? "var(--text-header)" : "var(--neutral-80)"} />
                      </GlassButton>
                      {/* IconFolderPlus — 비활성화 상태 */}
                      <GlassButton height={48} width={48} disabled boxShadow="1px 1px 2px 1px rgba(0,0,0,0.113)">
                        <IconFolderPlus size={24} color="var(--neutral-80)" />
                      </GlassButton>
                      {/* IconTrash — 비활성화: 현재 디자인, 활성화: 유리 스타일 */}
                      <GlassButton onClick={deleteCheckedRows} height={48} width={48} disabled={!isDeleteEnabled} boxShadow="1px 1px 2px 1px rgba(0,0,0,0.113)">
                        <IconTrash size={24} color={isDeleteEnabled ? "var(--text-header)" : "var(--neutral-80)"} />
                      </GlassButton>
                    </div>
                    {/* Add Section 버튼 */}
                    <GlassButton onClick={addSection} boxShadow="1px 1px 2px 1px rgba(0,0,0,0.113)">
                      <span className="text-body4 text-[var(--text-header)]">Add Section</span>
                      <IconPlus size={16} color="var(--text-header)" />
                    </GlassButton>
                  </div>
                </div>

                {/* 섹션 리스트 */}
                <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-[14px]">
                  {currentSections.map((section: Section) => {
                    const isSectionOpen = currentOpenSections[section.id];
                    return (
                    <div key={section.id} className="bg-white rounded-[8px] flex flex-col">
                      {/* 섹션 헤더 */}
                      <div
                        className={`h-[46px] flex items-center px-[21px] gap-[10px] cursor-pointer select-none hover:bg-[#fdfdfd] rounded-[8px] transition-colors ${isSectionOpen ? "rounded-b-none" : ""}`}
                        style={isSectionOpen ? { borderBottom: "1.5px solid var(--neutral-80)" } : {}}
                        onClick={() => toggleSection(section.id)}
                      >
                        <div className={`shrink-0 transition-transform duration-200 ${isSectionOpen ? "rotate-0" : "-rotate-90"}`}>
                          <IconChevronDown size={14} color="var(--neutral-20)" />
                        </div>
                        <span className="text-body4 text-neutral-20">
                          {section.name}
                        </span>
                      </div>

                      {/* 섹션 본문 (열렸을 때만) */}
                      {isSectionOpen && (
                        <>
                          {/* 섹션 본문 - 첫 번째 줄 */}
                          <div className="flex items-center h-[50px] px-[24px] gap-[14px]">
                            <CustomCheckbox
                              checked={!!checkedRows[`${section.id}-main`]}
                              onChange={() => setCheckedRows(prev => ({ ...prev, [`${section.id}-main`]: !prev[`${section.id}-main`] }))}
                            />
                            <div className="shrink-0" style={{ flex: "0 0 17%" }} />

                            <DropdownCell
                              value={section.feature || "Feature Select"} flex={3}
                              placeholder={!section.feature} options={featureOptions}
                              onChange={v => updateSection(section.id, "feature", v)}
                            />
                            <DropdownCell
                              value={section.op || "Select"} flex={2}
                              placeholder={!section.op} options={opOptions}
                              onChange={v => updateSection(section.id, "op", v)}
                            />
                            <input
                              type="text"
                              value={section.value}
                              placeholder="Write input"
                              onChange={e => updateSection(section.id, "value", e.target.value)}
                              className="placeholder:text-neutral-80 rounded-[4px] min-w-0 border-none cursor-text text-body3m"
                              style={{
                                flex: 4, height: 36,
                                background: "var(--neutral-95)",
                                paddingLeft: 12, paddingRight: 12,
                                color: "var(--text-primary)",
                                outline: "none",
                              }}
                            />

                            <div className="w-[16px] shrink-0 flex items-center justify-center cursor-pointer" onClick={() => addSubRow(section.id)}><IconPlus size={16} color="#999" /></div>
                          </div>

                          {/* 섹션 본문 - 추가 줄 (서브 로직) */}
                          {(section.subRows ?? []).map((row: SubRow, rIdx: number) => (
                            <div key={rIdx} className="flex items-center h-[50px] px-[24px] gap-[14px]" style={{ borderTop: "1.5px solid var(--neutral-80)" }}>
                              <CustomCheckbox
                                checked={!!checkedRows[`${section.id}-sub-${rIdx}`]}
                                onChange={() => setCheckedRows(prev => ({ ...prev, [`${section.id}-sub-${rIdx}`]: !prev[`${section.id}-sub-${rIdx}`] }))}
                              />

                              <DropdownCell
                                value={row.logic || "Select"} flex="0 0 17%"
                                placeholder={!row.logic}
                                options={logicOptions}
                                onChange={v => updateSubRow(section.id, rIdx, "logic", v)}
                              />
                              <DropdownCell
                                value={row.feature || "Feature Select"} flex={3}
                                placeholder={!row.feature} options={featureOptions}
                                onChange={v => updateSubRow(section.id, rIdx, "feature", v)}
                              />
                              <DropdownCell
                                value={row.op || "Select"} flex={2}
                                placeholder={!row.op} options={opOptions}
                                onChange={v => updateSubRow(section.id, rIdx, "op", v)}
                              />
                              <input
                                type="text"
                                value={row.value}
                                placeholder="Write input"
                                onChange={e => updateSubRow(section.id, rIdx, "value", e.target.value)}
                                className="placeholder:text-neutral-80 rounded-[4px] min-w-0 border-none cursor-text text-body3m"
                                style={{
                                  flex: 4, height: 36,
                                  background: "var(--neutral-95)",
                                  paddingLeft: 12, paddingRight: 12,
                                  color: "var(--text-primary)",
                                  outline: "none",
                                }}
                              />

                              <div className="w-[16px] shrink-0 flex items-center justify-center cursor-pointer" onClick={() => addSubRow(section.id)}><IconPlus size={16} color="#999" /></div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                    );
                  })}
                </div>

                {/* {하단 필터 수식 영역/Bottom Filter Formula Area} */}
                {/* 하단 필터 수식 영역 */}
                {(() => {
                  const extractLines = (sections: Section[]) => {
                    const lines: { logic: string | null; text: string }[] = [];
                    sections.forEach((section) => {
                      const mainHasData = section.feature || section.op || section.value;
                      if (mainHasData) {
                        const parts = [section.feature, section.op, section.value].filter(Boolean).join(" ");
                        lines.push({ logic: null, text: `{ ${parts} }` });
                      }
                      (section.subRows ?? []).forEach((row) => {
                        const rowHasData = row.feature || row.op || row.value;
                        if (rowHasData) {
                          const parts = [row.feature, row.op, row.value].filter(Boolean).join(" ");
                          lines.push({ logic: row.logic || "And", text: `{ ${parts} }` });
                        }
                      });
                    });
                    return lines;
                  };

                  const inclusionLines = extractLines(inclusionSections);
                  const exclusionLines = extractLines(exclusionSections);
                  const bothHaveData = inclusionLines.length > 0 && exclusionLines.length > 0;

                  const renderLines = (lines: { logic: string | null; text: string }[], label: string) => (
                    <div className="text-body4m text-neutral-60 flex flex-col gap-[4px]">
                      {lines.map((line, i) => (
                        <p key={i} className="m-0">
                          {i === 0
                            ? <><span className="text-[var(--text-header)] font-semibold">{label}</span> [ &nbsp;{line.text}</>
                            : <><span className="text-tertiary-40 font-bold">{line.logic}</span> {line.text}</>
                          }
                          {i === lines.length - 1 && <> &nbsp;]</>}
                        </p>
                      ))}
                    </div>
                  );

                  return (
                    <div className="bg-white p-[16px] rounded-[8px] shrink-0 min-h-[104px] gap-4 flex">
                      {bothHaveData ? (
                        <>
                          <div className="flex-1 min-w-0">{renderLines(inclusionLines, "Inclusion")}</div>
                          <div className="flex-1 min-w-0">{renderLines(exclusionLines, "Exclusion")}</div>
                        </>
                      ) : (
                        <div className="flex-1">
                          {inclusionLines.length > 0 && renderLines(inclusionLines, "Inclusion")}
                          {exclusionLines.length > 0 && renderLines(exclusionLines, "Exclusion")}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div></div></div>

                {/* {하단 버튼/Bottom Buttons} */}
                {/* 하단 버튼 */}
                <div className="shrink-0 flex justify-end gap-[12px]">
                  <button
                    onClick={() => router.push("/drd/default-setting")}
                    className="btn-tsi btn-tsi-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!isConfirmEnabled}
                    onClick={() => {
                      if (!isConfirmEnabled) return;
                      setFilterData({ inclusion: inclusionSections, exclusion: exclusionSections });
                      setCompleted("filter", true);
                      router.push("/drd/default-setting");
                    }}
                    className="btn-tsi btn-tsi-primary"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
           </div>
    </AppLayout>
  );
}