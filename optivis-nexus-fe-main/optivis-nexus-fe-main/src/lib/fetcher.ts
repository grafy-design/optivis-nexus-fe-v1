type HTTPMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://nexus.oprimed.com";
const DEFAULT_TIMEOUT_MS = 600_000; // 10분

interface FetcherOptions {
  headers?: HeadersInit;
  body?: unknown;
  timeoutMs?: number;
  responseType?: "json" | "blob";
  cache?: RequestCache;
}

const buildBody = (body: unknown): BodyInit | undefined => {
  if (body === undefined) return undefined;
  if (
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    body instanceof ArrayBuffer
  ) {
    return body;
  }

  return JSON.stringify(body);
};

export const fetcher = async <T>(
  url: string,
  method: HTTPMethod,
  errorMsg: string,
  options: FetcherOptions = {}
): Promise<T> => {
  const {
    headers = {},
    body,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    responseType = "json",
    cache,
  } = options;

  const controller = new AbortController();
  const timeoutId = timeoutMs > 0 ? setTimeout(() => controller.abort(), timeoutMs) : null;

  try {
    const response = await fetch(`${API_BASE_URL}/${url}`, {
      method,
      headers: {
        accept: "application/json",
        ...headers,
      },
      body: buildBody(body),
      cache,
      mode: "cors",
      credentials: "omit",
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    if (responseType === "blob") {
      return (await response.blob()) as T;
    }

    const text = await response.text();
    if (!text) {
      return {} as T;
    }
    return JSON.parse(text) as T;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        throw new Error(
          "요청 시간이 초과되었습니다. 응답이 너무 큽니다. 잠시 후 다시 시도해주세요."
        );
      }

      if (error.message.includes("Failed to fetch") || error.name === "TypeError") {
        throw new Error(
          `네트워크 연결에 실패했습니다. 서버(${API_BASE_URL})에 연결할 수 없습니다. ` +
            `CORS 문제이거나 서버가 응답하지 않을 수 있습니다.`
        );
      }

      throw error;
    }

    throw new Error(errorMsg);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};
