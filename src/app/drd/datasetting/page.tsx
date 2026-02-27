/* 데모시연 미진행 페이지 -> 개발 진행하지 않음 */


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import Button from "@/components/ui/button";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import SimulationSearch from "@/components/home/simulation-search";
import CustomCheckbox from "@/components/ui/custom-checkbox";

/**
 * TSI (Target Subgroup Identification) 루트 페이지.
 * Step 1: Default Settings 페이지
 */
export default function TSIPage() {
  const router = useRouter();
  const [_selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedData, setSelectedData] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data
  const attachedData = [
    {
      id: 1,
      name: "Data Name",
      patients: "1,000",
      disease: "Alzheimer's disease",
      updateDate: "2025/12/25 17:00:01",
    },
    {
      id: 2,
      name: "Data Name",
      patients: "48,000",
      disease: "Alzheimer's disease",
      updateDate: "2025/12/25 17:00:01",
    },
    {
      id: 3,
      name: "Data Name",
      patients: "48,000",
      disease: "Alzheimer's disease",
      updateDate: "2025/12/25 17:00:01",
    },
    {
      id: 4,
      name: "Data Name",
      patients: "48,000",
      disease: "Alzheimer's disease",
      updateDate: "2025/12/25 17:00:01",
    },
    {
      id: 5,
      name: "Data Name",
      patients: "48,000",
      disease: "Alzheimer's disease",
      updateDate: "2025/12/25 17:00:01",
    },
    {
      id: 6,
      name: "Data Name",
      patients: "48,000",
      disease: "Alzheimer's disease",
      updateDate: "2025/12/25 17:00:01",
    },
    {
      id: 7,
      name: "Data Name",
      patients: "48,000",
      disease: "Alzheimer's disease",
      updateDate: "2025/12/25 17:00:01",
    },
    {
      id: 8,
      name: "Data Name",
      patients: "48,000",
      disease: "Alzheimer's disease",
      updateDate: "2025/12/25 17:00:01",
    },
    {
      id: 9,
      name: "Data Name",
      patients: "48,000",
      disease: "Type 2 diabetes mellitus",
      updateDate: "2025/12/25 17:00:01",
    },
    {
      id: 10,
      name: "OPMD",
      patients: "48,000",
      disease: "Alzheimer's disease",
      updateDate: "2025/12/25 17:00:01",
    },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const toggleDataSelection = (id: number) => {
    const newSelection = new Set(selectedData);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedData(newSelection);
  };

  const handleUseData = () => {
    if (selectedData.size > 0) {
      router.push("/tsi/patients-summary");
    }
  };

  // 데이터를 8개씩 나누기
  const leftTableData = attachedData.slice(0, 8);
  const rightTableData = attachedData.slice(8);

  return (
    <AppLayout headerType="drd" drdStep={1} scaleMode="none">
      <div style={{ display: "flex", flexDirection: "column", width: "calc(100% - 24px)", height: "100%", gap: 24, overflow: "hidden", marginLeft: "8px", marginRight: "8px" }}>
        <div className="flex flex-col gap-3 flex-1 min-h-0">
          {/* Main Card with Glass Background */}
          <div
            className="flex flex-col gap-6 flex-1 min-h-0"
            style={{
              borderImage: 'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch',
              borderStyle: "solid",
              borderTopWidth: "20px",
              borderBottomWidth: "28px",
              borderLeftWidth: "24px",
              borderRightWidth: "24px",
              borderColor: "transparent",
            }}
          >
            <div className="flex flex-col gap-6 h-full">
              {/* Data Template Download & File Upload Section */}
              <div className="flex gap-6 mb-[22px]">
                {/* Data Template Download Card */}
                <div
                  className="flex-shrink-0 w-[266px] h-[266px] rounded-[24px] p-4 pt-12 flex flex-col justify-between"
                  style={{ backgroundColor: "#231f52" }}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-[17px] items-center">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 32 32"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="flex-shrink-0"
                        aria-hidden
                      >
                        <g clipPath="url(#clip0_download_tsi)">
                          <path
                            d="M25 28H7C6.73478 28 6.48043 27.8946 6.29289 27.7071C6.10536 27.5196 6 27.2652 6 27V5C6 4.73478 6.10536 4.48043 6.29289 4.29289C6.48043 4.10536 6.73478 4 7 4H19L26 11V27C26 27.2652 25.8946 27.5196 25.7071 27.7071C25.5196 27.8946 25.2652 28 25 28Z"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M19 4V11H26"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M16 15V23"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M13 20L16 23L19 20"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_download_tsi">
                            <rect width="32" height="32" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                      <h3 className="text-body3 text-white text-center">
                        Data Template Download
                      </h3>
                    </div>
                    <p className="text-body4m text-[#aaaaad] text-center px-0">
                      Download a guide file that includes optimized data formats
                      and examples for service analysis
                    </p>
                  </div>
                  <Button
                    variant="orange"
                    size="md"
                    className="w-full rounded-[16px]"
                    style={{
                      backgroundColor: "#f06600",
                      color: "#e3dfff",
                    }}
                  >
                    Download
                  </Button>
                </div>

                {/* File Upload Card - 상하 패딩 24/12, 갭: 아이콘~제목 16, 제목~파일정보 12, 파일정보~버튼 24, 버튼 아래 12 */}
                <div className="flex-1 bg-white rounded-[24px] pt-6 pb-3 px-0 flex flex-col items-center justify-center h-[266px] gap-6">
                  <div className="flex flex-col items-center justify-center">
                    <svg
                      width="32"
                      height="36"
                      viewBox="0 0 32 36"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="flex-shrink-0"
                      aria-hidden
                    >
                      <path
                        d="M26.3104 12.8416C25.3319 10.5582 23.6431 8.66362 21.5028 7.44817C19.3625 6.23271 16.8888 5.76344 14.4607 6.11225C12.0327 6.46107 9.78425 7.60873 8.05994 9.37937C6.33563 11.15 5.23059 13.446 4.91415 15.9154C3.38724 16.2867 2.04779 17.2146 1.15017 18.5227C0.252542 19.8309 -0.140742 21.4283 0.0450008 23.0115C0.230744 24.5947 0.982579 26.0536 2.15773 27.111C3.33288 28.1684 4.8495 28.7507 6.41958 28.7473C6.84433 28.7473 7.25168 28.576 7.55202 28.271C7.85237 27.966 8.0211 27.5523 8.0211 27.1209C8.0211 26.6896 7.85237 26.2759 7.55202 25.9709C7.25168 25.6659 6.84433 25.4946 6.41958 25.4946C5.57008 25.4946 4.75538 25.1519 4.15469 24.5419C3.55401 23.9319 3.21654 23.1046 3.21654 22.2419C3.21654 21.3792 3.55401 20.5519 4.15469 19.9419C4.75538 19.3319 5.57008 18.9892 6.41958 18.9892C6.84433 18.9892 7.25168 18.8178 7.55202 18.5128C7.85237 18.2078 8.0211 17.7942 8.0211 17.3628C8.02519 15.4393 8.7006 13.5796 9.92733 12.1139C11.1541 10.6483 12.8527 9.67175 14.7214 9.35774C16.5902 9.04373 18.508 9.4126 20.1343 10.3988C21.7605 11.385 22.9899 12.9248 23.6039 14.7444C23.6954 15.0239 23.86 15.2729 24.08 15.4648C24.3 15.6567 24.5672 15.7843 24.853 15.8341C25.9198 16.0388 26.8868 16.6043 27.5965 17.4385C28.3062 18.2727 28.7168 19.3264 28.7614 20.4279C28.806 21.5294 28.4819 22.6138 27.842 23.5043C27.202 24.3949 26.284 25.0391 25.2374 25.332C24.8254 25.4398 24.4725 25.7094 24.2562 26.0815C24.04 26.4536 23.9781 26.8977 24.0843 27.3161C24.1905 27.7345 24.456 28.0929 24.8224 28.3125C25.1888 28.5321 25.6262 28.5949 26.0382 28.4871C27.7236 28.0348 29.2176 27.0364 30.2934 25.6434C31.3692 24.2503 31.968 22.5389 31.9988 20.7689C32.0296 18.9988 31.4907 17.267 30.4641 15.8362C29.4374 14.4055 27.9791 13.354 26.3104 12.8416ZM17.1658 16.2081C17.0135 16.0601 16.8338 15.944 16.6373 15.8666C16.2474 15.7039 15.81 15.7039 15.4201 15.8666C15.2235 15.944 15.0439 16.0601 14.8916 16.2081L10.0871 21.0872C9.78548 21.3934 9.61606 21.8088 9.61606 22.2419C9.61606 22.675 9.78548 23.0904 10.0871 23.3966C10.3886 23.7029 10.7976 23.8749 11.2241 23.8749C11.6506 23.8749 12.0596 23.7029 12.3612 23.3966L14.4272 21.2823V30.3736C14.4272 30.805 14.5959 31.2187 14.8962 31.5237C15.1966 31.8287 15.6039 32 16.0287 32C16.4534 32 16.8608 31.8287 17.1611 31.5237C17.4615 31.2187 17.6302 30.805 17.6302 30.3736V21.2823L19.6962 23.3966C19.845 23.549 20.0222 23.67 20.2173 23.7526C20.4125 23.8352 20.6218 23.8777 20.8332 23.8777C21.0447 23.8777 21.254 23.8352 21.4491 23.7526C21.6443 23.67 21.8214 23.549 21.9703 23.3966C22.1204 23.2454 22.2396 23.0655 22.3209 22.8674C22.4022 22.6692 22.444 22.4566 22.444 22.2419C22.444 22.0272 22.4022 21.8146 22.3209 21.6164C22.2396 21.4183 22.1204 21.2384 21.9703 21.0872L17.1658 16.2081Z"
                        fill="#313030"
                      />
                    </svg>
                    <h3 className="text-body3 text-neutral-10 text-center mt-4">
                      Click to upload or Drag and drop
                    </h3>
                    <div className="text-body4m text-[#aaaaad] text-center mt-3 leading-normal">
                      svg, xlsx
                      <br />
                      *Maximum file size: n MB per file
                    </div>
                  </div>
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    accept=".svg,.xlsx"
                    multiple
                    onChange={handleFileSelect}
                  />
                  <label
                    htmlFor="file-upload"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className="cursor-pointer flex justify-center"
                  >
                    <Button
                      variant="primary"
                      size="md"
                      className="w-[222px] rounded-[24px]"
                      style={{
                        backgroundColor: "#3a11d8",
                        color: "#e3dfff",
                      }}
                    >
                      File Select
                    </Button>
                  </label>
                </div>
              </div>

              {/* Attached Data Section */}
              <div className="flex flex-col gap-3">
                {/* Section Header */}
                <div className="flex items-center justify-between">
                  <h2 className="text-h3 text-neutral-10">Attached Data</h2>
                  <SimulationSearch value={searchQuery} onChange={setSearchQuery} />
                </div>

                {/* Data Table */}
                <div className="flex flex-col gap-[8px]">
                  {/* Table Header - Single header like main page */}
                  <div className="rounded-[24px] h-[46px] bg-[#231f52] flex items-center">
                    <div className="flex items-center gap-12 text-body5 text-white w-full">
                      <div className="flex items-center gap-4 pl-[32px]">
                        <div className="w-4" />
                        <span className="w-[106px]">Data Name</span>
                      </div>
                      <span className="w-[120px]">Patients (N)</span>
                      <span className="w-[200px]">Disease</span>
                      <span className="w-[206px]">Update date</span>
                      <div className="flex items-center gap-4 pl-[7px]">
                        <div className="w-4" />
                        <span className="w-[106px]">Data Name</span>
                      </div>
                      <span className="w-[120px]">Patients (N)</span>
                      <span className="w-[200px]">Disease</span>
                      <span className="w-[206px]">Update date</span>
                    </div>
                  </div>

                  {/* Table Body - Two Tables Side by Side */}
                  <div className="flex gap-0 rounded-[18px] bg-white overflow-hidden min-h-[280px] flex-shrink-0">
                    {/* Left Table */}
                     <div
            className="drd-left-panel flex-[22] min-w-[280px] min-h-0"
            style={{
              borderImage: 'url("/assets/figma/home/frame-panel-left.png") 72 fill / 36px / 0 stretch',
              borderStyle: "solid",
              borderTopWidth: "20px",
              borderBottomWidth: "28px",
              borderLeftWidth: "24px",
              borderRightWidth: "24px",
              borderColor: "transparent",
            }}
          >
                      {leftTableData.length > 0 ? (
                        <SimpleBar style={{ maxHeight: "500px" }}>
                          <div className="py-[20px] px-[32px] min-h-[280px]">
                            {leftTableData.map((data, index) => (
                              <div
                                key={data.id}
                                className={`flex items-center gap-12 border-b-[1px] border-gray-200 last:border-0 ${
                                  index === 0
                                    ? "pt-0 pb-2.5"
                                    : index === leftTableData.length - 1
                                    ? "pt-2.5 pb-0"
                                    : "py-2.5"
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-4 flex items-center justify-center">
                                    <CustomCheckbox
                                      checked={selectedData.has(data.id)}
                                      onChange={() =>
                                        toggleDataSelection(data.id)
                                      }
                                    />
                                  </div>
                                  <span className="w-[106px] text-body5 text-neutral-20">
                                    {data.name}
                                  </span>
                                </div>
                                <span className="w-[120px] text-body5 text-neutral-20">
                                  {data.patients}
                                </span>
                                <span className="w-[200px] text-body5 text-neutral-20">
                                  {data.disease}
                                </span>
                                <span className="w-[206px] text-body5 text-neutral-20">
                                  {data.updateDate}
                                </span>
                              </div>
                            ))}
                          </div>
                        </SimpleBar>
                      ) : (
                        <div className="px-5 py-20 flex items-center justify-center h-full min-h-[348px]">
                          <p className="text-body4 text-[#828993]">
                            No saved simulations.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div className="w-[2px] bg-gray-300 flex-shrink-0 mt-[26px] mb-[26px]" />

                    {/* Right Table */}
                     <div className="drd-right-panel flex-[78] min-w-0 min-h-0" style={{ borderImage: 'url("/assets/figma/home/frame-panel-middle.png") 72 fill / 36px / 0 stretch', borderStyle: "solid", borderTopWidth: "20px", borderBottomWidth: "28px", borderLeftWidth: "24px", borderRightWidth: "24px", borderColor: "transparent", gap: "12px" }}>
                      {rightTableData.length > 0 ? (
                        <SimpleBar style={{ maxHeight: "500px" }}>
                          <div className="py-[20px] px-[32px] min-h-[280px]">
                            {rightTableData.map((data, index) => (
                              <div
                                key={data.id}
                                className={`flex items-center gap-12 border-b border-gray-200 last:border-0 ${
                                  index === 0
                                    ? "pt-0 pb-3"
                                    : index === rightTableData.length - 1
                                    ? "pt-3 pb-0"
                                    : "py-3"
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-4 flex items-center justify-center">
                                    <CustomCheckbox
                                      checked={selectedData.has(data.id)}
                                      onChange={() =>
                                        toggleDataSelection(data.id)
                                      }
                                    />
                                  </div>
                                  <span className="w-[106px] text-body5 text-neutral-20">
                                    {data.name}
                                  </span>
                                </div>
                                <span className="w-[120px] text-body5 text-neutral-20">
                                  {data.patients}
                                </span>
                                <span className="w-[200px] text-body5 text-neutral-20">
                                  {data.disease}
                                </span>
                                <span className="w-[206px] text-body5 text-neutral-20">
                                  {data.updateDate}
                                </span>
                              </div>
                            ))}
                          </div>
                        </SimpleBar>
                      ) : (
                        <div className="px-5 py-20 flex items-center justify-center h-full min-h-[394px]">
                          <p className="text-body4 text-[#828993]">
                            No saved simulations.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Use Data Button - Outside Card (시뮬레이션 버튼처럼 우측 화살표) */}
          <div className="flex justify-end">
            <Button
              variant="orange"
              size="md"
              icon="play"
              iconPosition="right"
              onClick={handleUseData}
              disabled={selectedData.size === 0}
              className="rounded-[100px]"
              style={{
                backgroundColor: "#f16600",
                color: "#ffffff",
              }}
            >
              Use Data
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
