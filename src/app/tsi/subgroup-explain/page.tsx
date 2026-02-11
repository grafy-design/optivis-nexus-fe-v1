"use client";

import { useState } from "react";
import Image from "next/image";
import { AppLayout } from "@/components/layout/AppLayout";

/**
 * TSI Step 5: Subgroup Explain
 * 구조: 상위 배경 카드 2개 나란히
 * - 왼쪽 상위: explain-left.png → 안에 파란색 그래프 카드 + 흰색 테이블 카드
 * - 오른쪽 상위: explain-right.png → 안에 파란색 그래프 카드 + 설명 / 흰색 카드 + 파란색 카드(흰색 그래프 3개) + 설명
 */

const FEATURE_TABLE_DATA = [
  {
    rank: 1,
    featureName: "ADRECOG",
    varianceReduction: 45.2,
    relativeContribution: 100.0,
    cutoff: 5.7,
  },
  {
    rank: 2,
    featureName: "ADDRECALL",
    varianceReduction: 31.8,
    relativeContribution: 70.3,
    cutoff: 4.85,
  },
  {
    rank: 3,
    featureName: "CDJUD",
    varianceReduction: 4.5,
    relativeContribution: 9.9,
    cutoff: 1.5,
  },
  {
    rank: 4,
    featureName: "ADCANCEL",
    varianceReduction: 1.2,
    relativeContribution: 2.6,
    cutoff: 30,
  },
];

const FEATURE_LIST = [
  "ADRECOG",
  "ADDRECALL",
  "CDJUD",
  "ADCANCEL",
  "ADNAMING",
  "ADRECALL",
  "DIAGNS_BL",
  "TRIGLY",
  "MMTOTSCORE_BL",
  "BPSYSTPO",
];

