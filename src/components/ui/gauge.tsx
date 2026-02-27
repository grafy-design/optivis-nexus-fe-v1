"use client";

import React, { useId } from "react";

interface GaugeProps {
  value: number; // 0~1
  width?: number;
  height?: number;

  strokeWidth?: number;
  filledColor?: string;

  // gap
  gapDegrees?: number; // 총 갭 각도 (ex 20)
  backgroundColor?: string;

  // empty style
  emptyBorderColor?: string;
  borderThickness?: number; // 바깥 검정 보더 두께(추가분)
  hatchColor?: string;
  hatchOpacity?: number;
  hatchSpacing?: number;
  hatchThickness?: number;
  hatchAngle?: number;

  // optional: 빈영역 바탕(피그마 느낌)
  emptyBaseColor?: string;
  emptyBaseOpacity?: number;

  text?: string;
  showIndicator?: boolean; // indicator 표시 여부
  id?: string;
}

export default function Gauge({
  value,
  width = 227,
  height = 135,
  strokeWidth = 25,
  filledColor = "#231F52",

  gapDegrees = 20,
  backgroundColor = "#e7e5e7",

  emptyBorderColor: _emptyBorderColor = "#111111",
  borderThickness: _borderThickness = 4,

  hatchColor = "#111111",
  hatchOpacity = 0.35,
  hatchSpacing = 8,
  hatchThickness = 2,
  hatchAngle = 35,

  emptyBaseColor = "#111111",
  emptyBaseOpacity: _emptyBaseOpacity = 0.06,

  text,
  showIndicator = false,
  id,
}: GaugeProps) {
  // 최소 value는 0.05, 그 이하는 0으로 처리
  const normalizedValue = value <= 0.05 ? 0 : value;
  const v = Math.max(0, Math.min(1, normalizedValue));

  // ✅ hydration-safe ids
  const ridRaw = useId();
  const rid = (id ?? ridRaw).replace(/[^a-zA-Z0-9_-]/g, "");
  const patternId = `hatch-${rid}`;
  const maskId = `mask-${rid}`;

  // geometry
  const padding = strokeWidth / 2 + 6;
  const cx = width / 2;
  const cy = height - padding;
  const r = (width - padding * 2) / 2;

  const startAngle = 180;
  const endAngle = 0;
  const totalAngle = startAngle - endAngle;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const pt = (angle: number) => {
    const rad = toRad(angle);
    return {
      x: cx + r * Math.cos(rad),
      y: cy - r * Math.sin(rad),
    };
  };

  const arc = (a0: number, a1: number) => {
    const p0 = pt(a0);
    const p1 = pt(a1);
    const diff = Math.abs(a1 - a0);
    const largeArcFlag = diff > 180 ? 1 : 0;
    const sweepFlag = 1;
    return `M ${p0.x} ${p0.y} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${p1.x} ${p1.y}`;
  };

  // --- gap trim 방식 ---
  const rawAngle = startAngle - totalAngle * v;
  const hasGap = v > 0 && v < 1;

  // 갭은 총각도. filled/empty 각각 절반씩 트림
  const trim = hasGap ? Math.min(gapDegrees / 2, 40) : 0;

  // ✅ 실제 채워진 arc 끝(갭 바로 앞)
  const filledEndAngle = hasGap ? rawAngle + trim : rawAngle;
  // ✅ 미채움 arc 시작(갭 바로 뒤)
  const emptyStartAngle = hasGap ? rawAngle - trim : rawAngle;

  const filledPath = v > 0 ? arc(startAngle, filledEndAngle) : "";
  const emptyPath = v < 1 ? arc(emptyStartAngle, endAngle) : "";

  // =========================
  // ✅ Indicator 위치는 고정 
  // =========================
  const textY = height;
  const textX = cx;

  const indicatorX = textX - 7.32219;
  const indicatorY = textY - 60;

  // 인디케이터 그룹 안에서 원/화살표의 "기준 중심"
  const indicatorCx = indicatorX + 7.32219;
  const indicatorCy = indicatorY + 10.9906;

  // =========================
  // ✅ 회전은 "고정 인디케이터 -> 갭 중간 지점" 벡터로 계산
  // =========================
  // 갭의 중간 지점 = rawAngle (채워진 arc 끝과 빈 arc 시작 사이)
  const targetAngle = v > 0 && v < 1 ? rawAngle : (v > 0 ? filledEndAngle : startAngle);
  const targetPoint = pt(targetAngle); // 갭 중간 지점 (또는 끝점)

  const dx = targetPoint.x - indicatorCx;
  const dy = targetPoint.y - indicatorCy;

  // 화면 좌표계 그대로 atan2 사용 (dy, dx)
  const angleToTarget = (Math.atan2(dy, dx) * 180) / Math.PI;

  /**
   * 🔧 화살표 SVG path의 "기본 방향" 보정값
   * - 화살표 path는 기본적으로 약 45도(우상향) 느낌이라 보정이 필요함.
   * - 미세한 각도 조정: -35에서 -30 정도로 조정하면 약 5도 보정됨
   */
  const ARROW_BASE_DEG = -35; // 기본 방향 보정(우상향 기준, 미세 조정 가능)
  const indicatorRotation = angleToTarget - ARROW_BASE_DEG; // ✅ 목표방향으로 정렬
  


  return (
    <div className="relative flex-shrink-0" style={{ width, height }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none">
        <defs>
          {/* hatch pattern (fill) */}
          <pattern
            id={patternId}
            patternUnits="userSpaceOnUse"
            width={hatchSpacing}
            height={hatchSpacing}
            patternTransform={`rotate(${hatchAngle})`}
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2={hatchSpacing}
              stroke={hatchColor}
              strokeWidth={hatchThickness}
              opacity={hatchOpacity}
            />
          </pattern>

          {/* ✅ 안쪽(strokeWidth) 영역만 보여주는 마스크 */}
          <mask id={maskId}>
            <rect width={width} height={height} fill="black" />
            {v < 1 && emptyPath && (
              <path
                d={emptyPath}
                stroke="white"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            )}
          </mask>
        </defs>

        {/* EMPTY */}
        {v < 1 && emptyPath && (
          <>
            <path
              d={emptyPath}
              stroke="#111111"
              strokeWidth={strokeWidth}
              strokeOpacity={0.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <path
              d={emptyPath}
              stroke={backgroundColor}
              strokeOpacity={0.9}
              strokeWidth={strokeWidth - 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />

            <g mask={`url(#${maskId})`}>
              <rect width={width} height={height} fill={emptyBaseColor} opacity={0.01} />
              <rect width={width} height={height} fill={`url(#${patternId})`} />
            </g>
          </>
        )}

        {/* FILLED */}
        {v > 0 && filledPath && (
          <path
            d={filledPath}
            stroke={filledColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}

        {/* INDICATOR - 위치 고정, 방향만 "갭 끝점"으로 */}
        {v > 0 && showIndicator && (
          <g transform={`translate(${indicatorX}, ${indicatorY})`}>
            <circle
              cx="7.32219"
              cy="10.9906"
              r="4.43204"
              stroke="#231F52"
              strokeWidth="1.13592"
              fill="none"
            />
            <g transform={`rotate(${indicatorRotation} 7.32219 10.9906)`}>
              <path
                d="M15.1923 4.54988C15.8644 4.69679 16.3266 5.31508 16.2772 6.00128L16.1363 7.95936C16.0443 9.23747 14.4145 9.715 13.6474 8.68863L11.8704 6.31135C11.1032 5.28499 12.0226 3.85707 13.2744 4.13069L15.1923 4.54988Z"
                fill="black"
                fillOpacity="0.5"
              />
            </g>
          </g>
        )}

        {/* TEXT */}
        {text !== undefined && (
          <text x={cx} y={height} textAnchor="middle" fill="#1b1b1b" className="text-h2">
            {text}
          </text>
        )}
      </svg>
    </div>
  );
}
