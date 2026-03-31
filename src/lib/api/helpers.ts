import { NextResponse, NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { sanitizeBody, sanitizeQueryParam, sanitizeQueryInt } from "@/lib/sanitize";

// ==================== RATE LIMITING ====================
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export async function rateLimit(
  identifier: string,
  endpoint: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): Promise<{ success: boolean; remaining: number }> {
  const key = `${identifier}:${endpoint}`;
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: maxRequests - entry.count };
}

// ==================== API RESPONSE HELPERS ====================
export function successResponse<T>(data: T, message?: string, status = 200) {
  return NextResponse.json(
    { success: true, data, message },
    { status }
  );
}

export function errorResponse(error: string, status = 400) {
  return NextResponse.json(
    { success: false, error },
    { status }
  );
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return NextResponse.json({
    success: true,
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

// ==================== CACHING ====================
const cache = new Map<string, { data: unknown; expiry: number }>();

export function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache(key: string, data: unknown, ttlMs: number = 60000) {
  cache.set(key, { data, expiry: Date.now() + ttlMs });
}

export function invalidateCache(pattern: string) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

// ==================== PARSE PAGINATION (with sanitization) ====================
export function parsePagination(searchParams: URLSearchParams) {
  const page = sanitizeQueryInt(searchParams, "page", 1, 1, 10_000);
  const limit = sanitizeQueryInt(searchParams, "limit", 20, 1, 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

// ==================== SANITISED BODY PARSER ====================
/**
 * Parse the JSON request body and recursively sanitise every string value.
 * Strips HTML tags, null bytes, SQL comment sequences, and javascript: URIs.
 *
 * Usage in any API route:
 *   const body = await parseSanitizedBody<{ title: string }>(req)
 */
export async function parseSanitizedBody<T extends Record<string, unknown>>(
  req: NextRequest
): Promise<T> {
  try {
    const raw = await req.json();
    return sanitizeBody<T>(raw);
  } catch {
    return {} as T;
  }
}

/**
 * Safely read a string query parameter (sanitised).
 * Re-exported here so routes only need one import.
 */
export { sanitizeQueryParam };

// ==================== AUDIT LOG ====================
export async function createAuditLog(
  userId: string | null,
  action: string,
  entity: string,
  entityId?: string,
  oldValue?: unknown,
  newValue?: unknown
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : undefined,
        newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : undefined,
      },
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}
