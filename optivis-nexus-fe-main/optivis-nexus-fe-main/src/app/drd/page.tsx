import { redirect } from "next/navigation";
import { DRD_MOCK_UP_DATA } from "@/services/drd-mock-up-data";

type SearchParamValue = string | string[] | undefined;

export default async function DrdPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, SearchParamValue>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined) {
          params.append(key, item);
        }
      });
      continue;
    }
    if (value !== undefined) {
      params.set(key, value);
    }
  }

  const hasTaskId =
    params.has("task_id") ||
    params.has("taskId") ||
    params.has("test_id");

  if (!hasTaskId && DRD_MOCK_UP_DATA.task_id) {
    params.set("task_id", DRD_MOCK_UP_DATA.task_id);
  }

  if (!params.has("disease_id") && DRD_MOCK_UP_DATA.disease_id) {
    params.set("disease_id", DRD_MOCK_UP_DATA.disease_id);
  }

  if (!params.has("data_id") && DRD_MOCK_UP_DATA.data_id) {
    params.set("data_id", DRD_MOCK_UP_DATA.data_id);
  }

  const query = params.toString();
  redirect(query ? `/drd/default-setting?${query}` : "/drd/default-setting");
}
