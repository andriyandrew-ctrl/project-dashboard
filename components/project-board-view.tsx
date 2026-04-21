"use client"

import React, { useEffect, useMemo, useState } from "react"
import { format } from "date-fns"
import type { Project } from "@/lib/data/projects"
import { Skeleton } from "@/components/ui/skeleton"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  DotsThree, 
  Plus, 
  CircleDashed, 
  CalendarBlank, 
  PlayCircle, 
  CheckCircle,
  Clock,
  ListChecks
} from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"

const COLUMN_ORDER: Array<Project["status"]> = ["backlog", "planned", "active", "completed"]

const STATUS_UI = {
  "backlog": { 
    label: "Not Started", 
    theme: "slate", 
    hexBg: "bg-slate-400", 
    hexText: "text-slate-600 dark:text-slate-400",
    hexBorder: "border-slate-300",
    hexLight: "bg-slate-100",
    Icon: CircleDashed 
  },
  "planned": { 
    label: "Planned", 
    theme: "blue", 
    hexBg: "bg-blue-500", 
    hexText: "text-blue-600 dark:text-blue-400",
    hexBorder: "border-blue-300",
    hexLight: "bg-blue-50",
    Icon: CalendarBlank 
  },
  "active": { 
    label: "In Progress", 
    theme: "amber", 
    hexBg: "bg-amber-500", 
    hexText: "text-amber-600 dark:text-amber-500",
    hexBorder: "border-amber-300",
    hexLight: "bg-amber-50",
    Icon: PlayCircle 
  },
  "completed": { 
    label: "Completed", 
    theme: "emerald", 
    hexBg: "bg-emerald-500", 
    hexText: "text-emerald-600 dark:text-emerald-500",
    hexBorder: "border-emerald-300",
    hexLight: "bg-emerald-50",
    Icon: CheckCircle 
  },
  "cancelled": { label: "Cancelled", theme: "red", hexBg: "bg-red-500", hexText: "text-red-600", hexBorder: "border-red-300", hexLight: "bg-red-50", Icon: CircleDashed }
}

// FUNGSI PELINDUNG: Mencegah crash jika tanggal kosong atau rusak
const safeFormatDate = (dateVal: Date | string | undefined | null) => {
  if (!dateVal) return "TBD"
  const d = new Date(dateVal)
  return isNaN(d.getTime()) ? "TBD" : format(d, "dd MMM")
}

type ProjectBoardViewProps = {
  projects: Project[]
  loading?: boolean
  onAddProject?: () => void
}

