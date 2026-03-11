/**
 * SMILES Setting Page — SMILES 기반 약물 유사도 검색 페이지 (Step 2)
 *
 * 역할:
 *   화학 구조(SMILES 문자열)를 입력해 유사 약물을 검색하고,
 *   시뮬레이션에 사용할 약물을 선택·저장하는 페이지입니다.
 *
 * 레이아웃:
 *   왼쪽 패널 — SMILES Settings / Simulation Conditions 스텝 네비게이션
 *   오른쪽 패널 (헤더) — SMILES Setting 타이틀 + Test Load / Download / AddFolder 버튼
 *   오른쪽 패널 (컨텐츠 좌) — Chemical Structure 검색 바 + Similarity results 카드 목록
 *   오른쪽 패널 (컨텐츠 우) — 저장된 약물 목록 (SavedDrugItem)
 *
 * 주요 상태:
 *   smilesValue          — SMILES 검색 입력값
 *   similarityThreshold  — 유사도 필터 슬라이더 (85~100%)
 *   sortValue            — 정렬 기준 ("Relevance" | "Similarity")
 *   addedCardMap         — 선택된 약물 카드의 추가 순서 (drugData 인덱스 → 1-based 순서)
 *   savedDrugList        — 우측 저장 목록에 표시될 약물 배열 (name, smilesImage)
 *
 * 저장:
 *   Confirm 버튼 → setSmilesData(savedDrugList) + setSimSmilesCompleted(true)
 *               → /drd/simulation-setting 으로 이동
 */
"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useSimulationStore } from "@/store/simulationStore";
import { GlassTestButton } from "@/components/ui/glass-button";
import DropdownCell from "@/components/ui/dropdown-cell";

// ─── 아이콘 ──────────────────────────────────────────────────────────────────

/** 돋보기 아이콘 — SMILES 검색 입력 필드 좌측 장식용 */
function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="4.5" stroke="var(--neutral-70)" strokeWidth="1.3" />
      <path d="M10.5 10.5L13.5 13.5" stroke="var(--neutral-70)" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/** X 클리어 아이콘 — 검색 입력값이 있을 때 우측에 표시, 클릭 시 입력값 초기화 */
function IconClear() {
  return (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="5.5" fill="var(--neutral-70)" />
      <path d="M6 6l4 4M10 6l-4 4" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}


/** 펼치기/접기 화살표 아이콘 — DrugCard 우측 상단 토글 버튼용 (현재 미구현) */
function IconExpand() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5 8l5 5 5-5" stroke="var(--neutral-30)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


/** 파일 다운로드 아이콘 — 오른쪽 패널 헤더 우측 다운로드 버튼용 */
function IconDownloadFile() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M11.5 2H5a1.5 1.5 0 00-1.5 1.5v13A1.5 1.5 0 005 18h10a1.5 1.5 0 001.5-1.5V7l-5-5z" stroke="var(--primary-15)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="11.5 2 11.5 7 16.5 7" stroke="var(--primary-15)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="10" y1="10" x2="10" y2="15" stroke="var(--primary-15)" strokeWidth="1.3" strokeLinecap="round" />
      <polyline points="7.5 12.5 10 15 12.5 12.5" stroke="var(--primary-15)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 폴더 추가 아이콘 — 오른쪽 패널 헤더 우측 폴더 추가 버튼용 */
function IconAddFolder() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M18 15.5a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 012 15.5V5a1.5 1.5 0 011.5-1.5H7l2 2.5h7.5A1.5 1.5 0 0118 7.5z" stroke="var(--primary-15)" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="10" y1="10" x2="10" y2="14" stroke="var(--primary-15)" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="8" y1="12" x2="12" y2="12" stroke="var(--primary-15)" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

// ─── 글래스 아이콘 버튼 ─────────────────────────────────────────────────────

/**
 * GlassIconButton — 반투명 글래스 스타일의 원형 아이콘 버튼 래퍼
 * - 44×44px 고정 크기, children으로 아이콘 SVG를 받아 중앙 정렬 표시
 * - 헤더 영역의 Download, AddFolder 버튼에 사용
 */
function GlassIconButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="relative flex items-center justify-center shrink-0 cursor-pointer"
      style={{ width: 44, height: 44 }}
    >
      <div className="absolute inset-0 rounded-full" style={{ background: "rgba(255,255,255,0.6)", boxShadow: "0px 0px 2px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.10)" }} />
      <div className="relative" style={{ zIndex: 1 }}>{children}</div>
    </div>
  );
}

// ─── 왼쪽 패널: 셋업 스텝 ───────────────────────────────────────────────────

/**
 * SetupSteps — 왼쪽 패널의 단계 네비게이션 컴포넌트
 * - Step 2 (SMILES Settings): 현재 페이지이므로 진한 네이비 배경으로 활성 표시
 * - Step 1 (Simulation Conditions): 비활성, 클릭 시 해당 페이지로 이동
 * - onSmilesClick / onSimCondClick: 각 버튼 클릭 시 라우터 이동 콜백
 */
