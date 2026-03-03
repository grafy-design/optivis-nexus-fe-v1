"use client";

/**
 * Drug Responsiveness Chart
 * - 좌상단 Orange zone (대각선 위): High Responders / Subgroup
 * - 우하단 Blue zone (대각선 아래): Low Responders / Overall
 * - 대각선: 좌상(0,1) → 우하(1,0)
 */
export default function DrugResponsivenessChart() {
  const W = 816;
  const H = 586;

  const PL = 0, PT = 0, PR = 816, PB = 586;
  const PW = PR - PL;
  const PH = PB - PT;

  const xPos = (v: number) => PL + v * PW;
  const yPos = (v: number) => PB - v * PH; // 0=하단, 1=상단

  // 대각선: 좌하(0,0) → 우상(1,1) (원본 방향 유지)
  const dx1 = xPos(0);
  const dy1 = yPos(0);
  const dx2 = xPos(1);
  const dy2 = yPos(1);

  // Orange zone: 대각선 위쪽 (좌상단 삼각형 — 좌하→좌상→우상)
  const orangeTriPath = `M ${xPos(0)},${yPos(0)} L ${xPos(0)},${yPos(1)} L ${xPos(1)},${yPos(1)} Z`;
  // Blue zone: 대각선 아래쪽 (우하단 삼각형 — 좌하→우상→우하)
  const blueTriPath   = `M ${xPos(0)},${yPos(0)} L ${xPos(1)},${yPos(1)} L ${xPos(1)},${yPos(0)} Z`;

  const gridCols = 6;
  const gridRows = 6;

  // Orange 점: 대각선 바로 위쪽에 밀집 (대각선 근방 상단)
  const orangeDots: [number, number][] = [
    [0.34, 0.52],
    [0.42, 0.62],
    [0.28, 0.62],
    [0.38, 0.72],
    [0.48, 0.68],
    [0.22, 0.54],
    [0.44, 0.56],
    [0.32, 0.76],
    [0.50, 0.78],
    [0.26, 0.68],
    [0.40, 0.84],
    [0.54, 0.72],
  ];

  // Blue 점: 대각선 바로 아래쪽에 밀집 (대각선 근방 하단)
  const blueDots: [number, number][] = [
    [0.52, 0.34],
    [0.60, 0.44],
    [0.46, 0.28],
    [0.64, 0.36],
    [0.56, 0.50],
    [0.70, 0.46],
    [0.48, 0.42],
    [0.66, 0.28],
    [0.74, 0.56],
    [0.58, 0.22],
    [0.76, 0.38],
    [0.62, 0.58],
    [0.44, 0.18],
    [0.68, 0.64],
  ];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="100%"
      style={{ display: "block", minWidth: 360, minHeight: 260 }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Orange zone 그라데이션: 좌상단 진하게 */}
        <linearGradient id="dr-orange-tri" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#FFB692" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#FFB692" stopOpacity="0.55" />
        </linearGradient>
        {/* Blue zone 그라데이션: 우하단 진하게 */}
        <linearGradient id="dr-blue-tri" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C5C0F0" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#C5C0F0" stopOpacity="0.50" />
        </linearGradient>
        <clipPath id="dr-clip">
          <rect x={PL} y={PT} width={PW} height={PH} />
        </clipPath>
      </defs>

      {/* 배경 */}
      <rect width={W} height={H} fill="#ffffff" rx="12" />

      {/* Zone fill */}
      <path d={orangeTriPath} fill="url(#dr-orange-tri)" clipPath="url(#dr-clip)" />
      <path d={blueTriPath}   fill="url(#dr-blue-tri)"   clipPath="url(#dr-clip)" />

      {/* 그리드 수직선 */}
      {Array.from({ length: gridCols + 1 }).map((_, i) => (
        <line key={`vc-${i}`}
          x1={PL + (i / gridCols) * PW} y1={PT}
          x2={PL + (i / gridCols) * PW} y2={PB}
          stroke="#E8E7EC" strokeWidth="1"
        />
      ))}
      {/* 그리드 수평선 */}
      {Array.from({ length: gridRows + 1 }).map((_, i) => (
        <line key={`hr-${i}`}
          x1={PL} y1={PT + (i / gridRows) * PH}
          x2={PR} y2={PT + (i / gridRows) * PH}
          stroke="#E8E7EC" strokeWidth="1"
        />
      ))}

      {/* 대각 구분선 (좌상→우하) */}
      <line
        x1={dx1} y1={dy1} x2={dx2} y2={dy2}
        stroke="#ACAAAD" strokeWidth="1.2"
        clipPath="url(#dr-clip)"
      />

      {/* Orange 마커 (좌상단) */}
      {orangeDots.map(([x, y], i) => {
        const cx = xPos(x);
        const cy = yPos(y);
        return (
          <g key={`o-${i}`} clipPath="url(#dr-clip)">
            <circle cx={cx} cy={cy} r="11" fill="#F06600" fillOpacity="0.22" />
            <circle cx={cx} cy={cy} r="6.6" fill="#F06600" />
          </g>
        );
      })}

      {/* Blue 마커 (우하단) */}
      {blueDots.map(([x, y], i) => {
        const cx = xPos(x);
        const cy = yPos(y);
        return (
          <g key={`b-${i}`} clipPath="url(#dr-clip)">
            <circle cx={cx} cy={cy} r="11" fill="#3A11D8" fillOpacity="0.18" />
            <circle cx={cx} cy={cy} r="6.6" fill="#3A11D8" />
          </g>
        );
      })}
    </svg>
  );
}
