"use client";

import { useEffect, useRef, useState } from "react";

export default function PrognosticChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 816, h: 586 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setSize({ w: width, h: height });
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const W = 816;
  const H = 586;

  const PL = 40;
  const PT = 20;
  const PR = 776;
  const PB = 566;
  const PW = PR - PL;
  const PH = PB - PT;

  const xPoints = [0, 1, 2, 3, 4, 5];
  const xPos = (i: number) => PL + (i / 5) * PW;
  const orangeY = [0.88, 0.82, 0.76, 0.68, 0.58, 0.48];
  const blueY = [0.82, 0.68, 0.56, 0.42, 0.28, 0.12];
  const yPos = (v: number) => PB - v * PH;

  const orangeErr = [0.04, 0.05, 0.05, 0.06, 0.06, 0.07];
  const blueErr = [0.04, 0.05, 0.06, 0.06, 0.07, 0.07];

  const toPoints = (yArr: number[]) =>
    xPoints.map((i) => `${xPos(i)},${yPos(yArr[i])}`).join(" ");

  const toFillPath = (yArr: number[]) => {
    const pts = xPoints.map((i) => `${xPos(i)},${yPos(yArr[i])}`);
    return `M ${pts[0]} L ${pts.slice(1).join(" L ")} L ${xPos(5)},${PB} L ${xPos(0)},${PB} Z`;
  };

  const gridCols = 12;
  const gridRows = 12;

  const scale = size.w >= 1470 ? 1.2 : 1;
  const roScreen = 17.6 * scale;
  const riScreen = 8 * scale;
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
            <stop offset="0%" stopColor="#FFB692" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FFB692" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="pg-blue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3A11D8" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#3A11D8" stopOpacity="0.0" />
          </linearGradient>
          <clipPath id="pg-clip">
            <rect x={PL - 20} y={PT - 20} width={PW + 40} height={PH + 40} />
          </clipPath>
        </defs>

        <rect width={W} height={H} fill="transparent" />

        {Array.from({ length: gridCols + 1 }).map((_, i) => (
          <line
            key={`vc-${i}`}
            x1={(i / gridCols) * W}
            y1={0}
            x2={(i / gridCols) * W}
            y2={H}
            stroke="#c7c5c9"
            strokeWidth="1"
          />
        ))}
        {Array.from({ length: gridRows + 1 }).map((_, i) => (
          <line
            key={`hr-${i}`}
            x1={0}
            y1={(i / gridRows) * H}
            x2={W}
            y2={(i / gridRows) * H}
            stroke="#c7c5c9"
            strokeWidth="1"
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
