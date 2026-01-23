"use client";

import { cn } from "@/lib/cn";
import Card from "@/components/ui/card";
import Image from "next/image";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  selectedIcon?: string;
  variant?: "glass" | "solid" | "purple";
  isSelected?: boolean;
  onClick?: () => void;
  sectionType?: "package" | "service";
}

export default function FeatureCard({
  title,
  description,
  icon,
  selectedIcon,
  variant = "glass",
  isSelected = false,
  onClick,
  sectionType = "package",
}: FeatureCardProps) {
  // 선택된 상태와 섹션 타입에 따라 배경 이미지 변경
  const backgroundImage = isSelected 
    ? sectionType === "service" 
      ? 'url(/assets/main/card-bg2.png)'
      : 'url(/assets/main/card-bg-select.png)'
    : 'url(/assets/main/card-bg1.png)';
  
  // 선택된 상태일 때 selectedIcon을 사용, 없으면 icon 사용
  const iconSrc = isSelected && selectedIcon ? selectedIcon : icon;
  
  // 선택된 상태에 따라 텍스트 색상 변경 (Service는 선택되어도 텍스트 색상 변경 안함)
  const textColor = isSelected && sectionType === "package" ? "text-[#fafafa]" : "text-[#000000]";
  const descColor = isSelected && sectionType === "package" ? "text-[#fafafa]" : "text-[#1c1b1b]";

  return (
    <div 
      className="relative rounded-[18px] overflow-hidden w-[360px] h-[266px] cursor-pointer"
      style={{
        backgroundImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      onClick={onClick}
    >
      <div className="flex flex-col gap-6 w-full h-full p-7">
        {/* Icon + Title */}
        <div className="flex items-center gap-4 w-full min-w-0">
          <div className="flex-shrink-0">
            <Image
              src={iconSrc}
              alt={title}
              width={50}
              height={50}
              className="object-contain"
            />
          </div>
          <div className={`text-h4 ${textColor} flex-1 min-w-0 break-words`}>
            {title}
          </div>
        </div>

        {/* Description */}
        <p className={`text-body5 ${descColor} w-full break-words`}>
          {description}
        </p>
      </div>
    </div>
  );
}

