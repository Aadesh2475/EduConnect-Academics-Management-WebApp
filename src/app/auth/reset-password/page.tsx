"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { GraduationCap, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"

const resetSchema = z
    .object({
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    })

type ResetFormData = z.infer<typeof resetSchema>

function ResetPasswordForm() {
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [tokenError, setTokenError] = useState(false)

    useEffect(() => {
        if (!token) setTokenError(true)
    }, [token])

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetFormData>({ resolver: zodResolver(resetSchema) })

    const onSubmit = async (data: ResetFormData) => {
        if (!token) return
        setIsLoading(true)
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password: data.password }),
            })
            const result = await res.json()
            if (result.success) {
                setSuccess(true)
                toast({ title: "Password reset!", description: "You can now log in with your new password.", variant: "success" })
            } else {
                toast({ title: "Error", description: result.error || "Failed to reset password.", variant: "destructive" })
                if (res.status === 400) setTokenError(true)
            }
        } catch {
            toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" })
        } finally {
            setIsLoading(false)
        }
    }

    // ── Success state ────────────────────────────────────────────────────────
    if (success) {
        return (
            <Card className="shadow-xl">
                <CardContent className="pt-10 pb-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h2>
                    <p className="text-gray-600 mb-6 text-sm">
                        Your password has been changed successfully. A confirmation email has been sent to your inbox.
                    </p>
                    <Link href="/auth/login">
                        <Button className="w-full">Sign In with New Password</Button>
                    </Link>
                </CardContent>
            </Card>
        )
    }

    // ── Invalid / expired token ──────────────────────────────────────────────
    if (tokenError) {
        return (
            <Card className="shadow-xl">
                <CardContent className="pt-10 pb-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
                    <p className="text-gray-600 mb-6 text-sm">
                        This password reset link is invalid or has expired. Please request a new one.
                    </p>
                    <Link href="/auth/forgot-password">
                        <Button className="w-full">Request New Link</Button>
                    </Link>
                </CardContent>
            </Card>
        )
    }

    // ── Reset form ───────────────────────────────────────────────────────────
    return (
        <Card className="shadow-xl">
            <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                        <GraduationCap className="w-8 h-8 text-white" />
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold">Set New Password</CardTitle>
                <CardDescription>Choose a strong password for your account</CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* New password */}
                    <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="At least 6 characters"
                                className="pl-10 pr-10 h-11"
                                {...register("password")}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
                    </div>

                    {/* Confirm password */}
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                id="confirmPassword"
                                type={showConfirm ? "text" : "password"}
                                placeholder="Repeat your password"
                                className="pl-10 pr-10 h-11"
                                {...register("confirmPassword")}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <Button type="submit" className="w-full h-11" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Resetting...
                            </>
                        ) : (
                            "Reset Password"
                        )}
                    </Button>
                </form>

                <p className="text-center text-sm text-gray-600 mt-6">
                    Remember your password?{" "}
                    <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                        Sign in
                    </Link>
                </p>
            </CardContent>
        </Card>
    )
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <div className="w-full max-w-md">
                <Suspense fallback={
                    <Card className="shadow-xl">
                        <CardContent className="pt-10 pb-10 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" />
                        </CardContent>
                    </Card>
                }>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    )
}
