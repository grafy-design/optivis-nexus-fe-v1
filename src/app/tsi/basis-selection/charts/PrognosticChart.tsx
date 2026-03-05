"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Prognostic Chart
 * - SVG는 컨테이너를 꽉 채움 (preserveAspectRatio="none")
 * - 마커는 ResizeObserver로 실제 픽셀 크기를 측정 후 viewBox 좌표로 역변환해 정원 유지
 * - 1440px 기준 outer r=17.6px, inner r=10.56px (원본 22/13.2의 80%)
 */
export default function PrognosticChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 816, h: 586 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const W = 816, H = 586;
  const PL = 40, PT = 20, PR = 776, PB = 566;
  const PW = PR - PL;
  const PH = PB - PT;

  const xPoints = [0, 1, 2, 3, 4, 5];
  const xPos = (i: number) => PL + (i / 5) * PW;
  const orangeY = [0.88, 0.82, 0.76, 0.68, 0.58, 0.48];
  const blueY   = [0.82, 0.68, 0.56, 0.42, 0.28, 0.12];
  const yPos = (v: number) => PB - v * PH;
  const orangeErr = [0.04, 0.05, 0.05, 0.06, 0.06, 0.07];
  const blueErr   = [0.04, 0.05, 0.06, 0.06, 0.07, 0.07];

  const toPoints = (yArr: number[]) =>
    xPoints.map((i) => `${xPos(i)},${yPos(yArr[i])}`).join(" ");
  const toFillPath = (yArr: number[]) => {
    const pts = xPoints.map((i) => `${xPos(i)},${yPos(yArr[i])}`);
    return `M ${pts[0]} L ${pts.slice(1).join(" L ")} L ${xPos(5)},${PB} L ${xPos(0)},${PB} Z`;
  };

  const gridCols = 6, gridRows = 6;

  // 화면 픽셀 r 고정 (1440px 기준 80%: outer=17.6, inner=8.448)
  const scale = size.w >= 1470 ? 1.2 : 1;
  const roScreen = 17.6 * scale, riScreen = 8 * scale;
  // viewBox 좌표로 역변환
  const rxOuter = roScreen * (W / size.w);
  const ryOuter = roScreen * (H / size.h);
  const rxInner = riScreen * (W / size.w);
  const ryInner = riScreen * (H / size.h);

  return (
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        style={{ display: "block" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="pg-orange-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFB692" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#FFB692" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="pg-blue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3A11D8" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#3A11D8" stopOpacity="0.0" />
          </linearGradient>
          <clipPath id="pg-clip">
            <rect x={PL - 20} y={PT - 20} width={PW + 40} height={PH + 40} />
          </clipPath>
        </defs>

        <rect width={W} height={H} fill="transparent" />
        {Array.from({ length: gridCols + 1 }).map((_, i) => (
          <line key={`vc-${i}`}
            x1={(i / gridCols) * W} y1={0}
            x2={(i / gridCols) * W} y2={H}
            stroke="#c7c5c9" strokeWidth="1"
          />
        ))}
        {Array.from({ length: gridRows + 1 }).map((_, i) => (
          <line key={`hr-${i}`}
            x1={0} y1={(i / gridRows) * H}
            x2={W} y2={(i / gridRows) * H}
            stroke="#c7c5c9" strokeWidth="1"
          />
        ))}
        <g clipPath="url(#pg-clip)">

          <path d={toFillPath(orangeY)} fill="url(#pg-orange-fill)" />
          <path d={toFillPath(blueY)} fill="url(#pg-blue-fill)" />

          <polyline points={toPoints(orangeY)} fill="none" stroke="#F06600" strokeWidth="2" strokeLinejoin="round" />
          <polyline points={toPoints(blueY)} fill="none" stroke="#3A11D8" strokeWidth="2" strokeLinejoin="round" />

          {xPoints.map((i) => {
            const cx = xPos(i);
            const cy = yPos(orangeY[i]);
            const ey = orangeErr[i] * PH;
            return (
              <g key={`o-${i}`}>
                <line x1={cx} y1={cy - ey} x2={cx} y2={cy + ey} stroke="#F06600" strokeWidth="3" />
                <line x1={cx - 10} y1={cy - ey} x2={cx + 10} y2={cy - ey} stroke="#F06600" strokeWidth="3" />
                <line x1={cx - 10} y1={cy + ey} x2={cx + 10} y2={cy + ey} stroke="#F06600" strokeWidth="3" />
                <ellipse cx={cx} cy={cy} rx={rxOuter} ry={ryOuter} fill="#F06600" fillOpacity="0.22" />
                <ellipse cx={cx} cy={cy} rx={rxInner} ry={ryInner} fill="#F06600" />
              </g>
            );
          })}

          {xPoints.map((i) => {
            const cx = xPos(i);
            const cy = yPos(blueY[i]);
            const ey = blueErr[i] * PH;
            return (
              <g key={`b-${i}`}>
                <line x1={cx} y1={cy - ey} x2={cx} y2={cy + ey} stroke="#3A11D8" strokeWidth="3" />
                <line x1={cx - 10} y1={cy - ey} x2={cx + 10} y2={cy - ey} stroke="#3A11D8" strokeWidth="3" />
                <line x1={cx - 10} y1={cy + ey} x2={cx + 10} y2={cy + ey} stroke="#3A11D8" strokeWidth="3" />
                <ellipse cx={cx} cy={cy} rx={rxOuter} ry={ryOuter} fill="#3A11D8" fillOpacity="0.18" />
                <ellipse cx={cx} cy={cy} rx={rxInner} ry={ryInner} fill="#3A11D8" />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
