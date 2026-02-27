"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSimulationStore } from "@/store/simulationStore";

// ─── 아이콘 ──────────────────────────────────────────────────────────────────

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="4.5" stroke="#AAAAAD" strokeWidth="1.3" />
      <path d="M10.5 10.5L13.5 13.5" stroke="#AAAAAD" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IconClear() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="5.5" fill="#AAAAAD" />
      <path d="M6 6l4 4M10 6l-4 4" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}


function IconExpand() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5 8l5 5 5-5" stroke="#484646" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


function IconAddFile() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M11.5 2H5a1.5 1.5 0 00-1.5 1.5v13A1.5 1.5 0 005 18h10a1.5 1.5 0 001.5-1.5V7l-5-5z" stroke="#484646" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="11.5 2 11.5 7 16.5 7" stroke="#484646" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="10" y1="15" x2="10" y2="11" stroke="#484646" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="8" y1="13" x2="12" y2="13" stroke="#484646" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IconAddFolder() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M18 15.5a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 012 15.5V5a1.5 1.5 0 011.5-1.5H7l2 2.5h7.5A1.5 1.5 0 0118 7.5z" stroke="#484646" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="10" y1="10" x2="10" y2="14" stroke="#484646" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="8" y1="12" x2="12" y2="12" stroke="#484646" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// ─── 글래스 아이콘 버튼 ─────────────────────────────────────────────────────

function GlassIconButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{ position: "relative", width: 44, height: 44, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: 36, background: "rgba(255,255,255,0.6)", boxShadow: "0px 0px 2px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.10)" }} />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

// ─── 글래스 Test 버튼 ───────────────────────────────────────────────────────

