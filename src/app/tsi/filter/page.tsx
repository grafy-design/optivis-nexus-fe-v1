"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import CustomCheckbox from "@/components/ui/custom-checkbox";


/** 행 추가 버튼(+)에 사용되는 플러스 아이콘 SVG */
function IconPlus({ size = 16, color = "#c6c5c9" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 3V13M3 8L13 8" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** 휴지통 아이콘 */
function IconTrash({ size = 24, color = "#c6c5c9" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 6H20M10 11V17M14 11V17M5 6L6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19L19 6M9 6V4C9 3.4 9.4 3 10 3H14C14.6 3 15 3.4 15 4V6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 파일 다운로드 아이콘 */
function IconFileDownload({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 4V16M12 16L8 12M12 16L16 12M4 20H20" stroke="#c6c5c9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 폴더+플러스 아이콘 */
function IconFolderPlus({ size = 24, color = "#262255" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 7V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V9C21 7.9 20.1 7 19 7H11L9 5H5C3.9 5 3 5.9 3 7Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 11V17M15 14H9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Feature List 검색 입력창 왼쪽에 표시되는 돋보기 아이콘 */
function IconSearch({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="6" stroke="#C7C5C9" strokeWidth="1.5" />
      <line x1="13.5" y1="13.5" x2="17" y2="17" stroke="#C7C5C9" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

/** 섹션 헤더 열림 상태 아이콘 */
function IconChevronDown({ size = 16, color = "#484646" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 10" fill="none">
      <path d="M1 1L8 8L15 1" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 섹션 헤더 닫힘 상태 아이콘 */
function IconChevronRight({ size = 16, color = "#484646" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 16" fill="none">
      <path d="M1 1L8 8L1 15" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 드롭다운 셀 컴포넌트 */
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
    <div ref={wrapperRef} style={{ position: "relative", width, flex, minWidth: 0, flexShrink: flex ? 1 : 0 }}>
      <div
        ref={triggerRef}
        onClick={handleOpen}
        style={{
          width: "100%", height: 36, background: "#efeff4", borderRadius: 8,
          display: "flex", alignItems: "center", paddingLeft: 12, paddingRight: 8,
          gap: 4, cursor: "pointer", userSelect: "none",
        }}
      >
        <span style={{
          flex: 1, fontFamily: "Inter", fontWeight: 500, fontSize: 15,
          color: placeholder ? "#c6c5c9" : "#484646", letterSpacing: "-0.6px",
          lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {value}
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={open ? "/icons/disclosure/Property 1=Open, Size=18.svg" : "/icons/disclosure/Property 1=Close, Size=18.svg"}
          alt="" width={18} height={18} style={{ flexShrink: 0, display: "block" }}
        />
      </div>
      {open && options && options.length > 0 && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          style={{
            position: "fixed", top: menuPos.top, left: menuPos.left, width: menuPos.width,
            background: "#efeff4", border: "1px solid #c6c5c9", borderRadius: 8, padding: 8,
            display: "flex", flexDirection: "column", gap: 2, zIndex: 9999, maxHeight: 220,
            overflowY: "auto", boxShadow: "0px 4px 16px rgba(0,0,0,0.10)",
          }}
        >
          {options.map((opt, idx) => (
            <React.Fragment key={opt}>
              {idx > 0 && <div style={{ height: 1, background: "#c6c5c9", flexShrink: 0 }} />}
              <button
                onMouseDown={() => { onChange?.(opt); setOpen(false); }}
                style={{
                  height: 36, display: "flex", alignItems: "center", paddingLeft: 4, paddingRight: 4,
                  paddingTop: 2, paddingBottom: 2, fontFamily: "Inter", fontWeight: 500, fontSize: 15,
                  color: "#787776", letterSpacing: "-0.6px", lineHeight: 1.18, cursor: "pointer",
                  background: "transparent", border: "none", width: "100%", textAlign: "left",
                  borderRadius: 4, flexShrink: 0,
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

type SubRow = { logic: string; feature: string; op: string; value: string };
type Section = {
  id: number;
  name: string;
  feature: string;
  op: string;
  value: string;
  subRows?: SubRow[];
};

const featureOptions = ["AGE", "WEIGHT [kg]", "MMTOTSCORE", "CDRTOT", "CITY", "GENDER", "ALC", "RACE", "DRUG", "HEIGHT", "EDU"];
const opOptions = [">", ">=", "<", "<=", "=", "!="];
const logicOptions = ["And", "Or"];

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

const infoFeatures = ["GENDER", "AGE", "ALC", "RACE", "DRUG", "HEIGHT", "WEIGHT", "EDU", "CAORBD", "TOB"];

function makeEmptySection(id: number): Section {
  return { id, name: `Section ${id}`, feature: "", op: "", value: "" };
}

/**
 * TSI Default Settings - Step 2: Filter
 * 피그마: [FLT-002] 시뮬레이션 데이터 변경하기-필터링-1
 */
export default function TSIFilterPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"Inclusion" | "Exclusion">("Inclusion");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [searchDropdownPos, setSearchDropdownPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const searchContainerRef = React.useRef<HTMLDivElement>(null);
  const searchDropdownRef = React.useRef<HTMLDivElement>(null);

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(
    Object.fromEntries(featureCategories.map(c => [c.name, c.open ?? false]))
  );
  const [activeCat, setActiveCat] = useState<string>("");
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  const [inclusionSections, setInclusionSections] = useState<Section[]>([makeEmptySection(1)]);
  const [exclusionSections, setExclusionSections] = useState<Section[]>([makeEmptySection(1)]);
  const [inclusionOpenSections, setInclusionOpenSections] = useState<Record<number, boolean>>({ 1: true });
  const [exclusionOpenSections, setExclusionOpenSections] = useState<Record<number, boolean>>({ 1: true });
  const [checkedRows, setCheckedRows] = useState<Record<string, boolean>>({});

  const currentSections = activeTab === "Inclusion" ? inclusionSections : exclusionSections;
  const currentOpenSections = activeTab === "Inclusion" ? inclusionOpenSections : exclusionOpenSections;
  const setCurrentSections = activeTab === "Inclusion" ? setInclusionSections : setExclusionSections;
  const setCurrentOpenSections = activeTab === "Inclusion" ? setInclusionOpenSections : setExclusionOpenSections;

  const isDeleteEnabled = Object.values(checkedRows).some(Boolean);

  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results: { category: string; feature: string }[] = [];
    featureCategories.forEach(cat => {
      infoFeatures.forEach(f => {
        if (f.toLowerCase().includes(q)) results.push({ category: cat.name, feature: f });
      });
    });
    return results;
  }, [searchQuery]);

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
          if (s.id === firstSectionId && checkedMainIds.has(s.id)) return { ...s, feature: "", op: "", value: "", subRows: [] };
          if (!checkedSubMap[s.id]) return s;
          return { ...s, subRows: (s.subRows ?? []).filter((_, i) => !checkedSubMap[s.id].has(i)) };
        })
    );
    setCheckedRows({});
  };

  const toggleSection = (id: number) => {
    setCurrentOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const addSection = () => {
    const newId = currentSections.length > 0 ? Math.max(...currentSections.map(s => s.id)) + 1 : 1;
    setCurrentSections(prev => [...prev, makeEmptySection(newId)]);
    setCurrentOpenSections(prev => ({ ...prev, [newId]: true }));
  };

  const updateSection = (id: number, field: keyof Section, value: string) => {
    setCurrentSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addSubRow = (sectionId: number) => {
    setCurrentSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      return { ...s, subRows: [...(s.subRows ?? []), { logic: "", feature: "", op: "", value: "" }] };
    }));
  };

  const updateSubRow = (sectionId: number, rIdx: number, field: keyof SubRow, value: string) => {
    setCurrentSections(prev => prev.map(s => {
      if (s.id !== sectionId) return s;
      const subRows = (s.subRows ?? []).map((r, i) => i === rIdx ? { ...r, [field]: value } : r);
      return { ...s, subRows };
    }));
  };

  const toggleCategory = (name: string) => {
    setOpenCategories(prev => {
      const isCurrentlyOpen = prev[name];
      const allClosed = Object.fromEntries(Object.keys(prev).map(k => [k, false]));
      return { ...allClosed, [name]: !isCurrentlyOpen };
    });
  };

  const hasValidRow = (sections: Section[]) => sections.some(s => s.feature && s.op && s.value);
  const isConfirmEnabled = hasValidRow(inclusionSections) || hasValidRow(exclusionSections);

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
    <div className="font-medium text-[15px] leading-[1.1] text-[#929090] tracking-[-0.45px] flex flex-col gap-[4px] font-['Inter']">
      {lines.map((line, i) => (
        <p key={i} className="m-0">
          {i === 0
            ? <><span className="text-[#262255] font-semibold">{label}</span> [ &nbsp;{line.text}</>
            : <><span className="text-[#3a11d8] font-bold">{line.logic}</span> {line.text}</>
          }
          {i === lines.length - 1 && <> &nbsp;]</>}
        </p>
      ))}
    </div>
  );

  return (
    <AppLayout headerType="tsi" scaleMode="fit">
      <div style={{ display: "flex", flexDirection: "column", width: "calc(100% - 24px)", height: "100%", gap: 24, overflow: "hidden", marginLeft: "8px", marginRight: "8px" }}>
        {/* Title */}
        <div style={{ flexShrink: 0, padding: "0 12px" }}>
          <h1 style={{ fontFamily: "Poppins, Inter, sans-serif", fontSize: 42, fontWeight: 600, color: "rgb(17,17,17)", letterSpacing: "-1.5px", lineHeight: 1.1, margin: 0 }}>
            Target Subgroup Identification
          </h1>
          <span style={{ fontFamily: "Inter", fontSize: 16, fontWeight: 600, color: "rgb(120,119,118)", letterSpacing: "-0.48px" }}>
            Cohort Filter Setup
          </span>
        </div>

        {/* Main Content */}
        <div
          className="flex-1 min-h-0 flex flex-col"
          style={{
            borderImage: 'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch',
            borderStyle: "solid",
            borderTopWidth: "20px",
            borderBottomWidth: "28px",
            borderLeftWidth: "24px",
            borderRightWidth: "24px",
            borderColor: "transparent",
            gap: "12px",
          }}
        >
          {/* Header */}
          <div className="shrink-0 px-[8px] flex items-center justify-between h-[40px]" style={{ paddingTop: 0, paddingBottom: 0, paddingRight: 0 }}>
            <h2 className="font-['Inter'] font-semibold text-[24px] leading-[1.2] text-[#262255] tracking-[-0.72px] m-0">
              Filter
            </h2>
            <div className="flex items-center gap-[12px]">
              <button
                onClick={() => router.push("/tsi/patients-summary")}
                style={{
                  height: 40, paddingLeft: 24, paddingRight: 24, borderRadius: 36,
                  background: "#F06600", border: "none", cursor: "pointer",
                  fontFamily: "Inter", fontSize: 15, fontWeight: 600, color: "#ffffff",
                  letterSpacing: "-0.45px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                Go to Simulation
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M3 8L13 8M10 4L14 8L10 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="flex flex-row flex-1 min-h-0 gap-[12px]">
            {/* Feature List */}
            <div className="w-[272px] shrink-0 flex flex-col gap-[12px]">
              <div className="px-[4px]">
                <span className="font-['Inter'] font-medium text-[19.5px] leading-[1.2] text-[#484646] tracking-[-0.585px]">Feature List</span>
              </div>
              <div className="flex-1 bg-white rounded-[24px] flex flex-col overflow-y-auto font-['Inter']">
                {/* 검색 필드 */}
                <div ref={searchContainerRef} className="relative shrink-0">
                  <div className="h-[48px] bg-white flex items-center px-[18px] gap-[8px]" style={{ borderBottom: "1px solid #c7c5c9" }}>
                    <IconSearch size={20} />
                    <input
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
                      style={{
                        flex: 1, border: "none", outline: "none", background: "transparent",
                        fontFamily: "Inter", fontWeight: 500, fontSize: 15, color: "#484646",
                        letterSpacing: "-0.45px", lineHeight: "normal", paddingTop: 0, paddingBottom: 0, display: "block",
                      }}
                      className="placeholder:text-[#c6c5c9]"
                    />
                  </div>
                  {searchDropdownOpen && typeof document !== "undefined" && createPortal(
                    <div
                      ref={searchDropdownRef}
                      style={{
                        position: "fixed", top: searchDropdownPos.top, left: searchDropdownPos.left,
                        width: searchDropdownPos.width, background: "white", borderRadius: 22, zIndex: 9999,
                        maxHeight: 268, overflowY: "auto", boxShadow: "0px 4px 16px rgba(0,0,0,0.125)",
                      }}
                    >
                      {Object.keys(groupedSearchResults).length === 0 ? (
                        <div style={{ height: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontFamily: "Inter", fontWeight: 500, fontSize: 13, color: "#aaaaad", letterSpacing: "-0.39px" }}>No results found</span>
                        </div>
                      ) : (
                        Object.entries(groupedSearchResults).map(([category, featureList], catIdx, arr) => (
                          <div key={category} style={{ borderBottom: catIdx < arr.length - 1 ? "1px solid #EBEBEB" : "none" }}>
                            <div style={{ paddingTop: 4, paddingLeft: 8, paddingRight: 8 }}>
                              <span style={{ fontFamily: "Inter", fontWeight: 500, fontSize: 10, color: "#aaaaad", letterSpacing: "-0.27px", lineHeight: 1.05 }}>{category}</span>
                            </div>
                            {featureList.map((f, fIdx) => (
                              <div
                                key={f}
                                onMouseDown={() => { setActiveFeature(f); setActiveCat(category); setSearchDropdownOpen(false); }}
                                style={{ height: 28, display: "flex", alignItems: "center", paddingLeft: 8, paddingRight: 8, borderTop: fIdx === 0 ? "none" : "1px solid #EBEBEB", cursor: "pointer" }}
                                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(0,0,0,0.04)"; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                              >
                                <span style={{ flex: 1, fontFamily: "Inter", fontWeight: 500, fontSize: 13, color: "#787776", letterSpacing: "-0.48px", lineHeight: 1.1 }}>{f}</span>
                              </div>
                            ))}
                          </div>
                        ))
                      )}
                    </div>,
                    document.body
                  )}
                </div>
                {featureCategories.map((cat) => {
                  const isOpen = openCategories[cat.name];
                  const isActive = activeCat === cat.name;
                  return (
                    <div key={cat.name} className="flex flex-col border-b border-[#c7c5c9] last:border-none">
                      <div
                        onClick={() => { toggleCategory(cat.name); setActiveCat(cat.name); }}
                        className={`flex items-center h-[48px] px-[18px] gap-[10px] cursor-pointer select-none ${isActive ? "bg-[#262255]" : "hover:bg-[#f9f8fc]"}`}
                      >
                        <div className="shrink-0 w-[16px] h-[16px] flex items-center justify-center">
                          {isOpen
                            ? <IconChevronDown size={14} color={isActive ? "#ffffff" : "#484646"} />
                            : <IconChevronRight size={14} color={isActive ? "#ffffff" : "#484646"} />}
                        </div>
                        <span className={`font-semibold text-[15px] leading-none tracking-[-0.45px] ${isActive ? "text-white" : "text-[#484646]"}`}>
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
                                className={`h-[44px] flex items-center pl-[44px] text-[15px] font-medium tracking-[-0.45px] border-t border-[#c7c5c9] first:border-none cursor-pointer select-none transition-colors ${
                                  isFeatureActive ? "bg-[#efeff4] text-[#262255] font-semibold" : isFeatureHovered ? "bg-[#f9f8fc] text-[#484646]" : "text-[#919092]"
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

            {/* Main Setting Area */}
            <div className="flex-1 flex flex-col gap-[12px] rounded-[24px] bg-[rgba(255,255,255,0.6)] p-[12px] overflow-y-auto">
              {/* Tab Bar + Action Buttons */}
              <div className="flex justify-between items-center shrink-0">
                <div className="bg-white p-[4px] rounded-[22px] flex">
                  <button
                    onClick={() => { setActiveTab("Inclusion"); setCheckedRows({}); }}
                    className={`h-[36px] px-[18px] rounded-[36px] border-none font-semibold text-[15px] cursor-pointer transition-all ${activeTab === "Inclusion" ? "bg-[#262255] text-white" : "bg-transparent text-[#484646]"}`}
                  >
                    Inclusion
                  </button>
                  <button
                    onClick={() => { setActiveTab("Exclusion"); setCheckedRows({}); }}
                    className={`h-[36px] px-[18px] rounded-[36px] border-none font-semibold text-[15px] cursor-pointer transition-all ${activeTab === "Exclusion" ? "bg-[#262255] text-white" : "bg-transparent text-[#484646]"}`}
                  >
                    Exclusion
                  </button>
                </div>
                <div className="flex items-center gap-[12px]">
                  <div className="flex gap-[4px]">
                    <div className="relative size-[48px] flex items-center justify-center cursor-pointer" style={{ flexShrink: 0 }}>
                      <div style={{ position: "absolute", inset: 0, borderRadius: 36, background: "rgba(255,255,255,0.6)", boxShadow: "0px 0px 2px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.10)" }} />
                      <IconFileDownload size={24} />
                    </div>
                    <div className="relative size-[48px] flex items-center justify-center" style={{ cursor: "default", flexShrink: 0 }}>
                      <div style={{ position: "absolute", inset: 0, borderRadius: 36, background: "rgba(255,255,255,0.6)", boxShadow: "0px 0px 2px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.10)" }} />
                      <div className="relative z-10"><IconFolderPlus size={24} color="#c6c5c9" /></div>
                    </div>
                    <div
                      className="relative size-[48px] flex items-center justify-center"
                      style={{ cursor: isDeleteEnabled ? "pointer" : "default", flexShrink: 0 }}
                      onClick={deleteCheckedRows}
                    >
                      <div style={{ position: "absolute", inset: 0, borderRadius: 36, background: "rgba(255,255,255,0.6)", boxShadow: "0px 0px 2px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.10)" }} />
                      <div className="relative z-10"><IconTrash size={24} color={isDeleteEnabled ? "#262255" : "#c6c5c9"} /></div>
                    </div>
                  </div>
                  <div
                    className="relative h-[48px] px-[20px] rounded-[100px] flex items-center gap-[6px] cursor-pointer"
                    style={{ flexShrink: 0 }}
                    onClick={addSection}
                  >
                    <div style={{ position: "absolute", inset: 0, borderRadius: 100, background: "rgba(255,255,255,0.6)", boxShadow: "0px 0px 2px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.10)" }} />
                    <span className="relative z-10 font-['Inter'] font-semibold text-[15px] text-[#262255] tracking-[-0.51px]">Add Section</span>
                    <div className="relative z-10"><IconPlus size={16} color="#262255" /></div>
                  </div>
                </div>
              </div>

              {/* Section List */}
              <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col gap-[14px]">
                {currentSections.map((section: Section) => {
                  const isSectionOpen = currentOpenSections[section.id];
                  return (
                    <div key={section.id} className="bg-white rounded-[12px] flex flex-col">
                      <div
                        className={`h-[46px] flex items-center px-[21px] gap-[10px] cursor-pointer select-none hover:bg-[#fdfdfd] rounded-[12px] transition-colors ${isSectionOpen ? "rounded-b-none" : ""}`}
                        style={isSectionOpen ? { borderBottom: "1.5px solid #c7c5c9" } : {}}
                        onClick={() => toggleSection(section.id)}
                      >
                        <div className={`shrink-0 transition-transform duration-200 ${isSectionOpen ? "rotate-0" : "-rotate-90"}`}>
                          <IconChevronDown size={14} color="#313030" />
                        </div>
                        <span className="font-['Inter'] font-semibold text-[15px] text-[#313030] tracking-[-0.45px]">
                          {section.name}
                        </span>
                      </div>
                      {isSectionOpen && (
                        <>
                          <div className="flex items-center h-[50px] px-[24px] gap-[14px]">
                            <CustomCheckbox
                              checked={!!checkedRows[`${section.id}-main`]}
                              onChange={() => setCheckedRows(prev => ({ ...prev, [`${section.id}-main`]: !prev[`${section.id}-main`] }))}
                            />
                            <div className="shrink-0" style={{ flex: "0 0 17%" }} />
                            <DropdownCell value={section.feature || "Feature Select"} flex={3} placeholder={!section.feature} options={featureOptions} onChange={v => updateSection(section.id, "feature", v)} />
                            <DropdownCell value={section.op || "Select"} flex={2} placeholder={!section.op} options={opOptions} onChange={v => updateSection(section.id, "op", v)} />
                            <input
                              type="text"
                              value={section.value}
                              placeholder="Write input"
                              onChange={e => updateSection(section.id, "value", e.target.value)}
                              className="placeholder:text-[#c6c5c9]"
                              style={{
                                flex: 4, minWidth: 0, height: 36, background: "#efeff4", borderRadius: 8, border: "none",
                                paddingLeft: 12, paddingRight: 12, fontFamily: "Inter", fontWeight: 500, fontSize: 17,
                                color: "#484646", letterSpacing: "-0.68px", outline: "none", cursor: "text",
                              }}
                            />
                            <div className="w-[16px] shrink-0 flex items-center justify-center cursor-pointer" onClick={() => addSubRow(section.id)}><IconPlus size={16} color="#999" /></div>
                          </div>
                          {(section.subRows ?? []).map((row: SubRow, rIdx: number) => (
                            <div key={rIdx} className="flex items-center h-[50px] px-[24px] gap-[14px]" style={{ borderTop: "1.5px solid #c7c5c9" }}>
                              <CustomCheckbox
                                checked={!!checkedRows[`${section.id}-sub-${rIdx}`]}
                                onChange={() => setCheckedRows(prev => ({ ...prev, [`${section.id}-sub-${rIdx}`]: !prev[`${section.id}-sub-${rIdx}`] }))}
                              />
                              <DropdownCell value={row.logic || "Select"} flex="0 0 17%" placeholder={!row.logic} options={logicOptions} onChange={v => updateSubRow(section.id, rIdx, "logic", v)} />
                              <DropdownCell value={row.feature || "Feature Select"} flex={3} placeholder={!row.feature} options={featureOptions} onChange={v => updateSubRow(section.id, rIdx, "feature", v)} />
                              <DropdownCell value={row.op || "Select"} flex={2} placeholder={!row.op} options={opOptions} onChange={v => updateSubRow(section.id, rIdx, "op", v)} />
                              <input
                                type="text"
                                value={row.value}
                                placeholder="Write input"
                                onChange={e => updateSubRow(section.id, rIdx, "value", e.target.value)}
                                className="placeholder:text-[#c6c5c9]"
                                style={{
                                  flex: 4, minWidth: 0, height: 36, background: "#efeff4", borderRadius: 8, border: "none",
                                  paddingLeft: 12, paddingRight: 12, fontFamily: "Inter", fontWeight: 500, fontSize: 17,
                                  color: "#484646", letterSpacing: "-0.68px", outline: "none", cursor: "text",
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

              {/* Formula Preview */}
              <div className="bg-white p-[16px] rounded-[12px] shrink-0 min-h-[104px]" style={{ display: "flex", gap: "16px" }}>
                {bothHaveData ? (
                  <>
                    <div style={{ flex: 1, minWidth: 0 }}>{renderLines(inclusionLines, "Inclusion")}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>{renderLines(exclusionLines, "Exclusion")}</div>
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

          {/* Bottom Buttons */}
          <div className="shrink-0 flex justify-end gap-[12px]">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center h-[40px] px-[24px] rounded-[36px] bg-[#787776] border-none cursor-pointer"
            >
              <span className="font-['Inter'] font-semibold text-[17px] leading-[1.05] text-white tracking-[-0.51px]">Cancel</span>
            </button>
            <button
              disabled={!isConfirmEnabled}
              onClick={() => {
                if (!isConfirmEnabled) return;
                router.push("/tsi/patients-summary");
              }}
              className="flex items-center justify-center h-[40px] px-[24px] rounded-[36px] border-none"
              style={{
                background: isConfirmEnabled ? "#f06600" : "#c7c5c9",
                cursor: isConfirmEnabled ? "pointer" : "not-allowed",
              }}
            >
              <span className="font-['Inter'] font-semibold text-[17px] leading-[1.05] text-white text-center tracking-[-0.51px]">Confirm</span>
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}