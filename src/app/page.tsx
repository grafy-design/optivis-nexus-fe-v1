"use client";

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import FeatureSection from "@/components/home/feature-section";
import HeroPanel from "@/components/home/hero-panel";
import PackageVideoPanel from "@/components/home/package-video-panel";
import SimulationSearch from "@/components/home/simulation-search";
import SimulationTable from "@/components/home/simulation-table";
import { useHomeStore } from "@/store/homeStore";
import { useDefaultSettingStore } from "@/store/defaultSettingStore";

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  selectedIcon?: string;
  variant?: "glass" | "solid" | "purple";
  locked?: boolean;
  disabled?: boolean;
}

interface Package {
  id: string;
  title: string;
  description: string;
  icon: string;
  selectedIcon?: string;
  services: Service[];
}

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

const packages: Package[] = [
  {
    id: "1",
    title: "Twin Predict",
    description:
      "Simulates individual patient outcomes under various treatment conditions. Offers tailored response probabilities and treatment recommendations for clinical decision-making.",
    icon: "/assets/icons/twin-predict.svg",
    selectedIcon: "/assets/icons/twin-predict-selected.svg",
    services: [
      {
        id: "7",
        title: "Patient Outcome Prediction",
        description:
          "Simulates individual patient outcomes under various treatment conditions. Offers tailored response probabilities and treatment recommendations for clinical decision-making.",
        icon: "/assets/icons/twin-predict.svg", // Reusing parent icon temporarily
        variant: "glass" as const,
        selectedIcon: "/assets/icons/twin-predict-selected.svg",
        locked: true,
        disabled: true,
      },
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
        variant: "glass" as const,
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
      {
        id: "8",
        title: "Synthetic Control Arm",
        description:
          "Generates a synthetic control group based on historical data to compare with the experimental arm, reducing the need for placebo patients.",
        icon: "/assets/icons/virtual-control.svg", // Reusing parent icon temporarily
        variant: "glass" as const,
        selectedIcon: "/assets/icons/virtual-control-selected.svg",
        locked: true,
        disabled: true,
      },
      {
        id: "9",
        title: "Historical Data Analysis",
        description:
          "Analyzes historical clinical trial data to inform current study design and predict potential outcomes.",
        icon: "/assets/icons/virtual-control.svg", // Reusing parent icon temporarily
        variant: "glass" as const,
        selectedIcon: "/assets/icons/virtual-control-selected.svg",
        locked: true,
        disabled: true,
      },
    ],
  },
];

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
  "7": {
    title: "Patient Outcome\nPrediction",
    description:
      "Simulates individual patient outcomes under various treatment conditions. Offers tailored response probabilities and treatment recommendations for clinical decision-making.",
    imageUrl: "/assets/main/adaptive-trial.png",
  },
  "8": {
    title: "Synthetic Control\nArm",
    description:
      "Generates a synthetic control group based on historical data to compare with the experimental arm, reducing the need for placebo patients.",
    imageUrl: "/assets/main/target-subgroup-identification.png",
  },
  "9": {
    title: "Historical Data\nAnalysis",
    description:
      "Analyzes historical clinical trial data to inform current study design and predict potential outcomes.",
    imageUrl: "/assets/main/conditional-drug.png",
  },

};

