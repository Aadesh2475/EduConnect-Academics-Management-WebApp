/**
 * ============================================================
 *  EduConnect — Input Sanitization & SQL-Injection Prevention
 * ============================================================
 *
 * WHY this exists
 * ───────────────
 * Even though Prisma ORM parameterises every query (so classic
 * SQL-injection is already blocked at the DB driver level), a
 * defence-in-depth approach means we ALSO sanitise every string
 * that reaches the server so that:
 *   • Stored XSS payloads cannot be saved to the DB
 *   • Excessively long payloads cannot cause DoS
 *   • Control characters and null-bytes cannot corrupt data
 *   • `prisma.$queryRaw` calls (if ever added) receive safe input
 *   • Log-injection attacks are neutralised
 *   • NoSQL / prototype-pollution payloads are stripped
 *   • Path traversal sequences are neutralised
 *
 * Usage — three patterns:
 *   1. One-off:   sanitizeString(req.body.name)
 *   2. Zod pipe:  z.string().transform(zSanitizeStr())
 *   3. Bulk body: sanitizeBody({ name, email, ... })
 *   4. Guard:     assertNoSQLInjection(value)  ← throws on obvious attack
 */

// ─── 0. CONSTANTS ────────────────────────────────────────────

/**
 * Classic SQL-injection keywords that should never appear
 * as bare tokens in a user-supplied string.
 * We look for word-boundary matches so "selection" is fine
 * but "; DROP TABLE" or "1 OR 1=1" trigger the guard.
 */
const SQL_INJECTION_PATTERNS = [
  /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|EXEC|EXECUTE|UNION|CAST|CONVERT|DECLARE|FETCH|CURSOR|HAVING|BENCHMARK|SLEEP|WAITFOR|XP_CMDSHELL)\b/i,
  /(\bOR\b|\bAND\b)\s+[\w'"]+\s*=\s*[\w'"]+/i, // OR 1=1 / AND 'a'='a'
  /;\s*(DROP|DELETE|INSERT|UPDATE|EXEC|ALTER|CREATE|TRUNCATE)/i,              // ; DROP TABLE …
  /--\s*$|--\s+\w/m,                              // trailing -- comment
  /\/\*[\s\S]*?\*\//,                             // /* block comment */
  /xp_\w+/i,                                      // xp_cmdshell etc.
  /'.*?OR.*?'.*?=.*?'/i,                          // ' OR 'x'='x
];

/**
 * NoSQL / MongoDB injection patterns.
 * e.g. { "$where": "..." } or { "$gt": "" }
 */
const NOSQL_PATTERNS = [
  /\$where/i,
  /\$gt|\$lt|\$gte|\$lte|\$ne|\$in|\$nin|\$exists|\$regex/i,
  /\$(\w+)\s*:/,
  /\.__proto__/,
  /\.constructor/,
  /\.prototype/,
];

// ─── 1. PRIMITIVE SANITISERS ────────────────────────────────

/**
 * Sanitise a single string value.
 * - Trims leading/trailing whitespace
 * - Removes null bytes (\x00) that can truncate SQL strings in some drivers
 * - Strips HTML tags (<script>, <img onerror=…>, etc.)
 * - Strips common SQL-injection meta-characters when they appear in
 *   obvious attack patterns (standalone; NOT when part of normal text)
 * - Collapses multiple spaces/newlines to single space
 * - Enforces a maximum length (default 1 000 chars; 10 000 for descriptions)
 * - Strips path traversal sequences
 */
