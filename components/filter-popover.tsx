"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import {
  Funnel,
  Spinner,
  Tag,
  User,
  ChartBar,
} from "@phosphor-icons/react/dist/ssr"

export type FilterChip = { key: string; value: string }

type FilterTemp = {
  status: Set<string>
  priority: Set<string>
  tags: Set<string>
  members: Set<string>
}

interface FilterCounts {
  status?: Record<string, number>
  priority?: Record<string, number>
  tags?: Record<string, number>
  members?: Record<string, number>
}

interface FilterPopoverProps {
  initialChips?: FilterChip[]
  onApply: (chips: FilterChip[]) => void
  onClear: () => void
  counts?: FilterCounts
}

export function FilterPopover({ initialChips, onApply, onClear, counts }: FilterPopoverProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [active, setActive] = useState<"status" | "priority" | "tags" | "members">("status")

  const [temp, setTemp] = useState<FilterTemp>(() => ({
    status: new Set<string>(),
    priority: new Set<string>(),
    tags: new Set<string>(),
    members: new Set<string>(),
  }))

  const [tagSearch, setTagSearch] = useState("")

  useEffect(() => {
    if (!open) return
    const next: FilterTemp = {
      status: new Set<string>(),
      priority: new Set<string>(),
      tags: new Set<string>(),
      members: new Set<string>(),
    }
    for (const c of initialChips || []) {
      const k = c.key.toLowerCase()
      if (k === "status") next.status.add(c.value.toLowerCase())
      if (k === "priority") next.priority.add(c.value.toLowerCase())
      if (k === "member" || k === "pic" || k === "members") next.members.add(c.value)
      if (k === "tag" || k === "tags") next.tags.add(c.value.toLowerCase())
    }
    setTemp(next)
  }, [open, initialChips])

  const categories = [
    { id: "status", label: "Project Status", icon: Spinner },
    { id: "priority", label: "Priority", icon: ChartBar },
    { id: "tags", label: "Tags / Labels", icon: Tag },
    { id: "members", label: "Assignee / PIC", icon: User },
  ] as const

  const statusOptions = [
    { id: "backlog", label: "Not Started", color: "var(--slate-400)", hex: "#94a3b8" },
    { id: "planned", label: "Planned (Engineering)", color: "var(--blue-500)", hex: "#3b82f6" },
    { id: "active", label: "In Progress (Fabrikasi)", color: "var(--amber-500)", hex: "#f59e0b" },
    { id: "completed", label: "Completed", color: "var(--emerald-500)", hex: "#10b981" },
    { id: "cancelled", label: "Cancelled", color: "var(--red-500)", hex: "#ef4444" },
  ]

  const priorityOptions = [
    { id: "urgent", label: "Urgent" },
    { id: "high", label: "High" },
    { id: "medium", label: "Medium" },
    { id: "low", label: "Low" },
  ]

  const memberOptions = [
    { id: "no-member", label: "Unassigned", hint: "0 projects" },
    { id: "andri", label: "Andri Setyawan", hint: "Lead" },
    { id: "ivan", label: "Ivan Engineer", hint: "Staff" },
    { id: "shafa", label: "Shafa QA", hint: "Staff" },
  ]

  const tagOptions = [
    { id: "engineering", label: "Engineering" },
    { id: "procurement", label: "Procurement" },
    { id: "construction", label: "Construction" },
    { id: "research", label: "Research" },
    { id: "maintenance", label: "Maintenance" },
  ]

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return categories
    return categories.filter((c) => c.label.toLowerCase().includes(q))
  }, [categories, query])

  const toggleSet = (set: Set<string>, v: string) => {
    const n = new Set(set)
    if (n.has(v)) n.delete(v)
    else n.add(v)
    return n
  }

  const handleApply = () => {
    const chips: FilterChip[] = []
    temp.status.forEach((v) => chips.push({ key: "Status", value: capitalize(v) }))
    temp.priority.forEach((v) => chips.push({ key: "Priority", value: capitalize(v) }))
    temp.members.forEach((v) => chips.push({ key: "Member", value: v }))
    temp.tags.forEach((v) => chips.push({ key: "Tag", value: v }))
    onApply(chips)
    setOpen(false)
  }

  const handleClear = () => {
    setTemp({
      status: new Set<string>(),
      priority: new Set<string>(),
      tags: new Set<string>(),
      members: new Set<string>(),
    })
    onClear()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-2 rounded-lg border-border/60 px-3 bg-transparent">
          <Funnel className="h-4 w-4" />
          Filter
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[600px] p-0 rounded-xl shadow-lg border-border">
        <div className="grid grid-cols-[220px_minmax(0,1fr)] min-h-[300px]">
          <div className="p-3 border-r border-border/40 bg-muted/10">
            <div className="px-1 pb-2">
              <Input placeholder="Search filters..." value={query} onChange={(e) => setQuery(e.target.value)} className="h-8 bg-background" />
            </div>
            <div className="space-y-1">
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                    active === cat.id ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                  onClick={() => setActive(cat.id)}
                >
                  <cat.icon className={cn("h-4 w-4", active === cat.id ? "text-primary" : "text-muted-foreground")} />
                  <span className="flex-1 text-left">{cat.label}</span>
                  {counts && counts[cat.id as keyof FilterCounts] && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-background border border-border/50 text-muted-foreground">
                      {Object.values(counts[cat.id as keyof FilterCounts] as Record<string, number>).reduce(
                        (a, b) => a + (typeof b === "number" ? b : 0), 0
                      )}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-background">
            {active === "priority" && (
              <div className="grid grid-cols-1 gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Select Priority</span>
                {priorityOptions.map((opt) => (
                  <label key={opt.id} className="flex items-center gap-3 rounded-lg border border-border/50 p-2.5 hover:bg-muted/50 cursor-pointer transition-colors">
                    <Checkbox
                      checked={temp.priority.has(opt.id)}
                      onCheckedChange={() => setTemp((t) => ({ ...t, priority: toggleSet(t.priority, opt.id) }))}
                    />
                    <span className="text-sm flex-1 font-medium">{opt.label}</span>
                  </label>
                ))}
              </div>
            )}

            {active === "status" && (
              <div className="grid grid-cols-1 gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Select Status</span>
                {statusOptions.map((opt) => (
                  <label key={opt.id} className="flex items-center gap-3 rounded-lg border border-border/50 p-2.5 hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="h-3 w-3 rounded-sm shadow-sm" style={{ backgroundColor: opt.hex }} />
                    <Checkbox
                      checked={temp.status.has(opt.id)}
                      onCheckedChange={() => setTemp((t) => ({ ...t, status: toggleSet(t.status, opt.id) }))}
                    />
                    <span className="text-sm flex-1 font-medium">{opt.label}</span>
                  </label>
                ))}
              </div>
            )}

            {active === "members" && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Select Assignee</span>
                {memberOptions.map((m) => (
                  <label key={m.id} className="flex items-center gap-3 rounded-lg border border-border/50 p-2.5 hover:bg-muted/50 cursor-pointer transition-colors">
                    <Checkbox
                      checked={temp.members.has(m.label)}
                      onCheckedChange={() => setTemp((t) => ({ ...t, members: toggleSet(t.members, m.label) }))}
                    />
                    <span className="text-sm flex-1 font-medium">{m.label}</span>
                  </label>
                ))}
              </div>
            )}

            {active === "tags" && (
              <div>
                <div className="pb-3">
                  <Input placeholder="Search tags..." value={tagSearch} onChange={(e) => setTagSearch(e.target.value)} className="h-8" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {tagOptions
                    .filter((t) => t.label.toLowerCase().includes(tagSearch.toLowerCase()))
                    .map((t) => (
                      <label key={t.id} className="flex items-center gap-2 rounded-lg border border-border/50 p-2 hover:bg-muted/50 cursor-pointer transition-colors">
                        <Checkbox
                          checked={temp.tags.has(t.id)}
                          onCheckedChange={() => setTemp((s) => ({ ...s, tags: toggleSet(s.tags, t.id) }))}
                        />
                        <span className="text-xs font-medium flex-1">{t.label}</span>
                      </label>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border/40 p-3 bg-muted/10">
          <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground hover:text-foreground">
            Clear
          </Button>
          <Button size="sm" className="h-8 rounded-lg px-4" onClick={handleApply}>
            Apply Filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s
}