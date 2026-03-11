"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Button from "@/components/ui/button";
import IconButton from "@/components/ui/icon-button";
import { DRD_DEFAULT_SETTING_PATH } from "@/services/drd-mock-up-data";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SimulationTableProps {
  serviceId?: string | null;
  keyword?: string;
  searchQuery?: string;
  extraRows?: ExtraSimulationRow[];
}

type TableType = {
  simulation_name: string;
  disease: string;
  outcome: string;
  description: string;
  last_updated: string;
};

type TableRow = TableType & {
  no: number;
  simulation_id?: string;
};

interface ExtraSimulationRow {
  id: string;
  simulationName: string;
  population?: string;
  disease?: string;
  outcome: string;
  description: string;
  lastUpdated: string;
}

type RowAction = "rename" | "delete";

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
];

const DRD_SNAPSHOT_SIMULATION_DATA: TableType[] = [
  {
    simulation_name: "Dropout Robustness Set",
    disease: "-",
    outcome: "Power 79%",
    description: "MNAR dropout correction scenario",
    last_updated: "2026-02-16",
  },
  {
    simulation_name: "Stage Shift Scenario",
    disease: "-",
    outcome: "+7% PFS",
    description: "Stage migration effect on progression curves",
    last_updated: "2026-02-18",
  },
  {
    simulation_name: "Covariate Drift Monitor",
    disease: "-",
    outcome: "Bias -8%",
    description: "Temporal covariate drift stress simulation",
    last_updated: "2026-02-20",
  },
];

const mapRowsToTableRows = (rows: TableType[] = []): TableRow[] => {
  return rows.map((row, index) => ({
    ...row,
    no: index + 1,
  }));
};

const mapExtraRowsToTableRows = (rows: ExtraSimulationRow[] = []): TableRow[] => {
  return rows.map((row, index) => ({
    no: index + 1,
    simulation_id: row.id,
    simulation_name: row.simulationName,
    disease: row.population ?? row.disease ?? "-",
    outcome: row.outcome,
    description: row.description,
    last_updated: row.lastUpdated,
  }));
};

const renumberRows = (rows: TableRow[]): TableRow[] => {
  return rows.map((row, index) => ({
    ...row,
    no: index + 1,
  }));
};

const getRowKey = (row: TableRow): string => {
  return row.simulation_id?.trim() ? row.simulation_id : String(row.no);
};

