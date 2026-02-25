"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const [tableData] = useState(serviceId === "5" ? MOCK_UP_SIMULATION_DATA : []);
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

  return (
    <div className="w-full overflow-hidden rounded-[18px]">
      <table className="w-full table-fixed border-separate border-spacing-y-[10px]">
        <thead>
          <tr className="h-[46px] bg-[#636364] text-body5 text-white">
            <th className="rounded-l-[24px] px-6 text-left font-medium">{firstColumnTitle}</th>
            <th className="px-6 text-left font-medium">Disease</th>
            <th className="px-6 text-left font-medium">Outcome</th>
            <th className="px-6 text-left font-medium">Description</th>
            <th className=" px-6 text-left font-medium">Last updated</th>
            <th className="rounded-r-[24px]"></th>
          </tr>
        </thead>

        <tbody className="bg-white">
          {tableData.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="min-h-[394px] px-5 py-20 text-center text-body4 text-[#828993]"
              >
                No saved simulations.
              </td>
            </tr>
          ) : (
            tableData.map((row, index) => {
              return (
                <tr key={index} className="text-body4 text-[#1b1b1b]">
                  <td className="px-6 py-2">{row.simulation_name}</td>
                  <td className="px-6 py-2">{row.disease}</td>
                  <td className="px-6 py-2">{row.outcome}</td>
                  <td className="px-6 py-2">{row.description}</td>
                  <td className="px-6 py-2">{row.last_updated}</td>
                  <td className="px-6 py-2">
                    <button
                      className="cursor-pointer"
                      onClick={(event) => handlePlaySimulation(event, row.simulation_name)}
                    >
                      play
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
