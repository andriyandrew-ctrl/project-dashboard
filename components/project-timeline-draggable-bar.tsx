"use client"

import { useState } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"
import { addDays, differenceInCalendarDays, format } from "date-fns"

// Tambahkan import ProjectTask dari kamusnya
import type { Project, ProjectTask } from "@/lib/data/projects" 
import { cn } from "@/lib/utils"

export type TimelineBarItem = {
    id: string
    name: string
    startDate: Date
    endDate: Date
    // Ganti cara pemanggilan tipe statusnya menjadi seperti ini:
    status?: ProjectTask["status"] 
    progress?: number
}

export type DraggableBarProps = {
    item: TimelineBarItem
    variant: "project" | "task"
    viewStartDate: Date
    cellWidth: number
    onUpdateStart: (id: string, newStart: Date) => void
    onUpdateDuration?: (id: string, newStart: Date, newEnd: Date) => void
    onDoubleClick?: () => void
}

// JARING PENGAMAN (Null Safety) untuk mencegah error "Invalid time value"
const safeFormat = (dateVal: any, fmt: string) => {
    if (!dateVal) return "TBD";
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? "TBD" : format(d, fmt);
}

const safeDifference = (date1: any, date2: any) => {
    if (!date1 || !date2) return 0;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
    return differenceInCalendarDays(d1, d2);
}

export function DraggableBar({
    item,
    variant,
    viewStartDate,
    cellWidth,
    onUpdateStart,
    onUpdateDuration,
    onDoubleClick,
}: DraggableBarProps) {
    // Gunakan fungsi aman untuk menghitung lebar dan posisi batang
    const durationDays = Math.max(1, safeDifference(item.endDate, item.startDate) + 1)
    const offsetDays = safeDifference(item.startDate, viewStartDate)
    
    const left = offsetDays * cellWidth
    const width = durationDays * cellWidth

    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState(0)
    const [dragType, setDragType] = useState<"move" | "resize-left" | "resize-right" | null>(null)

    const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragging(true)

        const rect = e.currentTarget.getBoundingClientRect()
        const offsetX = e.clientX - rect.left
        const dragKind = offsetX < 8 ? "resize-left" : offsetX > rect.width - 8 ? "resize-right" : "move"
        setDragType(dragKind)

        const startX = e.clientX
        document.body.style.cursor = dragKind === "move" ? "grabbing" : "col-resize"

        const handlePointerMove = (moveEvent: PointerEvent) => {
            setDragOffset(moveEvent.clientX - startX)
        }

        const handlePointerUp = (upEvent: PointerEvent) => {
            const deltaX = upEvent.clientX - startX
            const daysMoved = Math.round(deltaX / cellWidth)

            if (daysMoved !== 0 && item.startDate && item.endDate) {
                const sDate = new Date(item.startDate);
                const eDate = new Date(item.endDate);

                if (dragKind === "move") {
                    onUpdateStart(item.id, addDays(sDate, daysMoved))
                } else if (dragKind === "resize-left" && onUpdateDuration) {
                    const newStartDate = addDays(sDate, daysMoved)
                    if (newStartDate < eDate) {
                        onUpdateDuration(item.id, newStartDate, eDate)
                    }
                } else if (dragKind === "resize-right" && onUpdateDuration) {
                    const newEndDate = addDays(eDate, daysMoved)
                    if (newEndDate > sDate) {
                        onUpdateDuration(item.id, sDate, newEndDate)
                    }
                }
            }

            setIsDragging(false)
            setDragOffset(0)
            setDragType(null)
            document.body.style.cursor = ""
            window.removeEventListener("pointermove", handlePointerMove)
            window.removeEventListener("pointerup", handlePointerUp)
        }

        window.addEventListener("pointermove", handlePointerMove)
        window.addEventListener("pointerup", handlePointerUp)
    }

    let visualLeft = left
    let visualWidth = width

    if (isDragging && dragType) {
        if (dragType === "move") {
            visualLeft = left + dragOffset
        } else if (dragType === "resize-right") {
            visualWidth = Math.max(cellWidth, width + dragOffset)
        } else if (dragType === "resize-left") {
            visualLeft = left + dragOffset
            visualWidth = Math.max(cellWidth, width - dragOffset)
        }
    }

    // PENGGUNAAN FUNGSI AMAN di sini
    const dateLabel = `${safeFormat(item.startDate, "d/M")} - ${safeFormat(item.endDate, "d/M")}`

    // Sinkronisasi Warna dengan Kanban yang Baru
    const getTaskColors = () => {
        if (variant === "project") {
            return "bg-slate-200/50 border-slate-300 text-slate-800 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-300 shadow-sm"
        }
        
        switch (item.status) {
            case "done":
                return "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.1)]"
            case "in-progress":
                return "bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-400 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.1)]"
            default: // todo / planned
                return "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400"
        }
    }

    return (
        <div
            onPointerDown={handlePointerDown}
            onDoubleClick={onDoubleClick}
            className={cn(
                "absolute h-[30px] top-[12px] rounded-md border flex items-center px-2 gap-2 select-none overflow-hidden cursor-grab active:cursor-grabbing group",
                getTaskColors(),
                isDragging ? "shadow-lg z-30 opacity-90 ring-2 ring-primary/30" : "",
            )}
            style={{
                left: `${visualLeft}px`,
                width: `${Math.max(visualWidth, 50)}px`, // Lebar minimal agar selalu bisa di-drag
                transition: isDragging ? "none" : "left 0.3s cubic-bezier(0.25, 1, 0.5, 1)",
            }}
        >
            {/* Indikator Progress (Khusus Project) */}
            {variant === "project" && item.progress !== undefined && (
                <div 
                    className="absolute left-0 top-0 bottom-0 bg-primary/10 border-r border-primary/20 pointer-events-none"
                    style={{ width: `${Math.min(100, Math.max(0, item.progress))}%` }}
                />
            )}

            {/* Handle Kiri */}
            <div className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize opacity-0 group-hover:opacity-100 bg-foreground/10 hover:bg-foreground/20 transition-colors z-10" />
            
            {/* Garis Grip Kiri (Visual) */}
            {variant === "task" && <div className="w-0.5 h-3.5 bg-current/40 rounded-full shrink-0 ml-0.5" />}
            
            {/* Teks Label */}
            <span className="text-[11px] font-semibold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis flex-1 min-w-0 z-10 drop-shadow-sm">
                {dateLabel}: {item.name}
            </span>
            
            {/* Garis Grip Kanan (Visual) */}
            {variant === "task" && <div className="w-0.5 h-3.5 bg-current/40 rounded-full shrink-0 mr-0.5" />}

            {/* Handle Kanan */}
            <div className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize opacity-0 group-hover:opacity-100 bg-foreground/10 hover:bg-foreground/20 transition-colors z-10" />
        </div>
    )
}