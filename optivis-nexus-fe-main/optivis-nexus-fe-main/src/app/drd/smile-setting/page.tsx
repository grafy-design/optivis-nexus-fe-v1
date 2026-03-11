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
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Loading } from "@/components/common/Loading";
import { AppLayout } from "@/components/layout/AppLayout";
import { getSmilesList, type SmilesListResultItem, type GetSmilesListRequest } from "@/services/drd-service";
import { useSimulationStore } from "@/store/simulationStore";

// ─── 아이콘 ──────────────────────────────────────────────────────────────────

/** 돋보기 아이콘 — SMILES 검색 입력 필드 좌측 장식용 */
function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="4.5" stroke="#AAAAAD" strokeWidth="1.3" />
      <path d="M10.5 10.5L13.5 13.5" stroke="#AAAAAD" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/** X 클리어 아이콘 — 검색 입력값이 있을 때 우측에 표시, 클릭 시 입력값 초기화 */
function IconClear() {
  return (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="5.5" fill="#AAAAAD" />
      <path d="M6 6l4 4M10 6l-4 4" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}


/** 펼치기/접기 화살표 아이콘 — DrugCard 우측 상단 토글 버튼용 (현재 미구현) */
function IconExpand() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5 8l5 5 5-5" stroke="#484646" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}


/** 파일 다운로드 아이콘 — 오른쪽 패널 헤더 우측 다운로드 버튼용 */
function IconDownloadFile() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M11.5 2H5a1.5 1.5 0 00-1.5 1.5v13A1.5 1.5 0 005 18h10a1.5 1.5 0 001.5-1.5V7l-5-5z" stroke="#262255" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="11.5 2 11.5 7 16.5 7" stroke="#262255" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="10" y1="10" x2="10" y2="15" stroke="#262255" strokeWidth="1.3" strokeLinecap="round" />
      <polyline points="7.5 12.5 10 15 12.5 12.5" stroke="#262255" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 폴더 추가 아이콘 — 오른쪽 패널 헤더 우측 폴더 추가 버튼용 */
function IconAddFolder() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M18 15.5a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 012 15.5V5a1.5 1.5 0 011.5-1.5H7l2 2.5h7.5A1.5 1.5 0 0118 7.5z" stroke="#262255" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="10" y1="10" x2="10" y2="14" stroke="#262255" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="8" y1="12" x2="12" y2="12" stroke="#262255" strokeWidth="1.3" strokeLinecap="round" />
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
      style={{ position: "relative", width: 44, height: 44, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
    >
      <div style={{ position: "absolute", inset: 0, borderRadius: 36, background: "rgba(255,255,255,0.6)", boxShadow: "0px 0px 2px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.10)" }} />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

// ─── 글래스 Test 버튼 ───────────────────────────────────────────────────────

/**
 * GlassTestButton — "Test Load" 버튼
 * - 클릭 시 handleTestLoad가 호출되어 샘플 약물 데이터로 상태를 채움
 * - hover/press 시 배경이 바뀌는 글래스 스타일 버튼
 * - disabled 시 반투명 + not-allowed 커서
 */
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
        Test Load
      </span>
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
    <div className="flex-1 rounded-[24px] bg-[rgba(255,255,255,0.6)] flex flex-col p-[10px] gap-[8px] overflow-y-auto">
      {/* Step 2 - SMILES Settings (Active) */}
      <button
        onClick={onSmilesClick}
        className="flex flex-col w-full p-[16px] rounded-[24px] pt-[12px] pb-[16px] shrink-0 border-none cursor-pointer text-left transition-colors duration-150 hover:bg-[#2e2a66] active:bg-[#1a1738]"
        style={{ background: "#262255", height: 96, justifyContent: "center" }}
      >
        <div className="flex items-center gap-[18px]">
          <div className="shrink-0 flex items-center justify-center">
            <Image
              src="/icons/simulation-setting/state%3Dcompleted%2C%20step%3Dsmiles%2C%20Select%3DDefault%2C%20Size%3D24px.svg"
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

      {/* Step 1 - Simulation Conditions (Inactive) */}
      <button
        onClick={onSimCondClick}
        className="flex flex-col w-full p-[16px] rounded-[24px] pt-[12px] pb-[16px] shrink-0 border-none cursor-pointer text-left transition-colors duration-150 hover:bg-[#f9f8fc] active:bg-[#efeff4]"
        style={{ background: "transparent", height: 96, justifyContent: "center" }}
      >
        <div className="flex items-center gap-[18px]">
          <div className="shrink-0 flex items-center justify-center">
            <Image
              src="/icons/simulation-setting/state%3Dnot%20started%2C%20step%3Dsimulation%2C%20Select%3DDefault%2C%20Size%3D24px.svg"
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

type DrugCardData = Omit<DrugCardProps, "index"> & {
  iupacName?: string;
  compoundCid?: string;
  inchiKey?: string;
  inchi?: string;
};

type SavedDrug = DrugCardData & {
  key: string;
  name: string;
};

const getDrugKey = (drug: DrugCardData): string => `${drug.drugName}::${drug.smiles}`;

const parseSimilarity = (similarity: string): number =>
  Number.parseFloat(similarity.replace("%", "")) || 0;

const toSmilesSort = (
  value: "Relevance" | "Similarity"
): NonNullable<GetSmilesListRequest["sort"]> =>
  value === "Similarity" ? "similarity" : "relevance";

const SMILES_IMAGE_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://nexus.oprimed.com"
).replace(/\/+$/, "");

const normalizeSmilesImageSrc = (src?: string | null): string | undefined => {
  if (!src) return undefined;
  const trimmed = src.trim();
  if (!trimmed) return undefined;

  const lowered = trimmed.toLowerCase();
  if (
    lowered === "null" ||
    lowered === "undefined" ||
    lowered === "none" ||
    lowered === "nan"
  ) {
    return undefined;
  }

  if (lowered.startsWith("data:image/")) return trimmed;
  if (lowered.startsWith("<svg")) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(trimmed)}`;
  }

  if (trimmed.startsWith("//")) return `https:${trimmed}`;

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/^http:\/\//i, "https://");
  }

  if (trimmed.startsWith("/assets/") || trimmed.startsWith("/icons/")) {
    return trimmed;
  }

  if (trimmed.startsWith("/")) {
    return `${SMILES_IMAGE_BASE_URL}${trimmed}`;
  }

  return `${SMILES_IMAGE_BASE_URL}/${trimmed.replace(/^\/+/, "")}`;
};

const SMILES_ALLOWED_PATTERN =
  /^(?=.{1,1024}$)(?:\[[^\]\r\n]+\]|Br?|Cl?|N|O|S|P|F|I|b|c|n|o|s|p|\(|\)|\.|=|#|-|\+|\\|\/|:|@|%[0-9]{2}|[0-9])+$/;

const hasBalancedTokens = (
  value: string,
  openToken: string,
  closeToken: string
): boolean => {
  let depth = 0;

  for (const ch of value) {
    if (ch === openToken) depth += 1;
    if (ch === closeToken) {
      depth -= 1;
      if (depth < 0) return false;
    }
  }

  return depth === 0;
};

const isValidSmilesInput = (value: string): boolean => {
  if (!value) return false;
  if (!SMILES_ALLOWED_PATTERN.test(value)) return false;
  if (!hasBalancedTokens(value, "(", ")")) return false;
  if (!hasBalancedTokens(value, "[", "]")) return false;
  return true;
};

const isPngSmilesImage = (src?: string): boolean => {
  if (!src) return false;
  const normalized = src.trim().toLowerCase();
  return (
    normalized.startsWith("data:image/png") ||
    /\.png(?:$|[?#])/.test(normalized) ||
    /\/png(?:$|[?#])/.test(normalized)
  );
};

const getSmilesImageStyle = (src?: string): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  };

  if (!isPngSmilesImage(src)) return baseStyle;

  return {
    ...baseStyle,
    mixBlendMode: "multiply",
    opacity: 0.94,
    filter: "saturate(0.92) contrast(1.02)",
  };
};

const mapSmilesResultToDrugCard = (item: SmilesListResultItem): DrugCardData => {
  const similarityNumber =
    typeof item.similarity === "number"
      ? item.similarity
      : Number.parseFloat(String(item.similarity));

  return {
    similarity: Number.isFinite(similarityNumber) ? `${similarityNumber}%` : "0%",
    smiles: item.smiles ?? item.SMILES ?? "",
    drugName: item.drug_name,
    mf: item.mf ?? item.MF ?? "",
    mw: item.mw ?? item.MW ?? "",
    smilesImage: normalizeSmilesImageSrc(item.smiles_image ?? item.image_url),
    iupacName: item.iupac_name ?? item.IUPAC_name,
    compoundCid: item.compound_cid ?? item.compound_CID,
    inchiKey: item.inchi_key ?? item.InChIKey,
    inchi: item.inchi ?? item.InChI,
  };
};

/** MoleculeIcon — smilesImage가 없을 때 대체 표시하는 분자 구조 SVG 플레이스홀더 */
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
  const rowBorderBottom = "1px solid #AAAAAD";
  const labelRows = ["SMILES", "Drug name", "MF", "MW"];
  const dataRows = [smiles, drugName, mf, mw];
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const normalizedSmilesImage = normalizeSmilesImageSrc(smilesImage);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const displaySmilesImage = imageLoadFailed ? undefined : normalizedSmilesImage;
  const isDataSmilesImage = !!displaySmilesImage && displaySmilesImage.startsWith("data:");
  const smilesImageStyle = getSmilesImageStyle(displaySmilesImage);
  const cardSmilesImageStyle: React.CSSProperties = {
    ...smilesImageStyle,
    width: "100%",
    height: "100%",
    maxWidth: "100%",
    maxHeight: "100%",
    borderRadius: 18,
  };

  const isAdded = addedIndex !== undefined;

  useEffect(() => {
    setImageLoadFailed(false);
  }, [normalizedSmilesImage]);

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
      if (!hasSearch) return "#1C1B1B";
      return "#3A11D8";
    }
    if (!hasSearch) return "#1C1B1B";
    return "#787776";
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
        {before && <span style={{ color: "#787776" }}>{before}</span>}
        <span style={{ color: "#3A11D8" }}>{match}</span>
        {after && <span style={{ color: "#787776" }}>{after}</span>}
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
      style={{
        display: "flex",
        width: "100%",
        flexShrink: 0,
        overflow: "hidden",
        border: cardBorder,
        borderRadius: 18,
        cursor: isAdded ? "default" : onClick ? "pointer" : "default",
        transition: "border 0.12s",
        boxShadow: pressed ? "0 0 0 3px rgba(58,17,216,0.10)" : "none",
      }}
    >
      {/* 왼쪽 - 분자 구조 카드 */}
      <div
        style={{
          background: leftBg,
          width: 240,
          flexShrink: 0,
          padding: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          transition: "background 0.12s",
        }}
      >
        {/* 분자 구조 영역 */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 165,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              minHeight: 165,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                pointerEvents: "none",
                flexShrink: 0,
              }}
            >
              {/* 유사도 배지 + 번호 */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    background: isAdded ? "#F06600" : "#AAA5E1",
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
                {isAdded && (
                  <span
                    style={{
                      fontFamily: "Inter, sans-serif",
                      fontWeight: 600,
                      fontSize: 15,
                      color: "white",
                      letterSpacing: "-0.75px",
                      background: "#F06600",
                      borderRadius: 999,
                      width: 30,
                      height: 30,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {addedIndex}
                  </span>
                )}
              </div>
              <div
                style={{
                  cursor: "pointer",
                  transform: "rotate(180deg)",
                  width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "auto",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <IconExpand />
              </div>
            </div>

            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                minHeight: 0,
                paddingTop: 4,
                borderRadius: 18,
              }}
            >
              {displaySmilesImage ? (
                isDataSmilesImage ? (
                    <img
                      src={displaySmilesImage}
                      alt=""
                      style={cardSmilesImageStyle}
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      onError={() => setImageLoadFailed(true)}
                  />
                ) : (
                  <Image
                    src={displaySmilesImage}
                    alt=""
                    width={184}
                    height={131}
                    style={cardSmilesImageStyle}
                    loading="lazy"
                    onError={() => setImageLoadFailed(true)}
                  />
                )
              ) : (
                <MoleculeIcon />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 가운데 - 라벨 컬럼 */}
      <div style={{ display: "flex", flexDirection: "column", flexShrink: 0, width: "fit-content" }}>
        {labelRows.map((label, i) => (
          <div
            key={label}
            style={{
              background: labelBg,
              borderBottom: i < labelRows.length - 1 ? rowBorderBottom : undefined,
              width: "100%",
              flex: 1,
              minHeight: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 10px",
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
              background: dataBg,
              borderBottom: i < dataRows.length - 1 ? rowBorderBottom : undefined,
              flex: 1,
              minHeight: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "8px 10px",
            }}
          >
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: 500,
                fontSize: 12,
                color: dataTextColor(i),
                letterSpacing: "-0.48px",
                lineHeight: 1.4,
                whiteSpace: "normal",
                wordBreak: "break-all",
                textAlign: "center",
                width: "100%",
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
  similarity: string;
  smiles: string;
  mf: string;
  mw: string;
  iupacName?: string;
  compoundCid?: string;
  inchiKey?: string;
  inchi?: string;
  smilesImage?: string;
};

/**
 * DrugTooltip — SavedDrugItem의 테이블 아이콘 hover 시 표시되는 상세 정보 툴팁
 * - fixed 포지션으로 앵커 요소 왼쪽에 고정 표시 (createPortal → document.body)
 * - 왼쪽: 분자 구조 이미지, 오른쪽: SMILES / Drug name / MF / MW / IUPAC 등 8개 행 테이블
 * - pointerEvents: "none" — 마우스 이벤트 통과 (hover 상태는 SavedDrugItem이 관리)
 */
function DrugTooltip({
  name,
  similarity,
  smiles,
  mf,
  mw,
  iupacName,
  compoundCid,
  inchiKey,
  inchi,
  anchorRect,
  smilesImage,
}: {
  name: string;
  similarity: string;
  smiles: string;
  mf: string;
  mw: string;
  iupacName?: string;
  compoundCid?: string;
  inchiKey?: string;
  inchi?: string;
  anchorRect: DOMRect;
  smilesImage?: string;
}) {
  const rows = [
    { label: "Similarity", value: similarity || "-" },
    { label: "SMILES", value: smiles || "-" },
    { label: "Drug name", value: name || "-" },
    { label: "MF", value: mf || "-" },
    { label: "MW", value: mw || "-" },
    { label: "IUPAC Name", value: iupacName || "-" },
    { label: "Compound CID", value: compoundCid || "-" },
    { label: "InChIKey", value: inchiKey || "-" },
    { label: "InChI", value: inchi || "-" },
  ];

  const tooltipWidth = 700;
  const left = anchorRect.left - tooltipWidth - 12;
  const top = anchorRect.top + anchorRect.height / 2;
  const normalizedSmilesImage = normalizeSmilesImageSrc(smilesImage);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const displaySmilesImage = imageLoadFailed ? undefined : normalizedSmilesImage;
  const isDataSmilesImage = !!displaySmilesImage && displaySmilesImage.startsWith("data:");
  const smilesImageStyle = getSmilesImageStyle(displaySmilesImage);
  const tooltipSmilesImageStyle: React.CSSProperties = {
    ...smilesImageStyle,
    width: "100%",
    height: "100%",
    maxWidth: "100%",
    maxHeight: "100%",
    transform: "scale(1.2)",
    transformOrigin: "center center",
  };

  useEffect(() => {
    setImageLoadFailed(false);
  }, [normalizedSmilesImage]);

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
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex",  
        borderRadius: 16,
        overflow: "hidden",}}>
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
        {displaySmilesImage ? (
          isDataSmilesImage ? (
            <img
              src={displaySmilesImage}
              alt=""
              style={tooltipSmilesImageStyle}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              onError={() => setImageLoadFailed(true)}
            />
          ) : (
            <Image
              src={displaySmilesImage}
              alt=""
              width={180}
              height={132}
              style={tooltipSmilesImageStyle}
              loading="lazy"
              onError={() => setImageLoadFailed(true)}
            />
          )
        ) : (
          <MoleculeIcon />
        )}
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
function SavedDrugItem({
  index,
  name,
  similarity,
  smiles,
  mf,
  mw,
  iupacName,
  compoundCid,
  inchiKey,
  inchi,
  smilesImage,
  onDelete,
}: SavedDrugItemProps & { onDelete: () => void }) {
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
          <Image src="/icons/basics/Property%201%3DData%20Table%2C%20Size%3D24.svg" alt="Data Table" width={24} height={24} />
          {showTooltip && anchorRect && (
            <DrugTooltip
              name={name}
              similarity={similarity}
              smiles={smiles}
              mf={mf}
              mw={mw}
              iupacName={iupacName}
              compoundCid={compoundCid}
              inchiKey={inchiKey}
              inchi={inchi}
              anchorRect={anchorRect}
              smilesImage={smilesImage}
            />
          )}
        </div>
        <div onClick={onDelete} style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Image src="/icons/basics/Property%201%3DDelete%2C%20Size%3D24.svg" alt="Delete" width={24} height={24} />
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
const mockDrugData: DrugCardData[] = [
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
function SmileSettingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSimSmilesCompleted = useSimulationStore((s) => s.setSimSmilesCompleted);
  const setSmilesData = useSimulationStore((s) => s.setSmilesData);
  const simulationTaskId = useSimulationStore((s) => s.taskId);
  const [smilesValue, setSmilesValue] = useState("");       // SMILES 검색 입력값
  const [isFocused, setIsFocused] = useState(false);        // 검색 입력 필드 포커스 여부 (테두리 색 변경용)
  const inputRef = useRef<HTMLInputElement>(null);           // 검색 입력 DOM ref
  const [similarityThreshold, setSimilarityThreshold] = useState(85); // 유사도 필터 슬라이더 (85~100)
  const [sortOpen, setSortOpen] = useState(false);          // 정렬 드롭다운 열림 여부
  const [sortValue, setSortValue] = useState<"Relevance" | "Similarity">("Relevance"); // 현재 정렬 기준
  const dropdownRef = useRef<HTMLDivElement>(null);          // 정렬 드롭다운 외부 클릭 감지용 ref
  const [savedDrugList, setSavedDrugList] = useState<SavedDrug[]>([]); // 우측 저장 목록
  const [addedCardMap, setAddedCardMap] = useState<Record<string, number>>({});
  const [drugData, setDrugData] = useState<DrugCardData[]>(mockDrugData);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSmilesFormatInvalid, setIsSmilesFormatInvalid] = useState(false);
  const searchSequenceRef = useRef(0);

  const resolveTaskId = (): string | null => {
    const fromQuery =
      searchParams.get("task_id") ??
      searchParams.get("taskId") ??
      searchParams.get("test_id");
    const candidate = fromQuery?.trim() || simulationTaskId;
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

  /**
   * handleTestLoad — "Test Load" 버튼 클릭 시 샘플 약물 2개를 자동 추가하는 함수
   * - Empagliflozin(인덱스 0), Dapagliflozin(인덱스 1)을 addedCardMap + savedDrugList에 설정
   * - similarityThreshold를 95로 설정해 결과 카드 필터 범위를 좁힘
   */
  const handleTestLoad = () => {
    const loaded = testLoadDrugs
      .map((d) => mockDrugData[d.dataIndex])
      .filter((drug): drug is DrugCardData => !!drug)
      .map((drug) => ({
        ...drug,
        key: getDrugKey(drug),
        name: drug.drugName,
      }));

    const map: Record<string, number> = {};
    loaded.forEach((drug, order) => {
      map[drug.key] = order + 1;
    });

    setAddedCardMap(map);
    setSavedDrugList(loaded);
    setDrugData(mockDrugData);
    setSimilarityThreshold(95);
    setIsSmilesFormatInvalid(false);
  };

  const visibleSearchResults = smilesValue.trim() && hasSearched
    ? [...drugData].sort((a, b) =>
        sortValue === "Similarity"
          ? parseSimilarity(b.similarity) - parseSimilarity(a.similarity)
          : 0
      )
    : [];

  const similarityResultCount = smilesValue.trim() && hasSearched
    ? visibleSearchResults.length
    : 0;

  const handleCardClick = (drug: DrugCardData) => {
    const key = getDrugKey(drug);
    if (addedCardMap[key] !== undefined) return;

    const nextOrder = Object.keys(addedCardMap).length + 1;
    setAddedCardMap((prev) => ({ ...prev, [key]: nextOrder }));
    setSavedDrugList((prev) => [
      ...prev,
      {
        ...drug,
        key,
        name: drug.drugName,
      },
    ]);
  };

  const handleSmilesSearch = async (
    thresholdOverride?: number,
    sortOverride?: "Relevance" | "Similarity"
  ): Promise<void> => {
    const query = smilesValue.trim();
    if (!query) {
      searchSequenceRef.current += 1;
      setHasSearched(false);
      setIsSearching(false);
      setIsSmilesFormatInvalid(false);
      setDrugData([]);
      return;
    }

    if (!isValidSmilesInput(query)) {
      searchSequenceRef.current += 1;
      setHasSearched(false);
      setIsSearching(false);
      setIsSmilesFormatInvalid(true);
      setDrugData([]);
      return;
    }

    setIsSmilesFormatInvalid(false);

    const currentSeq = searchSequenceRef.current + 1;
    searchSequenceRef.current = currentSeq;
    setIsSearching(true);

    try {
      const response = (await getSmilesList({
        smiles: query,
        threshold: thresholdOverride ?? similarityThreshold,
        max_records: 40,
        sort: toSmilesSort(sortOverride ?? sortValue),
      })) as unknown;

      if (searchSequenceRef.current !== currentSeq) return;

      let apiResults: SmilesListResultItem[] = [];

      if (Array.isArray(response)) {
        apiResults = response as SmilesListResultItem[];
      } else if (response && typeof response === "object") {
        const wrapped = response as {
          status_code?: number;
          data?: { results?: SmilesListResultItem[] } | SmilesListResultItem[];
        };

        if (wrapped.status_code !== undefined && wrapped.status_code !== 200) {
          setDrugData([]);
          return;
        }

        if (Array.isArray(wrapped.data)) {
          apiResults = wrapped.data;
        } else if (wrapped.data && Array.isArray(wrapped.data.results)) {
          apiResults = wrapped.data.results;
        }
      }

      setDrugData(apiResults.map(mapSmilesResultToDrugCard));
    } catch {
      if (searchSequenceRef.current !== currentSeq) return;
      setDrugData([]);
    } finally {
      if (searchSequenceRef.current === currentSeq) {
        setHasSearched(true);
        setIsSearching(false);
      }
    }
  };

  const handleSimilaritySliderCommit = (nextThreshold: number) => {
    setSimilarityThreshold(nextThreshold);
    if (!smilesValue.trim()) return;
    void handleSmilesSearch(nextThreshold);
  };

  // 정렬 드롭다운 외부 클릭 시 자동 닫기
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
      <Loading isLoading={isSearching} />
      
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
            <h1 onClick={() => router.push(buildDrdPathWithContext("/drd/simulation-setting"))} style={{ fontFamily: "Poppins, Inter, sans-serif", fontSize: 42, fontWeight: 600, color: "rgb(17,17,17)", letterSpacing: "-1.5px", lineHeight: 1.1, margin: 0, cursor: "pointer" }}>
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
              onSmilesClick={() => router.push(buildDrdPathWithContext("/drd/smile-setting"))}
              onSimCondClick={() => router.push(buildDrdPathWithContext("/drd/simulation-condition"))}
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
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "row",
                gap: 12,
                minHeight: 0,
                overflow: "hidden",
              }}
            >
              {/* 왼쪽: 검색 바 + Similarity 결과 묶음 */}
              <div
                style={{
                  flex: 4,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  minHeight: 0,
                  minWidth: 0,
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
                    onChange={(e) => {
                      searchSequenceRef.current += 1;
                      setSmilesValue(e.target.value);
                      setHasSearched(false);
                      setIsSmilesFormatInvalid(false);
                      setIsSearching(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleSmilesSearch();
                      }
                    }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        searchSequenceRef.current += 1;
                        setSmilesValue("");
                        setHasSearched(false);
                        setIsSmilesFormatInvalid(false);
                        setIsSearching(false);
                        setDrugData([]);
                        inputRef.current?.focus();
                      }}
                    >
                      <IconClear />
                    </div>
                  )}
                </div>
              </div>

              {/* Similarity 결과 (네이비 배경) — 항상 표시 */}
              <div
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
                    height: "min(650px, 100%)",
                    maxHeight: 650,
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
                        Similarity results ({similarityResultCount})
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
                                ? "/icons/disclosure/Property%201%3DOpen%2C%20Size%3D18.svg"
                                : "/icons/disclosure/Property%201%3DClose%2C%20Size%3D18.svg"}
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
                                  onClick={() => {
                                    setSortValue(opt);
                                    setSortOpen(false);
                                    if (smilesValue.trim()) {
                                      void handleSmilesSearch(undefined, opt);
                                    }
                                  }}
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
                      <div style={{ position: "relative", height: 24 }}>
                        {/* 트랙 배경 + 채워진 트랙 */}
                        <div
                          style={{
                            position: "absolute",
                            top: "50%",
                            left: 0,
                            right: 0,
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
                          disabled={isSearching}
                          onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
                          onPointerUp={(e) => {
                            const nextThreshold = Number((e.currentTarget as HTMLInputElement).value);
                            handleSimilaritySliderCommit(nextThreshold);
                          }}
                          style={{
                            position: "absolute",
                            top: 0,
                            bottom: 0,
                            left: 12,
                            right: 12,
                            width: "calc(100% - 24px)",
                            height: "100%",
                            opacity: 0,
                            cursor: isSearching ? "not-allowed" : "pointer",
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
                    {smilesValue.trim() ? (
                      isSearching ? (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontFamily: "Inter", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.6)", letterSpacing: "-0.39px" }}>
                            Searching...
                          </span>
                        </div>
                      ) : isSmilesFormatInvalid ? (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontFamily: "Inter", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.35)", letterSpacing: "-0.39px", lineHeight: 1.4, textAlign: "center" }}>
                            Invalid SMILES format.<br />Use SMILES notation and try again.
                          </span>
                        </div>
                      ) : !hasSearched ? (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontFamily: "Inter", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.35)", letterSpacing: "-0.39px", lineHeight: 1.4, textAlign: "center" }}>
                            Press Enter to search SMILES.
                          </span>
                        </div>
                      ) : visibleSearchResults.length === 0 ? (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontFamily: "Inter", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.35)", letterSpacing: "-0.39px", lineHeight: 1.4, textAlign: "center" }}>
                            No similarity results found.
                          </span>
                        </div>
                      ) : (
                        visibleSearchResults.map((drug, i) => (
                          <DrugCard
                            key={getDrugKey(drug)}
                            index={i + 1}
                            {...drug}
                            searchQuery={smilesValue}
                            addedIndex={addedCardMap[getDrugKey(drug)]}
                            onClick={() => handleCardClick(drug)}
                          />
                        ))
                      )
                    ) : savedDrugList.length === 0 ? (
                      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontFamily: "Inter", fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.35)", letterSpacing: "-0.39px", lineHeight: 1.4, textAlign: "center" }}>
                          Search a SMILES string above<br />to see similarity results here.
                        </span>
                      </div>
                    ) : (
                      savedDrugList.map((drug, i) => (
                        <DrugCard
                          key={drug.key}
                          index={i + 1}
                          similarity={drug.similarity}
                          smiles={drug.smiles}
                          drugName={drug.drugName}
                          mf={drug.mf}
                          mw={drug.mw}
                          smilesImage={drug.smilesImage}
                          addedIndex={i + 1}
                        />
                      ))
                    )}
                  </div>
                </div>

              </div>
              </div>

              {/* 우: 저장된 약물 리스트 — 항상 표시 */}
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
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
                      key={drug.key}
                      index={i + 1}
                      name={drug.name}
                      similarity={drug.similarity}
                      smiles={drug.smiles}
                      mf={drug.mf}
                      mw={drug.mw}
                      iupacName={drug.iupacName}
                      compoundCid={drug.compoundCid}
                      inchiKey={drug.inchiKey}
                      inchi={drug.inchi}
                      smilesImage={drug.smilesImage}
                      onDelete={() => {
                        const removedOrder = i + 1;
                        const removedKey = drug.key;
                        setSavedDrugList((prev) => prev.filter((_, idx) => idx !== i));
                        setAddedCardMap((prev) => {
                          const next: Record<string, number> = {};
                          Object.entries(prev).forEach(([key, order]) => {
                            if (key === removedKey) return;
                            next[key] = order > removedOrder ? order - 1 : order;
                          });
                          return next;
                        });
                      }}
                    />
                  ))}
                </div>
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
                onClick={() => router.push(buildDrdPathWithContext("/drd/simulation-setting"))}
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
                disabled={savedDrugList.length === 0}
                onClick={() => {
                  if (savedDrugList.length === 0) return;
                  setSmilesData(savedDrugList.map((drug) => ({ name: drug.name, smilesImage: drug.smilesImage })));
                  setSimSmilesCompleted(true);
                  router.push(buildDrdPathWithContext("/drd/simulation-setting"));
                }}
                style={{
                  height: 42,
                  paddingLeft: 24,
                  paddingRight: 24,
                  borderRadius: 36,
                  backgroundColor: savedDrugList.length === 0 ? "#c6c5c9" : "#F06600",
                  border: "none",
                  cursor: savedDrugList.length === 0 ? "not-allowed" : "pointer",
                  fontFamily: "Inter",
                  fontSize: 17,
                  fontWeight: 600,
                  color: savedDrugList.length === 0 ? "#e2e1e5" : "#ffffff",
                  letterSpacing: "-0.51px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.15s",
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

export default function SmileSettingPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SmileSettingPageContent />
    </Suspense>
  );
}
