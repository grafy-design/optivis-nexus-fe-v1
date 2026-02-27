"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import FeatureSection from "@/components/home/feature-section";
import HeroPanel from "@/components/home/hero-panel";
import SimulationSearch from "@/components/home/simulation-search";
import SimulationTable from "@/components/home/simulation-table";
import { useHomeStore } from "@/store/homeStore";
import { ChangeEventHandler, useState } from "react";

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
  videoUrl?: string; // 영상 URL 필드 추가
  videoStartOffsetSeconds?: number;
  videoPlaybackRate?: number;
  videoScale?: number;
  videoReverseLoop?: boolean;
}
// Mock data - Package와 Service 관계 정의
const packages: Package[] = [
  {
    id: "1",
    title: "Twin Predict",
    description:
      "Simulates individual patient outcomes under various treatment conditions. Offers tailored response probabilities and treatment recommendations for clinical decision-making.",
    icon: "/assets/icons/twin-predict.svg",
    selectedIcon: "/assets/icons/twin-predict-selected.svg",
    services: [
      // Twin Predict의 서비스들 (추후 추가 예정)
    ],
  },
  {
    id: "2",
    title: "Trial Optimizer",
    description:
      "Generates optimal clinical trial design strategies through repeated simulations across diverse trial design conditions.",
    icon: "/assets/icons/trial-optimizer.svg",
    selectedIcon: "/assets/icons/trial-optimizer-selected.svg",
    services: [
      {
        id: "4",
        title: "Adaptive Trial Simulation",
        description:
          "Generates optimal clinical trial design strategies through repeated simulations across diverse trial design conditions.",
        icon: "/assets/icons/adaptive-trial.svg",
        selectedIcon: "/assets/icons/adaptive-trial-selected.svg",
        variant: "glass" as const,
      },
      {
        id: "5",
        title: "Target Subgroup Identification",
        description:
          "Simulates individual patient outcomes under various treatment conditions. Offers tailored response probabilities and treatment recommendations for clinical decision-making.",
        icon: "/assets/icons/target-subgroup.svg",
        variant: "glass" as const,
      },
      {
        id: "6",
        title: "Drug Response Prediction Dashboard",
        description:
          "Supports early trial design by identifying target subgroups and simulating different scenarios. Helps sponsors reduce sample size, optimize power, and refine study strategies.",
        icon: "/assets/icons/drug-response.svg",
        selectedIcon: "/assets/icons/drug-response-selected.svg",
        variant: "purple" as const,
      },
    ],
  },
  {
    id: "3",
    title: "Virtual Control",
    description:
      "Supports early trial design by identifying target subgroups and simulating different scenarios. Helps sponsors reduce sample size, optimize power, and refine study strategies.",
    icon: "/assets/icons/virtual-control.svg",
    selectedIcon: "/assets/icons/virtual-control-selected.svg",
    services: [
      // Virtual Control의 서비스들 (추후 추가 예정)
    ],
  },
];

// Service ID와 오른쪽 패널 콘텐츠 매핑 (구조 동일, 문구·히어로 이미지만 서비스별로 다름)
const serviceContentMap: Record<string, RightPanelContent> = {
  "4": {
    title: "Adaptive Trial\nSimulation",
    description:
      "Generates optimal clinical trial design strategies through repeated simulations across diverse trial design conditions.",
    imageUrl: "/assets/main/adaptive-trial.png",
    videoUrl: "https://pub-3377f1e9ee784694b74b0068ec6e1fa3.r2.dev/oprimed/2-1%20ATS.webm",
    videoPlaybackRate: 0.8,
    videoScale: 1.06,
    videoReverseLoop: true,
  },
  "5": {
    title: "Target Subgroup\nIdentification",
    description:
      "Simulates individual patient outcomes under various treatment conditions. Offers tailored response probabilities and treatment recommendations for clinical decision-making.",
    imageUrl: "/assets/main/target-subgroup-identification.png",
    videoUrl: "https://pub-3377f1e9ee784694b74b0068ec6e1fa3.r2.dev/oprimed/2-2%20TSI.webm",
    videoPlaybackRate: 0.8,
    videoScale: 1.06,
    videoReverseLoop: true,
  },
  "6": {
    title: "Conditional Drug\nResponse Prediction",
    description:
      "Drug level simulation based on patient baseline information and Simulation Settings, with support for multiple conditions per scenario",
    imageUrl: "/assets/main/conditional-drug.png",
    videoUrl: "https://pub-3377f1e9ee784694b74b0068ec6e1fa3.r2.dev/oprimed/2-3%20DRD.webm",
    videoPlaybackRate: 0.8,
    videoScale: 1.06,
    videoReverseLoop: true,
  },
};

export default function HomePage() {
  const { selectedPackageId, selectedServiceId, setSelectedPackageId, setSelectedServiceId } =
    useHomeStore();

  const [keyword, setKeyword] = useState("");

  const onChangeKeyword: ChangeEventHandler<HTMLInputElement> = (e) => {
    setKeyword(e.currentTarget.value);
  };

  // 선택된 Package에 해당하는 Service 목록 가져오기
  const selectedPackage = packages.find((p) => p.id === selectedPackageId);
  const availableServices = selectedPackage?.services || [];

  // 선택된 Service의 콘텐츠 가져오기
  const rightPanelContent =
    selectedServiceId && serviceContentMap[selectedServiceId]
      ? serviceContentMap[selectedServiceId]
      : null;

  const handlePackageSelect = (packageId: string) => {
    const newPackageId = packageId === selectedPackageId ? null : packageId;
    setSelectedPackageId(newPackageId);
    setSelectedServiceId(null); // Package 변경 시 Service 선택 초기화
  };

  const handleServiceSelect = (serviceId: string) => {
    const newServiceId = serviceId === selectedServiceId ? null : serviceId;
    setSelectedServiceId(newServiceId);
  };

  return (
    <AppLayout>
      <div className="box-border grid w-full max-w-full grid-cols-[400px_400px_1fr] gap-4">
        {/* Left Column - Package */}
        <div className="w-full min-w-0 overflow-hidden">
          <FeatureSection
            title="01 Package"
            features={packages.map((pkg) => ({
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
          className="relative w-full min-w-0 overflow-hidden"
          style={{
            backgroundImage: "url(/assets/main/detail.png)",
            backgroundSize: "930px 936px",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            width: "930px",
            height: "936px",
          }}
        >
          {rightPanelContent ? (
            <div className="flex h-full min-h-[936px] w-full flex-col justify-between p-[20px]">
              <HeroPanel
                title={rightPanelContent.title}
                description={rightPanelContent.description}
                imageUrl={rightPanelContent.imageUrl}
                serviceId={selectedServiceId}
                videoUrl={rightPanelContent.videoUrl}
                videoPlaybackRate={rightPanelContent.videoPlaybackRate}
                videoScale={rightPanelContent.videoScale}
                videoReverseLoop={rightPanelContent.videoReverseLoop}
              />
              <div className="flex flex-col gap-[20px]">
                <SimulationSearch keyword={keyword} onChangeKeyword={onChangeKeyword} />
                <SimulationTable serviceId={selectedServiceId} keyword={keyword} />
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[936px] w-full items-center justify-center p-[20px]">
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
