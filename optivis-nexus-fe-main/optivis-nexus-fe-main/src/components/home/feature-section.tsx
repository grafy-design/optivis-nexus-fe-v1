"use client";

import FeatureCard from "./feature-card";
import { cn } from "@/lib/cn";

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  selectedIcon?: string;
  variant?: "glass" | "solid" | "purple";
  locked?: boolean;
  disabled?: boolean;
}

interface FeatureSectionProps {
  title: string;
  features: Feature[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  slotRows?: number;
  maxVisibleFeatures?: number;
}

export default function FeatureSection({
  title,
  features,
  selectedId: externalSelectedId,
  onSelect: externalOnSelect,
  slotRows,
  maxVisibleFeatures,
}: FeatureSectionProps) {
  const handleCardClick = (feature: Feature) => {
    if (feature.disabled) {
      return;
    }

    if (externalOnSelect) {
      externalOnSelect(feature.id);
    }
  };

  const selectedId = externalSelectedId;
  const sectionType = title.includes("Package") ? "package" : "service";
  const panelClass = sectionType === "package" ? "figma-home-panel-left" : "figma-home-panel-middle";
  const displayedFeatures =
    typeof maxVisibleFeatures === "number" && maxVisibleFeatures > 0
      ? features.slice(0, maxVisibleFeatures)
      : features;
  const shouldUseSlotLayout = typeof slotRows === "number" && slotRows > 0;

  // Figma: 섹션 번호/이름 파싱 ("01 Package" -> "01", "Package")
  const parts = title.split(" ");
  const sectionNum = parts[0];   // "01" or "02"
  const sectionName = parts.slice(1).join(" "); // "Package" or "Service"

  return (
    /*
     * Figma: Frame 1618872466 / Frame 1618872472
     * 470px(package) / 469px(service) × 1200px
     * padding: 28px, gap: 16px
     * bg: Liquid Glass (Fill #F5F5F5 r=36 + Glass Effect white r=36)
     */
    <div
      className={cn("relative flex flex-col figma-nine-slice", panelClass)}
      style={{
        width: "100%",
        flex: 1,
        minHeight: 0,
        padding: "28px",
        gap: "16px",
        borderRadius: "36px",
        overflow: "hidden",
      }}
    >
      {/* Header: "01 Package" / "02 Service" */}
      {/* Figma: Group - 숫자(Inter 500 17px #5F5E5E) + gap + 이름(Inter 500 17px #5F5E5E) */}
      <div
        className="flex flex-col"
        style={{ gap: "12px", flexShrink: 0 }}
      >
        <div className="flex items-center" style={{ gap: "20.6px" }}>
          <span
            className="home-feature-section-text"
            style={{
              fontFamily: "Inter",
              fontSize: "17px",
              fontWeight: 500,
              lineHeight: "19px",
              color: "#5F5E5E",
            }}
          >
            {sectionNum}
          </span>
          <span
            className="home-feature-section-text"
            style={{
              fontFamily: "Inter",
              fontSize: "17px",
              fontWeight: 500,
              lineHeight: "19px",
              color: "#5F5E5E",
            }}
          >
            {sectionName}
          </span>
        </div>
        {/* Figma: Line 806/807 - 414px, color #929090 */}
        <div
          style={{
            width: "100%",
            height: "1px",
            backgroundColor: "#929090",
            flexShrink: 0,
          }}
        />
      </div>

      {/* Feature Cards: gap=16px */}
      <div
        className={cn(shouldUseSlotLayout ? "grid" : "flex flex-col")}
        style={
          shouldUseSlotLayout
            ? {
                gridTemplateRows: `repeat(${slotRows}, minmax(0, 1fr))`,
                gap: "16px",
                flex: 1,
                minHeight: 0,
                overflow: "hidden",
              }
            : {
                gap: "16px",
                flex: 1,
                overflowY: "auto",
                minHeight: 0,
              }
        }
      >
        {displayedFeatures.map((feature) => (
          <div key={feature.id} style={{ minHeight: 0, display: shouldUseSlotLayout ? "flex" : "block" }}>
            <FeatureCard
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              selectedIcon={feature.selectedIcon}
              variant={feature.variant || "glass"}
              isSelected={!feature.disabled && selectedId === feature.id}
              onClick={() => handleCardClick(feature)}
              sectionType={sectionType}
              locked={feature.locked}
              disabled={feature.disabled}
            />
          </div>
        ))}
      </div>

      <style jsx>{`
        /* [TEMP_SCALE_MODE_DISABLE] 차후 반응형 작업 시 복구
        @media (max-width: 1800px) {
          .home-feature-section-text {
            font-size: 14px !important;
          }
        }
        */
      `}</style>
    </div>
  );
}
