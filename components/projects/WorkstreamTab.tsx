"use client"

import { useMemo, useState } from "react"
// PERUBAHAN: Menambahkan import CaretUp
import { CaretDown, CaretUp, DotsSixVertical, Plus, FolderSimple, CheckCircle, Clock, PlayCircle } from "@phosphor-icons/react/dist/ssr"
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import type { WorkstreamGroup, WorkstreamTask } from "@/lib/data/project-details"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ProgressCircle } from "@/components/progress-circle"
import { cn } from "@/lib/utils"
import { TaskRowBase } from "@/components/tasks/TaskRowBase"

type WorkstreamTabProps = {
  workstreams: WorkstreamGroup[] | undefined
}

export function WorkstreamTab({ workstreams }: WorkstreamTabProps) {
  const [state, setState] = useState<WorkstreamGroup[]>(() => workstreams ?? [])
  const [openValues, setOpenValues] = useState<string[]>(() =>
    workstreams && workstreams.length ? [workstreams[0].id] : [],
  )
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [overTaskId, setOverTaskId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  )

  const allIds = useMemo(() => state.map((group) => group.id), [state])

  const findTaskById = (taskId: string | null): WorkstreamTask | null => {
    if (!taskId) return null
    for (const group of state) {
      const found = group.tasks.find((task) => task.id === taskId)
      if (found) return found
    }
    return null
  }

  const activeTask = findTaskById(activeTaskId)

  const toggleTask = (groupId: string, taskId: string) => {
    setState((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
            ...group,
            tasks: group.tasks.map((task) =>
              task.id === taskId
                ? {
                  ...task,
                  status: task.status === "done" ? "todo" : "done",
                }
                : task,
            ),
          }
          : group,
      ),
    )
  }

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id
    if (typeof id === "string") {
      setActiveTaskId(id)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id
    if (typeof overId === "string" && !overId.startsWith("group:")) {
      setOverTaskId(overId)
    } else {
      setOverTaskId(null)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTaskId(null)
    setOverTaskId(null)

    if (!over) return
    if (active.id === over.id) return

    const activeId = String(active.id)
    const overId = String(over.id)

    setState((prev) => {
      let sourceGroupIndex = -1
      let sourceTaskIndex = -1
      let targetGroupIndex = -1
      let targetTaskIndex = -1

      prev.forEach((group, groupIndex) => {
        const aIndex = group.tasks.findIndex((task) => task.id === activeId)
        if (aIndex !== -1) {
          sourceGroupIndex = groupIndex
          sourceTaskIndex = aIndex
        }

        const oIndex = group.tasks.findIndex((task) => task.id === overId)
        if (oIndex !== -1) {
          targetGroupIndex = groupIndex
          targetTaskIndex = oIndex
        }
      })

      if (targetGroupIndex === -1 && overId.startsWith("group:")) {
        const groupId = overId.slice("group:".length)
        targetGroupIndex = prev.findIndex((group) => group.id === groupId)
        if (targetGroupIndex !== -1) {
          targetTaskIndex = prev[targetGroupIndex].tasks.length
        }
      }

      if (sourceGroupIndex === -1 || targetGroupIndex === -1) return prev

      const next = [...prev]
      const sourceGroup = next[sourceGroupIndex]
      const targetGroup = next[targetGroupIndex]

      if (sourceGroupIndex === targetGroupIndex) {
        const reordered = arrayMove(sourceGroup.tasks, sourceTaskIndex, targetTaskIndex)
        next[sourceGroupIndex] = { ...sourceGroup, tasks: reordered }
        return next
      }

      const sourceTasks = [...sourceGroup.tasks]
      const [moved] = sourceTasks.splice(sourceTaskIndex, 1)
      if (!moved) return prev

      const targetTasks = [...targetGroup.tasks]
      targetTasks.splice(targetTaskIndex, 0, moved)

      next[sourceGroupIndex] = { ...sourceGroup, tasks: sourceTasks }
      next[targetGroupIndex] = { ...targetGroup, tasks: targetTasks }

      return next
    })
  }

  const handleDragCancel = () => {
    setActiveTaskId(null)
    setOverTaskId(null)
  }

  if (!state.length) {
    return (
      <section className="py-12">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
            <FolderSimple className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            ALUR KERJA BELUM DITENTUKAN
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-[280px]">
            Gunakan Project Wizard untuk merancang fase pekerjaan Anda.
          </p>
        </div>
      </section>
    )
  }

  return (
    // PERUBAHAN: Membungkus seluruh tab ke dalam kotak abu-abu (bg-muted/30)
    <section className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-5 shadow-sm">
      
      {/* HEADER TAB */}
      <div className="flex items-center justify-between gap-3 mb-5 border-b border-border/50 pb-4">
        <div className="flex items-center gap-2 text-primary">
          <FolderSimple className="h-5 w-5" weight="fill" />
          {/* PERUBAHAN: Font disamakan ukurannya dengan tab Overview */}
          <h3 className="text-lg font-semibold text-foreground tracking-tight">
            Workstream Breakdown
          </h3>
        </div>
        
        {/* PERUBAHAN: Logika dan Ikon Panah Diperbaiki */}
        <div className="flex items-center gap-1 bg-background border border-border/50 p-1 rounded-lg shadow-sm">
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-7 w-7 rounded-md hover:bg-muted"
            onClick={() => setOpenValues(allIds)}
            disabled={!allIds.length}
            title="Buka Semua (Expand)"
          >
            <CaretDown className="h-4 w-4" /> 
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-7 w-7 rounded-md hover:bg-muted"
            onClick={() => setOpenValues([])}
            disabled={!allIds.length}
            title="Tutup Semua (Collapse)"
          >
            <CaretUp className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="px-0">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <Accordion
            type="multiple"
            value={openValues}
            onValueChange={(values) =>
              setOpenValues(Array.isArray(values) ? values : values ? [values] : [])
            }
            className="space-y-4"
          >
            {state.map((group) => (
              <AccordionItem
                key={group.id}
                value={group.id}
                // Kotak di dalam kotak utama
                className="overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-all hover:border-border/80"
              >
                <AccordionTrigger className="px-4 py-4 hover:bg-muted/40 [&[data-state=open]>div>div>svg.caret-icon]:rotate-0">
                  <div className="flex w-full items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <CaretDown className="caret-icon h-4 w-4 text-muted-foreground transition-transform duration-200 -rotate-90" aria-hidden="true" />
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="text-sm font-bold text-foreground truncate">
                          {group.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <PhaseStatusBadge group={group} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                      <Button asChild size="icon-sm" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary">
                        <span
                          role="button"
                          aria-label="Add task"
                          title="Tambah Tugas Baru"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Plus className="h-4 w-4" weight="bold" />
                        </span>
                      </Button>
                      <Separator orientation="vertical" className="h-6" />
                      <GroupSummary group={group} />
                    </div>
                  </div>
                </AccordionTrigger>

                <WorkstreamTasks
                  group={group}
                  activeTaskId={activeTaskId}
                  overTaskId={overTaskId}
                  onToggleTask={(taskId) => toggleTask(group.id, taskId)}
                />
              </AccordionItem>
            ))}
          </Accordion>

          <DragOverlay>
            {activeTask ? (
              <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm bg-background border border-primary/20 shadow-xl">
                <DotsSixVertical className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 font-medium text-foreground">{activeTask.name}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </section>
  )
}

function PhaseStatusBadge({ group }: { group: WorkstreamGroup }) {
  const total = group.tasks.length
  const done = group.tasks.filter((t) => t.status === "done").length
  
  if (total === 0) return null
  if (done === total) return (
    <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold uppercase tracking-tight">
      <CheckCircle className="h-3 w-3" weight="fill" /> Selesai
    </div>
  )
  if (done > 0) return (
    <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold uppercase tracking-tight">
      <PlayCircle className="h-3 w-3" weight="fill" /> Berjalan
    </div>
  )
  return (
    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
      <Clock className="h-3 w-3" weight="bold" /> Terencana
    </div>
  )
}

type GroupSummaryProps = {
  group: WorkstreamGroup
}

function GroupSummary({ group }: GroupSummaryProps) {
  const total = group.tasks.length
  const done = group.tasks.filter((t) => t.status === "done").length
  const percent = total ? Math.round((done / total) * 100) : 0
  const color = getWorkstreamProgressColor(percent)

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-end">
        <span className="text-[11px] font-bold text-foreground leading-none">
          {percent}%
        </span>
        <span className="text-[10px] text-muted-foreground">
          {done}/{total} Item
        </span>
      </div>
      <ProgressCircle progress={percent} color={color} size={24} />
    </div>
  )
}

function getWorkstreamProgressColor(percent: number): string {
  if (percent >= 100) return "rgb(16, 185, 129)" // Emerald
  if (percent >= 50) return "rgb(59, 130, 246)" // Blue
  if (percent > 0) return "rgb(245, 158, 11)"  // Amber
  return "rgba(0,0,0,0.1)"
}

type WorkstreamTasksProps = {
  group: WorkstreamGroup
  activeTaskId: string | null
  overTaskId: string | null
  onToggleTask: (taskId: string) => void
}

function WorkstreamTasks({ group, activeTaskId, overTaskId, onToggleTask }: WorkstreamTasksProps) {
  const { setNodeRef } = useDroppable({ id: `group:${group.id}` })

  return (
    <AccordionContent className="border-t border-border/50 bg-muted/10 p-2 sm:p-3">
      <SortableContext items={group.tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="space-y-2 py-1">
          {group.tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={() => onToggleTask(task.id)}
              activeTaskId={activeTaskId}
              overTaskId={overTaskId}
            />
          ))}
        </div>
      </SortableContext>
    </AccordionContent>
  )
}

type TaskRowProps = {
  task: WorkstreamTask
  onToggle: () => void
  activeTaskId: string | null
  overTaskId: string | null
}

function TaskRow({ task, onToggle, activeTaskId, overTaskId }: TaskRowProps) {
  const isDone = task.status === "done"

  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const showDropLine = !isDragging && (isOver || overTaskId === task.id)

  return (
    <div ref={setNodeRef} style={style} className="space-y-1">
      {showDropLine && <div className="h-0.5 w-full rounded-full bg-primary" />}
      <div className={cn(
        "rounded-xl border border-border/50 bg-background transition-shadow",
        isDragging ? "shadow-lg opacity-60" : "hover:shadow-sm"
      )}>
        <TaskRowBase
          checked={isDone}
          title={task.name}
          onCheckedChange={onToggle}
          titleAriaLabel={task.name}
          meta={
            <div className="flex items-center gap-3">
              {task.dueLabel && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/50 text-[11px] font-medium">
                  <Clock className={cn(
                    "h-3 w-3",
                    task.dueTone === "danger" ? "text-red-500" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    task.dueTone === "danger" ? "text-red-600" : "text-muted-foreground"
                  )}>
                    {task.dueLabel}
                  </span>
                </div>
              )}
              {task.assignee && (
                <div className="flex items-center gap-2 pr-1" title={task.assignee.name}>
                   <Avatar className="h-6 w-6 border border-background">
                    {task.assignee.avatarUrl && (
                      <AvatarImage src={task.assignee.avatarUrl} alt={task.assignee.name} />
                    )}
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                      {task.assignee.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                className="h-8 w-8 rounded-lg text-muted-foreground cursor-grab active:cursor-grabbing hover:bg-muted"
                aria-label="Reorder task"
                {...attributes}
                {...listeners}
              >
                <DotsSixVertical className="h-4 w-4" weight="bold" />
              </Button>
            </div>
          }
          className="p-3"
        />
      </div>
    </div>
  )
}