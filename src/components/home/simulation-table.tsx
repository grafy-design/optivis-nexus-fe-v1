"use client";

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
            return (
              <div
                key={index}
                className="grid grid-cols-[15%_16%_14%_29%_18%_8%] items-center px-4 py-[6px] text-[14px] text-[#1b1b1b]"
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
                <div className="text-right">
                  <button
                    className="inline-flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-[6px] text-[#484646]"
                    aria-label={`Play ${row.simulation_name}`}
                    onClick={(event) => handlePlaySimulation(event, row.simulation_name)}
                  >
                    <svg
                      aria-hidden
                      width="10"
                      height="12"
                      viewBox="0 0 10 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M0.75 0.75L8.75 5.75L0.75 10.75V0.75Z"
                        fill="#484646"
                        stroke="#484646"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
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
