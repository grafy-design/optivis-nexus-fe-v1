"use client";

/**
 * Safety Chart
 * 피그마 기반: 두 클러스터 점 분포도
 * - 좌하단: Blue (#3A11D8) 클러스터 + 방사형 blue 그라데이션 배경
 * - 우상단: Orange (#F06600) 클러스터 + 방사형 orange 그라데이션 배경
 * - 중간에 점선 타원 경계
 * - 배경 그리드, 레이블 없음
 */
export default function SafetyChart() {
  const W = 816;
  const H = 586;

  // 플롯 영역
  const PL = 0, PT = 0, PR = 816, PB = 586;
  const PW = PR - PL;
  const PH = PB - PT;

  const xPos = (v: number) => PL + v * PW;
  const yPos = (v: number) => PB - v * PH; // 0=하단, 1=상단

  // ── 그리드 ──────────────────────────────────────────────────
  const gridCols = 6;
  const gridRows = 6;

  // ── Blue 클러스터: 좌하단 ────────────────────────────────────
  const blueDots: [number, number][] = [
    [0.10, 0.18],
    [0.18, 0.28],
    [0.22, 0.14],
    [0.30, 0.22],
    [0.12, 0.36],
    [0.28, 0.38],
    [0.38, 0.28],
    [0.08, 0.10],
    [0.20, 0.08],
    [0.34, 0.12],
    [0.40, 0.38],
    [0.16, 0.44],
    [0.32, 0.44],
    [0.44, 0.20],
    [0.06, 0.28],
  ];

  // ── Orange 클러스터: 우상단 ──────────────────────────────────
  const orangeDots: [number, number][] = [
    [0.60, 0.72],
    [0.68, 0.82],
    [0.76, 0.68],
    [0.72, 0.90],
    [0.84, 0.78],
    [0.62, 0.60],
    [0.80, 0.88],
    [0.56, 0.80],
    [0.78, 0.62],
    [0.88, 0.70],
    [0.64, 0.94],
    [0.92, 0.84],
  ];

  // ── 타원 경계 (중간 영역) ────────────────────────────────────
  const ellipseCx = xPos(0.50);
  const ellipseCy = yPos(0.48);
  const ellipseRx = PW * 0.22;
  const ellipseRy = PH * 0.22;

  // 방사형 그라데이션 중심
  const blueCx = xPos(0.25);
  const blueCy = yPos(0.28);
  const orangeCx = xPos(0.74);
  const orangeCy = yPos(0.76);
  const radR = PW * 0.30;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="100%"
      style={{ display: "block", minWidth: 360, minHeight: 260 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Blue 방사형 그라데이션 */}
        <radialGradient id="sf-blue-radial" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C5C0F0" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#C5C0F0" stopOpacity="0.0" />
        </radialGradient>
        {/* Orange 방사형 그라데이션 */}
        <radialGradient id="sf-orange-radial" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFB692" stopOpacity="0.60" />
          <stop offset="100%" stopColor="#FFB692" stopOpacity="0.0" />
        </radialGradient>
        {/* 플롯 clip */}
        <clipPath id="sf-clip">
          <rect x={PL} y={PT} width={PW} height={PH} />
        </clipPath>
      </defs>

      {/* 배경 */}
      <rect width={W} height={H} fill="#ffffff" rx="12" />

      {/* 방사형 배경 - Blue */}
      <ellipse
        cx={blueCx}
        cy={blueCy}
        rx={radR}
        ry={radR * 0.75}
        fill="url(#sf-blue-radial)"
        clipPath="url(#sf-clip)"
      />
      {/* 방사형 배경 - Orange */}
      <ellipse
        cx={orangeCx}
        cy={orangeCy}
        rx={radR}
        ry={radR * 0.75}
        fill="url(#sf-orange-radial)"
        clipPath="url(#sf-clip)"
      />

      {/* 그리드 수직선 */}
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
      {/* 그리드 수평선 */}
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

      {/* 중간 타원 점선 경계 */}
      <ellipse
        cx={ellipseCx}
        cy={ellipseCy}
        rx={ellipseRx}
        ry={ellipseRy}
        fill="none"
        stroke="#ACAAAD"
        strokeWidth="1.5"
        strokeDasharray="5 4"
        clipPath="url(#sf-clip)"
      />

      {/* Blue 마커 */}
      {blueDots.map(([x, y], i) => {
        const cx = xPos(x);
        const cy = yPos(y);
        return (
          <g key={`b-${i}`} clipPath="url(#sf-clip)">
            <circle cx={cx} cy={cy} r="11" fill="#3A11D8" fillOpacity="0.18" />
            <circle cx={cx} cy={cy} r="6.6" fill="#3A11D8" />
          </g>
        );
      })}

      {/* Orange 마커 */}
      {orangeDots.map(([x, y], i) => {
        const cx = xPos(x);
        const cy = yPos(y);
        return (
          <g key={`o-${i}`} clipPath="url(#sf-clip)">
            <circle cx={cx} cy={cy} r="11" fill="#F06600" fillOpacity="0.22" />
            <circle cx={cx} cy={cy} r="6.6" fill="#F06600" />
          </g>
        );
      })}
    </svg>
  );
}
