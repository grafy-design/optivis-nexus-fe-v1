"use client";

import { AppLayout } from "@/components/layout/AppLayout";

/**
 * TSI (Target Subgroup Identification) Report 페이지.
 * Step 6: 리포트 페이지
 */
export default function TSIReportPage() {
  return (
    <AppLayout headerType="tsi">
      <div className="w-full flex flex-col items-center min-w-0">
        {/* 타이틀: 카드 밖 */}
        <div className="w-full flex justify-center mb-[42px] max-w-full">
          <div className="w-[1772px] max-w-full flex-shrink-0 mx-auto">
            <div className="flex flex-col gap-1 flex-shrink-0 items-start">
              <div className="text-title text-neutral-5 text-left mb-2">
                Subgroup Analysis Report
              </div>
              <p className="text-body2m text-neutral-50 text-left">
                Analysis Summary
              </p>
            </div>
          </div>
        </div>

        {/* 리포트 배경 카드 */}
        <div
          className="w-[1772px] max-w-[calc(100vw-100px)] h-[2244px] flex-shrink-0 rounded-[36px] overflow-hidden flex flex-col bg-white py-[26px] px-[12px]"
          style={{
            backgroundImage: "url(/assets/tsi/report-bg.png)",
            backgroundSize: "100% 100%",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* 리포트 내용 영역 */}
          <div className="flex-1 flex flex-col">
            {/* 첫 번째 섹션: Stratification Strategy Comparison (150px y부터, 1748px 너비, 962px 높이) */}
            <div className="flex-shrink-0 w-[1748px] max-w-full h-[962px] mx-auto mb-[100px] min-w-0">
              <div className="w-full h-full flex flex-col">
                {/* 섹션 제목 */}
                <h2 className="ml-[28px] text-h2 text-primary-15 mb-[40px] flex-shrink-0">
                  Stratification Strategy Comparison
                </h2>

                {/* 두 개의 파란색 카드 나란히 */}
                <div className="w-full flex-shrink-0 flex flex-row gap-4">
                  {/* 왼쪽 카드: Executive Summary & Stratification Strategy */}
                  <div className="flex-1 h-[880px] rounded-[24px] bg-primary-15 overflow-hidden flex flex-col p-5">
                    {/* Model Based 라벨 */}
                    <div className="mb-4 flex-shrink-0">
                      <span className="flex items-center justify-center gap-2 w-[104px] h-[24px] rounded-md bg-orange-500 text-body5 text-white font-medium ">
                        Model Based
                      </span>
                    </div>
                    <h4 className="text-h4 text-white mb-4 flex-shrink-0">
                      Executive Summary & Stratification Strategy
                    </h4>
                    <p className="text-body3m text-white/90 mb-6 flex-shrink-0 mt-auto">
                      Patients were initially stratified based on the model's
                      predicted progression effect into three distinct
                      categories: Rapid (Top 20%), Moderate (20% ~ 70%), and
                      Slow (Bottom 30%). To enhance clinical interpretability,
                      we utilized the CART algorithm to translate complex model
                      parameters into simplified, feature-based decision rules.
                    </p>
                    {/* 차트 홀더 영역: 타이틀, 차트, 표 포함 */}
                    <div className="w-full h-[656px] bg-white rounded-[16px] flex flex-col p-5 mt-auto flex-shrink-0">
                      <h4 className="text-body1 text-neutral-5 mb-4 flex-shrink-0">
                        Disease Progression by Subgroup
                      </h4>
                      {/* 차트 영역 */}
                      <div className="w-full flex-1 min-h-0 mb-4 flex items-center justify-center">
                        <span className="text-body4 text-neutral-50">
                          Chart placeholder
                        </span>
                      </div>
                      {/* 표/범례 영역 */}
                      <div className="w-full flex-shrink-0">
                        <span className="text-body4 text-neutral-50">
                          Table/Legend placeholder
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 오른쪽 카드: Feature-Based Decision Rules */}
                  <div className="flex-1 h-[880px] rounded-[24px] bg-primary-15 overflow-hidden flex flex-col p-5">
                    {/* Feature Based 라벨 */}
                    <div className="mb-4 flex-shrink-0">
                      <span className="flex items-center justify-center gap-2 w-[104px] h-[24px] rounded-md bg-orange-500 text-body5 text-white font-medium ">
                        Feature Based
                      </span>
                    </div>
                    <h4 className="text-h4 text-white mb-4 flex-shrink-0">
                      Feature-Based Decision Rules (CART-derived)
                    </h4>
                    <p className="text-body3m text-white/90 mb-6 flex-shrink-0 mt-auto">
                      The variance decomposition analysis identified key
                      baseline drivers and their respective clinical thresholds
                      that define each subgroup: High Risk (Rapid): Patients
                      meeting both ADRECOG {">"} 5.7 and ADRECALL {">"} 4.85.
                      Low Risk (Slow): Patients meeting both ADRECOG {"\u2264"}{" "}
                      5.7 and CDJUD {"\u2264"} 1.5. Moderate: All patients not
                      meeting the specific High or Low-risk criteria.
                    </p>
                    {/* 차트 홀더 영역: 타이틀, 차트, 표 포함 */}
                    <div className="w-full h-[656px] bg-white rounded-[16px] flex flex-col p-5 mt-auto flex-shrink-0">
                      <h4 className="text-body1 text-neutral-5 mb-4 flex-shrink-0">
                        Disease Progression by Subgroup
                      </h4>
                      {/* 차트 영역 */}
                      <div className="w-full flex-1 min-h-0 mb-4 flex items-center justify-center">
                        <span className="text-body4 text-neutral-50">
                          Chart placeholder
                        </span>
                      </div>
                      {/* 표/범례 영역 */}
                      <div className="w-full flex-shrink-0">
                        <span className="text-body4 text-neutral-50">
                          Table/Legend placeholder
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 두 번째 섹션: Stratification Strategy Comparison */}
            <div className="flex-shrink-0 w-[1748px] max-w-full mx-auto mb-[100px] min-w-0">
              <div className="w-full flex flex-col">
                {/* 섹션 제목 */}
                <h2 className="ml-[28px] text-h2 text-primary-15 mb-[40px] flex-shrink-0">
                  Stratification Strategy Comparison
                </h2>
                <div className="w-[1748px] h-[562px] rounded-[24px] bg-white border border-neutral-90 p-4 flex flex-col">
                  {/* 텍스트 영역 */}
                  <div className="w-[850px] flex-shrink-0">
                    <h4 className="text-h4 text-neutral-5 mb-4">
                      Prognostic Trajectory & Validation
                    </h4>
                    <p className="text-body3m text-neutral-40">
                      The longitudinal trajectories for the feature-based
                      subgroups show a high degree of consistency with the
                      original model-based classifications, validating the
                      reliability of these simplified rules. This rule-based
                      approach captures 34.0% of the total variance (IV= 0.248),
                      effectively classifying the accelerated cognitive decline
                      (ADRAS-Cog observed in the High Risk group starting from
                      Month 12.
                    </p>
                  </div>

                  {/* 두 개의 차트 섹션 */}
                  <div className="w-full flex gap-4 mt-auto flex-shrink-0">
                    {/* 첫 번째 차트 섹션 */}
                    <div className="flex flex-col items-start gap-[10px] w-[850px] h-[378px] p-[6px] flex-shrink-0">
                      <div className="w-full flex-1 bg-neutral-95 rounded-[16px] flex items-center justify-center">
                        <span className="text-body4 text-neutral-50">
                          Chart placeholder
                        </span>
                      </div>
                    </div>
                    {/* 두 번째 차트 섹션 */}
                    <div className="flex flex-col items-start gap-[10px] w-[850px] h-[378px] p-[6px] flex-shrink-0">
                      <div className="w-full flex-1 bg-neutral-95 rounded-[16px] flex items-center justify-center">
                        <span className="text-body4 text-neutral-50">
                          Chart placeholder
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 세 번째 섹션: Risk & Response Assessment */}
            <div className="flex-shrink-0 w-[1748px] max-w-full mx-auto min-w-0">
              <div className="w-full flex flex-col">
                {/* 섹션 제목 */}
                <h2 className="ml-[28px] text-h2 text-primary-15 mb-[40px] flex-shrink-0">
                  Risk & Response Assessment
                </h2>
                <div className="w-[1748px] h-[322px] rounded-[24px] bg-white border border-neutral-90 p-4 flex gap-4">
                  {/* 왼쪽: 타이틀 영역 */}
                  <div className="flex flex-col items-start gap-[28px] w-[414px] h-[290px] flex-shrink-0">
                    <div className="flex flex-col items-start gap-[24px] w-full">
                      <h3 className="text-h4 text-neutral-5">
                        Risk & Response Assessment
                      </h3>
                      <p className="text-body3m text-neutral-40">
                        Risk & Response Assessment (rHTE & Safety)
                        <br /> Drug Response (rHTE): Forest plot analysis
                        indicates that the High Risk (Rapid) subgroup exhibits
                        the most pronounced therapeutic benefit compared to the
                        placebo.
                        <br />
                        <br />
                        Safety Assessment: Consistent safety profiles were
                        observed across all subgroups, supporting the clinical
                        utility of this classification system for targeted
                        patient management.
                      </p>
                    </div>
                  </div>

                  {/* 오른쪽: 테이블 구조 (Set 2개, 각 Set마다 4개 컬럼) */}
                  <div className="flex-1 flex flex-col">
                    {/* Set 1 */}
                    <div className="flex border-b border-neutral-80 min-h-0">
                      {/* 컬럼 1: Set 라벨 + Group 라벨 */}
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
                            Set 1
                          </span>
                        </div>
                        <div className="pl-2 pr-1 h-7 flex items-center text-body4m text-neutral-30 flex-shrink-0">
                          Group 1
                        </div>
                        <div className="pl-2 pr-1 h-7 flex items-center text-body4m text-neutral-30 flex-shrink-0">
                          Group 2
                        </div>
                        <div className="pl-2 pr-1 h-7 flex items-center text-body4m text-neutral-30 flex-shrink-0">
                          Group 3
                        </div>
                      </div>
                      {/* 컬럼 2: Disease progression */}
                      <div className="flex-1 min-w-0 flex flex-col py-2 pl-2 pr-4 relative border-r border-neutral-80">
                        {/* Set 행과 동일: h-[22px] + mb-1 */}
                        <div
                          className="h-[22px] flex-shrink-0 mb-1"
                          aria-hidden
                        />
                        {/* 눈금선 */}
                        <div
                          className="absolute inset-0 flex justify-between pointer-events-none py-2 pl-2 pr-4"
                          aria-hidden
                        >
                          {Array.from({ length: 9 }).map((_, i) => (
                            <span
                              key={i}
                              className="w-px h-full flex-shrink-0"
                              style={{ backgroundColor: "#F8F8FC" }}
                            />
                          ))}
                        </div>
                        {/* Group 차트들 */}
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">
                                Chart
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">
                                Chart
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">
                                Chart
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* 컬럼 3: Drug response */}
                      <div className="flex-1 min-w-0 flex flex-col py-2 pl-2 pr-4 relative border-r border-neutral-80">
                        {/* Set 행과 동일: h-[22px] + mb-1 */}
                        <div
                          className="h-[22px] flex-shrink-0 mb-1"
                          aria-hidden
                        />
                        {/* 눈금선 */}
                        <div
                          className="absolute inset-0 flex justify-between pointer-events-none py-2 pl-2 pr-4"
                          aria-hidden
                        >
                          {Array.from({ length: 9 }).map((_, i) => (
                            <span
                              key={i}
                              className="w-px h-full flex-shrink-0"
                              style={{ backgroundColor: "#F8F8FC" }}
                            />
                          ))}
                        </div>
                        {/* Group 차트들 */}
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">
                                Chart
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">
                                Chart
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">
                                Chart
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* 컬럼 4: Safety */}
                      <div className="flex-1 min-w-0 flex flex-col py-2 pl-2 pr-4 relative">
                        {/* Set 행과 동일: h-[22px] + mb-1 */}
                        <div
                          className="h-[22px] flex-shrink-0 mb-1"
                          aria-hidden
                        />
                        {/* 눈금선 */}
                        <div
                          className="absolute inset-0 flex justify-between pointer-events-none py-2 pl-2 pr-4"
                          aria-hidden
                        >
                          {Array.from({ length: 9 }).map((_, i) => (
                            <span
                              key={i}
                              className="w-px h-full flex-shrink-0"
                              style={{ backgroundColor: "#F8F8FC" }}
                            />
                          ))}
                        </div>
                        {/* Group 차트들 */}
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">
                                Chart
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">
                                Chart
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">
                                Chart
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Set 2 */}
                    <div className="flex border-b border-neutral-80 min-h-0">
                      {/* 컬럼 1: Set 라벨 + Group 라벨 */}
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
                            Set 2
                          </span>
                        </div>
                        <div className="pl-2 pr-1 h-7 flex items-center text-body4m text-neutral-30 flex-shrink-0">
                          Group 1
                        </div>
                        <div className="pl-2 pr-1 h-7 flex items-center text-body4m text-neutral-30 flex-shrink-0">
                          Group 2
                        </div>
                        <div className="pl-2 pr-1 h-7 flex items-center text-body4m text-neutral-30 flex-shrink-0">
                          Group 3
                        </div>
                      </div>
                      {/* 컬럼 2: Disease progression */}
                      <div className="flex-1 min-w-0 flex flex-col py-2 pl-2 pr-4 relative border-r border-neutral-80">
                        {/* Set 행과 동일: h-[22px] + mb-1 */}
                        <div
                          className="h-[22px] flex-shrink-0 mb-1"
                          aria-hidden
                        />
                        {/* 눈금선 */}
                        <div
                          className="absolute inset-0 flex justify-between pointer-events-none py-2 pl-2 pr-4"
                          aria-hidden
                        >
                          {Array.from({ length: 9 }).map((_, i) => (
                            <span
                              key={i}
                              className="w-px h-full flex-shrink-0"
                              style={{ backgroundColor: "#F8F8FC" }}
                            />
                          ))}
                        </div>
                        {/* Group 차트들 */}
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">
                                Chart
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">
                                Chart
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">
                                Chart
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* 컬럼 3: Drug response */}
                      <div className="flex-1 min-w-0 flex flex-col py-2 pl-2 pr-4 relative border-r border-neutral-80">
                        {/* Set 행과 동일: h-[22px] + mb-1 */}
                        <div
                          className="h-[22px] flex-shrink-0 mb-1"
                          aria-hidden
                        />
                        {/* 눈금선 */}
                        <div
                          className="absolute inset-0 flex justify-between pointer-events-none py-2 pl-2 pr-4"
                          aria-hidden
                        >
                          {Array.from({ length: 9 }).map((_, i) => (
                            <span
                              key={i}
                              className="w-px h-full flex-shrink-0"
                              style={{ backgroundColor: "#F8F8FC" }}
                            />
                          ))}
                        </div>
                        {/* Group 차트들 */}
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">
                                Chart
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">
                                Chart
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">
                                Chart
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* 컬럼 4: Safety */}
                      <div className="flex-1 min-w-0 flex flex-col py-2 pl-2 pr-4 relative">
                        {/* Set 행과 동일: h-[22px] + mb-1 */}
                        <div
                          className="h-[22px] flex-shrink-0 mb-1"
                          aria-hidden
                        />
                        {/* 눈금선 */}
                        <div
                          className="absolute inset-0 flex justify-between pointer-events-none py-2 pl-2 pr-4"
                          aria-hidden
                        >
                          {Array.from({ length: 9 }).map((_, i) => (
                            <span
                              key={i}
                              className="w-px h-full flex-shrink-0"
                              style={{ backgroundColor: "#F8F8FC" }}
                            />
                          ))}
                        </div>
                        {/* Group 차트들 */}
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">
                                Chart
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">
                                Chart
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">
                                Chart
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* X축 행: 왼쪽 빈 칸 + 각 컬럼마다 축과 타이틀 */}
                    <div className="flex flex-shrink-0">
                      {/* 컬럼 1: 빈 공간 */}
                      <div
                        className="w-[112px] flex-shrink-0 border-r border-neutral-80"
                        aria-hidden
                      />
                      {/* 컬럼 2: Disease progression */}
                      <div className="flex-1 min-w-0 pt-0 pb-1 pl-2 flex flex-col border-r border-neutral-80">
                        {/* 축선 + 짧은 눈금 */}
                        <div className="w-full flex flex-col px-2 min-w-0">
                          <div
                            className="w-full border-b"
                            style={{
                              borderColor: "var(--neutral-60, #929090)",
                            }}
                            aria-hidden
                          />
                          <div className="w-full flex justify-between px-0 mt-0">
                            {Array.from({ length: 9 }).map((_, i) => (
                              <span
                                key={i}
                                className="w-px h-1 shrink-0"
                                style={{
                                  backgroundColor: "var(--neutral-60, #929090)",
                                }}
                                aria-hidden
                              />
                            ))}
                          </div>
                        </div>
                        {/* 타이틀 */}
                        <div className="text-body4m text-neutral-30 mt-0.5 w-full text-center px-2">
                          Disease progression
                        </div>
                      </div>
                      {/* 컬럼 3: Drug response */}
                      <div className="flex-1 min-w-0 pt-0 pb-1 pl-2 flex flex-col border-r border-neutral-80">
                        {/* 축선 + 짧은 눈금 */}
                        <div className="w-full flex flex-col px-2 min-w-0">
                          <div
                            className="w-full border-b"
                            style={{
                              borderColor: "var(--neutral-60, #929090)",
                            }}
                            aria-hidden
                          />
                          <div className="w-full flex justify-between px-0 mt-0">
                            {Array.from({ length: 9 }).map((_, i) => (
                              <span
                                key={i}
                                className="w-px h-1 shrink-0"
                                style={{
                                  backgroundColor: "var(--neutral-60, #929090)",
                                }}
                                aria-hidden
                              />
                            ))}
                          </div>
                        </div>
                        {/* 타이틀 */}
                        <div className="text-body4m text-neutral-30 mt-0.5 w-full text-center px-2">
                          Drug response
                        </div>
                      </div>
                      {/* 컬럼 4: Safety */}
                      <div className="flex-1 min-w-0 pt-0 pb-1 pl-2 flex flex-col">
                        {/* 축선 + 짧은 눈금 */}
                        <div className="w-full flex flex-col px-2 min-w-0">
                          <div
                            className="w-full border-b"
                            style={{
                              borderColor: "var(--neutral-60, #929090)",
                            }}
                            aria-hidden
                          />
                          <div className="w-full flex justify-between px-0 mt-0">
                            {Array.from({ length: 9 }).map((_, i) => (
                              <span
                                key={i}
                                className="w-px h-1 shrink-0"
                                style={{
                                  backgroundColor: "var(--neutral-60, #929090)",
                                }}
                                aria-hidden
                              />
                            ))}
                          </div>
                        </div>
                        {/* 타이틀 */}
                        <div className="text-body4m text-neutral-30 mt-0.5 w-full text-center px-2">
                          Safety
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
