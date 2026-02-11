"use client";

import { useState, Fragment } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { AppLayout } from "@/components/layout/AppLayout";

/**
 * TSI Step 4: Subgroup Selection
 * 구조: 상위 배경 카드 2개 나란히
 * - 왼쪽 상위: selection-left.png → 안에 남색 카드 (Subgroup Sets Summary)
 * - 오른쪽 상위: selection-bg.png → 안에 흰색 테이블 카드
 */

const SAMPLE_SETS = [
  {
    no: "01",
    setName: "Set 1",
    groups: ["Group 1", "Group 2"],
    outcome: "ADAS",
    cutoff: "≤ 80%",
    month: "12",
    numGroups: "2",
    varianceBenefit: "35.5% (Highest)",
    groupBalance: "OK (n min=150)",
  },
  {
    no: "02",
    setName: "Set 2",
    groups: ["Group 1", "Group 2", "Group 3"],
    outcome: "CDR",
    cutoff: "≤ 15%  ≤ 50%",
    month: "15",
    numGroups: "3",
    varianceBenefit: "32.2%",
    groupBalance: "OK (n min=150)",
  },
  {
    no: "03",
    setName: "Set 3",
    groups: ["Group 1", "Group 2"],
    outcome: "CDR",
    cutoff: "≤ 70%",
    month: "15",
    numGroups: "2",
    varianceBenefit: "32.1%",
    groupBalance: "OK (n min=210)",
  },
  {
    no: "04",
    setName: "Set 4",
    groups: ["Group 1", "Group 2"],
    outcome: "MMSE",
    cutoff: "≤ 70%",
    month: "12",
    numGroups: "2",
    varianceBenefit: "28.7%",
    groupBalance: "OK (n min=190)",
  },
];

/** 그룹별 에러바 색상 (Group 1, 2, 3 각각 구분) */
const GROUP_BAR_COLORS = ["#AAA5E1", "#7571A9", "#231F52"];

/** 테이블 공통 스타일: 높이 52px */
const TABLE_CELL_BASE = "h-[52px] border-b align-middle";
/** border-l이 없는 셀: 오른쪽 padding만 8px */
const TABLE_HEADER_CELL_BASE_NO_BORDER = `${TABLE_CELL_BASE} pr-2 border-neutral-30 text-body3 text-neutral-30 font-semibold whitespace-nowrap`;
const TABLE_BODY_CELL_BASE_NO_BORDER = `${TABLE_CELL_BASE} pr-2 border-neutral-80 text-body4 text-neutral-40`;
/** border-l이 있는 셀: 오른쪽 padding만 8px, 왼쪽은 margin으로 처리 */
const TABLE_HEADER_CELL_BASE_WITH_BORDER = `${TABLE_CELL_BASE} pr-2 border-neutral-30 text-body3 text-neutral-30 font-semibold whitespace-nowrap`;
const TABLE_BODY_CELL_BASE_WITH_BORDER = `${TABLE_CELL_BASE} pr-2 border-neutral-80 text-body4 text-neutral-40`;
/** 마지막 컬럼: border-l은 있지만 padding 없음 */
const TABLE_HEADER_CELL_BASE_LAST = `${TABLE_CELL_BASE} border-neutral-30 text-body3 text-neutral-30 font-semibold whitespace-nowrap`;
const TABLE_BODY_CELL_BASE_LAST = `${TABLE_CELL_BASE} border-neutral-80 text-body4 text-neutral-40`;

/** 내부 div: 셀과 같은 너비, 더 작은 높이(36px), 세로선 포함 */
const TABLE_INNER_DIV_CENTER =
  "w-full h-[28px] flex items-center justify-center border-l border-neutral-80 pl-2";
const TABLE_INNER_DIV_LEFT =
  "w-full h-[28px] flex items-center border-l border-neutral-80 pl-2";
const TABLE_INNER_DIV_CENTER_NO_BORDER =
  "w-full h-[28px] flex items-center justify-center";
const TABLE_INNER_DIV_LEFT_NO_BORDER = "w-full h-[28px] flex items-center";

