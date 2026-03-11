"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import CustomCheckbox from "@/components/ui/custom-checkbox";
import DropdownCell from "@/components/ui/dropdown-cell";
import SolidButton from "@/components/ui/solid-button";
import InputCell from "@/components/ui/input-cell";

/**
 * TSI Step 2: Filter (Cohort Filter Setup)
 * 코호트 필터 설정 페이지 — 피처 목록에서 Inclusion/Exclusion 조건을 구성하는 인터페이스.
 *
 * Cohort Filter Setup page — allows building inclusion/exclusion criteria
 * using feature list with operator and value dropdowns per section row.
 *
 * 피그마: [FLT-002] 시뮬레이션 데이터 변경하기-필터링-1
 */

// ── SVG 아이콘 컴포넌트들 / SVG icon components ─────────────────────────────

/** 행 추가 버튼(+)에 사용되는 플러스 아이콘 SVG / Plus icon for add row button */
function IconPlus({ size = 16, color = "#c6c5c9" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 3V13M3 8L13 8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** 휴지통 아이콘 / Trash icon for delete action */
function IconTrash({ size = 24, color = "#c6c5c9" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M4 6H20M10 11V17M14 11V17M5 6L6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19L19 6M9 6V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 파일 다운로드 아이콘 / File download icon */
function IconFileDownload({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 4V16M12 16L8 12M12 16L16 12M4 20H20"
        stroke="#c6c5c9"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 폴더+플러스 아이콘 / Folder-plus icon */
function IconFolderPlus({ size = 24, color = "var(--text-header)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M3 7V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V9C21 7.9 20.1 7 19 7H11L9 5H5C3.9 5 3 5.9 3 7Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 11V17M15 14H9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Feature List 검색 입력창 왼쪽에 표시되는 돋보기 아이콘 / Search icon for feature list */
function IconSearch({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="6" stroke="#C7C5C9" strokeWidth="1.5" />
      <line x1="13.5" y1="13.5" x2="17" y2="17" stroke="#C7C5C9" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** 섹션 헤더 열림 상태 아이콘 / Chevron-down icon for open section */
function IconChevronDown({ size = 16, color = "#484646" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 10" fill="none">
      <path d="M1 1L8 8L15 1" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 섹션 헤더 닫힘 상태 아이콘 / Chevron-right icon for closed section */
function IconChevronRight({ size = 16, color = "#484646" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 16" fill="none">
      <path d="M1 1L8 8L1 15" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// DropdownCell은 @/components/ui/dropdown-cell 에서 import

// ── 타입 정의 / Type definitions ─────────────────────────────────────────────

/** 섹션 내 하위 조건 행 / Sub-row condition within a section */
type SubRow = { logic: string; feature: string; op: string; value: string };

/** 필터 섹션 / Filter section */
type Section = {
  id: number;
  name: string;
  feature: string;
  op: string;
  value: string;
  subRows?: SubRow[];
};

// ── 상수 데이터 / Constant data ───────────────────────────────────────────────

/** 피처 옵션 목록 / Feature options */
const featureOptions = ["AGE", "WEIGHT [kg]", "MMTOTSCORE", "CDRTOT", "CITY", "GENDER", "ALC", "RACE", "DRUG", "HEIGHT", "EDU"];

/** 연산자 옵션 목록 / Operator options */
const opOptions = [">", ">=", "<", "<=", "=", "!="];

/** 논리 연산자 옵션 / Logic operator options */
const logicOptions = ["And", "Or"];

/** Feature List 카테고리 목록 / Feature list categories */
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

/** INFO 카테고리 내 피처 목록 / Features inside INFO category */
const infoFeatures = ["GENDER", "AGE", "ALC", "RACE", "DRUG", "HEIGHT", "WEIGHT", "EDU", "CAORBD", "TOB"];

/** 새 빈 섹션 생성 헬퍼 / Creates a new empty section */
function makeEmptySection(id: number): Section {
  return { id, name: `Section ${id}`, feature: "", op: "", value: "" };
}

// ── 메인 페이지 컴포넌트 / Main page component ───────────────────────────────

export default function TSIFilterPage() {
  const router = useRouter();
  // ── 탭 상태 (Inclusion / Exclusion) / Active tab state ────────────────────
  const [activeTab, setActiveTab] = useState<"Inclusion" | "Exclusion">("Inclusion");

  // ── Feature List 검색 상태 / Feature list search state ────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [searchDropdownPos, setSearchDropdownPos] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 0,
  });
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  const searchDropdownRef = React.useRef<HTMLDivElement>(null);

  // ── 카테고리 열림/선택 상태 / Category open/active state ──────────────────
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    Object.fromEntries(featureCategories.map((c) => [c.name, c.open ?? false]))
  );
  const [activeCat, setActiveCat] = useState<string>("");
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  // ── 섹션 상태 (Inclusion / Exclusion 각각 독립적으로 관리)
  //    Section state (managed independently per tab)
  const [inclusionSections, setInclusionSections] = useState<Section[]>([makeEmptySection(1)]);
  const [exclusionSections, setExclusionSections] = useState<Section[]>([makeEmptySection(1)]);
  const [inclusionOpenSections, setInclusionOpenSections] = useState<Record<number, boolean>>({ 1: true });
  const [exclusionOpenSections, setExclusionOpenSections] = useState<Record<number, boolean>>({ 1: true });

  // ── 체크된 행 상태 (삭제 대상) / Checked rows state (for deletion) ─────────
  const [checkedRows, setCheckedRows] = useState<Record<string, boolean>>({});

  // ── 현재 탭의 섹션/상태 레퍼런스 / Current tab's section/state references ──
  const currentSections = activeTab === "Inclusion" ? inclusionSections : exclusionSections;
  const currentOpenSections = activeTab === "Inclusion" ? inclusionOpenSections : exclusionOpenSections;
  const setCurrentSections = activeTab === "Inclusion" ? setInclusionSections : setExclusionSections;
  const setCurrentOpenSections = activeTab === "Inclusion" ? setInclusionOpenSections : setExclusionOpenSections;

  /** 삭제 버튼 활성화 여부 / Whether delete button is enabled */
  const isDeleteEnabled = Object.values(checkedRows).some(Boolean);

  // ── 검색 결과 계산 (메모이즈) / Computed search results (memoized) ─────────
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: { category: string; feature: string }[] = [];
    featureCategories.forEach((cat) => {
      infoFeatures.forEach((f) => {
        if (f.toLowerCase().includes(q)) results.push({ category: cat.name, feature: f });
      });
    });
    return results;
  }, [searchQuery]);

  /** 카테고리별 그룹핑된 검색 결과 / Search results grouped by category */
  const groupedSearchResults = React.useMemo(() => {
    const groups: Record<string, string[]> = {};
    searchResults.forEach(({ category, feature }) => {
      if (!groups[category]) groups[category] = [];
      if (!groups[category].includes(feature)) groups[category].push(feature);
    });
    return groups;
  }, [searchResults]);

  // ── 검색 드롭다운 외부 클릭 닫기 / Close search dropdown on outside click ──
  React.useEffect(() => {
    if (!searchDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        !searchContainerRef.current?.contains(target) &&
        !searchDropdownRef.current?.contains(target)
      ) {
        setSearchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [searchDropdownOpen]);

  /** 체크된 행 삭제 / Delete checked rows */
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

    // 첫 번째 섹션은 삭제하지 않고 초기화 / Reset first section instead of deleting
    const firstSectionId =
      currentSections.length > 0 ? Math.min(...currentSections.map((s) => s.id)) : -1;

    setCurrentSections((prev) =>
      prev
        .filter((s) => !checkedMainIds.has(s.id) || s.id === firstSectionId)
        .map((s) => {
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

  /** 섹션 접기/펼치기 토글 / Toggle section open/collapsed */
  const toggleSection = (id: number) => {
    setCurrentOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  /** 새 섹션 추가 / Add new section */
  const addSection = () => {
    const newId =
      currentSections.length > 0 ? Math.max(...currentSections.map((s) => s.id)) + 1 : 1;
    setCurrentSections((prev) => [...prev, makeEmptySection(newId)]);
    setCurrentOpenSections((prev) => ({ ...prev, [newId]: true }));
  };

  /** 섹션 메인 행 필드 업데이트 / Update section main row field */
  const updateSection = (id: number, field: keyof Section, value: string) => {
    setCurrentSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  /** 섹션에 하위 조건 행 추가 / Add sub-condition row to section */
  const addSubRow = (sectionId: number) => {
    setCurrentSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        return {
          ...s,
          subRows: [...(s.subRows ?? []), { logic: "", feature: "", op: "", value: "" }],
        };
      })
    );
  };

  /** 하위 조건 행 필드 업데이트 / Update sub-row field */
  const updateSubRow = (
    sectionId: number,
    rIdx: number,
    field: keyof SubRow,
    value: string
  ) => {
    setCurrentSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const subRows = (s.subRows ?? []).map((r, i) =>
          i === rIdx ? { ...r, [field]: value } : r
        );
        return { ...s, subRows };
      })
    );
  };

  /** 카테고리 열기/닫기 (단일 열림 유지) / Toggle category (single open at a time) */
  const toggleCategory = (name: string) => {
    setOpenCategories((prev) => {
      const isCurrentlyOpen = prev[name];
      const allClosed = Object.fromEntries(Object.keys(prev).map((k) => [k, false]));
      return { ...allClosed, [name]: !isCurrentlyOpen };
    });
  };

  /** 유효한 행이 하나라도 있는지 확인 / Check if any section has valid row */
  const hasValidRow = (sections: Section[]) =>
    sections.some((s) => s.feature && s.op && s.value);

  /** Confirm 버튼 활성화 여부 / Whether confirm button is enabled */
  const isConfirmEnabled = hasValidRow(inclusionSections) || hasValidRow(exclusionSections);

  /**
   * 섹션 목록에서 수식 미리보기용 라인 배열 추출
   * Extract lines for formula preview from section list
   */
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

  // ── 수식 미리보기용 라인 계산 / Compute formula preview lines ───────────────
  const inclusionLines = extractLines(inclusionSections);
  const exclusionLines = extractLines(exclusionSections);
  const bothHaveData = inclusionLines.length > 0 && exclusionLines.length > 0;

  /**
   * 수식 라인 렌더링 헬퍼 — 레이블 + 논리 연산자 강조 표시
   * Renders formula lines with label and highlighted logic operators
   */
  const renderLines = (
    lines: { logic: string | null; text: string }[],
    label: string
  ) => (
    <div className="text-body4m text-neutral-50 flex flex-col gap-[4px]">
      {lines.map((line, i) => (
        <p key={i} className="m-0">
          {i === 0 ? (
            <>
              <span className="text-primary-15 font-semibold">{label}</span>
              {" [ \u00A0"}
              {line.text}
            </>
          ) : (
            <>
              <span className="text-primary-40 font-bold">{line.logic}</span>
              {" "}
              {line.text}
            </>
          )}
          {i === lines.length - 1 && <> &nbsp;]</>}
        </p>
      ))}
    </div>
  );

  return (
    <AppLayout headerType="tsi" scaleMode="fit">

      {/* ── 외부 래퍼 / Outer wrapper ──────────────────────────────────── */}
      <div
        className="flex flex-col w-full h-full overflow-hidden gap-6"
      >

        {/* ── 1. 페이지 타이틀 / Page title ──────────────────────────── */}
        <div className="shrink-0 px-1">
          <h1 className="m-0 font-['Poppins',_Inter,_sans-serif] font-semibold text-neutral-10 text-[42px] [@media(max-width:1470px)]:text-[36px] leading-[1.1] tracking-[-1.5px]">
            Target Subgroup Identification
          </h1>
          <span className="font-semibold text-neutral-50" style={{ fontFamily: "Inter", fontSize: 16, letterSpacing: "-0.48px" }}>
            Cohort Filter Setup
          </span>
        </div>

        {/* ── 2. 글래스 메인 컨텐츠 영역 / Glass main content area ───── */}
        <div
          className="figma-nine-slice figma-home-panel-middle flex-1 min-h-0 flex flex-col gap-3"
        >

          {/* ── 2-A. 상단 헤더 (Filter 제목 + Go to Simulation 버튼)
                     Top header (Filter title + Go to Simulation button) ── */}
          <div
            className="shrink-0 px-[8px] flex items-center justify-between h-[40px]"
            style={{ paddingTop: 0, paddingBottom: 0, paddingRight: 0 }}
          >
            <h2 className="text-body1 text-primary-15 m-0">
              Filter
            </h2>
            <div className="flex items-center gap-[12px]">
              {/* Go to Simulation 버튼 → Patients Summary 페이지 이동 */}
              <button
                onClick={() => router.push("/tsi/patients-summary")}
                className="btn-tsi btn-tsi-primary gap-2"
                style={{ paddingRight: 18 }}
              >
                Go to Simulation
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  style={{ flexShrink: 0 }}
                >
                  <path
                    d="M3 8L13 8M10 4L14 8L10 12"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* ── 2-B. 좌우 분할 레이아웃 (Feature List | 설정 영역)
                     Two-column layout (Feature List | Setting area) ───── */}
          <div className="flex flex-row flex-1 min-h-0 gap-[12px]">

            {/* ── 2-B-1. 왼쪽: Feature List 사이드바 / Left: Feature list sidebar ── */}
            <div className="w-[272px] shrink-0 flex flex-col gap-[12px]">
              <div className="px-[4px]">
                <span className="text-body2m text-neutral-30">
                  Feature List
                </span>
              </div>

              <div className="flex-1 bg-white rounded-[20px] overflow-hidden min-h-0">
              <div className="flex flex-col overflow-y-auto h-full">

                {/* 검색 입력 필드 / Search input field */}
                <div ref={searchContainerRef} className="relative shrink-0">
                  <div
                    className="h-[48px] bg-white flex items-center px-[18px] gap-[8px]"
                    style={{ borderBottom: "1px solid #c7c5c9" }}
                  >
                    <IconSearch size={20} />
                    <input
                      type="text"
                      placeholder="Search features"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (e.target.value.trim()) {
                          const rect = searchContainerRef.current?.getBoundingClientRect();
                          if (rect) {
                            setSearchDropdownPos({
                              top: rect.bottom + 4,
                              left: rect.left,
                              width: rect.width,
                            });
                          }
                          setSearchDropdownOpen(true);
                        } else {
                          setSearchDropdownOpen(false);
                        }
                      }}
                      onFocus={() => {
                        if (searchQuery.trim()) {
                          const rect = searchContainerRef.current?.getBoundingClientRect();
                          if (rect) {
                            setSearchDropdownPos({
                              top: rect.bottom + 4,
                              left: rect.left,
                              width: rect.width,
                            });
                          }
                          setSearchDropdownOpen(true);
                        }
                      }}
                      style={{
                        flex: 1,
                        border: "none",
                        outline: "none",
                        background: "transparent",
                        fontFamily: "Inter",
                        fontWeight: 500,
                        fontSize: 15,
                        color: "var(--text-primary)",
                        letterSpacing: "-0.45px",
                        lineHeight: "normal",
                        paddingTop: 0,
                        paddingBottom: 0,
                        display: "block",
                      }}
                      className="placeholder:text-neutral-80"
                    />
                  </div>

                  {/* 검색 결과 포탈 드롭다운 / Search results portal dropdown */}
                  {searchDropdownOpen &&
                    typeof document !== "undefined" &&
                    createPortal(
                      <div
                        ref={searchDropdownRef}
                        className="rounded-[18px]"
                        style={{
                          position: "fixed",
                          top: searchDropdownPos.top,
                          left: searchDropdownPos.left,
                          width: searchDropdownPos.width,
                          background: "white",
                          zIndex: 9999,
                          maxHeight: 268,
                          overflowY: "auto",
                          boxShadow: "0px 4px 16px rgba(0,0,0,0.125)",
                        }}
                      >
                        {Object.keys(groupedSearchResults).length === 0 ? (
                          <div
                            style={{
                              height: 48,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "Inter",
                                fontWeight: 500,
                                fontSize: 13,
                                color: "#aaaaad",
                                letterSpacing: "-0.39px",
                              }}
                            >
                              No results found
                            </span>
                          </div>
                        ) : (
                          Object.entries(groupedSearchResults).map(
                            ([category, featureList], catIdx, arr) => (
                              <div
                                key={category}
                                style={{
                                  borderBottom:
                                    catIdx < arr.length - 1
                                      ? "1px solid #EBEBEB"
                                      : "none",
                                }}
                              >
                                <div style={{ paddingTop: 4, paddingLeft: 8, paddingRight: 8 }}>
                                  <span
                                    style={{
                                      fontFamily: "Inter",
                                      fontWeight: 500,
                                      fontSize: 10,
                                      color: "#aaaaad",
                                      letterSpacing: "-0.27px",
                                      lineHeight: 1.05,
                                    }}
                                  >
                                    {category}
                                  </span>
                                </div>
                                {featureList.map((f, fIdx) => (
                                  <div
                                    key={f}
                                    onMouseDown={() => {
                                      setActiveFeature(f);
                                      setActiveCat(category);
                                      setSearchDropdownOpen(false);
                                    }}
                                    style={{
                                      height: 28,
                                      display: "flex",
                                      alignItems: "center",
                                      paddingLeft: 8,
                                      paddingRight: 8,
                                      borderTop: fIdx === 0 ? "none" : "1px solid #EBEBEB",
                                      cursor: "pointer",
                                    }}
                                    onMouseEnter={(e) => {
                                      (e.currentTarget as HTMLDivElement).style.background =
                                        "rgba(0,0,0,0.04)";
                                    }}
                                    onMouseLeave={(e) => {
                                      (e.currentTarget as HTMLDivElement).style.background =
                                        "transparent";
                                    }}
                                  >
                                    <span
                                      style={{
                                        flex: 1,
                                        fontFamily: "Inter",
                                        fontWeight: 500,
                                        fontSize: 13,
                                        color: "var(--text-secondary)",
                                        letterSpacing: "-0.48px",
                                        lineHeight: 1.1,
                                      }}
                                    >
                                      {f}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )
                          )
                        )}
                      </div>,
                      document.body
                    )}
                </div>

                {/* 카테고리 + 피처 목록 / Category + feature list */}
                {featureCategories.map((cat) => {
                  const isOpen = openCategories[cat.name];
                  const isActive = activeCat === cat.name;
                  return (
                    <div
                      key={cat.name}
                      className="flex flex-col border-b border-neutral-80 last:border-none"
                    >
                      {/* 카테고리 헤더 / Category header */}
                      <div
                        onClick={() => {
                          toggleCategory(cat.name);
                          setActiveCat(cat.name);
                        }}
                        className={`flex items-center h-[48px] px-[18px] gap-[10px] cursor-pointer select-none ${
                          isActive ? "bg-primary-15" : "hover:bg-[#f9f8fc]"
                        }`}
                      >
                        <div className="shrink-0 w-[16px] h-[16px] flex items-center justify-center">
                          {isOpen ? (
                            <IconChevronDown size={14} color={isActive ? "#ffffff" : "#484646"} />
                          ) : (
                            <IconChevronRight size={14} color={isActive ? "#ffffff" : "#484646"} />
                          )}
                        </div>
                        <span
                          className={`text-body4 ${
                            isActive ? "text-white" : "text-neutral-30"
                          }`}
                        >
                          {cat.name}
                        </span>
                      </div>

                      {/* 피처 목록 (카테고리 열릴 때만 표시) / Feature list (shown when category is open) */}
                      {isOpen && (
                        <div className="flex flex-col overflow-y-auto scrollbar-hide">
                          {infoFeatures.map((f) => {
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
                                    ? "bg-[#efeff4] text-primary-15 font-semibold"
                                    : isFeatureHovered
                                      ? "bg-[#f9f8fc] text-neutral-30"
                                      : "text-neutral-50"
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
            {/* ── Feature List 사이드바 닫기 / End feature list sidebar ── */}

            {/* ── 2-B-2. 오른쪽: 메인 설정 영역 / Right: Main setting area ── */}
            <div className="flex-1 rounded-[20px] bg-[rgba(255,255,255,0.6)] p-[12px] overflow-hidden min-h-0">
            <div className="flex flex-col gap-[12px] overflow-y-auto h-full">

              {/* ── 탭 바 + 액션 버튼 / Tab bar + action buttons ─────── */}
              <div className="flex justify-between items-center shrink-0">

                {/* Inclusion / Exclusion 탭 / Inclusion / Exclusion tabs */}
                <div className="bg-white p-[4px] rounded-[18px] flex">
                  <button
                    onClick={() => {
                      setActiveTab("Inclusion");
                      setCheckedRows({});
                    }}
                    className={`h-[36px] px-[18px] rounded-[36px] border-none text-body4 cursor-pointer transition-all ${
                      activeTab === "Inclusion" ? "bg-primary-15 text-white" : "bg-transparent text-neutral-30"
                    }`}
                  >
                    Inclusion
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("Exclusion");
                      setCheckedRows({});
                    }}
                    className={`h-[36px] px-[18px] rounded-[36px] border-none text-body4 cursor-pointer transition-all ${
                      activeTab === "Exclusion" ? "bg-primary-15 text-white" : "bg-transparent text-neutral-30"
                    }`}
                  >
                    Exclusion
                  </button>
                </div>

                {/* 아이콘 버튼 + Add Section 버튼 / Icon buttons + Add Section */}
                <div className="flex items-center gap-[12px]">
                  <div className="flex gap-[4px]">
                    {/* 파일 다운로드 버튼 / File download button */}
                    <div
                      className="relative size-[48px] flex items-center justify-center cursor-pointer "
                      style={{ flexShrink: 0 }}
                    >
                      <div
                        className="rounded-[36px]"
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(255,255,255,0.6)",
                          boxShadow: "0px 0px 2px rgba(0,0,0,0.05)",
                          border: "1px solid rgba(0,0,0,0.10)",
                        }}
                      />
                      <IconFileDownload size={24} />
                    </div>

                    {/* 폴더 버튼 (비활성) / Folder button (inactive) */}
                    <div
                      className="relative size-[48px] flex items-center justify-center"
                      style={{ cursor: "default", flexShrink: 0 }}
                    >
                      <div
                        className="rounded-[36px]"
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(255,255,255,0.6)",
                          boxShadow: "0px 0px 2px rgba(0,0,0,0.05)",
                          border: "1px solid rgba(0,0,0,0.10)",
                        }}
                      />
                      <div className="relative z-10">
                        <IconFolderPlus size={24} color="#c6c5c9" />
                      </div>
                    </div>

                    {/* 삭제 버튼 / Delete button */}
                    <div
                      className="relative size-[48px] flex items-center justify-center"
                      style={{ cursor: isDeleteEnabled ? "pointer" : "default", flexShrink: 0 }}
                      onClick={deleteCheckedRows}
                    >
                      <div
                        className="rounded-[36px]"
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(255,255,255,0.6)",
                          boxShadow: "0px 0px 2px rgba(0,0,0,0.05)",
                          border: "1px solid rgba(0,0,0,0.10)",
                        }}
                      />
                      <div className="relative z-10">
                        <IconTrash size={24} color={isDeleteEnabled ? "var(--text-header)" : "#c6c5c9"} />
                      </div>
                    </div>
                  </div>

                  {/* Add Section 버튼 / Add Section button */}
                  <div
                    className="relative h-[48px] px-[20px] rounded-[96px] flex items-center gap-[6px] cursor-pointer"
                    style={{ flexShrink: 0 }}
                    onClick={addSection}
                  >
                    <div
                      className="rounded-full"
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(255,255,255,0.6)",
                        boxShadow: "0px 0px 2px rgba(0,0,0,0.05)",
                        border: "1px solid rgba(0,0,0,0.10)",
                      }}
                    />
                    <span className="relative z-10 text-body4 text-primary-15">
                      Add Section
                    </span>
                    <div className="relative z-10">
                      <IconPlus size={16} color="var(--text-header)" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ── 섹션 목록 / Section list ──────────────────────────── */}
              <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-[14px]">
                {currentSections.map((section: Section) => {
                  const isSectionOpen = currentOpenSections[section.id];
                  return (
                    <div key={section.id} className="bg-white rounded-[8px] flex flex-col">

                      {/* 섹션 헤더 (클릭 시 접기/펼치기) / Section header (click to toggle) */}
                      <div
                        className={`h-[46px] flex items-center px-[21px] gap-[10px] cursor-pointer select-none hover:bg-[#fdfdfd] rounded-[8px] transition-colors ${
                          isSectionOpen ? "rounded-b-none" : ""
                        }`}
                        style={isSectionOpen ? { borderBottom: "1.5px solid #c7c5c9" } : {}}
                        onClick={() => toggleSection(section.id)}
                      >
                        <div
                          className={`shrink-0 transition-transform duration-200 ${
                            isSectionOpen ? "rotate-0" : "-rotate-90"
                          }`}
                        >
                          <IconChevronDown size={14} color="#313030" />
                        </div>
                        <span className="text-body4 text-neutral-10">
                          {section.name}
                        </span>
                      </div>

                      {/* 섹션 바디 (열렸을 때) / Section body (when open) */}
                      {isSectionOpen && (
                        <>
                          {/* 메인 조건 행 / Main condition row */}
                          <div className="flex items-center h-[50px] px-[24px] gap-[14px]">
                            <CustomCheckbox
                              checked={!!checkedRows[`${section.id}-main`]}
                              onChange={() =>
                                setCheckedRows((prev) => ({
                                  ...prev,
                                  [`${section.id}-main`]: !prev[`${section.id}-main`],
                                }))
                              }
                            />
                            <div className="shrink-0" style={{ flex: "0 0 17%" }} />
                            <DropdownCell
                              value={section.feature || "Feature Select"}
                              flex={3}
                              placeholder={!section.feature}
                              options={featureOptions}
                              onChange={(v) => updateSection(section.id, "feature", v)}
                            />
                            <DropdownCell
                              value={section.op || "Select"}
                              flex={2}
                              placeholder={!section.op}
                              options={opOptions}
                              onChange={(v) => updateSection(section.id, "op", v)}
                            />
                            <InputCell
                              value={section.value}
                              onChange={(v) => updateSection(section.id, "value", v)}
                              size="l"
                              flex={4}
                            />
                            {/* 하위 행 추가 버튼 / Add sub-row button */}
                            <div
                              className="w-[16px] shrink-0 flex items-center justify-center cursor-pointer"
                              onClick={() => addSubRow(section.id)}
                            >
                              <IconPlus size={16} color="#999" />
                            </div>
                          </div>

                          {/* 하위 조건 행들 / Sub-condition rows */}
                          {(section.subRows ?? []).map((row: SubRow, rIdx: number) => (
                            <div
                              key={rIdx}
                              className="flex items-center h-[50px] px-[24px] gap-[14px]"
                              style={{ borderTop: "1.5px solid #c7c5c9" }}
                            >
                              <CustomCheckbox
                                checked={!!checkedRows[`${section.id}-sub-${rIdx}`]}
                                onChange={() =>
                                  setCheckedRows((prev) => ({
                                    ...prev,
                                    [`${section.id}-sub-${rIdx}`]: !prev[`${section.id}-sub-${rIdx}`],
                                  }))
                                }
                              />
                              <DropdownCell
                                value={row.logic || "Select"}
                                flex="0 0 17%"
                                placeholder={!row.logic}
                                options={logicOptions}
                                onChange={(v) => updateSubRow(section.id, rIdx, "logic", v)}
                              />
                              <DropdownCell
                                value={row.feature || "Feature Select"}
                                flex={3}
                                placeholder={!row.feature}
                                options={featureOptions}
                                onChange={(v) => updateSubRow(section.id, rIdx, "feature", v)}
                              />
                              <DropdownCell
                                value={row.op || "Select"}
                                flex={2}
                                placeholder={!row.op}
                                options={opOptions}
                                onChange={(v) => updateSubRow(section.id, rIdx, "op", v)}
                              />
                              <InputCell
                                value={row.value}
                                onChange={(v) => updateSubRow(section.id, rIdx, "value", v)}
                                size="l"
                                flex={4}
                              />
                              {/* 추가 하위 행 버튼 / Add another sub-row */}
                              <div
                                className="w-[16px] shrink-0 flex items-center justify-center cursor-pointer"
                                onClick={() => addSubRow(section.id)}
                              >
                                <IconPlus size={16} color="#999" />
                              </div>
                            </div>
                          ))}
                        </>
                      )}

                    </div>
                  );
                })}
              </div>
              {/* ── 섹션 목록 닫기 / End section list ── */}

              {/* ── 수식 미리보기 / Formula preview ─────────────────────── */}
              <div
                className="bg-white p-[16px] rounded-[8px] shrink-0 min-h-[104px] gap-4"
                style={{ display: "flex" }}
              >
                {bothHaveData ? (
                  <>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {renderLines(inclusionLines, "Inclusion")}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {renderLines(exclusionLines, "Exclusion")}
                    </div>
                  </>
                ) : (
                  <div style={{ flex: 1 }}>
                    {inclusionLines.length > 0 && renderLines(inclusionLines, "Inclusion")}
                    {exclusionLines.length > 0 && renderLines(exclusionLines, "Exclusion")}
                  </div>
                )}
              </div>

            </div>
            </div>
            {/* ── 메인 설정 영역 닫기 / End main setting area ── */}

          </div>
          {/* ── 좌우 분할 레이아웃 닫기 / End two-column layout ── */}

          {/* ── 2-C. 하단 버튼 영역 / Bottom action buttons ─────────── */}
          <div className="shrink-0 flex justify-end gap-[12px]">
            {/* Cancel 버튼 → 이전 페이지 / Cancel: go back */}
            <button
              onClick={() => router.back()}
              className="btn-tsi btn-tsi-secondary"
            >
              Cancel
            </button>

            {/* Confirm 버튼 → Patients Summary 이동 (유효 조건 있을 때만 활성)
                Confirm: navigate to Patients Summary (enabled only with valid conditions) */}
            <button
              disabled={!isConfirmEnabled}
              onClick={() => {
                if (!isConfirmEnabled) return;
                router.push("/tsi/patients-summary");
              }}
              className="btn-tsi btn-tsi-primary"
            >
              Confirm
            </button>
          </div>

        </div>
        {/* ── 글래스 메인 컨텐츠 닫기 / End glass main content ── */}

      </div>
      {/* ── 외부 래퍼 닫기 / End outer wrapper ── */}

    </AppLayout>
  );
}
