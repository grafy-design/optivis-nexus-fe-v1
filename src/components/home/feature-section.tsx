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
      className={cn("relative flex flex-col figma-nine-slice gap-3 h-full w-full flex-1 min-h-0 p-6 pt-5 pb-8", panelClass)}
    >
      {/* Header: "01 Package" / "02 Service" */}
      {/* Figma: Group - 숫자(Inter 500 17px #5F5E5E) + gap + 이름(Inter 500 17px #5F5E5E) */}
      <div
        className="flex flex-col gap-2 flex-shirink-0 pt-2 pl-1"
      >
        <div className="flex items-center gap-4">
          <span className="home-feature-section-text text-body4m text-[var(--text-secondary)]">
            {sectionNum}
          </span>
          <span className="home-feature-section-text text-body4m text-[var(--text-secondary)] ">
            {sectionName}
          </span>
        </div>
        {/* Figma: Line 806/807 - 414px, color #929090 */}
        <div className="w-full shrink-0 h-px bg-neutral-50" />
      </div>

      {/* Feature Cards: gap=16px */}
      <div
        className={cn("gap-2", shouldUseSlotLayout ? "grid flex-1 min-h-0 overflow-hidden" : "flex flex-col flex-1 overflow-y-auto min-h-0")}
        style={
          shouldUseSlotLayout
            ? {
                gridTemplateRows: `repeat(${slotRows}, minmax(0, 1fr))`,
              }
            : undefined
        }
      >
        {displayedFeatures.map((feature) => (
          <div key={feature.id} className={cn("min-h-0", shouldUseSlotLayout ? "flex" : "block")}>
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
