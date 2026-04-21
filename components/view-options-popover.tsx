"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import {
  Sliders,
  ListBullets,
  Kanban,
  ChartBar,
  Globe,
  Spinner,
  User,
  Tag,
  TextT,
  Calendar,
  Eye
} from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"

type Options = {
  viewType: "list" | "board" | "timeline"
  tasks: "indented" | "collapsed" | "flat"
  ordering: "manual" | "alphabetical" | "date"
  showAbsentParent: boolean
  showClosedProjects: boolean
  groupBy: "none" | "status" | "assignee" | "tags"
  properties: string[]
}

interface ViewOptionsPopoverProps {
  options: Options
  onChange: (options: Options) => void
  allowedViewTypes?: string[]
}

export function ViewOptionsPopover({ options, onChange, allowedViewTypes }: ViewOptionsPopoverProps) {
  const [groupByOpen, setGroupByOpen] = useState(false)

  const viewTypes = [
    { id: "list", label: "List View", icon: ListBullets },
    { id: "board", label: "Board View", icon: Kanban },
    { id: "timeline", label: "Timeline", icon: ChartBar },
  ].filter((type) => !allowedViewTypes || allowedViewTypes.includes(type.id))

  const groupByOptions = [
    { id: "none", label: "None", icon: Globe },
    { id: "status", label: "Status", icon: Spinner },
    { id: "assignee", label: "Assignee", icon: User },
    { id: "tags", label: "Tags", icon: Tag },
  ]

  const propertyOptions = [
    { id: "title", label: "Project Name", icon: TextT },
    { id: "status", label: "Status", icon: Spinner },
    { id: "assignee", label: "Lead / PIC", icon: User },
    { id: "dueDate", label: "Due Date", icon: Calendar },
  ]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2 rounded-lg border-border/60 px-3 bg-transparent">
          <Eye className="h-4 w-4" />
          View
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 rounded-xl p-0 shadow-lg border-border" align="end">
        <div className="p-4">
          <div className="flex rounded-xl p-1 bg-muted/40 border border-border/50">
            {viewTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => onChange({ ...options, viewType: type.id as Options['viewType'] })}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1.5 rounded-lg py-2.5 text-xs font-medium transition-all shadow-none",
                  options.viewType === type.id
                    ? "bg-background shadow-sm text-primary border border-border/40"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50",
                )}
              >
                <type.icon className="h-5 w-5" weight={options.viewType === type.id ? "fill" : "regular"} />
                {type.label}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Show Completed</span>
              <Switch
                checked={options.showClosedProjects}
                onCheckedChange={(checked) => onChange({ ...options, showClosedProjects: checked })}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-medium text-foreground">Group By</span>
              <Popover open={groupByOpen} onOpenChange={setGroupByOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 rounded-lg border-border/60 px-3 bg-muted/20 hover:bg-muted"
                  >
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    {groupByOptions.find((o) => o.id === options.groupBy)?.label}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 rounded-xl p-1.5 shadow-lg border-border" align="end">
                  <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Select Grouping
                  </div>
                  {groupByOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        onChange({ ...options, groupBy: option.id as Options['groupBy'] })
                        setGroupByOpen(false)
                      }}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent",
                        options.groupBy === option.id && "bg-accent font-medium",
                      )}
                    >
                      <option.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-left">{option.label}</span>
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            </div>

            <div className="pt-3 border-t border-border/40">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2.5">
                Properties
              </span>
              <div className="flex flex-wrap gap-2">
                {propertyOptions.map((prop) => (
                  <button
                    key={prop.id}
                    onClick={() => {
                      const newProps = options.properties.includes(prop.id)
                        ? options.properties.filter((p) => p !== prop.id)
                        : [...options.properties, prop.id]
                      onChange({ ...options, properties: newProps })
                    }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition-all",
                      options.properties.includes(prop.id)
                        ? "border-primary/40 bg-primary/5 text-primary font-medium"
                        : "border-border/60 bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <prop.icon className="h-3.5 w-3.5" weight={options.properties.includes(prop.id) ? "fill" : "regular"} />
                    {prop.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}