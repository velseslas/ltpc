import { createRoot } from "react-dom/client";
import "./index.css";

function installAuthLockFallback() {
  if (typeof navigator === "undefined") return;

  const locks = (navigator as Navigator & {
    locks?: { request?: (...args: unknown[]) => Promise<unknown> };
  }).locks;

  if (!locks || typeof locks.request !== "function") return;

  const originalRequest = locks.request.bind(locks);

  const patchedRequest = async (...args: unknown[]) => {
    try {
      return await originalRequest(...args);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("request() is not allowed in this context")) {
        throw error;
      }

      const callback =
        typeof args[1] === "function"
          ? (args[1] as (lock: unknown) => unknown | Promise<unknown>)
          : typeof args[2] === "function"
            ? (args[2] as (lock: unknown) => unknown | Promise<unknown>)
            : null;

      return callback ? await callback(null) : undefined;
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
