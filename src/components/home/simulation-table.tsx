"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SimulationTableProps {
  serviceId?: string | null;
}

const MOCK_UP_SIMULATION_DATA = [
  {
    simulation_name: "OPMD-001",
    disease: "disease",
    outcome: "outcome",
    description: "description",
    last_updated: "2024-06-01",
  },
  {
    simulation_name: "OPMD-002",
    disease: "disease",
    outcome: "outcome",
    description: "description",
    last_updated: "2024-06-02",
  },
];

export default function SimulationTable({ serviceId }: SimulationTableProps) {
  const [tableData, setTableData] = useState(serviceId === "5" ? MOCK_UP_SIMULATION_DATA : []);
  const router = useRouter();
  const firstColumnTitle =
    serviceId === "4" || serviceId === "5" ? "Simulation name" : "Patient ID";

  const handlePlaySimulation = (
    event: React.MouseEvent<HTMLButtonElement>,
    simulationId: string
  ): void => {
    event.preventDefault();

    if (serviceId === "5") {
      router.push(`/tsi/patients-summary?simulationId=${simulationId}`);
    }
  };

  useEffect(() => {
    setTableData(serviceId === "5" ? MOCK_UP_SIMULATION_DATA : []);
  }, [serviceId]);

  return (
    <div className="">
      <div className="text-body5 mb-2 grid h-[40px] grid-cols-[15%_16%_14%_29%_18%_8%] items-center rounded-[24px] bg-[#636364] px-4 text-white">
        <div className="font-medium">{firstColumnTitle}</div>
        <div className="font-medium">Disease</div>
        <div className="font-medium">Outcome</div>
        <div className="font-medium">Description</div>
        <div className="font-medium">Last updated</div>
        <div></div>
      </div>

      {tableData.length === 0 ? (
        <div className="text-body4 min-h-[320px] rounded-[18px] bg-white p-1 text-center">
          <p className="my-auto">No saved simulations.</p>
        </div>
      ) : (
        <div className="min-h-[320px] rounded-[18px] bg-white p-1">
          {tableData.map((row, index) => {
            return (
              <div
                key={index}
                className="grid grid-cols-[15%_16%_14%_29%_18%_8%] items-center px-4 py-[6px] text-[14px] text-[#1b1b1b]"
              >
                <div className="font-medium">{row.simulation_name}</div>
                <div>{row.disease}</div>
                <div>{row.outcome}</div>
                <div>{row.description}</div>
                <div>{row.last_updated}</div>
                <div className="text-right">
                  <button
                    className="inline-flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-[6px] text-[#5D33D6]"
                    aria-label={`Play ${row.simulation_name}`}
                    onClick={(event) => handlePlaySimulation(event, row.simulation_name)}
                  >
                    <svg
                      aria-hidden
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M3 2.2L7.2 5L3 7.8V2.2Z" fill="currentColor" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
