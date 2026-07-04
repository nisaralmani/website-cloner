import type Redis from "ioredis";
import { createComponentLogger } from "@/lib/logging/logger";

const log = createComponentLogger("infra:redis-client");

export type RedisRuntimeStatus = "connected" | "reconnecting" | "disconnected" | "disabled";

type PatternHandler = (channel: string, message: string) => void;

type RedisState = {
  initPromise?: Promise<void>;
  publisher?: Redis;
  subscriber?: Redis;
  status: RedisRuntimeStatus;
  handlers: Map<string, Set<PatternHandler>>;
  psubscribed: Set<string>;
  shutdownHooksRegistered: boolean;
};

const globalStore = globalThis as typeof globalThis & {
  __bybeltRedisState?: RedisState;
};

const DEFAULT_TIMEOUT_MS = 2_000;
const BASE_RECONNECT_DELAY_MS = 200;
const MAX_RECONNECT_DELAY_MS = 5_000;

function getRedisUrl(): string | null {
  const value = process.env.REDIS_URL?.trim();
  return value ? value : null;
}

function initialState(): RedisState {
  return {
    status: getRedisUrl() ? "disconnected" : "disabled",
    handlers: new Map(),
    psubscribed: new Set(),
    shutdownHooksRegistered: false,
  };
}

function getState(): RedisState {
  if (!globalStore.__bybeltRedisState) {
    globalStore.__bybeltRedisState = initialState();
  }
  return globalStore.__bybeltRedisState;
}

function getRetryDelayMs(times: number): number {
  const exponential = BASE_RECONNECT_DELAY_MS * 2 ** Math.max(0, times - 1);
  return Math.min(MAX_RECONNECT_DELAY_MS, exponential);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Redis operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    void promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function bindClientStatus(client: Redis, state: RedisState, role: "publisher" | "subscriber") {
  // ioredis clients emit "error" for routine transient failures (connection
  // refused, DNS, auth, network blips). Verified via node_modules/ioredis's
  // Redis.prototype.silentEmit: ioredis does NOT rely on raw EventEmitter
  // semantics for "error" — with zero listeners it logs via console.error
  // and returns rather than throwing, so this handler is not a crash-
  // prevention requirement. It exists to route that message through the
  // app's structured logger instead of raw console.error.
  client.on("error", (error: unknown) => {
    log.warn("redis_client_error", {
      role,
      error: error instanceof Error ? error.message : String(error),
    });
  });
  client.on("connect", () => {
    state.status = "connected";
  });
  client.on("ready", () => {
    state.status = "connected";
  });
  client.on("reconnecting", () => {
    state.status = "reconnecting";
  });
  client.on("close", () => {
    if (getRedisUrl()) {
      state.status = "disconnected";
    } else {
      state.status = "disabled";
    }
  });
  client.on("end", () => {
    if (getRedisUrl()) {
      state.status = "disconnected";
    } else {
      state.status = "disabled";
    }
  });
}

function registerShutdownHooks(state: RedisState) {
  if (state.shutdownHooksRegistered) return;
  state.shutdownHooksRegistered = true;

  const shutdown = () => {
    state.publisher?.disconnect();
    state.subscriber?.disconnect();
    state.status = getRedisUrl() ? "disconnected" : "disabled";
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
  process.once("beforeExit", shutdown);
}

async function initRedisClients(): Promise<void> {
  const state = getState();
  const url = getRedisUrl();
  if (!url) {
    state.status = "disabled";
    return;
  }

  if (state.publisher && state.subscriber) {
    return;
  }

  const { default: Redis } = await import("ioredis");
  const options = {
    lazyConnect: true,
    enableOfflineQueue: false,
    connectTimeout: DEFAULT_TIMEOUT_MS,
    maxRetriesPerRequest: 1,
    retryStrategy: (times: number) => getRetryDelayMs(times),
  };

  const publisher = new Redis(url, options);
  const subscriber = new Redis(url, options);
  bindClientStatus(publisher, state, "publisher");
  bindClientStatus(subscriber, state, "subscriber");

  subscriber.on("pmessage", (pattern: string, channel: string, message: string) => {
    const patternHandlers = state.handlers.get(pattern);
    if (!patternHandlers) return;
    for (const handler of patternHandlers) {
      handler(channel, message);
    }
  });

  await withTimeout(Promise.all([publisher.connect(), subscriber.connect()]));

  state.publisher = publisher;
  state.subscriber = subscriber;
  state.status = "connected";
  registerShutdownHooks(state);

  for (const pattern of state.handlers.keys()) {
    if (state.psubscribed.has(pattern)) continue;
    await withTimeout(subscriber.psubscribe(pattern));
    state.psubscribed.add(pattern);
  }
}

async function ensureReady(): Promise<RedisState> {
  const state = getState();
  const url = getRedisUrl();
  if (!url) {
    state.status = "disabled";
    return state;
  }
  if (state.publisher && state.subscriber) {
    return state;
  }
  if (!state.initPromise) {
    state.initPromise = initRedisClients().finally(() => {
      state.initPromise = undefined;
    });
  }
  await state.initPromise;
  return state;
}

export function isRedisEnabled(): boolean {
  return Boolean(getRedisUrl());
}

export function getRedisStatus(): RedisRuntimeStatus {
  return getState().status;
}

export async function publishRedisMessage(channel: string, message: string): Promise<void> {
  const state = await ensureReady();
  if (!state.publisher || state.status === "disabled") return;
  await withTimeout(state.publisher.publish(channel, message).then(() => undefined));
}

export function subscribeRedisPattern(pattern: string, handler: PatternHandler): () => void {
  const state = getState();
  if (!state.handlers.has(pattern)) {
    state.handlers.set(pattern, new Set());
  }
  state.handlers.get(pattern)!.add(handler);

  if (isRedisEnabled()) {
    // A connect/psubscribe failure here (Redis unreachable, timeout) must
    // degrade the caller to single-instance delivery, not crash the process —
    // without this .catch(), a rejection here is an unhandled promise
    // rejection, fatal by default in Node 15+.
    ensureReady()
      .then(async (readyState) => {
        if (!readyState.subscriber || readyState.psubscribed.has(pattern)) return;
        await withTimeout(readyState.subscriber.psubscribe(pattern));
        readyState.psubscribed.add(pattern);
      })
      .catch((error) => {
        log.warn("redis_psubscribe_failed", {
          pattern,
          error: error instanceof Error ? error.message : String(error),
        });
      });
  } else {
    state.status = "disabled";
  }

  return () => {
    const handlers = state.handlers.get(pattern);
    if (!handlers) return;
    handlers.delete(handler);
    if (handlers.size === 0) {
      state.handlers.delete(pattern);
    }
  };
}

export async function pingRedis(timeoutMs = DEFAULT_TIMEOUT_MS): Promise<number> {
  const state = await ensureReady();
  if (!state.publisher || state.status === "disabled") {
    throw new Error("Redis is disabled");
  }

  const startedAt = Date.now();
  await withTimeout(state.publisher.ping().then(() => undefined), timeoutMs);
  return Date.now() - startedAt;
}
