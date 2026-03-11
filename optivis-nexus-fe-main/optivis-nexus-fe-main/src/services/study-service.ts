import { fetcher } from "@/lib/fetcher";
import type { PlayAPIResponse, StudyParameters } from "./types/study-service.types";

export type * from "./types/study-service.types";

// Play API 호출
export const callMLStudyDesign = async (
  parameters: StudyParameters
): Promise<PlayAPIResponse> => {
  return await fetcher<PlayAPIResponse>(
    "api/nexus/learning/study/play/",
    "POST",
    "ML Study Design API 호출에 실패했습니다.",
    {
      body: parameters,
      timeoutMs: 600_000,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};

// 파일 다운로드 API 호출
export const downloadReportFile = async (taskId: string): Promise<Blob> => {
  return await fetcher<Blob>(`api/nexus/files/download/${taskId}/`, "GET", "파일 다운로드에 실패했습니다.", {
    responseType: "blob",
  });
};
