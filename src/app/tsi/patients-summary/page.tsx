"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import Button from "@/components/ui/button";
import Image from "next/image";

/**
 * TSI Step 2: Patients Summary
 * 피그마: [FLT-003] Patients Summary - 8
 */
export default function TSIPatientsSummaryPage() {
  const router = useRouter();

  const handleGoToBasisSelection = () => {
    router.push("/tsi/basis-selection");
  };

  // 피그마에서 확인한 데이터 구조
  const baselineData = [
    {
      category: "Age",
      items: [
        {
          label: "0-55",
          fullCohort: { value: "Value", percent: "Value%" },
          filteredCohort: { value: "Value", percent: "Value%" },
        },
        {
          label: "55-",
          fullCohort: { value: "Value", percent: "Value%" },
          filteredCohort: { value: "Value", percent: "Value%" },
        },
        {
          label: "Unknown or Not Reported",
          fullCohort: { value: "Value", percent: "Value%" },
          filteredCohort: { value: "Value", percent: "Value%" },
        },
      ],
    },
    {
      category: "Ethno-raciall identification",
      items: [
        {
          label: "American Indian or Alaska Native",
          fullCohort: { value: "Value", percent: "Value%" },
          filteredCohort: { value: "Value", percent: "Value%" },
        },
        {
          label: "Asian/Asian American",
          fullCohort: { value: "Value", percent: "Value%" },
          filteredCohort: { value: "Value", percent: "Value%" },
        },
        {
          label: "Black/African American/African",
          fullCohort: { value: "Value", percent: "Value%" },
          filteredCohort: { value: "Value", percent: "Value%" },
        },
        {
          label: "Hispanic/Latinx/Spanish",
          fullCohort: { value: "Value", percent: "Value%" },
          filteredCohort: { value: "Value", percent: "Value%" },
        },
        {
          label: "Middle Eastern/North African",
          fullCohort: { value: "Value", percent: "Value%" },
          filteredCohort: { value: "Value", percent: "Value%" },
        },
        {
          label: "Native Hawaiian/Pacific Islander",
          fullCohort: { value: "Value", percent: "Value%" },
          filteredCohort: { value: "Value", percent: "Value%" },
        },
        {
          label: "White/European American",
          fullCohort: { value: "Value", percent: "Value%" },
          filteredCohort: { value: "Value", percent: "Value%" },
        },
        {
          label: "Other",
          fullCohort: { value: "Value", percent: "Value%" },
          filteredCohort: { value: "Value", percent: "Value%" },
        },
        {
          label: "No response",
          fullCohort: { value: "Value", percent: "Value%" },
          filteredCohort: { value: "Value", percent: "Value%" },
        },
      ],
    },
    {
      category: "Education",
      items: [
        {
          label: "High school or equivalent or less",
          fullCohort: { value: "Value", percent: "Value%" },
          filteredCohort: { value: "Value", percent: "Value%" },
        },
        {
          label: "Some college/associate's degree",
          fullCohort: { value: "Value", percent: "Value%" },
          filteredCohort: { value: "Value", percent: "Value%" },
        },
      ],
    },
  ];

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
              <div className="flex items-start justify-between mb-8">
                {/* Title layout */}
                <div className="flex flex-col gap-2">
                  <div className="text-title text-neutral-5">
                    Patient Summary
                  </div>
                  <div className="text-body2m text-neutral-50">
                    Number Analyzed 480 participants
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {/* Save Simulation Button - 왼쪽 */}
                  <button
                    className="w-[202px] h-[48px] text-primary-15 rounded-[100px] text-body3 hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-2 bg-cover bg-center bg-no-repeat"
                    style={{
                      backgroundImage: "url(/assets/tsi/save-btn.png)",
                    }}
                  >
                    Save Simulation
                    <Image
                      src="/assets/tsi/check.svg"
                      alt=""
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  </button>
                  {/* Identify Subgroup Button - 오른쪽 */}
                  <Button
                    variant="orange"
                    size="md"
                    onClick={handleGoToBasisSelection}
                    className="rounded-[100px] w-[208px] h-[42px] bg-secondary-60 text-white text-body3"
                    icon="play"
                    iconPosition="right"
                  >
                    Identify Subgroup
                  </Button>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 flex flex-col min-h-0">
                {/* Table Header */}
                <div className="h-[44px] mb-0">
                  <div className="flex items-center" style={{ gap: "24px" }}>
                    {/* Baseline Characteristics */}
                    <div className="px-[30px] w-[405px] h-[34px] flex items-center">
                      <div className="text-body2 text-neutral-5">
                        Baseline Characteristics
                      </div>
                    </div>
                    {/* Conversion Rate */}
                    <div className="w-[405px] h-[34px] flex items-center">
                      <div className="text-body2m text-neutral-60">
                        48% converted (480/1000)
                      </div>
                    </div>
                    {/* Full Cohort */}
                    <div className="w-[405px] h-[42px] flex flex-col justify-center">
                      <div
                        className="text-body1 text-neutral-30 mb-1"
                        style={{ fontWeight: 590 }}
                      >
                        Full Cohort
                      </div>
                      <div className="text-body5 text-neutral-60">
                        N (%) or mean ± sd (min, max)
                      </div>
                    </div>
                    {/* Filtered Cohort */}
                    <div className="w-[405px] h-[42px] flex flex-col justify-center">
                      <div
                        className="text-body1 text-neutral-30 mb-1"
                        style={{ fontWeight: 590 }}
                      >
                        Filtered Cohort
                      </div>
                      <div className="text-body5 text-neutral-60">
                        N (%) or mean ± sd (min, max)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="flex-1 overflow-y-auto">
                  <div className="flex flex-col gap-3 mt-2">
                    {baselineData.map((category, categoryIndex) => (
                      <div
                        key={categoryIndex}
                        className="bg-white rounded-[16px] overflow-hidden"
                      >
                        <div className="flex flex-col p-[18px] px-[30px]">
                          {/* Category Header Row */}
                          <div
                            className="flex items-center h-[44px] border-b border-neutral-80"
                            style={{
                              gap: "24px",
                            }}
                          >
                            {/* Category Label */}
                            <div className="px-[0px] w-[405px] h-full flex items-center">
                              <div className="text-body2 text-neutral-5">
                                {category.category}
                              </div>
                            </div>
                            {/* Empty space for conversion rate */}
                            <div className="px-[0px] w-[405px]" />
                            {/* Full Cohort Header */}
                            <div className="w-[405px] h-full flex items-center gap-2 px-[0px]">
                              <div className="text-body3m text-neutral-50">
                                Value
                              </div>
                              <div className="text-body3m text-neutral-50">
                                Value%
                              </div>
                            </div>
                            {/* Filtered Cohort Header */}
                            <div className="w-[405px] h-full flex items-center gap-2 px-[0px]">
                              <div className="text-body3m text-neutral-5">
                                Value
                              </div>
                              <div className="text-body3m text-primary-60">
                                Value%
                              </div>
                            </div>
                          </div>
                          {/* Category Items */}
                          {category.items.map((item, itemIndex) => {
                            const isLast =
                              itemIndex === category.items.length - 1;
                            return (
                              <div
                                key={itemIndex}
                                className={`flex items-center h-[44px] ${
                                  !isLast ? "border-b border-neutral-80" : ""
                                }`}
                                style={{
                                  gap: "24px",
                                }}
                              >
                                {/* Item Label */}
                                <div className="px-[0px] w-[405px] h-full flex items-center">
                                  <div className="text-body3m text-neutral-50">
                                    {item.label}
                                  </div>
                                </div>
                                {/* Empty space for conversion rate */}
                                <div className="px-[0px] w-[405px]" />
                                {/* Full Cohort Value */}
                                <div className="w-[405px] h-full flex items-center gap-2 px-[0px]">
                                  <div className="text-body3m text-neutral-50">
                                    {item.fullCohort.value}
                                  </div>
                                  <div className="text-body3m text-neutral-50">
                                    {item.fullCohort.percent}
                                  </div>
                                </div>
                                {/* Filtered Cohort Value */}
                                <div className="w-[405px] h-full flex items-center gap-2 px-[0px]">
                                  <div className="text-body3m text-neutral-5">
                                    {item.filteredCohort.value}
                                  </div>
                                  <div className="text-body3m text-primary-60">
                                    {item.filteredCohort.percent}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
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
