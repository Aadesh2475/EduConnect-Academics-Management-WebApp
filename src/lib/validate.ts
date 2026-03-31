/**
 * ============================================================
 *  EduConnect — Request Validation Middleware
 * ============================================================
 *
 * Combines:
 *   1. Payload size check (prevents oversized-payload DoS)
 *   2. JSON parsing
 *   3. Zod schema validation (with sanitizing transforms built in)
 *   4. Returns typed, validated, sanitized data — or a 400 response
 *
 * Usage in any API route:
 *
 *   import { parseBody } from "@/lib/validate"
 *   import { createAssignmentSchema } from "@/lib/validators"
 *
 *   export async function POST(req: NextRequest) {
 *     const result = await parseBody(req, createAssignmentSchema)
 *     if (!result.ok) return result.error     // ← NextResponse 400/413
 *     const { title, dueDate } = result.data  // ← fully typed + sanitized
 *     ...
 *   }
 *
 * Query params:
 *
 *   import { parseQuery } from "@/lib/validate"
 *   const { search } = parseQuery(req.url, z.object({ search: z.string().optional() }))
 */

import { NextRequest, NextResponse } from "next/server";
import { ZodSchema, ZodError, ZodIssue } from "zod";
import { assertPayloadSize, SanitizationError } from "@/lib/sanitize";

// ─── MAX PAYLOAD SIZES ───────────────────────────────────────
const DEFAULT_MAX_BYTES = 65_536;  // 64 KB — default for most routes
const UPLOAD_MAX_BYTES = 5_242_880; // 5 MB — for file-attachment routes

// ─── RESULT TYPES ────────────────────────────────────────────

type Ok<T> = { ok: true; data: T };
type Err = { ok: false; error: NextResponse };

type ParseResult<T> = Ok<T> | Err;

// ─── BODY PARSER ─────────────────────────────────────────────

/**
 * Parse, validate, and sanitize a JSON request body.
 *
 * @param req        The incoming Next.js request
 * @param schema     A Zod schema (should include .transform(zSanitizeStr()) on string fields)
 * @param maxBytes   Optional byte cap override (default 64 KB)
 */
export async function parseBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>,
  maxBytes = DEFAULT_MAX_BYTES
): Promise<ParseResult<T>> {
  let raw: string;

  try {
    raw = await req.text();
  } catch {
    return err("Failed to read request body", 400);
  }

  // 1. Payload size guard — must run BEFORE parse
  try {
    assertPayloadSize(raw, maxBytes);
  } catch (e) {
    if (e instanceof SanitizationError) {
      return err(e.message, 413);
    }
    return err("Payload size check failed", 413);
  }

  // 2. JSON parse
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return err("Invalid JSON body", 400);
  }

  // 3. Zod validation + sanitize transforms
  try {
    const data = await schema.parseAsync(parsed);
    return { ok: true, data };
  } catch (e) {
    if (e instanceof ZodError) {
      const messages = (e as ZodError).issues.map((issue: ZodIssue) => `${issue.path.join(".")}: ${issue.message}`);
      return err(`Validation failed: ${messages.join("; ")}`, 400);
    }
    if (e instanceof SanitizationError) {
      return err(e.message, 400);
    }
    return err("Validation failed", 400);
  }
}

/**
 * Same as parseBody but for file-upload routes (5 MB cap).
 */
export async function parseUploadBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<ParseResult<T>> {
  return parseBody(req, schema, UPLOAD_MAX_BYTES);
}

// ─── QUERY PARAM PARSER ──────────────────────────────────────

/**
 * Parse and validate URL search params with a Zod schema.
 * Returns { ok: true, data } synchronously since URLSearchParams
 * are already available.
 *
 * @param url     The full request URL string
 * @param schema  A Zod schema for the expected query params
 */
export function parseQuery<T>(
  url: string,
  schema: ZodSchema<T>
): ParseResult<T> {
  const { searchParams } = new URL(url);

  // Convert URLSearchParams to plain object
  const raw: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    raw[key] = value;
  });

  try {
    const data = schema.parse(raw);
    return { ok: true, data };
  } catch (e) {
    if (e instanceof ZodError) {
      const messages = (e as ZodError).issues.map((issue: ZodIssue) => `${issue.path.join(".")}: ${issue.message}`);
      return err(`Invalid query: ${messages.join("; ")}`, 400);
    }
    return err("Query validation failed", 400);
  }
}

// ─── INTERNAL HELPER ─────────────────────────────────────────

function err(message: string, status: number): Err {
  return {
    ok: false,
    error: NextResponse.json({ success: false, error: message }, { status }),
  };
}