export default function TSISubgroupExplainPage() {
  const [selectedFeature, setSelectedFeature] = useState("ADRECALL");

  return (
    <AppLayout headerType="tsi">
      <div className="w-full flex flex-col items-center">
        {/* 타이틀: 카드 밖 */}
        <div className="w-full flex justify-center mb-2 max-w-full">
          <div className="w-[1772px] max-w-full flex-shrink-0 mx-auto">
            <div className="flex flex-col gap-1 flex-shrink-0 items-start">
              <div className="text-title text-neutral-5 text-left mb-2">
                Subgroup Explain
              </div>
              <p className="text-body2m text-neutral-50 text-left">
                Drug Responsiveness
              </p>
            </div>
          </div>
        </div>

        {/* 메인: 상위 배경 카드 2개 나란히 */}
        <div className="w-[1772px] flex-shrink-0 mx-auto flex flex-row flex-nowrap gap-2 items-stretch">
          {/* 왼쪽 상위 배경 카드 */}
          <div
            className="w-[565px] h-[875px] flex-shrink-0 rounded-[36px] overflow-hidden flex flex-col p-3 bg-white"
            style={{
              backgroundImage: "url(/assets/tsi/explain-left-bg.png)",
              backgroundSize: "100% 100%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
            }}
          >
            {/* 파란색 그래프 카드: Expected Therapeutic Gain */}
            <div
              className="w-full h-[549px] flex-shrink-0 rounded-[24px] overflow-hidden bg-primary-15 flex flex-col p-5 mb-4"
              style={{
                boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
              }}
            >
              <h2 className="text-body2 text-white mb-4 flex-shrink-0">
                Expected Therapeutic Gain
              </h2>
              {/* 그래프 영역 */}
              <div className="h-[452px] flex-shrink-0 mt-auto bg-white rounded-[16px] flex items-center justify-center">
                <span className="text-neutral-50 text-sm">
                  Chart placeholder
                </span>
              </div>
            </div>

            {/* 흰색 테이블 카드 */}
            <div
              className="w-full flex-1 min-h-0 rounded-[24px] overflow-hidden bg-white flex flex-col"
              style={{
                boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
              }}
            >
              {/* 테이블 전체 컨테이너 */}
              <div className="flex-1 min-h-0 flex flex-col px-4">
                {/* 테이블 헤더 */}
                <div className="flex-shrink-0 h-[64px] border-b border-neutral-80 flex items-center gap-4">
                  <div className="w-[60px] text-body4 text-neutral-30">
                    Rank
                  </div>
                  <div className="w-[140px] text-body4 text-neutral-30">
                    Feature name
                  </div>
                  <div className="w-[140px] text-body4 text-neutral-30 leading-tight">
                    Max Variance
                    <br />
                    Reduction(△▽)
                  </div>
                  <div className="w-[100px] text-body4 text-neutral-30">
                    Contribution
                  </div>
                  <div className="w-[140px] text-body4 text-neutral-30 leading-tight">
                    Cutoff
                    <br />
                    (Auto-derived)
                  </div>
                </div>

                {/* 테이블 바디 */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                  {FEATURE_TABLE_DATA.map((row) => (
                    <div
                      key={row.rank}
                      className="flex h-[52px] border-b border-neutral-80 items-center gap-4"
                    >
                      <div className="w-[60px] text-body4 text-neutral-40">
                        {row.rank}
                      </div>
                      <div className="w-[140px] text-body4 text-neutral-40">
                        {row.featureName}
                      </div>
                      <div className="w-[140px] text-body4 text-neutral-40">
                        {row.varianceReduction}
                      </div>
                      <div className="w-[100px] text-body4 text-neutral-40">
                        {row.relativeContribution.toFixed(2)}%
                      </div>
                      <div className="w-[140px] text-body4 text-neutral-40">
                        {row.cutoff}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽 상위 배경 카드 */}
          <div
            className="w-[1195px] h-[1075px] flex-shrink-0 rounded-[36px] overflow-hidden flex flex-col p-3 bg-white"
            style={{
              backgroundImage: "url(/assets/tsi/explain-right-bg.png)",
              backgroundSize: "100% 100%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
            }}
          >
            {/* 상단 행: 파란색 그래프 카드 + 설명 텍스트 */}
            <div className="flex gap-4 mb-[12px] flex-shrink-0">
              {/* 파란색 그래프 카드: Baseline driver Top 10 (전체 너비) */}
              <div
                className="flex-1 h-[423px] flex-shrink-0 rounded-[24px] overflow-hidden bg-primary-15 flex flex-row p-4 gap-5"
                style={{
                  boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
                }}
              >
                {/* 그래프 영역 */}
                <div className="w-[659px] flex-shrink-0 flex flex-col">
                  <h2 className="text-body2 text-white mb-4 flex-shrink-0">
                    Baseline driver Top 10
                  </h2>
                  <div className="w-full h-[322px] flex-shrink-0 mt-auto bg-white rounded-[16px] flex items-center justify-center">
                    <span className="text-neutral-50 text-sm">
                      Chart placeholder
                    </span>
                  </div>
                </div>

                {/* 설명 텍스트 */}
                <div className="flex-1 min-w-0 flex flex-col justify-end">
                  <ul className="flex flex-col gap-3 text-white list-disc pl-4">
                    <li className="break-words">
                      <span className="text-body1m">X-axis (SHAP value):</span>
                      <br />
                      <span className="text-body4m">
                        Represents the impact on the model's predicted value. A
                        value further to the right of 0 indicates a factor that
                        increases the output (in this case, ΔADAS-Cog).
                      </span>
                    </li>
                    <li className="break-words">
                      <span className="text-body1m">
                        Color (Feature Value):
                      </span>
                      <br />
                      <span className="text-body4m">
                        Represents the magnitude (size) of the value for that
                        specific variable. High value, Light Blue. Low value.
                      </span>
                    </li>
                    <li className="break-words">
                      <span className="text-body1m">Dot:</span>
                      <br />
                      <span className="text-body4m">
                        Each dot represents one patient. A thicker (denser)
                        vertical accumulation of dots indicates a higher
                        concentration of data points, representing higher
                        frequency and reliability in that specific range.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 하단 행: 흰색 카드 + 파란색 카드(흰색 그래프 3개 + 설명) */}
            <div className="flex gap-[12px] flex-1 min-h-0">
              {/* 왼쪽 흰색 카드: Feature 목록 */}
              <div
                className="w-[200px] h-[616px] flex-shrink-0 rounded-[24px] overflow-hidden bg-white flex flex-col py-3"
                style={{
                  boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div className="flex-1 min-h-0 overflow-y-auto">
                  {FEATURE_LIST.map((feature, index) => (
                    <button
                      key={feature}
                      onClick={() => setSelectedFeature(feature)}
                      className={`w-full flex items-center gap-[10px] self-stretch h-[59px] px-[12px] py-[18px] text-body4 transition-colors ${
                        index < FEATURE_LIST.length - 1
                          ? "border-b border-neutral-90"
                          : ""
                      } ${
                        selectedFeature === feature
                          ? "bg-primary-15 text-white"
                          : "text-neutral-0 hover:bg-neutral-95"
                      }`}
                    >
                      {feature}
                    </button>
                  ))}
                </div>
              </div>

              {/* 파란색 카드: 흰색 그래프 카드 3개 + 설명 텍스트 (나머지 전체 너비) */}
              <div
                className="flex-1 h-[616px] flex-shrink-0 rounded-[24px] overflow-hidden bg-primary-15 flex flex-row p-4 gap-4"
                style={{
                  boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
                }}
              >
                {/* 그래프 카드 3개 세로 배치 */}
                <div className="flex flex-col gap-4 flex-1 min-h-0">
                  {/* 그래프 카드 1: Baseline Distribution */}
                  <div className="w-[442px] flex-1 min-h-0 rounded-[16px] overflow-hidden bg-white flex flex-col p-4">
                    <h3 className="text-body4 text-neutral-40 mb-3">
                      Baseline Distribution of {selectedFeature} (Baseline)
                    </h3>
                    <div className="flex-1 min-h-0 bg-white rounded flex items-center justify-center">
                      <span className="text-neutral-50 text-xs">
                        Chart placeholder
                      </span>
                    </div>
                  </div>

                  {/* 그래프 카드 2: ADAS Progression Slope */}
                  <div className="w-[442px] flex-1 min-h-0 rounded-[16px] overflow-hidden bg-white flex flex-col p-4">
                    <h3 className="text-body4 text-neutral-40 mb-3">
                      ADAS Progression Slope vs. {selectedFeature} (Baseline)
                    </h3>
                    <div className="flex-1 min-h-0 bg-white rounded flex items-center justify-center">
                      <span className="text-neutral-50 text-xs">
                        Chart placeholder
                      </span>
                    </div>
                  </div>

                  {/* 그래프 카드 3: Subgroup Proportion */}
                  <div className="w-[442px] flex-1 min-h-0 rounded-[16px] overflow-hidden bg-white flex flex-col p-4">
                    <h3 className="text-body4 text-neutral-40 mb-3">
                      Subgroup Proportion by {selectedFeature} (Baseline)
                    </h3>
                    <div className="flex-1 min-h-0 bg-white rounded flex items-center justify-center">
                      <span className="text-neutral-50 text-xs">
                        Chart placeholder
                      </span>
                    </div>
                  </div>
                </div>

                {/* 오른쪽 설명 텍스트 */}
                <div className="flex-1 min-w-0 flex flex-col justify-start pt-4">
                  <ul className="flex flex-col gap-3 text-white list-disc pl-4">
                    <li className="break-words">
                      <span className="text-body1m">
                        ADAS Word Delay Recall:
                      </span>
                      <br />
                      <span className="text-body4m">
                        Higher scores indicate worse cognitive performance
                        (greater disease severity).
                      </span>
                    </li>
                    <li className="break-words">
                      <span className="text-body1m">
                        Early Detection Indicator:
                      </span>
                      <br />
                      <span className="text-body4m">
                        Delayed word recall is used as a highly sensitive
                        indicator for the early detection of the disease, as it
                        is one of the first symptoms to appear in patients with
                        Alzheimer's disease or Mild Cognitive Impairment (MCI).
                      </span>
                    </li>
                    <li className="break-words">
                      <span className="text-body1m">Core Assessment Goal:</span>
                      <br />
                      <span className="text-body4m">
                        It is a key assessment item that captures memory
                        decline, particularly in the early stages of dementia,
                        by measuring how well one can remember 10 recently
                        learned words after a short period of time.
                      </span>
                    </li>
                  </ul>
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
            className="inline-flex items-center justify-center w-[179px] h-[48px] rounded-[100px] text-body3 text-neutral-30 cursor-pointer hover:opacity-90 transition-opacity border-0 shrink-0 bg-no-repeat bg-center bg-cover"
            style={{ backgroundImage: "url(/assets/tsi/btn.png)" }}
            aria-label="View Report"
          >
            View Report
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
