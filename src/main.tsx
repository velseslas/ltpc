import { createRoot } from "react-dom/client";
import "./index.css";

type LockRequestOptions = {
  mode?: "exclusive" | "shared";
  ifAvailable?: boolean;
  steal?: boolean;
  signal?: AbortSignal;
};

type LockRequestCallback = (
  lock: Lock | { name: string; mode: "exclusive" | "shared" } | null,
) => unknown | Promise<unknown>;

type SessionLike = {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
  [key: string]: unknown;
};

const fallbackLockQueue = new Map<string, Promise<void>>();

function isLockOptions(value: unknown): value is LockRequestOptions {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodeJwtPayload(token?: string) {
  if (!token) return null;

  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const normalized = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    return JSON.parse(atob(normalized)) as { exp?: number; iat?: number };
  } catch {
    return null;
  }
}

function normalizeSessionExpiry<T extends SessionLike | null>(session: T): T {
  if (!session) return session;

  const payload = decodeJwtPayload(session.access_token);
  const expiresIn =
    typeof session.expires_in === "number" && session.expires_in > 0
      ? session.expires_in
      : payload?.exp && payload?.iat
        ? payload.exp - payload.iat
        : null;

  if (!expiresIn || expiresIn <= 0) return session;

  return {
    ...session,
    expires_in: expiresIn,
    expires_at: Math.round(Date.now() / 1000) + expiresIn,
  } as T;
}

function installAuthFetchPatch() {
  if (typeof window === "undefined") return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await originalFetch(input, init);
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (!url.includes("/auth/v1/token") || !response.ok) {
      return response;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      return response;
    }

    try {
      const body = await response.clone().json();
      const normalized = normalizeSessionExpiry(body);

      if (normalized === body) {
        return response;
      }

      return new Response(JSON.stringify(normalized), {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers),
      });
    } catch {
      return response;
    }
  };
}

function normalizeStoredAuthSession() {
  if (typeof window === "undefined") return;

  try {
    const projectRef = new URL(import.meta.env.VITE_SUPABASE_URL).hostname.split(".")[0];
    const storageKey = `sb-${projectRef}-auth-token`;
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) return;

    const parsed = JSON.parse(raw) as SessionLike | { currentSession?: SessionLike | null };

    if (parsed && typeof parsed === "object" && "currentSession" in parsed) {
      const nextValue = {
        ...parsed,
        currentSession: normalizeSessionExpiry(
          (parsed as { currentSession?: SessionLike | null }).currentSession ?? null,
        ),
      };
      window.localStorage.setItem(storageKey, JSON.stringify(nextValue));
      return;
    }

    const normalized = normalizeSessionExpiry(parsed as SessionLike | null);
    window.localStorage.setItem(storageKey, JSON.stringify(normalized));
  } catch {
    // Ignore malformed storage values.
  }
}

async function runWithFallbackLock(
  name: string,
  options: LockRequestOptions | undefined,
  callback: LockRequestCallback,
) {
  if (options?.signal?.aborted) {
    throw new DOMException("The operation was aborted.", "AbortError");
  }

  const pendingLock = fallbackLockQueue.get(name);
  if (options?.ifAvailable && pendingLock) {
    return await callback(null);
  }

  const previous = pendingLock ?? Promise.resolve();
  let release: (() => void) | undefined;

  const current = new Promise<void>((resolve) => {
    release = resolve;
  });

  const chain = previous.catch(() => undefined).then(() => current);
  fallbackLockQueue.set(name, chain);

  await previous.catch(() => undefined);

  try {
    return await callback({
      name,
      mode: options?.mode ?? "exclusive",
    });
  } finally {
    release?.();
    void chain.finally(() => {
      if (fallbackLockQueue.get(name) === chain) {
        fallbackLockQueue.delete(name);
      }
    });
  }
}

function installAuthLockFallback() {
  if (typeof navigator === "undefined") return;

  const locks = (navigator as Navigator & {
    locks?: { request?: (...args: unknown[]) => Promise<unknown> };
  }).locks;

  if (!locks || typeof locks.request !== "function") return;

  const originalRequest = locks.request.bind(locks);

  const patchedRequest = async (...args: unknown[]) => {
    const name = typeof args[0] === "string" ? args[0] : null;
    const hasOptions = isLockOptions(args[1]);
    const options: LockRequestOptions | undefined = hasOptions
      ? (args[1] as LockRequestOptions)
      : undefined;
    const callbackCandidate = hasOptions ? args[2] : args[1];
    const callback =
      typeof callbackCandidate === "function"
        ? (callbackCandidate as LockRequestCallback)
        : null;

    if (!name || !callback) {
      return await originalRequest(...args);
    }

    const wrappedCallback: LockRequestCallback = async (lock) => {
      if (lock !== null || options?.ifAvailable) {
        return await callback(lock);
      }

      return await runWithFallbackLock(name, options, callback);
    };

    try {
      return hasOptions
        ? await originalRequest(name, options, wrappedCallback)
        : await originalRequest(name, wrappedCallback);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("request() is not allowed in this context")) {
        throw error;
      }

      return await runWithFallbackLock(name, options, callback);
    }
  };

  try {
    Object.defineProperty(locks, "request", {
      configurable: true,
      writable: true,
      value: patchedRequest,
    });
    return;
  } catch {
    // Fall through and try patching the prototype instead.
  }

  try {
    const prototype = Object.getPrototypeOf(locks) as {
      request?: (...args: unknown[]) => Promise<unknown>;
    };

    if (prototype && typeof prototype.request === "function") {
      Object.defineProperty(prototype, "request", {
        configurable: true,
        writable: true,
        value: patchedRequest,
      });
    }
  } catch {
    // Ignore if the browser prevents overriding LockManager.
  }
}

async function bootstrap() {
  installAuthFetchPatch();
  normalizeStoredAuthSession();
  installAuthLockFallback();
  const { default: App } = await import("./App.tsx");
  createRoot(document.getElementById("root")!).render(<App />);
}

void bootstrap();
