"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  User,
  Phone,
  Building,
  BookOpen,
  Github,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthPage } from "@/components/ui/auth-page"
import { signUp, signInSocial, getDashboardPath } from "@/lib/auth-client"
import { toast } from "@/hooks/use-toast"

// ===== Schemas =====
const studentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

const teacherSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  department: z.string().min(2, "Department is required"),
  subject: z.string().min(2, "Subject is required"),
  university: z.string().min(2, "University name is required"),
  phone: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

const adminSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type StudentFormData = z.infer<typeof studentSchema>
type TeacherFormData = z.infer<typeof teacherSchema>
type AdminFormData = z.infer<typeof adminSchema>

// ===== Shared field styles =====
const inputCls = "pl-10 h-11 bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 transition-colors"
const errorCls = "text-sm text-red-500 font-medium"

// ===== Slide animation variants =====
const slideVariants = (dir: number) => ({
  initial: { x: dir * 40, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -dir * 40, opacity: 0 },
})

// ===== Google icon =====
const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 488 512" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
  </svg>
)

// ===== Password field helper =====
function PasswordField({
  id, label, show, onToggle, registration, error,
}: {
  id: string
  label: string
  show: boolean
  onToggle: () => void
  registration: object
  error?: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-gray-700 dark:text-gray-300 font-medium">{label}</Label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input id={id} type={show ? "text" : "password"} placeholder="••••••••"
          className={`${inputCls} pr-10`} {...registration} />
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          {show ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className={errorCls}>{error}</p>}
    </div>
  )
}

// ===== OAuth separator + buttons =====
function OAuthSection({ onGoogle, onGithub }: { onGoogle: () => void; onGithub: () => void }) {
  return (
    <div className="mt-6 space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase font-medium">
          <span className="bg-background px-3 text-gray-400 dark:text-gray-500">Or continue with</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" type="button" onClick={onGoogle}
          className="w-full h-11 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-50 transition-colors">
          <GoogleIcon /> Google
        </Button>
        <Button variant="outline" type="button" onClick={onGithub}
          className="w-full h-11 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-gray-50 transition-colors">
          <Github className="mr-2 h-4 w-4" /> GitHub
        </Button>
      </div>
    </div>
  )
}

// ===== Main Page =====
const roles = ["student", "teacher", "admin"] as const
type Role = typeof roles[number]

