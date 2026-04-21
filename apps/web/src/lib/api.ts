const viteEnv = (import.meta as any).env;
const browserOrigin = typeof window !== "undefined" ? window.location.origin : "http://127.0.0.1:5175";

export const GATEWAY_ORIGIN = viteEnv.VITE_GATEWAY_ORIGIN || browserOrigin;
export const SOCKET_ORIGIN = viteEnv.VITE_SOCKET_ORIGIN || GATEWAY_ORIGIN;
export const API_BASE = viteEnv.VITE_API_BASE_URL || new URL("/api/v1", GATEWAY_ORIGIN).toString();

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

export interface DashboardMetrics {
  totalDatasets: number;
  totalModels: number;
  totalPredictions: number;
  creditsUsed: number;
  fraudAlerts: number;
  lastTrainingStatus: string | null;
}

export interface DashboardModel {
  id: string;
  datasetId: string;
  championFamily: string | null;
  championMetrics: {
    rocAuc: number;
    f1Score: number;
    precision: number;
    recall: number;
    accuracy: number;
  };
  pinnedVersionId: string | null;
  lastTrainingStatus: string;
  lastTrainingError: string | null;
  updatedAt: string | null;
}

export interface PendingPrediction {
  id: string;
  datasetId: string | null;
  modelVersionId: string | null;
  decision: boolean | null;
  probability: number;
  features: Record<string, any>;
  fraudScore: number | null;
  fraudSignals: any;
  explanation: any;
  reviewStatus: string;
  createdAt: string | null;
}

export interface RecentDecision {
  id: string;
  decision: boolean | null;
  probability: number;
  reviewStatus: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  features: Record<string, any>;
  createdAt: string | null;
}

export interface DashboardResponse {
  analytics: {
    metrics: DashboardMetrics;
    activities: Array<{ topic: string; payload: any; createdAt: string }>;
  };
  balance: { tenantId: string; balance: number; reserved: number; available: number; used: number };
  datasets: Array<{ id: string; fileName: string; status: string; rowCount: number }>;
  models: DashboardModel[];
  pendingPredictions: PendingPrediction[];
  recentDecisions: RecentDecision[];
}

// Safe storage wrapper that handles restricted contexts (iframes, private mode, extensions)
const safeStorage = {
  isAvailable: (() => {
    try {
      const testKey = "__storage_test__";
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  })(),

  get(key: string): string | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set(key: string, value: string): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      localStorage.setItem(key, value);
      return true;
    } catch {
      console.warn("Storage access denied - session will not persist across page reloads");
      return false;
    }
  },

  remove(key: string): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
};

// In-memory fallback for restricted contexts
let memorySession: AuthSession | null = null;

export function getSession(): AuthSession | null {
  try {
    // Try localStorage first
    const raw = safeStorage.get("ai-loan-session");
    if (raw) {
      const session = JSON.parse(raw);
      if (session && !session.token && session.accessToken) {
        session.token = session.accessToken;
      }
      return session;
    }
    // Fall back to memory if storage unavailable
    return memorySession;
  } catch {
    return memorySession;
  }
}

export function persistSession(session: AuthSession): void {
  // Always store in memory as fallback
  memorySession = session;
  // Try to persist to storage
  const success = safeStorage.set("ai-loan-session", JSON.stringify(session));
  if (!success) {
    console.warn("Session stored in memory only - will not persist across page reloads");
  }
}

export function clearSession(): void {
  memorySession = null;
  safeStorage.remove("ai-loan-session");
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
