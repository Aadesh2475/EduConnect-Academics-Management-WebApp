import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { 
  ShieldCheck, 
  Award, 
  Calendar, 
  User, 
  BookOpen, 
  ExternalLink,
  CheckCircle2,
  GraduationCap
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function VerifyCertificatePage({ params }: { params: { id: string } }) {
  const { id } = params

  try {
    // @ts-ignore
    const certificate = await prisma.certificate.findUnique({
      where: { id },
      include: {
        student: { include: { user: { select: { name: true } } } },
        class: { select: { name: true, code: true, subject: true } },
        teacher: { include: { user: { select: { name: true } } } }
      }
    })

    if (!certificate) {
      notFound()
    }

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="max-w-2xl w-full space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 mb-4 border-4 border-white dark:border-gray-800 shadow-xl">
               <ShieldCheck className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">Official Verification</h1>
            <p className="text-gray-500 dark:text-gray-400">Authenticity of Academic Credential Confirmed</p>
          </div>

          <Card className="border-2 border-emerald-500/20 dark:border-emerald-500/10 shadow-2xl relative overflow-hidden dark:bg-black">
            <div className="absolute top-0 right-0 p-4 opacity-5">
               <GraduationCap className="w-32 h-32" />
            </div>
            
            <CardHeader className="text-center border-b dark:border-gray-800 pb-8 pt-10">
              <div className="inline-flex items-center gap-2 text-emerald-600 font-bold uppercase tracking-widest text-sm mb-4">
                <CheckCircle2 className="w-4 h-4" />
                Verified Certificate
              </div>
              <CardTitle className="text-2xl dark:text-white">{certificate.student.user.name}</CardTitle>
              <CardDescription className="font-mono text-indigo-500 uppercase font-bold mt-1">
                Ref ID: {certificate.certificateNo}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8 py-10 px-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Course Achievement</p>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold dark:text-white">{certificate.class.name}</p>
                      <p className="text-xs text-gray-500">{certificate.class.code}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Level of Merit</p>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        {certificate.templateType}
                      </Badge>
                      {certificate.grade && <p className="text-xs text-gray-500 mt-1">{certificate.grade}</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Date of Issue</p>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold dark:text-white">{new Date(certificate.issueDate).toLocaleDateString([], { dateStyle: 'long' })}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Issuing Instructor</p>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg text-gray-600">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold dark:text-white">{certificate.teacher.user.name}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t dark:border-gray-800 mt-6 text-center">
                <p className="text-xs text-gray-400 italic mb-4">
                  This document is an official digital record issued by the EduConnect Academics platform. 
                  Tampering with this digital record is strictly prohibited.
                </p>
                <div className="flex justify-center gap-4">
                  <a href="/" className="text-xs text-indigo-500 hover:underline flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" /> Visit Platform
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} EduConnect Global Education. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Verification error:", error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 font-bold font-mono">CRITICAL: VERIFICATION SYSTEM UNREACHABLE</p>
      </div>
    )
  }
}
