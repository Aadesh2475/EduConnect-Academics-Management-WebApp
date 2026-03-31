"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Award, 
  Download, 
  Printer, 
  Search, 
  Calendar, 
  BookOpen, 
  ExternalLink,
  Loader2,
  ShieldCheck,
  Medal,
  Trophy,
  Share2,
  CheckCircle,
  X,
  Eye
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { cn, formatDate } from "@/lib/utils"

interface Certificate {
  id: string
  certificateNo: string
  issueDate: string
  grade: string | null
  templateType: "COMPLETION" | "HONOR" | "EXCELLENCE"
  class: {
    name: string
    code: string
    subject: string
  }
  teacher: {
    user: {
      name: string
    }
  }
}

export default function StudentCertificatesPage() {
  const [loading, setLoading] = useState(true)
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null)
  const { toast } = useToast()
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const res = await fetch("/api/student/certificates")
        const result = await res.json()
        if (result.success) {
          setCertificates(result.data)
        }
      } catch (error) {
        console.error("Failed to fetch certificates:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchCertificates()
  }, [])

  const filteredCerts = certificates.filter(cert => 
    cert.class.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cert.certificateNo.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handlePrint = () => {
    if (!printRef.current) return;
    const content = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Certificate - ${selectedCert?.certificateNo}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Great+Vibes&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
            <style>
              @media print {
                body { -webkit-print-color-adjust: exact; }
                .no-print { display: none; }
              }
              .cert-font-title { font-family: 'Cinzel', serif; }
              .cert-font-fancy { font-family: 'Great Vibes', cursive; }
              .cert-font-base { font-family: 'Inter', sans-serif; }
            </style>
          </head>
          <body class="bg-white">
            ${content}
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() { window.close(); };
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">Academic Certificates</h1>
          <p className="text-gray-500 dark:text-gray-400">View and celebrate your educational achievements</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search certificates..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#1F1F1F] border-[#1C1C1C]"
          />
        </div>
      </div>

      {filteredCerts.length === 0 ? (
        <Card className="bg-[#1F1F1F] border-[#1C1C1C] p-12 text-center">
          <Award className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-700 opacity-50" />
          <h3 className="text-lg font-medium dark:text-white">No Certificates Found</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-2">
            Work hard on your classes and assignments to earn your first academic certificate!
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCerts.map((cert) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -5 }}
            >
              <Card className="overflow-hidden bg-[#1F1F1F] border-[#1C1C1C] group cursor-pointer" onClick={() => setSelectedCert(cert)}>
                <div className={cn(
                  "h-2",
                  cert.templateType === "EXCELLENCE" ? "bg-amber-500" : 
                  cert.templateType === "HONOR" ? "bg-blue-500" : "bg-emerald-500"
                )} />
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center",
                      cert.templateType === "EXCELLENCE" ? "bg-amber-100 text-amber-600 dark:bg-amber-900/20" : 
                      cert.templateType === "HONOR" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20" : 
                      "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20"
                    )}>
                      {cert.templateType === "EXCELLENCE" ? <Trophy className="w-6 h-6" /> : 
                       cert.templateType === "HONOR" ? <Medal className="w-6 h-6" /> : 
                       <CheckCircle className="w-6 h-6" />}
                    </div>
                    <Badge variant="outline" className="text-[10px] font-mono border-[#1C1C1C] dark:text-gray-400">
                      {cert.certificateNo}
                    </Badge>
                  </div>
                  
                  <h3 className="text-lg font-bold dark:text-white mb-1 line-clamp-1">{cert.class.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{cert.templateType} Certificate</p>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>Issued on {new Date(cert.issueDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <BookOpen className="w-3 h-3" />
                      <span>{cert.class.subject}</span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full h-8 text-xs border-[#1C1C1C] bg-[#1F1F1F]">
                    <Eye className="w-3 h-3 mr-2" /> View Certificate
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Certificate Viewer Modal */}
      <Dialog open={!!selectedCert} onOpenChange={(open) => !open && setSelectedCert(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#090909] border-[#1C1C1C] p-0 overflow-hidden">
          <div className="p-4 border-b border-[#1C1C1C] flex justify-between items-center bg-white bg-[#090909] sticky top-0 z-10">
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                Certificate Viewer
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" /> Print
              </Button>
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-2" /> Download
              </Button>
              <DialogClose asChild>
                 <Button size="icon" variant="ghost" className="h-8 w-8">
                    <X className="w-4 h-4" />
                 </Button>
              </DialogClose>
            </div>
          </div>

          <div className="p-8 bg-gray-100 bg-[#1F1F1F] overflow-x-auto">
            {/* The Actual Certificate Template */}
            <div 
              ref={printRef}
              className={cn(
                "mx-auto w-[800px] aspect-[1.414/1] relative bg-white border-[16px] shadow-2xl p-12 text-center cert-font-base select-none",
                selectedCert?.templateType === "EXCELLENCE" ? "border-amber-500" : 
                selectedCert?.templateType === "HONOR" ? "border-blue-700" : "border-emerald-600"
              )}
              style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.02) 1px, transparent 0)', backgroundSize: '24px 24px' }}
            >
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-24 h-24 border-t-8 border-l-8 border-inherit opacity-30" />
              <div className="absolute top-0 right-0 w-24 h-24 border-t-8 border-r-8 border-inherit opacity-30" />
              <div className="absolute bottom-0 left-0 w-24 h-24 border-b-8 border-l-8 border-inherit opacity-30" />
              <div className="absolute bottom-0 right-0 w-24 h-24 border-b-8 border-r-8 border-inherit opacity-30" />

              <div className="mb-8">
                <div className="mx-auto w-20 h-20 mb-4 bg-gray-50 rounded-full flex items-center justify-center border-4 border-inherit">
                   <Award className="w-10 h-10 text-inherit" />
                </div>
                <h1 className="text-4xl font-bold tracking-widest text-gray-800 cert-font-title uppercase">
                  Certificate of {selectedCert?.templateType === "EXCELLENCE" ? "Excellence" : selectedCert?.templateType === "HONOR" ? "Honor" : "Completion"}
                </h1>
                <div className="h-1 w-48 bg-gray-200 mx-auto mt-2" />
              </div>

              <div className="space-y-6 mt-12">
                <p className="text-lg text-gray-600 italic">This is to certify that</p>
                <p className="text-5xl font-bold text-gray-900 cert-font-fancy py-4 border-b-2 border-gray-100 inline-block px-12">
                   Student User
                </p>
                <p className="text-lg text-gray-600 max-w-lg mx-auto leading-relaxed">
                  has successfully completed the course requirements for
                  <span className="block font-bold text-gray-800 text-xl mt-2">{selectedCert?.class.name}</span>
                </p>
                {selectedCert?.grade && (
                   <p className="text-md font-semibold text-amber-600">Earned with Distinction: {selectedCert.grade}</p>
                )}
              </div>

              <div className="mt-20 flex justify-between items-end px-12">
                <div className="text-center">
                  <div className="w-48 border-b border-gray-400 mb-2" />
                  <p className="text-sm font-bold text-gray-800">{selectedCert?.teacher.user.name}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-tighter">Instructor</p>
                </div>
                
                <div className="flex flex-col items-center">
                   <div className="w-24 h-24 border-4 border-inherit rounded-full flex items-center justify-center rotate-12 opacity-80 mb-2">
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase">EDU</p>
                        <ShieldCheck className="w-8 h-8 text-inherit mx-auto" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase">OFFICIAL</p>
                      </div>
                   </div>
                   <p className="text-[10px] text-gray-400 font-mono">{selectedCert?.certificateNo}</p>
                </div>

                <div className="text-center">
                  <div className="w-48 border-b border-gray-400 mb-2" />
                  <p className="text-sm font-bold text-gray-800">{selectedCert && new Date(selectedCert.issueDate).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-tighter">Issue Date</p>
                </div>
              </div>

              <div className="absolute bottom-8 left-0 right-0">
                <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  Verified authenticity at educonnect.com/verify/${selectedCert?.id}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 bg-[#090909] border-t border-[#1C1C1C]">
             <div className="flex items-center justify-center gap-8">
                <div className="text-center">
                   <p className="text-[10px] text-gray-400 uppercase font-bold">SHARE achievement</p>
                   <div className="flex gap-2 mt-2">
                       <Button size="icon" variant="outline" className="h-8 w-8 rounded-full"><Share2 className="w-3 h-3" /></Button>
                       <Button size="icon" variant="outline" className="h-8 w-8 rounded-full"><ExternalLink className="w-3 h-3" /></Button>
                   </div>
                </div>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
