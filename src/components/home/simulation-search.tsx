"use client";

interface SimulationSearchProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Figma 스펙 기반 SimulationSearch
 *
 * Search Field: 408×48px HORIZONTAL
 * bg white, r=30, padding 좌우 24px, 상하 12px
 * 내부 gap: 10.24px
 * 아이콘: 23×23px (검색 아이콘 #929090)
 * 텍스트: "Search" Inter 600 19.5px #929090
 */
export default function SimulationSearch({ value, onChange }: SimulationSearchProps) {
  return (
    <div
      className="flex items-center"
      style={{
        width: "min(408px, 100%)",
        height: "48px",
        backgroundColor: "#FFFFFF",
        borderRadius: "30px",
        paddingLeft: "24px",
        paddingRight: "24px",
        paddingTop: "12px",
        paddingBottom: "12px",
        gap: "10.24px",
        flexShrink: 0,
      }}
    >
      {/* Search icon - Figma: 20.45×20.64px, color #929090 */}
      <svg
        className="home-simulation-search-icon"
        width="23"
        height="23"
        viewBox="0 0 23 23"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <circle
          cx="10"
          cy="10"
          r="6.5"
          stroke="#929090"
          strokeWidth="1.8"
        />
        <path
          d="M15 15L20 20"
          stroke="#929090"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>

      <input
        className="home-simulation-search-text"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search"
        style={{
          fontFamily: "Inter",
          fontSize: "19.5px",
          fontWeight: 600,
          lineHeight: "100%",
          letterSpacing: "-0.585px",
          color: "#929090",
          width: "100%",
          border: "none",
          background: "transparent",
          outline: "none",
        }}
      />

      <style jsx>{`
        /* [TEMP_SCALE_MODE_DISABLE] 차후 반응형 작업 시 복구
        @media (max-width: 1800px) {
          .home-simulation-search-icon {
            width: 20px !important;
            height: 20px !important;
          }

          .home-simulation-search-text {
            font-size: 16.5px !important;
          }
        }
        */
      `}</style>
    </div>
  );
}