function SetupSteps({ onSmilesClick, onSimCondClick }: { onSmilesClick: () => void; onSimCondClick: () => void }) {
  return (
    <div className="flex-1 rounded-[20px] bg-[rgba(255,255,255,0.6)] p-[10px] overflow-hidden min-h-0">
      <div className="flex flex-col gap-[8px] overflow-y-auto h-full">
      {/* Step 2 - SMILES Settings (Active) */}
      <button
        onClick={onSmilesClick}
        className="flex flex-col w-full p-[16px] rounded-[20px] pt-[12px] pb-[16px] shrink-0 border-none cursor-pointer text-left transition-colors duration-150 hover:bg-[#2e2a66] active:bg-[#1a1738]"
        style={{ background: "var(--primary-15)", height: 96, justifyContent: "center" }}
      >
        <div className="flex items-center gap-[18px]">
          <div className="shrink-0 flex items-center justify-center">
            <Image
              src="/icons/simulation-setting/step-smiles-completed.svg"
              alt="SMILES Settings"
              width={24}
              height={24}
              className="shrink-0"
            />
          </div>
          <span className="text-body3" style={{ color: "var(--text-inverted)" }}>
            SMILES Settings
          </span>
        </div>
        <div className="pl-[42px] mt-0">
          <p className="text-small1 m-0" style={{ color: "rgba(255,255,255,0.7)" }}>
            Add SMILES strings to define the chemical structures for simulation conditions.
          </p>
        </div>
      </button>

      {/* Step 1 - Simulation Conditions (Inactive) */}
      <button
        onClick={onSimCondClick}
        className="flex flex-col w-full p-[16px] rounded-[20px] pt-[12px] pb-[16px] shrink-0 border-none cursor-pointer text-left transition-colors duration-150 hover:bg-neutral-98 active:bg-neutral-95"
        style={{ background: "transparent", height: 96, justifyContent: "center" }}
      >
        <div className="flex items-center gap-[18px]">
          <div className="shrink-0 flex items-center justify-center">
            <Image
              src="/icons/simulation-setting/step-simulation-default.svg"
              alt="Simulation Conditions"
              width={24}
              height={24}
              className="shrink-0"
            />
          </div>
          <span className="text-body3" style={{ color: "var(--text-primary)" }}>
            Simulation Conditions
          </span>
        </div>
        <div className="pl-[42px] mt-0">
          <p className="text-small1 m-0" style={{ color: "var(--text-secondary)" }}>
            Develop a plan to assess the subject&apos;s prognosis based on the entered information.
          </p>
        </div>
      </button>
      </div>
    </div>
  );
}

// ─── 약물 카드 ───────────────────────────────────────────────────────────────

/**
 * DrugCardProps — DrugCard 컴포넌트의 props 타입
 * - similarity: 유사도 배지 텍스트 (예: "95%")
 * - smiles: SMILES 문자열 (두 번째 행에 표시, 검색어 하이라이트 적용)
 * - drugName: 약물 이름
 * - mf: 분자식 (Molecular Formula)
 * - mw: 분자량 (Molecular Weight)
 * - smilesImage: 분자 구조 이미지 경로 (없으면 MoleculeIcon SVG 표시)
 * - searchQuery: 현재 검색어 (SMILES 행에 하이라이트 표시용)
 * - addedIndex: 추가된 순서 (1-based). undefined이면 미추가 상태
 * - onClick: 카드 클릭 시 약물 추가 콜백 (isAdded이면 클릭 불가)
 */
type DrugCardProps = {
  index: number;
  similarity: string;
  smiles: string;
  drugName: string;
  mf: string;
  mw: string;
  smilesImage?: string;
  searchQuery?: string;
  addedIndex?: number;
  onClick?: () => void;
};

/** MoleculeIcon — smilesImage가 없을 때 대체 표시하는 분자 구조 SVG 플레이스홀더 */
function MoleculeIcon() {
  return (
    <svg width="90" height="80" viewBox="0 0 90 80" fill="none">
      <circle cx="45" cy="40" r="9" fill="none" stroke="var(--primary-70)" strokeWidth="1.5" />
      <circle cx="24" cy="27" r="7" fill="none" stroke="var(--primary-70)" strokeWidth="1.5" />
      <circle cx="66" cy="27" r="7" fill="none" stroke="var(--primary-70)" strokeWidth="1.5" />
      <circle cx="24" cy="53" r="7" fill="none" stroke="var(--primary-70)" strokeWidth="1.5" />
      <circle cx="66" cy="53" r="7" fill="none" stroke="var(--primary-70)" strokeWidth="1.5" />
      <line x1="36" y1="36" x2="29" y2="30" stroke="var(--primary-70)" strokeWidth="1.5" />
      <line x1="54" y1="36" x2="61" y2="30" stroke="var(--primary-70)" strokeWidth="1.5" />
      <line x1="36" y1="44" x2="29" y2="50" stroke="var(--primary-70)" strokeWidth="1.5" />
      <line x1="54" y1="44" x2="61" y2="50" stroke="var(--primary-70)" strokeWidth="1.5" />
      <text x="18" y="31" fontSize="9" fill="var(--text-header)" fontFamily="Inter" fontWeight="600">C</text>
      <text x="63" y="31" fontSize="9" fill="var(--text-header)" fontFamily="Inter" fontWeight="600">O</text>
      <text x="18" y="57" fontSize="9" fill="var(--text-header)" fontFamily="Inter" fontWeight="600">N</text>
      <text x="62" y="57" fontSize="9" fill="var(--text-header)" fontFamily="Inter" fontWeight="600">Cl</text>
    </svg>
  );
}

