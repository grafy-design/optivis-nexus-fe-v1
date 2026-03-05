"use client";

import { Suspense, useState, Fragment, useEffect } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { AppLayout } from "@/components/layout/AppLayout";
import IconButton from "@/components/ui/icon-button";
import {
  getSubgroupSummaryList,
  type SubgroupSetSummary,
  type ResultTableItem,
} from "@/services/subgroup-service";
import ReactECharts from "echarts-for-react";
import { Loading } from "@/components/common/Loading";

/**
 * TSI Step 4: Subgroup Selection
 * 구조: 상위 배경 카드 2개 나란히
 * - 왼쪽 상위: selection-left.png → 안에 남색 카드 (Subgroup Sets Summary)
 * - 오른쪽 상위: selection-bg.png → 안에 흰색 테이블 카드
 */

// UI에서 사용하는 Set 데이터 구조
interface SetData {
  no: string;
  setName: string;
  groups: string[];
  outcome: string;
  cutoff: string;
  month: string;
  numGroups: string;
  varianceBenefit: string;
  groupBalance: string;
}

/** 그룹별 에러바 색상 (Group 1, 2, 3 각각 구분) */
const GROUP_BAR_COLORS = ["#AAA5E1", "#7571A9", "#231F52"];
const SUMMARY_ERROR_BAR_LINE_HEIGHT_PX = 2;
const SUMMARY_ERROR_BAR_CAP_WIDTH_PX = 2;
const SUMMARY_ERROR_BAR_CAP_HEIGHT_PX = 6;
const SUMMARY_ERROR_BAR_DOT_SIZE_PX = 8;
const MAX_GROUP_DISPLAY_COUNT = 3;

/** 테이블 공통 스타일 */
const TABLE_CELL_BASE = "h-[52px] border-b align-middle";
const TABLE_HEADER_CELL_BASE = "border-b align-middle py-1";
/** border-l이 없는 셀: 오른쪽 padding만 8px */
const TABLE_HEADER_CELL_BASE_NO_BORDER = `${TABLE_HEADER_CELL_BASE} pr-2 border-neutral-30 text-neutral-30 font-semibold break-words leading-tight [font-size:clamp(0.6rem,1vw,0.75rem)]`;
const TABLE_BODY_CELL_BASE_NO_BORDER = `${TABLE_CELL_BASE} pr-2 border-neutral-80 text-body5 text-neutral-40`;
/** border-l이 있는 셀: 오른쪽 padding만 8px, 왼쪽은 margin으로 처리 */
const TABLE_HEADER_CELL_BASE_WITH_BORDER = `${TABLE_HEADER_CELL_BASE} pr-2 border-neutral-30 text-neutral-30 font-semibold break-words leading-tight [font-size:clamp(0.6rem,1vw,0.75rem)]`;
const TABLE_BODY_CELL_BASE_WITH_BORDER = `${TABLE_CELL_BASE} pr-2 border-neutral-80 text-body5 text-neutral-40`;
/** 마지막 컬럼: border-l은 있지만 padding 없음 */
const TABLE_HEADER_CELL_BASE_LAST = `${TABLE_HEADER_CELL_BASE} border-neutral-30 text-neutral-30 font-semibold break-words leading-tight [font-size:clamp(0.6rem,1vw,0.75rem)]`;
const TABLE_BODY_CELL_BASE_LAST = `${TABLE_CELL_BASE} border-neutral-80 text-body5 text-neutral-40`;

/** 내부 div: 셀과 같은 너비, 더 작은 높이(36px), 세로선 포함 */
const TABLE_INNER_DIV_CENTER =
  "w-full min-h-[28px] flex items-center justify-center border-l border-neutral-80 pl-2";
const TABLE_INNER_DIV_LEFT =
  "w-full min-h-[28px] flex items-center border-l border-neutral-80 pl-2";
const TABLE_INNER_DIV_CENTER_NO_BORDER =
  "w-full min-h-[28px] flex items-center justify-center";
const TABLE_INNER_DIV_LEFT_NO_BORDER = "w-full min-h-[28px] flex items-center";

const getCiText = (
  varianceDecomposition: ResultTableItem["variance_decomposition"],
) => {
  if (!varianceDecomposition) return "";
  const listItem = varianceDecomposition[varianceDecomposition.length - 1];
  return `N=${listItem.number}, K=${listItem.variance} VR:${listItem.vr} (${listItem.ci})
  η²=${listItem.eta_square}, ω²=${listItem.omega} `;
};

const getDisplayGroupCount = (
  requestedCount: number | null | undefined,
  fallbackCount: number,
): number => {
  const requested =
    typeof requestedCount === "number" && Number.isFinite(requestedCount)
      ? Math.floor(requestedCount)
      : 0;
  const fallback = Math.max(Math.floor(fallbackCount), 0);

  if (requested > 0) {
    return Math.min(requested, MAX_GROUP_DISPLAY_COUNT);
  }

  return Math.min(fallback, MAX_GROUP_DISPLAY_COUNT);
};

const clampGroupArray = <T,>(
  items: T[],
  requestedCount: number | null | undefined,
  fallbackCount: number,
): T[] => {
  const limit = getDisplayGroupCount(requestedCount, fallbackCount);
  if (limit <= 0) return [];
  return items.slice(0, limit);
};

function TSISubgroupSelectionPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId") ?? "";
  const [selectedSetNo, setSelectedSetNo] = useState<string>("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  // 왼쪽 그래프용: subgroup_sets_summary 데이터
  const [summaryData, setSummaryData] = useState<SubgroupSetSummary[]>([]);
  // 오른쪽 테이블용: result_table 데이터
  const [resultTableData, setResultTableData] = useState<ResultTableItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 페이지 마운트 시 API 호출
  useEffect(() => {
    if (!taskId) {
      setSummaryData([]);
      setResultTableData([]);
      setSelectedSetNo("");
      setError(
        "taskId 쿼리 파라미터가 없습니다. 필수 정보가 확인되지 않아 요청을 진행할 수 없습니다. 이전 단계부터 다시 진행해 주세요.",
      );
      setIsLoading(false);
      return;
    }

    const fetchSubgroupSummary = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getSubgroupSummaryList(taskId);

        // 왼쪽 그래프용: subgroup_sets_summary 저장
        setSummaryData(response.data.subgroup_sets_summary);

        // 오른쪽 테이블용: result_table 저장
        setResultTableData(response.data.result_table);

        // 초기 선택 없음 (체크박스 미선택 상태)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Subgroup Summary 조회에 실패했습니다.",
        );
        console.error("Subgroup Summary API 호출 실패:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubgroupSummary();
  }, [taskId]);

  const toggleRowExpansion = (rowNo: string) => {
    setExpandedRows((prev) => {
      // 이미 펼쳐진 행이면 닫기
      if (prev.has(rowNo)) {
        return new Set();
      } else {
        // 새로운 행을 펼치고, 기존에 펼쳐진 행은 모두 닫기 (하나만 펼치기)
        return new Set([rowNo]);
      }
    });
  };

  const handleSubgroupExplain = () => {
    if (!taskId) {
      return;
    }

    const selected = resultTableData.find(
      (item) => item.no === parseInt(selectedSetNo),
    );

    if (selected) {
      const query = new URLSearchParams({
        subgroupId: String(selected.subgroup_id),
        taskId,
      });
      router.push(`/tsi/subgroup-explain?${query.toString()}`);
    }
  };

  return (
    <AppLayout headerType="tsi" scaleMode="fit">
      <Loading isLoading={isLoading} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "calc(100% - 28px)",
          height: "100%",
          gap: 24,
          marginLeft: "14px",
          marginRight: "14px",
        }}
      >
        {/* Title */}
        <div style={{ flexShrink: 0, padding: "0 12px" }}>
          <h1
            style={{
              fontFamily: "Poppins, Inter, sans-serif",
              fontSize: 42,
              fontWeight: 600,
              color: "rgb(17,17,17)",
              letterSpacing: "-1.5px",
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            Target Subgroup Identification
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
            Subgroup Selection
          </span>
        </div>

        {/* 메인+버튼 묶음 컨테이너 */}
        <div className="flex flex-col flex-1 min-h-0" style={{ gap: 0 }}>
          {/* 메인: 상위 배경 카드 2개 나란히 (좌 selection-left, 우 selection-bg) */}
          <div
            className="flex flex-row flex-nowrap items-stretch gap-0 flex-1 min-h-0"
            style={{ minWidth: 0 }}
          >
            {/* 왼쪽 상위 배경 카드: selection-left.png (Figma 536x614, radius 36) */}
            <div
              className="flex min-h-0 flex-[30] min-w-0 flex-col overflow-hidden rounded-[36px] p-0"
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
              {/* 남색 카드: Figma Frame 1618872954 512x590, radius 24, set 추가 시 스크롤 */}
              <div
                className="bg-primary-15 flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-[24px]"
                style={{
                  boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
                }}
              >
                {/* 헤더: Figma 16,16 → 480x32, 카드와 간격 100px */}
                <div className="mb-[60px] flex-shrink-0 px-4 pt-4 pb-3">
                  <h2 className="text-body1 text-white">
                    Subgroup Sets Summary
                  </h2>
                </div>
                {/* 흰 패널: Set 목록 + 구간 차트 + Disease Progression 축 */}
                <div className="flex min-h-0 flex-1 flex-col px-3 pb-3">
                  <div className="border-neutral-80 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[16px] border bg-white px-4 py-2">
                    {/* 하나의 div: Set별로 한 행(왼쪽+오른쪽), 구분선 일치 */}
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
                        {isLoading ? (
                          <div className="flex h-full items-center justify-center">
                            <div className="text-body3 text-white">
                              Loading...
                            </div>
                          </div>
                        ) : error ? (
                          <div className="flex flex-1 items-center justify-center">
                            <div className="flex flex-col items-center gap-1 text-center">
                              <div className="text-body4 text-red-500">
                                Error: {error.split(". ")[0]}.
                              </div>
                              {error.split(". ").slice(1).join(". ") && (
                                <div className="text-body5m text-neutral-400">
                                  {error.split(". ").slice(1).join(". ")}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : summaryData.length === 0 ? (
                          <div className="flex h-full items-center justify-center">
                            <div className="text-body3 text-white">
                              No data available
                            </div>
                          </div>
                        ) : (
                          summaryData.map((set, index) => {
                            // result_table에서 해당 set_name과 일치하는 항목 찾아서 no 가져오기
                            const tableItem = resultTableData.find(
                              (t) => t.set_name === set.set_name,
                            );
                            const setNo = tableItem
                              ? String(tableItem.no).padStart(2, "0")
                              : String(index + 1).padStart(2, "0");
                            const summaryLimit = getDisplayGroupCount(
                              tableItem?.of_group,
                              set.groups.length,
                            );
                            const displayGroups = set.groups.slice(
                              0,
                              summaryLimit,
                            );

                            return (
                              <div
                                key={`${set.set_name}_${index}`}
                                className="border-neutral-80 flex min-h-0 flex-1 border-b last:border-b-0"
                              >
                                {/* 왼쪽 셀: Set 버튼 + Groups (한 행 = 하나의 div, 2개 cell 구조) */}
                                <div className="border-neutral-80 flex w-[112px] flex-shrink-0 flex-col border-r px-0 py-2">
                                  {/* 초록 컨테이너: Set label 영역 (flex-1 = group rows와 동일 높이) */}
                                  <div className="flex flex-1 flex-shrink-0 items-center gap-2 px-1">
                                    <span
                                      className="bg-primary-10 text-body5m box-border flex shrink-0 items-center justify-center gap-1 rounded-full text-white"
                                      style={{
                                        width: 72,
                                        height: 20,
                                        padding: "0 6px",
                                      }}
                                    >
                                      {set.set_name}
                                    </span>
                                    {tableItem?.variance_benefit_label && (
                                      <Image
                                        src="/assets/tsi/set-check.svg"
                                        alt=""
                                        width={18}
                                        height={20}
                                        className="flex-shrink-0"
                                      />
                                    )}
                                  </div>
                                  {/* 노랑 컨테이너: Group rows 영역 (flex-1 = Set label과 동일 높이) */}
                                  <div className="flex flex-1 flex-col">
                                    {displayGroups.map((g, groupIndex) => {
                                      // group1 -> Group 1 형식으로 변환
                                      const groupNum = g.group.replace(
                                        "group",
                                        "",
                                      );
                                      const groupName = `Group ${groupNum}`;
                                      return (
                                        <div
                                          key={`${set.set_name}-group-${groupIndex}`}
                                          className="text-body5m text-neutral-30 flex min-h-0 flex-1 items-center pr-1 pl-2"
                                        >
                                          {groupName}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                                {/* 오른쪽 셀: 왼쪽 기준 맞춤 */}
                                <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden py-2 pr-4 pl-2">
                                  {/* Set label 영역과 동일: flex-1 스페이서 */}
                                  <div
                                    className="flex-1 flex-shrink-0"
                                    aria-hidden
                                  />
                                  {/* 눈금선: 차트 행 영역에만 표시 (Set 행 spacer 아래부터) */}
                                  <div
                                    className="pointer-events-none absolute right-0 left-0 flex justify-between pr-4 pl-2"
                                    style={{ top: 34, bottom: 8 }}
                                    aria-hidden
                                  >
                                    {Array.from({ length: 9 }).map((_, i) => (
                                      <span
                                        key={i}
                                        className="bg-neutral-90/20 h-full w-px flex-shrink-0"
                                      />
                                    ))}
                                  </div>
                                  {(() => {
                                    // 현재 Set의 개별 min/max 계산 (각 Set마다 독립적인 스케일)
                                    const setValues = displayGroups.flatMap(
                                      (g) => [g.ci_low, g.ci_high, g.mean],
                                    );
                                    const setMinValue = Math.min(...setValues);
                                    const setMaxValue = Math.max(...setValues);
                                    const setRange = setMaxValue - setMinValue;

                                    // 현재 Set의 개별 min/max 범위로 정규화하는 함수
                                    const normalize = (value: number) => {
                                      if (setRange === 0) return 50; // 범위가 0이면 중앙에 배치
                                      return (
                                        ((value - setMinValue) / setRange) * 100
                                      );
                                    };

                                    return displayGroups.map((g, i) => {
                                      const barColor =
                                        GROUP_BAR_COLORS[
                                          i % GROUP_BAR_COLORS.length
                                        ];

                                      // 각 Set의 개별 min/max 범위로 정규화 (독립적인 스케일)
                                      const meanPct = normalize(g.mean);
                                      const ciLowPct = normalize(g.ci_low);
                                      const ciHighPct = normalize(g.ci_high);

                                      return (
                                        <div
                                          key={`${set.set_name}-chart-${i}`}
                                          className="relative z-[1] flex min-h-0 flex-1 items-center"
                                        >
                                          <div
                                            className="relative flex h-2 w-full items-center"
                                            style={{ minHeight: 8 }}
                                          >
                                            {/* 가로선: ci_low ~ ci_high 범위 */}
                                            <div
                                              className="absolute rounded-full"
                                              style={{
                                                left: `${ciLowPct}%`,
                                                right: `${100 - ciHighPct}%`,
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                backgroundColor: barColor,
                                                height:
                                                  SUMMARY_ERROR_BAR_LINE_HEIGHT_PX,
                                              }}
                                            />
                                            {/* 심볼: mean 위치 */}
                                            <span
                                              className="absolute shrink-0 rounded-full"
                                              style={{
                                                left: `${meanPct}%`,
                                                top: "50%",
                                                transform:
                                                  "translate(-50%, -50%)",
                                                backgroundColor: barColor,
                                                width:
                                                  SUMMARY_ERROR_BAR_DOT_SIZE_PX,
                                                height:
                                                  SUMMARY_ERROR_BAR_DOT_SIZE_PX,
                                              }}
                                            />
                                            {/* 왼쪽 꼬리: ci_low 위치 */}
                                            <span
                                              className="absolute shrink-0 rounded-full"
                                              style={{
                                                left: `${ciLowPct}%`,
                                                top: "50%",
                                                transform:
                                                  "translate(-50%, -50%)",
                                                width:
                                                  SUMMARY_ERROR_BAR_CAP_WIDTH_PX,
                                                height:
                                                  SUMMARY_ERROR_BAR_CAP_HEIGHT_PX,
                                                backgroundColor: barColor,
                                              }}
                                            />
                                            {/* 오른쪽 꼬리: ci_high 위치 */}
                                            <span
                                              className="absolute shrink-0 rounded-full"
                                              style={{
                                                left: `${ciHighPct}%`,
                                                top: "50%",
                                                transform:
                                                  "translate(-50%, -50%)",
                                                width:
                                                  SUMMARY_ERROR_BAR_CAP_WIDTH_PX,
                                                height:
                                                  SUMMARY_ERROR_BAR_CAP_HEIGHT_PX,
                                                backgroundColor: barColor,
                                              }}
                                            />
                                          </div>
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                      {/* overflow-y-auto */}
                      {/* X축 행: 왼쪽 빈 칸 + 오른쪽에만 Slow/Rapid (위쪽 선은 마지막 Set 행 border-b로만 표시) */}
                      <div
                        className={`flex flex-shrink-0 ${error ? "invisible" : ""}`}
                      >
                        <div
                          className="border-neutral-80 w-[112px] flex-shrink-0"
                          aria-hidden
                        />
                        <div className="flex min-w-0 flex-1 flex-col pt-0 pb-1 pl-2">
                          {/* 1) 축선 + 짧은 눈금(아래로) */}
                          <div className="flex w-full min-w-0 flex-col px-2">
                            <div
                              className="w-full border-b-[1.5px] border-neutral-50"
                              aria-hidden
                            />
                            <div className="mt-0 flex w-full justify-between px-0">
                              {Array.from({ length: 9 }).map((_, i) => (
                                <span
                                  key={i}
                                  className="bg-neutral-40 h-1 w-px shrink-0"
                                  aria-hidden
                                />
                              ))}
                            </div>
                          </div>
                          {/* 2) 그 아래 줄: Slow / Rapid */}
                          <div className="text-body5 text-neutral-30 mt-0.5 flex w-full items-center justify-between gap-2 px-2">
                            <span className="shrink-0">Slow</span>
                            <span className="flex-1 shrink-0" aria-hidden />
                            <span className="shrink-0">Rapid</span>
                          </div>
                          {/* 3) Disease Progression */}
                          <div className="text-body5m text-neutral-30 mt-0.5 w-full text-center">
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
              className="flex min-h-0 min-w-0 flex-[70] flex-col overflow-hidden rounded-[24px] p-0"
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
              <div className="relative flex min-h-0 flex-1 flex-col p-0">
                {/* 안에 테이블 카드 (흰색) */}
                <div
                  className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] bg-white px-4 py-2"
                  style={{
                    boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <div className="min-h-0 w-full flex-1 overflow-auto">
                      {/* 전통적인 HTML 테이블: 좌우 padding 8px 고정, 헤더 컬럼 auto */}
                      <RadioGroup.Root
                        value={selectedSetNo}
                        onValueChange={(value) => {
                          setSelectedSetNo(value);
                        }}
                        className="w-full"
                      >
                        <table className="w-full table-fixed border-collapse">
                          <colgroup>
                            <col style={{ width: "5%" }} />
                            <col style={{ width: "6%" }} />
                            <col style={{ width: "5%" }} />
                            <col style={{ width: "13%" }} />
                            <col style={{ width: "10%" }} />
                            <col style={{ width: "8%" }} />
                            <col style={{ width: "7%" }} />
                            <col style={{ width: "8%" }} />
                            <col style={{ width: "12%" }} />
                            <col style={{ width: "10%" }} />
                            <col style={{ width: "8%" }} />
                            <col style={{ width: "8%" }} />
                          </colgroup>
                          <thead>
                            <tr className="border-neutral-30 border-b">
                              <th
                                className={`${TABLE_HEADER_CELL_BASE_NO_BORDER} text-center`}
                              >
                                <div
                                  className={TABLE_INNER_DIV_CENTER_NO_BORDER}
                                >
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
                                <div className={TABLE_INNER_DIV_LEFT}>
                                  Cutoff
                                </div>
                              </th>
                              <th
                                className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}
                              >
                                <div className={TABLE_INNER_DIV_LEFT}>
                                  Month
                                </div>
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
                                  Refine
                                  <br />
                                  Cutoffs
                                </div>
                              </th>
                              <th
                                className={`${TABLE_HEADER_CELL_BASE_LAST} text-right`}
                              >
                                <div className={TABLE_INNER_DIV_LEFT}>
                                  Delete
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {isLoading ? (
                              <tr>
                                <td
                                  colSpan={12}
                                  className="h-[200px] text-center"
                                >
                                  <div className="text-body3 text-neutral-50">
                                    Loading...
                                  </div>
                                </td>
                              </tr>
                            ) : error ? (
                              <tr>
                                <td
                                  colSpan={12}
                                  className="h-[200px] text-center align-middle"
                                >
                                  <div className="flex flex-col items-center gap-1">
                                    <div className="text-body4 text-red-500">
                                      Error: {error.split(". ")[0]}.
                                    </div>
                                    {error.split(". ").slice(1).join(". ") && (
                                      <div className="text-body5m text-neutral-400">
                                        {error.split(". ").slice(1).join(". ")}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ) : resultTableData.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={12}
                                  className="h-[200px] text-center"
                                >
                                  <div className="text-body3 text-neutral-50">
                                    No data available
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              resultTableData.map((row) => {
                                const rowNo = String(row.no).padStart(2, "0");
                                const isSelected = selectedSetNo === rowNo;
                                const isExpanded = expandedRows.has(rowNo);
                                return (
                                  <Fragment key={row.subgroup_id}>
                                    <tr
                                      className={`cursor-pointer ${isExpanded ? "bg-[#efeff4]" : ""}`}
                                      onClick={() => {
                                        toggleRowExpansion(rowNo);
                                      }}
                                    >
                                      <td
                                        className={`${TABLE_BODY_CELL_BASE_NO_BORDER} text-center`}
                                      >
                                        <div
                                          className={
                                            TABLE_INNER_DIV_CENTER_NO_BORDER
                                          }
                                        >
                                          <IconButton
                                            aria-label={
                                              isExpanded
                                                ? `Collapse set ${rowNo}`
                                                : `Expand set ${rowNo}`
                                            }
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleRowExpansion(rowNo);
                                            }}
                                            className="text-neutral-40 inline-flex shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-transparent p-1 transition-colors duration-150 hover:bg-neutral-90 active:bg-neutral-80"
                                            title={
                                              isExpanded ? "접기" : "펼치기"
                                            }
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
                                          </IconButton>
                                        </div>
                                      </td>
                                      <td
                                        className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-center`}
                                      >
                                        <div className={TABLE_INNER_DIV_CENTER}>
                                          <RadioGroup.Item
                                            value={rowNo}
                                            id={`radio-${rowNo}`}
                                            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 outline-none focus:ring-0 focus:outline-none"
                                          >
                                            {isSelected ? (
                                              <svg
                                                width="17"
                                                height="17"
                                                viewBox="0 0 17 17"
                                                fill="none"
                                              >
                                                <rect
                                                  x="0.5"
                                                  y="0.5"
                                                  width="16"
                                                  height="16"
                                                  rx="3.5"
                                                  fill="#3a11d8"
                                                  stroke="#3a11d8"
                                                />
                                                <path
                                                  d="M4 8.5L7 11.5L13 5.5"
                                                  stroke="white"
                                                  strokeWidth="1.5"
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                />
                                              </svg>
                                            ) : (
                                              <svg
                                                width="17"
                                                height="17"
                                                viewBox="0 0 17 17"
                                                fill="none"
                                              >
                                                <rect
                                                  x="0.5"
                                                  y="0.5"
                                                  width="16"
                                                  height="16"
                                                  rx="3.5"
                                                  fill="transparent"
                                                  stroke="#c6c5c9"
                                                />
                                              </svg>
                                            )}
                                          </RadioGroup.Item>
                                        </div>
                                      </td>
                                      <td
                                        className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                      >
                                        <div className={TABLE_INNER_DIV_LEFT}>
                                          <span className="block truncate">
                                            {rowNo}
                                          </span>
                                        </div>
                                      </td>
                                      <td
                                        className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                      >
                                        <div className={TABLE_INNER_DIV_LEFT}>
                                          <span className="inline-flex min-w-0 items-center gap-1 truncate">
                                            <span className="truncate">
                                              {row.set_name}
                                            </span>
                                            {row.variance_benefit_label && (
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
                                          <span className="block truncate">
                                            {row.outcome}
                                          </span>
                                        </div>
                                      </td>
                                      <td
                                        className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                      >
                                        <div className={TABLE_INNER_DIV_LEFT}>
                                          <span className="block truncate">
                                            {row.cut_off.join("  ")}
                                          </span>
                                        </div>
                                      </td>
                                      <td
                                        className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                      >
                                        <div className={TABLE_INNER_DIV_LEFT}>
                                          <span className="block truncate">
                                            {row.month}
                                          </span>
                                        </div>
                                      </td>
                                      <td
                                        className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                      >
                                        <div className={TABLE_INNER_DIV_LEFT}>
                                          <span className="block truncate">
                                            {row.of_group}
                                          </span>
                                        </div>
                                      </td>
                                      <td
                                        className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                        style={{
                                          color: row.variance_benefit_label
                                            ? "#3A11D8"
                                            : "",
                                        }}
                                      >
                                        <div className={TABLE_INNER_DIV_LEFT}>
                                          <span className="block truncate">
                                            {(
                                              row.variance_benefit * 100
                                            ).toFixed(1)}
                                            %
                                            {row.variance_benefit_label
                                              ? ` ${row.variance_benefit_label}`
                                              : ""}
                                          </span>
                                        </div>
                                      </td>
                                      <td
                                        className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}
                                      >
                                        <div className={TABLE_INNER_DIV_LEFT}>
                                          <span className="block truncate">
                                            {row.group_balance}
                                          </span>
                                        </div>
                                      </td>
                                      <td
                                        className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-center`}
                                      >
                                        <div className={TABLE_INNER_DIV_CENTER}>
                                          <IconButton
                                            aria-label={`Refine cutoffs for set ${rowNo}`}
                                            type="button"
                                            className="text-neutral-40 hover:text-neutral-30 shrink-0 cursor-pointer rounded border-0 bg-transparent p-1 transition-colors duration-150 hover:bg-neutral-90 active:bg-neutral-80"
                                            title="Refine Cutoffs"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const query = new URLSearchParams(
                                                {
                                                  subgroupId: String(
                                                    row.subgroup_id,
                                                  ),
                                                  month: String(row.month),
                                                  setName: row.set_name,
                                                },
                                              );
                                              if (taskId) {
                                                query.set("taskId", taskId);
                                              }
                                              router.push(
                                                `/tsi/refine-cutoffs?${query.toString()}`,
                                              );
                                            }}
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
                                          </IconButton>
                                        </div>
                                      </td>
                                      <td
                                        className={`${TABLE_BODY_CELL_BASE_LAST} text-center`}
                                      >
                                        <div className={TABLE_INNER_DIV_CENTER}>
                                          {/* TODO(ui): Re-enable Delete action icon when policy is finalized. */}
                                        </div>
                                      </td>
                                    </tr>
                                    {isExpanded &&
                                      (() => {
                                        // result_table에서 해당 row 데이터 가져오기
                                        const detailData = row;

                                        // 그룹 이름 매핑 (classification 기반)
                                        const getGroupDisplayName = (
                                          classification: string,
                                        ) => {
                                          if (classification === "high")
                                            return "High Risk";
                                          if (classification === "middle")
                                            return "Middle Risk";
                                          if (classification === "low")
                                            return "Low";
                                          return classification;
                                        };

                                        // 그룹 색상 매핑
                                        const getGroupColor = (
                                          classification: string,
                                        ) => {
                                          if (classification === "high")
                                            return "#231F52";
                                          if (classification === "middle")
                                            return "#7571A9";
                                          if (classification === "low")
                                            return "#AAA5E1";
                                          return "#231F52";
                                        };
                                        const detailGroupLimit =
                                          getDisplayGroupCount(
                                            detailData?.of_group,
                                            detailData.number_or_patient
                                              ?.length ??
                                              detailData
                                                .within_group_variance_by_subgroup
                                                ?.length ??
                                              0,
                                          );

                                        // number_or_patient 데이터 정렬 (high -> middle -> low 순서)
                                        const sortedPatients = clampGroupArray(
                                          detailData.number_or_patient
                                            ? [
                                                ...detailData.number_or_patient,
                                              ].sort((a, b) => {
                                                const order = {
                                                  high: 0,
                                                  middle: 1,
                                                  low: 2,
                                                };
                                                const aClass =
                                                  detailData.within_group_variance_by_subgroup?.find(
                                                    (v) => v.group === a.group,
                                                  )?.classification || "";
                                                const bClass =
                                                  detailData.within_group_variance_by_subgroup?.find(
                                                    (v) => v.group === b.group,
                                                  )?.classification || "";
                                                return (
                                                  (order[
                                                    aClass as keyof typeof order
                                                  ] ?? 99) -
                                                  (order[
                                                    bClass as keyof typeof order
                                                  ] ?? 99)
                                                );
                                              })
                                            : [],
                                          detailGroupLimit,
                                          0,
                                        );

                                        // 최소 환자 수 계산 (low 그룹 기준)
                                        const lowGroupPatient =
                                          sortedPatients.find((p) => {
                                            const varianceData =
                                              detailData.within_group_variance_by_subgroup?.find(
                                                (v) => v.group === p.group,
                                              );
                                            return (
                                              varianceData?.classification ===
                                              "low"
                                            );
                                          });
                                        const minPatients =
                                          lowGroupPatient?.number || 0;

                                        // Variance decomposition에서 총 variance 계산
                                        const totalVariance =
                                          detailData.variance_decomposition?.[0]
                                            ?.variance || 0;
                                        const totalVR =
                                          detailData.variance_decomposition?.[0]
                                            ?.vr || 0;

                                        // Within-group variance 데이터 정렬
                                        const sortedVariance = clampGroupArray(
                                          detailData.within_group_variance_by_subgroup
                                            ? [
                                                ...detailData.within_group_variance_by_subgroup,
                                              ].sort((a, b) => {
                                                const order = {
                                                  high: 0,
                                                  middle: 1,
                                                  low: 2,
                                                };
                                                return (
                                                  (order[
                                                    a.classification as keyof typeof order
                                                  ] ?? 99) -
                                                  (order[
                                                    b.classification as keyof typeof order
                                                  ] ?? 99)
                                                );
                                              })
                                            : [],
                                          detailGroupLimit,
                                          0,
                                        );

                                        const totalVarValue =
                                          sortedVariance.length > 0
                                            ? sortedVariance[0].total_var
                                            : 0;

                                        // Variance Reduction Explained 텍스트 생성
                                        const variancePercent = (
                                          detailData.variance_benefit * 100
                                        ).toFixed(1);
                                        const primaryGroup =
                                          sortedVariance.find(
                                            (v) => v.classification === "low",
                                          )
                                            ? "Low Risk"
                                            : sortedVariance.find(
                                                  (v) =>
                                                    v.classification === "high",
                                                )
                                              ? "High Risk"
                                              : "patient group";
                                        const progressionGroupSet =
                                          detailData.disease_progression_by_subgroup
                                            ? new Set(
                                                detailData.disease_progression_by_subgroup.map(
                                                  (d) => d.group,
                                                ),
                                              )
                                            : new Set<string>();
                                        const orderedProgressionGroups =
                                          sortedVariance
                                            .map((variance) => variance.group)
                                            .filter((group) =>
                                              progressionGroupSet.has(group),
                                            );
                                        const diseaseProgressionGroups =
                                          detailData.disease_progression_by_subgroup
                                            ? Array.from(
                                                new Set(
                                                  detailData.disease_progression_by_subgroup
                                                    .map((d) => d.group)
                                                    .sort(),
                                                ),
                                              )
                                            : [];
                                        const displayedProgressionGroups =
                                          clampGroupArray(
                                            orderedProgressionGroups.length > 0
                                              ? orderedProgressionGroups
                                              : diseaseProgressionGroups,
                                            detailData?.of_group,
                                            detailData
                                              ?.disease_progression_by_subgroup
                                              ?.length ??
                                              detailData?.number_or_patient
                                                ?.length ??
                                              detailData
                                                .within_group_variance_by_subgroup
                                                ?.length ??
                                              0,
                                          );
                                        const displayedProgressionGroupSet =
                                          new Set(displayedProgressionGroups);

                                        return (
                                          <tr className="bg-[#efeff4]">
                                            <td
                                              colSpan={12}
                                              className="border-neutral-80 border-b p-0"
                                            >
                                              <div className="bg-[#efeff4] px-4 py-6">
                                                <div className="flex gap-3">
                                                  {/* Left Column */}
                                                  <div className="flex w-[372px] flex-col gap-3">
                                                    {/* Disease Progression by Subgroup */}
                                                    <div className="flex h-[252px] flex-col rounded-[18px] bg-white/60 p-4">
                                                      <h3 className="text-body4 mb-4 flex-shrink-0 font-semibold text-[#1c1b1b]">
                                                        Disease Progression by
                                                        Subgroup
                                                      </h3>
                                                      <div
                                                        className="min-h-0 flex-1 overflow-hidden rounded-[8px] bg-white"
                                                        style={{
                                                          height: "100%",
                                                        }}
                                                      >
                                                        {detailData.disease_progression_by_subgroup &&
                                                        detailData
                                                          .disease_progression_by_subgroup
                                                          .length > 0 ? (
                                                          (() => {
                                                            // 그룹별로 데이터 분리
                                                            const filteredProgressionData =
                                                              detailData.disease_progression_by_subgroup.filter(
                                                                (d) =>
                                                                  displayedProgressionGroupSet.has(
                                                                    d.group,
                                                                  ),
                                                              );
                                                            const groups =
                                                              displayedProgressionGroups;
                                                            const months =
                                                              Array.from(
                                                                new Set(
                                                                  filteredProgressionData.map(
                                                                    (d) =>
                                                                      d.month,
                                                                  ),
                                                                ),
                                                              ).sort(
                                                                (a, b) => a - b,
                                                              );

                                                            // 각 그룹별 데이터 시리즈 생성
                                                            const series =
                                                              groups.map(
                                                                (
                                                                  group,
                                                                  groupIdx,
                                                                ) => {
                                                                  const groupData =
                                                                    filteredProgressionData.filter(
                                                                      (d) =>
                                                                        d.group ===
                                                                        group,
                                                                    );
                                                                  const varianceData =
                                                                    detailData.within_group_variance_by_subgroup?.find(
                                                                      (v) =>
                                                                        v.group ===
                                                                        group,
                                                                    );
                                                                  const classification =
                                                                    varianceData?.classification ||
                                                                    "";
                                                                  const color =
                                                                    getGroupColor(
                                                                      classification,
                                                                    );
                                                                  const groupName =
                                                                    getGroupDisplayName(
                                                                      classification,
                                                                    );

                                                                  return {
                                                                    name: groupName,
                                                                    type: "line" as const,
                                                                    data: months
                                                                      .map(
                                                                        (
                                                                          month,
                                                                        ) => {
                                                                          const dataPoint =
                                                                            groupData.find(
                                                                              (
                                                                                d,
                                                                              ) =>
                                                                                d.month ===
                                                                                month,
                                                                            );
                                                                          return dataPoint
                                                                            ? [
                                                                                month,
                                                                                dataPoint.mean,
                                                                              ]
                                                                            : null;
                                                                        },
                                                                      )
                                                                      .filter(
                                                                        (d) =>
                                                                          d !==
                                                                          null,
                                                                      ),
                                                                    itemStyle: {
                                                                      color,
                                                                    },
                                                                    lineStyle: {
                                                                      color,
                                                                      width: 2,
                                                                    },
                                                                    symbol:
                                                                      "circle",
                                                                    symbolSize: 6,
                                                                  };
                                                                },
                                                              );

                                                            // 에러바 시리즈 생성 (custom renderItem 사용)
                                                            const errorBarSeries =
                                                              groups.map(
                                                                (
                                                                  group,
                                                                  groupIdx,
                                                                ) => {
                                                                  const groupData =
                                                                    filteredProgressionData.filter(
                                                                      (d) =>
                                                                        d.group ===
                                                                        group,
                                                                    );
                                                                  const varianceData =
                                                                    detailData.within_group_variance_by_subgroup?.find(
                                                                      (v) =>
                                                                        v.group ===
                                                                        group,
                                                                    );
                                                                  const classification =
                                                                    varianceData?.classification ||
                                                                    "";
                                                                  const color =
                                                                    getGroupColor(
                                                                      classification,
                                                                    );
                                                                  const CAP_LEN_PX = 4;

                                                                  return {
                                                                    name: `${group} error`,
                                                                    type: "custom" as const,
                                                                    data: months
                                                                      .map(
                                                                        (
                                                                          month,
                                                                        ) => {
                                                                          const dataPoint =
                                                                            groupData.find(
                                                                              (
                                                                                d,
                                                                              ) =>
                                                                                d.month ===
                                                                                month,
                                                                            );
                                                                          if (
                                                                            !dataPoint
                                                                          )
                                                                            return null;
                                                                          return [
                                                                            month,
                                                                            dataPoint.mean,
                                                                            dataPoint.mean -
                                                                              dataPoint.ci_low,
                                                                            dataPoint.ci_high -
                                                                              dataPoint.mean,
                                                                          ];
                                                                        },
                                                                      )
                                                                      .filter(
                                                                        (d) =>
                                                                          d !==
                                                                          null,
                                                                      ),
                                                                    renderItem:
                                                                      (
                                                                        params: unknown,
                                                                        api: {
                                                                          value: (
                                                                            i: number,
                                                                          ) => number;
                                                                          coord: (
                                                                            p: number[],
                                                                          ) => number[];
                                                                          style: (
                                                                            o: object,
                                                                          ) => object;
                                                                        },
                                                                      ) => {
                                                                        const xVal =
                                                                          api.value(
                                                                            0,
                                                                          );
                                                                        const mean =
                                                                          api.value(
                                                                            1,
                                                                          );
                                                                        const marginLow =
                                                                          api.value(
                                                                            2,
                                                                          );
                                                                        const marginHigh =
                                                                          api.value(
                                                                            3,
                                                                          );
                                                                        const low =
                                                                          api.coord(
                                                                            [
                                                                              xVal,
                                                                              mean -
                                                                                marginLow,
                                                                            ],
                                                                          );
                                                                        const high =
                                                                          api.coord(
                                                                            [
                                                                              xVal,
                                                                              mean +
                                                                                marginHigh,
                                                                            ],
                                                                          );
                                                                        return {
                                                                          type: "group",
                                                                          children:
                                                                            [
                                                                              {
                                                                                type: "line",
                                                                                shape:
                                                                                  {
                                                                                    x1: low[0],
                                                                                    y1: low[1],
                                                                                    x2: high[0],
                                                                                    y2: high[1],
                                                                                  },
                                                                                style:
                                                                                  api.style(
                                                                                    {
                                                                                      stroke:
                                                                                        color,
                                                                                      lineWidth: 1.5,
                                                                                    },
                                                                                  ),
                                                                              },
                                                                              {
                                                                                type: "line",
                                                                                shape:
                                                                                  {
                                                                                    x1:
                                                                                      low[0] -
                                                                                      CAP_LEN_PX /
                                                                                        2,
                                                                                    y1: low[1],
                                                                                    x2:
                                                                                      low[0] +
                                                                                      CAP_LEN_PX /
                                                                                        2,
                                                                                    y2: low[1],
                                                                                  },
                                                                                style:
                                                                                  api.style(
                                                                                    {
                                                                                      stroke:
                                                                                        color,
                                                                                      lineWidth: 1.5,
                                                                                    },
                                                                                  ),
                                                                              },
                                                                              {
                                                                                type: "line",
                                                                                shape:
                                                                                  {
                                                                                    x1:
                                                                                      high[0] -
                                                                                      CAP_LEN_PX /
                                                                                        2,
                                                                                    y1: high[1],
                                                                                    x2:
                                                                                      high[0] +
                                                                                      CAP_LEN_PX /
                                                                                        2,
                                                                                    y2: high[1],
                                                                                  },
                                                                                style:
                                                                                  api.style(
                                                                                    {
                                                                                      stroke:
                                                                                        color,
                                                                                      lineWidth: 1.5,
                                                                                    },
                                                                                  ),
                                                                              },
                                                                            ],
                                                                        };
                                                                      },
                                                                    z: 1,
                                                                    showInLegend: false,
                                                                  };
                                                                },
                                                              );

                                                            // Y축 범위 계산 (에러바가 잘리지 않도록 더 넓은 padding)
                                                            const allMeans =
                                                              filteredProgressionData.map(
                                                                (d) => d.mean,
                                                              );
                                                            const allCis =
                                                              filteredProgressionData.flatMap(
                                                                (d) => [
                                                                  d.ci_low,
                                                                  d.ci_high,
                                                                ],
                                                              );
                                                            const yMin =
                                                              Math.min(
                                                                ...allMeans,
                                                                ...allCis,
                                                              );
                                                            const yMax =
                                                              Math.max(
                                                                ...allMeans,
                                                                ...allCis,
                                                              );
                                                            const yRange =
                                                              yMax - yMin;
                                                            const yPadding =
                                                              yRange * 0.15; // 10% -> 15%로 증가하여 에러바가 잘리지 않도록

                                                            const chartOption =
                                                              {
                                                                animation: false,
                                                                grid: {
                                                                  left: "12%",
                                                                  right: "8%",
                                                                  top: "5%",
                                                                  bottom: "15%",
                                                                  containLabel: false,
                                                                },
                                                                xAxis: {
                                                                  type: "value" as const,
                                                                  name: "Month",
                                                                  nameLocation:
                                                                    "middle",
                                                                  nameGap: 15,
                                                                  min: Math.max(
                                                                    0,
                                                                    months[0] -
                                                                      1,
                                                                  ),
                                                                  max: months[
                                                                    months.length -
                                                                      1
                                                                  ], // 마지막 month까지만 표시
                                                                  nameTextStyle:
                                                                    {
                                                                      fontSize: 10,
                                                                      color:
                                                                        "#484646",
                                                                    },
                                                                  axisLabel: {
                                                                    fontSize: 9,
                                                                    color:
                                                                      "#484646",
                                                                  },
                                                                  axisLine: {
                                                                    show: true,
                                                                    onZero: false, // X축이 항상 하단에 표시되도록
                                                                    lineStyle: {
                                                                      color:
                                                                        "#484646",
                                                                      width: 1,
                                                                    },
                                                                  },
                                                                  axisTick: {
                                                                    show: false,
                                                                  },
                                                                  splitLine: {
                                                                    show: true,
                                                                    lineStyle: {
                                                                      type: "solid",
                                                                      color:
                                                                        "#E8E8E8",
                                                                      width: 1,
                                                                    },
                                                                  },
                                                                },
                                                                yAxis: {
                                                                  type: "value" as const,
                                                                  name: `Δ ${detailData.outcome}`,
                                                                  nameLocation:
                                                                    "middle",
                                                                  nameGap: 22,
                                                                  min:
                                                                    yMin -
                                                                    yPadding,
                                                                  max:
                                                                    yMax +
                                                                    yPadding,
                                                                  nameTextStyle:
                                                                    {
                                                                      fontSize: 10,
                                                                      color:
                                                                        "#484646",
                                                                    },
                                                                  axisLabel: {
                                                                    fontSize: 9,
                                                                    color:
                                                                      "#484646",
                                                                    showMinLabel: false, // min 값 틱 레이블 숨김
                                                                    showMaxLabel: false, // max 값 틱 레이블 숨김
                                                                    formatter: (
                                                                      value: number,
                                                                    ) => {
                                                                      // 소수점이 있으면 소수점 첫째자리까지, 없으면 정수로 표시
                                                                      return value %
                                                                        1 ===
                                                                        0
                                                                        ? value.toString()
                                                                        : value.toFixed(
                                                                            1,
                                                                          );
                                                                    },
                                                                  },
                                                                  axisLine: {
                                                                    show: true,
                                                                    onZero: false, // Y축이 항상 왼쪽에 표시되도록
                                                                    lineStyle: {
                                                                      color:
                                                                        "#484646",
                                                                      width: 1,
                                                                    },
                                                                  },
                                                                  axisTick: {
                                                                    show: false,
                                                                  },
                                                                  splitLine: {
                                                                    show: true,
                                                                    lineStyle: {
                                                                      type: "solid",
                                                                      color:
                                                                        "#E8E8E8",
                                                                      width: 1,
                                                                    },
                                                                  },
                                                                },
                                                                tooltip: {
                                                                  show: false, // 툴팁 완전히 비활성화
                                                                  trigger:
                                                                    "none" as const,
                                                                  axisPointer: {
                                                                    show: false, // 마우스 오버시 수직선 제거
                                                                  },
                                                                },
                                                                legend: {
                                                                  show: false,
                                                                },
                                                                series: [
                                                                  ...series,
                                                                  ...errorBarSeries,
                                                                ],
                                                              };

                                                            return (
                                                              <ReactECharts
                                                                option={
                                                                  chartOption
                                                                }
                                                                style={{
                                                                  height:
                                                                    "100%",
                                                                  width: "100%",
                                                                }}
                                                              />
                                                            );
                                                          })()
                                                        ) : (
                                                          <div className="flex h-full items-center justify-center">
                                                            <span className="text-sm text-[#484646]">
                                                              No data available
                                                            </span>
                                                          </div>
                                                        )}
                                                      </div>
                                                    </div>
                                                    {/* Number of patients */}
                                                    <div className="flex h-[196px] flex-col rounded-[18px] bg-white/60 p-4">
                                                      <h3 className="text-body4 mb-0 flex-shrink-0 font-semibold text-[#1c1b1b]">
                                                        Number of patients
                                                      </h3>
                                                      <p className="mb-0 flex-shrink-0 text-sm text-[#605e5e]">
                                                        At least {minPatients}{" "}
                                                        patients per group are
                                                        recommended.
                                                      </p>
                                                      <div className="mt-auto">
                                                        <div className="w-full h-wrap space-y-0 overflow-auto rounded-[8px] bg-white p-3">
                                                          <div className="flex items-center gap-2 border-b border-[#adaaaa] pb-0 text-sm font-semibold text-[#231f52]">
                                                            <div className="w-[142px]">
                                                              <p className="text-sm font-semibold text-[#231F52]">
                                                                Group
                                                              </p>
                                                            </div>
                                                            <div>
                                                              <p className="text-sm font-semibold text-[#231F52]">
                                                                Number of
                                                                patients
                                                              </p>
                                                            </div>
                                                          </div>
                                                          {sortedPatients.map(
                                                            (patient, idx) => {
                                                              const varianceData =
                                                                detailData.within_group_variance_by_subgroup?.find(
                                                                  (v) =>
                                                                    v.group ===
                                                                    patient.group,
                                                                );
                                                              const classification =
                                                                varianceData?.classification ||
                                                                "";
                                                              const groupName =
                                                                getGroupDisplayName(
                                                                  classification,
                                                                );
                                                              const groupColor =
                                                                getGroupColor(
                                                                  classification,
                                                                );

                                                              return (
                                                                <div
                                                                  key={
                                                                    patient.group
                                                                  }
                                                                  className={`flex items-center gap-2 text-sm text-[#1c1b1b] ${
                                                                    idx > 0
                                                                      ? "border-t border-[#adaaaa] pt-0"
                                                                      : ""
                                                                  }`}
                                                                >
                                                                  <div className="flex w-[142px] items-center gap-[6px]">
                                                                    <div
                                                                      className="h-3 w-3 rounded-full"
                                                                      style={{
                                                                        backgroundColor:
                                                                          groupColor,
                                                                      }}
                                                                    />
                                                                    <div>
                                                                      <p className="text-body4m font-semibold text-[#1C1B1B]">
                                                                        {
                                                                          groupName
                                                                        }
                                                                      </p>
                                                                    </div>
                                                                  </div>
                                                                  <div>
                                                                    <p className="text-body4m font-semibold text-[#1C1B1B]">
                                                                      {patient.number.toLocaleString()}
                                                                    </p>
                                                                  </div>
                                                                </div>
                                                              );
                                                            },
                                                          )}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                  {/* Right Column */}
                                                  <div className="bg-primary-15 flex h-[468px] flex-1 min-w-0 flex-col gap-3 rounded-[18px] p-4">
                                                    {/* Variance Reduction Explained */}
                                                    <div>
                                                      <h3 className="text-feature-title mb-4 text-white">
                                                        Variance Reduction
                                                        Explained
                                                      </h3>
                                                      <p className="text-body5m leading-relaxed font-semibold text-white">
                                                        Subgroup stratification
                                                        reduced the overall
                                                        variance by{" "}
                                                        {variancePercent}%. The
                                                        observed variance
                                                        reduction was primarily
                                                        driven by the{" "}
                                                        {primaryGroup}
                                                        patient group.
                                                        Therefore, if cutoff
                                                        adjustment is required,
                                                        maintaining the{" "}
                                                        {primaryGroup}
                                                        group and adjusting the
                                                        cutoff for the{" "}
                                                        {primaryGroup ===
                                                        "Low Risk"
                                                          ? "High Risk"
                                                          : "Low Risk"}{" "}
                                                        group is a reasonable
                                                        strategy.
                                                      </p>
                                                    </div>
                                                    {/* Two cards in one row */}
                                                    <div className="mt-auto grid grid-cols-2 gap-3">
                                                      {/* Variance decomposition */}
                                                      <div className="flex h-[306px] flex-1 min-w-0 flex-col overflow-hidden rounded-[12px] bg-white p-4">
                                                        {/* 텍스트 영역 (패딩 없음) */}
                                                        <div className="flex justify-between">
                                                          <div className="flex-shrink-0">
                                                            <h3 className="text-body5 mb-4 tracking-[-0.75px] text-[#1c1b1b]">
                                                              Variance
                                                              decomposition
                                                            </h3>
                                                            <div className="mb-4 flex gap-5">
                                                              <div>
                                                                <div className="text-body5 -mb-1 font-semibold text-[#f06600]">
                                                                  Variance
                                                                </div>
                                                                <div className="text-[28px] leading-relaxed font-semibold tracking-[-0.84px] text-[#f06600]">
                                                                  {totalVariance.toFixed(
                                                                    2,
                                                                  )}
                                                                </div>
                                                              </div>
                                                              <div>
                                                                <div className="text-body5 -mb-1 font-semibold text-[#f06600]">
                                                                  VR
                                                                </div>
                                                                <div className="text-[28px] leading-relaxed font-semibold tracking-[-0.84px] text-[#f06600]">
                                                                  {totalVR.toFixed(
                                                                    3,
                                                                  )}
                                                                </div>
                                                              </div>
                                                            </div>
                                                          </div>
                                                          <div className="gap-1">
                                                            <div className="flex gap-[5px] font-medium">
                                                              <div className="mt-1 h-[10px] w-[32px] rounded-2xl bg-[#231F52]" />
                                                              <div className="w-[60px] text-[10.5px]">
                                                                <p>Within</p>
                                                                <p className="-mt-1 text-[#939090]">
                                                                  pooled
                                                                </p>
                                                              </div>
                                                            </div>
                                                            <div className="flex gap-[5px] font-medium">
                                                              <div className="mt-1 h-[10px] w-[32px] rounded-2xl bg-[#AAA5E1]" />
                                                              <div className="w-[60px] text-[10.5px]">
                                                                <p>Explained</p>
                                                                <p className="-mt-1 text-[#939090]">
                                                                  Total Within
                                                                </p>
                                                              </div>
                                                            </div>
                                                          </div>
                                                        </div>
                                                        {/* 그래프 영역 (패딩 없음) */}
                                                        <div
                                                          className="min-h-0 flex-1 overflow-hidden bg-white"
                                                          style={{
                                                            height: "100%",
                                                          }}
                                                        >
                                                          {detailData.variance_decomposition &&
                                                          detailData
                                                            .variance_decomposition
                                                            .length > 0 ? (
                                                            (() => {
                                                              // Variance decomposition 차트 데이터 준비
                                                              const decompositionData =
                                                                detailData.variance_decomposition;
                                                              // 총 variance는 첫 번째 항목의 variance 사용
                                                              const totalVarianceValue =
                                                                decompositionData[0]
                                                                  ?.variance ||
                                                                0;
                                                              // VR을 비율로 해석해 total variance를 within/explained로 분해
                                                              // (stack 합이 totalVarianceValue가 되도록 유지)
                                                              const vrRatio =
                                                                Math.max(
                                                                  0,
                                                                  Math.min(
                                                                    1,
                                                                    decompositionData[0]
                                                                      ?.vr ?? 0,
                                                                  ),
                                                                );
                                                              const explainedTotal =
                                                                totalVarianceValue *
                                                                vrRatio;
                                                              const withinPooled =
                                                                Math.max(
                                                                  0,
                                                                  totalVarianceValue -
                                                                    explainedTotal,
                                                                );
                                                              const varianceMax =
                                                                Math.max(
                                                                  totalVarianceValue,
                                                                  0,
                                                                );
                                                              const varianceBarWidth =
                                                                "82%";

                                                              const chartOption =
                                                                {
                                                                  animation: false,
                                                                  grid: {
                                                                    left: "4px",
                                                                    right: "5%",
                                                                    top: "5%",
                                                                    bottom:
                                                                      "15%",
                                                                    containLabel: true,
                                                                  },
                                                                  xAxis: {
                                                                    type: "category" as const,
                                                                    data: [
                                                                      "Explained",
                                                                    ],

                                                                    axisLabel: {
                                                                      show: true,
                                                                      fontSize: 9,
                                                                      color:
                                                                        "#484646",
                                                                    },
                                                                    axisLine: {
                                                                      show: true,
                                                                      onZero: false,
                                                                      lineStyle:
                                                                        {
                                                                          color:
                                                                            "#484646",
                                                                          width: 1,
                                                                        },
                                                                    },
                                                                    axisTick: {
                                                                      show: false,
                                                                    },
                                                                  },
                                                                  yAxis: {
                                                                    type: "value" as const,
                                                                    name: "Variance",
                                                                    nameLocation:
                                                                      "middle",
                                                                    nameGap: 36,
                                                                    max:
                                                                      varianceMax *
                                                                      1.5,
                                                                    splitNumber: 5,
                                                                    nameTextStyle:
                                                                      {
                                                                        fontSize: 9,
                                                                        color:
                                                                          "#484646",
                                                                      },
                                                                    axisLabel: {
                                                                      fontSize: 9,
                                                                      color:
                                                                        "#484646",
                                                                      margin: 4,
                                                                      formatter:
                                                                        (
                                                                          value: number,
                                                                        ) =>
                                                                          value.toFixed(
                                                                            2,
                                                                          ),
                                                                    },
                                                                    axisLine: {
                                                                      show: true,
                                                                      onZero: false,
                                                                      lineStyle:
                                                                        {
                                                                          color:
                                                                            "#484646",
                                                                          width: 1,
                                                                        },
                                                                    },
                                                                    axisTick: {
                                                                      show: false,
                                                                    },
                                                                    splitLine: {
                                                                      show: true,
                                                                      lineStyle:
                                                                        {
                                                                          color:
                                                                            "#efeff4",
                                                                        },
                                                                    },
                                                                  },
                                                                  tooltip: {
                                                                    show: false,
                                                                  },
                                                                  legend: {
                                                                    show: false,
                                                                  },
                                                                  series: [
                                                                    {
                                                                      name: "Within pooled",
                                                                      type: "bar" as const,
                                                                      stack:
                                                                        "variance",
                                                                      data: [
                                                                        withinPooled,
                                                                      ],
                                                                      itemStyle:
                                                                        {
                                                                          color:
                                                                            "#231F52",
                                                                          borderRadius:
                                                                            [
                                                                              8,
                                                                              8,
                                                                              8,
                                                                              8,
                                                                            ],
                                                                        },
                                                                      barWidth:
                                                                        varianceBarWidth,
                                                                    },
                                                                    {
                                                                      name: "Explained Total Within",
                                                                      type: "bar" as const,
                                                                      stack:
                                                                        "variance",
                                                                      data: [
                                                                        explainedTotal,
                                                                      ],
                                                                      itemStyle:
                                                                        {
                                                                          color:
                                                                            "#AAA5E1",
                                                                          borderRadius:
                                                                            [
                                                                              8,
                                                                              8,
                                                                              8,
                                                                              8,
                                                                            ],
                                                                        },
                                                                      barWidth:
                                                                        varianceBarWidth,
                                                                    },
                                                                  ],
                                                                };

                                                              return (
                                                                <div className="relative h-full w-full">
                                                                  <ReactECharts
                                                                    option={
                                                                      chartOption
                                                                    }
                                                                    style={{
                                                                      height:
                                                                        "100%",
                                                                      width:
                                                                        "100%",
                                                                    }}
                                                                  />
                                                                  <div className="pointer-events-none absolute top-[8px] right-[14px] left-[34px] h-[40px] px-3">
                                                                    <div className="rounded-[8px] border border-[#D1CFD8] p-[6px]">
                                                                      <p className="text-[10.5px] font-medium text-[#787776]">
                                                                        {getCiText(
                                                                          detailData.variance_decomposition,
                                                                        )}
                                                                      </p>
                                                                    </div>
                                                                  </div>
                                                                </div>
                                                              );
                                                            })()
                                                          ) : (
                                                            <div className="flex h-full items-center justify-center">
                                                              <span className="text-sm text-[#484646]">
                                                                No data
                                                                available
                                                              </span>
                                                            </div>
                                                          )}
                                                        </div>
                                                      </div>
                                                      {/* Within-group variance by subgroup */}
                                                      <div className="flex h-[306px] flex-1 min-w-0 flex-col overflow-hidden rounded-[12px] bg-white p-4">
                                                        {/* 텍스트 영역 (패딩 없음) */}
                                                        <div className="flex-shrink-0">
                                                          <h3 className="mb-4 text-[15px] font-semibold text-[#262625]">
                                                            Within-group
                                                            variance by subgroup
                                                          </h3>
                                                          <div className="mb-4 flex gap-5">
                                                            {sortedVariance.map(
                                                              (v) => {
                                                                const displayName =
                                                                  v.classification ===
                                                                  "high"
                                                                    ? "High"
                                                                    : v.classification ===
                                                                        "middle"
                                                                      ? "Middle"
                                                                      : "Low";
                                                                return (
                                                                  <div
                                                                    key={
                                                                      v.group
                                                                    }
                                                                  >
                                                                    <div className="-mb-1 text-xs font-semibold text-[#f06600]">
                                                                      {
                                                                        displayName
                                                                      }
                                                                    </div>
                                                                    <div className="text-[28px] font-semibold text-[#f06600]">
                                                                      {v.variance.toFixed(
                                                                        2,
                                                                      )}
                                                                    </div>
                                                                  </div>
                                                                );
                                                              },
                                                            )}
                                                          </div>
                                                        </div>
                                                        {/* 그래프 영역 (패딩 없음) */}
                                                        <div
                                                          className="min-h-0 flex-1 overflow-hidden bg-white"
                                                          style={{
                                                            height: "100%",
                                                          }}
                                                        >
                                                          {sortedVariance.length >
                                                          0 ? (
                                                            (() => {
                                                              const maxVar =
                                                                Math.max(
                                                                  ...sortedVariance.map(
                                                                    (v) =>
                                                                      v.variance,
                                                                  ),
                                                                );
                                                              // total_var 값 가져오기 (모든 그룹이 같은 total_var를 가짐)
                                                              const totalVarValue =
                                                                sortedVariance.length >
                                                                0
                                                                  ? sortedVariance[0]
                                                                      .total_var
                                                                  : 0;
                                                              const chartOption =
                                                                {
                                                                  animation: false,
                                                                  grid: {
                                                                    left: "4px",
                                                                    right: "5%",
                                                                    top: "5%",
                                                                    bottom:
                                                                      "15%",
                                                                    containLabel: true,
                                                                  },
                                                                  xAxis: {
                                                                    type: "category" as const,
                                                                    data: sortedVariance.map(
                                                                      (v) => {
                                                                        const displayName =
                                                                          v.classification ===
                                                                          "high"
                                                                            ? "High"
                                                                            : v.classification ===
                                                                                "middle"
                                                                              ? "Middle"
                                                                              : "Low";
                                                                        return displayName;
                                                                      },
                                                                    ),
                                                                    axisLabel: {
                                                                      fontSize: 9,
                                                                      color:
                                                                        "#484646",
                                                                    },
                                                                    axisLine: {
                                                                      show: true,
                                                                      onZero: false,
                                                                      lineStyle:
                                                                        {
                                                                          color:
                                                                            "#484646",
                                                                          width: 1,
                                                                        },
                                                                    },
                                                                    axisTick: {
                                                                      show: false,
                                                                    },
                                                                  },
                                                                  yAxis: {
                                                                    type: "value" as const,
                                                                    name: "Variance",
                                                                    nameLocation:
                                                                      "middle",
                                                                    nameGap: 36,
                                                                    max:
                                                                      maxVar *
                                                                      1.2,
                                                                    splitNumber: 5,
                                                                    nameTextStyle:
                                                                      {
                                                                        fontSize: 9,
                                                                        color:
                                                                          "#484646",
                                                                      },
                                                                    axisLabel: {
                                                                      fontSize: 9,
                                                                      color:
                                                                        "#484646",
                                                                      margin: 4,
                                                                      formatter:
                                                                        (
                                                                          value: number,
                                                                        ) =>
                                                                          value.toFixed(
                                                                            2,
                                                                          ),
                                                                    },
                                                                    axisLine: {
                                                                      show: true,
                                                                      onZero: false,
                                                                      lineStyle:
                                                                        {
                                                                          color:
                                                                            "#484646",
                                                                          width: 1,
                                                                        },
                                                                    },
                                                                    axisTick: {
                                                                      show: false,
                                                                    },
                                                                    splitLine: {
                                                                      show: true,
                                                                      lineStyle:
                                                                        {
                                                                          color:
                                                                            "#efeff4",
                                                                        },
                                                                    },
                                                                  },
                                                                  tooltip: {
                                                                    show: false,
                                                                  },
                                                                  legend: {
                                                                    show: false,
                                                                  },
                                                                  series: [
                                                                    {
                                                                      type: "bar" as const,
                                                                      data: sortedVariance.map(
                                                                        (
                                                                          v,
                                                                        ) => ({
                                                                          value:
                                                                            v.variance,
                                                                          sampleN:
                                                                            typeof v.number ===
                                                                            "number"
                                                                              ? Math.round(
                                                                                  v.number,
                                                                                )
                                                                              : null,
                                                                          itemStyle:
                                                                            {
                                                                              color:
                                                                                getGroupColor(
                                                                                  v.classification,
                                                                                ),
                                                                              borderRadius:
                                                                                [
                                                                                  8,
                                                                                  8,
                                                                                  8,
                                                                                  8,
                                                                                ],
                                                                            },
                                                                        }),
                                                                      ),
                                                                      barWidth:
                                                                        "50%",
                                                                      label: {
                                                                        show: true,
                                                                        position:
                                                                          "insideBottom",
                                                                        distance: 8,
                                                                        formatter:
                                                                          (params: {
                                                                            data?: {
                                                                              sampleN?:
                                                                                | number
                                                                                | null;
                                                                            };
                                                                          }) => {
                                                                            const sampleN =
                                                                              params
                                                                                .data
                                                                                ?.sampleN;
                                                                            if (
                                                                              typeof sampleN !==
                                                                              "number"
                                                                            ) {
                                                                              return "";
                                                                            }
                                                                            return `n=${sampleN}`;
                                                                          },
                                                                        color:
                                                                          "#FFFFFF",
                                                                        fontFamily:
                                                                          "Inter, sans-serif",
                                                                        fontSize: 12,
                                                                        fontWeight: 600,
                                                                        lineHeight: 13.2,
                                                                      },
                                                                      markLine:
                                                                        {
                                                                          silent: true,
                                                                          symbol:
                                                                            "none",
                                                                          label:
                                                                            {
                                                                              show: true,
                                                                              position:
                                                                                "end",
                                                                              formatter: `Total var=${totalVarValue.toFixed(2)}`,
                                                                              fontSize: 10,
                                                                              color:
                                                                                "#484646",
                                                                              offset:
                                                                                [
                                                                                  -75,
                                                                                  -10,
                                                                                ],
                                                                            },
                                                                          lineStyle:
                                                                            {
                                                                              type: "dashed",
                                                                              color:
                                                                                "#D2D2DA",
                                                                              width: 1,
                                                                            },
                                                                          data: [
                                                                            {
                                                                              yAxis:
                                                                                totalVarValue,
                                                                            },
                                                                          ],
                                                                        },
                                                                    },
                                                                  ],
                                                                };

                                                              return (
                                                                <ReactECharts
                                                                  option={
                                                                    chartOption
                                                                  }
                                                                  style={{
                                                                    height:
                                                                      "100%",
                                                                    width:
                                                                      "100%",
                                                                  }}
                                                                />
                                                              );
                                                            })()
                                                          ) : (
                                                            <div className="flex h-full items-center justify-center">
                                                              <span className="text-sm text-[#484646]">
                                                                No data
                                                                available
                                                              </span>
                                                            </div>
                                                          )}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      })()}
                                  </Fragment>
                                );
                              })
                            )}
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
          <div className="flex flex-shrink-0 items-center justify-end gap-4 pb-2">
            <button
              type="button"
              style={{
                height: 40,
                paddingLeft: 24,
                paddingRight: 24,
                borderRadius: 36,
                background: "#787776",
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
              }}
            >
              Save Progress
            </button>
            <button
              type="button"
              onClick={handleSubgroupExplain}
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
                letterSpacing: "-0.45px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              Subgroup Explain
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ flexShrink: 0 }}
              >
                <path d="M4 3L13 8L4 13V3Z" fill="white" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function TSISubgroupSelectionPage() {
  return (
    <Suspense fallback={null}>
      <TSISubgroupSelectionPageContent />
    </Suspense>
  );
}
