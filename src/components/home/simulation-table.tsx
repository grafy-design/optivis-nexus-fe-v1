"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SimulationTableProps {
  serviceId?: string | null;
  keyword?: string;
}

type TableType = {
  simulation_name: string;
  disease: string;
  outcome: string;
  description: string;
  last_updated: string;
};

type RowAction = "rename" | "duplicate" | "favorite" | "delete";

const MOCK_UP_SIMULATION_DATA: TableType[] = [
  {
    simulation_name: "ATS Cohort A Dose Sweep",
    disease: "NSCLC",
    outcome: "+18% ORR",
    description: "Dose escalation with biomarker-positive subgroup",
    last_updated: "2026-02-12",
  },
  {
    simulation_name: "ATS Safety Window v2",
    disease: "AML",
    outcome: "DLT -9%",
    description: "Safety boundary optimization for cycle-1 toxicity",
    last_updated: "2026-02-13",
  },
  {
    simulation_name: "Adaptive Interim Rule-3",
    disease: "Breast Cancer",
    outcome: "Power 82%",
    description: "Interim stopping rule tuning for futility",
    last_updated: "2026-02-13",
  },
  {
    simulation_name: "Subgroup Response Alpha",
    disease: "RA",
    outcome: "+11% ACR50",
    description: "Responder enrichment by baseline CRP",
    last_updated: "2026-02-14",
  },
  {
    simulation_name: "ATS Enrollment Stress",
    disease: "IBD",
    outcome: "Timeline -6w",
    description: "Enrollment volatility and site-mix simulation",
    last_updated: "2026-02-14",
  },
  {
    simulation_name: "Twin Predict ARM-B",
    disease: "HCC",
    outcome: "HR 0.78",
    description: "Historical control blending for ARM-B",
    last_updated: "2026-02-15",
  },
  {
    simulation_name: "Protocol Drift Guard",
    disease: "SLE",
    outcome: "Bias -14%",
    description: "Protocol deviation sensitivity analysis",
    last_updated: "2026-02-15",
  },
  {
    simulation_name: "Dropout Robustness Set",
    disease: "COPD",
    outcome: "Power 79%",
    description: "MNAR dropout correction scenario",
    last_updated: "2026-02-16",
  },
  {
    simulation_name: "Dose Frequency Beta",
    disease: "Psoriasis",
    outcome: "+9% PASI90",
    description: "Q2W vs Q4W exposure-response comparison",
    last_updated: "2026-02-16",
  },
  {
    simulation_name: "ATS Site Quality Mix",
    disease: "Melanoma",
    outcome: "SDV -22%",
    description: "Site quality weighted randomization impact",
    last_updated: "2026-02-16",
  },
  {
    simulation_name: "Event Accrual Predictor",
    disease: "mCRC",
    outcome: "Readout -5w",
    description: "Event accrual acceleration under adaptive design",
    last_updated: "2026-02-17",
  },
  {
    simulation_name: "Synthetic Arm Gamma",
    disease: "Glioblastoma",
    outcome: "HR 0.83",
    description: "Synthetic control arm calibration by age strata",
    last_updated: "2026-02-17",
  },
  {
    simulation_name: "Stage Shift Scenario",
    disease: "Pancreatic",
    outcome: "+7% PFS",
    description: "Stage migration effect on progression curves",
    last_updated: "2026-02-18",
  },
  {
    simulation_name: "Adaptive Randomization R1",
    disease: "Ovarian",
    outcome: "+13% ORR",
    description: "Response-adaptive randomization trial run",
    last_updated: "2026-02-18",
  },
  {
    simulation_name: "Bayesian Borrowing Delta",
    disease: "DLBCL",
    outcome: "Posterior 0.91",
    description: "Borrowing intensity tuning from external cohort",
    last_updated: "2026-02-19",
  },
  {
    simulation_name: "Eligibility Relaxation Test",
    disease: "UC",
    outcome: "Enroll +21%",
    description: "Inclusion criterion relaxation what-if",
    last_updated: "2026-02-19",
  },
  {
    simulation_name: "Biomarker Cutoff 0.35",
    disease: "TNBC",
    outcome: "AUC 0.84",
    description: "Predictive cutoff optimization for stratification",
    last_updated: "2026-02-20",
  },
  {
    simulation_name: "Covariate Drift Monitor",
    disease: "Atopic Derm.",
    outcome: "Bias -8%",
    description: "Temporal covariate drift stress simulation",
    last_updated: "2026-02-20",
  },
  {
    simulation_name: "Adaptive Futility Rule",
    disease: "Parkinson's",
    outcome: "Cost -12%",
    description: "Early futility stop with preserved power",
    last_updated: "2026-02-21",
  },
  {
    simulation_name: "Endpoint Robustness E2",
    disease: "NASH",
    outcome: "CV 0.17",
    description: "Primary endpoint robustness under noise",
    last_updated: "2026-02-21",
  },
];