export function sanitizeString(
  value: unknown,
  maxLength = 1_000
): string {
  if (value === null || value === undefined) return "";
  if (typeof value !== "string") return String(value).slice(0, maxLength);

  let s = value;

  // 1. Remove null bytes — can confuse some DB drivers
  s = s.replace(/\x00/g, "");

  // 2. Strip HTML tags (prevents stored-XSS)
  s = s.replace(/<[^>]*>/g, "");

  // 3. Remove HTML entities that commonly appear in XSS payloads
  s = s.replace(/&(lt|gt|amp|quot|apos|#\d+|#x[\da-f]+);/gi, "");

  // 4. Strip javascript: / vbscript: / data: URI schemes
  s = s.replace(/(?:javascript|vbscript|data):/gi, "");

  // 5. Neutralise SQL comment sequences (-- and /* */)
  //    We keep the content but remove the comment markers so they
  //    cannot accidentally break a raw query if one is ever added.
  s = s.replace(/--+/g, "").replace(/\/\*/g, "").replace(/\*\//g, "");

  // 6. Remove semicolons that appear at the start of a "word"
  //    (e.g. "; DROP TABLE") while preserving normal use ("3; 4")
  s = s.replace(/;\s*(?=[a-zA-Z])/g, " ");

  // 7. Strip path traversal sequences (../../etc/passwd)
  s = s.replace(/\.\.[\\/]/g, "");

  // 8. Strip NoSQL operator tokens
  s = s.replace(/\$where|\$gt|\$lt|\$gte|\$lte|\$ne|\$in|\$nin|\$exists|\$regex/gi, "");
  s = s.replace(/\.__proto__|\.constructor|\.prototype/g, "");

  // 9. Trim and collapse excessive whitespace
  s = s.trim().replace(/\s{3,}/g, "  ");

  // 10. Enforce max length LAST (after stripping so we don't cut too early)
  return s.slice(0, maxLength);
}

/** Sanitise an email: lowercase + standard string sanitisation */
export function sanitizeEmail(value: unknown): string {
  return sanitizeString(value, 254).toLowerCase().trim();
}

/** Clamp an integer between min and max */
export function sanitizeInt(
  value: unknown,
  min = 0,
  max = Number.MAX_SAFE_INTEGER
): number {
  const n = parseInt(String(value), 10);
  if (!isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/** Clamp a float between min and max */
export function sanitizeFloat(
  value: unknown,
  min = 0,
  max = Number.MAX_SAFE_INTEGER
): number {
  const n = parseFloat(String(value));
  if (!isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/** Sanitise a URL string — only allow http(s) schemes */
export function sanitizeUrl(value: unknown): string {
  const raw = sanitizeString(value, 2_048);
  try {
    const url = new URL(raw);
    if (url.protocol === "http:" || url.protocol === "https:") return raw;
  } catch {
    // not a valid URL
  }
  return "";
}

// ─── 2. INJECTION GUARDS ─────────────────────────────────────

/**
 * Throws a SanitizationError if the value contains an obvious
 * SQL-injection attack pattern.
 *
 * Use this in addition to sanitizeString() on sensitive fields
 * like search terms or IDs that might reach a $queryRaw call.
 *
 * @throws {SanitizationError}
 */
export function assertNoSQLInjection(value: string): void {
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(value)) {
      throw new SanitizationError(
        `SQL injection pattern detected: ${pattern.toString().slice(0, 40)}…`
      );
    }
  }
}

/**
 * Throws a SanitizationError if the value contains a NoSQL injection
 * operator (e.g. MongoDB $where / $gt etc.)
 *
 * @throws {SanitizationError}
 */
export function assertNoNoSQLInjection(value: string): void {
  for (const pattern of NOSQL_PATTERNS) {
    if (pattern.test(value)) {
      throw new SanitizationError(
        `NoSQL injection pattern detected: ${pattern.toString().slice(0, 40)}…`
      );
    }
  }
}

/**
 * Combined guard — runs both SQL and NoSQL checks.
 * Call on every user-supplied string before using it in a query.
 */
export function assertSafe(value: string): void {
  assertNoSQLInjection(value);
  assertNoNoSQLInjection(value);
}

/** Typed error thrown when a sanitization guard fails */
export class SanitizationError extends Error {
  readonly statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = "SanitizationError";
  }
}

// ─── 3. BULK BODY SANITISER ─────────────────────────────────

type PlainObject = Record<string, unknown>;

/**
 * Recursively sanitise every string value in an arbitrary object.
 * Numbers, booleans, and null are passed through unchanged.
 * Arrays are mapped element-by-element.
 *
 * @example
 *   const safe = sanitizeBody(await req.json())
 *   const { title, description } = safe
 */
export function sanitizeBody<T extends PlainObject>(body: unknown): T {
  if (Array.isArray(body)) {
    return body.map((item) => sanitizeBody(item)) as unknown as T;
  }

  if (body !== null && typeof body === "object") {
    const result: PlainObject = {};
    for (const [key, val] of Object.entries(body as PlainObject)) {
      result[key] = sanitizeBody(val);
    }
    return result as T;
  }

  if (typeof body === "string") {
    return sanitizeString(body) as unknown as T;
  }

  // numbers, booleans, null, undefined — pass through unchanged
  return body as T;
}

// ─── 4. ZOD TRANSFORM HELPERS ───────────────────────────────
// Use these inside your Zod schemas with .transform()
//
//   z.string().transform(zSanitizeStr())
//   z.string().email().transform(zSanitizeEmail())

/** Zod transform: sanitise a string field */
export const zSanitizeStr =
  (maxLength = 1_000) =>
  (val: string) =>
    sanitizeString(val, maxLength);

/** Zod transform: sanitise and lowercase an email field */
export const zSanitizeEmail = () => (val: string) => sanitizeEmail(val);

// ─── 5. QUERY-PARAM SANITISER ───────────────────────────────

/**
 * Safely read a string query param — strips HTML/SQL meta-chars
 * and enforces a 200-char max so it cannot be used as a vector.
 */
export function sanitizeQueryParam(
  searchParams: URLSearchParams,
  key: string,
  defaultValue = ""
): string {
  const raw = searchParams.get(key) ?? defaultValue;
  return sanitizeString(raw, 200);
}

/**
 * Safely read a numeric query param.
 */
export function sanitizeQueryInt(
  searchParams: URLSearchParams,
  key: string,
  defaultValue: number,
  min: number,
  max: number
): number {
  const raw = searchParams.get(key) ?? String(defaultValue);
  return sanitizeInt(raw, min, max);
}

// ─── 6. PAYLOAD SIZE GUARD ───────────────────────────────────

/**
 * Checks that a raw request body string does not exceed a byte limit.
 * Call BEFORE JSON.parse() to prevent oversized payload DoS.
 *
 * @param raw  The raw body string
 * @param maxBytes  Byte cap (default 64 KB)
 * @throws {SanitizationError} if over limit
 */
export function assertPayloadSize(raw: string, maxBytes = 65_536): void {
  const bytes = new TextEncoder().encode(raw).length;
  if (bytes > maxBytes) {
    throw new SanitizationError(
      `Payload too large: ${bytes} bytes (max ${maxBytes})`
    );
  }
}

// ─── 7. LOG SANITISER ───────────────────────────────────────

/**
 * Sanitise a value before writing it to a log.
 * Prevents log-injection attacks where an attacker crafts a string
 * containing newlines to forge log entries.
 */
export function sanitizeForLog(value: unknown): string {
  return String(value)
    .replace(/[\r\n\t]/g, " ") // flatten newlines / tabs
    .replace(/\x00/g, "")      // remove null bytes
    .slice(0, 500);             // cap log-line length
}