export default function TSISubgroupSelectionPage() {
  const router = useRouter();
  const [selectedSetNo, setSelectedSetNo] = useState<string>("01");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpansion = (rowNo: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rowNo)) {
        newSet.delete(rowNo);
      } else {
        newSet.add(rowNo);
      }
      return newSet;
    });
  };

  const handleSubgroupExplain = () => {
    router.push("/tsi/subgroup-explain");
  };

  return (
    <AppLayout headerType="tsi">
      <div className="w-full flex flex-col items-center">
        {/* 타이틀: 카드 밖 */}
        <div className="w-full flex justify-center mb-2 max-w-full">
          <div className="w-[1772px] max-w-full flex-shrink-0 mx-auto">
            <div className="flex flex-col gap-1 flex-shrink-0 items-start">
              <div className="text-title text-neutral-5 text-left mb-2">
                Subgroup Selection
              </div>
              <p className="text-body2m text-neutral-50 text-left">
                Prognostic
              </p>
            </div>
          </div>
        </div>

        {/* 메인: 상위 배경 카드 2개 나란히 (좌 selection-left, 우 selection-bg) */}
        <div className="w-[1772px] flex-shrink-0 mx-auto flex flex-row flex-nowrap gap-4 items-stretch">
          {/* 왼쪽 상위 배경 카드: selection-left.png (Figma 536x614, radius 36) */}
          <div
            className="w-[536px] h-[614px] flex-shrink-0 rounded-[36px] overflow-hidden flex flex-col p-3"
            style={{
              backgroundImage: "url(/assets/tsi/selection-left.png)",
              backgroundSize: "100% 100%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
            }}
          >
            {/* 남색 카드: Figma Frame 1618872954 512x590, radius 24, set 추가 시 스크롤 */}
            <div
              className="w-full flex-1 min-h-0 flex flex-col rounded-[24px] overflow-hidden bg-primary-15"
              style={{
                boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
              }}
            >
              {/* 헤더: Figma 16,16 → 480x32, 카드와 간격 100px */}
              <div className="flex-shrink-0 px-4 pt-4 pb-3 mb-[60px]">
                <h2 className="text-body2 text-white">Subgroup Sets Summary</h2>
              </div>
              {/* 흰 패널: Set 목록 + 구간 차트 + Disease Progression 축 */}
              <div className="flex-1 min-h-0 flex flex-col px-3 pb-3">
                <div className="flex-1 min-h-0 rounded-[16px] bg-white overflow-hidden flex flex-col border border-neutral-80 py-2 px-4">
                  {/* 하나의 div: Set별로 한 행(왼쪽+오른쪽), 구분선 일치 */}
                  <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
                    {SAMPLE_SETS.map((set) => {
                      const isSelected = selectedSetNo === set.no;
                      return (
                        <div
                          key={set.no}
                          className="flex border-b border-neutral-80 last:border-b-0 min-h-0"
                        >
                          {/* 왼쪽 셀: Set 버튼 + Groups (한 행 = 하나의 div, 2개 cell 구조) */}
                          <div className="w-[112px] flex-shrink-0 flex flex-col border-r border-neutral-80 py-2 px-0">
                            <div className="px-1 flex items-center gap-2 mb-1 h-[22px] flex-shrink-0">
                              <span
                                className="flex items-center justify-center gap-1 rounded-full bg-primary-10 text-body5m text-white shrink-0 box-border"
                                style={{
                                  width: 72,
                                  height: 18,
                                  padding: "0 6px",
                                }}
                              >
                                {set.setName}
                              </span>
                              {isSelected && (
                                <Image
                                  src="/assets/tsi/set-check.svg"
                                  alt=""
                                  width={18}
                                  height={18}
                                  className="flex-shrink-0"
                                />
                              )}
                            </div>
                            {set.groups.map((g) => (
                              <div
                                key={g}
                                className="pl-2 pr-1 h-7 flex items-center text-body4m text-neutral-30 flex-shrink-0"
                              >
                                {g}
                              </div>
                            ))}
                          </div>
                          {/* 오른쪽 셀: 왼쪽 기준 맞춤 (스페이서=Set행, 행높이=그룹 h-7) */}
                          <div className="flex-1 min-w-0 flex flex-col py-2 pl-2 pr-4 relative">
                            {/* 왼쪽 Set 행과 동일: h-[22px] + mb-1 */}
                            <div
                              className="h-[22px] flex-shrink-0 mb-1"
                              aria-hidden
                            />
                            {/* 눈금선: 엄청 연하게 (패딩=셀과 동일) */}
                            <div
                              className="absolute inset-0 flex justify-between pointer-events-none py-2 pl-2 pr-4"
                              aria-hidden
                            >
                              {Array.from({ length: 9 }).map((_, i) => (
                                <span
                                  key={i}
                                  className="w-px h-full flex-shrink-0 bg-neutral-90/20"
                                />
                              ))}
                            </div>
                            {set.groups.map((_, i) => {
                              const barColor =
                                GROUP_BAR_COLORS[i % GROUP_BAR_COLORS.length];
                              const leftPct = 20 + (i % 3) * 15;
                              const centerPct = 45 + (i % 3) * 10;
                              const rightPct = 70 + (i % 2) * 15;
                              return (
                                <div
                                  key={i}
                                  className="flex items-center h-7 flex-shrink-0 relative z-[1]"
                                >
                                  <div
                                    className="relative w-full h-2 flex items-center"
                                    style={{ minHeight: 8 }}
                                  >
                                    {/* 가로선: 심볼 구간 포함해 연속으로 (갭 없음) */}
                                    <div
                                      className="absolute h-px rounded-none"
                                      style={{
                                        left: `${leftPct}%`,
                                        right: `${100 - rightPct}%`,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        backgroundColor: barColor,
                                      }}
                                    />
                                    {/* 심볼: 선 위에 겹침 */}
                                    <span
                                      className="absolute w-3 h-3 rounded-full shrink-0"
                                      style={{
                                        left: `${centerPct}%`,
                                        top: "50%",
                                        transform: "translate(-50%, -50%)",
                                        backgroundColor: barColor,
                                      }}
                                    />
                                    {/* 왼쪽 꼬리: 선과 동일 1px, 길이 10px */}
                                    <span
                                      className="absolute shrink-0 w-px"
                                      style={{
                                        left: `${leftPct}%`,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        height: 10,
                                        backgroundColor: barColor,
                                      }}
                                    />
                                    {/* 오른쪽 꼬리 */}
                                    <span
                                      className="absolute shrink-0 w-px"
                                      style={{
                                        left: `${rightPct}%`,
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        height: 10,
                                        backgroundColor: barColor,
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                    {/* X축 행: 왼쪽 빈 칸 + 오른쪽에만 Slow/Rapid (위쪽 선은 마지막 Set 행 border-b로만 표시) */}
                    <div className="flex flex-shrink-0">
                      <div
                        className="w-[112px] flex-shrink-0  border-neutral-80"
                        aria-hidden
                      />
                      <div className="flex-1 min-w-0 pt-0 pb-1 pl-2 flex flex-col">
                        {/* 1) 축선 + 짧은 눈금(아래로) */}
                        <div className="w-full flex flex-col px-2 min-w-0">
                          <div
                            className="w-full border-b border-neutral-50"
                            aria-hidden
                          />
                          <div className="w-full flex justify-between px-0 mt-0">
                            {Array.from({ length: 9 }).map((_, i) => (
                              <span
                                key={i}
                                className="w-px h-1 bg-neutral-40 shrink-0"
                                aria-hidden
                              />
                            ))}
                          </div>
                        </div>
                        {/* 2) 그 아래 줄: Slow / Rapid */}
                        <div className="w-full flex items-center justify-between text-body5 text-neutral-30 gap-2 px-2 mt-0.5">
                          <span className="shrink-0">Slow</span>
                          <span className="flex-1 shrink-0" aria-hidden />
                          <span className="shrink-0">Rapid</span>
                        </div>
                        {/* 3) Disease Progression */}
                        <div className="text-body4m text-neutral-30 mt-0.5 w-full text-center">
                          Disease Progression
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* 오른쪽 상위 배경 카드: selection-bg.png → 안에 흰색 테이블 카드 */}
          <div
            className="flex-1 min-w-0 rounded-[24px] overflow-hidden flex flex-col min-h-[796px] flex-shrink-0 p-3"
            style={{
              backgroundImage: "url(/assets/tsi/selection-bg.png)",
              backgroundSize: "100% 100%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <div className="relative p-0 flex flex-col flex-1 min-h-0">
              {/* 안에 테이블 카드 (흰색) */}
              <div
                className="flex-1 flex flex-col min-h-0 rounded-[24px] overflow-hidden bg-white py-2 px-4"
                style={{
                  boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <div className="flex-1 overflow-auto min-h-0 w-full">
                    {/* 전통적인 HTML 테이블: 좌우 padding 8px 고정, 헤더 컬럼 auto */}
                    <RadioGroup.Root
                      value={selectedSetNo}
                      onValueChange={setSelectedSetNo}
                      className="w-full"
                    >
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-neutral-30">
                            <th
                              className={`${TABLE_HEADER_CELL_BASE_NO_BORDER} text-center`}
                            >
                              <div className={TABLE_INNER_DIV_CENTER_NO_BORDER}>
                                Detail
                              </div>
                            </th>
                            <th
                              className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-center`}
                            >
                              <div className={TABLE_INNER_DIV_CENTER}>
                                Select
                              </div>
                            </th>
                            <th
                              className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}
                            >
                              <div className={TABLE_INNER_DIV_LEFT}>No</div>
                            </th>
                            <th
                              className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}
                            >
                              <div className={TABLE_INNER_DIV_LEFT}>
                                Set Name
                              </div>
                            </th>
                            <th
                              className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}
                            >
                              <div className={TABLE_INNER_DIV_LEFT}>
                                Outcome
                              </div>
                            </th>
                            <th
                              className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}
                            >
                              <div className={TABLE_INNER_DIV_LEFT}>Cutoff</div>
                            </th>
                            <th
                              className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}
                            >
                              <div className={TABLE_INNER_DIV_LEFT}>Month</div>
                            </th>
                            <th
                              className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}
                            >
                              <div className={TABLE_INNER_DIV_LEFT}>
                                #Of Groups
                              </div>
                            </th>
                            <th
                              className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}
                            >
                              <div className={TABLE_INNER_DIV_LEFT}>
                                Variance Benefit
                              </div>
                            </th>
                            <th
                              className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}
                            >
                              <div className={TABLE_INNER_DIV_LEFT}>
                                Group balance
                              </div>
                            </th>
                            <th
                              className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}
                            >
                              <div className={TABLE_INNER_DIV_LEFT}>
                                Refine Cutoffs
                              </div>
                            </th>
                            <th
                              className={`${TABLE_HEADER_CELL_BASE_LAST} text-right`}
                            >
                              <div className={TABLE_INNER_DIV_LEFT}>Delete</div>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {SAMPLE_SETS.map((row) => {
                            const isSelected = selectedSetNo === row.no;
                            const isExpanded = expandedRows.has(row.no);
                            return (
                              <Fragment key={row.no}>
                                <tr
                                  className={isExpanded ? "bg-[#efeff4]" : ""}
                                >
                                  <td
                                    className={`${TABLE_BODY_CELL_BASE_NO_BORDER} text-center`}
                                  >
                                    <div
                                      className={
                                        TABLE_INNER_DIV_CENTER_NO_BORDER
                                      }
                                    >
                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleRowExpansion(row.no)
                                        }
                                        className="cursor-pointer text-neutral-40 p-0 border-0 bg-transparent inline-flex items-center justify-center shrink-0 transition-transform duration-200"
                                        title={isExpanded ? "접기" : "펼치기"}
                                      >
                                        <svg
                                          width="24"
                                          height="24"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                          className={`text-neutral-40 transition-transform duration-200 ${
                                            isExpanded ? "rotate-180" : ""
                                          }`}
                                        >
                                          <path
                                            d="M12.0078 16C11.6866 16 11.394 15.8735 11.1299 15.6205L5.31077 9.79886C5.20718 9.6926 5.12949 9.57875 5.07769 9.45731C5.0259 9.33586 5 9.2043 5 9.06262C5 8.86528 5.04661 8.68564 5.13984 8.52372C5.23825 8.3618 5.36774 8.23529 5.5283 8.14421C5.69404 8.04807 5.87532 8 6.07214 8C6.37255 8 6.6367 8.10879 6.86459 8.32638L12.3496 13.8368L11.6659 13.8368L17.1354 8.32638C17.3633 8.10879 17.6274 8 17.9279 8C18.1247 8 18.3034 8.04807 18.4639 8.14421C18.6297 8.2353 18.7592 8.3618 18.8524 8.52372C18.9508 8.68564 19 8.86528 19 9.06262C19 9.34599 18.8964 9.58887 18.6892 9.79127L12.8701 15.6205C12.7458 15.747 12.6112 15.8406 12.4661 15.9013C12.3263 15.9621 12.1735 15.9949 12.0078 16Z"
                                            fill="currentColor"
                                          />
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                  <td
                                    className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-center`}
                                  >
                                    <div className={TABLE_INNER_DIV_CENTER}>
                                      <RadioGroup.Item
                                        value={row.no}
                                        id={`radio-${row.no}`}
                                        className="flex items-center justify-center cursor-pointer w-8 h-8 shrink-0 border-0 bg-transparent p-0 outline-none focus:outline-none focus:ring-0"
                                      >
                                        <span
                                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                            isSelected
                                              ? "border-neutral-60 bg-primary-15"
                                              : "border-neutral-60"
                                          }`}
                                        >
                                          <RadioGroup.Indicator className="flex items-center justify-center w-full h-full">
                                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                          </RadioGroup.Indicator>
                                        </span>
                                      </RadioGroup.Item>
                                    </div>
                                  </td>
                                  <td
                                    className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                  >
                                    <div className={TABLE_INNER_DIV_LEFT}>
                                      <span className="truncate block">
                                        {row.no}
                                      </span>
                                    </div>
                                  </td>
                                  <td
                                    className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                  >
                                    <div className={TABLE_INNER_DIV_LEFT}>
                                      <span className="inline-flex items-center gap-1 truncate min-w-0">
                                        <span className="truncate">
                                          {row.setName}
                                        </span>
                                        {isSelected && (
                                          <Image
                                            src="/assets/tsi/set-check.svg"
                                            alt=""
                                            width={18}
                                            height={18}
                                            className="flex-shrink-0"
                                          />
                                        )}
                                      </span>
                                    </div>
                                  </td>
                                  <td
                                    className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                  >
                                    <div className={TABLE_INNER_DIV_LEFT}>
                                      <span className="truncate block">
                                        {row.outcome}
                                      </span>
                                    </div>
                                  </td>
                                  <td
                                    className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                  >
                                    <div className={TABLE_INNER_DIV_LEFT}>
                                      <span className="truncate block">
                                        {row.cutoff}
                                      </span>
                                    </div>
                                  </td>
                                  <td
                                    className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                  >
                                    <div className={TABLE_INNER_DIV_LEFT}>
                                      <span className="truncate block">
                                        {row.month}
                                      </span>
                                    </div>
                                  </td>
                                  <td
                                    className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                  >
                                    <div className={TABLE_INNER_DIV_LEFT}>
                                      <span className="truncate block">
                                        {row.numGroups}
                                      </span>
                                    </div>
                                  </td>
                                  <td
                                    className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left ${row.varianceBenefit.includes("Highest") ? "text-[#3A11D8]" : ""}`}
                                  >
                                    <div className={TABLE_INNER_DIV_LEFT}>
                                      <span className="truncate block">
                                        {row.varianceBenefit}
                                      </span>
                                    </div>
                                  </td>
                                  <td
                                    className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                  >
                                    <div className={TABLE_INNER_DIV_LEFT}>
                                      <span className="truncate block">
                                        {row.groupBalance}
                                      </span>
                                    </div>
                                  </td>
                                  <td
                                    className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-center`}
                                  >
                                    <div className={TABLE_INNER_DIV_CENTER}>
                                      <button
                                        type="button"
                                        className="p-1 text-neutral-40 hover:text-neutral-30 cursor-pointer shrink-0 border-0 bg-transparent"
                                        title="Refine Cutoffs"
                                        onClick={() => router.push("/tsi/refine-cutoffs")}
                                      >
                                        <svg
                                          width="24"
                                          height="24"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          xmlns="http://www.w3.org/2000/svg"
                                        >
                                          <g
                                            style={{
                                              mixBlendMode: "plus-darker",
                                            }}
                                          >
                                            <path
                                              d="M3.57812 20.4219V15.6094L15.6094 3.57812L20.4219 8.39062L8.39062 20.4219H3.57812Z"
                                              stroke="#787776"
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            />
                                            <path
                                              d="M12.0156 7.1875L16.8281 12"
                                              stroke="#787776"
                                              strokeWidth="2"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            />
                                          </g>
                                        </svg>
                                      </button>
                                    </div>
                                  </td>
                                  <td
                                    className={`${TABLE_BODY_CELL_BASE_LAST} text-center`}
                                  >
                                    <div className={TABLE_INNER_DIV_CENTER}>
                                      <button
                                        type="button"
                                        className="p-1 text-neutral-40 hover:text-neutral-30 cursor-pointer shrink-0 border-0 bg-transparent"
                                        title="Delete"
                                      >
                                        <Image
                                          src="/assets/icons/trash.svg"
                                          alt="Delete"
                                          width={24}
                                          height={24}
                                        />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                                {isExpanded && (
                                  <tr className="bg-[#efeff4]">
                                    <td
                                      colSpan={12}
                                      className="p-0 border-b border-neutral-80"
                                    >
                                      <div className="bg-[#efeff4] px-4 py-6">
                                        <div className="flex gap-3">
                                          {/* Left Column */}
                                          <div className="w-[372px] flex flex-col gap-3">
                                            {/* Disease Progression by Subgroup */}
                                            <div className="h-[252px] bg-white/60 rounded-[18px] p-4 flex flex-col">
                                              <h3 className="text-[#1c1b1b] text-body3 font-semibold mb-4 flex-shrink-0">
                                                Disease Progression by Subgroup
                                              </h3>
                                              <div className="flex-1 bg-white rounded-[8px] flex items-center justify-center min-h-0">
                                                <span className="text-[#484646] text-sm">
                                                  Chart placeholder
                                                </span>
                                              </div>
                                            </div>
                                            {/* Number of patients */}
                                            <div className="h-[196px] bg-white/60 rounded-[18px] p-4 flex flex-col">
                                              <h3 className="text-[#1c1b1b] text-body3 font-semibold mb-0 flex-shrink-0">
                                                Number of patients
                                              </h3>
                                              <p className="text-[#605e5e] text-sm mb-0 flex-shrink-0">
                                                At least 00 patients per group
                                                are recommended.
                                              </p>
                                              <div className="mt-auto">
                                                <div className="h-[110px] bg-white rounded-[8px] p-3 space-y-0 overflow-auto">
                                                  <div className="flex items-center gap-2 text-[#231f52] text-sm font-semibold pb-0 border-b border-[#adaaaa]">
                                                    <span>Group</span>
                                                    <span className="ml-auto">
                                                      Number of patients
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center gap-2 text-[#1c1b1b] text-sm">
                                                    <div className="w-3 h-3 rounded-full bg-[#231f52]"></div>
                                                    <span>High Risk</span>
                                                    <span className="ml-auto">
                                                      120
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center gap-2 text-[#1c1b1b] text-sm border-t border-[#adaaaa] pt-0">
                                                    <div className="w-3 h-3 rounded-full bg-[#7571a9]"></div>
                                                    <span>Middle Risk</span>
                                                    <span className="ml-auto">
                                                      250
                                                    </span>
                                                  </div>
                                                  <div className="flex items-center gap-2 text-[#1c1b1b] text-sm border-t border-[#adaaaa] pt-0">
                                                    <div className="w-3 h-3 rounded-full bg-[#aaa5e1]"></div>
                                                    <span>Low</span>
                                                    <span className="ml-auto">
                                                      150
                                                    </span>
                                                  </div>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                          {/* Right Column */}
                                          <div className="w-[746px] h-[468px] bg-primary-15 rounded-[18px] px-4 py-6 flex flex-col gap-3">
                                            {/* Variance Reduction Explained */}
                                            <div>
                                              <h3 className="text-white text-feature-title mb-4">
                                                Variance Reduction Explained
                                              </h3>
                                              <p className="text-white text-body5 font-semibold leading-relaxed">
                                                Subgroup stratification reduced
                                                the overall variance by 35.5%.
                                                The observed variance reduction
                                                was primarily driven by the Low
                                                Risk patient group. Therefore,
                                                if cutoff adjustment is
                                                required, maintaining the Low
                                                Risk group and adjusting the
                                                cutoff for the High Risk group
                                                is a reasonable strategy.
                                              </p>
                                            </div>
                                            {/* Two cards in one row */}
                                            <div className="grid grid-cols-2 gap-3 mt-auto">
                                              {/* Variance decomposition */}
                                              <div className="w-[350px] h-[306px] bg-white rounded-[12px] p-4 flex flex-col">
                                                <h3 className="text-[#1c1b1b] text-body4 mb-4 tracking-[-0.75px]">
                                                  Variance decomposition
                                                </h3>
                                                <div className="mb-4 flex gap-5">
                                                  <div>
                                                    <div className="text-[#f06600] text-body5 font-semibold mb-1">
                                                      Variance
                                                    </div>
                                                    <div className="text-[#f06600] text-[28px] font-semibold leading-[28px] tracking-[-0.84px]">
                                                      30.10
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <div className="text-[#f06600] text-body5 font-semibold mb-1">
                                                      VR
                                                    </div>
                                                    <div className="text-[#f06600] text-[28px] font-semibold leading-[28px] tracking-[-0.84px]">
                                                      0.348
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="flex-1 bg-white rounded flex items-center justify-center border border-[#484646] min-h-0">
                                                  <span className="text-[#484646] text-sm">
                                                    Chart placeholder
                                                  </span>
                                                </div>
                                              </div>
                                              {/* Within-group variance by subgroup */}
                                              <div className="w-[350px] h-[306px] bg-white rounded-[12px] p-4">
                                                <h3 className="text-[#262625] text-[15px] font-semibold mb-4">
                                                  Within-group variance by
                                                  subgroup
                                                </h3>
                                                <div className="mb-4 flex gap-5">
                                                  <div>
                                                    <div className="text-[#f06600] text-xs font-semibold mb-1">
                                                      High
                                                    </div>
                                                    <div className="text-[#f06600] text-[28px] font-semibold">
                                                      50
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <div className="text-[#f06600] text-xs font-semibold mb-1">
                                                      Middle
                                                    </div>
                                                    <div className="text-[#f06600] text-[28px] font-semibold">
                                                      30
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <div className="text-[#f06600] text-xs font-semibold mb-1">
                                                      Low
                                                    </div>
                                                    <div className="text-[#f06600] text-[28px] font-semibold">
                                                      12
                                                    </div>
                                                  </div>
                                                </div>
                                                <div className="h-40 bg-white rounded mb-4 flex items-center justify-center border border-[#484646]">
                                                  <span className="text-[#484646] text-sm">
                                                    Chart placeholder
                                                  </span>
                                                </div>
                                                <div className="text-[#484646] text-xs text-center">
                                                  Total var=30.10
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </RadioGroup.Root>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* 버튼: 카드 밖 아래 */}
        <div className="w-[1772px] flex-shrink-0 mx-auto flex justify-end items-center gap-4 mt-4 pb-2">
          <button
            type="button"
            className="inline-flex items-center justify-center h-[48px] cursor-pointer hover:opacity-90 transition-opacity border-0 bg-transparent p-0"
            aria-label="Save Progress"
          >
            <Image
              src="/assets/tsi/savebtn.png"
              alt="Save Progress"
              width={160}
              height={48}
              className="h-[48px] w-auto object-contain"
            />
          </button>
          <button
            type="button"
            onClick={handleSubgroupExplain}
            className="inline-flex items-center justify-center w-[179px] h-[48px] rounded-[100px] text-body3 text-neutral-30 cursor-pointer hover:opacity-90 transition-opacity border-0 shrink-0 bg-no-repeat bg-center bg-cover"
            style={{ backgroundImage: "url(/assets/tsi/btn.png)" }}
            aria-label="Subgroup Explain"
          >
            Subgroup Explain
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
