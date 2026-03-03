"use client";

/**
 * Prognostic Chart
 * 피그마 311-30728 기반: 에러바 포함 꺾은선 그래프
 * - Orange (#F06600): Subgroup (완만하게 유지)
 * - Blue (#3A11D8): Overall (빠르게 하강)
 * - 반투명 fill + 하단 반사(ghost) 효과
 */
export default function PrognosticChart() {
  const W = 816;
  const H = 586;

  // 플롯 영역 — 카드 꽉 채움
  const PL = 0, PT = 0, PR = 816, PB = 586;
  const PW = PR - PL; // 668
  const PH = PB - PT; // 470

  // X 포인트: 0,5,10,15,20,25개월 → 6개 포인트
  const xPoints = [0, 1, 2, 3, 4, 5];
  const xPos = (i: number) => PL + (i / 5) * PW;

  // Orange 데이터 (완만 하강)
  const orangeY = [0.18, 0.22, 0.25, 0.30, 0.38, 0.45];
  // Blue 데이터 (급격 하강)
  const blueY   = [0.22, 0.32, 0.40, 0.50, 0.62, 0.74];

  const yPos = (v: number) => PT + v * PH;

  // 에러바 반값
  const orangeErr = [0.04, 0.05, 0.05, 0.06, 0.06, 0.07];
  const blueErr   = [0.04, 0.05, 0.06, 0.06, 0.07, 0.07];

  // polyline points 문자열
  const toPoints = (yArr: number[]) =>
    xPoints.map((i) => `${xPos(i)},${yPos(yArr[i])}`).join(" ");

  // fill polygon (line + bottom)
  const toFillPath = (yArr: number[]) => {
    const pts = xPoints.map((i) => `${xPos(i)},${yPos(yArr[i])}`);
    return `M ${pts[0]} L ${pts.slice(1).join(" L ")} L ${xPos(5)},${PB} L ${xPos(0)},${PB} Z`;
  };

  // 그리드 선 개수
  const gridCols = 6;
  const gridRows = 7;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="100%"
      style={{ display: "block", overflow: "hidden", minWidth: 360, minHeight: 260 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Orange fill 그라데이션 */}
        <linearGradient id="pg-orange-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFB692" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFB692" stopOpacity="0.0" />
        </linearGradient>
        {/* Blue fill 그라데이션 */}
        <linearGradient id="pg-blue-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3A11D8" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#3A11D8" stopOpacity="0.0" />
        </linearGradient>
        {/* 전체 clip */}
        <clipPath id="pg-clip">
          <rect x={PL} y={PT} width={PW} height={PH + 10} />
        </clipPath>
      </defs>

      {/* 배경 */}
      <rect width={W} height={H} fill="#ffffff" rx="12" />

      {/* 그리드 */}
      {Array.from({ length: gridCols + 1 }).map((_, i) => (
        <line
          key={`vc-${i}`}
          x1={PL + (i / gridCols) * PW}
          y1={PT}
          x2={PL + (i / gridCols) * PW}
          y2={PB}
          stroke="#E8E7EC"
          strokeWidth="1"
        />
      ))}
      {Array.from({ length: gridRows + 1 }).map((_, i) => (
        <line
          key={`hr-${i}`}
          x1={PL}
          y1={PT + (i / gridRows) * PH}
          x2={PR}
          y2={PT + (i / gridRows) * PH}
          stroke="#E8E7EC"
          strokeWidth="1"
        />
      ))}

      {/* Orange fill */}
      <path d={toFillPath(orangeY)} fill="url(#pg-orange-fill)" clipPath="url(#pg-clip)" />
      {/* Blue fill */}
      <path d={toFillPath(blueY)} fill="url(#pg-blue-fill)" clipPath="url(#pg-clip)" />


      {/* Orange 라인 */}
      <polyline
        points={toPoints(orangeY)}
        fill="none"
        stroke="#F06600"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Blue 라인 */}
      <polyline
        points={toPoints(blueY)}
        fill="none"
        stroke="#3A11D8"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Orange 에러바 + 마커 */}
      {xPoints.map((i) => {
        const cx = xPos(i);
        const cy = yPos(orangeY[i]);
        const ey = orangeErr[i] * PH;
        return (
          <g key={`o-${i}`}>
            <line x1={cx} y1={cy - ey} x2={cx} y2={cy + ey} stroke="#F06600" strokeWidth="1.5" />
            <line x1={cx - 5} y1={cy - ey} x2={cx + 5} y2={cy - ey} stroke="#F06600" strokeWidth="1.5" />
            <line x1={cx - 5} y1={cy + ey} x2={cx + 5} y2={cy + ey} stroke="#F06600" strokeWidth="1.5" />
            <circle cx={cx} cy={cy} r="11" fill="#F06600" fillOpacity="0.22" />
            <circle cx={cx} cy={cy} r="6.6" fill="#F06600" />
          </g>
        );
      })}

      {/* Blue 에러바 + 마커 */}
      {xPoints.map((i) => {
        const cx = xPos(i);
        const cy = yPos(blueY[i]);
        const ey = blueErr[i] * PH;
        return (
          <g key={`b-${i}`}>
            <line x1={cx} y1={cy - ey} x2={cx} y2={cy + ey} stroke="#3A11D8" strokeWidth="1.5" />
            <line x1={cx - 5} y1={cy - ey} x2={cx + 5} y2={cy - ey} stroke="#3A11D8" strokeWidth="1.5" />
            <line x1={cx - 5} y1={cy + ey} x2={cx + 5} y2={cy + ey} stroke="#3A11D8" strokeWidth="1.5" />
            <circle cx={cx} cy={cy} r="11" fill="#3A11D8" fillOpacity="0.18" />
            <circle cx={cx} cy={cy} r="6.6" fill="#3A11D8" />
          </g>
        );
      })}

    </svg>
  );
}