import { HeroGeometric } from "@/components/ui/shape-landing-hero"

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeRole, setActiveRole] = useState<Role>("student")
  const [slideDir, setSlideDir] = useState(1)
  const prevRoleRef = useRef<Role>("student")

  const studentForm = useForm<StudentFormData>({ resolver: zodResolver(studentSchema) })
  const teacherForm = useForm<TeacherFormData>({ resolver: zodResolver(teacherSchema) })
  const adminForm = useForm<AdminFormData>({ resolver: zodResolver(adminSchema) })

  const handleRoleChange = (next: Role) => {
    const from = roles.indexOf(prevRoleRef.current)
    const to = roles.indexOf(next)
    setSlideDir(to > from ? 1 : -1)
    prevRoleRef.current = activeRole
    setActiveRole(next)
  }

  const handleSuccess = (role: string) => {
    toast({ title: "Account Created!", description: "Welcome to EduConnect" })
    router.push(getDashboardPath(role))
    router.refresh()
  }

  const handleError = (error: unknown) => {
    console.error("Registration error:", error)
    toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" })
  }

  const onStudentSubmit = async (data: StudentFormData) => {
    setIsLoading(true)
    try {
      const result = await signUp({ email: data.email, password: data.password, name: data.name, role: "STUDENT", phone: data.phone })
      if (!result.success || result.error) {
        toast({ title: "Registration Failed", description: result.error || "Something went wrong", variant: "destructive" })
      } else handleSuccess("STUDENT")
    } catch (e) { handleError(e) } finally { setIsLoading(false) }
  }

  const onTeacherSubmit = async (data: TeacherFormData) => {
    setIsLoading(true)
    try {
      const result = await signUp({ email: data.email, password: data.password, name: data.name, role: "TEACHER", phone: data.phone, department: data.department, subject: data.subject, university: data.university })
      if (!result.success || result.error) {
        toast({ title: "Registration Failed", description: result.error || "Something went wrong", variant: "destructive" })
      } else handleSuccess("TEACHER")
    } catch (e) { handleError(e) } finally { setIsLoading(false) }
  }

  const onAdminSubmit = async (data: AdminFormData) => {
    setIsLoading(true)
    try {
      const result = await signUp({ email: data.email, password: data.password, name: data.name, role: "ADMIN" })
      if (!result.success || result.error) {
        toast({ title: "Registration Failed", description: result.error || "Something went wrong", variant: "destructive" })
      } else handleSuccess("ADMIN")
    } catch (e) { handleError(e) } finally { setIsLoading(false) }
  }

  const submitBtn = (label: string) => (
    <Button type="submit" disabled={isLoading}
      className="w-full h-11 bg-indigo-600 text-white hover:bg-indigo-700 font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20">
      {isLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...</> : label}
    </Button>
  )

  const slide = slideVariants(slideDir)

  return (
    <HeroGeometric 
      badge="Join EduConnect"
      title1="Create Your"
      title2="Academy Account"
    >
      <div className="flex items-center justify-center py-12">
        <AuthPage
          quote='"EduConnect transformed how we manage academics. Real-time insights keep every student on track."'
          quoteAuthor="Team EduConnect"
          backHref="/"
          backLabel="Home"
        >
          {/* Page heading */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shadow-lg shadow-white/5">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Create Account</h1>
            <p className="text-sm text-white/50 mt-1">Join EduConnect today — choose your role</p>
          </div>

          {/* Role tabs */}
          <Tabs value={activeRole} onValueChange={(v) => handleRoleChange(v as Role)}>
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-white/5 border border-white/10">
              {roles.map((role) => (
                <TabsTrigger
                  key={role}
                  value={role}
                  className="capitalize data-[state=active]:bg-white data-[state=active]:text-black text-white/60 transition-all duration-200"
                >
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ===== STUDENT TAB ===== */}
            <TabsContent value="student" forceMount className={activeRole !== "student" ? "hidden" : ""}>
              <AnimatePresence mode="wait" initial={false}>
                {activeRole === "student" && (
                  <motion.div key="student"
                    initial={slide.initial} animate={slide.animate} exit={slide.exit}
                    transition={{ duration: 0.22, ease: "easeOut" }}>
                    <form onSubmit={studentForm.handleSubmit(onStudentSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="s-name" className="text-white/80 font-medium">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                          <Input id="s-name" placeholder="John Doe" className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-indigo-500/20" {...studentForm.register("name")} />
                        </div>
                        {studentForm.formState.errors.name && <p className={errorCls}>{studentForm.formState.errors.name.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="s-email" className="text-white/80 font-medium">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                          <Input id="s-email" type="email" placeholder="your@email.com" className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-indigo-500/20" {...studentForm.register("email")} />
                        </div>
                        {studentForm.formState.errors.email && <p className={errorCls}>{studentForm.formState.errors.email.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="s-phone" className="text-white/80 font-medium">Phone (Optional)</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                          <Input id="s-phone" placeholder="+1 234 567 8900" className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-indigo-500/20" {...studentForm.register("phone")} />
                        </div>
                      </div>
                      <PasswordField id="s-password" label="Password" show={showPassword} onToggle={() => setShowPassword(!showPassword)}
                        registration={studentForm.register("password")} error={studentForm.formState.errors.password?.message} />
                      <PasswordField id="s-confirm" label="Confirm Password" show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)}
                        registration={studentForm.register("confirmPassword")} error={studentForm.formState.errors.confirmPassword?.message} />
                      {submitBtn("Create Student Account")}
                    </form>
                    <OAuthSection onGoogle={() => signInSocial("google")} onGithub={() => signInSocial("github")} />
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            {/* ===== TEACHER TAB ===== */}
            <TabsContent value="teacher" forceMount className={activeRole !== "teacher" ? "hidden" : ""}>
              <AnimatePresence mode="wait" initial={false}>
                {activeRole === "teacher" && (
                  <motion.div key="teacher"
                    initial={slide.initial} animate={slide.animate} exit={slide.exit}
                    transition={{ duration: 0.22, ease: "easeOut" }}>
                    <form onSubmit={teacherForm.handleSubmit(onTeacherSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="t-name" className="text-white/80 font-medium">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                          <Input id="t-name" placeholder="Dr. Jane Smith" className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-indigo-500/20" {...teacherForm.register("name")} />
                        </div>
                        {teacherForm.formState.errors.name && <p className={errorCls}>{teacherForm.formState.errors.name.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="t-email" className="text-white/80 font-medium">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                          <Input id="t-email" type="email" placeholder="teacher@university.edu" className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-indigo-500/20" {...teacherForm.register("email")} />
                        </div>
                        {teacherForm.formState.errors.email && <p className={errorCls}>{teacherForm.formState.errors.email.message}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="t-dept" className="text-white/80 font-medium">Department</Label>
                          <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                            <Input id="t-dept" placeholder="Computer Science" className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-indigo-500/20" {...teacherForm.register("department")} />
                          </div>
                          {teacherForm.formState.errors.department && <p className={errorCls}>{teacherForm.formState.errors.department.message}</p>}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="t-subject" className="text-white/80 font-medium">Subject</Label>
                          <div className="relative">
                            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                            <Input id="t-subject" placeholder="Data Structures" className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-indigo-500/20" {...teacherForm.register("subject")} />
                          </div>
                          {teacherForm.formState.errors.subject && <p className={errorCls}>{teacherForm.formState.errors.subject.message}</p>}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="t-uni" className="text-white/80 font-medium">University</Label>
                        <div className="relative">
                          <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                          <Input id="t-uni" placeholder="MIT" className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-indigo-500/20" {...teacherForm.register("university")} />
                        </div>
                        {teacherForm.formState.errors.university && <p className={errorCls}>{teacherForm.formState.errors.university.message}</p>}
                      </div>
                      <PasswordField id="t-password" label="Password" show={showPassword} onToggle={() => setShowPassword(!showPassword)}
                        registration={teacherForm.register("password")} error={teacherForm.formState.errors.password?.message} />
                      <PasswordField id="t-confirm" label="Confirm Password" show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)}
                        registration={teacherForm.register("confirmPassword")} error={teacherForm.formState.errors.confirmPassword?.message} />
                      {submitBtn("Create Teacher Account")}
                    </form>
                    <OAuthSection onGoogle={() => signInSocial("google")} onGithub={() => signInSocial("github")} />
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            {/* ===== ADMIN TAB ===== */}
            <TabsContent value="admin" forceMount className={activeRole !== "admin" ? "hidden" : ""}>
              <AnimatePresence mode="wait" initial={false}>
                {activeRole === "admin" && (
                  <motion.div key="admin"
                    initial={slide.initial} animate={slide.animate} exit={slide.exit}
                    transition={{ duration: 0.22, ease: "easeOut" }}>
                    <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="a-name" className="text-white/80 font-medium">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                          <Input id="a-name" placeholder="Admin Name" className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-indigo-500/20" {...adminForm.register("name")} />
                        </div>
                        {adminForm.formState.errors.name && <p className={errorCls}>{adminForm.formState.errors.name.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="a-email" className="text-white/80 font-medium">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                          <Input id="a-email" type="email" placeholder="admin@educonnect.com" className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-indigo-500/20" {...adminForm.register("email")} />
                        </div>
                        {adminForm.formState.errors.email && <p className={errorCls}>{adminForm.formState.errors.email.message}</p>}
                      </div>
                      <PasswordField id="a-password" label="Password" show={showPassword} onToggle={() => setShowPassword(!showPassword)}
                        registration={adminForm.register("password")} error={adminForm.formState.errors.password?.message} />
                      <PasswordField id="a-confirm" label="Confirm Password" show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)}
                        registration={adminForm.register("confirmPassword")} error={adminForm.formState.errors.confirmPassword?.message} />
                      {submitBtn("Create Admin Account")}
                    </form>
                    <OAuthSection onGoogle={() => signInSocial("google")} onGithub={() => signInSocial("github")} />
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>
          </Tabs>

          {/* Sign In + Legal */}
          <p className="mt-8 text-center text-sm text-white/50">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-white hover:text-indigo-300 font-semibold transition-colors">
              Sign in
            </Link>
          </p>
          <p className="mt-3 text-center text-xs text-white/30">
            By creating an account, you agree to our{" "}
            <Link href="/terms" className="underline hover:text-white/50 transition-colors">Terms</Link>
            {" "}and{" "}
            <Link href="/privacy" className="underline hover:text-white/50 transition-colors">Privacy Policy</Link>
          </p>
        </AuthPage>
      </div>
    </HeroGeometric>
  )
}
