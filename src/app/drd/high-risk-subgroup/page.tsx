/**
 * High-Risk Subgroup Page — Default Settings Step 1: High-Risk Subgroup
 *
 * 역할:
 *   질병 진행 기울기(slope)를 기반으로 고위험 서브그룹을 선택하는 설정 페이지입니다.
 *   미리 정의된 서브그룹 목록(CKD 1/2 Stage, Set 1/4)을 아코디언 테이블로 표시하며,
 *   각 항목은 Slow / Rapid 두 가지 서브 행을 가집니다.
 *   라디오 버튼으로 하나의 서브 행을 선택한 뒤 Confirm하면 설정이 저장됩니다.
 *
 * 레이아웃:
 *   ┌─────────────────────┬──────────────────────────────────────────────────┐
 *   │ 왼쪽: Navy Glass     │ 오른쪽: "Load Subgroup" 아코디언 테이블           │
 *   │ - Filtered % 카드   │                                                  │
 *   │ - 4-Step 사이드바   │                                                  │
 *   └─────────────────────┴──────────────────────────────────────────────────┘
 *
 * 주요 상태:
 *   - selectedSubRow: 현재 선택된 서브 행 ID (e.g. "ckd1-slow")
 *   - expandedRows: 현재 열린 부모 행 Set (한 번에 여러 개 열릴 수 있음)
 *   - showSubgroupModal: "Go to Create Subgroup" 확인 모달 표시 여부
 *
 * 저장:
 *   Confirm 클릭 시 subRowDataMap에서 선택된 서브 행의 메타데이터를 읽어
 *   defaultSettingStore의 highRiskSubgroupData에 저장하고 완료 상태를 true로 설정합니다.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useDefaultSettingStore } from "@/store/defaultSettingStore";
import RadioButton from "@/components/ui/radio-button";
import { DrdLeftPanel } from "@/components/drd/DrdLeftPanel";
import { makeDefaultSettingSteps } from "@/components/drd/drd-step-data";

/**
 * 아코디언 행 헤더 오른쪽에 표시되는 화살표 아이콘.
 * open=true이면 위쪽 방향(∧), false이면 아래 방향(∨)을 표시합니다.
 */
