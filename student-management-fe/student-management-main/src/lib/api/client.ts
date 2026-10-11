export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Sự kiện phát ra khi server trả 401 cho request cần đăng nhập (phiên hết hạn). */
export const UNAUTHORIZED_EVENT = "app:unauthorized";

/** Backend trả lỗi dạng {"message": "..."}; lấy phần message để hiển thị cho người dùng. */
async function readErrorMessage(response: Response): Promise<string> {
  const raw = await response.text();
  if (!raw) return `Yêu cầu thất bại (mã ${response.status}).`;
  try {
    const parsed = JSON.parse(raw) as { message?: unknown };
    if (typeof parsed.message === "string" && parsed.message) return parsed.message;
  } catch {
    // không phải JSON: dùng nguyên văn bên dưới
  }
  return raw.length > 300 ? `Yêu cầu thất bại (mã ${response.status}).` : raw;
}

// Mặc định gọi cùng origin (/api/...) và để src/proxy.ts chuyển tiếp sang Spring Boot (BACKEND_URL).
// Nhờ vậy cookie đăng nhập là first-party, chạy được cả khi frontend/backend ở 2 domain Railway khác nhau.
// Chỉ đặt NEXT_PUBLIC_API_URL nếu thật sự muốn gọi thẳng API khác origin (khi đó cần CORS + cookie phù hợp).
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const body =
    options.body === undefined
      ? undefined
      : typeof options.body === "string"
        ? options.body
        : JSON.stringify(options.body);

  if (body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const endpoint = path.replace(/^\/+/, "");
  const response = await fetch(`${API_BASE_URL}/${endpoint}`, {
    ...options,
    headers,
    body,
    // Backend stores the JWT in an HttpOnly cookie, not in localStorage.
    credentials: options.credentials ?? "include",
  });

  if (!response.ok) {
    if (
      response.status === 401 &&
      !endpoint.startsWith("api/auth/") &&
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (response.status === 205 || response.headers.get("content-length") === "0") {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