export default function SimulationTable({ serviceId, keyword }: SimulationTableProps) {
  const [originTableData, setOriginTableData] = useState<TableType[]>([]);
  const [resultTableData, setResultTableData] = useState<TableType[]>([]);
  const [openedActionMenuKey, setOpenedActionMenuKey] = useState<string | null>(null);
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
    setResultTableData(serviceId === "5" ? MOCK_UP_SIMULATION_DATA : []);
    setOriginTableData(serviceId === "5" ? MOCK_UP_SIMULATION_DATA : []);
  }, [serviceId]);

  useEffect(() => {
    const normalizedKeyword = keyword?.trim().toLowerCase() ?? "";

    if (!normalizedKeyword) {
      setResultTableData(originTableData);
      return;
    }

    const filteredTableData = originTableData.filter((row) => {
      return Object.values(row).some((value) => {
        return value.toLowerCase().includes(normalizedKeyword);
      });
    });

    setResultTableData(filteredTableData);
  }, [keyword, originTableData]);

  const handleRowActionClick = (action: RowAction, simulationId: string) => {
    setOpenedActionMenuKey(null);

    if (!simulationId) return;

    // TODO: Replace temporary console logs with real row action logic/API calls.
    switch (action) {
      case "rename":
        console.log("[SimulationTable] Rename clicked", { simulationId });
        return;
      case "duplicate":
        console.log("[SimulationTable] Duplicate clicked", { simulationId });
        return;
      case "favorite":
        console.log("[SimulationTable] Favorites clicked", { simulationId });
        return;
      case "delete":
        console.log("[SimulationTable] Delete clicked", { simulationId });
        return;
      default:
        return;
    }
  };

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

      {resultTableData.length === 0 ? (
        <div className="text-body4 flex h-[320px] items-center justify-center rounded-[18px] bg-white p-1 text-center">
          <p className="my-auto">No saved simulations.</p>
        </div>
      ) : (
        <div className="h-[320px] overflow-y-auto rounded-[18px] bg-white p-1">
          {resultTableData.map((row, index) => {
            const rowActionKey = `${row.simulation_name}-${row.last_updated}-${index}`;

            return (
              <div
                key={rowActionKey}
                className="grid grid-cols-[15%_16%_14%_29%_18%_8%] items-center px-4 py-[6px] text-xs text-[14px] font-semibold text-[#484646]"
              >
                <div className="truncate font-medium" title={row.simulation_name}>
                  {row.simulation_name}
                </div>
                <div className="truncate" title={row.disease}>
                  {row.disease}
                </div>
                <div className="truncate" title={row.outcome}>
                  {row.outcome}
                </div>
                <div className="truncate" title={row.description}>
                  {row.description}
                </div>
                <div className="truncate" title={row.last_updated}>
                  {row.last_updated}
                </div>
                <div className="flex items-center justify-end gap-1">
                  <button
                    className="inline-flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-[6px] text-[#484646]"
                    aria-label={`Play ${row.simulation_name}`}
                    onClick={(event) => handlePlaySimulation(event, row.simulation_name)}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8 7L16 12L8 17V7Z"
                        fill="#484646"
                        stroke="#484646"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <Popover
                    open={openedActionMenuKey === rowActionKey}
                    onOpenChange={(open) => {
                      setOpenedActionMenuKey(open ? rowActionKey : null);
                    }}
                  >
                    <PopoverTrigger asChild>
                      <button
                        className="inline-flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-[6px] text-[#484646]"
                        aria-label={`More_Action ${row.simulation_name}`}
                      >
                        <svg
                          width="24"
                          height="24"
                          viewBox="0 0 24 24"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M10 12C10 12.5304 10.2107 13.0391 10.5858 13.4142C10.9609 13.7893 11.4696 14 12 14C12.5304 14 13.0391 13.7893 13.4142 13.4142C13.7893 13.0391 14 12.5304 14 12C14 11.4696 13.7893 10.9609 13.4142 10.5858C13.0391 10.2107 12.5304 10 12 10C11.4696 10 10.9609 10.2107 10.5858 10.5858C10.2107 10.9609 10 11.4696 10 12ZM10 6C10 6.53043 10.2107 7.03914 10.5858 7.41421C10.9609 7.78929 11.4696 8 12 8C12.5304 8 13.0391 7.78929 13.4142 7.41421C13.7893 7.03914 14 6.53043 14 6C14 5.46957 13.7893 4.96086 13.4142 4.58579C13.0391 4.21071 12.5304 4 12 4C11.4696 4 10.9609 4.21071 10.5858 4.58579C10.2107 4.96086 10 5.46957 10 6ZM10 18C10 18.5304 10.2107 19.0391 10.5858 19.4142C10.9609 19.7893 11.4696 20 12 20C12.5304 20 13.0391 19.7893 13.4142 19.4142C13.7893 19.0391 14 18.5304 14 18C14 17.4696 13.7893 16.9609 13.4142 16.5858C13.0391 16.2107 12.5304 16 12 16C11.4696 16 10.9609 16.2107 10.5858 16.5858C10.2107 16.9609 10 17.4696 10 18Z"
                            fill="#ADAAAA"
                          />
                        </svg>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      side="left"
                      align="start"
                      sideOffset={8}
                      className="w-[220px] rounded-[22px] border border-[#c5c5c5] bg-[#d9d9d9] p-2 shadow-[0_12px_28px_rgba(0,0,0,0.2)]"
                    >
                      <div className="flex flex-col gap-1">
                        <button
                          className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-left text-[15px] font-medium text-[#484646] hover:bg-[#c8c8c8]"
                          onClick={() => handleRowActionClick("rename", row.simulation_name)}
                        >
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M3 21H7L18 10L14 6L3 17V21Z"
                              stroke="#484646"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M12 8L16 12"
                              stroke="#484646"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Rename
                        </button>
                        <button
                          className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-left text-[15px] font-medium text-[#484646] hover:bg-[#c8c8c8]"
                          onClick={() => handleRowActionClick("duplicate", row.simulation_name)}
                        >
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <rect
                              x="8"
                              y="8"
                              width="12"
                              height="12"
                              rx="2"
                              stroke="#484646"
                              strokeWidth="1.8"
                            />
                            <rect
                              x="4"
                              y="4"
                              width="12"
                              height="12"
                              rx="2"
                              stroke="#484646"
                              strokeWidth="1.8"
                            />
                          </svg>
                          Duplicate
                        </button>
                        <button
                          className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-left text-[15px] font-medium text-[#484646] hover:bg-[#c8c8c8]"
                          onClick={() => handleRowActionClick("favorite", row.simulation_name)}
                        >
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M12 3L14.86 8.79L21 9.67L16.5 14.06L17.56 20.2L12 17.27L6.44 20.2L7.5 14.06L3 9.67L9.14 8.79L12 3Z"
                              stroke="#484646"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Favorites
                        </button>
                        <button
                          className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-left text-[15px] font-medium text-[#484646] hover:bg-[#c8c8c8]"
                          onClick={() => handleRowActionClick("delete", row.simulation_name)}
                        >
                          <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M4 7H20"
                              stroke="#484646"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M9 7V5C9 4.44772 9.44772 4 10 4H14C14.5523 4 15 4.44772 15 5V7"
                              stroke="#484646"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M6 7L7 20H17L18 7"
                              stroke="#484646"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M10 11V16"
                              stroke="#484646"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                            <path
                              d="M14 11V16"
                              stroke="#484646"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
