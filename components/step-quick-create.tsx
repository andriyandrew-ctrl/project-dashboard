"use client"

import React, { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { 
  X, CalendarBlank, UserCircle, Spinner, 
  Paperclip, ChartBar, CaretDown, Plus 
} from "@phosphor-icons/react/dist/ssr"
import { createProjectInDB } from "@/lib/data/project-actions"
import { toast } from "sonner"

export function StepQuickCreate({ onClose, onCreate }: { onClose: () => void; onCreate: () => void }) {
  const [title, setTitle] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [targetDate, setTargetDate] = useState<Date | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async () => {
    if (!title) return toast.error("Judul proyek harus diisi!")
    setIsSubmitting(true)
    try {
      await createProjectInDB({
        name: title,
        priority: "medium",
        startDate: startDate?.toISOString() || new Date().toISOString(),
        endDate: targetDate?.toISOString() || new Date().toISOString(),
      })
      toast.success("Project Created Successfully!")
      onCreate()
    } catch (err) {
      toast.error("Error saving project")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex justify-between items-center p-8 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Create New Project</h2>
          <p className="text-sm text-muted-foreground">Add details for your R&D project.</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
          <X size={24} weight="bold" className="text-muted-foreground" />
        </button>
      </div>

      {/* Main Form Area */}
      <div className="flex-1 px-8 space-y-8 overflow-y-auto">
        <input
          autoFocus
          className="w-full text-4xl font-bold border-none outline-none placeholder:text-muted/30 bg-transparent"
          placeholder="Project Title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {/* Editor Area (Placeholder) */}
        <div className="min-h-[150px] bg-muted/20 rounded-[24px] p-6 border border-dashed border-border group hover:border-primary/20 transition-all cursor-text">
          <p className="text-muted-foreground/60 text-[15px]">Start typing project description or goals...</p>
        </div>

        {/* Pickers Row */}
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-xl hover:bg-muted text-sm font-semibold transition-all">
            <CalendarBlank size={18} className="text-primary" weight="duotone" />
            Set Timeline
            <CaretDown size={14} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-xl hover:bg-muted text-sm font-semibold transition-all">
            <ChartBar size={18} className="text-amber-500" weight="duotone" />
            Medium Priority
            <CaretDown size={14} />
          </button>
        </div>
      </div>

      {/* Footer Bar (Seperti Gambar 3) */}
      <div className="p-6 px-8 bg-muted/30 border-t border-border flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2">
          <button className="p-2.5 text-muted-foreground hover:text-primary hover:bg-background rounded-xl transition-all">
            <Paperclip size={22} />
          </button>
          <button className="p-2.5 text-muted-foreground hover:text-primary hover:bg-background rounded-xl transition-all">
            <UserCircle size={22} />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[11px] font-bold text-muted-foreground/40 hidden sm:block italic">⌘ + Enter to create</span>
          <button 
            onClick={handleSave}
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-2xl font-bold shadow-lg hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            {isSubmitting ? <Spinner className="animate-spin" /> : <Plus weight="bold" />}
            Create Project
          </button>
        </div>
      </div>
    </div>
  )
}