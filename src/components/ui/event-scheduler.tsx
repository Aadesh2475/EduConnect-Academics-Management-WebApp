"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock, PlusCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { DatetimePicker as DateTimePicker } from "@/components/ui/datetime-picker"

interface TeacherClass {
    id: string
    name: string
    code: string
}

interface EventSchedulerProps {
    classes: TeacherClass[]
    selectedDate?: Date | null
    onEventCreated?: () => void
    onCancel?: () => void
}

export function EventScheduler({ classes, selectedDate: initialDate, onEventCreated, onCancel }: EventSchedulerProps) {
    const { toast } = useToast()
    const [date, setDate] = React.useState<Date | undefined>(initialDate ?? undefined)
    const [hour, setHour] = React.useState("12")
    const [minute, setMinute] = React.useState("00")
    const [ampm, setAmpm] = React.useState("AM")
    const [title, setTitle] = React.useState("")
    const [eventType, setEventType] = React.useState("class")
    const [location, setLocation] = React.useState("")
    const [classId, setClassId] = React.useState("all")
    const [isSaving, setIsSaving] = React.useState(false)

    // Sync with parent selected date
    React.useEffect(() => {
        if (initialDate) setDate(initialDate)
    }, [initialDate])

    // Use date state directly as selectedDateTime since DateTimePicker handles both
    const selectedDateTime = date;

    const handleAddEvent = async () => {
        if (!title || !selectedDateTime) return

        setIsSaving(true)
        const timeStr = selectedDateTime ? format(selectedDateTime, "p") : "" // e.g., "1:15 PM"
        const payload = {
            title,
            type: eventType,
            startDate: selectedDateTime.toISOString(),
            location,
            classId: classId === "all" ? null : classId,
            description: timeStr,
        }

        try {
            const res = await fetch("/api/teacher/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (!res.ok) throw new Error("Failed to save event")

            toast({ title: "Event Added", description: `"${title}" has been scheduled.` })

            // Reset form
            setTitle("")
            setDate(initialDate ?? undefined)
            setHour("12")
            setMinute("00")
            setAmpm("AM")
            setEventType("class")
            setLocation("")
            setClassId("all")

            onEventCreated?.()
        } catch {
            toast({ title: "Error", description: "Could not create event.", variant: "destructive" })
        } finally {
            setIsSaving(false)
        }
    }

    const canSubmit = !!title && !!selectedDateTime

    return (
        <div className="flex flex-col gap-4">
            {/* Title */}
            <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Event Title *</Label>
                <Input
                    placeholder="Enter event title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>

            {/* Event Type */}
            <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Type</Label>
                <Select value={eventType} onValueChange={setEventType}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="class">Class</SelectItem>
                        <SelectItem value="assignment">Assignment</SelectItem>
                        <SelectItem value="exam">Exam</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="office">Office Hours</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Date & Time Picker */}
            <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Date & Time *</Label>
                <DateTimePicker
                    date={date}
                    setDate={setDate}
                    placeholder="Select Date & Time"
                />
            </div>

            {/* Linked Class */}
            <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Linked Class</Label>
                <Select value={classId} onValueChange={setClassId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All My Classes</SelectItem>
                        {classes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Location */}
            <div className="flex flex-col gap-1.5">
                <Label className="text-sm">Location</Label>
                <Input
                    placeholder="Classroom, room number, or online link"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
                {onCancel && (
                    <Button variant="outline" onClick={onCancel} disabled={isSaving} className="flex-1">
                        Cancel
                    </Button>
                )}
                <Button
                    onClick={handleAddEvent}
                    disabled={!canSubmit || isSaving}
                    className="flex-1 flex items-center justify-center gap-2"
                >
                    {isSaving
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                        : <><PlusCircle className="h-4 w-4" /> Add Event</>
                    }
                </Button>
            </div>
        </div>
    )
}
