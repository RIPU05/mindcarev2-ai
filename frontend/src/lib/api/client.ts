import { ApiError } from "./errors";
import type { ApiInterceptor, ApiRequestDescriptor } from "./interceptors";
import { supabase } from "@/lib/auth/supabase";

export type ApiClientConfig = {
  baseUrl: string;
  timeoutMs?: number;
  retries?: number;
  interceptors?: ApiInterceptor[];
};

export type RequestOptions<TBody = unknown> = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: TBody;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

const DEFAULT_TIMEOUT_MS = 12_000;
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

export class ApiClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly retries: number;
  private readonly interceptors: ApiInterceptor[];

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.retries = config.retries ?? 1;
    this.interceptors = config.interceptors ?? [];
  }

  get<TResponse>(url: string, options?: RequestOptions) {
    return this.request<TResponse>(url, { ...options, method: "GET" });
  }

  post<TResponse, TBody = unknown>(url: string, body: TBody, options?: RequestOptions<TBody>) {
    return this.request<TResponse, TBody>(url, { ...options, method: "POST", body });
  }

  patch<TResponse, TBody = unknown>(url: string, body: TBody, options?: RequestOptions<TBody>) {
    return this.request<TResponse, TBody>(url, { ...options, method: "PATCH", body });
  }

  async request<TResponse, TBody = unknown>(url: string, options: RequestOptions<TBody> = {}): Promise<TResponse> {
    const method = options.method ?? "GET";
    let descriptor: ApiRequestDescriptor = { url, method, headers: options.headers };

    for (const interceptor of this.interceptors) {
      descriptor = (await interceptor.onRequest?.(descriptor)) ?? descriptor;
    }

    let lastError: unknown;
    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), this.timeoutMs);
      const abort = () => controller.abort();
      options.signal?.addEventListener("abort", abort, { once: true });

      try {
        const response = await fetch(`${this.baseUrl}${descriptor.url}`, {
          method,
          headers: {
            Accept: "application/json",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(await getAuthHeader()),
            ...descriptor.headers
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal
        });

        for (const interceptor of this.interceptors) {
          await interceptor.onResponse?.({ status: response.status });
        }

        if (!response.ok) {
          const error = await ApiError.fromResponse(response);
          if (attempt < this.retries && RETRYABLE_STATUS.has(response.status)) continue;
          throw error;
        }

        if (response.status === 204) return undefined as TResponse;
        return (await response.json()) as TResponse;
      } catch (error) {
        lastError = error;
        const normalized = ApiError.fromUnknown(error);
        for (const interceptor of this.interceptors) {
          await interceptor.onError?.(normalized);
        }
        if (attempt >= this.retries || normalized.code !== "NETWORK_ERROR") throw normalized;
      } finally {
        window.clearTimeout(timeout);
        options.signal?.removeEventListener("abort", abort);
      }
    }

    throw ApiError.fromUnknown(lastError);
  }
}

export const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1",
  timeoutMs: Number(process.env.NEXT_PUBLIC_API_TIMEOUT_MS ?? 12_000),
  retries: Number(process.env.NEXT_PUBLIC_API_RETRIES ?? 1)
});

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}
