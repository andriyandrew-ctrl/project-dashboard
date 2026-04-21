"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { projects as initialProjects, type Project } from "@/lib/data/projects"
import {
  differenceInCalendarDays,
  addDays,
  addWeeks,
  subWeeks,
  startOfWeek,
  format,
  isSameDay,
} from "date-fns"
import {
  CaretLeft,
  CaretRight,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  CaretDown,
} from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { DraggableBar } from "@/components/project-timeline-draggable-bar"
import { PriorityGlyphIcon } from "@/components/priority-badge"

// Tanggal hari ini untuk demo agar konsisten
const FIXED_TODAY = new Date(2024, 0, 23) // 23 Jan 2024

// FUNGSI PELINDUNG: Mencegah crash jika tanggal kosong atau rusak
const safeFormatDate = (dateVal: Date | string | undefined | null) => {
  if (!dateVal) return "TBD"
  const d = new Date(dateVal)
  return isNaN(d.getTime()) ? "TBD" : format(d, "dd MMM yyyy")
}

const safeToInputDate = (dateVal: Date | string | undefined | null) => {
  if (!dateVal) return ""
  const d = new Date(dateVal)
  return isNaN(d.getTime()) ? "" : d.toISOString().split('T')[0]
}

// Fungsi pembantu untuk konversi string -> Date
const toSafeDate = (val: string | Date | undefined, fallback: Date = new Date()): Date => {
  if (!val) return fallback
  const d = new Date(val)
  return isNaN(d.getTime()) ? fallback : d
}

