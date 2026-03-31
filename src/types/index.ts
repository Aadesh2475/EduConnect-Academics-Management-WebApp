// ==================== TYPE DEFINITIONS ====================
export type UserRole = "STUDENT" | "TEACHER" | "ADMIN";
export type EnrollmentStatus = "PENDING" | "APPROVED" | "REJECTED";
export type SubmissionStatus = "PENDING" | "SUBMITTED" | "LATE" | "GRADED";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";
export type ExamType = "QUIZ" | "MIDTERM" | "FINAL" | "PRACTICE";
export type QuestionType = "MCQ" | "TRUE_FALSE" | "SHORT_ANSWER" | "LONG_ANSWER";

export interface SessionUser {
  id: string;
  userId?: string; // Alias for backward compatibility
  email: string;
  name: string;
  image?: string | null;
  role: UserRole;
}

export interface DashboardStats {
  totalClasses: number;
  totalStudents: number;
  totalAssignments: number;
  pendingSubmissions: number;
  upcomingExams: number;
  attendanceRate: number;
  averagePerformance: number;
  unreadMessages: number;
}

export interface ClassData {
  id: string;
  name: string;
  code: string;
  description?: string;
  department: string;
  semester: number;
  subject: string;
  teacherId: string;
  isActive: boolean;
  createdAt: string;
  teacher?: {
    user: {
      name: string;
      image?: string;
    };
    department: string;
    subject: string;
  };
  _count?: {
    enrollments: number;
    assignments: number;
    exams: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
