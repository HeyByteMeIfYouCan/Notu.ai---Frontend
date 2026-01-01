/**
 * API Request Cache & Deduplication
 * Prevents duplicate concurrent requests to the same endpoint
 */

interface CacheEntry<T> {
  promise: Promise<T>;
  timestamp: number;
}

// In-flight request cache - prevents duplicate concurrent requests
const inFlightRequests = new Map<string, CacheEntry<any>>();

// Short-term response cache for GET requests
const responseCache = new Map<string, { data: any; timestamp: number }>();

// Cache TTL in milliseconds
const CACHE_TTL = 5000; // 5 seconds for response cache
const IN_FLIGHT_TTL = 30000; // 30 seconds max for in-flight requests

/**
 * Generate a cache key from request parameters
 */
export function getCacheKey(method: string, url: string, params?: Record<string, any>): string {
  const paramString = params ? JSON.stringify(params) : '';
  return `${method}:${url}:${paramString}`;
}

/**
 * Deduplicate concurrent requests to the same endpoint
 * If a request is already in-flight, return the existing promise
 */
export function deduplicateRequest<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  
  // Check if request is already in-flight
  const existing = inFlightRequests.get(key);
  if (existing && (now - existing.timestamp) < IN_FLIGHT_TTL) {
    return existing.promise;
  }
  
  // Create new request
  const promise = requestFn().finally(() => {
    // Clean up after request completes
    setTimeout(() => {
      inFlightRequests.delete(key);
    }, 100);
  });
  
  inFlightRequests.set(key, { promise, timestamp: now });
  return promise;
}

/**
 * Get cached response if available and not expired
 */
export function getCachedResponse<T>(key: string): T | null {
  const cached = responseCache.get(key);
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data as T;
  }
  return null;
}

/**
 * Cache a response
 */
export function setCachedResponse<T>(key: string, data: T): void {
  responseCache.set(key, { data, timestamp: Date.now() });
}

/**
 * Invalidate cache entries matching a pattern
 */
export function invalidateCache(pattern?: string): void {
  if (!pattern) {
    responseCache.clear();
    return;
  }
  
  for (const key of responseCache.keys()) {
    if (key.includes(pattern)) {
      responseCache.delete(key);
    }
  }
}

/**
 * Clean up expired entries periodically
 */
function cleanupCache(): void {
  const now = Date.now();
  
  for (const [key, entry] of responseCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      responseCache.delete(key);
    }
  }
  
  for (const [key, entry] of inFlightRequests.entries()) {
    if (now - entry.timestamp > IN_FLIGHT_TTL) {
      inFlightRequests.delete(key);
    }
  }
}

// Run cleanup every 30 seconds
if (typeof window !== 'undefined') {
  setInterval(cleanupCache, 30000);
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/**
 * Throttle function to limit API call frequency
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = limit - (now - lastCall);
    
    if (remaining <= 0) {
      lastCall = now;
      fn(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn(...args);
      }, remaining);
    }
  };
}