/**
 * DrugCard — 유사도 검색 결과 약물 카드
 *
 * 구조:
 *   왼쪽 — 분자 구조 이미지(또는 MoleculeIcon) + 유사도 배지 + 추가 순서 번호
 *   가운데 — 라벨 컬럼 (SMILES / Drug name / MF / MW)
 *   오른쪽 — 데이터 컬럼 (실제 값. SMILES 행은 searchQuery 하이라이트 적용)
 *
 * 상태:
 *   isAdded=true(addedIndex 존재) — 배지 오렌지색, 클릭 불가, pressed 이벤트 차단
 *   hovered / pressed — 배경색 단계적 변화 (leftBg, labelBg, dataBg)
 */
function DrugCard({ similarity, smiles, drugName, mf, mw, smilesImage, searchQuery, addedIndex, onClick }: DrugCardProps) {
  const rowBorderBottom = "1px solid var(--neutral-70)";
  const labelRows = ["SMILES", "Drug name", "MF", "MW"];
  const dataRows = [smiles, drugName, mf, mw];
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  const isAdded = addedIndex !== undefined;

  // Border state — 선택된 카드도 동일한 테두리
  const cardBorder = "1px solid #e8e4ff";

  // 카드 전체 배경색 — 호버: 0.8단계 어둡게, 액티브: 4단계 어둡게 (선택 여부 무관)
  const leftBg = pressed
    ? "#DDD4F8"
    : hovered
    ? "#FAF8FF"
    : "white";

  const labelBg = pressed
    ? "#D5C8F5"
    : hovered
    ? "#F1EBFE"
    : "#F3EEFF";

  const dataBg = pressed
    ? "#DDD4F8"
    : hovered
    ? "#FAF8FF"
    : "white";

  /**
   * dataTextColor — 데이터 컬럼 텍스트 색상 결정 함수
   * - SMILES 행(rowIdx=0): 검색어 있으면 파란색(#3A11D8), 없으면 기본(#1C1B1B)
   * - 나머지 행: 검색어 있으면 회색(#787776), 없으면 기본(#1C1B1B)
   */
  const dataTextColor = (rowIdx: number) => {
    const hasSearch = !!searchQuery?.trim();
    if (rowIdx === 0) {
      if (!hasSearch) return "var(--neutral-10)";
      return "var(--tertiary-40)";
    }
    if (!hasSearch) return "var(--neutral-10)";
    return "var(--neutral-50)";
  };

  /**
   * renderSmilesText — SMILES 텍스트에서 검색어와 일치하는 구간을 파란색으로 강조 렌더링
   * - 검색어 없으면 그대로 반환
   * - 일치 구간 앞/뒤는 회색(#787776), 일치 구간은 파란색(#3A11D8)
   */
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
        {before && <span style={{ color: "var(--text-secondary)" }}>{before}</span>}
        <span style={{ color: "var(--text-active)" }}>{match}</span>
        {after && <span style={{ color: "var(--text-secondary)" }}>{after}</span>}
      </>
    );
  };

  return (
    <div
      onClick={!isAdded ? onClick : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => !isAdded && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      className="flex w-full shrink-0 overflow-hidden rounded-[14px]"
      style={{
        border: cardBorder,
        cursor: isAdded ? "default" : onClick ? "pointer" : "default",
        transition: "border 0.12s",
        boxShadow: pressed ? "0 0 0 3px rgba(58,17,216,0.10)" : "none",
      }}
    >
      {/* 왼쪽 - 분자 구조 카드 */}
      <div
        className="flex flex-col shrink-0 gap-2"
        style={{
          background: leftBg,
          width: 220,
          padding: 12,
          transition: "background 0.12s",
        }}
      >
        <div className="flex items-center justify-between">
          {/* 유사도 배지 + 번호 */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center rounded-[4px]"
              style={{
                background: isAdded ? "var(--secondary-60)" : "var(--primary-70)",
                width: 60,
                height: 26,
              }}
            >
              <span
                className="text-body4"
                style={{
                  color: "white",
                }}
              >
                {similarity}
              </span>
            </div>
            {isAdded && (
              <span
                className="flex items-center justify-center rounded-[4px] text-body4"
                style={{
                  color: "white",
                  background: "var(--secondary-60)",
                  width: 22,
                  height: 22,
                }}
              >
                {addedIndex}
              </span>
            )}
          </div>
          <div className="cursor-pointer" style={{ transform: "rotate(180deg)" }} onClick={(e) => e.stopPropagation()}>
            <IconExpand />
          </div>
        </div>
        {/* 분자 구조 영역 */}
        <div
          className="flex-1 flex items-center justify-center"
          style={{
            minHeight: 96,
          }}
        >
          {smilesImage ? (
            <Image src={smilesImage} alt={drugName} width={160} height={120} style={{ objectFit: "contain", width: "100%", height: "100%" }} />
          ) : (
            <MoleculeIcon />
          )}
        </div>
      </div>

      {/* 가운데 - 라벨 컬럼 */}
      <div className="flex flex-col shrink-0" style={{ width: "fit-content" }}>
        {labelRows.map((label, i) => (
          <div
            key={label}
            className="w-full flex-1 flex items-center justify-center"
            style={{
              background: labelBg,
              borderBottom: i < labelRows.length - 1 ? rowBorderBottom : undefined,
              minHeight: 40,
              padding: "8px 10px",
            }}
          >
            <span
              className="text-body4"
              style={{
                color: "var(--neutral-10)",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* 오른쪽 - 데이터 컬럼 */}
      <div className="flex flex-col flex-1 min-w-0">
        {dataRows.map((val, i) => (
          <div
            key={i}
            className="flex-1 flex items-center justify-center"
            style={{
              background: dataBg,
              borderBottom: i < dataRows.length - 1 ? rowBorderBottom : undefined,
              minHeight: 40,
              padding: "8px 10px",
            }}
          >
            <span
              className="w-full text-body5m"
              style={{
                color: dataTextColor(i),
                whiteSpace: "normal",
                wordBreak: "break-all",
                textAlign: "center",
                transition: "color 0.15s",
              }}
            >
              {i === 0 ? renderSmilesText(val) : val}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 저장된 약물 항목 ────────────────────────────────────────────────────────

/**
 * SavedDrugItemProps — 저장된 약물 목록 항목의 props 타입
 * - index: 표시할 순서 번호 (1-based, 오렌지 배지)
 * - name: 약물 이름
 * - smilesImage: 분자 구조 이미지 경로 (DrugTooltip에서 사용)
 */
type SavedDrugItemProps = {
  index: number;
  name: string;
  smilesImage?: string;
};

/**
 * DrugTooltip — SavedDrugItem의 테이블 아이콘 hover 시 표시되는 상세 정보 툴팁
 * - fixed 포지션으로 앵커 요소 왼쪽에 고정 표시 (createPortal → document.body)
 * - 왼쪽: 분자 구조 이미지, 오른쪽: SMILES / Drug name / MF / MW / IUPAC 등 8개 행 테이블
 * - pointerEvents: "none" — 마우스 이벤트 통과 (hover 상태는 SavedDrugItem이 관리)
 */
function DrugTooltip({ name, anchorRect, smilesImage }: { name: string; anchorRect: DOMRect; smilesImage?: string }) {
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
      className="fixed flex overflow-hidden pointer-events-none rounded-[20px]"
      style={{
        left: Math.max(8, left),
        top,
        transform: "translateY(-50%)",
        zIndex: 9999,
        background: "var(--primary-15)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.28)",
        width: tooltipWidth,
        padding: 12,
      }}
    >
      <div className="flex overflow-hidden rounded-[12px]">
      {/* 글래스 오버레이 */}
      <div className="absolute inset-0 pointer-events-none rounded-full" style={{ background: "rgba(38,38,38,0.25)", mixBlendMode: "color-dodge" }} />
      {/* 왼쪽: 분자 구조 */}
      <div
        className="relative shrink-0 flex items-center justify-center"
        style={{
          width: 180,
          background: "white",
          padding: 16,
          zIndex: 1,
        }}
      >
        {smilesImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={smilesImage} alt={name} className="w-full h-full" style={{ objectFit: "contain" }} />
        ) : (
          <MoleculeIcon />
        )}
      </div>
      {/* 오른쪽: 테이블 */}
      <div
        className="relative flex-1 flex flex-col overflow-hidden"
        style={{
          zIndex: 1,
          background: "white",
        }}
      >
        {rows.map((row, i) => (
          <div
            key={row.label}
            className="flex items-stretch flex-1"
            style={{
              borderBottom: i < rows.length - 1 ? "1px solid #EEEEF2" : undefined,
              minHeight: 40,
            }}
          >
            {/* 라벨 */}
            <div
              className="shrink-0 flex items-center justify-center"
              style={{
                width: 120,
                background: "#F3EEFF",
                padding: "6px 10px",
                borderRight: "1px solid #EEEEF2",
              }}
            >
              <span className="text-caption" style={{ color: "var(--text-primary)", textAlign: "center" }}>
                {row.label}
              </span>
            </div>
            {/* 값 */}
            <div className="flex-1 flex items-center justify-center" style={{ padding: "6px 10px" }}>
              <span
                className="text-body5m"
                style={{
                  color: "var(--text-primary)",
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
    </div></div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}

/**
 * SavedDrugItem — 우측 패널의 저장된 약물 목록 항목 컴포넌트
 * - 오렌지 번호 배지 + 약물 이름 + 테이블 아이콘(hover 시 DrugTooltip) + 삭제 버튼
 * - onDelete: 삭제 버튼 클릭 시 부모(savedDrugList, addedCardMap) 상태 업데이트 콜백
 */
function SavedDrugItem({ index, name, smilesImage, onDelete }: SavedDrugItemProps & { onDelete: () => void }) {
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
      className="relative flex items-center w-full rounded-[8px] gap-2"
      style={{
        background: "white",
        height: 50,
        padding: 12,
      }}
    >
      {/* 오렌지 번호 배지 */}
      <div className="relative shrink-0" style={{ display: "inline-grid", placeItems: "start" }}>
        <div
          className="rounded-[20px]"
          style={{
            background: "var(--secondary-60, #F06600)",
            width: 24,
            height: 24,
            gridColumn: 1,
            gridRow: 1,
          }}
        />
        <div
          className="flex items-center justify-center text-body4"
          style={{
            gridColumn: 1,
            gridRow: 1,
            width: 24,
            height: 24,
            color: "white",
          }}
        >
          {index}
        </div>
      </div>
      {/* 이름 */}
      <span
        className="flex-1 overflow-hidden text-body4"
        style={{
          color: "var(--neutral-10)",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        {name}
      </span>
      {/* 아이콘들 */}
      <div className="flex items-center shrink-0 gap-2">
        {/* 테이블 아이콘 — hover 시 툴팁 */}
        <div
          ref={iconRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="cursor-pointer flex items-center justify-center"
        >
          <Image src="/icons/basics/data-table-24.svg" alt="Data Table" width={24} height={24} />
          {showTooltip && anchorRect && <DrugTooltip name={name} anchorRect={anchorRect} smilesImage={smilesImage} />}
        </div>
        <div onClick={onDelete} className="cursor-pointer flex items-center justify-center">
          <Image src="/icons/basics/delete-24.svg" alt="Delete" width={24} height={24} />
        </div>
      </div>
    </div>
  );
}

// ─── 데이터 ──────────────────────────────────────────────────────────────────

/**
 * drugData — 유사도 검색 결과 약물 정적 데이터 목록
 * - 실제 서비스에서는 SMILES 검색 API 응답으로 대체될 데이터
 * - smilesImage: /assets/smiles/ 경로의 SVG 분자 구조 이미지
 */
const drugData: Omit<DrugCardProps, "index">[] = [
  {
    similarity: "100%",
    smiles: "C1COC[C@H]1OC2=CC=C(C=C2)CC3=C(C=CC(=C3)[C@H]4[C@@H]([C@H]([C@H]([C@H](O4)CO)O)O)O)Cl",
    drugName: "Empagliflozin",
    mf: "C23H27ClO7",
    mw: "450.9 g/mol",
    smilesImage: "/assets/smiles/Empagliflozin.svg",
  },
  {
    similarity: "95%",
    smiles: "CCOC1=CC=C(C=C1)CC2=C(C=CC(=C2)[C@H]3[C@@H]([C@H]([C@H]([C@H](O3)CO)O)O)O)Cl",
    drugName: "Dapagliflozin",
    mf: "C21H25ClO6",
    mw: "408.9 g/mol",
    smilesImage: "/assets/smiles/Dapagliflozin.svg",
  },
  {
    similarity: "89%",
    smiles: "C1CC2=CC=C(CC3=C(C=CC(=C3)[C@H]4[C@@H]([C@H]([C@H]([C@H](O4)CO)O)O)O)Cl)C=C2O1",
    drugName: "Bexagliflozin",
    mf: "C24H29ClO7",
    mw: "464.9 g/mol",
    smilesImage: "/assets/smiles/Bexagliflozin.svg",
  },
  {
    similarity: "85%",
    smiles: "CCOC1=CC=C(C=C1)CC2=C(C=CC(=C2)[C@H]3[C@@H]([C@H]([C@H]([C@H](O3)CO)O)O)O)O.C[...]",
    drugName: "Dapagliflozin",
    mf: "C24H35ClO9",
    mw: "503.0 g/mol",
    smilesImage: "/assets/smiles/Dapagliflozin02.svg",
  },
  {
    similarity: "85%",
    smiles: "CCOC1=CC=C(C=C1)CC2=C(C=CC(=C2)[C@H]3[C@@H]([C@H]([C@H]([C@H](O3)CO)O)O)O)O.C[...]",
    drugName: "Dapagliflozin",
    mf: "C24H35ClO9",
    mw: "503.0 g/mol",
    smilesImage: "/assets/smiles/Dapagliflozin02.svg",
  },
];

/**
 * testLoadDrugs — "Test Load" 버튼 클릭 시 자동으로 추가될 약물 목록
 * - dataIndex: drugData 배열에서의 인덱스
 */
const testLoadDrugs = [
  { name: "Empagliflozin", dataIndex: 0 },
  { name: "Dapagliflozin", dataIndex: 1 },
];

// ─── 페이지 ──────────────────────────────────────────────────────────────────

/**
 * SmileSettingPage — SMILES 기반 약물 유사도 검색 메인 페이지 컴포넌트
 *
 * 페이지 진입 시 모든 상태는 초기값(빈 목록/85%)으로 시작하며,
 * Test Load 버튼으로 샘플 2개 약물을 자동 추가하거나,
 * 사용자가 SMILES 문자열을 직접 검색해 약물 카드를 클릭해 추가한다.
 *
 * Confirm 버튼 클릭 시:
 *   - setSmilesData(savedDrugList): 전역 store에 선택 약물 저장
 *   - setSimSmilesCompleted(true): SMILES 완료 상태 플래그 설정
 *   - /drd/simulation-setting 으로 이동
 */
export default function SmileSettingPage() {
  const router = useRouter();
  const setSimSmilesCompleted = useSimulationStore((s) => s.setSimSmilesCompleted);
  const setSmilesData = useSimulationStore((s) => s.setSmilesData);
  const [smilesValue, setSmilesValue] = useState("");       // SMILES 검색 입력값
  const [isFocused, setIsFocused] = useState(false);        // 검색 입력 필드 포커스 여부 (테두리 색 변경용)
  const inputRef = useRef<HTMLInputElement>(null);           // 검색 입력 DOM ref
  const [similarityThreshold, setSimilarityThreshold] = useState(85); // 유사도 필터 슬라이더 (85~100)
  const [sortValue, setSortValue] = useState<"Relevance" | "Similarity">("Relevance"); // 현재 정렬 기준
  const [savedDrugList, setSavedDrugList] = useState<{ name: string; smilesImage?: string }[]>([]); // 우측 저장 목록
  // drugData 인덱스 → 추가 순서(1-based) 매핑: 카드 배지 번호 및 isAdded 판별에 사용
  const [addedCardMap, setAddedCardMap] = useState<Record<number, number>>({});

  /**
   * handleTestLoad — "Test Load" 버튼 클릭 시 샘플 약물 2개를 자동 추가하는 함수
   * - Empagliflozin(인덱스 0), Dapagliflozin(인덱스 1)을 addedCardMap + savedDrugList에 설정
   * - similarityThreshold를 95로 설정해 결과 카드 필터 범위를 좁힘
   */
  const handleTestLoad = () => {
    const map: Record<number, number> = {};
    testLoadDrugs.forEach((d, order) => { map[d.dataIndex] = order + 1; });
    setAddedCardMap(map);
    setSavedDrugList(testLoadDrugs.map((d) => ({ name: d.name, smilesImage: drugData[d.dataIndex]?.smilesImage })));
    setSimilarityThreshold(95);
  };


  return (
    <AppLayout headerType="drd" drdStep={2} scaleMode="none">
      
      <div className="flex flex-col h-full gap-6">
        {/* 페이지 타이틀 */}
        <div className="flex flex-row items-start justify-between shrink-0 px-1">
          <div className="flex flex-col">
            <h1 onClick={() => router.push("/drd/simulation-setting")} className="text-page-title">
              Simulation Settings
            </h1>
            <span className="text-page-subtitle">
              Configure simulation parameters
            </span>
          </div>
        </div>

        {/* 투 컬럼 레이아웃 */}
        <div className="drd-content-row gap-1">
          {/* ── 왼쪽 패널 (380px) ── 9-slice 글래스 ── */}
         <div
            className="figma-nine-slice figma-home-panel-left
            drd-left-panel flex-shrink-0 rounded-[36px] gap-[12px] overflow-hidden flex flex-col"
          >
            <SetupSteps
              onSmilesClick={() => router.push("/drd/smile-setting")}
              onSimCondClick={() => router.push("/drd/simulation-condition")}
            />
          </div>

          {/* ── 오른쪽 패널 (flex-1) ── 9-slice 글래스 ── */}
         {/* 오른쪽 상위 배경 카드: selection-bg.png → 안에 흰색 테이블 카드 */}
             <div className="figma-nine-slice figma-home-panel-right flex flex-col rounded-[36px] overflow-hidden flex-[78] min-w-0 min-h-0 gap-3">

            {/* 헤더 행: 제목 + 버튼들 */}
            <div className="flex items-center justify-between h-10 shrink-0">
              <span
                className="text-body1"
                style={{
                  color: "var(--text-header)",
                  paddingLeft: 8,
                }}
              >
                SMILES Setting
              </span>
              <div className="flex gap-[10px] items-center">
                <GlassTestButton onClick={handleTestLoad} />
                <GlassIconButton>
                  <IconDownloadFile />
                </GlassIconButton>
                <GlassIconButton>
                  <IconAddFolder />
                </GlassIconButton>
              </div>
            </div>

            {/* 컨텐츠 영역 */}
            <div className="flex-1 flex flex-row gap-3 min-h-0 overflow-hidden">
              {/* 왼쪽: 검색 바 + Similarity 결과 묶음 */}
              <div className="flex-[4] flex flex-col gap-3 min-h-0 min-w-0 overflow-hidden">
              {/* Chemical Structure 검색 바 */}
              <div
                className="flex flex-col shrink-0 rounded-[20px] gap-3"
                style={{
                  background: "white",
                  padding: "11px 16px",
                }}
              >
                <span
                  className="text-body3"
                  style={{
                    color: "var(--text-header)",
                  }}
                >
                  Chemical Structure
                </span>
                <div
                  onClick={() => inputRef.current?.focus()}
                  className="flex items-center cursor-text rounded-[4px] gap-1"
                  style={{
                    border: `1px solid ${isFocused ? "#4013EE" : "var(--neutral-80)"}`,
                    padding: "0 8px",
                    height: 36,
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
                    className="flex-1 border-none min-w-0 text-body4m"
                    style={{
                      outline: "none",
                      background: "transparent",
                      color: "var(--text-primary)",
                    }}
                  />
                  {smilesValue && (
                    <div
                      className="cursor-pointer shrink-0"
                      onClick={(e) => { e.stopPropagation(); setSmilesValue(""); inputRef.current?.focus(); }}
                    >
                      <IconClear />
                    </div>
                  )}
                </div>
              </div>

              {/* Similarity 결과 (네이비 배경) — 항상 표시 */}
              <div
                className="flex flex-1 min-h-0 overflow-hidden gap-3"
              >
                {/* 좌: 검색 결과 (네이비 배경) */}
                <div
                  className="flex-1 flex flex-col overflow-hidden min-w-0 rounded-[20px]"
                  style={{
                    background: "var(--primary-15, #262255)",
                  }}
                >
                  {/* 결과 헤더 */}
                  <div
                    className="flex flex-col shrink-0 gap-2"
                    style={{
                      padding: "16px 14px 0 14px",
                    }}
                  >
                    {/* 제목 + 정렬 */}
                    <div className="flex items-center justify-between">
                      <span
                        className="text-body3"
                        style={{
                          color: "white",
                        }}
                      >
                        Similarity results (40)
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-body4m"
                          style={{
                            color: "var(--neutral-70)",
                          }}
                        >
                          Sort by
                        </span>
                        <DropdownCell
                          value={sortValue}
                          options={["Relevance", "Similarity"]}
                          onChange={(v) => setSortValue(v as "Relevance" | "Similarity")}
                          size="sm"
                          width={120}
                        />
                      </div>
                    </div>

                    {/* 슬라이더 */}
                    <div className="flex flex-col gap-1" style={{ paddingBottom: 4 }}>
                      <div
                        className="flex justify-between text-body5"
                        style={{
                          color: "white",
                        }}
                      >
                        <span>Size -</span>
                        <span>Power +</span>
                      </div>
                      <div className="relative" style={{ height: 24 }}>
                        {/* 트랙 배경 + 채워진 트랙 */}
                        <div
                          className="absolute overflow-hidden rounded-[2px]"
                          style={{
                            top: "50%",
                            left: 0,
                            right: 0,
                            transform: "translateY(-50%)",
                            height: 10,
                          }}
                        >
                          <div className="absolute inset-0" style={{ background: "var(--neutral-80)" }} />
                          <div className="absolute" style={{ left: 0, top: 0, bottom: 0, width: `${((similarityThreshold - 85) / 15) * 100}%`, background: "var(--secondary-60, #F06600)" }} />
                        </div>
                        {/* 썸 */}
                        <div
                          className="absolute pointer-events-none rounded-full"
                          style={{
                            top: "50%",
                            left: `calc(12px + ${((similarityThreshold - 85) / 15) * 100}% * (100% - 24px) / 100%)`,
                            transform: "translate(-50%, -50%)",
                            width: 24,
                            height: 24,
                            background: "var(--neutral-98)",
                            boxShadow: "0px 0.5px 4px 0px rgba(0,0,0,0.12), 0px 6px 13px 0px rgba(0,0,0,0.12)",
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
                          className="absolute h-full cursor-pointer"
                          style={{
                            top: 0,
                            bottom: 0,
                            left: 12,
                            right: 12,
                            width: "calc(100% - 24px)",
                            opacity: 0,
                            margin: 0,
                          }}
                        />
                      </div>
                      <div
                        className="flex justify-between text-body5m"
                        style={{
                          color: "white",
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
                    className="flex-1 flex flex-col overflow-y-auto gap-4"
                    style={{
                      padding: "12px 14px",
                    }}
                  >
                    {(() => {
                      /**
                       * handleCardClick — 약물 카드 클릭 핸들러
                       * - 이미 추가된 카드(addedCardMap에 존재)는 무시
                       * - 새로 추가 시 addedCardMap에 순서 등록, savedDrugList에 항목 추가
                       */
                      const handleCardClick = (i: number, drugName: string) => {
                        if (addedCardMap[i] !== undefined) return;
                        const nextOrder = Object.keys(addedCardMap).length + 1;
                        setAddedCardMap((prev) => ({ ...prev, [i]: nextOrder }));
                        setSavedDrugList((prev) => [...prev, { name: drugName, smilesImage: drugData[i]?.smilesImage }]);
                      };

                      if (smilesValue.trim()) {
                        // 검색어 있을 때: similarityThreshold 이상인 카드만 표시 (검색어 하이라이트 포함)
                        return drugData
                          .filter((drug) => parseInt(drug.similarity) >= similarityThreshold)
                          .map((drug, i) => (
                            <DrugCard
                              key={i}
                              index={i + 1}
                              {...drug}
                              searchQuery={smilesValue}
                              addedIndex={addedCardMap[i]}
                              onClick={() => handleCardClick(i, drug.drugName)}
                            />
                          ));
                      }
                      // 검색어 없을 때: 선택된 카드만 추가 순서대로 표시
                      const selected = drugData
                        .map((drug, i) => ({ drug, i }))
                        .filter(({ i }) => addedCardMap[i] !== undefined)
                        .sort((a, b) => addedCardMap[a.i] - addedCardMap[b.i]);

                      if (selected.length === 0) {
                        return (
                          <div className="flex-1 flex items-center justify-center">
                            <span className="text-captionm" style={{ color: "rgba(255,255,255,0.35)", textAlign: "center" }}>
                              Search a SMILES string above<br />to see similarity results here.
                            </span>
                          </div>
                        );
                      }

                      return selected.map(({ drug, i }) => (
                        <DrugCard
                          key={i}
                          index={i + 1}
                          {...drug}
                          addedIndex={addedCardMap[i]}
                          onClick={() => handleCardClick(i, drug.drugName)}
                        />
                      ));
                    })()}
                  </div>
                </div>

              </div>
              </div>

              {/* 우: 저장된 약물 리스트 — 항상 표시 */}
                <div
                  className="flex-1 min-w-0 rounded-[20px] overflow-hidden min-h-0"
                  style={{
                    background: "rgba(255,255,255,0.6)",
                    padding: "16px 15px",
                  }}
                >
                <div className="flex flex-col overflow-y-auto gap-4 h-full">
                  {savedDrugList.map((drug: { name: string; smilesImage?: string }, i: number) => (
                    <SavedDrugItem
                      key={i}
                      index={i + 1}
                      name={drug.name}
                      smilesImage={drug.smilesImage}
                      onDelete={() => {
                        const removedOrder = i + 1;
                        // savedDrugList에서 해당 항목 제거
                        setSavedDrugList((prev) => prev.filter((_: { name: string; smilesImage?: string }, idx: number) => idx !== i));
                        // addedCardMap에서 삭제된 순서를 제거하고, 이후 순서는 1씩 감소
                        setAddedCardMap((prev) => {
                          const next: Record<number, number> = {};
                          Object.entries(prev).forEach(([k, order]) => {
                            if (order === removedOrder) return; // 삭제된 항목 스킵
                            next[Number(k)] = order > removedOrder ? order - 1 : order;
                          });
                          return next;
                        });
                      }}
                    />
                  ))}
                </div>
                </div>
            </div>

            {/* 하단 버튼 */}
            <div className="shrink-0 flex flex-row justify-end gap-3 items-center">
              <button
                onClick={() => router.push("/drd/simulation-setting")}
                className="btn-tsi btn-tsi-secondary"
                style={{ height: 42 }}
              >
                Cancel
              </button>
              <button
                disabled={savedDrugList.length === 0}
                onClick={() => {
                  if (savedDrugList.length === 0) return;
                  setSmilesData(savedDrugList);
                  setSimSmilesCompleted(true);
                  router.push("/drd/simulation-setting");
                }}
                className="btn-tsi btn-tsi-primary"
                style={{ height: 42 }}
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
