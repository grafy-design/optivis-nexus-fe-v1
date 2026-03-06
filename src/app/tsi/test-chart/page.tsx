"use client";
import { TSIStackedVarianceChart } from "@/components/charts/tsi-report/TSIStackedVarianceChart";

// 임시 테스트 페이지 — report 페이지와 동일한 260px 높이
const mockData = {
  within: 6,
  explained: 4,
  max: 10,
  ticks: [0, 2, 4, 6, 8, 10],
  vrLabel: "VR=40%",
  withinColor: "#8B5CF6",
  explainedColor: "#6366F1",
};

export default function TestChartPage() {
  return (
    <div style={{ width: 200, height: 260, padding: 0, background: "#fff" }}>
      <TSIStackedVarianceChart data={mockData} />
    </div>
  );
}
