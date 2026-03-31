"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, GraduationCap, User, MapPin, Phone, Mail, Award, BookOpen, Heart, Info, Camera } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { GridBackground } from "@/components/ui/glowing-card";

export default function OnboardingPage() {
  const [session, setSession] = useState<any>(null);
  const [isPending, setIsPending] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<any>({
    // Teacher fields
    collegeName: "",
    qualifications: "",
    experience: "",
    teacherId: "",
    purpose: "",
    
    // Student fields
    dob: "",
    semester: "",
    section: "",
    guardianName: "",
    guardianPhone: "",
    
    // Common fields
    department: "",
    address: "",
    mobileNumber: "",
    alternateEmail: "",
    interests: "",
    referralSource: "",
    image: "",
  });

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data.success) {
          setSession(data.data);
          
          if (data.data?.onboarded) {
            window.location.href = data.data.role === "TEACHER" ? "/dashboard/teacher" : "/dashboard/student";
          }
        }
      } catch (error) {
        console.error("Failed to fetch session:", error);
      } finally {
        setIsPending(false);
      }
    };
    fetchSession();
  }, []);

  if (isPending) {
    return (
      <HeroGeometric badge="EduConnect" title1="Setting Up" title2="Your Profile">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 animate-spin text-white/50" />
        </div>
      </HeroGeometric>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: session?.role,
          profileData: {
            ...formData,
            name: session?.name, // Use name from sign up
          }
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({ title: "Welcome!", description: "Onboarding completed successfully." });
        window.location.href = session?.role === "TEACHER" ? "/dashboard/teacher" : "/dashboard/student";
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save details.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const isTeacher = session?.role === "TEACHER";

  return (
    <HeroGeometric 
      badge="EduConnect Onboarding"
      title1="Complete Your"
      title2="Profile Setup"
    >
      <div className="flex items-center justify-center py-12 px-4 md:px-6">
        <GridBackground
          title={step === 1 ? "Personal Details" : step === 2 ? "Academic Profile" : "General Interests"}
          description={step === 1 ? "Let's start with your basic information and contact details." : step === 2 ? "Tell us about your educational background and role." : "Help us understand your interests and how you found us."}
          className="max-w-3xl w-full"
        >
          <div className="space-y-6 pt-4">
            <div className="text-center mb-8">
              <div className="mx-auto w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-2">
                {isTeacher ? <Award className="w-6 h-6 text-white" /> : <GraduationCap className="w-6 h-6 text-white" />}
              </div>
              <p className="text-white/60">
                Step {step} of 3
              </p>
            </div>

            <div className="space-y-6">
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex flex-col items-center gap-4 mb-6">
                      <Avatar className="w-24 h-24 border-4 border-white/10">
                        <AvatarImage src={formData.image || session?.image || undefined} />
                        <AvatarFallback className="text-2xl">{session?.name ? session.name[0] : "U"}</AvatarFallback>
                      </Avatar>
                     <div className="space-y-2 text-center">
                       <Label htmlFor="image" className="cursor-pointer text-sm font-medium text-white hover:underline flex items-center justify-center gap-2">
                         <Camera className="w-4 h-4" /> Change Profile Photo
                       </Label>
                       <Input 
                        id="image" 
                        type="text" 
                        placeholder="Photo URL" 
                        className="h-8 text-xs max-w-[200px] mx-auto bg-white/5 border-white/10 text-white" 
                        value={formData.image}
                        onChange={handleInputChange}
                       />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mobileNumber" className="text-white">Mobile Number *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
                        <Input id="mobileNumber" placeholder="Your phone number" className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20" value={formData.mobileNumber} onChange={handleInputChange} required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alternateEmail" className="text-white">Alternate Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
                        <Input id="alternateEmail" type="email" placeholder="Another email (optional)" className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20" value={formData.alternateEmail} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-white">Address *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                      <Textarea id="address" placeholder="Residential address" className="pl-10 min-h-[80px] bg-white/5 border-white/10 text-white placeholder:text-white/20" value={formData.address} onChange={handleInputChange} required />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                  {isTeacher ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="collegeName" className="text-white">College / University Name *</Label>
                        <div className="relative">
                          <GraduationCap className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
                          <Input id="collegeName" placeholder="Where do you teach?" className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/20" value={formData.collegeName} onChange={handleInputChange} required />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="department" className="text-white">Department *</Label>
                          <Input id="department" placeholder="e.g. CS" className="bg-white/5 border-white/10 text-white" value={formData.department} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="qualifications" className="text-white">Highest Qualification *</Label>
                          <Input id="qualifications" placeholder="e.g. PhD" className="bg-white/5 border-white/10 text-white" value={formData.qualifications} onChange={handleInputChange} required />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="experience" className="text-white">Years of Experience *</Label>
                          <Input id="experience" type="number" className="bg-white/5 border-white/10 text-white" placeholder="0" value={formData.experience} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="teacherId" className="text-white">Teacher ID (Optional)</Label>
                          <Input id="teacherId" placeholder="Employee ID" className="bg-white/5 border-white/10 text-white" value={formData.teacherId} onChange={handleInputChange} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="dob" className="text-white">Date of Birth *</Label>
                          <Input id="dob" type="date" className="bg-white/5 border-white/10 text-white [color-scheme:dark]" value={formData.dob} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="department" className="text-white">Department *</Label>
                          <Input id="department" placeholder="e.g. IT" className="bg-white/5 border-white/10 text-white" value={formData.department} onChange={handleInputChange} required />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="semester" className="text-white">Current Semester *</Label>
                          <Select value={formData.semester} onValueChange={(v) => handleSelectChange("semester", v)}>
                            <SelectTrigger id="semester" className="bg-white/5 border-white/10 text-white">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                              {[1,2,3,4,5,6,7,8].map(s => <SelectItem key={s} value={String(s)}>Sem {s}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="section" className="text-white">Section / Division *</Label>
                          <Input id="section" placeholder="e.g. A" className="bg-white/5 border-white/10 text-white" value={formData.section} onChange={handleInputChange} required />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="guardianName" className="text-white">Guardian Name *</Label>
                          <Input id="guardianName" placeholder="Parent/Guardian" className="bg-white/5 border-white/10 text-white" value={formData.guardianName} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="guardianPhone" className="text-white">Guardian Phone *</Label>
                          <Input id="guardianPhone" placeholder="Contact number" className="bg-white/5 border-white/10 text-white" value={formData.guardianPhone} onChange={handleInputChange} required />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <Label htmlFor="interests" className="text-white">Areas of Interest / Activities *</Label>
                    <div className="relative">
                      <Heart className="absolute left-3 top-3 h-4 w-4 text-white/40" />
                      <Textarea id="interests" placeholder="e.g. Coding, Robotics" className="pl-10 min-h-[80px] bg-white/5 border-white/10 text-white" value={formData.interests} onChange={handleInputChange} required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purpose" className="text-white">{isTeacher ? "Purpose on platform *" : "What are your goals? *"}</Label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
                      <Input id="purpose" placeholder={isTeacher ? "Teaching" : "Learning"} className="pl-10 bg-white/5 border-white/10 text-white" value={formData.purpose} onChange={handleInputChange} required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referralSource" className="text-white">Where did you hear about us? *</Label>
                    <Select value={formData.referralSource} onValueChange={(v) => handleSelectChange("referralSource", v)}>
                      <SelectTrigger id="referralSource" className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                        <SelectItem value="college">College / University</SelectItem>
                        <SelectItem value="friend">Friend / Colleague</SelectItem>
                        <SelectItem value="social">Social Media</SelectItem>
                        <SelectItem value="ad">Advertisement</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="bg-white/5 p-4 rounded-lg flex items-start gap-3 border border-white/10">
                    <Info className="w-5 h-5 text-white/60 mt-0.5" />
                    <p className="text-xs text-white/40 italic">
                      Note: You can update these details anytime from your profile page after completing the setup.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between py-6">
              <Button variant="ghost" onClick={prevStep} disabled={step === 1 || loading} className="text-white/60 hover:text-white hover:bg-white/5">
                Back
              </Button>
              {step < 3 ? (
                <Button onClick={nextStep} className="bg-indigo-600 text-white hover:bg-indigo-700 font-semibold px-8 shadow-lg shadow-indigo-500/20">
                  Next Step
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading} className="bg-indigo-600 text-white hover:bg-indigo-700 font-bold px-8 shadow-lg shadow-indigo-500/20">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Complete Setup"}
                </Button>
              )}
            </div>
          </div>
        </GridBackground>
      </div>
    </HeroGeometric>
  );
}