function AccordionItem({ open = false }: { open?: boolean }) {
  const size = 20;
  if (open) {
    // 열린 아코디언: chevron up (∧)
    return (
      <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <path d="M5 12.5L10 7.5L15 12.5" stroke="var(--neutral-20)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  // 닫힌 아코디언: chevron down (∨)
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <path d="M5 7.5L10 12.5L15 7.5" stroke="var(--neutral-20)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ──────────────────────────────────────────────────────────────────────────

export default function HighRiskSubgroupPage() {
  const router = useRouter();
  // defaultSettingStore: 코호트 수, 완료 상태, 고위험 서브그룹 데이터 관리
  const { setCompleted, cohortCount, finalCohortCount, setHighRiskSubgroupData } = useDefaultSettingStore();
  // filteredRatio: Filtered Patients 카드 프로그레스바 비율
  const filteredRatio = cohortCount > 0 ? Math.round((finalCohortCount / cohortCount) * 100) : 0;

  /**
   * 서브 행 ID → 저장될 메타데이터 매핑.
   * Confirm 시 selectedSubRow의 ID로 이 맵을 조회해 defaultSettingStore에 저장합니다.
   */
  const subRowDataMap: Record<string, { parentName: string; subRowName: string; feature: string; condition: string; month: string; slope: string; status: string }> = {
    "ckd1-slow":  { parentName: "CKD 1 Stage", subRowName: "Slow",  feature: "eGFR", condition: "> 90",      month: "36", slope: "2", status: "n=1,200" },
    "ckd1-rapid": { parentName: "CKD 1 Stage", subRowName: "Rapid", feature: "eGFR", condition: "≤ 90",      month: "36", slope: "2", status: "n=360"   },
    "ckd2-slow":  { parentName: "CKD 2 Stage", subRowName: "Slow",  feature: "eGFR", condition: "> 60",      month: "36", slope: "3", status: "n=1,200" },
    "ckd2-rapid": { parentName: "CKD 2 Stage", subRowName: "Rapid", feature: "eGFR", condition: "≤ 60",      month: "36", slope: "3", status: "n=360"   },
    "set1-slow":  { parentName: "Set 1",        subRowName: "Slow",  feature: "HbA1c", condition: "",         month: "",   slope: "",  status: ""         },
    "set1-rapid": { parentName: "Set 1",        subRowName: "Rapid", feature: "HbA1c", condition: "",         month: "",   slope: "",  status: ""         },
    "set4-slow":  { parentName: "Set 4",        subRowName: "Slow",  feature: "HbA1c", condition: "",         month: "",   slope: "",  status: ""         },
    "set4-rapid": { parentName: "Set 4",        subRowName: "Rapid", feature: "HbA1c", condition: "",         month: "",   slope: "",  status: ""         },
  };
  // selectedSubRow: 현재 라디오 선택된 서브 행 ID (기본값: "ckd1-slow")
  const [selectedSubRow, setSelectedSubRow] = useState<string>("ckd1-slow");
  // expandedRows: 현재 펼쳐진 부모 행 ID Set
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(["ckd1"]));
  // showSubgroupModal: "Go to Create Subgroup" 클릭 시 경고 모달 표시 여부
  const [showSubgroupModal, setShowSubgroupModal] = useState(false);

  /** 서브 행 ID에서 부모 행 ID를 추출합니다 (예: "ckd1-slow" → "ckd1") */
  const getSelectedParent = (sel: string) => {
    if (sel.startsWith("ckd1-")) return "ckd1";
    if (sel.startsWith("ckd2-")) return "ckd2";
    if (sel.startsWith("set1-")) return "set1";
    if (sel.startsWith("set4-")) return "set4";
    return null;
  };

  /**
   * 부모 행 클릭 시 아코디언 토글.
   * 이미 열려있으면 닫고, 닫혀있으면 열되 현재 선택된 서브 행의 부모는 유지합니다.
   */
  const toggleRow = (id: string) => setExpandedRows((prev) => {
    const selectedParent = getSelectedParent(selectedSubRow);
    if (prev.has(id)) {
      const next = new Set(prev);
      next.delete(id);
      return next;
    }
    // 닫혀있는 경우: 열기
    // 선택된 부모가 현재 열려있을 때만 유지, 닫혀있으면 그대로 유지
    const next = new Set<string>();
    if (selectedParent && prev.has(selectedParent)) next.add(selectedParent);
    next.add(id);
    return next;
  });

  /**
   * 서브 행 라디오 버튼 선택 시 호출됩니다.
   * 선택된 서브 행의 부모 행을 자동으로 펼쳐 항상 선택 항목이 보이도록 합니다.
   */
  const selectSubRow = (rowId: string) => {
    const nextParent = getSelectedParent(rowId);
    setSelectedSubRow(rowId);
    if (nextParent) {
      setExpandedRows(prev => {
        const next = new Set(prev);
        next.add(nextParent);
        return next;
      });
    }
  };
  return (
    <AppLayout headerType="drd" drdStep={1}>
      <div className="flex flex-col h-full gap-6">
        {/* {타이틀 영역/Title Area} */}
         {/* ── TOP: Title ───────────────────────────── */}
        <div className="flex flex-row items-start justify-between shrink-0 px-1">
          <div className="flex flex-col">
            <h1 onClick={() => router.push("/drd/default-setting")} className="text-page-title">
              Default Settings
            </h1>
            <span className="text-page-subtitle">
              Setup Required
            </span>
          </div>
        </div>

        {/* {컨텐츠 행/Content Row} */}
        {/* ── ② 컨텐츠 행 ──────────────────────────────────────────────── */}
        <div className="drd-content-row gap-1">

          {/* {왼쪽 패널/Left Panel} */}
          <DrdLeftPanel
            steps={makeDefaultSettingSteps("high-risk-subgroup")}
            filteredPatientsProps={{
              filteredRatio,
              initialCohort: cohortCount,
              finalCohort: finalCohortCount,
              onAddDataClick: () => router.push("/drd/datasetting"),
            }}
          />

          {/* {오른쪽 패널/Right Panel} */}
         {/* 오른쪽 상위 배경 카드: selection-bg.png → 안에 흰색 테이블 카드 */}
            <div className="figma-nine-slice figma-home-panel-right flex flex-col rounded-[36px] overflow-hidden flex-[78] min-w-0 min-h-0 gap-3" >


            {/* 상단: 제목 + Go to Create Subgroup 버튼 */}
            <div className="shrink-0 flex items-center justify-between pl-[4px] pr-[4px] h-[40px] pt-0 pb-0 pr-0">
              <h2 className="text-body1 text-[var(--text-header)] m-0">
                Load Subgroup
              </h2>
              <button onClick={() => setShowSubgroupModal(true)} className="btn-tsi btn-tsi-primary" style={{ height: 42 }}>
                Go to Create Subgroup
              </button>
            </div>

            {/* {테이블 영역/Table Area} */}
            {/* 테이블 영역 */}
            <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
              <div className="bg-white rounded-[20px] flex flex-col overflow-hidden h-full">

                {/* {테이블 헤더/Table Header} */}
                {/* 테이블 헤더 */}
                <div className="flex items-center shrink-0 border-b border-neutral-90 py-[12px] px-0">
                  <div className="w-[7.63%] shrink-0" />
                  <div className="flex items-center px-[10px] w-[17.94%] h-full border-l border-neutral-90 shrink-0">
                    <span className="text-body5 text-[var(--text-secondary)]">Set Name</span>
                  </div>
                  <div className="flex items-center px-[10px] w-[20.04%] h-full border-l border-neutral-90 shrink-0">
                    <span className="text-body5 text-[var(--text-secondary)]">Feature</span>
                  </div>
                  <div className="flex items-center px-[10px] w-[14.31%] h-full border-l border-neutral-90 shrink-0">
                    <span className="text-body5 text-[var(--text-secondary)]">Condition</span>
                  </div>
                  <div className="flex items-center px-[10px] w-[11.45%] h-full border-l border-neutral-90 shrink-0">
                    <span className="text-body5 text-[var(--text-secondary)]">Month</span>
                  </div>
                  <div className="flex items-center px-[10px] w-[11.45%] h-full border-l border-neutral-90 shrink-0">
                    <span className="text-body5 text-[var(--text-secondary)]">Slope</span>
                  </div>
                  <div className="flex items-center px-[10px] w-[17.18%] h-full border-l border-neutral-90 shrink-0">
                    <span className="text-body5 text-[var(--text-secondary)]">Status</span>
                  </div>
                  <div className="flex items-center px-[10px] flex-1 h-full border-l border-neutral-90">
                    <span className="text-body5 text-[var(--text-secondary)]">Date</span>
                  </div>
                </div>

                {/* {테이블 바디/Table Body} */}
                {/* 테이블 바디 */}
                <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col">

                  {/* CKD 1 Stage */}
                  {(() => { const ckd1HasSel = ["ckd1-slow","ckd1-rapid"].includes(selectedSubRow ?? ""); const ckd1Open = expandedRows.has("ckd1"); return (
                  <div className={`flex flex-col shrink-0 ${ckd1HasSel || ckd1Open ? "border-solid" : "border-b border-neutral-60 border-solid"}`} style={{ background: ckd1HasSel ? "rgba(243,238,255,0.6)" : ckd1Open ? "#fbfbfc" : "white", ...(ckd1HasSel ? { borderTop: "1px solid rgba(58,17,216,0.6)", borderBottom: "1px solid rgba(58,17,216,0.6)" } : ckd1Open ? { borderTop: "1px solid var(--neutral-60)", borderBottom: "1px solid #ADADAD" } : {}) }}>
                    <div className={`flex items-stretch py-[6px] overflow-clip cursor-pointer`} onClick={() => toggleRow("ckd1")}>
                      <div className="flex items-center justify-center pl-[12px] pr-[8px] w-[7.63%] shrink-0">
                        <div className="w-[20px] h-[20px] flex items-center justify-center">
                          <AccordionItem open={expandedRows.has("ckd1")} />
                        </div>
                      </div>
                      <div className="flex items-center px-[10px] w-[17.94%] border-l border-neutral-90 shrink-0">
                        <span className="text-body4 text-neutral-40 flex-1 min-w-0">
                          CKD 1 Stage
                        </span>
                      </div>
                      <div className="flex items-center px-[10px] w-[20.04%] border-l border-neutral-90 shrink-0">
                        <span className="text-body4 text-neutral-40">
                          eGFR
                        </span>
                      </div>
                      <div className="flex items-center px-[10px] w-[14.31%] border-l border-neutral-90 shrink-0">
                        <span className="text-body4 text-neutral-40">
                          ≤ 90
                        </span>
                      </div>
                      <div className="flex items-center px-[10px] w-[11.45%] border-l border-neutral-90 shrink-0">
                        <span className="text-body4 text-neutral-40">
                          36
                        </span>
                      </div>
                      <div className="flex items-center px-[10px] w-[11.45%] border-l border-neutral-90 shrink-0">
                        <span className="text-body4 text-neutral-40">
                          2
                        </span>
                      </div>
                      <div className="flex items-center px-[10px] w-[17.18%] border-l border-neutral-90 shrink-0">
                        <span className="text-body4 text-neutral-40">
                          OK (n min=150)
                        </span>
                      </div>
                      <div className="flex items-center px-[10px] flex-1 border-l border-neutral-90">
                        <span className="text-body4 text-neutral-40">
                          2025/12/25 17:00:01
                        </span>
                      </div>
                    </div>

                    {expandedRows.has("ckd1") && (
                      <>
                        {/* 서브 행 – Slow */}
                        {(() => { const isSel = selectedSubRow === "ckd1-slow"; return (
                        <div className={`flex items-center py-[16px] overflow-clip border-solid cursor-pointer ${"[&>div]:border-neutral-90"}`} style={{ borderTop: `1.5px solid ${ckd1HasSel ? "var(--tertiary-40)" : "#ADADAD"}`, background: "transparent", opacity: 1 }} onClick={() => selectSubRow("ckd1-slow")}>
                          <div className="flex items-center justify-center pl-[12px] pr-[8px] w-[7.63%] shrink-0">
                            <RadioButton checked={isSel} onChange={() => selectSubRow("ckd1-slow")} size={16} />
                          </div>
                          <div className="flex items-center px-[10px] w-[17.94%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40 flex-1 min-w-0">Slow</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[20.04%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40">eGFR</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[14.31%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40">{`> 90`}</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40">36</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40">2</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[17.18%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40">n=1,200</span>
                          </div>
                          <div className="flex items-center px-[10px] flex-1 border-l" />
                        </div>
                        ); })()}
                        {/* 서브 행 – Rapid */}
                        {(() => { const isSel = selectedSubRow === "ckd1-rapid"; return (
                        <div className={`flex items-center py-[16px] overflow-clip border-solid cursor-pointer ${"[&>div]:border-neutral-90"}`} style={{ borderTop: "1.5px solid #D8D7D9", background: "transparent", opacity: 1 }} onClick={() => selectSubRow("ckd1-rapid")}>
                          <div className="flex items-center justify-center pl-[12px] pr-[8px] w-[7.63%] shrink-0">
                            <RadioButton checked={isSel} onChange={() => selectSubRow("ckd1-rapid")} size={16} />
                          </div>
                          <div className="flex items-center px-[10px] w-[17.94%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40 flex-1 min-w-0">Rapid</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[20.04%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40">eGFR</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[14.31%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40">≤ 90</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40">36</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40">2</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[17.18%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40">n=360</span>
                          </div>
                          <div className="flex items-center px-[10px] flex-1 border-l" />
                        </div>
                        ); })()}
                      </>
                    )}
                  </div>
                  ); })()}

                  {/* CKD 2 Stage */}
                  {(() => { const ckd2HasSel = ["ckd2-slow","ckd2-rapid"].includes(selectedSubRow ?? ""); const ckd2Open = expandedRows.has("ckd2"); return (
                  <div className={`flex flex-col shrink-0 ${ckd2HasSel || ckd2Open ? "border-solid" : "border-b border-neutral-60 border-solid"}`} style={{ background: ckd2HasSel ? "rgba(243,238,255,0.6)" : ckd2Open ? "#fbfbfc" : "white", ...(ckd2HasSel ? { borderTop: "1px solid rgba(58,17,216,0.6)", borderBottom: "1px solid rgba(58,17,216,0.6)" } : ckd2Open ? { borderTop: "1px solid var(--neutral-60)", borderBottom: "1px solid #ADADAD" } : {}) }}>
                    <div className={`flex items-stretch py-[6px] overflow-clip cursor-pointer`} onClick={() => toggleRow("ckd2")}>
                      <div className="flex items-center justify-center pl-[12px] pr-[8px] w-[7.63%] shrink-0">
                        <div className="w-[20px] h-[20px] flex items-center justify-center">
                          <AccordionItem open={expandedRows.has("ckd2")} />
                        </div>
                      </div>
                      <div className="flex items-center px-[10px] w-[17.94%] border-l border-neutral-90 shrink-0">
                        <span className="text-body4 text-neutral-40 flex-1 min-w-0">CKD 2 Stage</span>
                      </div>
                      <div className="flex items-center px-[10px] w-[20.04%] border-l border-neutral-90 shrink-0">
                        <span className="text-body4 text-neutral-40">eGFR</span>
                      </div>
                      <div className="flex items-center px-[10px] w-[14.31%] border-l border-neutral-90 shrink-0">
                        <span className="text-body4 text-neutral-40">≤ 60 ≤ 90</span>
                      </div>
                      <div className="flex items-center px-[10px] w-[11.45%] border-l border-neutral-90 shrink-0">
                        <span className="text-body4 text-neutral-40">36</span>
                      </div>
                      <div className="flex items-center px-[10px] w-[11.45%] border-l border-neutral-90 shrink-0">
                        <span className="text-body4 text-neutral-40">3</span>
                      </div>
                      <div className="flex items-center px-[10px] w-[17.18%] border-l border-neutral-90 shrink-0">
                        <p className="text-body4 text-neutral-40 m-0">
                          <span className="text-secondary-60">NG</span>{` (n min=150)`}
                        </p>
                      </div>
                      <div className="flex items-center px-[10px] flex-1 border-l border-neutral-90">
                        <span className="text-body4 text-neutral-40">2025/12/25 17:00:01</span>
                      </div>
                    </div>
                    {expandedRows.has("ckd2") && (
                      <>
                        {/* 서브 행 – Slow */}
                        {(() => { const isSel = selectedSubRow === "ckd2-slow"; return (
                        <div className={`flex items-center py-[16px] overflow-clip border-solid cursor-pointer ${"[&>div]:border-neutral-90"}`} style={{ borderTop: `1.5px solid ${ckd2HasSel ? "var(--tertiary-40)" : "#ADADAD"}`, background: "transparent", opacity: 1 }} onClick={() => selectSubRow("ckd2-slow")}>
                          <div className="flex items-center justify-center pl-[12px] pr-[8px] w-[7.63%] shrink-0">
                            <RadioButton checked={isSel} onChange={() => selectSubRow("ckd2-slow")} size={16} />
                          </div>
                          <div className="flex items-center px-[10px] w-[17.94%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40 flex-1 min-w-0">Slow</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[20.04%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40">eGFR</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[14.31%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40">{`> 60`}</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40">36</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40">3</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[17.18%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40">n=1,200</span>
                          </div>
                          <div className="flex items-center px-[10px] flex-1 border-l" />
                        </div>
                        ); })()}
                        {/* 서브 행 – Rapid */}
                        {(() => { const isSel = selectedSubRow === "ckd2-rapid"; return (
                        <div className={`flex items-center py-[16px] overflow-clip border-solid cursor-pointer ${"[&>div]:border-neutral-90"}`} style={{ borderTop: "1.5px solid #D8D7D9", background: "transparent", opacity: 1 }} onClick={() => selectSubRow("ckd2-rapid")}>
                          <div className="flex items-center justify-center pl-[12px] pr-[8px] w-[7.63%] shrink-0">
                            <RadioButton checked={isSel} onChange={() => selectSubRow("ckd2-rapid")} size={16} />
                          </div>
                          <div className="flex items-center px-[10px] w-[17.94%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40 flex-1 min-w-0">Rapid</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[20.04%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40">eGFR</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[14.31%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40">≤ 60</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40">36</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40">3</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[17.18%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40">n=360</span>
                          </div>
                          <div className="flex items-center px-[10px] flex-1 border-l" />
                        </div>
                        ); })()}
                      </>
                    )}
                  </div>
                  ); })()}

                  {/* Set 1 */}
                  {(() => { const set1HasSel = ["set1-slow","set1-rapid"].includes(selectedSubRow ?? ""); const set1Open = expandedRows.has("set1"); return (
                  <div className={`flex flex-col shrink-0 ${set1HasSel || set1Open ? "border-solid" : "border-b border-neutral-60 border-solid"}`} style={{ background: set1HasSel ? "rgba(243,238,255,0.6)" : set1Open ? "#fbfbfc" : "white", ...(set1HasSel ? { borderTop: "1px solid rgba(58,17,216,0.6)", borderBottom: "1px solid rgba(58,17,216,0.6)" } : set1Open ? { borderTop: "1px solid var(--neutral-60)", borderBottom: "1px solid #ADADAD" } : {}) }}>
                    <div className={`flex items-stretch py-[6px] overflow-clip cursor-pointer`} onClick={() => toggleRow("set1")}>
                      <div className="flex items-center justify-center pl-[12px] pr-[8px] w-[7.63%] shrink-0">
                        <div className="w-[20px] h-[20px] flex items-center justify-center">
                          <AccordionItem open={expandedRows.has("set1")} />
                        </div>
                      </div>
                      <div className="flex items-center px-[10px] w-[17.94%] border-l border-neutral-90 shrink-0">
                        <span className="text-body4 text-neutral-40">Set 1</span>
                      </div>
                      <div className="flex items-center px-[10px] w-[20.04%] border-l border-neutral-90 shrink-0">
                        <span className="text-body4 text-neutral-40">HbA1c</span>
                      </div>
                      <div className="flex items-center px-[10px] w-[14.31%] border-l border-neutral-90 shrink-0" />
                      <div className="flex items-center px-[10px] w-[11.45%] border-l border-neutral-90 shrink-0" />
                      <div className="flex items-center px-[10px] w-[11.45%] border-l border-neutral-90 shrink-0" />
                      <div className="flex items-center px-[10px] w-[17.18%] border-l border-neutral-90 shrink-0" />
                      <div className="flex items-center px-[10px] flex-1 border-l border-neutral-90">
                        <span className="text-body4 text-neutral-40">2025/12/25 17:00:01</span>
                      </div>
                    </div>
                    {expandedRows.has("set1") && (
                      <>
                        {/* 서브 행 – Slow */}
                        {(() => { const isSel = selectedSubRow === "set1-slow"; return (
                        <div className={`flex items-center py-[16px] overflow-clip border-solid cursor-pointer ${"[&>div]:border-neutral-90"}`} style={{ borderTop: `1.5px solid ${set1HasSel ? "var(--tertiary-40)" : "#ADADAD"}`, background: "transparent", opacity: 1 }} onClick={() => selectSubRow("set1-slow")}>
                          <div className="flex items-center justify-center pl-[12px] pr-[8px] w-[7.63%] shrink-0">
                            <RadioButton checked={isSel} onChange={() => selectSubRow("set1-slow")} size={16} />
                          </div>
                          <div className="flex items-center px-[10px] w-[17.94%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40 flex-1 min-w-0">Slow</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[20.04%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40">HbA1c</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[14.31%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] w-[17.18%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] flex-1 border-l" />
                        </div>
                        ); })()}
                        {/* 서브 행 – Rapid */}
                        {(() => { const isSel = selectedSubRow === "set1-rapid"; return (
                        <div className={`flex items-center py-[16px] overflow-clip border-solid cursor-pointer ${"[&>div]:border-neutral-90"}`} style={{ borderTop: "1.5px solid #D8D7D9", background: "transparent", opacity: 1 }} onClick={() => selectSubRow("set1-rapid")}>
                          <div className="flex items-center justify-center pl-[12px] pr-[8px] w-[7.63%] shrink-0">
                            <RadioButton checked={isSel} onChange={() => selectSubRow("set1-rapid")} size={16} />
                          </div>
                          <div className="flex items-center px-[10px] w-[17.94%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40 flex-1 min-w-0">Rapid</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[20.04%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40">HbA1c</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[14.31%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] w-[17.18%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] flex-1 border-l" />
                        </div>
                        ); })()}
                      </>
                    )}
                  </div>
                  ); })()}

                  {/* Set 4 */}
                  {(() => { const set4HasSel = ["set4-slow","set4-rapid"].includes(selectedSubRow ?? ""); const set4Open = expandedRows.has("set4"); return (
                  <div className={`flex flex-col shrink-0 ${set4HasSel || set4Open ? "border-solid" : "border-b border-neutral-60 border-solid"}`} style={{ background: set4HasSel ? "rgba(243,238,255,0.6)" : set4Open ? "#fbfbfc" : "white", ...(set4HasSel ? { borderTop: "1px solid rgba(58,17,216,0.6)", borderBottom: "1px solid rgba(58,17,216,0.6)" } : set4Open ? { borderTop: "1px solid var(--neutral-60)", borderBottom: "1px solid #ADADAD" } : {}) }}>
                    <div className={`flex items-stretch py-[6px] overflow-clip cursor-pointer`} onClick={() => toggleRow("set4")}>
                      <div className="flex items-center justify-center pl-[12px] pr-[8px] w-[7.63%] shrink-0">
                        <div className="w-[20px] h-[20px] flex items-center justify-center">
                          <AccordionItem open={expandedRows.has("set4")} />
                        </div>
                      </div>
                      <div className="flex items-center px-[10px] w-[17.94%] border-l border-neutral-90 shrink-0">
                        <span className="text-body4 text-neutral-40">Set 4</span>
                      </div>
                      <div className="flex items-center px-[10px] w-[20.04%] border-l border-neutral-90 shrink-0">
                        <span className="text-body4 text-neutral-40">HbA1c</span>
                      </div>
                      <div className="flex items-center px-[10px] w-[14.31%] border-l border-neutral-90 shrink-0" />
                      <div className="flex items-center px-[10px] w-[11.45%] border-l border-neutral-90 shrink-0" />
                      <div className="flex items-center px-[10px] w-[11.45%] border-l border-neutral-90 shrink-0" />
                      <div className="flex items-center px-[10px] w-[17.18%] border-l border-neutral-90 shrink-0" />
                      <div className="flex items-center px-[10px] flex-1 border-l border-neutral-90">
                        <span className="text-body4 text-neutral-40">2025/12/25 17:00:01</span>
                      </div>
                    </div>
                    {expandedRows.has("set4") && (
                      <>
                        {/* 서브 행 – Slow */}
                        {(() => { const isSel = selectedSubRow === "set4-slow"; return (
                        <div className={`flex items-center py-[16px] overflow-clip border-solid cursor-pointer ${"[&>div]:border-neutral-90"}`} style={{ borderTop: `1.5px solid ${set4HasSel ? "var(--tertiary-40)" : "#ADADAD"}`, background: "transparent", opacity: 1 }} onClick={() => selectSubRow("set4-slow")}>
                          <div className="flex items-center justify-center pl-[12px] pr-[8px] w-[7.63%] shrink-0">
                            <RadioButton checked={isSel} onChange={() => selectSubRow("set4-slow")} size={16} />
                          </div>
                          <div className="flex items-center px-[10px] w-[17.94%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40 flex-1 min-w-0">Slow</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[20.04%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40">HbA1c</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[14.31%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] w-[17.18%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] flex-1 border-l" />
                        </div>
                        ); })()}
                        {/* 서브 행 – Rapid */}
                        {(() => { const isSel = selectedSubRow === "set4-rapid"; return (
                        <div className={`flex items-center py-[16px] overflow-clip border-solid cursor-pointer ${"[&>div]:border-neutral-90"}`} style={{ borderTop: "1.5px solid #D8D7D9", background: "transparent", opacity: 1 }} onClick={() => selectSubRow("set4-rapid")}>
                          <div className="flex items-center justify-center pl-[12px] pr-[8px] w-[7.63%] shrink-0">
                            <RadioButton checked={isSel} onChange={() => selectSubRow("set4-rapid")} size={16} />
                          </div>
                          <div className="flex items-center px-[10px] w-[17.94%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40 flex-1 min-w-0">Rapid</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[20.04%] border-l shrink-0">
                            <span className="text-body4 text-neutral-40">HbA1c</span>
                          </div>
                          <div className="flex items-center px-[10px] w-[14.31%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] w-[11.45%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] w-[17.18%] border-l shrink-0" />
                          <div className="flex items-center px-[10px] flex-1 border-l" />
                        </div>
                        ); })()}
                      </>
                    )}
                  </div>
                  ); })()}

                </div>
              </div>
            </div>


             {/* {하단 버튼/Bottom Buttons} */}
             {/* 하단 버튼 */}
            <div className="shrink-0 flex justify-end gap-[12px] pr-0.5">
              <button
                onClick={() => router.push("/drd/default-setting")}
                className="btn-tsi btn-tsi-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => { const d = subRowDataMap[selectedSubRow]; if (d) setHighRiskSubgroupData({ selectedSubRow, ...d }); setCompleted("high-risk-subgroup", true); router.push("/drd/default-setting"); }}
                className="btn-tsi btn-tsi-primary"
              >
                Confirm
              </button>
            </div>

          </div>
        </div>
      </div>
      {showSubgroupModal && (
        <div
          className="modal-backdrop"
          onClick={() => setShowSubgroupModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="modal-panel gap-9"
            style={{ paddingTop: "20px" }}
          >
            {/* 글래스 배경 */}
            <div aria-hidden="true" className="rounded-[20px] absolute inset-0 pointer-events-none">
              <div className="rounded-[20px] absolute inset-0" style={{ background: "rgba(255,255,255,0.6)", mixBlendMode: "color-dodge" }} />
              <div className="rounded-[20px] absolute inset-0" style={{ background: "rgba(255,255,255,0.88)" }} />
              <div className="rounded-[20px] absolute inset-0" style={{ background: "rgba(0,0,0,0.04)", mixBlendMode: "hard-light" }} />
            </div>

            {/* 콘텐츠 */}
            <div className="relative z-[1] flex flex-col gap-6">
              <p style={{ fontFamily: "Inter", fontWeight: 600, fontSize: 19, color: "#250d0dff", letterSpacing: "-0.54px", lineHeight: 1.2, margin: 0 }}>Go to Create Subgroup</p>
              <p className="text-body4m" style={{ color: "var(--text-primary)", margin: 0 }}>
                If you create a new subgroup, you will leave this page and all unsaved data will be lost. Do you want to continue?
              </p>
            </div>

            {/* 버튼 */}
            <div className="relative z-[1] flex gap-2 justify-center">
              <button type="button" onClick={() => setShowSubgroupModal(false)} className="modal-btn">
                Cancel
              </button>
              <button type="button" onClick={() => { setShowSubgroupModal(false); router.push("/tsi"); }} className="modal-btn">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}