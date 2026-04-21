"use client"

import { format } from "date-fns"
import { Clock, CalendarBlank } from "@phosphor-icons/react/dist/ssr"
import type { TimeSummary } from "@/lib/data/project-details"
import { cn } from "@/lib/utils"

type TimeCardProps = {
  time: TimeSummary
}

export function TimeCard({ time }: TimeCardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary mb-5">
        <Clock className="h-5 w-5" weight="fill" />
        <h3 className="text-base font-bold text-foreground">Waktu Pelaksanaan</h3>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            Estimasi
          </span>
          <span className="font-semibold text-foreground">{time.estimateLabel}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <CalendarBlank className="h-4 w-4" />
            Tenggat (Target)
          </span>
          <span className="font-semibold text-foreground">{format(time.dueDate, "dd MMM yyyy")}</span>
        </div>
      </div>

      <div className="pt-2">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Sisa Waktu</span>
          <span className={cn("font-medium", time.progressPercent > 80 ? "text-red-500" : "text-foreground")}>
            {time.daysRemainingLabel}
          </span>
        </div>
        {/* Progress Bar Sisa Waktu */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50 border border-border/50">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              time.progressPercent > 80 ? "bg-red-500" : "bg-primary"
            )}
            style={{ width: `${Math.min(100, Math.max(0, time.progressPercent))}%` }}
          />
        </div>
      </div>
    </div>
  )
}