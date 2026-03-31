"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Loader2,
  Github,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { AuthForm } from "@/components/ui/sign-in-1"
import { Particles } from "@/components/ui/particles"
import { signIn, signInSocial, getDashboardPath } from "@/lib/auth-client"
import { toast } from "@/hooks/use-toast"

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormData = z.infer<typeof loginSchema>

// Google SVG icon
const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 488 512" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
  </svg>
)

import { HeroGeometric } from "@/components/ui/shape-landing-hero"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const result = await signIn(data.email, data.password)
      if (!result.success || result.error) {
        toast({
          title: "Login Failed",
          description: result.error || "Invalid credentials",
          variant: "destructive",
        })
      } else if (result.user) {
        toast({ title: "Welcome back!", description: "Login successful" })
        
        // Redirect to onboarding if not completed
        if (result.user.onboarded === false) {
          window.location.href = "/onboarding"
        } else {
          const dashboardPath = getDashboardPath(result.user.role || "STUDENT")
          window.location.href = dashboardPath
        }
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <HeroGeometric 
      badge="EduConnect Login"
      title1="Welcome Back"
      title2="to the Future"
    >
      <div className="relative min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
        {/* Back to Home */}
        <Link
          href="/"
          className="inline-flex items-center text-white/50 hover:text-white mb-6 transition-colors font-medium text-sm z-20"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <AuthForm
          className="w-full max-w-md z-20"
          title="Welcome Back"
          description="Sign in to continue to EduConnect"
          logoNode={
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shadow-lg shadow-white/5">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
          }
          /* Email/password form content */
          formContent={
            <form id="login-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80 font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 transition-colors"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-400 font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-white/80 font-medium">
                    Password
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 transition-colors"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-400 font-medium">{errors.password.message}</p>
                )}
              </div>

              {/* Submit inside form */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-indigo-600 text-white hover:bg-indigo-700 font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          }
          /* Primary action: Google OAuth */
          primaryAction={{
            label: "Continue with Google",
            icon: <GoogleIcon />,
            onClick: () => signInSocial("google"),
          }}
          /* Secondary action: GitHub OAuth */
          secondaryActions={[
            {
              label: "Continue with GitHub",
              icon: <Github className="mr-2 h-4 w-4" />,
              onClick: () => signInSocial("github"),
            },
          ]}
          footerContent={
            <>
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/register"
                className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
              >
                Sign up
              </Link>
              <br />
              <span className="text-xs text-white/40 mt-2 block">
                By signing in, you agree to our{" "}
                <Link href="/terms" className="underline hover:text-white/60 transition-colors">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline hover:text-white/60 transition-colors">
                  Privacy Policy
                </Link>
              </span>
            </>
          }
        />
      </div>
    </HeroGeometric>
  )
}
