/**
 * Default Settings 메인 페이지 (DRD Step 1)
 *
 * 사용자가 시뮬레이션에 사용할 환자 코호트를 설정하는 페이지입니다.
 * 4가지 설정 항목(Patient/Disease Info, Filter, High-Risk Subgroup, Medical History)을
 * 하단 액션 버튼은 설정 완료 여부와 무관하게 항상 활성화되며,
 * "Apply to Analysis" 버튼으로 Step 2(Simulation Settings)로 이동할 수 있습니다.
 *
 * 주요 구조:
 * - 왼쪽 패널: Filtered Patients 현황 카드 + 설정 단계 목록
 * - 오른쪽 패널: 각 설정 항목 카드 2×2 그리드 (미완료=InitialCard, 완료=CompletedCard)
 * - 하단: Save Progress / Apply to Analysis 버튼
 */

"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useDefaultSettingStore, type DefaultSettingId } from "@/store/defaultSettingStore";
import { useSimulationStore } from "@/store/simulationStore";
import { Loading } from "@/components/common/Loading";
import {
  clearDrdGroupManageFilter,
  clearDrdMedicalHistory,
  clearDrdPatientInfo,
  clearDrdSubgroups,
  getDrdTaskSummary,
  getGroupManageInfo,
  insertGroupManageTask,
} from "@/services/drd-service";
import {
  IconVirusGray,
  IconFunnelGray,
  IconAsteriskGray,
  IconClockGray,
  IconVirusOrange,
  IconFunnelActive,
  IconAsteriskOrange,
  IconClockOrange,
} from "@/components/ui/drd-step-icons";
import { mapDrdTaskSummaryToDefaultSettingHydration } from "@/lib/drd-default-setting-mapper";
import { serializeDrdFilterConditionRawJson } from "@/lib/drd-filter-condition";