export default function SimulationTable({
  serviceId,
  keyword,
  searchQuery,
  extraRows,
}: SimulationTableProps) {
  const [originTableData, setOriginTableData] = useState<TableRow[]>([]);
  const [resultTableData, setResultTableData] = useState<TableRow[]>([]);
  const [openedActionMenuKey, setOpenedActionMenuKey] = useState<string | null>(null);
  const [editingRowKey, setEditingRowKey] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const router = useRouter();
  const firstColumnTitle =
    serviceId === "4" || serviceId === "5" || serviceId === "6" ? "Simulation name" : "Patient ID";
  const secondColumnTitle = serviceId === "6" ? "Population" : "Disease";
  const thirdColumnTitle = serviceId === "6" ? "Target Outcome" : "Outcome";
  const lastUpdatedColumnTitle = serviceId === "6" ? "Last Updated" : "Last updated";

  const handlePlaySimulation = (
    event: React.MouseEvent<HTMLButtonElement>,
    simulationId: string
  ): void => {
    event.preventDefault();

    if (serviceId === "5") {
      router.push(`/tsi/patients-summary?simulationId=${simulationId}`);
      return;
    }

    if (serviceId === "6") {
      router.push(DRD_DEFAULT_SETTING_PATH);
    }
  };

  useEffect(() => {
    const nextRows =
      serviceId === "5"
        ? mapRowsToTableRows(MOCK_UP_SIMULATION_DATA)
        : serviceId === "6"
          ? extraRows?.length
            ? mapExtraRowsToTableRows(extraRows)
            : mapRowsToTableRows(DRD_SNAPSHOT_SIMULATION_DATA)
          : [];

    setOriginTableData(nextRows);
    setResultTableData(nextRows);
    setEditingRowKey(null);
    setEditingName("");
    setOpenedActionMenuKey(null);
  }, [extraRows, serviceId]);

  useEffect(() => {
    const normalizedKeyword = (searchQuery ?? keyword)?.trim().toLowerCase() ?? "";

    if (!normalizedKeyword) {
      setResultTableData(originTableData);
      return;
    }

    const filteredTableData = originTableData.filter((row) => {
      return Object.values(row).some((value) => {
        if (value === null || value === undefined) {
          return false;
        }

        return String(value).toLowerCase().includes(normalizedKeyword);
      });
    });

    setResultTableData(filteredTableData);
  }, [keyword, originTableData, searchQuery]);

  const handleRenameStart = (row: TableRow) => {
    setEditingRowKey(getRowKey(row));
    setEditingName(row.simulation_name);
  };

  const handleRenameCancel = () => {
    setEditingRowKey(null);
    setEditingName("");
  };

  const handleRenameSave = (targetRowKey: string) => {
    const nextName = editingName.trim();

    if (!nextName || nextName.length > 255) {
      return;
    }

    setOriginTableData((previousRows) =>
      previousRows.map((row) =>
        getRowKey(row) === targetRowKey
          ? {
              ...row,
              simulation_name: nextName,
            }
          : row
      )
    );
    setEditingRowKey(null);
    setEditingName("");
  };

  const handleDelete = (targetRowKey: string) => {
    const shouldDelete = window.confirm("Delete this simulation?");

    if (!shouldDelete) {
      return;
    }

    setOriginTableData((previousRows) => {
      const filteredRows = previousRows.filter((row) => getRowKey(row) !== targetRowKey);
      return renumberRows(filteredRows);
    });

    if (editingRowKey === targetRowKey) {
      setEditingRowKey(null);
      setEditingName("");
    }
  };

  const handleRowActionClick = (action: RowAction, row: TableRow) => {
    setOpenedActionMenuKey(null);
    const rowKey = getRowKey(row);

    switch (action) {
      case "rename":
        handleRenameStart(row);
        return;
      case "delete":
        handleDelete(rowKey);
        return;
      default:
        return;
    }
  };

  const headerColumns = [
    { label: "No.", flex: 24 },
    { label: firstColumnTitle, flex: 145 },
    { label: secondColumnTitle, flex: 165 },
    { label: thirdColumnTitle, flex: 140 },
    { label: "Description", flex: 283 },
    { label: lastUpdatedColumnTitle, flex: 161 },
    { label: "", flex: 66 },
  ];

  return (
    <div className="flex w-full flex-col" style={{ gap: "12px", flex: 1, minHeight: 0 }}>
      <div
        className="flex items-center"
        style={{
          width: "100%",
          height: "41px",
          backgroundColor: "#000000",
          borderRadius: "24px",
          paddingLeft: "24px",
          paddingRight: "24px",
          paddingTop: "12px",
          paddingBottom: "12px",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        <div className="flex items-center" style={{ gap: "16px", width: "100%" }}>
          {headerColumns.map((column, index) => (
            <span
              key={`header-col-${index}`}
              className="home-simulation-table-header-text"
              style={{
                fontFamily: "Inter",
                fontSize: "13px",
                fontWeight: 600,
                lineHeight: "17px",
                letterSpacing: "-0.3px",
                color: "#FFFFFF",
                flex: `${column.flex} 1 0px`,
                minWidth: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {column.label}
            </span>
          ))}
        </div>
      </div>

      {resultTableData.length === 0 ? (
        <div
          className="flex items-center justify-center rounded-[24px] bg-white text-center"
          style={{ flex: 1, minHeight: "394px", padding: "10px 8px" }}
        >
          <p
            className="home-simulation-table-empty-text"
            style={{
              fontFamily: "Inter",
              fontSize: "19.5px",
              fontWeight: 600,
              lineHeight: "100%",
              letterSpacing: "-0.585px",
              color: "#C6C5C9",
              margin: 0,
            }}
          >
            No saved simulations.
          </p>
        </div>
      ) : (
        <div
          className="w-full overflow-y-auto rounded-[24px] bg-white"
          style={{ flex: 1, minHeight: "394px", padding: "10px 8px" }}
        >
          <div className="flex flex-col" style={{ gap: "8px" }}>
            {resultTableData.map((row) => {
              const rowKey = getRowKey(row);
              const rowActionKey = `${rowKey}-action`;
              const isEditing = editingRowKey === rowKey;

              return (
                <div
                  key={rowActionKey}
                  className="flex items-center"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(250,250,250,0.95) 0%, rgba(245,245,245,0.92) 100%)",
                    border: "1px solid rgba(225,225,225,0.9)",
                    borderRadius: "16px",
                    minHeight: "52px",
                    padding: "8px 14px",
                    gap: "16px",
                  }}
                >
                  <span
                    style={{
                      flex: "24 1 0px",
                      minWidth: 0,
                      fontFamily: "Inter",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#202020",
                    }}
                  >
                    {row.no}
                  </span>
                  {isEditing ? (
                    <input
                      type="text"
                      autoFocus
                      maxLength={255}
                      value={editingName}
                      onChange={(event) => {
                        setEditingName(event.target.value);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleRenameSave(rowKey);
                        }

                        if (event.key === "Escape") {
                          event.preventDefault();
                          handleRenameCancel();
                        }
                      }}
                      onBlur={handleRenameCancel}
                      aria-label={`Rename ${row.simulation_name}`}
                      style={{
                        flex: "145 1 0px",
                        minWidth: 0,
                        width: "100%",
                        height: "28px",
                        borderRadius: "8px",
                        border: "1px solid #c6c5c9",
                        padding: "0 8px",
                        fontFamily: "Inter",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#202020",
                        outline: "none",
                      }}
                    />
                  ) : (
                    <span
                      title={row.simulation_name}
                      style={{
                        flex: "145 1 0px",
                        minWidth: 0,
                        fontFamily: "Inter",
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#202020",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {row.simulation_name}
                    </span>
                  )}
                  <span
                    title={row.disease}
                    style={{
                      flex: "165 1 0px",
                      minWidth: 0,
                      fontFamily: "Inter",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#3F3F3F",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {row.disease}
                  </span>
                  <span
                    title={row.outcome}
                    style={{
                      flex: "140 1 0px",
                      minWidth: 0,
                      fontFamily: "Inter",
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "#2E3F68",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {row.outcome}
                  </span>
                  <span
                    title={row.description}
                    style={{
                      flex: "283 1 0px",
                      minWidth: 0,
                      fontFamily: "Inter",
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "#5B5B5B",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {row.description}
                  </span>
                  <span
                    title={row.last_updated}
                    style={{
                      flex: "161 1 0px",
                      minWidth: 0,
                      fontFamily: "Inter",
                      fontSize: "12px",
                      fontWeight: 500,
                      color: "#6B6B6B",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {row.last_updated}
                  </span>
                  <div
                    className="flex items-center justify-end"
                    style={{ flex: "66 1 0px", minWidth: 0, gap: "6px" }}
                  >
                    <IconButton
                      className="inline-flex h-[24px] w-[24px] cursor-pointer items-center justify-center rounded-[8px] text-[#787776]"
                      aria-label={`Play ${row.simulation_name}`}
                      onClick={(event) => handlePlaySimulation(event, row.simulation_id ?? row.simulation_name)}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M4 15.7833V4.21667C4 3.8 4.09913 3.49444 4.29739 3.3C4.49565 3.1 4.73141 3 5.00469 3C5.24581 3 5.4923 3.07222 5.74414 3.21667L15.1078 8.89167C15.4401 9.09167 15.6705 9.27222 15.7991 9.43333C15.933 9.58889 16 9.77778 16 10C16 10.2167 15.933 10.4056 15.7991 10.5667C15.6705 10.7278 15.4401 10.9083 15.1078 11.1083L5.74414 16.7833C5.4923 16.9278 5.24581 17 5.00469 17C4.73141 17 4.49565 16.9 4.29739 16.7C4.09913 16.5 4 16.1944 4 15.7833Z"
                          fill="#787776"
                        />
                      </svg>
                    </IconButton>
                    <Popover
                      open={openedActionMenuKey === rowActionKey}
                      onOpenChange={(open) => {
                        setOpenedActionMenuKey(open ? rowActionKey : null);
                      }}
                    >
                      <PopoverTrigger asChild>
                        <IconButton
                          className="inline-flex h-[24px] w-[24px] cursor-pointer items-center justify-center rounded-[8px] text-[#787776]"
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
                              fill="#787776"
                            />
                          </svg>
                        </IconButton>
                      </PopoverTrigger>
                      <PopoverContent
                        side="left"
                        align="start"
                        sideOffset={8}
                        className="w-[220px] rounded-[22px] border border-[#c5c5c5] bg-[#d9d9d9] p-2 shadow-[0_12px_28px_rgba(0,0,0,0.2)]"
                      >
                        <div className="flex flex-col gap-1">
                          <Button
                            unstyled
                            className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-left text-[15px] font-medium text-[#484646] hover:bg-[#c8c8c8]"
                            onClick={() => handleRowActionClick("rename", row)}
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
                          </Button>
                          <Button
                            unstyled
                            className="flex w-full items-center gap-3 rounded-[12px] px-3 py-2 text-left text-[15px] font-medium text-[#484646] hover:bg-[#c8c8c8]"
                            onClick={() => handleRowActionClick("delete", row)}
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
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        /* [TEMP_SCALE_MODE_DISABLE] 차후 반응형 작업 시 복구
        @media (max-width: 1800px) {
          .home-simulation-table-header-text {
            font-size: 10px !important;
          }

          .home-simulation-table-empty-text {
            font-size: 16.5px !important;
          }
        }
        */
      `}</style>
    </div>
  );
}
