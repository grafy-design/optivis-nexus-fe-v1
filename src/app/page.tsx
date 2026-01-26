"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import FeatureSection from "@/components/home/feature-section";
import HeroPanel from "@/components/home/hero-panel";
import SimulationSearch from "@/components/home/simulation-search";
import SimulationTable from "@/components/home/simulation-table";

// Service 인터페이스
interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  selectedIcon?: string;
  variant?: "glass" | "solid" | "purple";
}

// Package 인터페이스
interface Package {
  id: string;
  title: string;
  description: string;
  icon: string;
  selectedIcon?: string;
  services: Service[];
}

// 오른쪽 패널 콘텐츠 인터페이스
interface RightPanelContent {
  title: string;
  description: string;
  imageUrl: string;
}

// Mock data - Package와 Service 관계 정의
const packages: Package[] = [
  {
    id: "1",
    title: "Twin Predict",
    description: "Simulates individual patient outcomes under various treatment conditions. Offers tailored response probabilities and treatment recommendations for clinical decision-making.",
    icon: "/assets/icons/twin-predict.svg",
    selectedIcon: "/assets/icons/twin-predict-selected.svg",
    services: [
      // Twin Predict의 서비스들 (추후 추가 예정)
    ],
  },
  {
    id: "2",
    title: "Trial Optimizer",
    description: "Generates optimal clinical trial design strategies through repeated simulations across diverse trial design conditions.",
    icon: "/assets/icons/trial-optimizer.svg",
    selectedIcon: "/assets/icons/trial-optimizer-selected.svg",
    services: [
      {
        id: "4",
        title: "Adaptive Trial Simulation",
        description: "Generates optimal clinical trial design strategies through repeated simulations across diverse trial design conditions.",
        icon: "/assets/icons/adaptive-trial.svg",
        selectedIcon: "/assets/icons/adaptive-trial-selected.svg",
        variant: "glass" as const,
      },
      {
        id: "5",
        title: "Target Subgroup Identification",
        description: "Simulates individual patient outcomes under various treatment conditions. Offers tailored response probabilities and treatment recommendations for clinical decision-making.",
        icon: "/assets/icons/target-subgroup.svg",
        variant: "glass" as const,
      },
      {
        id: "6",
        title: "Drug Response Prediction Dashboard",
        description: "Supports early trial design by identifying target subgroups and simulating different scenarios. Helps sponsors reduce sample size, optimize power, and refine study strategies.",
        icon: "/assets/icons/drug-response.svg",
        selectedIcon: "/assets/icons/drug-response-selected.svg",
        variant: "purple" as const,
      },
    ],
  },
  {
    id: "3",
    title: "Virtual Control",
    description: "Supports early trial design by identifying target subgroups and simulating different scenarios. Helps sponsors reduce sample size, optimize power, and refine study strategies.",
    icon: "/assets/icons/virtual-control.svg",
    selectedIcon: "/assets/icons/virtual-control-selected.svg",
    services: [
      // Virtual Control의 서비스들 (추후 추가 예정)
    ],
  },
];

// Service ID와 오른쪽 패널 콘텐츠 매핑
const serviceContentMap: Record<string, RightPanelContent> = {
  "4": {
    title: "Adaptive Trial Simulation",
    description: "Generates optimal clinical trial design strategies through repeated simulations across diverse trial design conditions.",
    imageUrl: "/assets/main/adaptive-trial.png",
  },
  "6": {
    title: "Conditional Drug Response Prediction",
    description: "Drug level simulation based on patient baseline information and Simulation Settings, with support for multiple conditions per scenario",
    imageUrl: "/assets/main/conditional-drug.png",
  },
  // 다른 서비스들의 콘텐츠는 추후 추가
};

export default function HomePage() {
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  // 선택된 Package에 해당하는 Service 목록 가져오기
  const selectedPackage = packages.find(p => p.id === selectedPackageId);
  const availableServices = selectedPackage?.services || [];

  // 선택된 Service의 콘텐츠 가져오기
  const rightPanelContent = selectedServiceId && serviceContentMap[selectedServiceId]
    ? serviceContentMap[selectedServiceId]
    : null;

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackageId(packageId === selectedPackageId ? null : packageId);
    setSelectedServiceId(null); // Package 변경 시 Service 선택 초기화
  };

  const handleServiceSelect = (serviceId: string) => {
    setSelectedServiceId(serviceId === selectedServiceId ? null : serviceId);
  };

  return (
    <AppLayout>
      <div className="grid grid-cols-[400px_400px_1fr] gap-4 w-full box-border max-w-full">
        {/* Left Column - Package */}
        <div className="w-full min-w-0 overflow-hidden">
          <FeatureSection
            title="01 Package"
            features={packages.map(pkg => ({
              id: pkg.id,
              title: pkg.title,
              description: pkg.description,
              icon: pkg.icon,
              selectedIcon: pkg.selectedIcon,
            }))}
            selectedId={selectedPackageId}
            onSelect={handlePackageSelect}
          />
        </div>

        {/* Middle Column - Service */}
        <div className="w-full min-w-0 overflow-hidden">
          <FeatureSection
            title="02 Service"
            features={availableServices}
            selectedId={selectedServiceId}
            onSelect={handleServiceSelect}
          />
        </div>

        {/* Right Column - Hero + Table */}
        <div 
          className="w-full min-w-0 overflow-hidden relative"
          style={{
            backgroundImage: 'url(/assets/main/detail.png)',
            backgroundSize: '930px 936px',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            width: '930px',
            height: '936px',
          }}
        >
          {rightPanelContent ? (
            <div className="flex flex-col justify-between w-full h-full p-[20px] min-h-[936px]">
              <HeroPanel
                title={rightPanelContent.title}
                description={rightPanelContent.description}
                imageUrl={rightPanelContent.imageUrl}
                serviceId={selectedServiceId}
              />
              <div className="flex flex-col gap-[20px]">
                <SimulationSearch />
                <SimulationTable serviceId={selectedServiceId} />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full h-full min-h-[936px] p-[20px]">
              <p className="text-body4 text-[#828993]">
                {selectedPackageId ? "Service를 선택해주세요." : "Package를 선택해주세요."}
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}



