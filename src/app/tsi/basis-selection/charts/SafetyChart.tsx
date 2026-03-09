"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Safety Chart
 * - SVG는 컨테이너를 꽉 채움 (preserveAspectRatio="none")
 * - 마커는 ResizeObserver로 실제 픽셀 크기를 측정 후 viewBox 좌표로 역변환해 정원 유지
 * - 1440px 기준 outer r=17.6px, inner r=10.56px (Prognostic과 동일 크기)
 */
export default function SafetyChart() {
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

  const gridCols = 12, gridRows = 12;

  const blueDots: [number, number][] = [
    [0.10, 0.18], [0.18, 0.28], [0.22, 0.14], [0.30, 0.22],
    [0.12, 0.36], [0.28, 0.38], [0.38, 0.28], [0.08, 0.10],
    [0.20, 0.08], [0.34, 0.12], [0.40, 0.38], [0.16, 0.44],
    [0.32, 0.44], [0.44, 0.20], [0.06, 0.28],
  ];
  const orangeDots: [number, number][] = [
    [0.60, 0.72], [0.68, 0.82], [0.76, 0.68], [0.72, 0.90],
    [0.84, 0.78], [0.62, 0.60], [0.80, 0.88], [0.56, 0.80],
    [0.78, 0.62], [0.88, 0.70], [0.64, 0.94], [0.92, 0.84],
  ];

  const ellipseCx = xPos(0.50);
  const ellipseCy = yPos(0.48);
  const ellipseRx = PW * 0.22;
  const ellipseRy = PH * 0.22;

  const blueCx = xPos(0.25), blueCy = yPos(0.28);
  const orangeCx = xPos(0.74), orangeCy = yPos(0.76);
  const radR = PW * 0.30;

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
          <radialGradient id="sf-blue-radial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C5C0F0" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#C5C0F0" stopOpacity="0.0" />
          </radialGradient>
          <radialGradient id="sf-orange-radial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFB692" stopOpacity="0.60" />
            <stop offset="100%" stopColor="#FFB692" stopOpacity="0.0" />
          </radialGradient>
          <clipPath id="sf-clip">
            <rect x={PL} y={PT} width={PW} height={PH} />
          </clipPath>
        </defs>

        <ellipse cx={blueCx} cy={blueCy} rx={radR} ry={radR * 0.75} fill="url(#sf-blue-radial)" clipPath="url(#sf-clip)" />
        <ellipse cx={orangeCx} cy={orangeCy} rx={radR} ry={radR * 0.75} fill="url(#sf-orange-radial)" clipPath="url(#sf-clip)" />

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

        <ellipse
          cx={ellipseCx} cy={ellipseCy}
          rx={ellipseRx} ry={ellipseRy}
          fill="none" stroke="#ACAAAD" strokeWidth="1.5" strokeDasharray="5 4"
          clipPath="url(#sf-clip)"
        />

        {blueDots.map(([x, y], i) => {
          const cx = xPos(x), cy = yPos(y);
          return (
            <g key={`b-${i}`} clipPath="url(#sf-clip)">
              <ellipse cx={cx} cy={cy} rx={rxOuter} ry={ryOuter} fill="#3A11D8" fillOpacity="0.18" />
              <ellipse cx={cx} cy={cy} rx={rxInner} ry={ryInner} fill="#3A11D8" />
            </g>
          );
        })}

        {orangeDots.map(([x, y], i) => {
          const cx = xPos(x), cy = yPos(y);
          return (
            <g key={`o-${i}`} clipPath="url(#sf-clip)">
              <ellipse cx={cx} cy={cy} rx={rxOuter} ry={ryOuter} fill="#F06600" fillOpacity="0.22" />
              <ellipse cx={cx} cy={cy} rx={rxInner} ry={ryInner} fill="#F06600" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
