"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, MessageSquareCode, Sparkles, Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function FeedbackPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [suggestion, setSuggestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if feedback was already given in this session or recently
    const lastPrompt = localStorage.getItem("last_feedback_prompt");
    const now = Date.now();
    
    // If prompted less than 24 hours ago, don't prompt again
    if (lastPrompt && now - parseInt(lastPrompt) < 24 * 60 * 60 * 1000) {
      return;
    }

    const timer = setTimeout(() => {
      setIsOpen(true);
      localStorage.setItem("last_feedback_prompt", now.toString());
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({ title: "Please provide a rating", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          message: suggestion,
          subject: "In-App Feedback",
          type: "GENERAL"
        }),
      });

      if (res.ok) {
        toast({ title: "Thank you!", description: "Your feedback helps us improve EduConnect." });
        setIsOpen(false);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to submit feedback.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[450px] overflow-hidden border-none p-0 bg-white dark:bg-zinc-950">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center mb-4">
                    <MessageSquareCode className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Help us shape EduConnect</h2>
                <p className="text-indigo-100 text-sm">We value your experience. How are we doing so far?</p>
            </div>
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl" />
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-3 text-center">
            <Label className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Rate your experience</Label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-all duration-200 hover:scale-110 active:scale-95"
                >
                  <Star
                    className={cn(
                      "w-8 h-8 transition-colors",
                      (hoveredRating || rating) >= star
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-zinc-300 dark:text-zinc-700"
                    )}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground italic h-4">
                {rating === 1 && "Could be better"}
                {rating === 2 && "Fair experience"}
                {rating === 3 && "Good, but room for improvement"}
                {rating === 4 && "Great platform!"}
                {rating === 5 && "Exemplary! Love it."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="suggestion" className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" /> 
                Any suggestions for improvement?
            </Label>
            <Textarea
              id="suggestion"
              placeholder="Features you'd like to see, or bugs you found..."
              className="min-h-[100px] resize-none border-zinc-200 dark:border-zinc-800 focus:ring-indigo-500"
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <Button 
                onClick={handleSubmit} 
                disabled={isSubmitting || rating === 0}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                    <Send className="w-4 h-4" />
                    Submit Feedback
                </>
              )}
            </Button>
            <Button 
                variant="ghost" 
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Maybe later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