export function ProjectTimeline() {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [expandedProjects, setExpandedProjects] = useState<string[]>(initialProjects.map((p) => p.id))
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [viewMode, setViewMode] = useState<"Day" | "Week" | "Month" | "Quarter">("Week")
  const [zoom, setZoom] = useState(1)
  const [editDialog, setEditDialog] = useState<{
    isOpen: boolean
    type: "project" | "task" | null
    projectId: string | null
    taskId: string | null
  }>({ isOpen: false, type: null, projectId: null, taskId: null })
  
  const [editStartDate, setEditStartDate] = useState("")
  const [editEndDate, setEditEndDate] = useState("")
  
  const [viewStartDate, setViewStartDate] = useState(
    () => startOfWeek(addWeeks(FIXED_TODAY, -1), { weekStartsOn: 1 }),
  )
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const nameColRef = useRef<HTMLDivElement>(null)
  const shouldAutoScrollToTodayRef = useRef(true)
  const [nameColWidth, setNameColWidth] = useState(280)
  const [todayOffsetDays, setTodayOffsetDays] = useState<number | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    message: string
    onConfirm: () => void
    onCancel: () => void
  }>({
    isOpen: false,
    message: "",
    onConfirm: () => { },
    onCancel: () => { },
  })

  const viewModes = useMemo(() => ["Day", "Week", "Month", "Quarter"] as const, [])

  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) =>
      prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId],
    )
  }

  const goToToday = () => {
    shouldAutoScrollToTodayRef.current = true
    setViewStartDate(startOfWeek(addWeeks(FIXED_TODAY, -1), { weekStartsOn: 1 }))
  }

  const navigateTime = (direction: "prev" | "next") => {
    const step = direction === "next" ? 1 : -1
    const weeksStep = viewMode === "Quarter" ? 12 : viewMode === "Month" ? 4 : 1
    setViewStartDate((d) => (step === 1 ? addWeeks(d, weeksStep) : subWeeks(d, weeksStep)))
  }

  const getDates = (): Date[] => {
    const daysToRender = viewMode === "Day" ? 21 : viewMode === "Week" ? 60 : viewMode === "Month" ? 90 : 120
    return Array.from({ length: daysToRender }).map((_, i) => addDays(viewStartDate, i))
  }

  const dates = useMemo(() => getDates(), [viewMode, viewStartDate])

  const baseCellWidth = viewMode === "Day" ? 140 : viewMode === "Week" ? 60 : viewMode === "Month" ? 40 : 20
  const cellWidth = Math.max(20, Math.round(baseCellWidth * zoom))
  const timelineWidth = dates.length * cellWidth

  useEffect(() => {
    setZoom(1)
  }, [viewMode])

  useEffect(() => {
    const el = nameColRef.current
    if (!el) return
    const update = () => {
      setNameColWidth(Math.round(el.getBoundingClientRect().width))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const offset = differenceInCalendarDays(FIXED_TODAY, dates[0])
    if (offset < 0 || offset >= dates.length) {
      setTodayOffsetDays(null)
      return
    }
    setTodayOffsetDays(offset)
  }, [dates])

  useEffect(() => {
    if (!shouldAutoScrollToTodayRef.current) return
    if (todayOffsetDays == null) return

    const el = scrollContainerRef.current
    if (!el) return

    const sidebarWidth = isSidebarOpen ? nameColWidth : 0
    const timelineViewportWidth = Math.max(0, el.clientWidth - sidebarWidth)
    const dayX = todayOffsetDays * cellWidth
    const target = Math.max(0, dayX - timelineViewportWidth / 2 + cellWidth / 2)

    el.scrollTo({ left: target, behavior: "smooth" })
    shouldAutoScrollToTodayRef.current = false
  }, [todayOffsetDays, cellWidth, isSidebarOpen, nameColWidth])

  const toggleTaskStatus = (projectId: string, taskId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p
        return {
          ...p,
          tasks: (p.tasks || []).map((t) => {
            if (t.id !== taskId) return t
            return { ...t, status: t.status === "done" ? "todo" : "done" }
          }),
        }
      }),
    )
  }

  const handleUpdateTask = (projectId: string, taskId: string, newStart: Date) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p

        const task = (p.tasks || []).find((t) => t.id === taskId)
        if (!task) return p

        const taskOldStart = toSafeDate(task.startDate, newStart)
        const taskOldEnd = toSafeDate(task.endDate, newStart)

        const taskDuration = differenceInCalendarDays(taskOldEnd, taskOldStart) + 1
        const newEnd = addDays(newStart, Math.max(1, taskDuration) - 1)

        const projStart = toSafeDate(p.startDate, newStart)
        const projEnd = toSafeDate(p.endDate, newEnd)

        const needsExpand = newStart < projStart || newEnd > projEnd
        if (needsExpand) {
          showConfirmDialog(
            "Pekerjaan ini melewati batas waktu proyek. Perluas batas proyek?",
            () => {
              setProjects((prevProj) =>
                prevProj.map((proj) => {
                  if (proj.id !== p.id) return proj
                  
                  const ps = toSafeDate(proj.startDate, newStart)
                  const pe = toSafeDate(proj.endDate, newEnd)
                  
                  return {
                    ...proj,
                    startDate: (newStart < ps ? newStart : ps).toISOString(),
                    endDate: (newEnd > pe ? newEnd : pe).toISOString(),
                    tasks: (proj.tasks || []).map((t) => (t.id === taskId ? { ...t, startDate: newStart.toISOString(), endDate: newEnd.toISOString() } : t)),
                  }
                })
              )
            }
          )
          return p
        }

        return {
          ...p,
          tasks: (p.tasks || []).map((t) => (t.id === taskId ? { ...t, startDate: newStart.toISOString(), endDate: newEnd.toISOString() } : t)),
        }
      }),
    )
  }

  const handleUpdateProjectDuration = (projectId: string, newStart: Date, newEnd: Date) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p
        return {
          ...p,
          startDate: newStart.toISOString(),
          endDate: newEnd.toISOString(),
        }
      }),
    )
  }

  const handleUpdateTaskDuration = (projectId: string, taskId: string, newStart: Date, newEnd: Date) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p
        return {
          ...p,
          tasks: (p.tasks || []).map((t) => (t.id === taskId ? { ...t, startDate: newStart.toISOString(), endDate: newEnd.toISOString() } : t)),
        }
      }),
    )
  }

  const showConfirmDialog = (message: string, onConfirm: () => void, onCancel: () => void = () => { }) => {
    setConfirmDialog({
      isOpen: true,
      message,
      onConfirm,
      onCancel,
    })
  }

  const handleConfirmDialogClose = (confirmed: boolean) => {
    if (confirmed) {
      confirmDialog.onConfirm()
    } else {
      confirmDialog.onCancel()
    }
    setConfirmDialog({
      isOpen: false,
      message: "",
      onConfirm: () => { },
      onCancel: () => { },
    })
  }

  const handleUpdateProject = (projectId: string, newStart: Date, confirmed: boolean = false) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p

        const oldStart = toSafeDate(p.startDate, newStart)
        const oldEnd = toSafeDate(p.endDate, newStart)

        const durationDays = differenceInCalendarDays(oldEnd, oldStart) + 1
        const newEnd = addDays(newStart, Math.max(1, durationDays) - 1)
        const diff = differenceInCalendarDays(newStart, oldStart)

        const shouldMoveChildren = (p.tasks || []).length > 0
        if (shouldMoveChildren && !confirmed) {
          showConfirmDialog(
            `Pindahkan semua ${(p.tasks || []).length} pekerjaan mengikuti proyek ini?`,
            () => {
              handleUpdateProject(projectId, newStart, true)
            }
          )
          return p 
        }

        return {
          ...p,
          startDate: newStart.toISOString(),
          endDate: newEnd.toISOString(),
          tasks: shouldMoveChildren
            ? (p.tasks || []).map((t) => {
              const tStart = toSafeDate(t.startDate, newStart)
              const tEnd = toSafeDate(t.endDate, newEnd)
              return {
                ...t,
                startDate: addDays(tStart, diff).toISOString(),
                endDate: addDays(tEnd, diff).toISOString(),
              }
            })
            : (p.tasks || []),
        }
      }),
    )
  }

  const handleSaveEdit = () => {
    if (!editDialog.type || !editDialog.projectId) return

    const newStart = new Date(editStartDate)
    const newEnd = new Date(editEndDate)

    if (editDialog.type === "project") {
      handleUpdateProjectDuration(editDialog.projectId, newStart, newEnd)
    } else if (editDialog.type === "task" && editDialog.taskId) {
      handleUpdateTaskDuration(editDialog.projectId, editDialog.taskId, newStart, newEnd)
    }

    setEditDialog({ isOpen: false, type: null, projectId: null, taskId: null })
  }

  const handleDoubleClick = (type: "project" | "task", projectId: string, taskId?: string) => {
    const item = type === "project"
      ? projects.find(p => p.id === projectId)
      : projects.find(p => p.id === projectId)?.tasks?.find(t => t.id === taskId)

    if (!item) return

    setEditDialog({
      isOpen: true,
      type,
      projectId,
      taskId: taskId || null
    })
    
    setEditStartDate(safeToInputDate(item.startDate))
    setEditEndDate(safeToInputDate(item.endDate))
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background min-w-0">
      {/* Timeline Controls */}
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-2 bg-background">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg"
            onClick={() => setIsSidebarOpen((s) => !s)}
          >
            <CaretDown className={cn("h-4 w-4 transition-transform", isSidebarOpen ? "rotate-90" : "-rotate-90")} />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground hidden sm:inline capitalize">
            {viewStartDate.toLocaleString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </span>
          <div className="hidden md:flex items-center gap-1 ml-4 justify-between">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => navigateTime("prev")}>
              <CaretLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 rounded-lg px-3 text-xs bg-transparent"
              onClick={goToToday}
            >
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => navigateTime("next")}>
              <CaretRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="ml-2 hidden md:flex items-center gap-1">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-lg px-3 text-xs justify-between min-w-[80px]"
                >
                  {viewMode}
                  <CaretDown className="h-3 w-3 ml-1" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[120px] p-1" align="start">
                {viewModes.map((mode) => (
                  <Button
                    key={mode}
                    variant={viewMode === mode ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-start h-8 px-2 text-xs"
                    onClick={() => setViewMode(mode)}
                  >
                    {mode}
                  </Button>
                ))}
              </PopoverContent>
            </Popover>
          </div>
          <div className="ml-2 hidden md:flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg"
              onClick={() => setZoom((z) => Math.max(0.5, Math.min(2.5, z * 1.2)))}
            >
              <MagnifyingGlassPlus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg"
              onClick={() => setZoom((z) => Math.max(0.5, Math.min(2.5, z / 1.2)))}
            >
              <MagnifyingGlassMinus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* DESKTOP TIMELINE */}
      <div className="hidden md:block flex-1 overflow-hidden min-w-0">
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-auto min-w-0 h-full"
        >
          <div className="relative min-w-max">
            
            {/* Timeline Header */}
            <div className="flex h-10 items-center border-b bg-muted/30 border-border sticky top-0 z-20">
              <div
                ref={nameColRef}
                className={cn(
                  "shrink-0 bg-background sticky left-0 z-30 border-r border-border/20 transition-all duration-300 flex items-center",
                  isSidebarOpen ? "w-[280px] lg:w-[320px]" : "w-0 overflow-hidden px-0 border-none",
                )}
              >
                <div className="px-4">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</span>
                </div>
              </div>

              <div className="relative shrink-0 h-full" style={{ width: timelineWidth }}>
                <div className="flex h-full items-center" style={{ width: timelineWidth }}>
                  {dates.map((day, i) => {
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6
                    const showLabel =
                      viewMode === "Day" ||
                      (viewMode === "Week" && i % 2 === 0) ||
                      (viewMode === "Month" && day.getDay() === 1) ||
                      (viewMode === "Quarter" && day.getDate() === 1)

                    const headerFormat = viewMode === "Day" ? "EEE d" : "d"
                    const label = viewMode === "Quarter" ? format(day, "MMM") : format(day, headerFormat)

                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex-none h-full flex items-center justify-center border-r border-border/20",
                          isWeekend && viewMode === "Day" ? "bg-muted/20" : "",
                        )}
                        style={{ width: cellWidth }}
                      >
                        {showLabel && (
                          <div className="h-full flex items-center justify-center">
                            <span
                              className={cn(
                                "block text-xs whitespace-nowrap leading-none",
                                isSameDay(day, FIXED_TODAY) ? "text-primary font-semibold" : "text-muted-foreground",
                              )}
                            >
                              {label}
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-muted/30 to-transparent pointer-events-none z-10" />
              </div>
            </div>

            {/* Project Rows */}
            <div className="flex flex-col relative">
              {projects.map((project) => (
                <div key={project.id} className="w-full flex flex-col">
                  {/* Project Bar */}
                  <div className="flex h-[54px] group hover:bg-accent/20 relative border-b border-border/20">
                    <div
                      className={cn(
                        "shrink-0 sticky left-0 z-30 bg-background border-r border-border/20 transition-all duration-300",
                        isSidebarOpen ? "w-[280px] lg:w-[320px]" : "w-0 overflow-hidden border-none",
                      )}
                    >
                      <div
                        className={cn(
                          "h-[54px] w-full flex items-center justify-between px-4 cursor-pointer",
                          isSidebarOpen ? "" : "px-0",
                        )}
                        onClick={() => toggleProject(project.id)}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={cn("transition-transform", expandedProjects.includes(project.id) ? "rotate-0" : "-rotate-90")}>
                            <CaretDown className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="font-semibold text-[13px] truncate">{project.name}</span>
                          <span className="ml-1 text-[10px] font-bold text-muted-foreground bg-muted rounded px-1.5 py-0.5 shrink-0">
                            {project.taskCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="relative h-full shrink-0 overflow-hidden" style={{ width: timelineWidth }}>
                      <div className="absolute inset-0 flex pointer-events-none h-full">
                        {dates.map((day, i) => {
                          const isWeekend = day.getDay() === 0 || day.getDay() === 6
                          return (
                            <div
                              key={i}
                              style={{ width: cellWidth }}
                              className={cn(
                                "flex-none h-full border-r border-border/20",
                                isWeekend && viewMode === "Day" ? "bg-muted/20" : "",
                              )}
                            />
                          )
                        })}
                      </div>

                      <DraggableBar
                        item={{
                          id: project.id,
                          name: project.name,
                          startDate: toSafeDate(project.startDate),
                          endDate: toSafeDate(project.endDate),
                          progress: (project as any).progress,
                        }}
                        variant="project"
                        viewStartDate={viewStartDate}
                        cellWidth={cellWidth}
                        onUpdateStart={(id, newStart) => handleUpdateProject(id, newStart)}
                        onUpdateDuration={(id, newStart, newEnd) => handleUpdateProjectDuration(id, newStart, newEnd)}
                        onDoubleClick={() => handleDoubleClick("project", project.id)}
                      />
                    </div>
                  </div>

                  {/* Tasks Rows (Jaring Pengaman || []) */}
                  {expandedProjects.includes(project.id) &&
                    (project.tasks || []).map((task) => (
                      <div key={task.id} className="flex h-[54px] group hover:bg-accent/10 relative border-b border-border/20 bg-muted/5">
                        <div
                          className={cn(
                            "shrink-0 sticky left-0 z-30 bg-muted/5 border-r border-border/20 transition-all duration-300",
                            isSidebarOpen ? "w-[280px] lg:w-[320px]" : "w-0 overflow-hidden border-none",
                          )}
                        >
                          <div className={cn("h-[54px] w-full flex items-center gap-2 pl-10 pr-4", isSidebarOpen ? "" : "px-0")}>
                            <Checkbox
                              checked={task.status === "done"}
                              onCheckedChange={(_checked: boolean) => toggleTaskStatus(project.id, task.id)}
                              className={cn(
                                "h-4 w-4 rounded-sm",
                                "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 data-[state=checked]:text-white",
                              )}
                            />
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className={cn("text-[12px] truncate", task.status === "done" && "line-through text-muted-foreground")}>
                                {task.name}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                <span>{(task as any).assignee?.name || "Unassigned"}</span>
                                <span>•</span>
                                <PriorityGlyphIcon level={project.priority} size="sm" />
                                <span>•</span>
                                <span className="capitalize">{task.status}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="relative h-full shrink-0 overflow-hidden" style={{ width: timelineWidth }}>
                          <div className="absolute inset-0 flex pointer-events-none h-full">
                            {dates.map((day, i) => {
                              const isWeekend = day.getDay() === 0 || day.getDay() === 6
                              return (
                                <div
                                  key={i}
                                  style={{ width: cellWidth }}
                                  className={cn(
                                    "flex-none h-full border-r border-border/20",
                                    isWeekend && viewMode === "Day" ? "bg-muted/20" : "",
                                  )}
                                />
                              )
                            })}
                          </div>

                          <DraggableBar
                            item={{
                              id: task.id,
                              name: task.name,
                              startDate: toSafeDate(task.startDate),
                              endDate: toSafeDate(task.endDate),
                              status: task.status,
                            }}
                            variant="task"
                            viewStartDate={viewStartDate}
                            cellWidth={cellWidth}
                            onUpdateStart={(id, newStart) => handleUpdateTask(project.id, id, newStart)}
                            onUpdateDuration={(id, newStart, newEnd) => handleUpdateTaskDuration(project.id, id, newStart, newEnd)}
                            onDoubleClick={() => handleDoubleClick("task", project.id, task.id)}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            </div>

            {/* Today Line */}
            {todayOffsetDays != null && (
              <div
                className="absolute z-10 pointer-events-none overflow-hidden"
                style={{
                  left: nameColWidth,
                  top: 40,
                  bottom: 0,
                  width: timelineWidth,
                }}
              >
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-primary/70 shadow-[0_0_8px_rgba(0,0,0,0.2)]"
                  style={{ left: (todayOffsetDays || 0) * cellWidth + cellWidth / 2 }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MOBILE LIST VIEW */}
      <div className="md:hidden flex-1 overflow-auto">
        {projects.map((project) => (
          <div key={project.id} className="border-b border-border/30">
            <div
              className="p-4 flex items-center justify-between cursor-pointer active:bg-accent/50"
              onClick={() => toggleProject(project.id)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {expandedProjects.includes(project.id) ? (
                  <CaretDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <CaretRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">{project.name}</span>
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted rounded px-1.5 py-0.5 shrink-0">
                      {project.taskCount || 0}
                    </span>
                  </div>
                  <div className="text-[11px] font-medium text-muted-foreground mt-1">
                    {safeFormatDate(project.startDate)} - {safeFormatDate(project.endDate)}
                  </div>
                </div>
              </div>
              <div className="text-sm font-bold text-muted-foreground shrink-0 ml-2">{Math.round((project as any).progress || 0)}%</div>
            </div>

            {/* Tasks Mobile (Jaring Pengaman || []) */}
            {expandedProjects.includes(project.id) && (
              <div className="bg-muted/10">
                {(project.tasks || []).map((task) => (
                  <div key={task.id} className="px-4 py-3 pl-12 border-t border-border/20">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={task.status === "done"}
                        onCheckedChange={(_checked: boolean) => toggleTaskStatus(project.id, task.id)}
                        className={cn(
                          "h-4 w-4 rounded-sm mt-0.5",
                          "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 data-[state=checked]:text-white",
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <div className={cn("text-[13px] font-medium", task.status === "done" && "line-through text-muted-foreground")}>
                          {task.name}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                          <span>{(task as any).assignee?.name || "Unassigned"}</span>
                          <span>•</span>
                          <PriorityGlyphIcon level={project.priority} size="sm" />
                          <span>•</span>
                          <span className="capitalize">{task.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Date Dialog */}
      <Dialog open={editDialog.isOpen} onOpenChange={(open) => {
        if (!open) setEditDialog({ isOpen: false, type: null, projectId: null, taskId: null });
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Schedule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="item-name" className="text-sm font-medium">Name {editDialog.type === "project" ? "(Project)" : "(Task)"}</label>
              <Input
                id="item-name"
                value={editDialog.type === "project"
                  ? projects.find(p => p.id === editDialog.projectId)?.name || ''
                  : projects.find(p => p.id === editDialog.projectId)?.tasks?.find(t => t.id === editDialog.taskId)?.name || ''
                }
                disabled
                className="bg-muted text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="start-date" className="text-sm font-medium">Start Date</label>
              <Input
                id="start-date"
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="end-date" className="text-sm font-medium">End Date</label>
              <Input
                id="end-date"
                type="date"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditDialog({ isOpen: false, type: null, projectId: null, taskId: null })}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => {
        if (!open) handleConfirmDialogClose(false);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">{confirmDialog.message}</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleConfirmDialogClose(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleConfirmDialogClose(true)}>
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}