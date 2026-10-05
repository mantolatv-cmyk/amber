import net from 'net';

let isDbAvailableCache: boolean | null = null;
let lastCheckTime = 0;
const CACHE_TTL_MS = 30000; // Cache check result for 30s
let ongoingCheckPromise: Promise<boolean> | null = null;

/**
 * Fast TCP probe to verify if database host/port is actually reachable.
 * Prevents Prisma from blocking page requests for 4-6 seconds on socket timeouts
 * when local postgres isn't running or when network latency is high.
 * Deduplicates in-flight probes and caches results for 30 seconds.
 */
export async function isDatabaseReachable(): Promise<boolean> {
  const now = Date.now();
  if (isDbAvailableCache !== null && now - lastCheckTime < CACHE_TTL_MS) {
    return isDbAvailableCache;
  }

  if (ongoingCheckPromise) {
    return ongoingCheckPromise;
  }

  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl) {
    isDbAvailableCache = false;
    lastCheckTime = now;
    return false;
  }

  ongoingCheckPromise = new Promise<boolean>((resolve) => {
    try {
      const url = new URL(dbUrl);
      const host = url.hostname || 'localhost';
      const port = parseInt(url.port || '5432', 10);

      const socket = new net.Socket();
      socket.setTimeout(120); // 120ms ultra-fast timeout

      const finalize = (result: boolean) => {
        socket.destroy();
        isDbAvailableCache = result;
        lastCheckTime = Date.now();
        ongoingCheckPromise = null;
        resolve(result);
      };

      socket.on('connect', () => finalize(true));
      socket.on('timeout', () => finalize(false));
      socket.on('error', () => finalize(false));

      socket.connect(port, host);
    } catch {
      isDbAvailableCache = false;
      lastCheckTime = Date.now();
      ongoingCheckPromise = null;
      resolve(false);
    }
  });

  return ongoingCheckPromise;
}
