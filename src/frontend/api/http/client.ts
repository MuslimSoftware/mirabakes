import type { ApiError, ApiSuccess } from "@/shared/types/api";

type Primitive = string | number | boolean;
type QueryValue = Primitive | null | undefined;

type QueryParams = Record<string, QueryValue>;

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: QueryParams;
  body?: unknown;
  headers?: HeadersInit;
  cache?: RequestCache;
};

export class ApiClientError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(message: string, status: number, code = "request_failed") {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

function buildQueryString(query?: QueryParams): string {
  if (!query) {
    return "";
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== null && value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiSuccess<T> | ApiError;

  if (!response.ok) {
    const message = "error" in payload ? payload.error.message : "Request failed";
    const code = "error" in payload ? payload.error.code : "request_failed";
    throw new ApiClientError(message, response.status, code);
  }

  return (payload as ApiSuccess<T>).data;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", query, body, headers, cache = "no-store" } = options;
  const response = await fetch(`${path}${buildQueryString(query)}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined,
    cache
  });

  return parseResponse<T>(response);
}

export async function apiUpload<T>(path: string, formData: FormData, headers?: HeadersInit): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: headers ?? {},
    body: formData
  });

  return parseResponse<T>(response);
}
