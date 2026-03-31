/**
 * ============================================================
 *  EduConnect — Zod Validation Schemas
 * ============================================================
 *
 * Every string field goes through a .transform(zSanitizeStr())
 * pipe so that sanitization is automatic — you cannot forget it.
 *
 * Schemas are used with parseBody() from @/lib/validate so that
 * validation + sanitization happen in one step in every API route.
 */

import { z } from "zod";
import { zSanitizeStr, zSanitizeEmail } from "@/lib/sanitize";

// ─── HELPERS ─────────────────────────────────────────────────

/** A required string that is trimmed, stripped of XSS/SQL chars */
const safeStr = (min = 1, max = 1_000) =>
  z.string().min(min).max(max).transform(zSanitizeStr(max));

/** An optional string — skips sanitization if undefined */
const safeOptStr = (max = 1_000) =>
  z.string().max(max).transform(zSanitizeStr(max)).optional();

/** A sanitized email */
const safeEmail = () =>
  z.string().email("Invalid email address").transform(zSanitizeEmail());

/** A long text field (descriptions, instructions) */
const safeText = (min = 1, max = 10_000) =>
  z.string().min(min).max(max).transform(zSanitizeStr(max));

/** A password — sanitize but keep full entropy */
const safePassword = (minLen = 6) =>
  z.string().min(minLen, `Password must be at least ${minLen} characters`);

// ─── AUTH SCHEMAS ─────────────────────────────────────────────

export const loginSchema = z.object({
  email: safeEmail(),
  password: safePassword(6),
});

export const studentSignupSchema = z
  .object({
    name: safeStr(2, 100).describe("Full name"),
    email: safeEmail(),
    phone: safeOptStr(20),
    password: safePassword(6),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const teacherSignupSchema = z
  .object({
    name: safeStr(2, 100),
    email: safeEmail(),
    department: safeStr(1, 100),
    subject: safeStr(1, 100),
    university: safeStr(1, 150),
    phone: safeOptStr(20),
    password: safePassword(6),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const adminSignupSchema = z
  .object({
    email: safeEmail(),
    password: safePassword(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// ─── CLASS SCHEMAS ────────────────────────────────────────────

export const createClassSchema = z.object({
  name: safeStr(2, 100),
  department: safeStr(1, 100),
  semester: z.coerce.number().min(1).max(12),
  subject: safeStr(1, 100),
  description: safeOptStr(2_000),
});

export const joinClassSchema = z.object({
  code: z.string().length(7, "Class code must be exactly 7 characters").transform(zSanitizeStr(7)),
});

// ─── ASSIGNMENT SCHEMAS ───────────────────────────────────────

export const createAssignmentSchema = z.object({
  title: safeStr(2, 200),
  description: safeText(10, 5_000),
  instructions: safeOptStr(5_000),
  dueDate: z.string().min(1, "Due date is required").transform(zSanitizeStr(30)),
  totalMarks: z.coerce.number().min(1, "Total marks must be at least 1").max(10_000),
  classId: safeStr(1, 50),
  attachments: z.array(z.string().url()).max(10).optional(),
});

// ─── EXAM SCHEMAS ─────────────────────────────────────────────

export const createExamSchema = z.object({
  title: safeStr(2, 200),
  description: safeOptStr(2_000),
  type: z.enum(["QUIZ", "MIDTERM", "FINAL", "PRACTICE"]),
  classId: safeStr(1, 50),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute").max(1_440),
  totalMarks: z.coerce.number().min(1).max(10_000),
  passingMarks: z.coerce.number().optional(),
  startTime: z.string().min(1, "Start time is required").transform(zSanitizeStr(30)),
  endTime: z.string().min(1, "End time is required").transform(zSanitizeStr(30)),
  shuffleQuestions: z.boolean().optional(),
  showResults: z.boolean().optional(),
});

// ─── EVENT SCHEMAS ────────────────────────────────────────────

export const createEventSchema = z.object({
  title: safeStr(2, 200),
  description: safeOptStr(2_000),
  type: safeStr(1, 50),
  startDate: z.string().min(1, "Start date is required").transform(zSanitizeStr(30)),
  endDate: z.string().transform(zSanitizeStr(30)).optional(),
  allDay: z.boolean().optional(),
  location: safeOptStr(300),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{3,8}$/, "Invalid hex color")
    .optional(),
});

// ─── TASK SCHEMAS ─────────────────────────────────────────────

export const taskSchema = z.object({
  title: safeStr(1, 200),
  description: safeOptStr(2_000),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "COMPLETED"]).optional(),
  dueDate: z.string().transform(zSanitizeStr(30)).optional(),
});

// ─── FEEDBACK SCHEMA ──────────────────────────────────────────

export const feedbackSchema = z.object({
  subject: safeStr(2, 200),
  message: safeText(10, 5_000),
  rating: z.coerce.number().min(1).max(5).optional(),
  type: z.enum(["GENERAL", "BUG", "FEATURE", "COMPLAINT"]).optional(),
});

// ─── PROFILE UPDATE SCHEMA ────────────────────────────────────

export const profileUpdateSchema = z.object({
  name: safeStr(2, 100).optional(),
  phone: safeOptStr(20),
  department: safeOptStr(100),
  semester: z.coerce.number().min(1).max(12).optional(),
  section: safeOptStr(20),
  batch: safeOptStr(20),
  address: safeOptStr(500),
  dateOfBirth: z.string().transform(zSanitizeStr(20)).optional(),
  guardianName: safeOptStr(100),
  guardianPhone: safeOptStr(20),
  subject: safeOptStr(100),
  university: safeOptStr(150),
  qualification: safeOptStr(200),
  experience: z.coerce.number().min(0).max(80).optional(),
});

// ─── STUDENT ISSUE SCHEMA ─────────────────────────────────────

export const studentIssueSchema = z.object({
  category: safeStr(1, 50),
  title: safeStr(2, 200),
  description: safeText(10, 5_000),
  classId: safeOptStr(50),
  teacherId: safeOptStr(50),
  entityId: safeOptStr(50),
  entityType: safeOptStr(50),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});

// ─── EXPORT TYPES ─────────────────────────────────────────────

export type LoginInput = z.infer<typeof loginSchema>;
export type StudentSignupInput = z.infer<typeof studentSignupSchema>;
export type TeacherSignupInput = z.infer<typeof teacherSignupSchema>;
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type JoinClassInput = z.infer<typeof joinClassSchema>;
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type CreateExamInput = z.infer<typeof createExamSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type StudentIssueInput = z.infer<typeof studentIssueSchema>;
