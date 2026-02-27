"use client";

import { useState, Fragment, useEffect, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { AppLayout } from "@/components/layout/AppLayout";
import {
  getSubgroupSummaryList,
  type SubgroupSetSummary,
  type ResultTableItem,
} from "@/services/subgroupService";
import ReactECharts from "echarts-for-react";

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
const TABLE_INNER_DIV_LEFT = "w-full h-[28px] flex items-center border-l border-neutral-80 pl-2";
const TABLE_INNER_DIV_CENTER_NO_BORDER = "w-full h-[28px] flex items-center justify-center";
const TABLE_INNER_DIV_LEFT_NO_BORDER = "w-full h-[28px] flex items-center";

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
      setError("taskId 쿼리 파라미터가 없습니다.");
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

        // 첫 번째 Set을 기본 선택 (result_table의 no 사용)
        if (response.data.result_table.length > 0) {
          setSelectedSetNo(String(response.data.result_table[0].no).padStart(2, "0"));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Subgroup Summary 조회에 실패했습니다.");
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

    const selected = resultTableData.find((item) => item.no === parseInt(selectedSetNo));

    if (selected) {
      const query = new URLSearchParams({
        subgroupId: String(selected.subgroup_id),
        taskId,
      });
      router.push(`/tsi/subgroup-explain?${query.toString()}`);
    }
  };

  return (
    <AppLayout headerType="tsi">
      <div className="flex w-full flex-col items-center">
        {/* 타이틀: 카드 밖 */}
        <div className="mb-2 flex w-full max-w-full justify-center">
          <div className="mx-auto w-[1772px] max-w-full flex-shrink-0">
            <div className="flex flex-shrink-0 flex-col items-start gap-1">
              <div className="text-title text-neutral-5 mb-2 text-left">Subgroup Selection</div>
              <p className="text-body2m text-left text-neutral-50">Prognostic</p>
            </div>
          </div>
        </div>

        {/* 메인: 상위 배경 카드 2개 나란히 (좌 selection-left, 우 selection-bg) */}
        <div className="mx-auto flex w-[1772px] flex-shrink-0 flex-row flex-nowrap items-stretch gap-4">
          {/* 왼쪽 상위 배경 카드: selection-left.png (Figma 536x614, radius 36) */}
          <div
            className="flex h-[614px] w-[536px] flex-shrink-0 flex-col overflow-hidden rounded-[36px] p-3"
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
              className="bg-primary-15 flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-[24px]"
              style={{
                boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
              }}
            >
              {/* 헤더: Figma 16,16 → 480x32, 카드와 간격 100px */}
              <div className="mb-[60px] flex-shrink-0 px-4 pt-4 pb-3">
                <h2 className="text-body2 text-white">Subgroup Sets Summary</h2>
              </div>
              {/* 흰 패널: Set 목록 + 구간 차트 + Disease Progression 축 */}
              <div className="flex min-h-0 flex-1 flex-col px-3 pb-3">
                <div className="border-neutral-80 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[16px] border bg-white px-4 py-2">
                  {/* 하나의 div: Set별로 한 행(왼쪽+오른쪽), 구분선 일치 */}
                  <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    {isLoading ? (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-body2 text-white">Loading...</div>
                      </div>
                    ) : error ? (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-body2 text-red-300">Error: {error}</div>
                      </div>
                    ) : summaryData.length === 0 ? (
                      <div className="flex h-full items-center justify-center">
                        <div className="text-body2 text-white">No data available</div>
                      </div>
                    ) : (
                      summaryData.map((set, index) => {
                        // result_table에서 해당 set_name과 일치하는 항목 찾아서 no 가져오기
                        const tableItem = resultTableData.find((t) => t.set_name === set.set_name);
                        const setNo = tableItem
                          ? String(tableItem.no).padStart(2, "0")
                          : String(index + 1).padStart(2, "0");
                        const isSelected = selectedSetNo === setNo;

                        return (
                          <div
                            key={`${set.set_name}_${index}`}
                            className="border-neutral-80 flex min-h-0 border-b last:border-b-0"
                          >
                            {/* 왼쪽 셀: Set 버튼 + Groups (한 행 = 하나의 div, 2개 cell 구조) */}
                            <div className="border-neutral-80 flex w-[112px] flex-shrink-0 flex-col border-r px-0 py-2">
                              <div className="mb-1 flex h-[22px] flex-shrink-0 items-center gap-2 px-1">
                                <span
                                  className="bg-primary-10 text-body5m box-border flex shrink-0 items-center justify-center gap-1 rounded-full text-white"
                                  style={{
                                    width: 72,
                                    height: 18,
                                    padding: "0 6px",
                                  }}
                                >
                                  {set.set_name}
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
                              {set.groups.map((g, groupIndex) => {
                                // group1 -> Group 1 형식으로 변환
                                const groupNum = g.group.replace("group", "");
                                const groupName = `Group ${groupNum}`;
                                return (
                                  <div
                                    key={`${set.set_name}-group-${groupIndex}`}
                                    className="text-body4m text-neutral-30 flex h-7 flex-shrink-0 items-center pr-1 pl-2"
                                  >
                                    {groupName}
                                  </div>
                                );
                              })}
                            </div>
                            {/* 오른쪽 셀: 왼쪽 기준 맞춤 (스페이서=Set행, 행높이=그룹 h-7) */}
                            <div className="relative flex min-w-0 flex-1 flex-col py-2 pr-4 pl-2">
                              {/* 왼쪽 Set 행과 동일: h-[22px] + mb-1 */}
                              <div className="mb-1 h-[22px] flex-shrink-0" aria-hidden />
                              {/* 눈금선: 엄청 연하게 (패딩=셀과 동일) */}
                              <div
                                className="pointer-events-none absolute inset-0 flex justify-between py-2 pr-4 pl-2"
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
                                const setValues = set.groups.flatMap((g) => [
                                  g.ci_low,
                                  g.ci_high,
                                  g.mean,
                                ]);
                                const setMinValue = Math.min(...setValues);
                                const setMaxValue = Math.max(...setValues);
                                const setRange = setMaxValue - setMinValue;

                                // 현재 Set의 개별 min/max 범위로 정규화하는 함수
                                const normalize = (value: number) => {
                                  if (setRange === 0) return 50; // 범위가 0이면 중앙에 배치
                                  return ((value - setMinValue) / setRange) * 100;
                                };

                                return set.groups.map((g, i) => {
                                  const barColor = GROUP_BAR_COLORS[i % GROUP_BAR_COLORS.length];

                                  // 각 Set의 개별 min/max 범위로 정규화 (독립적인 스케일)
                                  const meanPct = normalize(g.mean);
                                  const ciLowPct = normalize(g.ci_low);
                                  const ciHighPct = normalize(g.ci_high);

                                  return (
                                    <div
                                      key={`${set.set_name}-chart-${i}`}
                                      className="relative z-[1] flex h-7 flex-shrink-0 items-center"
                                    >
                                      <div
                                        className="relative flex h-2 w-full items-center"
                                        style={{ minHeight: 8 }}
                                      >
                                        {/* 가로선: ci_low ~ ci_high 범위 */}
                                        <div
                                          className="absolute h-px rounded-none"
                                          style={{
                                            left: `${ciLowPct}%`,
                                            right: `${100 - ciHighPct}%`,
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            backgroundColor: barColor,
                                          }}
                                        />
                                        {/* 심볼: mean 위치 */}
                                        <span
                                          className="absolute h-3 w-3 shrink-0 rounded-full"
                                          style={{
                                            left: `${meanPct}%`,
                                            top: "50%",
                                            transform: "translate(-50%, -50%)",
                                            backgroundColor: barColor,
                                          }}
                                        />
                                        {/* 왼쪽 꼬리: ci_low 위치 */}
                                        <span
                                          className="absolute w-px shrink-0"
                                          style={{
                                            left: `${ciLowPct}%`,
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            height: 10,
                                            backgroundColor: barColor,
                                          }}
                                        />
                                        {/* 오른쪽 꼬리: ci_high 위치 */}
                                        <span
                                          className="absolute w-px shrink-0"
                                          style={{
                                            left: `${ciHighPct}%`,
                                            top: "50%",
                                            transform: "translateY(-50%)",
                                            height: 10,
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
                    {/* X축 행: 왼쪽 빈 칸 + 오른쪽에만 Slow/Rapid (위쪽 선은 마지막 Set 행 border-b로만 표시) */}
                    <div className="flex flex-shrink-0">
                      <div className="border-neutral-80 w-[112px] flex-shrink-0" aria-hidden />
                      <div className="flex min-w-0 flex-1 flex-col pt-0 pb-1 pl-2">
                        {/* 1) 축선 + 짧은 눈금(아래로) */}
                        <div className="flex w-full min-w-0 flex-col px-2">
                          <div className="w-full border-b border-neutral-50" aria-hidden />
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
            className="flex min-h-[796px] min-w-0 flex-1 flex-shrink-0 flex-col overflow-hidden rounded-[24px] p-3"
            style={{
              backgroundImage: "url(/assets/tsi/selection-bg.png)",
              backgroundSize: "100% 100%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
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
                      onValueChange={setSelectedSetNo}
                      className="w-full"
                    >
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-neutral-30 border-b">
                            <th className={`${TABLE_HEADER_CELL_BASE_NO_BORDER} text-center`}>
                              <div className={TABLE_INNER_DIV_CENTER_NO_BORDER}>Detail</div>
                            </th>
                            <th className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-center`}>
                              <div className={TABLE_INNER_DIV_CENTER}>Select</div>
                            </th>
                            <th className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}>
                              <div className={TABLE_INNER_DIV_LEFT}>No</div>
                            </th>
                            <th className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}>
                              <div className={TABLE_INNER_DIV_LEFT}>Set Name</div>
                            </th>
                            <th className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}>
                              <div className={TABLE_INNER_DIV_LEFT}>Outcome</div>
                            </th>
                            <th className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}>
                              <div className={TABLE_INNER_DIV_LEFT}>Cutoff</div>
                            </th>
                            <th className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}>
                              <div className={TABLE_INNER_DIV_LEFT}>Month</div>
                            </th>
                            <th className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}>
                              <div className={TABLE_INNER_DIV_LEFT}>#Of Groups</div>
                            </th>
                            <th className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}>
                              <div className={TABLE_INNER_DIV_LEFT}>Variance Benefit</div>
                            </th>
                            <th className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}>
                              <div className={TABLE_INNER_DIV_LEFT}>Group balance</div>
                            </th>
                            <th className={`${TABLE_HEADER_CELL_BASE_WITH_BORDER} text-left`}>
                              <div className={TABLE_INNER_DIV_LEFT}>Refine Cutoffs</div>
                            </th>
                            <th className={`${TABLE_HEADER_CELL_BASE_LAST} text-right`}>
                              <div className={TABLE_INNER_DIV_LEFT}>Delete</div>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {isLoading ? (
                            <tr>
                              <td colSpan={12} className="h-[200px] text-center">
                                <div className="text-body2 text-neutral-50">Loading...</div>
                              </td>
                            </tr>
                          ) : error ? (
                            <tr>
                              <td colSpan={12} className="h-[200px] text-center">
                                <div className="text-body2 text-red-500">Error: {error}</div>
                              </td>
                            </tr>
                          ) : resultTableData.length === 0 ? (
                            <tr>
                              <td colSpan={12} className="h-[200px] text-center">
                                <div className="text-body2 text-neutral-50">No data available</div>
                              </td>
                            </tr>
                          ) : (
                            resultTableData.map((row) => {
                              const rowNo = String(row.no).padStart(2, "0");
                              const isSelected = selectedSetNo === rowNo;
                              const isExpanded = expandedRows.has(rowNo);
                              return (
                                <Fragment key={row.subgroup_id}>
                                  <tr className={isExpanded ? "bg-[#efeff4]" : ""}>
                                    <td className={`${TABLE_BODY_CELL_BASE_NO_BORDER} text-center`}>
                                      <div className={TABLE_INNER_DIV_CENTER_NO_BORDER}>
                                        <button
                                          type="button"
                                          onClick={() => toggleRowExpansion(rowNo)}
                                          className="text-neutral-40 inline-flex shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 transition-transform duration-200"
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
                                          value={rowNo}
                                          id={`radio-${rowNo}`}
                                          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 outline-none focus:ring-0 focus:outline-none"
                                        >
                                          <span
                                            className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                                              isSelected
                                                ? "border-neutral-60 bg-primary-15"
                                                : "border-neutral-60"
                                            }`}
                                          >
                                            <RadioGroup.Indicator className="flex h-full w-full items-center justify-center">
                                              <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                            </RadioGroup.Indicator>
                                          </span>
                                        </RadioGroup.Item>
                                      </div>
                                    </td>
                                    <td className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}>
                                      <div className={TABLE_INNER_DIV_LEFT}>
                                        <span className="block truncate">{rowNo}</span>
                                      </div>
                                    </td>
                                    <td className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}>
                                      <div className={TABLE_INNER_DIV_LEFT}>
                                        <span className="inline-flex min-w-0 items-center gap-1 truncate">
                                          <span className="truncate">{row.set_name}</span>
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
                                    <td className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}>
                                      <div className={TABLE_INNER_DIV_LEFT}>
                                        <span className="block truncate">{row.outcome}</span>
                                      </div>
                                    </td>
                                    <td className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}>
                                      <div className={TABLE_INNER_DIV_LEFT}>
                                        <span className="block truncate">
                                          {row.cut_off.join("  ")}
                                        </span>
                                      </div>
                                    </td>
                                    <td className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}>
                                      <div className={TABLE_INNER_DIV_LEFT}>
                                        <span className="block truncate">{row.month}</span>
                                      </div>
                                    </td>
                                    <td className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}>
                                      <div className={TABLE_INNER_DIV_LEFT}>
                                        <span className="block truncate">{row.of_group}</span>
                                      </div>
                                    </td>
                                    <td
                                      className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left ${row.variance_benefit_label.includes("Highest") ? "text-[#3A11D8]" : ""}`}
                                    >
                                      <div className={TABLE_INNER_DIV_LEFT}>
                                        <span className="block truncate">
                                          {(row.variance_benefit * 100).toFixed(1)}%
                                          {row.variance_benefit_label
                                            ? ` ${row.variance_benefit_label}`
                                            : ""}
                                        </span>
                                      </div>
                                    </td>
                                    <td className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-left`}>
                                      <div className={TABLE_INNER_DIV_LEFT}>
                                        <span className="block truncate">{row.group_balance}</span>
                                      </div>
                                    </td>
                                    <td
                                      className={`${TABLE_BODY_CELL_BASE_WITH_BORDER} text-center`}
                                    >
                                      <div className={TABLE_INNER_DIV_CENTER}>
                                        <button
                                          type="button"
                                          className="text-neutral-40 hover:text-neutral-30 shrink-0 cursor-pointer border-0 bg-transparent p-1"
                                          title="Refine Cutoffs"
                                          onClick={() => {
                                            const query = new URLSearchParams({
                                              subgroupId: String(row.subgroup_id),
                                              month: String(row.month),
                                            });
                                            if (taskId) {
                                              query.set("taskId", taskId);
                                            }
                                            router.push(`/tsi/refine-cutoffs?${query.toString()}`);
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
                                        </button>
                                      </div>
                                    </td>
                                    <td className={`${TABLE_BODY_CELL_BASE_LAST} text-center`}>
                                      <div className={TABLE_INNER_DIV_CENTER}>
                                        <button
                                          type="button"
                                          className="text-neutral-40 hover:text-neutral-30 shrink-0 cursor-pointer border-0 bg-transparent p-1"
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
                                  {isExpanded &&
                                    (() => {
                                      // result_table에서 해당 row 데이터 가져오기
                                      const detailData = row;

                                      // 그룹 이름 매핑 (classification 기반)
                                      const getGroupDisplayName = (classification: string) => {
                                        if (classification === "high") return "High Risk";
                                        if (classification === "middle") return "Middle Risk";
                                        if (classification === "low") return "Low";
                                        return classification;
                                      };

                                      // 그룹 색상 매핑
                                      const getGroupColor = (classification: string) => {
                                        if (classification === "high") return "#231F52";
                                        if (classification === "middle") return "#7571A9";
                                        if (classification === "low") return "#AAA5E1";
                                        return "#231F52";
                                      };

                                      // number_or_patient 데이터 정렬 (high -> middle -> low 순서)
                                      const sortedPatients = detailData.number_or_patient
                                        ? [...detailData.number_or_patient].sort((a, b) => {
                                            const order = {
                                              high: 0,
                                              middle: 1,
                                              low: 2,
                                            };
                                            const aClass =
                                              detailData.within_group_variance_by_subgroup?.find(
                                                (v) => v.group === a.group
                                              )?.classification || "";
                                            const bClass =
                                              detailData.within_group_variance_by_subgroup?.find(
                                                (v) => v.group === b.group
                                              )?.classification || "";
                                            return (
                                              (order[aClass as keyof typeof order] ?? 99) -
                                              (order[bClass as keyof typeof order] ?? 99)
                                            );
                                          })
                                        : [];

                                      // 최소 환자 수 계산 (low 그룹 기준)
                                      const lowGroupPatient = sortedPatients.find((p) => {
                                        const varianceData =
                                          detailData.within_group_variance_by_subgroup?.find(
                                            (v) => v.group === p.group
                                          );
                                        return varianceData?.classification === "low";
                                      });
                                      const minPatients = lowGroupPatient?.number || 0;

                                      // Variance decomposition에서 총 variance 계산
                                      const totalVariance =
                                        detailData.variance_decomposition?.[0]?.variance || 0;
                                      const totalVR =
                                        detailData.variance_decomposition?.[0]?.vr || 0;

                                      // Within-group variance 데이터 정렬
                                      const sortedVariance =
                                        detailData.within_group_variance_by_subgroup
                                          ? [...detailData.within_group_variance_by_subgroup].sort(
                                              (a, b) => {
                                                const order = {
                                                  high: 0,
                                                  middle: 1,
                                                  low: 2,
                                                };
                                                return (
                                                  (order[a.classification as keyof typeof order] ??
                                                    99) -
                                                  (order[b.classification as keyof typeof order] ??
                                                    99)
                                                );
                                              }
                                            )
                                          : [];

                                      const totalVarValue =
                                        sortedVariance.length > 0 ? sortedVariance[0].total_var : 0;

                                      // Variance Reduction Explained 텍스트 생성
                                      const variancePercent = (
                                        detailData.variance_benefit * 100
                                      ).toFixed(1);
                                      const primaryGroup = sortedVariance.find(
                                        (v) => v.classification === "low"
                                      )
                                        ? "Low Risk"
                                        : sortedVariance.find((v) => v.classification === "high")
                                          ? "High Risk"
                                          : "patient group";

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
                                                    <h3 className="text-body3 mb-4 flex-shrink-0 font-semibold text-[#1c1b1b]">
                                                      Disease Progression by Subgroup
                                                    </h3>
                                                    <div className="min-h-0 flex-1 overflow-hidden rounded-[8px] bg-white">
                                                      {detailData.disease_progression_by_subgroup &&
                                                      detailData.disease_progression_by_subgroup
                                                        .length > 0 ? (
                                                        (() => {
                                                          // 그룹별로 데이터 분리
                                                          const groups = Array.from(
                                                            new Set(
                                                              detailData.disease_progression_by_subgroup.map(
                                                                (d) => d.group
                                                              )
                                                            )
                                                          ).sort();
                                                          const months = Array.from(
                                                            new Set(
                                                              detailData.disease_progression_by_subgroup.map(
                                                                (d) => d.month
                                                              )
                                                            )
                                                          ).sort((a, b) => a - b);

                                                          // 각 그룹별 데이터 시리즈 생성
                                                          const series = groups.map(
                                                            (group, groupIdx) => {
                                                              const groupData =
                                                                detailData.disease_progression_by_subgroup!.filter(
                                                                  (d) => d.group === group
                                                                );
                                                              const varianceData =
                                                                detailData.within_group_variance_by_subgroup?.find(
                                                                  (v) => v.group === group
                                                                );
                                                              const classification =
                                                                varianceData?.classification || "";
                                                              const color =
                                                                getGroupColor(classification);
                                                              const groupName =
                                                                getGroupDisplayName(classification);

                                                              return {
                                                                name: groupName,
                                                                type: "line" as const,
                                                                data: months
                                                                  .map((month) => {
                                                                    const dataPoint =
                                                                      groupData.find(
                                                                        (d) => d.month === month
                                                                      );
                                                                    return dataPoint
                                                                      ? [month, dataPoint.mean]
                                                                      : null;
                                                                  })
                                                                  .filter((d) => d !== null),
                                                                itemStyle: {
                                                                  color,
                                                                },
                                                                lineStyle: {
                                                                  color,
                                                                  width: 2,
                                                                },
                                                                symbol: "circle",
                                                                symbolSize: 6,
                                                              };
                                                            }
                                                          );

                                                          // 에러바 시리즈 생성 (custom renderItem 사용)
                                                          const errorBarSeries = groups.map(
                                                            (group, groupIdx) => {
                                                              const groupData =
                                                                detailData.disease_progression_by_subgroup!.filter(
                                                                  (d) => d.group === group
                                                                );
                                                              const varianceData =
                                                                detailData.within_group_variance_by_subgroup?.find(
                                                                  (v) => v.group === group
                                                                );
                                                              const classification =
                                                                varianceData?.classification || "";
                                                              const color =
                                                                getGroupColor(classification);
                                                              const CAP_LEN_PX = 4;

                                                              return {
                                                                name: `${group} error`,
                                                                type: "custom" as const,
                                                                data: months
                                                                  .map((month) => {
                                                                    const dataPoint =
                                                                      groupData.find(
                                                                        (d) => d.month === month
                                                                      );
                                                                    if (!dataPoint) return null;
                                                                    return [
                                                                      month,
                                                                      dataPoint.mean,
                                                                      dataPoint.mean -
                                                                        dataPoint.ci_low,
                                                                      dataPoint.ci_high -
                                                                        dataPoint.mean,
                                                                    ];
                                                                  })
                                                                  .filter((d) => d !== null),
                                                                renderItem: (
                                                                  params: unknown,
                                                                  api: {
                                                                    value: (i: number) => number;
                                                                    coord: (
                                                                      p: number[]
                                                                    ) => number[];
                                                                    style: (o: object) => object;
                                                                  }
                                                                ) => {
                                                                  const xVal = api.value(0);
                                                                  const mean = api.value(1);
                                                                  const marginLow = api.value(2);
                                                                  const marginHigh = api.value(3);
                                                                  const low = api.coord([
                                                                    xVal,
                                                                    mean - marginLow,
                                                                  ]);
                                                                  const high = api.coord([
                                                                    xVal,
                                                                    mean + marginHigh,
                                                                  ]);
                                                                  return {
                                                                    type: "group",
                                                                    children: [
                                                                      {
                                                                        type: "line",
                                                                        shape: {
                                                                          x1: low[0],
                                                                          y1: low[1],
                                                                          x2: high[0],
                                                                          y2: high[1],
                                                                        },
                                                                        style: api.style({
                                                                          stroke: color,
                                                                          lineWidth: 1.5,
                                                                        }),
                                                                      },
                                                                      {
                                                                        type: "line",
                                                                        shape: {
                                                                          x1:
                                                                            low[0] - CAP_LEN_PX / 2,
                                                                          y1: low[1],
                                                                          x2:
                                                                            low[0] + CAP_LEN_PX / 2,
                                                                          y2: low[1],
                                                                        },
                                                                        style: api.style({
                                                                          stroke: color,
                                                                          lineWidth: 1.5,
                                                                        }),
                                                                      },
                                                                      {
                                                                        type: "line",
                                                                        shape: {
                                                                          x1:
                                                                            high[0] -
                                                                            CAP_LEN_PX / 2,
                                                                          y1: high[1],
                                                                          x2:
                                                                            high[0] +
                                                                            CAP_LEN_PX / 2,
                                                                          y2: high[1],
                                                                        },
                                                                        style: api.style({
                                                                          stroke: color,
                                                                          lineWidth: 1.5,
                                                                        }),
                                                                      },
                                                                    ],
                                                                  };
                                                                },
                                                                z: 1,
                                                                showInLegend: false,
                                                              };
                                                            }
                                                          );

                                                          // Y축 범위 계산 (에러바가 잘리지 않도록 더 넓은 padding)
                                                          const allMeans =
                                                            detailData.disease_progression_by_subgroup.map(
                                                              (d) => d.mean
                                                            );
                                                          const allCis =
                                                            detailData.disease_progression_by_subgroup.flatMap(
                                                              (d) => [d.ci_low, d.ci_high]
                                                            );
                                                          const yMin = Math.min(
                                                            ...allMeans,
                                                            ...allCis
                                                          );
                                                          const yMax = Math.max(
                                                            ...allMeans,
                                                            ...allCis
                                                          );
                                                          const yRange = yMax - yMin;
                                                          const yPadding = yRange * 0.15; // 10% -> 15%로 증가하여 에러바가 잘리지 않도록

                                                          const chartOption = {
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
                                                              nameLocation: "middle",
                                                              nameGap: 15,
                                                              min: Math.max(0, months[0] - 1),
                                                              max: months[months.length - 1], // 마지막 month까지만 표시
                                                              nameTextStyle: {
                                                                fontSize: 10,
                                                                color: "#484646",
                                                              },
                                                              axisLabel: {
                                                                fontSize: 9,
                                                                color: "#484646",
                                                              },
                                                              axisLine: {
                                                                show: true,
                                                                onZero: false, // X축이 항상 하단에 표시되도록
                                                                lineStyle: {
                                                                  color: "#999", // X축 색상 (회색)
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
                                                                  color: "#E8E8E8",
                                                                  width: 1,
                                                                },
                                                              },
                                                            },
                                                            yAxis: {
                                                              type: "value" as const,
                                                              name: `Δ ${detailData.outcome}`,
                                                              nameLocation: "middle",
                                                              nameGap: 22,
                                                              min: yMin - yPadding,
                                                              max: yMax + yPadding,
                                                              nameTextStyle: {
                                                                fontSize: 10,
                                                                color: "#484646",
                                                              },
                                                              axisLabel: {
                                                                fontSize: 9,
                                                                color: "#484646",
                                                                showMinLabel: false, // min 값 틱 레이블 숨김
                                                                showMaxLabel: false, // max 값 틱 레이블 숨김
                                                                formatter: (value: number) => {
                                                                  // 소수점이 있으면 소수점 첫째자리까지, 없으면 정수로 표시
                                                                  return value % 1 === 0
                                                                    ? value.toString()
                                                                    : value.toFixed(1);
                                                                },
                                                              },
                                                              axisLine: {
                                                                show: true,
                                                                onZero: false, // Y축이 항상 왼쪽에 표시되도록
                                                                lineStyle: {
                                                                  color: "#666", // Y축 색상 (다른 회색)
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
                                                                  color: "#E8E8E8",
                                                                  width: 1,
                                                                },
                                                              },
                                                            },
                                                            tooltip: {
                                                              show: false, // 툴팁 완전히 비활성화
                                                              trigger: "none" as const,
                                                              axisPointer: {
                                                                show: false, // 마우스 오버시 수직선 제거
                                                              },
                                                            },
                                                            legend: {
                                                              show: false,
                                                            },
                                                            series: [...series, ...errorBarSeries],
                                                          };

                                                          return (
                                                            <ReactECharts
                                                              option={chartOption}
                                                              style={{
                                                                height: "100%",
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
                                                    <h3 className="text-body3 mb-0 flex-shrink-0 font-semibold text-[#1c1b1b]">
                                                      Number of patients
                                                    </h3>
                                                    <p className="mb-0 flex-shrink-0 text-sm text-[#605e5e]">
                                                      At least {minPatients} patients per group are
                                                      recommended.
                                                    </p>
                                                    <div className="mt-auto">
                                                      <div className="h-[110px] space-y-0 overflow-auto rounded-[8px] bg-white p-3">
                                                        <div className="flex items-center gap-2 border-b border-[#adaaaa] pb-0 text-sm font-semibold text-[#231f52]">
                                                          <span>Group</span>
                                                          <span className="ml-auto">
                                                            Number of patients
                                                          </span>
                                                        </div>
                                                        {sortedPatients.map((patient, idx) => {
                                                          const varianceData =
                                                            detailData.within_group_variance_by_subgroup?.find(
                                                              (v) => v.group === patient.group
                                                            );
                                                          const classification =
                                                            varianceData?.classification || "";
                                                          const groupName =
                                                            getGroupDisplayName(classification);
                                                          const groupColor =
                                                            getGroupColor(classification);

                                                          return (
                                                            <div
                                                              key={patient.group}
                                                              className={`flex items-center gap-2 text-sm text-[#1c1b1b] ${
                                                                idx > 0
                                                                  ? "border-t border-[#adaaaa] pt-0"
                                                                  : ""
                                                              }`}
                                                            >
                                                              <div
                                                                className="h-3 w-3 rounded-full"
                                                                style={{
                                                                  backgroundColor: groupColor,
                                                                }}
                                                              ></div>
                                                              <span>{groupName}</span>
                                                              <span className="ml-auto">
                                                                {patient.number.toLocaleString()}
                                                              </span>
                                                            </div>
                                                          );
                                                        })}
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                                {/* Right Column */}
                                                <div className="bg-primary-15 flex h-[468px] w-[746px] flex-col gap-3 rounded-[18px] px-4 py-6">
                                                  {/* Variance Reduction Explained */}
                                                  <div>
                                                    <h3 className="text-feature-title mb-4 text-white">
                                                      Variance Reduction Explained
                                                    </h3>
                                                    <p className="text-body5 leading-relaxed font-semibold text-white">
                                                      Subgroup stratification reduced the overall
                                                      variance by {variancePercent}%. The observed
                                                      variance reduction was primarily driven by the{" "}
                                                      {primaryGroup}
                                                      patient group. Therefore, if cutoff adjustment
                                                      is required, maintaining the {primaryGroup}
                                                      group and adjusting the cutoff for the{" "}
                                                      {primaryGroup === "Low Risk"
                                                        ? "High Risk"
                                                        : "Low Risk"}{" "}
                                                      group is a reasonable strategy.
                                                    </p>
                                                  </div>
                                                  {/* Two cards in one row */}
                                                  <div className="mt-auto grid grid-cols-2 gap-3">
                                                    {/* Variance decomposition */}
                                                    <div className="flex h-[306px] w-[350px] flex-col overflow-hidden rounded-[12px] bg-white">
                                                      {/* 텍스트 영역 (패딩 있음) */}
                                                      <div className="flex-shrink-0 p-4">
                                                        <h3 className="text-body4 mb-4 tracking-[-0.75px] text-[#1c1b1b]">
                                                          Variance decomposition
                                                        </h3>
                                                        <div className="mb-4 flex gap-5">
                                                          <div>
                                                            <div className="text-body5 mb-1 font-semibold text-[#f06600]">
                                                              Variance
                                                            </div>
                                                            <div className="text-[28px] leading-[28px] font-semibold tracking-[-0.84px] text-[#f06600]">
                                                              {totalVariance.toFixed(2)}
                                                            </div>
                                                          </div>
                                                          <div>
                                                            <div className="text-body5 mb-1 font-semibold text-[#f06600]">
                                                              VR
                                                            </div>
                                                            <div className="text-[28px] leading-[28px] font-semibold tracking-[-0.84px] text-[#f06600]">
                                                              {totalVR.toFixed(3)}
                                                            </div>
                                                          </div>
                                                        </div>
                                                      </div>
                                                      {/* 그래프 영역 (패딩 없음) */}
                                                      <div className="min-h-0 flex-1 overflow-hidden bg-white">
                                                        {detailData.variance_decomposition &&
                                                        detailData.variance_decomposition.length >
                                                          0 ? (
                                                          (() => {
                                                            // Variance decomposition 차트 데이터 준비
                                                            const decompositionData =
                                                              detailData.variance_decomposition;
                                                            // 총 variance는 첫 번째 항목의 variance 사용 (모든 그룹이 같은 total_var를 가짐)
                                                            const totalVarianceValue =
                                                              decompositionData[0]?.variance || 0;
                                                            // Within pooled는 첫 번째 그룹의 variance
                                                            const withinPooled =
                                                              decompositionData[0]?.variance || 0;
                                                            // Explained Total Within은 나머지 그룹들의 variance 합
                                                            const explainedTotal =
                                                              decompositionData.length > 1
                                                                ? decompositionData
                                                                    .slice(1)
                                                                    .reduce(
                                                                      (sum, d) => sum + d.variance,
                                                                      0
                                                                    )
                                                                : 0;

                                                            const chartOption = {
                                                              animation: false,
                                                              grid: {
                                                                left: "10%",
                                                                right: "5%",
                                                                top: "5%",
                                                                bottom: "15%",
                                                              },
                                                              xAxis: {
                                                                type: "category" as const,
                                                                data: ["Explained"],

                                                                axisLabel: {
                                                                  show: true,
                                                                  fontSize: 9,
                                                                  color: "#484646",
                                                                },
                                                                axisLine: {
                                                                  show: true,
                                                                  onZero: false,
                                                                  lineStyle: {
                                                                    color: "#999",
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
                                                                nameLocation: "middle",
                                                                nameGap: 20,
                                                                max: totalVarianceValue * 1.2,
                                                                splitNumber: 5,
                                                                nameTextStyle: {
                                                                  fontSize: 9,
                                                                  color: "#484646",
                                                                },
                                                                axisLabel: {
                                                                  fontSize: 9,
                                                                  color: "#484646",
                                                                  formatter: (value: number) => {
                                                                    // 소수점이 있으면 소수점 첫째자리까지, 없으면 정수로 표시
                                                                    return value % 1 === 0
                                                                      ? value.toString()
                                                                      : value.toFixed(1);
                                                                  },
                                                                },
                                                                axisLine: {
                                                                  show: true,
                                                                  onZero: false,
                                                                  lineStyle: {
                                                                    color: "#666",
                                                                    width: 1,
                                                                  },
                                                                },
                                                                axisTick: {
                                                                  show: false,
                                                                },
                                                                splitLine: {
                                                                  show: false,
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
                                                                  stack: "variance",
                                                                  data: [withinPooled],
                                                                  itemStyle: {
                                                                    color: "#231F52",
                                                                    borderRadius: [8, 8, 8, 8],
                                                                  },
                                                                  barWidth: "60%",
                                                                },
                                                                {
                                                                  name: "Explained Total Within",
                                                                  type: "bar" as const,
                                                                  stack: "variance",
                                                                  data: [explainedTotal],
                                                                  itemStyle: {
                                                                    color: "#AAA5E1",
                                                                    borderRadius: [8, 8, 8, 8],
                                                                  },
                                                                },
                                                              ],
                                                            };

                                                            return (
                                                              <ReactECharts
                                                                option={chartOption}
                                                                style={{
                                                                  height: "100%",
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
                                                    {/* Within-group variance by subgroup */}
                                                    <div className="flex h-[306px] w-[350px] flex-col overflow-hidden rounded-[12px] bg-white">
                                                      {/* 텍스트 영역 (패딩 있음) */}
                                                      <div className="flex-shrink-0 p-4">
                                                        <h3 className="mb-4 text-[15px] font-semibold text-[#262625]">
                                                          Within-group variance by subgroup
                                                        </h3>
                                                        <div className="mb-4 flex gap-5">
                                                          {sortedVariance.map((v) => {
                                                            const displayName =
                                                              v.classification === "high"
                                                                ? "High"
                                                                : v.classification === "middle"
                                                                  ? "Middle"
                                                                  : "Low";
                                                            return (
                                                              <div key={v.group}>
                                                                <div className="mb-1 text-xs font-semibold text-[#f06600]">
                                                                  {displayName}
                                                                </div>
                                                                <div className="text-[28px] font-semibold text-[#f06600]">
                                                                  {v.variance.toFixed(2)}
                                                                </div>
                                                              </div>
                                                            );
                                                          })}
                                                        </div>
                                                      </div>
                                                      {/* 그래프 영역 (패딩 없음) */}
                                                      <div className="min-h-0 flex-1 overflow-hidden bg-white">
                                                        {sortedVariance.length > 0 ? (
                                                          (() => {
                                                            const maxVar = Math.max(
                                                              ...sortedVariance.map(
                                                                (v) => v.variance
                                                              )
                                                            );
                                                            // total_var 값 가져오기 (모든 그룹이 같은 total_var를 가짐)
                                                            const totalVarValue =
                                                              sortedVariance.length > 0
                                                                ? sortedVariance[0].total_var
                                                                : 0;
                                                            const chartOption = {
                                                              animation: false,
                                                              grid: {
                                                                left: "10%",
                                                                right: "5%",
                                                                top: "5%",
                                                                bottom: "15%",
                                                              },
                                                              xAxis: {
                                                                type: "category" as const,
                                                                data: sortedVariance.map((v) => {
                                                                  const displayName =
                                                                    v.classification === "high"
                                                                      ? "High"
                                                                      : v.classification ===
                                                                          "middle"
                                                                        ? "Middle"
                                                                        : "Low";
                                                                  return displayName;
                                                                }),
                                                                axisLabel: {
                                                                  fontSize: 9,
                                                                  color: "#484646",
                                                                },
                                                                axisLine: {
                                                                  show: true,
                                                                  onZero: false,
                                                                  lineStyle: {
                                                                    color: "#999",
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
                                                                nameLocation: "middle",
                                                                nameGap: 20,
                                                                max: maxVar * 1.2,
                                                                splitNumber: 5,
                                                                nameTextStyle: {
                                                                  fontSize: 9,
                                                                  color: "#484646",
                                                                },
                                                                axisLabel: {
                                                                  fontSize: 9,
                                                                  color: "#484646",
                                                                  formatter: (value: number) => {
                                                                    // 소수점이 있으면 소수점 첫째자리까지, 없으면 정수로 표시
                                                                    return value % 1 === 0
                                                                      ? value.toString()
                                                                      : value.toFixed(1);
                                                                  },
                                                                },
                                                                axisLine: {
                                                                  show: true,
                                                                  onZero: false,
                                                                  lineStyle: {
                                                                    color: "#666",
                                                                    width: 1,
                                                                  },
                                                                },
                                                                axisTick: {
                                                                  show: false,
                                                                },
                                                                splitLine: {
                                                                  show: false,
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
                                                                  data: sortedVariance.map((v) => ({
                                                                    value: v.variance,
                                                                    itemStyle: {
                                                                      color: getGroupColor(
                                                                        v.classification
                                                                      ),
                                                                      borderRadius: [8, 8, 8, 8],
                                                                    },
                                                                  })),
                                                                  barWidth: "50%",
                                                                  label: {
                                                                    show: false,
                                                                  },
                                                                  markLine: {
                                                                    silent: true,
                                                                    symbol: "none",
                                                                    label: {
                                                                      show: true,
                                                                      position: "end",
                                                                      formatter: `Total var=${totalVarValue.toFixed(2)}`,
                                                                      fontSize: 10,
                                                                      color: "#484646",
                                                                      offset: [-75, -10],
                                                                    },
                                                                    lineStyle: {
                                                                      type: "dashed",
                                                                      color: "#999",
                                                                      width: 1,
                                                                    },
                                                                    data: [
                                                                      {
                                                                        yAxis: totalVarValue,
                                                                      },
                                                                    ],
                                                                  },
                                                                },
                                                              ],
                                                            };

                                                            return (
                                                              <ReactECharts
                                                                option={chartOption}
                                                                style={{
                                                                  height: "100%",
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
        <div className="mx-auto mt-4 flex w-[1772px] flex-shrink-0 items-center justify-end gap-4 pb-2">
          <button
            type="button"
            className="inline-flex h-[48px] cursor-pointer items-center justify-center border-0 bg-transparent p-0 transition-opacity hover:opacity-90"
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
            className="text-body3 text-neutral-30 inline-flex h-[48px] w-[179px] shrink-0 cursor-pointer items-center justify-center rounded-[100px] border-0 bg-cover bg-center bg-no-repeat transition-opacity hover:opacity-90"
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


export default function TSISubgroupSelectionPage() {
  return (
    <Suspense>
      <TSISubgroupSelectionPageContent />
    </Suspense>
  );
}