const packageContentMap: Record<string, RightPanelContent> = {
  "1": {
    title: "Twin Predict",
    description:
      "Simulates individual patient outcomes under various treatment conditions. Offers tailored response probabilities and treatment recommendations for clinical decision-making.",
    imageUrl: "", // Not used for package video
    videoUrl: "https://pub-797907feee5143c4a0f4f34c25916ee8.r2.dev/oprimed_movie/2-to.mp4",
    videoStartOffsetSeconds: 3,
    videoPlaybackRate: 0.8,
    videoScale: 1.08,
  },
  "2": {
    title: "Trial Optimizer",
    description:
      "Generates optimal clinical trial design strategies through repeated simulations across diverse trial design conditions.",
    imageUrl: "",
    videoUrl: "https://pub-797907feee5143c4a0f4f34c25916ee8.r2.dev/oprimed_movie/1-tp.mp4",
    videoStartOffsetSeconds: 1,
    videoPlaybackRate: 0.8,
    videoScale: 1.24,
    videoReverseLoop: true,
  },
  "3": {
    title: "Virtual Control",
    description:
      "Supports early trial design by identifying target subgroups and simulating different scenarios. Helps sponsors reduce sample size, optimize power, and refine study strategies.",
    imageUrl: "",
    videoUrl: "https://pub-797907feee5143c4a0f4f34c25916ee8.r2.dev/oprimed_movie/3-vc.mp4",
  },
};

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");

  const {
    selectedPackageId,
    selectedServiceId,
    setSelectedPackageId,
    setSelectedServiceId,
  } = useHomeStore();

  const { savedSimulations } = useDefaultSettingStore();

  const selectedPackage = packages.find((p) => p.id === selectedPackageId);
  const availableServices = selectedPackage?.services || [];

  const rightPanelContent =
    selectedServiceId && serviceContentMap[selectedServiceId]
      ? serviceContentMap[selectedServiceId]
      : null;

  const handlePackageSelect = (packageId: string) => {
    if (packageId === selectedPackageId) {
      return;
    }

    setSelectedPackageId(packageId);
    setSelectedServiceId(null);
  };

  const handleServiceSelect = (serviceId: string) => {
    const newServiceId = serviceId === selectedServiceId ? null : serviceId;
    setSelectedServiceId(newServiceId);
  };

  return (
    <AppLayout>
      <div
        style={{
          display: "flex",
          gap: "1.986px",
          width: "100%",
          flex: 1,          /* 부모(main) flex-1로 100% 높이 */
          alignItems: "stretch",
          minHeight: 0,
        }}
      >
        {/* ── 왼쪽: Package (Figma 470/2391 = 19.66%) ── */}
        <div style={{
          flex: "470 1 0",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          minWidth: "250px",
        }}>
          <FeatureSection
            title="01 Package"
            features={packages.map((pkg) => ({
              id: pkg.id,
              title: pkg.title,
              description: pkg.description,
              icon: pkg.icon,
              selectedIcon: pkg.selectedIcon,
              locked: pkg.id === "1" || pkg.id === "3",
            }))}
            selectedId={selectedPackageId}
            onSelect={handlePackageSelect}
            slotRows={packages.length}
            maxVisibleFeatures={packages.length}
          />
        </div>

        {/* ── 가운데: Service (Figma 469/2391 = 19.62%) ── */}
        <div style={{
          flex: "469 1 0",
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          minWidth: "250px",
        }}>
          <FeatureSection
            title="02 Service"
            features={availableServices}
            selectedId={selectedServiceId}
            onSelect={handleServiceSelect}
            slotRows={3}
            maxVisibleFeatures={3}
          />
        </div>

        {/* ── 오른쪽: Hero + Table (나머지 ~60.7%) ── */}
        {/*
         * Figma: Fill #F5F5F5 r=36 + Glass Effect white r=36
         * padding 28px, gap 21px
         */}
        <div
          className="figma-nine-slice figma-home-panel-right"
          style={{
            flex: "1452 1 0",
            minWidth: "500px",
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            padding: "28px",
            borderRadius: "36px",
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "21px", flex: 1, overflowY: "auto", minHeight: 0 }}>
            {rightPanelContent ? (
              <>
                <HeroPanel
                  title={rightPanelContent.title}
                  description={rightPanelContent.description}
                  imageUrl={rightPanelContent.imageUrl}
                  videoUrl={rightPanelContent.videoUrl}
                  videoPlaybackRate={rightPanelContent.videoPlaybackRate}
                  videoScale={rightPanelContent.videoScale}
                  videoReverseLoop={rightPanelContent.videoReverseLoop}
                  serviceId={selectedServiceId}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1, minHeight: 0 }}>
                  <SimulationSearch value={searchQuery} onChange={setSearchQuery} />
                  <SimulationTable serviceId={selectedServiceId} searchQuery={searchQuery} extraRows={savedSimulations as any} />
                </div>
              </>
            ) : selectedPackageId && packageContentMap[selectedPackageId] ? (
              /* Package 선택 시 (Service 미선택) -> 비디오 패널 표시 (Full height) */
              <div style={{ flex: 1, height: "100%", minHeight: 0 }}>
                <PackageVideoPanel
                  title={packageContentMap[selectedPackageId].title}
                  description={packageContentMap[selectedPackageId].description}
                  videoUrl={packageContentMap[selectedPackageId].videoUrl!}
                  videoStartOffsetSeconds={packageContentMap[selectedPackageId].videoStartOffsetSeconds}
                  videoPlaybackRate={packageContentMap[selectedPackageId].videoPlaybackRate}
                  videoScale={packageContentMap[selectedPackageId].videoScale}
                  videoReverseLoop={packageContentMap[selectedPackageId].videoReverseLoop}
                />
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}>
                <p
                  className="home-empty-guide-text"
                  style={{ fontFamily: "Inter", fontSize: "19.5px", fontWeight: 600, color: "#828993", letterSpacing: "-0.585px" }}
                >
                  {selectedPackageId ? "Service를 선택해주세요." : "Package를 선택해주세요."}
                </p>
                <style jsx>{`
                  /* [TEMP_SCALE_MODE_DISABLE] 차후 반응형 작업 시 복구
                  @media (max-width: 1800px) {
                    .home-empty-guide-text {
                      font-size: 16.5px !important;
                    }
                  }
                  */
                `}</style>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
