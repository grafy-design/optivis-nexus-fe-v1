"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Image from "next/image";

interface FeatureItem {
  id: string;
  label: string;
  children?: FeatureItem[];
}

interface FeatureItemComponentProps {
  item: FeatureItem;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  expandedItems: Set<string>;
  selectedItemId: string;
  onToggleExpand: (id: string) => void;
  onSelect: (id: string) => void;
  isFirst?: boolean;
}

function FeatureItemComponent({
  item,
  level,
  isExpanded,
  isSelected,
  expandedItems,
  selectedItemId,
  onToggleExpand,
  onSelect,
  isFirst = false,
}: FeatureItemComponentProps) {
  const hasChildren = item.children && item.children.length > 0;
  const ChevronIcon = (
    <svg
      width="12"
      height="7"
      viewBox="0 0 12 7"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform duration-200 flex-shrink-0 ${
        isExpanded ? "rotate-180" : ""
      }`}
    >
      <path
        d="M5.95947 6.94727C5.67725 6.94727 5.42269 6.83382 5.1958 6.60693L0.273438 1.63477C0.0908203 1.44661 -0.000488281 1.22249 -0.000488281 0.962402C-0.000488281 0.691243 0.0908203 0.464355 0.273438 0.281738C0.461589 0.0935872 0.691243 -0.000488281 0.962402 -0.000488281C1.22249 -0.000488281 1.45492 0.0991211 1.65967 0.29834L6.2749 4.97998H5.64404L10.251 0.29834C10.4557 0.0991211 10.6882 -0.000488281 10.9482 -0.000488281C11.2139 -0.000488281 11.438 0.0935872 11.6206 0.281738C11.8088 0.464355 11.9028 0.691243 11.9028 0.962402C11.9028 1.22803 11.8115 1.45215 11.6289 1.63477L6.71484 6.60693C6.49902 6.82829 6.24723 6.94173 5.95947 6.94727Z"
        fill={isSelected ? "#ffffff" : "#919092"}
      />
    </svg>
  );

  // depth1 (level 0)은 항상 펼치기 아이콘 표시, depth2 (level > 0)에는 없음
  const showChevron = level === 0;

  return (
    <div className="w-full">
      {/* 구분선 - 첫 번째 항목이 아닐 때만 표시 */}
      {!isFirst && <div className="h-[1px] bg-neutral-80" />}

      {/* 선택된 항목의 전체 영역 (왼쪽 끝까지 채워짐) */}
      <div
        className={`${isSelected ? "bg-primary-15" : ""}`}
        style={{
          marginLeft: isSelected ? "-18px" : "0",
          marginRight: isSelected ? "-18px" : "0",
          paddingLeft: isSelected ? "18px" : "0",
          paddingRight: isSelected ? "18px" : "0",
          width: isSelected ? "calc(100% + 36px)" : "100%",
        }}
      >
        <button
          onClick={() => {
            // level 0 (depth1)은 펼치기/접기와 선택 모두 가능
            if (level === 0) {
              onToggleExpand(item.id);
              onSelect(item.id); // depth1 선택
            }
            // level > 0 (depth2)는 선택만 가능
            if (level > 0) {
              onSelect(item.id); // depth2 선택
            }
          }}
          className="h-12 flex items-center gap-3 transition-all relative w-full"
          style={{
            paddingLeft: level > 0 ? `${18 + level * 16}px` : "18px",
            paddingRight: "18px",
          }}
        >
          {/* level 0은 항상 chevron 아이콘 표시, level > 0에는 없음 */}
          {showChevron ? (
            <div className="relative z-10 flex-shrink-0">{ChevronIcon}</div>
          ) : level > 0 ? (
            <div className="relative z-10 w-3 flex-shrink-0" />
          ) : null}
          <span
            className={`relative z-10 text-feature-item ${
              isSelected
                ? "text-white"
                : level === 0
                ? "text-neutral-30"
                : "text-neutral-60"
            }`}
          >
            {item.label}
          </span>
        </button>
      </div>

      {hasChildren && isExpanded && (
        <div className="flex flex-col">
          {item.children!.map((child, index) => (
            <FeatureItemComponent
              key={child.id}
              item={child}
              level={level + 1}
              isExpanded={expandedItems.has(child.id)}
              isSelected={selectedItemId === child.id}
              expandedItems={expandedItems}
              selectedItemId={selectedItemId}
              onToggleExpand={onToggleExpand}
              onSelect={onSelect}
              isFirst={index === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * TSI Default Settings - Step 2: Filter
 * 피그마: [FLT-002] 시뮬레이션 데이터 변경하기-필터링-1
 */
export default function TSIFilterPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"inclusion" | "exclusion">(
    "inclusion"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedItemId, setSelectedItemId] = useState<string>("");

  const features: FeatureItem[] = [
    { id: "cohort", label: "COHOTR" },
    {
      id: "info",
      label: "INFO",
      children: [
        { id: "age", label: "AGE" },
        { id: "alc", label: "ALC" },
        { id: "race", label: "RACE" },

        { id: "height", label: "HEIGHT" },
        { id: "weight", label: "WEIGHT" },
        { id: "edu", label: "EDU" },
        { id: "caorbd", label: "CAORBD" },
        { id: "tob", label: "TOB" },
      ],
    },
    { id: "adas", label: "ADAS" },
    { id: "cdr", label: "CDR" },
    { id: "clin", label: "CLIN" },
    { id: "drug", label: "DRUG" },
    { id: "lab", label: "LAB" },
    { id: "mmse", label: "MMSE" },
  ];

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const filterFeatures = (
    items: FeatureItem[],
    query: string
  ): FeatureItem[] => {
    if (!query) return items;
    return items
      .map((item) => {
        const matchesQuery = item.label
          .toLowerCase()
          .includes(query.toLowerCase());
        const filteredChildren = item.children
          ? filterFeatures(item.children, query)
          : undefined;
        const hasMatchingChildren =
          filteredChildren && filteredChildren.length > 0;

        if (matchesQuery || hasMatchingChildren) {
          return {
            ...item,
            children: filteredChildren,
          } as FeatureItem;
        }
        return null;
      })
      .filter((item): item is FeatureItem => item !== null);
  };

  const filteredFeatures = filterFeatures(features, searchQuery);

  const handleGoToSimulation = () => {
    router.push("/tsi/patients-summary");
  };

  return (
    <AppLayout headerType="tsi">
      <div className="w-full flex flex-col items-center">
        <div className="w-[1772px] h-[1094px] flex-shrink-0 mx-auto">
          {/* Liquid Glass Main Container */}
          <div
            className="relative rounded-[36px] overflow-hidden w-full h-full"
            style={{
              backgroundImage: "url(/assets/tsi/default-setting-bg.png)",
              backgroundSize: "100% 100%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div className="relative p-6 flex flex-col h-full">
              {/* Header Section */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex flex-col gap-2">
                  <div className="text-title text-neutral-5">Filter</div>
                  <div className="text-body2m text-neutral-50">
                    Cohort Filter Setup
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Save Simulation Button */}
                  <button className="px-5 py-2.5 bg-neutral-70 text-white rounded-[100px] text-body3 hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2">
                    <Image
                      src="/assets/header/download.svg"
                      alt=""
                      width={22}
                      height={22}
                      className="object-contain brightness-0 invert"
                    />
                    Save Simulation
                  </button>
                  {/* Go to Simulation Button */}
                  <Button
                    variant="orange"
                    size="md"
                    onClick={handleGoToSimulation}
                    className="rounded-[100px] w-[210px] bg-secondary-60 text-white"
                    icon="play"
                    iconPosition="right"
                  >
                    Go to Simulation
                  </Button>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex gap-6 flex-1 min-h-0">
                {/* Left Sidebar - Feature List */}
                <div className="w-[360px] flex-shrink-0 flex flex-col">
                  <div className="text-feature-title text-neutral-10 mb-4">
                    Feature List
                  </div>
                  <div className="flex flex-col gap-3 flex-1 min-h-0">
                    {/* Search Field */}
                    <Input
                      placeholder="Search features"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      icon={
                        <Image
                          src="/assets/main/search.svg"
                          alt="Search"
                          width={18}
                          height={18}
                          className="object-contain"
                        />
                      }
                      className="h-[42px]"
                    />
                    {/* Feature List */}
                    <div className="bg-white rounded-[16px] flex-1 overflow-y-auto">
                      <div className="flex flex-col p-[18px]">
                        {filteredFeatures.map((feature, index) => (
                          <FeatureItemComponent
                            key={feature.id}
                            item={feature}
                            level={0}
                            isExpanded={expandedItems.has(feature.id)}
                            isSelected={selectedItemId === feature.id}
                            expandedItems={expandedItems}
                            selectedItemId={selectedItemId}
                            onToggleExpand={toggleExpand}
                            onSelect={setSelectedItemId}
                            isFirst={index === 0}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Main Area - Filter Sections */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="bg-white bg-opacity-60 rounded-[24px] flex-1 flex flex-col p-6 min-h-0">
                    {/* Tab Bar and Action Buttons */}
                    <div className="flex items-center justify-between mb-6">
                      {/* Tab Bar */}
                      <div className="bg-white rounded-full p-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActiveTab("inclusion")}
                            className={`px-[18px] py-[10px] rounded-full transition-all cursor-pointer ${
                              activeTab === "inclusion"
                                ? "bg-primary-20 text-white text-body4m"
                                : "text-neutral-30 text-body4"
                            }`}
                          >
                            Inclusion
                          </button>
                          <button
                            onClick={() => setActiveTab("exclusion")}
                            className={`px-[18px] py-[10px] rounded-full transition-all cursor-pointer ${
                              activeTab === "exclusion"
                                ? "bg-primary-20 text-white text-body4m"
                                : "text-neutral-30 text-body4"
                            }`}
                          >
                            Exclusion
                          </button>
                        </div>
                      </div>
                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {/* Import Button - Liquid Glass */}
                        <button className="relative w-12 h-12 rounded-[20px] flex items-center justify-center hover:opacity-80 transition-opacity overflow-hidden">
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{ borderRadius: "100px" }}
                          >
                            <div
                              className="absolute inset-0"
                              style={{
                                borderRadius: "100px",
                                background: "#333333",
                                mixBlendMode: "color-dodge",
                              }}
                            />
                            <div
                              className="absolute inset-0"
                              style={{
                                borderRadius: "100px",
                                background: "rgba(255, 255, 255, 0.5)",
                                mixBlendMode: "normal",
                              }}
                            />
                            <div
                              className="absolute inset-0"
                              style={{
                                borderRadius: "100px",
                                background: "#f7f7f7",
                                mixBlendMode:
                                  "linear-burn" as React.CSSProperties["mixBlendMode"],
                              }}
                            />
                          </div>
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              borderRadius: "100px",
                              background: "rgba(0, 0, 0, 0.004)",
                            }}
                          />
                          <Image
                            src="/assets/icons/plus.svg"
                            alt="Import"
                            width={18}
                            height={18}
                            className="object-contain relative z-10"
                          />
                        </button>
                        {/* Save Button - Liquid Glass */}
                        <button className="relative w-12 h-12 rounded-[20px] flex items-center justify-center hover:opacity-80 transition-opacity overflow-hidden">
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{ borderRadius: "100px" }}
                          >
                            <div
                              className="absolute inset-0"
                              style={{
                                borderRadius: "100px",
                                background: "#333333",
                                mixBlendMode: "color-dodge",
                              }}
                            />
                            <div
                              className="absolute inset-0"
                              style={{
                                borderRadius: "100px",
                                background: "rgba(255, 255, 255, 0.5)",
                                mixBlendMode: "normal",
                              }}
                            />
                            <div
                              className="absolute inset-0"
                              style={{
                                borderRadius: "100px",
                                background: "#f7f7f7",
                                mixBlendMode:
                                  "linear-burn" as React.CSSProperties["mixBlendMode"],
                              }}
                            />
                          </div>
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              borderRadius: "100px",
                              background: "rgba(0, 0, 0, 0.004)",
                            }}
                          />
                          <svg
                            width="18"
                            height="16"
                            viewBox="0 0 18 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="relative z-10"
                          >
                            <path
                              d="M1 8L7 14L17 2"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        {/* Delete Button - Liquid Glass */}
                        <button className="relative w-12 h-12 rounded-[20px] flex items-center justify-center hover:opacity-80 transition-opacity overflow-hidden">
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{ borderRadius: "100px" }}
                          >
                            <div
                              className="absolute inset-0"
                              style={{
                                borderRadius: "100px",
                                background: "#333333",
                                mixBlendMode: "color-dodge",
                              }}
                            />
                            <div
                              className="absolute inset-0"
                              style={{
                                borderRadius: "100px",
                                background: "rgba(255, 255, 255, 0.5)",
                                mixBlendMode: "normal",
                              }}
                            />
                            <div
                              className="absolute inset-0"
                              style={{
                                borderRadius: "100px",
                                background: "#f7f7f7",
                                mixBlendMode:
                                  "linear-burn" as React.CSSProperties["mixBlendMode"],
                              }}
                            />
                          </div>
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              borderRadius: "100px",
                              background: "rgba(0, 0, 0, 0.004)",
                            }}
                          />
                          <Image
                            src="/assets/icons/trash.svg"
                            alt="Delete"
                            width={20}
                            height={22}
                            className="object-contain relative z-10"
                          />
                        </button>
                        {/* Add Section Button - Liquid Glass */}
                        <button
                          className="relative h-12 px-4 rounded-[100px] flex items-center gap-2 hover:opacity-80 transition-opacity overflow-hidden"
                          style={{ width: "178px" }}
                        >
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{ borderRadius: "100px" }}
                          >
                            <div
                              className="absolute inset-0"
                              style={{
                                borderRadius: "100px",
                                background: "#333333",
                                mixBlendMode: "color-dodge",
                              }}
                            />
                            <div
                              className="absolute inset-0"
                              style={{
                                borderRadius: "100px",
                                background: "rgba(255, 255, 255, 0.5)",
                                mixBlendMode: "normal",
                              }}
                            />
                            <div
                              className="absolute inset-0"
                              style={{
                                borderRadius: "100px",
                                background: "#f7f7f7",
                                mixBlendMode:
                                  "linear-burn" as React.CSSProperties["mixBlendMode"],
                              }}
                            />
                          </div>
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              borderRadius: "100px",
                              background: "rgba(0, 0, 0, 0.004)",
                            }}
                          />
                          <span className="relative z-10 text-body3 text-primary-10">
                            Add Section
                          </span>
                          <Image
                            src="/assets/icons/plus.svg"
                            alt="Add"
                            width={24}
                            height={24}
                            className="object-contain relative z-10"
                          />
                        </button>
                      </div>
                    </div>

                    {/* Filter Sections */}
                    <div className="flex-1 overflow-y-auto flex flex-col gap-4 mb-6">
                      {/* Filter Section 1 */}
                      <div className="bg-white rounded-[8px] p-4 min-h-[96px]">
                        <div className="text-feature-item text-neutral-60"></div>
                      </div>
                      {/* Filter Section 2 */}
                      <div className="bg-white rounded-[8px] p-4 min-h-[196px]">
                        <div className="text-feature-item text-neutral-60"></div>
                      </div>
                      {/* Filter Section 3 */}
                      <div className="bg-white rounded-[8px] p-4 min-h-[96px]">
                        <div className="text-feature-item text-neutral-60">
                          Filter section content
                        </div>
                      </div>
                    </div>

                    {/* Summary Text Area */}
                    <div className="bg-white rounded-[8px] p-4 min-h-[126px]">
                      <div className="text-feature-item text-neutral-60 whitespace-pre-line">
                        formula content
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
