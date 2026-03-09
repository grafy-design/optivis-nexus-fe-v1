"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Drug Responsiveness Chart
 * - SVG는 컨테이너를 꽉 채움 (preserveAspectRatio="none")
 * - 마커는 ResizeObserver로 실제 픽셀 크기를 측정 후 viewBox 좌표로 역변환해 정원 유지
 * - 1440px 기준 outer r=17.6px, inner r=10.56px (Prognostic과 동일 크기)
 */
export default function DrugResponsivenessChart() {
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
  const PL = 0, PT = 0, PR = 816, PB = 586;
  const PW = PR - PL;
  const PH = PB - PT;

  const xPos = (v: number) => PL + v * PW;
  const yPos = (v: number) => PB - v * PH;

  const dx1 = xPos(0), dy1 = yPos(0);
  const dx2 = xPos(1), dy2 = yPos(1);

  const orangeTriPath = `M ${xPos(0)},${yPos(0)} L ${xPos(0)},${yPos(1)} L ${xPos(1)},${yPos(1)} Z`;
  const blueTriPath   = `M ${xPos(0)},${yPos(0)} L ${xPos(1)},${yPos(1)} L ${xPos(1)},${yPos(0)} Z`;

  const gridCols = 12, gridRows = 12;

  const orangeDots: [number, number][] = [
    [0.34, 0.52], [0.42, 0.62], [0.28, 0.62], [0.38, 0.72],
    [0.48, 0.68], [0.22, 0.54], [0.44, 0.56], [0.32, 0.76],
    [0.50, 0.78], [0.26, 0.68], [0.40, 0.84], [0.54, 0.72],
  ];
  const blueDots: [number, number][] = [
    [0.52, 0.34], [0.60, 0.44], [0.46, 0.28], [0.64, 0.36],
    [0.56, 0.50], [0.70, 0.46], [0.48, 0.42], [0.66, 0.28],
    [0.74, 0.56], [0.58, 0.22], [0.76, 0.38], [0.62, 0.58],
    [0.44, 0.18], [0.68, 0.64],
  ];

  // 화면 픽셀 r 고정 (outer=17.6, inner=8)
  const roScreen = 17.6, riScreen = 8;
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
          <linearGradient id="dr-orange-tri" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#FFB692" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#FFB692" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id="dr-blue-tri" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C5C0F0" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#C5C0F0" stopOpacity="0.50" />
          </linearGradient>
          <clipPath id="dr-clip">
            <rect x={PL} y={PT} width={PW} height={PH} />
          </clipPath>
        </defs>

        <path d={orangeTriPath} fill="url(#dr-orange-tri)" clipPath="url(#dr-clip)" />
        <path d={blueTriPath}   fill="url(#dr-blue-tri)"   clipPath="url(#dr-clip)" />

        {Array.from({ length: gridCols + 1 }).map((_, i) => (
          <line key={`vc-${i}`}
            x1={PL + (i / gridCols) * PW} y1={PT}
            x2={PL + (i / gridCols) * PW} y2={PB}
            stroke="#E8E7EC" strokeWidth="1"
          />
        ))}
        {Array.from({ length: gridRows + 1 }).map((_, i) => (
          <line key={`hr-${i}`}
            x1={PL} y1={PT + (i / gridRows) * PH}
            x2={PR} y2={PT + (i / gridRows) * PH}
            stroke="#E8E7EC" strokeWidth="1"
          />
        ))}

        <line x1={dx1} y1={dy1} x2={dx2} y2={dy2} stroke="#ACAAAD" strokeWidth="1.2" clipPath="url(#dr-clip)" />

        {orangeDots.map(([x, y], i) => {
          const cx = xPos(x), cy = yPos(y);
          return (
            <g key={`o-${i}`} clipPath="url(#dr-clip)">
              <ellipse cx={cx} cy={cy} rx={rxOuter} ry={ryOuter} fill="#F06600" fillOpacity="0.22" />
              <ellipse cx={cx} cy={cy} rx={rxInner} ry={ryInner} fill="#F06600" />
            </g>
          );
        })}

        {blueDots.map(([x, y], i) => {
          const cx = xPos(x), cy = yPos(y);
          return (
            <g key={`b-${i}`} clipPath="url(#dr-clip)">
              <ellipse cx={cx} cy={cy} rx={rxOuter} ry={ryOuter} fill="#3A11D8" fillOpacity="0.18" />
              <ellipse cx={cx} cy={cy} rx={rxInner} ry={ryInner} fill="#3A11D8" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
