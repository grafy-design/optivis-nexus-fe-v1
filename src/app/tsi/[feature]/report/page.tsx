import { AppLayout } from "@/components/layout/AppLayout";
import { MultiLineWithErrorBar, type ErrorBarGroup } from "@/components/charts/MultiLineWithErrorBar";
import { getReportByFeature } from "@/services/subgroupService";

/**
 * TSI (Target Subgroup Identification) Report 페이지.
 * Step 6: 리포트 페이지
 */

type TSIReportPageProps = {
  params: Promise<{
    feature: string;
  }>;
};

type SubgroupLegendRow = {
  subgroupName: string;
  riskLabel: string;
  cutoff: string;
};

const RISK_SERIES_LABELS = ["Low Risk", "Mid Risk", "High Risk"];
const RISK_SERIES_COLORS = ["#A6A3E3", "#6E6AA7", "#272354"];

const MODEL_BASED_CHART_MOCK: ErrorBarGroup[] = [
  [
    [0, -2.4, 0.15],
    [3, -2.1, 0.12],
    [6, -2.5, 0.14],
    [9, -2.1, 0.18],
    [12, -2.7, 0.2],
    [15, -1.8, 0.24],
    [18, -1.3, 0.5],
    [21, -0.9, 0.68],
    [24, -1.1, 0.7],
    [27, -0.9, 0.8],
  ],
  [
    [0, -2.4, 0.1],
    [3, -2.0, 0.14],
    [6, -1.4, 0.2],
    [9, 0.2, 0.26],
    [12, 1.5, 0.36],
    [15, 2.5, 0.62],
    [18, 3.5, 0.84],
    [21, 4.3, 0.9],
    [24, 5.0, 1.1],
    [27, 4.8, 1.1],
  ],
  [
    [0, -2.4, 0.08],
    [3, -2.0, 0.1],
    [6, -0.7, 0.2],
    [9, 3.8, 0.74],
    [12, 6.4, 1.0],
    [15, 8.3, 1.2],
    [18, 9.2, 1.6],
    [21, 10.5, 2.1],
    [24, 11.7, 2.8],
    [27, 11.2, 3.8],
  ],
];

const SUBGROUP_LEGEND_ROWS: SubgroupLegendRow[] = [
  { subgroupName: "Subgroup No.1", riskLabel: "Rapid", cutoff: "20%" },
  { subgroupName: "Subgroup No.2", riskLabel: "Moderate", cutoff: "20~70%" },
  { subgroupName: "Subgroup No.3", riskLabel: "Slow", cutoff: "70%" },
];

const FEATURE_BASED_RISK_SERIES_LABELS = ["Low Risk", "Mid Risk", "High Risk"];
const FEATURE_BASED_RISK_SERIES_COLORS = ["#26225B", "#EF6A00", "#4327E6"];

const FEATURE_BASED_CHART_MOCK: ErrorBarGroup[] = [
  [
    [0, 0.0, 0.05],
    [3, -2.1, 0.08],
    [6, -0.3, 0.08],
    [9, -0.7, 0.08],
    [12, -0.4, 0.1],
    [15, 0.5, 0.12],
    [18, 0.8, 0.12],
    [22, 1.4, 0.35],
    [28, 1.4, 0.35],
  ],
  [
    [0, 0.0, 0.05],
    [3, -0.2, 0.08],
    [6, 0.8, 0.08],
    [9, 2.0, 0.1],
    [12, 3.9, 0.12],
    [15, 4.5, 0.12],
    [18, 4.9, 0.42],
    [22, 6.1, 0.62],
    [28, 6.8, 0.85],
  ],
  [
    [0, 0.0, 0.05],
    [3, 0.7, 0.45],
    [6, 2.4, 0.35],
    [9, 4.8, 0.55],
    [12, 9.2, 0.72],
    [15, 10.3, 1.05],
    [18, 11.1, 1.35],
    [22, 11.8, 1.85],
    [28, 11.6, 3.1],
  ],
];

