"use client";

import FeatureCard from "./feature-card";

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  selectedIcon?: string;
  variant?: "glass" | "solid" | "purple";
}

interface FeatureSectionProps {
  title: string;
  features: Feature[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

export default function FeatureSection({
  title,
  features,
  selectedId: externalSelectedId,
  onSelect: externalOnSelect,
}: FeatureSectionProps) {
  const handleCardClick = (id: string) => {
    if (externalOnSelect) {
      externalOnSelect(id);
    }
  };

  // 외부에서 선택 상태를 관리하는 경우 사용, 없으면 내부 상태 사용 안함
  const selectedId = externalSelectedId;

  // title을 기준으로 섹션 타입 결정
  const sectionType = title.includes("Package") ? "package" : "service";

  return (
    <div className="flex flex-col w-full max-w-[400px]">
      {/* Card Container with Background */}
      <div 
        className="relative rounded-[18px] overflow-hidden w-full h-[936px] max-w-full"
        style={{
          backgroundImage: 'url(/assets/main/card-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="flex flex-col w-full h-full p-[20px]">
      {/* Header */}
          <div className="mb-4 w-full">
            <div className="flex items-center gap-3 mb-4 w-full">
          <span className="text-body2 text-[#5f5e5e]">
            {title.split(" ")[0]}
          </span>
              <span className="text-body2m text-[#5f5e5e]">
            {title.split(" ").slice(1).join(" ")}
          </span>
        </div>
        <div className="w-full h-px bg-[#929090]" />
      </div>

      {/* Feature Cards */}
          <div className="flex flex-col gap-[20px] w-full flex-1">
        {features.map((feature) => (
          <div key={feature.id} className="w-full">
            <FeatureCard
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
                  selectedIcon={feature.selectedIcon}
              variant={feature.variant || "glass"}
                  isSelected={selectedId === feature.id}
                  onClick={() => handleCardClick(feature.id)}
                  sectionType={sectionType}
            />
          </div>
        ))}
          </div>
        </div>
      </div>
    </div>
  );
}

