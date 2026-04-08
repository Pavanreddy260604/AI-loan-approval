export const GATEWAY_ORIGIN = (import.meta as any).env.VITE_GATEWAY_ORIGIN || "http://localhost:4000";
export const SOCKET_ORIGIN = (import.meta as any).env.VITE_SOCKET_ORIGIN || GATEWAY_ORIGIN;
export const API_BASE = (import.meta as any).env.VITE_API_BASE_URL || `${GATEWAY_ORIGIN}/api/v1`;

export interface AuthSession {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: "USER" | "ADMIN";
    tenantId: string;
  };
}

export interface AnalyticsMetrics {
  totalPortfolios: number;
  totalLoans: number;
  avgConfidence: number;
  precisionIndex: number;
  activeModels: number;
  driftDetection: number;
  meanResponseTime: string;
}

export interface DashboardResponse {
  analytics: {
    metrics: AnalyticsMetrics;
    history: any[];
  };
  recentDecisions: any[];
  systemStatus: "HEALTHY" | "DEGRADED" | "UNHEALTHY";
}

export function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem("ai-loan-session");
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session && !session.token && session.accessToken) {
      session.token = session.accessToken;
    }
    return session;
  } catch {
    return null;
  }
}

export function persistSession(session: AuthSession): void {
  try {
    localStorage.setItem("ai-loan-session", JSON.stringify(session));
  } catch (err) {
    console.error("Storage access denied:", err);
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem("ai-loan-session");
  } catch (err) {
    console.error("Storage access denied:", err);
  }
}

export function toGatewayUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  try {
    return new URL(path, GATEWAY_ORIGIN).toString();
  } catch {
    return path;
  }
}

function extractErrorMessage(payload: any): string {
  if (!payload) return "Request failed";
  if (typeof payload === "string") return payload;
  if (typeof payload.error === "string") return payload.error;
  if (typeof payload.detail === "string") return payload.detail;

  const fieldErrors = payload.error?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === "object") {
    const firstMessage = Object.values(fieldErrors).flat().find(Boolean);
    if (typeof firstMessage === "string") {
      return firstMessage;
    }
  }

  return "Request failed";
}

interface FetchOptions {
  token?: string;
  body?: any;
  headers?: Record<string, string>;
  method?: string;
  rawBody?: any;
  retries?: number;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function apiFetch<T = any>(
  path: string,
  { token, body, headers, method = "GET", rawBody, retries = 2 }: FetchOptions = {}
): Promise<T> {
  const isAuthRoute = path.startsWith("/auth/");
  const session = getSession();
  const effectiveToken = token || session?.token;

  if (!effectiveToken && !isAuthRoute && method !== "GET") {
    throw new Error("Authentication session expired. Please sign in again.");
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${API_BASE}${path}`, {
        method,
        headers: {
          ...(rawBody ? {} : { "Content-Type": "application/json" }),
          ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {}),
          ...(headers || {}),
        },
        body: rawBody ?? (body ? JSON.stringify(body) : undefined),
      });

      const contentType = response.headers.get("content-type") || "";
      let payload: any;
      try {
        payload = contentType.includes("application/json") ? await response.json() : await response.text();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        if (response.status === 401 && !path.includes("/auth")) {
          clearSession();
          window.location.href = "/auth";
          throw new Error("Session expired. Redirecting to login.");
        }

        // Don't retry client errors (4xx) except 408/429
        if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429) {
          throw new Error(extractErrorMessage(payload) || `Server error (${response.status})`);
        }

        // Retry server errors (5xx) and 408/429
        lastError = new Error(extractErrorMessage(payload) || `Server error (${response.status})`);
        if (attempt < retries) {
          await sleep(Math.min(1000 * Math.pow(2, attempt), 4000));
          continue;
        }
        throw lastError;
      }

      return payload;
    } catch (err: any) {
      if (err.message?.includes("Session expired")) throw err;

      if (err.name === "TypeError" && err.message === "Failed to fetch") {
        lastError = new Error("Unable to connect to the server. Please check your connection or wait for services to start.");
        if (attempt < retries) {
          await sleep(Math.min(1000 * Math.pow(2, attempt), 4000));
          continue;
        }
        throw lastError;
      }
      throw err;
    }
  }

  throw lastError || new Error("Request failed");
}
