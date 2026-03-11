"use client";

import dynamic from "next/dynamic";

// ECharts 트리쉐이킹 + 동적 로딩: 필요한 모듈만 로드
const ReactECharts = dynamic(
  async () => {
    const [echarts, charts, components, renderers, coreMod] = await Promise.all(
      [
        import("echarts/core"),
        import("echarts/charts"),
        import("echarts/components"),
        import("echarts/renderers"),
        import("echarts-for-react/lib/core"),
      ]
    );

    // 필요한 모듈만 등록
    echarts.use([
      charts.LineChart,
      charts.BarChart,
      charts.BoxplotChart,
      charts.CustomChart,
      charts.ScatterChart,
      components.GridComponent,
      components.TooltipComponent,
      components.MarkPointComponent,
      components.MarkLineComponent,
      components.MarkAreaComponent,
      components.LegendComponent,
      components.DataZoomComponent,
      components.TitleComponent,
      components.GraphicComponent,
      renderers.CanvasRenderer,
    ]);

    const Component = coreMod.default;
    const WrappedComponent = (props: any) => (
      <Component {...props} echarts={echarts} />
    );
    WrappedComponent.displayName = "ReactECharts";
    return WrappedComponent;
  },
  {
    ssr: false,
    loading: () => (
      <div style={{ width: "100%", height: "100%", minHeight: 100 }} />
    ),
  }
);

// 페이지 진입 시 프리로드 (필요한 모듈만)
if (typeof window !== "undefined") {
  Promise.all([
    import("echarts/core"),
    import("echarts/charts"),
    import("echarts/components"),
    import("echarts/renderers"),
    import("echarts-for-react/lib/core"),
  ]);
}

export default ReactECharts;
