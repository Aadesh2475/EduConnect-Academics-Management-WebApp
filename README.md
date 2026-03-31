# EduConnect - LinkedIn-like Educational Platform

## Project Overview
- **Name**: EduConnect
- **Goal**: A comprehensive educational platform connecting students, teachers, and administrators with real-time features, AI-powered guidance, and complete academic management
- **Tech Stack**: Next.js 16, React 19, shadcn/ui, PostgreSQL (Neon), Prisma ORM, Better Auth

## Live URLs
- **Development**: https://3000-idqj25o2bl532dovxabin-2e1b9533.sandbox.novita.ai

## Features

### Authentication
- Multi-role authentication (Student, Teacher, Admin)
- Google & GitHub OAuth integration
- Email/password authentication
- Password reset functionality
- Role-based access control

### Landing Page
- Modern hero section with animations
- Features showcase
- How it works section
- FAQ accordion
- Responsive footer

### Student Dashboard
- **Home**: Overview with stats, upcoming deadlines, recent activity
- **Classes**: Join classes with codes, view enrolled classes
- **Assignments**: View, submit, and track assignments
- **Quiz/Exams**: Take quizzes with auto-grading (MCQ)
- **Attendance**: Calendar view with attendance records
- **Messages**: Real-time chat with teachers and classmates
- **AI Assistant**: Personalized learning guidance
- **Profile**: Manage personal information

### Teacher Dashboard
- **Home**: Class overview, pending requests, analytics
- **Classes**: Create classes with unique join codes, manage enrollments
- **Assignments**: Create, grade, and provide feedback
- **Exams**: Build quizzes with question bank
- **Attendance**: Mark and track attendance
- **Messages**: Communicate with students
- **Analytics**: View class performance metrics

### Admin Dashboard
- **Overview**: Platform-wide statistics and health
- **Users**: Full user management (view, edit, suspend, delete)
- **Classes**: Manage all classes and enrollments
- **Analytics**: Comprehensive charts and reports
- **Settings**: Platform configuration

## Data Models

### Users & Authentication
- User (with role: STUDENT, TEACHER, ADMIN)
- Student (enrollment, department, semester)
- Teacher (employee ID, department, subject)
- Sessions, Accounts, PasswordResetTokens

### Academic
- Class (with unique join codes)
- ClassEnrollment (PENDING, APPROVED, REJECTED)
- Assignment, Submission, Rubric
- Exam, Question, ExamAttempt, QuestionAnswer

### Engagement
- Attendance, AttendanceSession
- Event, Task, Notification
- ChatRoom, Message
- AIChat for learning assistance

### Analytics
- Performance tracking
- AuditLog for admin actions

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Get current session
- `POST /api/auth/forgot-password` - Request password reset

### Classes
- `GET /api/classes` - List classes
- `POST /api/classes` - Create class (teacher)
- `POST /api/classes/join` - Join class with code (student)
- `GET /api/classes/[id]` - Get class details
- `POST /api/classes/[id]/enroll` - Manage enrollment requests

### Assignments
- `GET /api/assignments` - List assignments
- `POST /api/assignments` - Create assignment (teacher)
- `POST /api/assignments/[id]/submit` - Submit assignment (student)

### Exams
- `GET /api/exams` - List exams
- `POST /api/exams` - Create exam with questions (teacher)
- `POST /api/exams/[id]/attempt` - Start/submit exam (student)

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark attendance (teacher)

### Admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/users/[id]` - Get user details
- `PUT /api/admin/users/[id]` - Update user
- `DELETE /api/admin/users/[id]` - Delete user
- `GET /api/admin/classes` - List all classes
- `GET /api/admin/stats` - Platform statistics

### AI & Chat
- `POST /api/ai/chat` - AI learning assistant
- `GET /api/notifications` - User notifications
- `GET /api/tasks` - User tasks

## Environment Variables Required

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
BETTER_AUTH_SECRET="your-secret"
BETTER_AUTH_URL="http://localhost:3000"

# OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."

# Optional
NEXT_PUBLIC_APP_URL="http://localhost:3000"
OPENAI_API_KEY="..." # For AI features
```

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Push database schema: `npx prisma db push`
5. Generate Prisma client: `npx prisma generate`
6. Run development server: `npm run dev`

## Project Structure

```
src/
├── app/
│   ├── api/           # API routes
│   ├── auth/          # Auth pages
│   ├── dashboard/     # Dashboard pages
│   │   ├── admin/     # Admin dashboard
│   │   ├── student/   # Student dashboard
│   │   └── teacher/   # Teacher dashboard
│   └── page.tsx       # Landing page
├── components/
│   ├── ui/            # shadcn/ui components
│   ├── dashboard/     # Dashboard components
│   └── shared/        # Shared components
├── lib/
│   ├── auth.ts        # Auth configuration
│   ├── prisma.ts      # Database client
│   └── utils.ts       # Utilities
└── types/             # TypeScript types
```

## Status
- ✅ Project Setup (Next.js 16, React 19)
- ✅ Database Schema (Prisma + PostgreSQL)
- ✅ Authentication System
- ✅ Landing Page
- ✅ Student Dashboard (all pages with real-time data)
- ✅ Teacher Dashboard (all pages with real-time data)
- ✅ Admin Dashboard (full database access)
- ✅ Classroom Management
- ✅ Assignment System with submissions and grading
- ✅ Quiz/Exam System with auto-grading
- ✅ Attendance & Calendar
- ✅ AI Chatbot Component
- ✅ Real-time Chat UI with messaging APIs
- ✅ Complete API Routes (no hardcoded data - all real-time database queries)

### Real-time API Routes Added
- `/api/student/dashboard` - Student dashboard data with stats
- `/api/student/classes` - Enrolled classes with progress
- `/api/student/assignments` - Assignments with status tracking
- `/api/student/exams` - Exams with attempt history
- `/api/student/attendance` - Attendance records
- `/api/student/messages` - Chat rooms and messages
- `/api/teacher/dashboard` - Teacher dashboard with comprehensive stats
- `/api/teacher/classes` - Class management with enrollment counts
- `/api/teacher/assignments` - Assignment creation and management
- `/api/teacher/exams` - Exam creation and results
- `/api/teacher/submissions/[id]/grade` - Grade student submissions

## Next Steps
1. Configure Neon PostgreSQL database credentials
2. Configure OAuth providers (Google, GitHub)
3. Set up OpenAI API for AI features
4. Deploy to Vercel
5. Push code to GitHub repository

## License
MIT
