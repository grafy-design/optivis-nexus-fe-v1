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
      className={`flex-shrink-0 transition-transform duration-200 ${
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
      {!isFirst && <div className="bg-neutral-80 h-[1px]" />}

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
          className="relative flex h-12 w-full items-center gap-3 transition-all"
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
            className={`text-feature-item relative z-10 ${
              isSelected ? "text-white" : level === 0 ? "text-neutral-30" : "text-neutral-60"
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
  const [activeTab, setActiveTab] = useState<"inclusion" | "exclusion">("inclusion");
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

  const filterFeatures = (items: FeatureItem[], query: string): FeatureItem[] => {
    if (!query) return items;
    return items
      .map((item) => {
        const matchesQuery = item.label.toLowerCase().includes(query.toLowerCase());
        const filteredChildren = item.children ? filterFeatures(item.children, query) : undefined;
        const hasMatchingChildren = filteredChildren && filteredChildren.length > 0;

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
      <div className="flex w-full flex-col items-center">
        <div className="mx-auto h-[1094px] w-[1772px] flex-shrink-0">
          {/* Liquid Glass Main Container */}
          <div
            className="relative h-full w-full overflow-hidden rounded-[36px]"
            style={{
              backgroundImage: "url(/assets/tsi/default-setting-bg.png)",
              backgroundSize: "100% 100%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              boxShadow: "0px 0px 2px 0px rgba(0, 0, 0, 0.1)",
            }}
          >
            <div className="relative flex h-full flex-col p-6">
              {/* Header Section */}
              <div className="mb-6 flex items-start justify-between">
                <div className="flex flex-col gap-2">
                  <div className="text-title text-neutral-5">Filter</div>
                  <div className="text-body2m text-neutral-50">Cohort Filter Setup</div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Save Simulation Button */}
                  <button className="bg-neutral-70 text-body3 flex cursor-pointer items-center gap-2 rounded-[100px] px-5 py-2.5 text-white transition-opacity hover:opacity-90">
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
                    className="bg-secondary-60 w-[210px] rounded-[100px] text-white"
                    icon="play"
                    iconPosition="right"
                  >
                    Go to Simulation
                  </Button>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex min-h-0 flex-1 gap-6">
                {/* Left Sidebar - Feature List */}
                <div className="flex w-[360px] flex-shrink-0 flex-col">
                  <div className="text-feature-title text-neutral-10 mb-4">Feature List</div>
                  <div className="flex min-h-0 flex-1 flex-col gap-3">
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
                    <div className="flex-1 overflow-y-auto rounded-[16px] bg-white">
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
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="bg-opacity-60 flex min-h-0 flex-1 flex-col rounded-[24px] bg-white p-6">
                    {/* Tab Bar and Action Buttons */}
                    <div className="mb-6 flex items-center justify-between">
                      {/* Tab Bar */}
                      <div className="rounded-full bg-white p-1">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setActiveTab("inclusion")}
                            className={`cursor-pointer rounded-full px-[18px] py-[10px] transition-all ${
                              activeTab === "inclusion"
                                ? "bg-primary-20 text-body4m text-white"
                                : "text-neutral-30 text-body4"
                            }`}
                          >
                            Inclusion
                          </button>
                          <button
                            onClick={() => setActiveTab("exclusion")}
                            className={`cursor-pointer rounded-full px-[18px] py-[10px] transition-all ${
                              activeTab === "exclusion"
                                ? "bg-primary-20 text-body4m text-white"
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
                        <button className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[20px] transition-opacity hover:opacity-80">
                          <div
                            className="pointer-events-none absolute inset-0"
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
                                mixBlendMode: "linear-burn" as React.CSSProperties["mixBlendMode"],
                              }}
                            />
                          </div>
                          <div
                            className="pointer-events-none absolute inset-0"
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
                            className="relative z-10 object-contain"
                          />
                        </button>
                        {/* Save Button - Liquid Glass */}
                        <button className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[20px] transition-opacity hover:opacity-80">
                          <div
                            className="pointer-events-none absolute inset-0"
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
                                mixBlendMode: "linear-burn" as React.CSSProperties["mixBlendMode"],
                              }}
                            />
                          </div>
                          <div
                            className="pointer-events-none absolute inset-0"
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
                        <button className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[20px] transition-opacity hover:opacity-80">
                          <div
                            className="pointer-events-none absolute inset-0"
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
                                mixBlendMode: "linear-burn" as React.CSSProperties["mixBlendMode"],
                              }}
                            />
                          </div>
                          <div
                            className="pointer-events-none absolute inset-0"
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
                            className="relative z-10 object-contain"
                          />
                        </button>
                        {/* Add Section Button - Liquid Glass */}
                        <button
                          className="relative flex h-12 items-center gap-2 overflow-hidden rounded-[100px] px-4 transition-opacity hover:opacity-80"
                          style={{ width: "178px" }}
                        >
                          <div
                            className="pointer-events-none absolute inset-0"
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
                                mixBlendMode: "linear-burn" as React.CSSProperties["mixBlendMode"],
                              }}
                            />
                          </div>
                          <div
                            className="pointer-events-none absolute inset-0"
                            style={{
                              borderRadius: "100px",
                              background: "rgba(0, 0, 0, 0.004)",
                            }}
                          />
                          <span className="text-body3 text-primary-10 relative z-10">
                            Add Section
                          </span>
                          <Image
                            src="/assets/icons/plus.svg"
                            alt="Add"
                            width={24}
                            height={24}
                            className="relative z-10 object-contain"
                          />
                        </button>
                      </div>
                    </div>

                    {/* Filter Sections */}
                    <div className="mb-6 flex flex-1 flex-col gap-4 overflow-y-auto">
                      {/* Filter Section 1 */}
                      <div className="min-h-[96px] rounded-[8px] bg-white p-4">
                        <div className="text-feature-item text-neutral-60"></div>
                      </div>
                      {/* Filter Section 2 */}
                      <div className="min-h-[196px] rounded-[8px] bg-white p-4">
                        <div className="text-feature-item text-neutral-60"></div>
                      </div>
                      {/* Filter Section 3 */}
                      <div className="min-h-[96px] rounded-[8px] bg-white p-4">
                        <div className="text-feature-item text-neutral-60">
                          Filter section content
                        </div>
                      </div>
                    </div>

                    {/* Summary Text Area */}
                    <div className="min-h-[126px] rounded-[8px] bg-white p-4">
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
