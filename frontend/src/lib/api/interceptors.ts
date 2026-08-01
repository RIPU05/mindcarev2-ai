export type ApiRequestDescriptor = {
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
};

export type ApiResponseDescriptor = {
  status: number;
  headers?: Record<string, string>;
};

export type ApiInterceptor = {
  onRequest?: (request: ApiRequestDescriptor) => ApiRequestDescriptor | Promise<ApiRequestDescriptor>;
  onResponse?: (response: ApiResponseDescriptor) => ApiResponseDescriptor | Promise<ApiResponseDescriptor>;
  onError?: (error: unknown) => unknown | Promise<unknown>;
};
