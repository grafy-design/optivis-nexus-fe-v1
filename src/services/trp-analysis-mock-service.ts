import {
  buildTrpAnalysisResponse,
  type TrpAnalysisResponse,
} from "@/services/trp-dashboard-mock-data";
import type { TrpAnalysisRequest } from "@/store/trp-setup-store";

function delay(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export async function runTrpMockAnalysis(
  request: TrpAnalysisRequest
): Promise<TrpAnalysisResponse> {
  await delay(180);
  return buildTrpAnalysisResponse(request);
}

export type { TrpAnalysisResponse };
