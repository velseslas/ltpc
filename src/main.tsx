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

const fallbackLockQueue = new Map<string, Promise<void>>();

function isLockOptions(value: unknown): value is LockRequestOptions {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
  installAuthLockFallback();
  const { default: App } = await import("./App.tsx");
  createRoot(document.getElementById("root")!).render(<App />);
}

void bootstrap();