function GlassTestButton({ onClick, disabled }: { onClick?: () => void; disabled?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const bg = disabled ? "#F5F5F7" : pressed ? "radial-gradient(ellipse at center, #DDDDE6 80%, rgba(51,0,255,0.18) 100%)" : hovered ? "#EBEBEB" : "#F7F7F7";
  const textColor = disabled ? "#C6C5C9" : pressed ? "#3a11d8" : "#262255";
  return (
    <div
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
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
      <div style={{ position: "absolute", inset: 0, borderRadius: 36, background: "#333333", mixBlendMode: "color-dodge" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: 36, background: bg, transition: "background 0.12s" }} />
      <div style={{ position: "absolute", inset: 0, borderRadius: 36, border: pressed ? "2px solid rgba(58,17,216,0.19)" : "2px solid rgba(255,255,255,0.3)", boxShadow: "0px 0px 2px 0px rgba(0,0,0,0.05)", transition: "border-color 0.12s" }} />
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
        Test
      </span>
    </div>
  );
}

// ─── 왼쪽 패널: 셋업 스텝 ───────────────────────────────────────────────────

function SetupSteps({ onSmilesClick, onSimCondClick }: { onSmilesClick: () => void; onSimCondClick: () => void }) {
  return (
    <div className="flex-1 rounded-[24px] bg-[rgba(255,255,255,0.6)] flex flex-col p-[10px] gap-[8px] overflow-hidden">
      {/* Step 1 - Simulation Conditions (Inactive) */}
      <button
        onClick={onSimCondClick}
        className="flex flex-col w-full p-[16px] rounded-[24px] pt-[12px] pb-[16px] shrink-0 border-none cursor-pointer text-left transition-colors duration-150 hover:bg-[#f9f8fc] active:bg-[#efeff4]"
        style={{ background: "transparent", height: 96, justifyContent: "center" }}
      >
        <div className="flex items-center gap-[18px]">
          <div className="shrink-0 flex items-center justify-center">
            <Image
              src="/icons/simulation-setting/state=not started, step=simulation, Select=Default, Size=24px.svg"
              alt="Simulation Conditions"
              width={24}
              height={24}
              style={{ flexShrink: 0 }}
            />
          </div>
          <span className="font-['Inter'] font-semibold text-[17px] leading-[1.12] tracking-[-0.68px]" style={{ color: "rgb(72,70,70)" }}>
            Simulation Conditions
          </span>
        </div>
        <div className="pl-[42px] mt-0">
          <p className="font-['Inter'] font-semibold text-[10px] leading-[1.1] tracking-[-0.4px] m-0" style={{ color: "#919092" }}>
            Develop a plan to assess the subject&apos;s prognosis based on the entered information.
          </p>
        </div>
      </button>

      {/* Step 2 - SMILES Settings (Active) */}
      <button
        onClick={onSmilesClick}
        className="flex flex-col w-full p-[16px] rounded-[24px] pt-[12px] pb-[16px] shrink-0 border-none cursor-pointer text-left transition-colors duration-150 hover:bg-[#2e2a66] active:bg-[#1a1738]"
        style={{ background: "#262255", height: 96, justifyContent: "center" }}
      >
        <div className="flex items-center gap-[18px]">
          <div className="shrink-0 flex items-center justify-center">
            <Image
              src="/icons/simulation-setting/state=completed, step=smiles, Select=Default, Size=24px.svg"
              alt="SMILES Settings"
              width={24}
              height={24}
              style={{ flexShrink: 0 }}
            />
          </div>
          <span className="font-['Inter'] font-semibold text-[17px] leading-[1.12] tracking-[-0.68px]" style={{ color: "white" }}>
            SMILES Settings
          </span>
        </div>
        <div className="pl-[42px] mt-0">
          <p className="font-['Inter'] font-semibold text-[10px] leading-[1.1] tracking-[-0.4px] m-0" style={{ color: "rgba(255,255,255,0.7)" }}>
            Add SMILES strings to define the chemical structures for simulation conditions.
          </p>
        </div>
      </button>
    </div>
  );
}

// ─── 약물 카드 ───────────────────────────────────────────────────────────────

type DrugCardProps = {
  index: number;
  similarity: string;
  smiles: string;
  drugName: string;
  mf: string;
  mw: string;
  searchQuery?: string;
};

function MoleculeIcon() {
  return (
    <svg width="90" height="80" viewBox="0 0 90 80" fill="none">
      <circle cx="45" cy="40" r="9" fill="none" stroke="#AAA5E1" strokeWidth="1.5" />
      <circle cx="24" cy="27" r="7" fill="none" stroke="#AAA5E1" strokeWidth="1.5" />
      <circle cx="66" cy="27" r="7" fill="none" stroke="#AAA5E1" strokeWidth="1.5" />
      <circle cx="24" cy="53" r="7" fill="none" stroke="#AAA5E1" strokeWidth="1.5" />
      <circle cx="66" cy="53" r="7" fill="none" stroke="#AAA5E1" strokeWidth="1.5" />
      <line x1="36" y1="36" x2="29" y2="30" stroke="#AAA5E1" strokeWidth="1.5" />
      <line x1="54" y1="36" x2="61" y2="30" stroke="#AAA5E1" strokeWidth="1.5" />
      <line x1="36" y1="44" x2="29" y2="50" stroke="#AAA5E1" strokeWidth="1.5" />
      <line x1="54" y1="44" x2="61" y2="50" stroke="#AAA5E1" strokeWidth="1.5" />
      <text x="18" y="31" fontSize="9" fill="#262255" fontFamily="Inter" fontWeight="600">C</text>
      <text x="63" y="31" fontSize="9" fill="#262255" fontFamily="Inter" fontWeight="600">O</text>
      <text x="18" y="57" fontSize="9" fill="#262255" fontFamily="Inter" fontWeight="600">N</text>
      <text x="62" y="57" fontSize="9" fill="#262255" fontFamily="Inter" fontWeight="600">Cl</text>
    </svg>
  );
}

function DrugCard({ index, similarity, smiles, drugName, mf, mw, searchQuery }: DrugCardProps) {
  const rowBorderBottom = "1px solid #AAAAAD";
  const labelRows = ["SMILES", "Drug name", "MF", "MW"];
  const dataRows = [smiles, drugName, mf, mw];

  const isActive = !searchQuery || !searchQuery.trim()
    ? true
    : smiles.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drugName.toLowerCase().includes(searchQuery.toLowerCase());

  const dataTextColor = (rowIdx: number) => {
    const hasSearch = !!searchQuery?.trim();
    if (rowIdx === 0) {
      return isActive ? "#3A11D8" : "#C6C5C9";
    }
    if (!hasSearch) return "#1C1B1B";
    return isActive ? "#787776" : "#C6C5C9";
  };

  // Render SMILES text with highlighted matching segment
  const renderSmilesText = (text: string) => {
    const query = searchQuery?.trim();
    if (!query) return <>{text}</>;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const matchIdx = lowerText.indexOf(lowerQuery);
    if (matchIdx === -1) return <>{text}</>;
    const before = text.slice(0, matchIdx);
    const match = text.slice(matchIdx, matchIdx + query.length);
    const after = text.slice(matchIdx + query.length);
    return (
      <>
        {before && <span style={{ color: "#787776" }}>{before}</span>}
        <span style={{ color: "#3A11D8" }}>{match}</span>
        {after && <span style={{ color: "#787776" }}>{after}</span>}
      </>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: 196,
        flexShrink: 0,
        overflow: "hidden",
        border: "1px solid #e8e4ff",
        borderRadius: 18,
      }}
    >
      {/* 왼쪽 - 분자 구조 카드 */}
      <div
        style={{
          background: "white",
          width: 220,
          flexShrink: 0,
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* 유사도 배지 + 번호 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                background: "#AAA5E1",
                borderRadius: 8,
                width: 60,
                height: 26,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                  fontSize: 15,
                  color: "white",
                  letterSpacing: "-0.75px",
                  lineHeight: 1.15,
                }}
              >
                {similarity}
              </span>
            </div>
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                fontSize: 15,
                color: "rgba(255,255,255,0.8)",
                letterSpacing: "-0.75px",
                background: "rgba(170,165,225,0.5)",
                borderRadius: 8,
                width: 22,
                height: 22,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {index}
            </span>
          </div>
          <div style={{ cursor: "pointer", transform: "rotate(180deg)" }}>
            <IconExpand />
          </div>
        </div>
        {/* 분자 구조 영역 */}
        <div
          style={{
            flex: 1,
            background: "linear-gradient(135deg, #f3eeff 0%, #e8e4ff 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 96,
          }}
        >
          <MoleculeIcon />
        </div>
      </div>

      {/* 가운데 - 라벨 컬럼 */}
      <div style={{ display: "flex", flexDirection: "column", flexShrink: 0, width: "fit-content" }}>
        {labelRows.map((label, i) => (
          <div
            key={label}
            style={{
              background: "#F3EEFF",
              borderBottom: i < labelRows.length - 1 ? rowBorderBottom : undefined,
              width: "100%",
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 10px",
            }}
          >
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 600,
                fontSize: 15,
                color: "#1C1B1B",
                letterSpacing: "-0.75px",
                lineHeight: 1.15,
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* 오른쪽 - 데이터 컬럼 */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
        {dataRows.map((val, i) => (
          <div
            key={i}
            style={{
              background: "white",
              borderBottom: i < dataRows.length - 1 ? rowBorderBottom : undefined,
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 10px",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                fontSize: 12,
                color: dataTextColor(i),
                letterSpacing: "-0.48px",
                lineHeight: 1.1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                textAlign: "center",
                width: "100%",
                transition: "color 0.15s",
              }}
            >
              {i === 0 && isActive ? renderSmilesText(val) : val}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 저장된 약물 항목 ────────────────────────────────────────────────────────

type SavedDrugItemProps = {
  index: number;
  name: string;
};

function DrugTooltip({ name, anchorRect }: { name: string; anchorRect: DOMRect }) {
  const rows = [
    { label: "SMILES", value: "COC1=C(C=C2C(=C1)CC(C2=O)(CC3CCN(CC3)CC4=CC=C(C=C4)OCC5=CC=CC=C5)F)OC" },
    { label: "Drug name", value: name },
    { label: "MF", value: "C31H34FNO4" },
    { label: "MW", value: "503.6 g/mol" },
    { label: "IUPAC Name", value: "2-fluoro-5,6-dimethoxy-2-[[1-[(4-phenylmethoxyphenyl)...]" },
    { label: "Compound CID", value: "9914036" },
    { label: "InChlKey", value: "IXXNIPPOFFXYFS-UHFFFAOYSA-N" },
    { label: "InChl", value: "InChI=1S/C31H34FNO4/c1-35-28-16-25-19-31(32..." },
  ];

  const tooltipWidth = 700;
  const left = anchorRect.left - tooltipWidth - 12;
  const top = anchorRect.top + anchorRect.height / 2;

  const content = (
    <div
      style={{
        position: "fixed",
        left: Math.max(8, left),
        top,
        transform: "translateY(-50%)",
        zIndex: 9999,
        borderRadius: 24,
        background: "#262255",
        boxShadow: "0 8px 40px rgba(0,0,0,0.28)",
        display: "flex",
        width: tooltipWidth,
        pointerEvents: "none",
        padding: 12,
        gap: 12,
        overflow: "hidden",
      }}
    >
      {/* 글래스 오버레이 */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(38,38,38,0.25)", mixBlendMode: "color-dodge", borderRadius: 36, pointerEvents: "none" }} />
      {/* 왼쪽: 분자 구조 */}
      <div
        style={{
          width: 180,
          flexShrink: 0,
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          position: "relative",
          zIndex: 1,
        }}
      >
        <MoleculeIcon />
      </div>
      {/* 오른쪽: 테이블 */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          zIndex: 1,
          background: "white",
          overflow: "hidden",
        }}
      >
        {rows.map((row, i) => (
          <div
            key={row.label}
            style={{
              display: "flex",
              alignItems: "stretch",
              borderBottom: i < rows.length - 1 ? "1px solid #EEEEF2" : undefined,
              minHeight: 40,
              flex: 1,
            }}
          >
            {/* 라벨 */}
            <div
              style={{
                width: 120,
                flexShrink: 0,
                background: "#F3EEFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "6px 10px",
                borderRight: "1px solid #EEEEF2",
              }}
            >
              <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 13, color: "#484646", letterSpacing: "-0.39px", lineHeight: 1.15, textAlign: "center" }}>
                {row.label}
              </span>
            </div>
            {/* 값 */}
            <div style={{ flex: 1, padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 500,
                  fontSize: 12,
                  color: "#484646",
                  letterSpacing: "-0.48px",
                  lineHeight: 1.1,
                  textAlign: "center",
                  wordBreak: "break-all",
                }}
              >
                {row.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}

function SavedDrugItem({ index, name, onDelete }: SavedDrugItemProps & { onDelete: () => void }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const iconRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (iconRef.current) {
      setAnchorRect(iconRef.current.getBoundingClientRect());
      setShowTooltip(true);
    }
  };
  const handleMouseLeave = () => setShowTooltip(false);

  return (
    <div
      style={{
        background: "white",
        borderRadius: 12,
        height: 50,
        padding: 12,
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        position: "relative",
      }}
    >
      {/* 오렌지 번호 배지 */}
      <div style={{ position: "relative", display: "inline-grid", placeItems: "start", flexShrink: 0 }}>
        <div
          style={{
            background: "var(--secondary-60, #F06600)",
            borderRadius: 24,
            width: 24,
            height: 24,
            gridColumn: 1,
            gridRow: 1,
          }}
        />
        <div
          style={{
            gridColumn: 1,
            gridRow: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: 15,
            color: "white",
            letterSpacing: "-0.75px",
          }}
        >
          {index}
        </div>
      </div>
      {/* 이름 */}
      <span
        style={{
          flex: 1,
          fontFamily: "Inter, sans-serif",
          fontWeight: 600,
          fontSize: 15,
          color: "#1C1B1B",
          letterSpacing: "-0.75px",
          lineHeight: 1.15,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {name}
      </span>
      {/* 아이콘들 */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
        {/* 테이블 아이콘 — hover 시 툴팁 */}
        <div
          ref={iconRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <Image src="/icons/basics/Property 1=Data Table, Size=24.svg" alt="Data Table" width={24} height={24} />
          {showTooltip && anchorRect && <DrugTooltip name={name} anchorRect={anchorRect} />}
        </div>
        <div onClick={onDelete} style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Image src="/icons/basics/Property 1=Delete, Size=24.svg" alt="Delete" width={24} height={24} />
        </div>
      </div>
    </div>
  );
}

// ─── 데이터 ──────────────────────────────────────────────────────────────────

const drugData: Omit<DrugCardProps, "index">[] = [
  {
    similarity: "100%",
    smiles: "C1COC[C@H]1OC2=CC=C(C=C2)CC3=C(C=CC(=C3)[C@H]4[C@@H]([C@H]([C@H]([C@H](O4)CO)O)O)O)Cl",
    drugName: "Empagliflozin",
    mf: "C23H27ClO7",
    mw: "450.9 g/mol",
  },
  {
    similarity: "95%",
    smiles: "CCOC1=CC=C(C=C1)CC2=C(C=CC(=C2)[C@H]3[C@@H]([C@H]([C@H]([C@H](O3)CO)O)O)O)Cl",
    drugName: "Dapagliflozin",
    mf: "C21H25ClO6",
    mw: "408.9 g/mol",
  },
  {
    similarity: "89%",
    smiles: "C1CC2=CC=C(CC3=C(C=CC(=C3)[C@H]4[C@@H]([C@H]([C@H]([C@H](O4)CO)O)O)O)Cl)C=C2O1",
    drugName: "Bexagliflozin",
    mf: "C24H29ClO7",
    mw: "464.9 g/mol",
  },
  {
    similarity: "85%",
    smiles: "CCOC1=CC=C(C=C1)CC2=C(C=CC(=C2)[C@H]3[C@@H]([C@H]([C@H]([C@H](O3)CO)O)O)O)O.C[...]",
    drugName: "Dapagliflozin",
    mf: "C24H35ClO9",
    mw: "503.0 g/mol",
  },
  {
    similarity: "85%",
    smiles: "CCOC1=CC=C(C=C1)CC2=C(C=CC(=C2)[C@H]3[C@@H]([C@H]([C@H]([C@H](O3)CO)O)O)O)O.C[...]",
    drugName: "Dapagliflozin",
    mf: "C24H35ClO9",
    mw: "503.0 g/mol",
  },
];

const savedDrugs = [
  { name: "Empagliflozin" },
  { name: "Dapagliflozin" },
];

// ─── 페이지 ──────────────────────────────────────────────────────────────────

export default function SmileSettingPage() {
  const router = useRouter();
  const setSimSmilesCompleted = useSimulationStore((s) => s.setSimSmilesCompleted);
  const [smilesValue, setSmilesValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [similarityThreshold, setSimilarityThreshold] = useState(85);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortValue, setSortValue] = useState<"Relevance" | "Similarity">("Relevance");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [savedDrugList, setSavedDrugList] = useState(savedDrugs);

  useEffect(() => {
    if (!sortOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sortOpen]);

  return (
    <AppLayout headerType="drd" drdStep={2} scaleMode="none">
      
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
        {/* 페이지 타이틀 */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0, padding: "0 12px" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h1 onClick={() => router.push("/drd/simulation-setting")} style={{ fontFamily: "Poppins, Inter, sans-serif", fontSize: 42, fontWeight: 600, color: "rgb(17,17,17)", letterSpacing: "-1.5px", lineHeight: 1.1, margin: 0, cursor: "pointer" }}>
              Simulation Settings
            </h1>
            <span style={{ fontFamily: "Inter", fontSize: 16, fontWeight: 600, color: "rgb(120,119,118)", letterSpacing: "-0.48px" }}>
              Configure simulation parameters
            </span>
          </div>
        </div>

        {/* 투 컬럼 레이아웃 */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flex: 1,
            gap: "0px",
            minHeight: 0,
            alignItems: "stretch",
          }}
        >
          {/* ── 왼쪽 패널 (380px) ── 9-slice 글래스 ── */}
         <div
            className="w-[380px] flex-shrink-0 rounded-[36px] gap-[12px] overflow-hidden flex flex-col"
            style={{
              borderImage: 'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch',
              borderStyle: "solid",
              borderTopWidth: "20px",
              borderBottomWidth: "28px",
              borderLeftWidth: "24px",
              borderRightWidth: "24px",
              borderColor: "transparent",
            }}
          >
            <SetupSteps
              onSmilesClick={() => router.push("/drd/smile-setting")}
              onSimCondClick={() => router.push("/drd/simulation-condition")}
            />
          </div>

          {/* ── 오른쪽 패널 (flex-1) ── 9-slice 글래스 ── */}
         {/* 오른쪽 상위 배경 카드: selection-bg.png → 안에 흰색 테이블 카드 */}
             <div className="drd-right-panel flex-[78] min-w-0 min-h-0 flex flex-col" style={{ borderImage: 'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch', borderStyle: "solid", borderTopWidth: "20px", borderBottomWidth: "28px", borderLeftWidth: "24px", borderRightWidth: "24px", borderColor: "transparent", gap: "12px", marginLeft: "-6px" }}>

            {/* 헤더 행: 제목 + 버튼들 */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                height: 40,
                flexShrink: 0,
                paddingTop: 0,
                paddingBottom: 0,
                paddingRight: 0,
              }}
            >
              <span
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                  fontSize: 24,
                  color: "var(--primary-15, #262255)",
                  letterSpacing: "-0.72px",
                  lineHeight: 1.2,
                  paddingLeft: 8,
                }}
              >
                SMILES Setting
              </span>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <GlassTestButton />
                <GlassIconButton>
                  <IconAddFile />
                </GlassIconButton>
                <GlassIconButton>
                  <IconAddFolder />
                </GlassIconButton>
              </div>
            </div>

            {/* 컨텐츠 영역 */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 12,
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              {/* Chemical Structure 검색 바 */}
              <div
                style={{
                  background: "white",
                  borderRadius: 24,
                  padding: "11px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 600,
                    fontSize: 17,
                    color: "var(--primary-15, #262255)",
                    letterSpacing: "-0.68px",
                    lineHeight: 1.12,
                  }}
                >
                  Chemical Structure
                </span>
                <div
                  onClick={() => inputRef.current?.focus()}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    border: `1px solid ${isFocused ? "#4013EE" : "#C6C5C9"}`,
                    borderRadius: 8,
                    padding: "0 8px",
                    height: 36,
                    cursor: "text",
                  }}
                >
                  <IconSearch />
                  <input
                    ref={inputRef}
                    value={smilesValue}
                    onChange={(e) => setSmilesValue(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Search SMILES"
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 500,
                      fontSize: 15,
                      color: "#484646",
                      letterSpacing: "-0.45px",
                      lineHeight: 1.1,
                      minWidth: 0,
                    }}
                  />
                  {smilesValue && (
                    <div
                      style={{ cursor: "pointer", flexShrink: 0 }}
                      onClick={(e) => { e.stopPropagation(); setSmilesValue(""); inputRef.current?.focus(); }}
                    >
                      <IconClear />
                    </div>
                  )}
                </div>
              </div>

              {/* 결과 + 사이드 패널 */}
              {smilesValue.trim() && <div
                style={{
                  display: "flex",
                  gap: 12,
                  flex: 1,
                  minHeight: 0,
                  overflow: "hidden",
                }}
              >
                {/* 좌: 검색 결과 (네이비 배경) */}
                <div
                  style={{
                    flex: 1,
                    background: "var(--primary-15, #262255)",
                    borderRadius: 24,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    minWidth: 0,
                  }}
                >
                  {/* 결과 헤더 */}
                  <div
                    style={{
                      padding: "16px 14px 0 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      flexShrink: 0,
                    }}
                  >
                    {/* 제목 + 정렬 */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span
                        style={{
                          fontFamily: "Inter, sans-serif",
                          fontWeight: 600,
                          fontSize: 17,
                          color: "white",
                          letterSpacing: "-0.68px",
                          lineHeight: 1.12,
                        }}
                      >
                        Similarity results (40)
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontWeight: 500,
                            fontSize: 15,
                            color: "#AAAAAD",
                            letterSpacing: "-0.45px",
                          }}
                        >
                          Sort by
                        </span>
                        {/* 드롭다운 */}
                        <div ref={dropdownRef} style={{ position: "relative" }}>
                          <div
                            onClick={() => setSortOpen((v) => !v)}
                            style={{
                              background: "#EFEFF4",
                              borderRadius: 8,
                              height: 28,
                              display: "flex",
                              alignItems: "center",
                              padding: "0 6px 0 8px",
                              gap: 2,
                              cursor: "pointer",
                              userSelect: "none",
                              minWidth: 100,
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "Inter, sans-serif",
                                fontWeight: 600,
                                fontSize: 12,
                                color: "#484646",
                                letterSpacing: "-0.48px",
                                flex: 1,
                              }}
                            >
                              {sortValue}
                            </span>
                            <Image
                              src={sortOpen
                                ? "/icons/disclosure/Property 1=Open, Size=18.svg"
                                : "/icons/disclosure/Property 1=Close, Size=18.svg"}
                              alt={sortOpen ? "open" : "close"}
                              width={18}
                              height={18}
                            />
                          </div>
                          {sortOpen && (
                            <div
                              style={{
                                position: "absolute",
                                top: "calc(100% + 4px)",
                                right: 0,
                                background: "#EFEFF4",
                                borderRadius: 8,
                                border: "1px solid #C6C5C9",
                                overflow: "hidden",
                                zIndex: 100,
                                width: "100%",
                              }}
                            >
                              {(["Relevance", "Similarity"] as const).map((opt) => (
                                <div
                                  key={opt}
                                  onClick={() => { setSortValue(opt); setSortOpen(false); }}
                                  style={{
                                    height: 28,
                                    display: "flex",
                                    alignItems: "center",
                                    padding: "0 8px",
                                    cursor: "pointer",
                                    background: sortValue === opt ? "#DDDDE6" : "transparent",
                                  }}
                                  onMouseEnter={(e) => { if (sortValue !== opt) (e.currentTarget as HTMLDivElement).style.background = "#E8E8F0"; }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = sortValue === opt ? "#DDDDE6" : "transparent"; }}
                                >
                                  <span
                                    style={{
                                      fontFamily: "Inter, sans-serif",
                                      fontWeight: 600,
                                      fontSize: 12,
                                      color: "#787776",
                                      letterSpacing: "-0.48px",
                                    }}
                                  >
                                    {opt}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 슬라이더 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingBottom: 4 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontFamily: "Inter, sans-serif",
                          fontWeight: 600,
                          fontSize: 12,
                          color: "white",
                          letterSpacing: "-0.36px",
                        }}
                      >
                        <span>Size -</span>
                        <span>Power +</span>
                      </div>
                      <div style={{ position: "relative", height: 24 }}>
                        {/* 트랙 배경 + 채워진 트랙 */}
                        <div
                          style={{
                            position: "absolute",
                            top: "50%",
                            left: 12,
                            right: 12,
                            transform: "translateY(-50%)",
                            height: 10,
                            borderRadius: 6,
                            overflow: "hidden",
                          }}
                        >
                          <div style={{ position: "absolute", inset: 0, background: "#C6C5C9" }} />
                          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${((similarityThreshold - 85) / 15) * 100}%`, background: "var(--secondary-60, #F06600)" }} />
                        </div>
                        {/* 썸 */}
                        <div
                          style={{
                            position: "absolute",
                            top: "50%",
                            left: `calc(12px + ${((similarityThreshold - 85) / 15) * 100}% * (100% - 24px) / 100%)`,
                            transform: "translate(-50%, -50%)",
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: "#F9F8FC",
                            boxShadow: "0px 0.5px 4px 0px rgba(0,0,0,0.12), 0px 6px 13px 0px rgba(0,0,0,0.12)",
                            pointerEvents: "none",
                          }}
                        />
                        {/* 실제 range input (투명 오버레이) */}
                        <input
                          type="range"
                          min={85}
                          max={100}
                          step={1}
                          value={similarityThreshold}
                          onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
                          style={{
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            left: 12,
                            right: 12,
                            width: "calc(100% - 24px)",
                            height: "100%",
                            opacity: 0,
                            cursor: "pointer",
                            margin: 0,
                          }}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontFamily: "Inter, sans-serif",
                          fontWeight: 500,
                          fontSize: 12,
                          color: "white",
                          letterSpacing: "-0.48px",
                        }}
                      >
                        <span>85%</span>
                        <span>90%</span>
                        <span>95%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>

                  {/* 약물 카드 목록 */}
                  <div
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      padding: "12px 14px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                    }}
                  >
                    {smilesValue.trim() && drugData
                      .filter((drug) => {
                        const pct = parseInt(drug.similarity);
                        return pct >= similarityThreshold;
                      })
                      .map((drug, i) => (
                        <DrugCard key={i} index={i + 1} {...drug} searchQuery={smilesValue} />
                      ))}
                  </div>
                </div>

                {/* 우: 저장된 약물 리스트 */}
                <div
                  style={{
                    width: 376,
                    flexShrink: 0,
                    background: "rgba(255,255,255,0.6)",
                    borderRadius: 24,
                    padding: "16px 15px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    overflowY: "auto",
                  }}
                >
                  {savedDrugList.map((drug, i) => (
                    <SavedDrugItem
                      key={i}
                      index={i + 1}
                      name={drug.name}
                      onDelete={() => setSavedDrugList((prev) => prev.filter((_, idx) => idx !== i))}
                    />
                  ))}
                </div>
              </div>}
            </div>

            {/* 하단 버튼 */}
            <div
              style={{
                flexShrink: 0,
                display: "flex",
                flexDirection: "row",
                justifyContent: "flex-end",
                gap: 12,
                alignItems: "center",
              }}
            >
              <button
                onClick={() => router.push("/drd/simulation-setting")}
                style={{
                  height: 42,
                  paddingLeft: 24,
                  paddingRight: 24,
                  borderRadius: 36,
                  backgroundColor: "rgb(120,119,118)",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "Inter",
                  fontSize: 17,
                  fontWeight: 600,
                  color: "#ffffff",
                  letterSpacing: "-0.51px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setSimSmilesCompleted(true); router.push("/drd/simulation-setting"); }}
                style={{
                  height: 42,
                  paddingLeft: 24,
                  paddingRight: 24,
                  borderRadius: 36,
                  backgroundColor: "#F06600",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "Inter",
                  fontSize: 17,
                  fontWeight: 600,
                  color: "#ffffff",
                  letterSpacing: "-0.51px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