const FEATURE_BASED_RULE_ROWS: SubgroupLegendRow[] = [
  {
    subgroupName: "Subgroup No.1",
    riskLabel: "Rapid",
    cutoff: "ADRECOG > 5.7 and ADRECALL > 4.85",
  },
  { subgroupName: "Subgroup No.2", riskLabel: "Moderate", cutoff: "Others" },
  {
    subgroupName: "Subgroup No.3",
    riskLabel: "Slow",
    cutoff: "ADRECOG <= 5.7 and CDJUD <= 1.5",
  },
];

type DiseaseProgressionPanelProps = {
  chartData: ErrorBarGroup[];
  rows: SubgroupLegendRow[];
};

const DECOMPOSITION_LEFT_TICKS = [0, 5, 10, 15, 20, 25, 30, 35];
const WITHIN_GROUP_TICKS = [0, 10, 20, 30, 40, 50];

function DiseaseProgressionPanel({ chartData, rows }: DiseaseProgressionPanelProps) {
  return (
    <div className="w-full h-[656px] bg-[#ECECF1] rounded-[16px] border-[3px] border-[#8A47FF] flex flex-col p-5 mt-auto flex-shrink-0">
      <h4 className="text-h3 text-neutral-20 flex-shrink-0">Disease Progression by Subgroup</h4>
      <div className="h-px bg-[#B7B6BE] mt-3 flex-shrink-0" />

      <div className="mt-3 flex-1 min-h-0">
        <MultiLineWithErrorBar
          dataGroup={chartData}
          seriesLabels={RISK_SERIES_LABELS}
          colors={RISK_SERIES_COLORS}
          height={390}
          xAxis={{
            min: 0,
            max: 27,
            interval: 3,
            splitLine: true,
            splitLineColor: "#CECDD6",
            axisLineColor: "#CECDD6",
            labelColor: "#4A4949",
            fontSize: 11,
            name: "Month",
            nameColor: "#1B1B1B",
            nameFontSize: 16,
            nameGap: 30,
          }}
          yAxis={{
            min: -3.5,
            max: 15.5,
            interval: 2.5,
            inverse: true,
            splitLine: true,
            splitLineColor: "#CECDD6",
            axisLineColor: "#CECDD6",
            showLabels: true,
            labelColor: "#4A4949",
            fontSize: 11,
            name: "ADAS-Cog",
            nameColor: "#1B1B1B",
            nameFontSize: 14,
            nameGap: 44,
          }}
          guideLineX={12}
          guideLineColor="#272354"
          guideLineWidth={2}
        />
      </div>

      <div className="mt-2 flex items-center gap-6 flex-wrap">
        {RISK_SERIES_LABELS.map((label, index) => {
          const color = RISK_SERIES_COLORS[index];
          return (
            <div key={label} className="flex items-center gap-2">
              <div className="relative w-[84px] h-[2px]" style={{ backgroundColor: color }}>
                <span
                  className="absolute top-1/2 left-1/2 w-[12px] h-[12px] rounded-full -translate-x-1/2 -translate-y-1/2"
                  style={{ backgroundColor: color }}
                />
              </div>
              <span className="text-body1 text-neutral-40">{label}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 border-t border-[#B7B6BE]">
        {rows.map((row, index) => (
          <div
            key={row.subgroupName}
            className={`grid grid-cols-[160px_1fr_220px] items-center h-[44px] ${
              index > 0 ? "border-t border-[#D1D0D8]" : ""
            }`}
          >
            <span className="text-body3m text-neutral-50">{row.subgroupName}</span>
            <span className="text-h4 text-neutral-20">{row.riskLabel}</span>
            <div className="flex items-center justify-end gap-2">
              <span className="text-body3m text-neutral-50">Cutoff</span>
              <span className="text-h4 text-neutral-20">{row.cutoff}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StratificationComparisonChartMockPanel() {
  const leftPlot = { left: 52, right: 500, top: 16, bottom: 220 };
  const leftHeight = leftPlot.bottom - leftPlot.top;
  const leftValueToY = (value: number) => leftPlot.bottom - (value / 35) * leftHeight;

  const withinTop = leftValueToY(20);
  const explainedTop = leftValueToY(30);
  const barX = 58;
  const barWidth = 434;

  const rightPlot = { left: 36, right: 500, top: 16, bottom: 220 };
  const rightHeight = rightPlot.bottom - rightPlot.top;
  const rightValueToY = (value: number) => rightPlot.bottom - (value / 50) * rightHeight;

  const highY = rightValueToY(50);
  const midY = rightValueToY(30);
  const lowY = rightValueToY(13);
  const thresholdY = rightValueToY(30);

  return (
    <div className="w-full h-full bg-[#ECECF1] rounded-[16px] p-4 flex flex-col">
      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        <div className="flex flex-col min-h-0">
          <h4 className="text-h3 text-neutral-20">Variance decomposition</h4>
          <div className="h-px bg-[#A9A8B2] mt-2 flex-shrink-0" />

          <div className="flex-1 mt-2 min-h-0">
            <svg
              viewBox="0 0 520 240"
              className="w-full h-full"
              role="img"
              aria-label="Variance decomposition"
            >
              <line
                x1={leftPlot.left}
                y1={leftPlot.top}
                x2={leftPlot.left}
                y2={leftPlot.bottom}
                stroke="#6F6E76"
                strokeWidth="1.5"
              />
              <line
                x1={leftPlot.left}
                y1={leftPlot.bottom}
                x2={leftPlot.right}
                y2={leftPlot.bottom}
                stroke="#6F6E76"
                strokeWidth="1.5"
              />

              {DECOMPOSITION_LEFT_TICKS.map((tick) => {
                const y = leftValueToY(tick);
                return (
                  <g key={`left-tick-${tick}`}>
                    <line
                      x1={leftPlot.left - 4}
                      y1={y}
                      x2={leftPlot.left}
                      y2={y}
                      stroke="#6F6E76"
                      strokeWidth="1"
                    />
                    <text x={leftPlot.left - 9} y={y + 4} textAnchor="end" fill="#4A4949" fontSize="12">
                      {tick}
                    </text>
                  </g>
                );
              })}

              <text
                x={14}
                y={(leftPlot.top + leftPlot.bottom) / 2}
                textAnchor="middle"
                fill="#1B1B1B"
                fontSize="14"
                transform={`rotate(-90, 14, ${(leftPlot.top + leftPlot.bottom) / 2})`}
              >
                CIWidth
              </text>

              <text x={leftPlot.left + (leftPlot.right - leftPlot.left) / 2} y={34} textAnchor="middle" fill="#1B1B1B" fontSize="12">
                VR: 0.348 (95% CI: 0.27-0.44)
              </text>

              <rect
                x={barX}
                y={explainedTop}
                width={barWidth}
                height={leftPlot.bottom - explainedTop}
                rx="10"
                ry="10"
                fill="#26225B"
              />
              <rect
                x={barX}
                y={withinTop}
                width={barWidth}
                height={leftPlot.bottom - withinTop}
                rx="10"
                ry="10"
                fill="#9C97D0"
              />
            </svg>
          </div>

          <div className="mt-1 flex items-center justify-center gap-8 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-[48px] h-[14px] rounded-[5px] bg-[#9C97D0]" />
              <span className="text-body2m text-neutral-20">Within</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-[48px] h-[14px] rounded-[5px] bg-[#26225B]" />
              <span className="text-body2m text-neutral-20">Explained</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col min-h-0">
          <h4 className="text-h3 text-neutral-20">Within-group variance</h4>
          <div className="h-px bg-[#A9A8B2] mt-2 flex-shrink-0" />

          <div className="flex-1 mt-2 min-h-0">
            <svg
              viewBox="0 0 520 240"
              className="w-full h-full"
              role="img"
              aria-label="Within-group variance"
            >
              <line
                x1={rightPlot.left}
                y1={rightPlot.top}
                x2={rightPlot.left}
                y2={rightPlot.bottom}
                stroke="#6F6E76"
                strokeWidth="1.5"
              />
              <line
                x1={rightPlot.left}
                y1={rightPlot.bottom}
                x2={rightPlot.right}
                y2={rightPlot.bottom}
                stroke="#6F6E76"
                strokeWidth="1.5"
              />

              {WITHIN_GROUP_TICKS.map((tick) => {
                const y = rightValueToY(tick);
                return (
                  <text key={`right-tick-${tick}`} x={rightPlot.left - 8} y={y + 4} textAnchor="end" fill="#4A4949" fontSize="12">
                    {tick}
                  </text>
                );
              })}

              <line
                x1={rightPlot.left}
                y1={thresholdY}
                x2={rightPlot.right}
                y2={thresholdY}
                stroke="#2C295A"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              <rect x={126} y={highY} width={72} height={rightPlot.bottom - highY} rx="10" ry="10" fill="#26225B" />
              <rect
                x={228}
                y={midY}
                width={72}
                height={rightPlot.bottom - midY}
                rx="10"
                ry="10"
                fill="#7A74AC"
                stroke="#8A47FF"
                strokeWidth="4"
              />
              <rect x={330} y={lowY} width={72} height={rightPlot.bottom - lowY} rx="10" ry="10" fill="#A39ED5" />

              <text x={162} y={196} textAnchor="middle" fill="#FFFFFF" fontSize="13">
                w=37
              </text>
              <text x={264} y={196} textAnchor="middle" fill="#FFFFFF" fontSize="13">
                w=198
              </text>
              <text x={366} y={196} textAnchor="middle" fill="#FFFFFF" fontSize="13">
                w=203
              </text>

              <text x={162} y={236} textAnchor="middle" fill="#1B1B1B" fontSize="13">
                High Risk
              </text>
              <text x={264} y={236} textAnchor="middle" fill="#1B1B1B" fontSize="13">
                Mid Risk
              </text>
              <text x={366} y={236} textAnchor="middle" fill="#1B1B1B" fontSize="13">
                Low Risk
              </text>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function StratificationComparisonChartMockPanelAlt() {
  const plot = { left: 36, right: 500, top: 16, bottom: 220 };
  const plotHeight = plot.bottom - plot.top;
  const valueToY = (value: number) => plot.bottom - (value / 50) * plotHeight;

  const highY = valueToY(50);
  const midY = valueToY(30);
  const lowY = valueToY(13);
  const thresholdY = valueToY(30);

  const withinTop = valueToY(20);
  const explainedTop = valueToY(30);

  return (
    <div className="w-full h-full bg-[#ECECF1] rounded-[16px] p-4 flex flex-col">
      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        <div className="flex flex-col min-h-0">
          <div className="text-body2m text-neutral-30">Separation evidence</div>
          <h4 className="text-h3 text-neutral-20">Variance decomposition</h4>
          <div className="h-px bg-[#A9A8B2] mt-2 flex-shrink-0" />

          <div className="flex-1 mt-2 min-h-0">
            <svg
              viewBox="0 0 520 240"
              className="w-full h-full"
              role="img"
              aria-label="Variance decomposition by subgroup"
            >
              <line
                x1={plot.left}
                y1={plot.top}
                x2={plot.left}
                y2={plot.bottom}
                stroke="#6F6E76"
                strokeWidth="1.5"
              />
              <line
                x1={plot.left}
                y1={plot.bottom}
                x2={plot.right}
                y2={plot.bottom}
                stroke="#6F6E76"
                strokeWidth="1.5"
              />

              {WITHIN_GROUP_TICKS.map((tick) => {
                const y = valueToY(tick);
                return (
                  <text
                    key={`alt-left-tick-${tick}`}
                    x={plot.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    fill="#4A4949"
                    fontSize="12"
                  >
                    {tick}
                  </text>
                );
              })}

              <line
                x1={plot.left}
                y1={thresholdY}
                x2={plot.right}
                y2={thresholdY}
                stroke="#2C295A"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              <rect x={126} y={highY} width={72} height={plot.bottom - highY} rx="10" ry="10" fill="#4327E6" />
              <rect x={228} y={midY} width={72} height={plot.bottom - midY} rx="10" ry="10" fill="#EF6A00" />
              <rect x={330} y={lowY} width={72} height={plot.bottom - lowY} rx="10" ry="10" fill="#26225B" />

              <text x={162} y={196} textAnchor="middle" fill="#FFFFFF" fontSize="13">
                w=37
              </text>
              <text x={264} y={196} textAnchor="middle" fill="#FFFFFF" fontSize="13">
                w=198
              </text>
              <text x={366} y={196} textAnchor="middle" fill="#FFFFFF" fontSize="13">
                w=203
              </text>

              <text x={162} y={236} textAnchor="middle" fill="#1B1B1B" fontSize="13">
                High Risk
              </text>
              <text x={264} y={236} textAnchor="middle" fill="#1B1B1B" fontSize="13">
                Mid Risk
              </text>
              <text x={366} y={236} textAnchor="middle" fill="#1B1B1B" fontSize="13">
                Low Risk
              </text>
            </svg>
          </div>
        </div>

        <div className="flex flex-col min-h-0">
          <div className="text-body2m text-neutral-30">Separation evidence</div>
          <h4 className="text-h3 text-neutral-20">Within-group variance by subgroup</h4>
          <div className="h-px bg-[#A9A8B2] mt-2 flex-shrink-0" />

          <div className="flex-1 mt-2 min-h-0">
            <svg
              viewBox="0 0 520 240"
              className="w-full h-full"
              role="img"
              aria-label="Within-group variance decomposition"
            >
              <line
                x1={plot.left}
                y1={plot.top}
                x2={plot.left}
                y2={plot.bottom}
                stroke="#6F6E76"
                strokeWidth="1.5"
              />
              <line
                x1={plot.left}
                y1={plot.bottom}
                x2={plot.right}
                y2={plot.bottom}
                stroke="#6F6E76"
                strokeWidth="1.5"
              />

              {WITHIN_GROUP_TICKS.map((tick) => {
                const y = valueToY(tick);
                return (
                  <text
                    key={`alt-right-tick-${tick}`}
                    x={plot.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    fill="#4A4949"
                    fontSize="12"
                  >
                    {tick}
                  </text>
                );
              })}

              <text
                x={12}
                y={(plot.top + plot.bottom) / 2}
                textAnchor="middle"
                fill="#1B1B1B"
                fontSize="14"
                transform={`rotate(-90, 12, ${(plot.top + plot.bottom) / 2})`}
              >
                CIWidth
              </text>

              <text x={272} y={92} textAnchor="middle" fill="#1B1B1B" fontSize="12">
                VR: 0.348 (95% CI: 0.27-0.44)
              </text>

              <rect
                x={44}
                y={explainedTop}
                width={456}
                height={plot.bottom - explainedTop}
                rx="10"
                ry="10"
                fill="#EF6A00"
              />
              <rect
                x={44}
                y={withinTop}
                width={456}
                height={plot.bottom - withinTop}
                rx="10"
                ry="10"
                fill="#B7B7BC"
              />
            </svg>
          </div>

          <div className="mt-1 flex items-center justify-center gap-8 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-[48px] h-[14px] rounded-[5px] bg-[#B7B7BC]" />
              <span className="text-body2m text-neutral-20">Within</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-[48px] h-[14px] rounded-[5px] bg-[#EF6A00]" />
              <span className="text-body2m text-neutral-20">Explained</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureBasedDiseaseProgressionPanel() {
  return (
    <div className="w-full h-[656px] bg-[#ECECF1] rounded-[16px] flex flex-col p-5 mt-auto flex-shrink-0">
      <h4 className="text-h3 text-neutral-20 flex-shrink-0">Disease Progression by Subgroup</h4>
      <div className="h-px bg-[#A9A8B2] mt-3 flex-shrink-0" />

      <div className="mt-3 flex-1 min-h-0">
        <MultiLineWithErrorBar
          dataGroup={FEATURE_BASED_CHART_MOCK}
          seriesLabels={FEATURE_BASED_RISK_SERIES_LABELS}
          colors={FEATURE_BASED_RISK_SERIES_COLORS}
          height={430}
          xAxis={{
            min: 0,
            max: 28,
            interval: 5,
            splitLine: true,
            splitLineColor: "#CBCAD3",
            axisLineColor: "#CBCAD3",
            labelColor: "#4A4949",
            fontSize: 11,
            name: "Month",
            nameColor: "#1B1B1B",
            nameFontSize: 16,
            nameGap: 30,
          }}
          yAxis={{
            min: -3.5,
            max: 15.5,
            interval: 2.5,
            inverse: true,
            splitLine: true,
            splitLineColor: "#CBCAD3",
            axisLineColor: "#CBCAD3",
            showLabels: true,
            labelColor: "#4A4949",
            fontSize: 11,
            name: "ADAS-Cog",
            nameColor: "#1B1B1B",
            nameFontSize: 14,
            nameGap: 44,
          }}
          guideLineX={12}
          guideLineColor="#452CF4"
          guideLineWidth={2}
          guideLineType="dashed"
        />
      </div>

      <div className="mt-1 flex items-center gap-6 flex-wrap">
        {FEATURE_BASED_RISK_SERIES_LABELS.map((label, index) => {
          const color = FEATURE_BASED_RISK_SERIES_COLORS[index];
          return (
            <div key={label} className="flex items-center gap-2">
              <div className="relative w-[86px] h-[2px]" style={{ backgroundColor: color }}>
                <span
                  className="absolute top-1/2 left-1/2 w-[12px] h-[12px] rounded-full -translate-x-1/2 -translate-y-1/2"
                  style={{ backgroundColor: color }}
                />
              </div>
              <span className="text-body1 text-neutral-50">{label}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-2 border-t border-[#A9A8B2]">
        {FEATURE_BASED_RULE_ROWS.map((row, index) => (
          <div
            key={row.subgroupName}
            className={`grid grid-cols-[140px_180px_1fr] items-center h-[42px] ${
              index > 0 ? "border-t border-[#CAC9D1]" : ""
            }`}
          >
            <span className="text-body3m text-neutral-50">{row.subgroupName}</span>
            <span className="text-h4 text-neutral-20">{row.riskLabel}</span>
            <div className="flex items-center gap-4">
              <span className="text-body3m text-neutral-50 shrink-0">Cutoff</span>
              <span className="text-h4 text-neutral-20 whitespace-nowrap">{row.cutoff}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function TSIReportPage({ params }: TSIReportPageProps) {
  const { feature } = await params;

  await getReportByFeature("1", "6", feature);
  return (
    <AppLayout headerType="tsi">
      <div className="w-full flex flex-col items-center min-w-0">
        {/* 타이틀: 카드 밖 */}
        <div className="w-full flex justify-center mb-[42px] max-w-full">
          <div className="w-[1772px] max-w-full flex-shrink-0 mx-auto">
            <div className="flex flex-col gap-1 flex-shrink-0 items-start">
              <div className="text-title text-neutral-5 text-left mb-2">
                Subgroup Analysis Report : {feature}
              </div>
              <p className="text-body2m text-neutral-50 text-left">Analysis Summary</p>
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
                      Patients were initially stratified based on the model's predicted progression
                      effect into three distinct categories: Rapid (Top 20%), Moderate (20% ~ 70%),
                      and Slow (Bottom 30%). To enhance clinical interpretability, we utilized the
                      CART algorithm to translate complex model parameters into simplified,
                      feature-based decision rules.
                    </p>
                    <DiseaseProgressionPanel
                      chartData={MODEL_BASED_CHART_MOCK}
                      rows={SUBGROUP_LEGEND_ROWS}
                    />
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
                      The variance decomposition analysis identified key baseline drivers and their
                      respective clinical thresholds that define each subgroup: High Risk (Rapid):
                      Patients meeting both ADRECOG {">"} 5.7 and ADRECALL {">"} 4.85. Low Risk
                      (Slow): Patients meeting both ADRECOG {"\u2264"} 5.7 and CDJUD {"\u2264"} 1.5.
                      Moderate: All patients not meeting the specific High or Low-risk criteria.
                    </p>
                    <FeatureBasedDiseaseProgressionPanel />
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
                      The longitudinal trajectories for the feature-based subgroups show a high
                      degree of consistency with the original model-based classifications,
                      validating the reliability of these simplified rules. This rule-based approach
                      captures 34.0% of the total variance (IV= 0.248), effectively classifying the
                      accelerated cognitive decline (ADRAS-Cog observed in the High Risk group
                      starting from Month 12.
                    </p>
                  </div>

                  {/* 두 개의 차트 섹션 */}
                  <div className="w-full flex gap-4 mt-auto flex-shrink-0">
                    {/* 첫 번째 차트 섹션 */}
                    <div className="flex flex-col items-start gap-[10px] w-[850px] h-[378px] p-[6px] flex-shrink-0">
                      <div className="w-full flex-1 rounded-[16px] overflow-hidden">
                        <StratificationComparisonChartMockPanel />
                      </div>
                    </div>
                    {/* 두 번째 차트 섹션 */}
                    <div className="flex flex-col items-start gap-[10px] w-[850px] h-[378px] p-[6px] flex-shrink-0">
                      <div className="w-full flex-1 rounded-[16px] overflow-hidden">
                        <StratificationComparisonChartMockPanelAlt />
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
                      <h3 className="text-h4 text-neutral-5">Risk & Response Assessment</h3>
                      <p className="text-body3m text-neutral-40">
                        Risk & Response Assessment (rHTE & Safety)
                        <br /> Drug Response (rHTE): Forest plot analysis indicates that the High
                        Risk (Rapid) subgroup exhibits the most pronounced therapeutic benefit
                        compared to the placebo.
                        <br />
                        <br />
                        Safety Assessment: Consistent safety profiles were observed across all
                        subgroups, supporting the clinical utility of this classification system for
                        targeted patient management.
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
                        <div className="h-[22px] flex-shrink-0 mb-1" aria-hidden />
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
                              <span className="text-body4 text-neutral-50 text-xs">Chart</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">Chart</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">Chart</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* 컬럼 3: Drug response */}
                      <div className="flex-1 min-w-0 flex flex-col py-2 pl-2 pr-4 relative border-r border-neutral-80">
                        {/* Set 행과 동일: h-[22px] + mb-1 */}
                        <div className="h-[22px] flex-shrink-0 mb-1" aria-hidden />
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
                              <span className="text-body4 text-neutral-50 text-xs">Chart</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">Chart</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">Chart</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* 컬럼 4: Safety */}
                      <div className="flex-1 min-w-0 flex flex-col py-2 pl-2 pr-4 relative">
                        {/* Set 행과 동일: h-[22px] + mb-1 */}
                        <div className="h-[22px] flex-shrink-0 mb-1" aria-hidden />
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
                              <span className="text-body4 text-neutral-50 text-xs">Chart</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">Chart</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">Chart</span>
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
                        <div className="h-[22px] flex-shrink-0 mb-1" aria-hidden />
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
                              <span className="text-body4 text-neutral-50 text-xs">Chart</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">Chart</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">Chart</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* 컬럼 3: Drug response */}
                      <div className="flex-1 min-w-0 flex flex-col py-2 pl-2 pr-4 relative border-r border-neutral-80">
                        {/* Set 행과 동일: h-[22px] + mb-1 */}
                        <div className="h-[22px] flex-shrink-0 mb-1" aria-hidden />
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
                              <span className="text-body4 text-neutral-50 text-xs">Chart</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">Chart</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">Chart</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* 컬럼 4: Safety */}
                      <div className="flex-1 min-w-0 flex flex-col py-2 pl-2 pr-4 relative">
                        {/* Set 행과 동일: h-[22px] + mb-1 */}
                        <div className="h-[22px] flex-shrink-0 mb-1" aria-hidden />
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
                              <span className="text-body4 text-neutral-50 text-xs">Chart</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">Chart</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center h-7 flex-shrink-0 relative z-[1]">
                          <div
                            className="relative w-full h-2 flex items-center"
                            style={{ minHeight: 8 }}
                          >
                            <div className="w-full h-7 bg-neutral-95 rounded flex items-center justify-center">
                              <span className="text-body4 text-neutral-50 text-xs">Chart</span>
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
