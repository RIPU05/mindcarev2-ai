export type ApiErrorCode =
  | "UNKNOWN"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE";

export type ApiErrorShape = {
  code: ApiErrorCode;
  message: string;
  requestId?: string;
  details?: unknown;
  status?: number;
};

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly requestId?: string;
  readonly details?: unknown;
  readonly status?: number;

  constructor(error: ApiErrorShape) {
    super(error.message);
    this.name = "ApiError";
    this.code = error.code;
    this.requestId = error.requestId;
    this.details = error.details;
    this.status = error.status;
  }

  static async fromResponse(response: Response): Promise<ApiError> {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = undefined;
    }

    const body = payload as { detail?: unknown; message?: string; request_id?: string; code?: ApiErrorCode };
    const detail = typeof body?.detail === "string" ? body.detail : body?.message;

    return new ApiError({
      code: statusToCode(response.status, body?.code),
      message: detail ?? `Request failed with status ${response.status}.`,
      requestId: body?.request_id,
      details: body?.detail,
      status: response.status
    });
  }

  static fromUnknown(error: unknown): ApiError {
    if (error instanceof ApiError) return error;
    if (error instanceof DOMException && error.name === "AbortError") {
      return new ApiError({ code: "TIMEOUT", message: "The request timed out." });
    }
    if (error instanceof TypeError) {
      return new ApiError({ code: "NETWORK_ERROR", message: "Unable to reach the API. Check that the backend is running." });
    }
    if (error instanceof Error) {
      return new ApiError({ code: "UNKNOWN", message: error.message });
    }
    return new ApiError({ code: "UNKNOWN", message: "Something went wrong." });
  }
}

function statusToCode(status: number, code?: ApiErrorCode): ApiErrorCode {
  if (code) return code;
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 422) return "VALIDATION_ERROR";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "SERVICE_UNAVAILABLE";
  return "UNKNOWN";
}
