/*
 * 데모 시연 미진행 범위 / Not yet covered in demo
 * FE 미진행 / FE not yet implemented
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import SimulationSearch from "@/components/home/simulation-search";
import CustomCheckbox from "@/components/ui/custom-checkbox";

/**
 * TSI (Target Subgroup Identification) 루트 페이지.
 * Step 1: Data Setting — 데이터를 선택하거나 새로 업로드하는 첫 번째 단계.
 * Root page for TSI. Step 1: Data Setting — select existing data or upload a new file.
 */
export default function TSIPage() {
  const router = useRouter();
  // ── 파일 업로드 상태 / File upload state ──────────────────────────────
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // ── 데이터 선택 상태 / Selected data row IDs ────────────────────────
  const [selectedData, setSelectedData] = useState<Set<number>>(new Set());

  // ── 검색 키워드 / Search keyword for filtering attached data ────────
  const [searchKeyword, setSearchKeyword] = useState("");

  // ── 목업 데이터 / Mock attached dataset list ────────────────────────
  const attachedData = [
    { id: 1,  name: "Data Name", patients: "1,000",  disease: "Alzheimer's disease",        updateDate: "2025/12/25 17:00:01" },
    { id: 2,  name: "Data Name", patients: "48,000", disease: "Alzheimer's disease",         updateDate: "2025/12/25 17:00:01" },
    { id: 3,  name: "Data Name", patients: "48,000", disease: "Alzheimer's disease",         updateDate: "2025/12/25 17:00:01" },
    { id: 4,  name: "Data Name", patients: "48,000", disease: "Alzheimer's disease",         updateDate: "2025/12/25 17:00:01" },
    { id: 5,  name: "Data Name", patients: "48,000", disease: "Alzheimer's disease",         updateDate: "2025/12/25 17:00:01" },
    { id: 6,  name: "Data Name", patients: "48,000", disease: "Alzheimer's disease",         updateDate: "2025/12/25 17:00:01" },
    { id: 7,  name: "Data Name", patients: "48,000", disease: "Alzheimer's disease",         updateDate: "2025/12/25 17:00:01" },
    { id: 8,  name: "Data Name", patients: "48,000", disease: "Alzheimer's disease",         updateDate: "2025/12/25 17:00:01" },
    { id: 9,  name: "Data Name", patients: "48,000", disease: "Type 2 diabetes mellitus",    updateDate: "2025/12/25 17:00:01" },
    { id: 10, name: "OPMD",      patients: "48,000", disease: "Alzheimer's disease",         updateDate: "2025/12/25 17:00:01" },
  ];

  // ── 이벤트 핸들러 / Event handlers ────────────────────────────────────

  /** 파일 input change 이벤트 / Handle file input change */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  /** 드래그 오버 방지 / Prevent default on drag over */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  /** 파일 드롭 / Handle file drop */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  /** 데이터 행 선택 토글 / Toggle a row selection by ID */
  const toggleDataSelection = (id: number) => {
    const newSelection = new Set(selectedData);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedData(newSelection);
  };

  /** "Use Data" 버튼: 선택된 항목이 있을 때 다음 단계로 이동 / Navigate to patients-summary if any row selected */
  const handleUseData = () => {
    if (selectedData.size > 0) {
      router.push("/tsi/patients-summary");
    }
  };

  // ── 검색 결과 분리 / Filter and split into two columns (8 per column) ──
  const filteredData = attachedData.filter(
    (d) =>
      d.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      d.disease.toLowerCase().includes(searchKeyword.toLowerCase()),
  );
  const leftTableData = filteredData.slice(0, 8);
  const rightTableData = filteredData.slice(8);

  // ── 테이블 행 공통 렌더 / Common row render ──────────────────────────
  /**
   * 데이터 행 하나를 렌더링하는 헬퍼
   * Renders a single data row with checkbox + fields
   */
  const renderDataRow = (
    data: (typeof attachedData)[0],
    index: number,
    isFirst: boolean,
    isLast: boolean,
    paddingVariant: "sm" | "md",
  ) => {
    const pyClass =
      paddingVariant === "sm"
        ? isFirst ? "pt-0 pb-2.5" : isLast ? "pt-2.5 pb-0" : "py-2.5"
        : isFirst ? "pt-0 pb-3"   : isLast ? "pt-3 pb-0"   : "py-3";

    return (
      <div
        key={data.id}
        className={`flex items-center border-b-[1px] border-gray-200 last:border-0 ${pyClass}`}
      >
        {/* 체크박스 + 데이터 이름 / Checkbox + Data Name */}
        <div className="flex items-center gap-4 flex-[3] min-w-0">
          <div className="w-4 flex-shrink-0 flex items-center justify-center">
            <CustomCheckbox
              checked={selectedData.has(data.id)}
              onChange={() => toggleDataSelection(data.id)}
              size={16}
            />
          </div>
          <span className="truncate text-neutral-50 text-body4m">{data.name}</span>
        </div>

        {/* 환자 수 / Patients (N) */}
        <span className="flex-[2] min-w-0 truncate text-neutral-50 text-body4m">{data.patients}</span>

        {/* 질환명 / Disease */}
        <span className="flex-[3] min-w-0 truncate text-neutral-50 text-body4m">{data.disease}</span>

        {/* 업데이트 날짜 / Update date */}
        <span className="flex-[3] min-w-0 truncate text-neutral-50 text-body4m">{data.updateDate}</span>
      </div>
    );
  };

  return (
    <AppLayout headerType="tsi" scaleMode="fit">

      {/* ── 외부 래퍼 / Outer wrapper with horizontal margin ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "calc(100% - 28px)",
          height: "100%",
          marginLeft: "14px",
          marginRight: "14px",
          paddingBottom: "24px",
        }}
      >

        {/* ── 메인 컨테이너 / Main container ─────────────────── */}
        <div className="relative h-full flex-1 min-h-0 flex flex-col gap-[24px]">

          {/* ── 1. 페이지 타이틀 / Page title ──────────────────── */}
          <div style={{ flexShrink: 0, padding: "0px 12px 0 12px" }}>
            <h1 className="m-0 font-['Poppins',_Inter,_sans-serif] font-semibold text-neutral-10 text-[42px] [@media(max-width:1470px)]:text-[36px] leading-[1.1] tracking-[-1.5px]">
              Data Setting
            </h1>
            <span className="font-semibold text-neutral-50" style={{ fontFamily: "Inter", fontSize: 16, letterSpacing: "-0.48px" }}>
              Simulation templates are provided to show the required input
              structure. Please review before proceeding.
            </span>
          </div>

          {/* ── 2. 내부 컨텐츠 컨테이너 / Inner content container ─ */}
          <div className="flex flex-1 min-h-0 flex-col gap-0 h-full">

            {/* ── 2-1. 글래스 카드 배경 / Glass card background ─── */}
            <div
              className="figma-nine-slice figma-home-panel-middle flex flex-1 min-h-0 flex-col"
            >
              <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div
                  className="relative flex flex-col flex-1 min-h-0 gap-6"
                  style={{ minHeight: 244 }}
                >

                  {/* ── 2-1-A. 템플릿 다운로드 + 파일 업로드 영역 / Template download & file upload area ── */}
                  <div className="flex gap-4 min-h-[244px] [@media(max-width:1470px)]:min-h-[184px]" style={{ flex: "0.6 1 0%" }}>

                    {/* Data Template Download 카드 / Data template download card (dark navy) */}
                    <div
                      className="flex-shrink-0 rounded-[24px] p-4 flex flex-col justify-between [@media(max-width:1470px)]:p-3"
                      style={{ backgroundColor: "#231f52", aspectRatio: "1 / 1" }}
                    >
                      <div className="flex h-full justify-center flex-col gap-2 [@media(max-width:1470px)]:gap-1">
                        <div className="flex flex-col gap-2 items-center">
                          {/* 다운로드 아이콘 SVG / Download icon SVG */}
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
                        <p className="text-body4m text-neutral-60 text-center px-0">
                          Download a guide file that includes optimized data
                          formats and examples for service analysis
                        </p>
                      </div>
                      {/* 다운로드 버튼 / Download button */}
                      <button
                        className="btn-tsi btn-tsi-primary"
                        style={{ width: "100%" }}
                      >
                        Download
                      </button>
                    </div>

                    {/* 파일 업로드 카드 / File upload card (white, drag & drop) */}
                    <div
                      className="flex-1 bg-white rounded-[24px] pt-6 pb-3 px-0 flex flex-col items-center justify-center gap-6 min-h-[244px] [@media(max-width:1470px)]:min-h-[184px] [@media(max-width:1470px)]:p-4 [@media(max-width:1470px)]:gap-4"
                    >
                      <div className="flex flex-col items-center justify-center">
                        {/* 업로드 아이콘 SVG / Upload icon SVG */}
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
                        <h3 className="text-body3 text-neutral-10 text-center">
                          Click to upload or Drag and drop
                        </h3>
                        <div className="text-body4m text-neutral-60 text-center mt-3 leading-normal">
                          svg, xlsx
                          <br />
                          *Maximum file size: n MB per file
                        </div>
                      </div>

                      {/* 숨겨진 파일 input / Hidden file input */}
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept=".svg,.xlsx"
                        multiple
                        onChange={handleFileSelect}
                      />

                      {/* 파일 선택 레이블 (드래그 드롭 영역 포함) / File select label (also serves as drop target) */}
                      <label
                        htmlFor="file-upload"
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        className="cursor-pointer flex justify-center"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            document.getElementById("file-upload")?.click()
                          }
                          className="btn-tsi btn-tsi-purple"
                          style={{ width: 222, height: 36 }}
                        >
                          File Select
                        </button>
                      </label>
                    </div>
                  </div>

                  {/* ── 2-1-B. 첨부 데이터 목록 / Attached data list ── */}
                  <div className="flex flex-1 min-h-0 flex-col gap-2">

                    {/* 섹션 헤더: 타이틀 + 검색창 / Section header: title + search input */}
                    <div className="flex-shrink-0 flex items-end justify-between">
                      <h2 className="text-body1 text-neutral-10 align-bottom">Attached Data</h2>
                      <SimulationSearch
                        value={searchKeyword}
                        onChange={setSearchKeyword}
                      />
                    </div>

                    {/* 데이터 테이블 / Data table with two-column layout */}
                    <div className="flex flex-1 min-h-0 flex-col gap-[8px]">

                      {/* 테이블 헤더 행 (좌/우 동일) / Table header row (same for both columns) */}
                      <div
                        className="rounded-[24px] h-wrap flex items-center py-[8px]"
                        style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
                      >
                        <div className="flex text-white w-full text-body4m">
                          {/* 좌측 헤더 / Left header */}
                          <div className="flex items-center flex-1 min-w-0 px-[20px]">
                            <div className="flex items-center gap-4 flex-[3] min-w-0">
                              <div className="w-4 flex-shrink-0" />
                              <span className="truncate">Data Name</span>
                            </div>
                            <span className="flex-[2] min-w-0 truncate">Patients (N)</span>
                            <span className="flex-[3] min-w-0 truncate">Disease</span>
                            <span className="flex-[3] min-w-0 truncate">Update date</span>
                          </div>
                          {/* 구분선 자리 / Divider placeholder */}
                          <div className="w-[2px] flex-shrink-0" />
                          {/* 우측 헤더 / Right header */}
                          <div className="flex items-center flex-1 min-w-0 px-[20px]">
                            <div className="flex items-center gap-4 flex-[3] min-w-0">
                              <div className="w-4 flex-shrink-0" />
                              <span className="truncate">Data Name</span>
                            </div>
                            <span className="flex-[2] min-w-0 truncate">Patients (N)</span>
                            <span className="flex-[3] min-w-0 truncate">Disease</span>
                            <span className="flex-[3] min-w-0 truncate">Update date</span>
                          </div>
                        </div>
                      </div>

                      {/* 테이블 바디: 좌/우 2열 배치 / Table body: two columns side by side */}
                      <div className="flex gap-0 rounded-[24px] flex-1 min-h-0 bg-white overflow-hidden">
                        <SimpleBar style={{ height: "100%", width: "100%" }}>
                          <div className="flex gap-0">
                            {/* 좌측 열 (0~7번 항목) / Left column (items 0–7) */}
                            <div className="flex-1 flex-shrink-0 min-w-0">
                              {leftTableData.length > 0 ? (
                                <div className="px-[16px] py-[12px]">
                                  {leftTableData.map((data, index) =>
                                    renderDataRow(
                                      data,
                                      index,
                                      index === 0,
                                      index === leftTableData.length - 1,
                                      "sm",
                                    ),
                                  )}
                                </div>
                              ) : (
                                /* 데이터 없을 때 빈 상태 / Empty state */
                                <div className="px-5 py-20 flex items-center justify-center min-h-[348px]">
                                  <p className="text-body4 text-neutral-50">
                                    No saved simulations.
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* 열 구분선 / Column divider */}
                            <div className="w-[2px] bg-gray-300 flex-shrink-0 mt-[12px] mb-[12px]" />

                            {/* 우측 열 (8번 이후 항목) / Right column (items 8+) */}
                            <div className="flex-1 flex-shrink-0 min-w-0">
                              {rightTableData.length > 0 ? (
                                <div className="px-[16px] py-[12px]">
                                  {rightTableData.map((data, index) =>
                                    renderDataRow(
                                      data,
                                      index,
                                      index === 0,
                                      index === rightTableData.length - 1,
                                      "md",
                                    ),
                                  )}
                                </div>
                              ) : (
                                /* 데이터 없을 때 빈 상태 / Empty state */
                                <div className="px-5 py-20 flex items-center justify-center min-h-[394px]">
                                  <p className="text-body4 text-neutral-50">
                                    No saved simulations.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </SimpleBar>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* ── 2-1 닫기 / End glass card ── */}

            {/* ── 2-2. 하단 버튼 영역 / Bottom action button ────── */}
            <div className="flex flex-shrink-0 justify-end" style={{ paddingRight: 8 }}>
              {/* "Use Data" 버튼: 선택 항목이 없으면 비활성화 / Disabled when nothing selected */}
              <button
                onClick={handleUseData}
                disabled={selectedData.size === 0}
                className="btn-tsi btn-tsi-primary"
                style={{ gap: 8 }}
              >
                Use Data
                {/* 재생 아이콘 SVG / Play icon SVG */}
                <svg
                  width="11"
                  height="13"
                  viewBox="0 0 11 13"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ flexShrink: 0 }}
                >
                  <path
                    d="M0 11.2324V1.06641C0 0.700195 0.090332 0.431641 0.270996 0.260742C0.45166 0.0849609 0.666504 -0.00292969 0.915527 -0.00292969C1.13525 -0.00292969 1.35986 0.0605469 1.58936 0.1875L10.1221 5.17529C10.4248 5.35107 10.6348 5.50977 10.752 5.65137C10.874 5.78809 10.9351 5.9541 10.9351 6.14941C10.9351 6.33984 10.874 6.50586 10.752 6.64746C10.6348 6.78906 10.4248 6.94775 10.1221 7.12354L1.58936 12.1113C1.35986 12.2383 1.13525 12.3018 0.915527 12.3018C0.666504 12.3018 0.45166 12.2139 0.270996 12.0381C0.090332 11.8623 0 11.5938 0 11.2324Z"
                    fill="white"
                  />
                </svg>
              </button>
            </div>
            {/* ── 2-2 닫기 / End button container ── */}

          </div>
          {/* ── 2 닫기 / End inner content container ── */}

        </div>
        {/* ── 메인 컨테이너 닫기 / End main container ── */}

      </div>
      {/* ── 외부 래퍼 닫기 / End outer wrapper ── */}

    </AppLayout>
  );
}
