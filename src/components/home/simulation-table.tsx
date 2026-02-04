"use client";

interface SimulationTableProps {
  serviceId?: string | null;
}

export default function SimulationTable({ serviceId }: SimulationTableProps) {
  // 서비스 ID에 따라 헤더 내용 결정
  const getHeaderColumns = () => {
    if (serviceId === "4" || serviceId === "5") {
      // Adaptive Trial Simulation
      return (
        <>
          <span className="w-[106px]">Simulation name</span>
          <span className="w-[120px]">Disease</span>
          <span className="w-[102px]">Outcome</span>
          <span className="w-[206px]">Description</span>
          <span className="w-[117px]">Last updated</span>
        </>
      );
    } else {
      // Drug Response Prediction Dashboard (기본값)
      return (
        <>
          <span className="w-[106px]">Patient ID</span>
          <span className="w-[120px]">Disease</span>
          <span className="w-[102px]">Outcome</span>
          <span className="w-[206px]">Description</span>
          <span className="w-[117px]">Last updated</span>
        </>
      );
    }
  };

  return (
    <div className="flex flex-col w-full gap-[10px]">
      {/* Table Header */}
      <div className="rounded-[24px] px-10 h-[46px] bg-[#636364] flex items-center">
        <div className="flex items-center gap-8 text-body5 text-white w-full">
          {getHeaderColumns()}
        </div>
      </div>

      {/* Table Body */}
      <div className="rounded-[18px] px-5 py-20 flex items-center justify-center bg-white min-h-[394px]">
        <p className="text-body4 text-[#828993]">No saved simulations.</p>
      </div>
    </div>
  );
}