/** 설정 완료 시 카드 헤더에 표시되는 주황색 체크 원형 아이콘 */
function IconComplete(): React.JSX.Element {
  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: "50%",
        background: "#F06600",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path
          d="M3 9L7 13L15 5"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// ── 설정 아이템 정의 ─────────────────────────────────────────────────────────
// 4개 설정 카드 각각의 메타데이터(id, 제목, 설명, 아이콘, 완료 시 요약 내용)를 정의합니다.
// completedSummary는 해당 항목이 완료됐을 때 CompletedCard 내부에 표시할 내용입니다.

type IconComp = (props: { size?: number }) => React.JSX.Element;

const settingItems: {
  id: DefaultSettingId;
  title: string;
  description: string;
  icon: IconComp;
  completedSummary: {
    columns?: { heading: string; rows: { label?: string; value: string }[] }[];
    heading?: string;
    rows?: { label: string; value: string }[];
  };
}[] = [
  {
    id: "patient-disease-info",
    title: "Patient/Disease Info",
    description:
      "Define patient groups by fixing simulation conditions and selecting control variables.",
    icon: IconVirusGray,
    completedSummary: {
      heading: "",
      rows: [],
    },
  },
  {
    id: "filter",
    title: "Filter",
    description: "Define patient groups through direct feature-based filtering.",
    icon: IconFunnelGray,
    completedSummary: {
      heading: "Inclusion",
      rows: [],
    },
  },
  {
    id: "high-risk-subgroup",
    title: "High-Risk Subgroup",
    description: "Select high-risk subgroups based on disease progression slopes.",
    icon: IconAsteriskGray,
    completedSummary: {
      heading: "",
      rows: [],
    },
  },
  {
    id: "medical-history",
    title: "Medical History",
    description: "Define patient groups based on clinical history and risk profiles.",
    icon: IconClockGray,
    completedSummary: {
      columns: [],
    },
  },
];

/** 각 설정 항목 ID → 해당 설정 페이지 경로 매핑 */
const settingRoutes: Record<DefaultSettingId, string> = {
  "patient-disease-info": "/drd/patient-disease-info",
  filter: "/drd/filter",
  "high-risk-subgroup": "/drd/high-risk-subgroup",
  "medical-history": "/drd/medical-history",
};

// ── 서브컴포넌트 ─────────────────────────────────────────────────────────────

/**
 * InitialCard — 아직 설정하지 않은 항목에 표시되는 카드
 * 제목, 설명, "Setting +" 버튼을 포함합니다.
 */
function InitialCard({ item, onClick }: { item: any; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.6)",
        borderRadius: 24,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        flex: 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Icon size={30} />
        <span
          style={{
            fontFamily: "Inter",
            fontSize: 17,
            fontWeight: 600,
            color: "rgb(72,70,70)",
            letterSpacing: "-0.51px",
            lineHeight: "1",
          }}
        >
          {item.title}
        </span>
      </div>
      <p
        style={{
          fontFamily: "Inter",
          fontSize: 13,
          fontWeight: 500,
          color: "rgb(145,144,146)",
          letterSpacing: "-0.39px",
          lineHeight: "1.4",
          margin: "16px 0 0",
          flex: 1,
        }}
      >
        {item.description}
      </p>
      <button
        onClick={onClick}
        style={{
          width: "100%",
          height: 36,
          borderRadius: 36,
          border: "none",
          cursor: "pointer",
          background: "#8F8AC4",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          marginTop: 16,
          flexShrink: 0,
          paddingTop: 2,
        }}
      >
        <span
          style={{
            fontFamily: "Inter",
            fontSize: 17,
            fontWeight: 600,
            color: "#ffffff",
            letterSpacing: "-0.51px",
            lineHeight: 1,
          }}
        >
          Setting
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M2.33594 8.33594H14.3359"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.33594 2.33594V14.3359"
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

/**
 * CompletedCard — 설정이 완료된 항목에 표시되는 카드
 * 설정 요약 내용(단일 컬럼 또는 다중 컬럼)과 Reset/Edit 버튼을 포함합니다.
 * - columns가 있으면 → 여러 열로 나뉜 요약(예: Inclusion/Exclusion)
 * - 없으면 → 단일 행 목록(예: Demographic/Measurement)
 */
function CompletedCard({
  item,
  onReset,
  onEdit,
}: {
  item: any;
  onReset: () => void;
  onEdit: () => void;
}) {
  const summary = item.completedSummary;
  const hasColumns = !!summary.columns;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.6)",
        borderRadius: 24,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        minWidth: 0,
        flex: 1,
        overflow: "hidden",
      }}
    >
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <IconComplete />
        <span
          style={{
            fontFamily: "Inter",
            fontSize: 17,
            fontWeight: 600,
            color: "rgb(72,70,70)",
            letterSpacing: "-0.51px",
            lineHeight: "1",
          }}
        >
          {item.title}
        </span>
      </div>

      {/* 내용 — 스크롤 영역 */}
      <div
        style={{
          display: "flex",
          flex: 1,
          gap: 8,
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {hasColumns ? (
          /* Multi-column: Each column gets its own identical white container */
          (summary.columns as any[]).map((col: any, ci: number) => (
            <div
              key={ci}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                background: "#ffffff",
                borderRadius: 16,
                padding: 14,
                gap: 12,
                minWidth: 0,
                minHeight: 0,
                overflowY: "auto",
              }}
            >
              {/* 컬럼 헤딩 */}
              <div
                style={{
                  fontFamily: "Inter",
                  fontSize: 17,
                  fontWeight: 600,
                  color: "rgb(72,70,70)",
                  letterSpacing: "-0.51px",
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                {col.heading}
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, minWidth: 0 }}
              >
                {(col.rows as any[]).map((row: any, ri: number) => (
                  <div
                    key={ri}
                    style={{
                      height: 17,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexShrink: 0,
                    }}
                  >
                    {row.label && (
                      <span
                        style={{
                          flex: "0 0 auto",
                          fontFamily: "Inter",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "rgb(120,119,118)",
                          letterSpacing: "-0.39px",
                          lineHeight: 1,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {row.label}
                      </span>
                    )}
                    {row.value && (
                      <span
                        style={{
                          fontFamily: "Inter",
                          fontSize: 13,
                          fontWeight: 500,
                          color: "rgb(72,70,70)",
                          letterSpacing: "-0.39px",
                          lineHeight: 1.3,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {row.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          /* 일반 단일 컨테이너: 헤딩 + 행 테이블 */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
              background: "#ffffff",
              borderRadius: 16,
              padding: 14,
              justifyContent: "flex-start",
              gap: 12,
              overflowY: "auto",
            }}
          >
            {summary.heading && (
              <div
                style={{
                  fontFamily: "Inter",
                  fontSize: 17,
                  fontWeight: 600,
                  color: "rgb(72,70,70)",
                  letterSpacing: "-0.51px",
                  flexShrink: 0,
                }}
              >
                {summary.heading}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column" }}>
              {(summary.rows ?? []).map((row: any, i: number) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    height: 36,
                    gap: 10,
                    flexShrink: 0,
                    borderTop: i === 0 ? "none" : "1px solid #C6C5C9",
                  }}
                >
                  {row.label && (
                    <span
                      style={{
                        flex: "0 0 auto",
                        minWidth: 80,
                        fontFamily: "Inter",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "rgb(120,119,118)",
                        letterSpacing: "-0.39px",
                        lineHeight: 1,
                      }}
                    >
                      {row.label}
                    </span>
                  )}
                  <span
                    style={{
                      flex: 1,
                      fontFamily: "Inter",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "rgb(72,70,70)",
                      letterSpacing: "-0.39px",
                      lineHeight: 1,
                    }}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 버튼 — 하단 고정 */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
        <button
          onClick={onReset}
          style={{
            height: 36,
            paddingLeft: 20,
            paddingRight: 10,
            borderRadius: 36,
            background: "#8f8ac4",
            border: "none",
            cursor: "pointer",
            fontFamily: "Inter",
            fontSize: 15,
            fontWeight: 600,
            color: "#ffffff",
            letterSpacing: "-0.45px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          Reset
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icons/basics/Contents%3DReset%2C%20Size%3D16.svg"
            alt=""
            width={18}
            height={18}
            style={{ display: "block", filter: "brightness(0) invert(1)" }}
          />
        </button>
        <button
          onClick={onEdit}
          style={{
            height: 36,
            paddingLeft: 20,
            paddingRight: 14,
            borderRadius: 36,
            background: "#8f8ac4",
            border: "none",
            cursor: "pointer",
            fontFamily: "Inter",
            fontSize: 15,
            fontWeight: 600,
            color: "#ffffff",
            letterSpacing: "-0.45px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          Edit
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 3.375V14.625"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3.375 9H14.625"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

const stepRoutes: Record<string, string> = {
  "patient-disease-info": "/drd/patient-disease-info",
  filter: "/drd/filter",
  "high-risk-subgroup": "/drd/high-risk-subgroup",
  "medical-history": "/drd/medical-history",
};

// ── 데이터 설정 ───────────────────────────────────────────────────────────
// 왼쪽 패널의 설정 단계 목록. 현재 페이지(default-setting)에서는 모두 비활성 상태.
// 각 하위 설정 페이지에서는 해당 항목만 isActive: true로 강조 표시됩니다.

const setupSteps = [
  {
    id: "patient-disease-info",
    IconComponent: IconVirusGray,
    IconOrangeComponent: IconVirusOrange,
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
    IconOrangeComponent: IconFunnelActive,
    isActive: false,
    title: "Filter",
    description:
      "Define patient groups through direct feature-based filtering. Filtering conditions are applied to selected features to construct patient groups.",
    titleColor: "#484646",
    descriptionColor: "#919092",
    bgColor: "transparent",
  },
  {
    id: "high-risk-subgroup",
    IconComponent: IconAsteriskGray,
    IconOrangeComponent: IconAsteriskOrange,
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
    IconOrangeComponent: IconClockOrange,
    isActive: false,
    title: "Medical History",
    description:
      "Define patient groups based on clinical history and risk profiles. Patient groups can be selected using diagnoses, comorbidities, risk factors, and key medical history.",
    titleColor: "#484646",
    descriptionColor: "#919092",
    bgColor: "transparent",
  },
];

// ── 메인 페이지 ──────────────────────────────────────────────────────────────

function DefaultSettingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // defaultSettingStore: 각 설정 항목 완료 여부, 코호트 수치, 각 설정 데이터
  const {
    hasHydrated,
    hydratedTaskId,
    needsSync,
    completedItems,
    setCompleted,
    markNeedsSync,
    isAllCompleted,
    cohortCount,
    finalCohortCount,
    filterData,
    medicalHistoryData,
    medicalHistoryRawData,
    patientDiseaseInfoData,
    highRiskSubgroupData,
    addSavedSimulation,
    hydrateFromApi,
  } = useDefaultSettingStore();

  const allCompleted = isAllCompleted(); // 4개 모두 완료 여부

  const initialCohort = cohortCount; // 초기 코호트 전체 환자 수
  const finalCohort = finalCohortCount; // 필터링 후 최종 코호트 환자 수
  const filteredRatio = initialCohort > 0 ? Math.round((finalCohort / initialCohort) * 100) : 0; // 필터링 비율(%)

  // Save Progress 모달 표시 여부 + 입력값 상태
  const [showSaveModal, setShowSaveModal] = React.useState(false);
  const [simName, setSimName] = React.useState("");
  const [simDesc, setSimDesc] = React.useState("");
  const [isPageFetching, setIsPageFetching] = React.useState(false);
  const [resetPending, setResetPending] = React.useState<
    Partial<Record<DefaultSettingId, boolean>>
  >({});

  /** 시뮬레이션 저장 — 이름 필수, 설명은 선택(최대 30자) */
  const handleSaveSimulation = () => {
    if (!simName.trim()) return;
    const now = new Date();
    const lastUpdated = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    addSavedSimulation({
      id: `drd-${Date.now()}`,
      simulationName: simName.trim(),
      type: "drd",
      population: `${finalCohortCount.toLocaleString()} / ${cohortCount.toLocaleString()}`,
      outcome: `${filteredRatio}%`,
      description: simDesc.trim(),
      lastUpdated,
    });
    setSimName("");
    setSimDesc("");
    setShowSaveModal(false);
  };

  // 필터링 비율(%) 숫자를 부드럽게 카운트업하는 애니메이션
  // ease-out cubic 곡선으로 처음엔 빠르게, 끝에서 천천히 증가
  const [animatedRatio, setAnimatedRatio] = React.useState(0);
  React.useEffect(() => {
    let start = 0;
    const target = filteredRatio;
    const duration = 1000;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      start = Math.round(eased * target);
      setAnimatedRatio(start);
      if (progress < 1) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [filteredRatio]);

  // 각 설정 항목의 completedSummary를 실제 저장된 값으로 동적으로 채워주는 로직.
  // settingItems 원본을 복사 후, store에서 읽어온 데이터를 기반으로 요약 내용을 덮어씁니다.
  const dynamicSettingItems = React.useMemo(() => {
    const items = [...settingItems];

    // Patient/Disease Info 요약 — 선택된 인구통계, 측정 변수, 제어 모드 표시
    const pdiIdx = items.findIndex((it) => it.id === "patient-disease-info");
    if (pdiIdx !== -1 && patientDiseaseInfoData) {
      const d = patientDiseaseInfoData;
      items[pdiIdx] = {
        ...items[pdiIdx],
        completedSummary: {
          heading: "",
          rows: [
            { label: "Demographic", value: d.baselineDemo },
            { label: "Measurement", value: d.baselineMeasure },
            {
              label: "Control",
              value: d.controlMode === "trend" ? `Trend: ${d.trendSelection}` : "Value",
            },
          ],
        },
      };
    }

    // High-Risk Subgroup 요약 — 선택된 서브그룹 세트/피처/조건/월/기울기/상태 표시
    const hrsIdx = items.findIndex((it) => it.id === "high-risk-subgroup");
    if (hrsIdx !== -1 && highRiskSubgroupData) {
      const d = highRiskSubgroupData;
      items[hrsIdx] = {
        ...items[hrsIdx],
        completedSummary: {
          heading: "",
          rows: [
            { label: "Set Name", value: `${d.parentName} / ${d.subRowName}` },
            { label: "Feature", value: d.feature },
            ...(d.condition ? [{ label: "Condition", value: d.condition }] : []),
            ...(d.month ? [{ label: "Month", value: d.month }] : []),
            ...(d.slope ? [{ label: "Slope", value: d.slope }] : []),
            ...(d.status ? [{ label: "Status", value: d.status }] : []),
          ],
        },
      };
    }

    // Filter 요약 — Inclusion/Exclusion 조건을 수식 형태로 표시
    // 예: Inclusion [ { AGE > 55 } And { WEIGHT [kg] > 50 } ]
    const filterIdx = items.findIndex((it) => it.id === "filter");
    if (filterIdx !== -1) {
      const inclusion = filterData.inclusion.filter(
        (s) => s.feature || s.op || s.value || (s.subRows && s.subRows.length > 0)
      );
      const exclusion = filterData.exclusion.filter(
        (s) => s.feature || s.op || s.value || (s.subRows && s.subRows.length > 0)
      );

      const toCleanExpressionPart = (raw: unknown): string => {
        if (Array.isArray(raw)) {
          return raw
            .map((entry) => toCleanExpressionPart(entry))
            .filter(Boolean)
            .join(", ");
        }
        if (typeof raw === "number" || typeof raw === "boolean") {
          return String(raw);
        }
        if (typeof raw !== "string") {
          return "";
        }

        const trimmed = raw.trim();
        if (!trimmed) return "";

        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
          try {
            const parsed = JSON.parse(trimmed) as unknown;
            if (Array.isArray(parsed)) {
              return parsed
                .map((entry) => toCleanExpressionPart(entry))
                .filter(Boolean)
                .join(", ");
            }
            return "";
          } catch {
            return "";
          }
        }

        return trimmed.replace(/^"+|"+$/g, "").trim();
      };

      const formatSections = (sections: any[]) => {
        const rows: { label: string; value: string }[] = [];
        sections.forEach((s, sIdx) => {
          const mainPart = [
            toCleanExpressionPart(s.feature),
            toCleanExpressionPart(s.op),
            toCleanExpressionPart(s.value),
          ]
            .filter(Boolean)
            .join(" ");
          if (mainPart) {
            rows.push({ label: sIdx === 0 ? "" : "And", value: `{ ${mainPart} }` });
          }
          (s.subRows ?? []).forEach((sr: any) => {
            const subPart = [
              toCleanExpressionPart(sr.feature),
              toCleanExpressionPart(sr.op),
              toCleanExpressionPart(sr.value),
            ]
              .filter(Boolean)
              .join(" ");
            if (subPart) {
              rows.push({ label: sr.logic || "And", value: `{ ${subPart} }` });
            }
          });
        });

        return rows;
      };

      const incRows = formatSections(inclusion);
      const excRows = formatSections(exclusion);

      items[filterIdx] = {
        ...items[filterIdx],
        completedSummary:
          incRows.length > 0 && excRows.length > 0
            ? {
                columns: [
                  { heading: "Inclusion", rows: incRows },
                  { heading: "Exclusion", rows: excRows },
                ],
              }
            : excRows.length > 0
              ? {
                  heading: "Exclusion",
                  rows: excRows,
                }
              : {
                  heading: "Inclusion",
                  rows: incRows.length > 0 ? incRows : [{ label: "", value: "-" }],
                },
      };
    }
    // Medical History 요약 — 선택된 Baseline Status(진단/동반질환)와 Control Variables(위험인자) 표시
    const mhIdx = items.findIndex((it) => it.id === "medical-history");
    if (mhIdx !== -1) {
      const toUniqueNonEmpty = (values: string[]): string[] => {
        const deduped = new Set<string>();
        const next: string[] = [];

        values.forEach((value) => {
          const trimmed = value.trim();
          if (!trimmed) return;
          const key = trimmed.toLowerCase();
          if (deduped.has(key)) return;
          deduped.add(key);
          next.push(trimmed);
        });

        return next;
      };

      const rawBaselineValues = toUniqueNonEmpty([
        ...(medicalHistoryRawData?.diagnosis ?? []),
        ...(medicalHistoryRawData?.comorbidity ?? []),
      ]);
      const rawControlValues = toUniqueNonEmpty([...(medicalHistoryRawData?.riskFactor ?? [])]);

      const mhLabels: Record<string, string> = {
        ckd: "CKD Stage",
        "ckd-1": "Stage 1 (eGFR >=90)",
        "ckd-2": "Stage 2 (eGFR >=60)",
        "ckd-3": "Stage 3 (eGFR >=30)",
        "ckd-4": "Stage 4 (eGFR >=15)",
        "ckd-5": "Stage 5 (eGFR <=90)",
        cardiac: "Cardiac disorders",
        vascular: "Vascular disorders",
        metabolism: "Metabolism & nutrition",
        renal: "Renal & urinary",
        nervous: "Nervous system",
        eye: "Eye disorders",
        hepato: "Hepatobiliary disorders",
        cvd: "CVD History",
        ascvd: "ASCVD",
        hf: "HF",
        stroke: "Stroke",
        lowbs: "Low Blood Sugar Severity",
        "lowbs-1": "Step 1 ( < 70mg/dL)",
        "lowbs-2": "Step 2 ( < 54mg/dL)",
        dm: "DM Duration",
        "dm-1": "Early ( < 1 years)",
        "dm-2": "Short ( < 10 years )",
        "dm-3": "Long ( >= 10 years )",
      };

      // Baseline Status: CKD Stage + 하위, Comorbidity 항목들
      const baselineRows: { label: string; value: string }[] = [];
      // Control Variables: CVD History + 하위, Low Blood Sugar + 하위, DM Duration + 하위
      const controlRows: { label: string; value: string }[] = [];

      if (rawBaselineValues.length > 0 || rawControlValues.length > 0) {
        rawBaselineValues.forEach((value) => {
          baselineRows.push({ label: "", value });
        });
        rawControlValues.forEach((value) => {
          controlRows.push({ label: "", value });
        });
      } else {
        if (medicalHistoryData["ckd"]) {
          baselineRows.push({ label: mhLabels["ckd"], value: "" });
          ["ckd-1", "ckd-2", "ckd-3", "ckd-4", "ckd-5"]
            .filter((k) => medicalHistoryData[k])
            .forEach((k) => baselineRows.push({ label: "", value: mhLabels[k] }));
        } else {
          ["ckd-1", "ckd-2", "ckd-3", "ckd-4", "ckd-5"]
            .filter((k) => medicalHistoryData[k])
            .forEach((k) => baselineRows.push({ label: "", value: mhLabels[k] }));
        }
        ["cardiac", "vascular", "metabolism", "renal", "nervous", "eye", "hepato"]
          .filter((k) => medicalHistoryData[k])
          .forEach((k) => baselineRows.push({ label: "", value: mhLabels[k] }));

        if (medicalHistoryData["cvd"]) {
          controlRows.push({ label: mhLabels["cvd"], value: "" });
          ["ascvd", "hf", "stroke"]
            .filter((k) => medicalHistoryData[k])
            .forEach((k) => controlRows.push({ label: "", value: mhLabels[k] }));
        } else {
          ["ascvd", "hf", "stroke"]
            .filter((k) => medicalHistoryData[k])
            .forEach((k) => controlRows.push({ label: "", value: mhLabels[k] }));
        }
        if (medicalHistoryData["lowbs"]) {
          controlRows.push({ label: mhLabels["lowbs"], value: "" });
          ["lowbs-1", "lowbs-2"]
            .filter((k) => medicalHistoryData[k])
            .forEach((k) => controlRows.push({ label: "", value: mhLabels[k] }));
        } else {
          ["lowbs-1", "lowbs-2"]
            .filter((k) => medicalHistoryData[k])
            .forEach((k) => controlRows.push({ label: "", value: mhLabels[k] }));
        }
        if (medicalHistoryData["dm"]) {
          controlRows.push({ label: mhLabels["dm"], value: "" });
          ["dm-1", "dm-2", "dm-3"]
            .filter((k) => medicalHistoryData[k])
            .forEach((k) => controlRows.push({ label: "", value: mhLabels[k] }));
        } else {
          ["dm-1", "dm-2", "dm-3"]
            .filter((k) => medicalHistoryData[k])
            .forEach((k) => controlRows.push({ label: "", value: mhLabels[k] }));
        }
      }

      items[mhIdx] = {
        ...items[mhIdx],
        completedSummary: {
          columns: [
            {
              heading: "Baseline Status",
              rows: baselineRows.length > 0 ? baselineRows : [{ label: "-", value: "" }],
            },
            {
              heading: "Medical History",
              rows: controlRows.length > 0 ? controlRows : [{ label: "-", value: "" }],
            },
          ],
        },
      };
    }

    return items;
  }, [
    filterData,
    medicalHistoryData,
    medicalHistoryRawData,
    patientDiseaseInfoData,
    highRiskSubgroupData,
  ]);

  // simulationStore: task 컨텍스트 및 로딩/에러 상태
  const { taskId: simulationTaskId, isLoading, setTaskId, setError } = useSimulationStore();

  const resolveTaskId = (): string | null => {
    const fromQuery =
      searchParams.get("taskId") ?? searchParams.get("task_id") ?? searchParams.get("test_id");
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

  const handleCardReset = async (id: DefaultSettingId): Promise<void> => {
    if (resetPending[id]) return;

    const taskId = resolveTaskId();
    if (!taskId) {
      setError("task_id를 확인할 수 없어 Reset을 진행할 수 없습니다.");
      return;
    }

    try {
      setResetPending((prev) => ({ ...prev, [id]: true }));
      setError(null);

      if (id === "patient-disease-info") {
        await clearDrdPatientInfo({ task_id: taskId });
      } else if (id === "filter") {
        await clearDrdGroupManageFilter({ task_id: taskId });
      } else if (id === "high-risk-subgroup") {
        await clearDrdSubgroups({ task_id: taskId });
      } else if (id === "medical-history") {
        await clearDrdMedicalHistory({ task_id: taskId });
      }

      setCompleted(id, false);
      markNeedsSync();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Reset 처리에 실패했습니다.");
    } finally {
      setResetPending((prev) => ({ ...prev, [id]: false }));
    }
  };

  useEffect(() => {
    const rawTaskId =
      searchParams.get("taskId") ?? searchParams.get("task_id") ?? searchParams.get("test_id");
    const requestedTaskId = rawTaskId?.trim() || undefined;
    const diseaseId = searchParams.get("disease_id") ?? undefined;
    const dataId = searchParams.get("data_id") ?? undefined;
    const shouldFetch =
      !hasHydrated || needsSync || (Boolean(requestedTaskId) && hydratedTaskId !== requestedTaskId);

    if (!shouldFetch) {
      const stableTaskId = requestedTaskId ?? hydratedTaskId;
      if (stableTaskId && simulationTaskId !== stableTaskId) {
        setTaskId(stableTaskId);
      }
      return;
    }

    let isCancelled = false;

    const loadGroupManageInfo = async () => {
      setIsPageFetching(true);
      try {
        let resolvedTaskId = requestedTaskId;

        try {
          const response = await getGroupManageInfo({
            entity_type: "drd",
            ...(requestedTaskId ? { task_id: requestedTaskId } : {}),
            ...(diseaseId ? { disease_id: diseaseId } : {}),
            ...(dataId ? { data_id: dataId } : {}),
          });
          if (isCancelled) return;
          resolvedTaskId = response.data?.task_id || resolvedTaskId;
        } catch (lookupError) {
          if (requestedTaskId) {
            throw lookupError;
          }
        }

        if (!resolvedTaskId) {
          const diseaseIdNum = Number(diseaseId);
          const dataIdNum = Number(dataId);
          if (!Number.isFinite(diseaseIdNum) || !Number.isFinite(dataIdNum)) {
            throw new Error("task 생성에 필요한 disease_id/data_id를 확인할 수 없습니다.");
          }

          const insertedResponse = await insertGroupManageTask({
            entity_type: "drd",
            body: {
              disease_id: diseaseIdNum,
              data_id: dataIdNum,
              label: "DRD Auto Task",
              condition_raw_version: 1,
              condition_raw_json: serializeDrdFilterConditionRawJson({
                inclusion: [],
                exclusion: [],
              }),
            },
          });
          if (isCancelled) return;

          const insertedTaskId =
            (insertedResponse as { data?: { task_id?: unknown }; task_id?: unknown }).data
              ?.task_id ??
            (insertedResponse as { data?: { task_id?: unknown }; task_id?: unknown }).task_id;

          if (typeof insertedTaskId === "string" && insertedTaskId.trim()) {
            resolvedTaskId = insertedTaskId.trim();
          }
        }

        if (!resolvedTaskId) {
          throw new Error("유효한 task_id를 확보하지 못했습니다.");
        }

        if (resolvedTaskId) {
          if (simulationTaskId !== resolvedTaskId) {
            setTaskId(resolvedTaskId);
          }
        }

        const summaryResponse = await getDrdTaskSummary({ task_id: resolvedTaskId });
        if (isCancelled) return;

        const hydration = mapDrdTaskSummaryToDefaultSettingHydration(summaryResponse.data, {
          taskId: resolvedTaskId,
        });
        hydrateFromApi(hydration);
      } catch (error) {
        if (isCancelled) return;
        setError(error instanceof Error ? error.message : "Group Manage 조회에 실패했습니다.");
      } finally {
        if (!isCancelled) {
          setIsPageFetching(false);
        }
      }
    };

    void loadGroupManageInfo();

    return () => {
      isCancelled = true;
    };
  }, [
    searchParams,
    hasHydrated,
    hydratedTaskId,
    needsSync,
    simulationTaskId,
    setError,
    setTaskId,
    hydrateFromApi,
  ]);

  return (
    <AppLayout headerType="drd" drdStep={1} scaleMode="none">
      <Loading
        isLoading={isLoading || isPageFetching || Object.values(resetPending).some(Boolean)}
      />
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
        {/* 타이틀 */}
        <div style={{ flexShrink: 0, padding: "0 12px" }}>
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
            {allCompleted ? "Setup Complete" : "Setup Required"}
          </span>
        </div>

        {/* {메인 레이아웃/Main Layout} */}
        {/* 메인 레이아웃: flex-1로 전체 가용 높이 채움 */}
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
            className="drd-left-pannel flex w-[380px] flex-shrink-0 flex-col gap-[12px] overflow-hidden rounded-[36px]"
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
              <div className="relative z-10 flex h-full flex-col">
                {/* 상단: filtered patients + Add data */}
                <div className="mb-[24px] flex items-start justify-between">
                  <div className="flex flex-col gap-[4px]">
                    <span className="font-['Inter'] text-[15px] leading-[1.18] font-semibold tracking-[-0.36px] text-white">
                      filtered patients
                    </span>
                    <span className="font-['Inter'] text-[36px] leading-none font-semibold tracking-[-1.08px] text-white">
                      {animatedRatio}%
                    </span>
                  </div>

                  {/* Add data 버튼 */}
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

                {/* 프로그레스 바 (상단 블록 바로 아래 24px) */}
                <div
                  className="relative h-[18px] w-full rounded-[12px]"
                  style={{ background: "rgba(255,255,255,0.2)" }}
                >
                  <div
                    className="absolute top-0 left-0 h-full overflow-hidden rounded-[12px] bg-[#f06600]"
                    style={{ width: `${animatedRatio}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-end pr-[11.13px]">
                    <span
                      className="text-right font-['Inter'] text-[13px] leading-[1.18] font-semibold tracking-[-0.36px] text-white"
                      style={{ textShadow: "0 0 6px rgba(0,0,0,0.4)" }}
                    >
                      {finalCohort.toLocaleString()}/{initialCohort.toLocaleString()} patients
                    </span>
                  </div>
                </div>

                {/* OPMD 섹션: 카드 바닥에 붙음 */}
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
                        {initialCohort.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-[3px]">
                      <span className="font-['Inter'] text-[10px] leading-[1.1] font-semibold tracking-[-0.4px] text-white">
                        Final Cohort
                      </span>
                      <span className="w-[86px] font-['Inter'] text-[15px] leading-[1.15] font-semibold tracking-[-0.75px] text-white">
                        {finalCohort.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* {설정 단계/Setup Steps} */}
            {/* Setup Steps 하단 영역 (Light Gray/Blue Glass Overlay) */}
            <div className="flex min-h-0 flex-1 flex-col gap-[8px] overflow-x-hidden overflow-y-auto rounded-[24px] bg-[rgba(255,255,255,0.6)] p-[10px]">
              {setupSteps.map((step) => {
                const isCompleted = completedItems[step.id as DefaultSettingId];
                return (
                  <button
                    key={step.id}
                    onClick={() => router.push(buildDrdPathWithContext(stepRoutes[step.id]))}
                    className="flex w-full shrink-0 cursor-pointer flex-col rounded-[24px] border-none p-[16px] pt-[12px] pb-[16px] text-left transition-colors duration-150 hover:bg-[#f9f8fc] active:bg-[#efeff4]"
                    style={{ background: "transparent", justifyContent: "center", height: 100 }}
                  >
                    <div className="flex items-center gap-[18px]">
                      {isCompleted ? (
                        <div className="flex shrink-0 items-center justify-center">
                          <step.IconOrangeComponent size={24} />
                        </div>
                      ) : (
                        <div className="flex shrink-0 items-center justify-center">
                          <step.IconComponent size={24} />
                        </div>
                      )}
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
                );
              })}
            </div>
          </div>

          {/* {오른쪽 패널/Right Panel} */}
          {/* ── 오른쪽 패널 ──────────────────────────────────────────────── */}
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
            {/* {2x2 그리드/2x2 Grid} */}
            {/* 2×2 그리드 */}
            <div
              style={{
                flex: 1,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gridTemplateRows: "1fr 1fr",
                gap: 12,
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              {dynamicSettingItems.map((item) =>
                completedItems[item.id] ? (
                  <CompletedCard
                    key={item.id}
                    item={item}
                    onReset={() => {
                      void handleCardReset(item.id);
                    }}
                    onEdit={() => router.push(buildDrdPathWithContext(settingRoutes[item.id]))}
                  />
                ) : (
                  <InitialCard
                    key={item.id}
                    item={item}
                    onClick={() => router.push(buildDrdPathWithContext(settingRoutes[item.id]))}
                  />
                )
              )}
            </div>

            {/* {하단 버튼/Bottom Buttons} */}
            {/* 하단 버튼 */}
            <div
              style={{
                flexShrink: 0,
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                alignItems: "center",
              }}
            >
              <button
                onClick={() => setShowSaveModal(true)}
                style={{
                  height: 40,
                  paddingLeft: 28,
                  paddingRight: 28,
                  borderRadius: 36,
                  background: "#787776",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "Inter",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#ffffff",
                  letterSpacing: "-0.51px",
                }}
              >
                Save Progress
              </button>
              <button
                onClick={() => router.push(buildDrdPathWithContext("/drd/simulation-setting"))}
                style={{
                  height: 40,
                  paddingLeft: 24,
                  paddingRight: 24,
                  borderRadius: 36,
                  background: "#F06600",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "Inter",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#ffffff",
                  letterSpacing: "-0.51px",
                }}
              >
                Apply Settings
              </button>
            </div>
          </div>
        </div>

        {/* 데모 토글 */}
        <div style={{ display: "none" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {dynamicSettingItems.map((item: any) => (
              <button
                key={item.id}
                onClick={() =>
                  setCompleted(
                    item.id as DefaultSettingId,
                    !completedItems[item.id as DefaultSettingId]
                  )
                }
                style={{
                  fontSize: 9,
                  padding: "3px 8px",
                  background: completedItems[item.id as DefaultSettingId]
                    ? "#F06600"
                    : "rgba(255,255,255,0.8)",
                  color: completedItems[item.id as DefaultSettingId] ? "#fff" : "#333",
                  border: "1px solid #ccc",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                {item.title.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save Simulation 모달 */}
      {showSaveModal && (
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
          onClick={() => setShowSaveModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              width: 380,
              borderRadius: 20,
              padding: "24px 20px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 20,
              overflow: "hidden",
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
            }}
          >
            {/* 글래스 배경 */}
            <div
              aria-hidden="true"
              style={{ position: "absolute", inset: 0, borderRadius: 20, pointerEvents: "none" }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.6)",
                  mixBlendMode: "color-dodge",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.88)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 20,
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
                gap: 20,
              }}
            >
              <p
                style={{
                  fontFamily: "Inter",
                  fontWeight: 600,
                  fontSize: 18,
                  color: "#484646",
                  letterSpacing: "-0.54px",
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                Save Simulation
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <p
                    style={{
                      fontFamily: "Inter",
                      fontWeight: 500,
                      fontSize: 13,
                      color: "#484646",
                      letterSpacing: "-0.39px",
                      lineHeight: 1.2,
                      margin: 0,
                    }}
                  >
                    Simulation Name *
                  </p>
                  <input
                    type="text"
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    placeholder="Write a title"
                    style={{
                      height: 40,
                      borderRadius: 12,
                      border: "none",
                      background: "#e2e1e5",
                      padding: "0 14px",
                      fontFamily: "Inter",
                      fontWeight: 500,
                      fontSize: 13,
                      color: "#484646",
                      letterSpacing: "-0.39px",
                      outline: "none",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <p
                    style={{
                      fontFamily: "Inter",
                      fontWeight: 500,
                      fontSize: 13,
                      color: "#484646",
                      letterSpacing: "-0.39px",
                      lineHeight: 1.2,
                      margin: 0,
                    }}
                  >
                    Description
                  </p>
                  <input
                    type="text"
                    value={simDesc}
                    onChange={(e) => setSimDesc(e.target.value.slice(0, 30))}
                    placeholder="Enter a Description (max 30 characters)"
                    style={{
                      height: 40,
                      borderRadius: 12,
                      border: "none",
                      background: "#e2e1e5",
                      padding: "0 14px",
                      fontFamily: "Inter",
                      fontWeight: 500,
                      fontSize: 13,
                      color: "#484646",
                      letterSpacing: "-0.39px",
                      outline: "none",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
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
                onClick={() => setShowSaveModal(false)}
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
                Close
              </button>
              <button
                type="button"
                onClick={handleSaveSimulation}
                disabled={!simName.trim()}
                style={{
                  width: 112,
                  height: 44,
                  borderRadius: 36,
                  border: "none",
                  cursor: simName.trim() ? "pointer" : "not-allowed",
                  fontFamily: "Inter",
                  fontWeight: 600,
                  fontSize: 15,
                  color: simName.trim() ? "#262255" : "#aaa",
                  letterSpacing: "-0.45px",
                  background: "rgba(255,255,255,0.92)",
                  boxShadow: "0px 2px 8px 0px rgba(0,0,0,0.10), 0px 0px 0px 0.5px rgba(0,0,0,0.06)",
                  backdropFilter: "blur(8px)",
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default function DefaultSettingPage() {
  return (
    <React.Suspense fallback={null}>
      <DefaultSettingPageContent />
    </React.Suspense>
  );
}