export function ProjectBoardView({ projects, loading = false, onAddProject }: ProjectBoardViewProps) {
  const [items, setItems] = useState<Project[]>(projects)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  useEffect(() => {
    setItems(projects)
  }, [projects])

  const groups = useMemo(() => {
    const m = new Map<Project["status"], Project[]>()
    for (const s of COLUMN_ORDER) m.set(s, [])
    for (const p of items) {
      const column = m.get(p.status)
      if (column) column.push(p)
      else {
        const fallback = m.get("backlog")
        if (fallback) fallback.push(p)
      }
    }
    return m
  }, [items])

  const onDropTo = (status: Project["status"]) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOverColumn(null)
    const id = e.dataTransfer.getData("text/id")
    if (!id) return
    setDraggingId(null)
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)))
  }

  const onDragOver = (status: string) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (dragOverColumn !== status) setDragOverColumn(status)
  }

  const onDragLeave = () => {
    setDragOverColumn(null)
  }

  const draggableCard = (p: Project) => {
    const ui = STATUS_UI[p.status] || STATUS_UI["backlog"]
    const isDragging = draggingId === p.id

    return (
      <div
        key={p.id}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/id", p.id)
          setDraggingId(p.id)
        }}
        onDragEnd={() => {
          setDraggingId(null)
          setDragOverColumn(null)
        }}
        className={cn(
          "relative flex flex-col bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden cursor-grab active:cursor-grabbing transition-all duration-200 group",
          "hover:shadow-md hover:border-border",
          isDragging && "opacity-90 scale-[1.03] rotate-2 shadow-2xl ring-2 ring-primary/40 z-50"
        )}
      >
        <div className={cn("absolute left-0 top-0 bottom-0 w-1.5 transition-colors", ui.hexBg)} />
        <div className="p-3.5 pl-4 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                {p.id.includes("-") ? p.id : `#${p.id}`}
              </span>
              <h4 className="text-[13px] font-semibold text-foreground leading-snug line-clamp-2">
                {p.name}
              </h4>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="h-6 w-6 shrink-0 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity -mr-1 -mt-1">
                  <DotsThree className="h-4 w-4" weight="bold" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-1.5 rounded-xl shadow-lg" align="end">
                <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/50 mb-1">
                  Move Status
                </div>
                {COLUMN_ORDER.map((s) => (
                  <button
                    key={s}
                    className="w-full flex items-center justify-between rounded-md px-2 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
                    onClick={() => setItems((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: s } : x)))}
                  >
                    {STATUS_UI[s].label}
                  </button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[10px] font-semibold">
              <span className="text-muted-foreground">Progress</span>
              <span className={ui.hexText}>{Math.round(p.progress || 0)}%</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all duration-500", ui.hexBg)}
                style={{ width: `${Math.min(100, Math.max(0, p.progress || 0))}%` }}
              />
            </div>
          </div>
          <div className="h-px w-full bg-border/40" />
          <div className="flex items-center justify-between pt-0.5">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-muted-foreground" title="Due Date">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium">{safeFormatDate(p.endDate)}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground" title="Total Tasks">
                <ListChecks className="h-3.5 w-3.5" />
                <span className="text-[10px] font-medium">{p.tasks?.length || 0}</span>
              </div>
            </div>
            <div className="shrink-0 flex -space-x-1">
              {(p.tasks || []).slice(0, 1).map((t, idx) => (
                 <Avatar key={idx} className="h-5 w-5 border-2 border-background shadow-sm">
                   <AvatarFallback className={cn("text-[8px] font-bold text-white", ui.hexBg)}>
                      {t.assignee?.charAt(0).toUpperCase() || "?"}
                   </AvatarFallback>
                 </Avatar>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 h-full">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 h-full">
          {COLUMN_ORDER.map((s) => (
            <div key={s} className="rounded-2xl bg-muted/10 border border-border/40 p-3 space-y-4">
              <Skeleton className="h-8 w-1/2 rounded-lg" />
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 h-full overflow-x-auto bg-background/50">
      <div className="flex xl:grid xl:grid-cols-4 gap-4 md:gap-5 min-w-[1100px] xl:min-w-0 pb-4 h-full items-start">
        {COLUMN_ORDER.map((status) => {
          const ui = STATUS_UI[status]
          const isOver = dragOverColumn === status

          return (
            <div
              key={status}
              className={cn(
                "flex flex-col w-full min-w-[320px] xl:min-w-0 rounded-2xl border transition-all duration-300 overflow-hidden max-h-full",
                isOver ? cn("bg-muted/40 shadow-inner ring-1 ring-inset", ui.hexBorder) : "bg-muted/10 border-border/50"
              )}
              onDragOver={onDragOver(status)}
              onDragLeave={onDragLeave}
              onDrop={onDropTo(status)}
            >
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/40 bg-card/50 backdrop-blur-sm z-10">
                <div className="flex items-center gap-2">
                  <ui.Icon className={cn("h-4 w-4", ui.hexText)} weight="bold" />
                  <h3 className="text-[13px] font-bold text-foreground uppercase tracking-wider">
                    {ui.label}
                  </h3>
                  <Badge variant="secondary" className={cn("ml-1.5 px-1.5 h-5 text-[10px] font-bold rounded-md", ui.hexLight, ui.hexText)}>
                    {groups.get(status)?.length ?? 0}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7 rounded-md hover:bg-background shadow-sm text-muted-foreground"
                  onClick={onAddProject}
                >
                  <Plus className="h-4 w-4" weight="bold" />
                </Button>
              </div>
              <div className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[150px] scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {(groups.get(status) ?? []).map(draggableCard)}
                <button
                  type="button"
                  onClick={onAddProject}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border border-dashed border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border transition-colors group"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-muted group-hover:bg-background shadow-sm transition-colors">
                    <Plus className="h-3 w-3" weight="bold" />
                  </div>
                  <span className="text-xs font-semibold">New Project</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}