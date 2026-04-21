"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { format, isBefore, startOfDay } from "date-fns"
import {
  CalendarBlank, ChartBar, CheckCircle, WarningOctagon, Target, Users, Warning, Info, 
  TrendUp, TrendDown, Minus, WarningCircle, ClockAfternoon, Checks, ProjectorScreenChart, Spinner
} from "@phosphor-icons/react/dist/ssr"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

// IMPORT DATABASE PIPELINE (Gantikan data dummy)
import { getAllProjects, getProjectById } from "@/lib/data/project-actions"

// Definisi ulang tipe Note yang sebelumnya ada di file dummy
export type ProjectNote = {
  id: string
  title: string
  noteType: "general" | "meeting" | "blocker"
  status?: "open" | "processing" | "resolved"
  addedDate: string
}

const REFERENCE_TODAY = new Date()
const MS_DAY = 1000 * 60 * 60 * 24

const RANGE_OPTIONS = [
  { id: "7d", label: "7 Hari Terakhir", days: 7 },
  { id: "30d", label: "30 Hari Terakhir", days: 30 },
  { id: "90d", label: "3 Bulan Terakhir", days: 90 },
  { id: "custom", label: "Kustom" },
] as const

type RangeId = (typeof RANGE_OPTIONS)[number]["id"]

function diffInDays(from: Date, to: Date) { return Math.round((to.getTime() - from.getTime()) / MS_DAY) }
function addDays(date: Date, days: number) { const next = new Date(date); next.setDate(next.getDate() + days); return next }
function toISODate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// ============================================================================
// KOMPONEN SCORECARD KUSTOM 
// ============================================================================
type TrendData = { value: string; label: string; direction: "up" | "down" | "neutral"; isFavorable: boolean }

type MetricCardProps = {
  title: string; value: string; description: string; icon: ReactNode; tooltip: string;
  tone?: "positive" | "warning" | "danger" | "neutral" | "info"; trend?: TrendData
}

function MetricCard({ title, value, description, icon, tooltip, tone = "neutral", trend }: MetricCardProps) {
  const toneClass =
    tone === "positive" ? "text-emerald-600 bg-emerald-500/10" :
    tone === "warning" ? "text-amber-600 bg-amber-500/10" :
    tone === "danger" ? "text-rose-600 bg-rose-500/10" :
    tone === "info" ? "text-blue-600 bg-blue-500/10" : "text-muted-foreground bg-muted/50"

  return (
    <Card className="border-border/60 bg-card/70 shadow-sm hover:border-border transition-all duration-200 flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 gap-3">
        <div className="flex-1">
          <CardTitle className="text-[11px] xl:text-[12px] font-bold text-muted-foreground uppercase tracking-wider leading-snug">
            {title}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="inline-block align-super ml-0.5 text-muted-foreground/40 hover:text-muted-foreground/80 transition-colors focus:outline-none">
                    <Info className="h-[10px] w-[10px]" weight="bold" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px] text-xs font-normal normal-case tracking-normal">{tooltip}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </div>
        <div className={cn("h-8 w-8 shrink-0 rounded-lg flex items-center justify-center", toneClass)}>{icon}</div>
      </CardHeader>
      <CardContent className="space-y-1 flex-1 flex flex-col justify-end">
        <div className="text-3xl font-bold text-foreground tracking-tight">{value}</div>
        <p className="text-[11px] xl:text-xs text-muted-foreground font-medium line-clamp-1">{description}</p>
        
        {trend && (
          <div className="mt-3 flex items-center gap-1.5 pt-3 border-t border-border/40">
            <div className={cn(
              "flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider",
              trend.direction === "neutral" ? "bg-muted text-muted-foreground" :
              trend.isFavorable ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-rose-500/15 text-rose-700 dark:text-rose-400"
            )}>
              {trend.direction === "up" ? <TrendUp weight="bold" className="h-3 w-3" /> : 
               trend.direction === "down" ? <TrendDown weight="bold" className="h-3 w-3" /> : 
               <Minus weight="bold" className="h-3 w-3" />}
              {trend.value}
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// KOMPONEN UTAMA DASHBOARD
// ============================================================================
export function PerformanceContent() {
  const [isMounted, setIsMounted] = useState(false)
  const [rangeId, setRangeId] = useState<RangeId>("30d")
  const [selectedProjectId, setSelectedProjectId] = useState("all")
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" })
  
  // STATE UNTUK DATA DARI SUPABASE
  const [baseProjects, setBaseProjects] = useState<any[]>([])
  const [allRichProjects, setAllRichProjects] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsMounted(true)
    
    // MENYEDOT DATA DARI SUPABASE
    const loadDatabase = async () => {
      try {
        setIsLoading(true)
        // 1. Ambil list semua proyek (untuk dropdown)
        const projectsList = await getAllProjects()
        setBaseProjects(projectsList)

        // 2. Ambil detail untuk masing-masing proyek (untuk kalkulasi chart)
        const detailedProjects = await Promise.all(projectsList.map(p => getProjectById(p.id)))
        
        // 3. Format data Supabase agar cocok dengan grafik/metrik bawaan Bapak
        const formattedProjects = detailedProjects.filter(Boolean).map((dbP: any) => {
          const workstreamMap: Record<string, any[]> = {};
          const rawTasks = dbP.tasks || [];

          rawTasks.forEach((t: any) => {
            if (!workstreamMap[t.phase]) workstreamMap[t.phase] = [];
            const picName = t.assignee_id === 'u1' ? 'Ivan Engineer' : t.assignee_id === 'u2' ? 'Shafa QA' : t.assignee_id === 'u3' ? 'Andri Setyawan' : (t.assignee_id || 'Assigned');
            
            workstreamMap[t.phase].push({
              status: t.status === 'done' ? 'done' : 'in-progress',
              endDate: t.end_date,
              assignee: { name: picName, avatarUrl: "" }
            });
          });

          const mappedWorkstreams = Object.keys(workstreamMap).map(phase => ({
            name: phase, tasks: workstreamMap[phase]
          }));

          return {
            id: dbP.id,
            name: dbP.name,
            time: { progressPercent: dbP.progress_percent || 0 },
            targets: { targetProduksi: dbP.target_produksi || "-" },
            notes: [], // Kosong sementara, karena tabel Notes belum kita buat
            workstreams: mappedWorkstreams
          };
        });

        setAllRichProjects(formattedProjects)
      } catch (error) {
        console.error("Gagal memuat data dari Supabase", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDatabase()
  }, [])

  useEffect(() => {
    if (rangeId === "custom") return
    const range = RANGE_OPTIONS.find((option) => option.id === rangeId)
    const days = range && "days" in range ? range.days : 30
    const rangeStart = addDays(REFERENCE_TODAY, -(days - 1))
    setDateRange({ start: toISODate(rangeStart), end: toISODate(REFERENCE_TODAY) })
  }, [rangeId])

  const { executiveKpis, operationalKpis, trendSeries, resourceWorkload, criticalIssues, rangeLabelText } = useMemo(() => {
    const fallbackStart = addDays(REFERENCE_TODAY, -29)
    const parsedStart = dateRange.start ? new Date(`${dateRange.start}T00:00:00`) : fallbackStart
    const parsedEnd = dateRange.end ? new Date(`${dateRange.end}T23:59:59`) : REFERENCE_TODAY
    const rangeStart = parsedStart.getTime() <= parsedEnd.getTime() ? parsedStart : parsedEnd
    const rangeEnd = parsedStart.getTime() <= parsedEnd.getTime() ? parsedEnd : parsedStart
    const rangeLabelText = `${format(rangeStart, "dd MMM")} - ${format(rangeEnd, "dd MMM yyyy")}`

    const scopedProjects = allRichProjects.filter(p => selectedProjectId === "all" || p.id === selectedProjectId)
    
    // --- KALKULASI DATA ---
    let totalProgress = 0
    let onTrackCount = 0
    let atRiskCount = 0
    let overdueTasksCount = 0
    let completedTasksCount = 0
    let totalTargetProduksi = scopedProjects[0]?.targets?.targetProduksi || "N/A"
    
    const allNotes: (ProjectNote & { projectName: string })[] = []
    const resourceMap = new Map<string, { count: number, avatar?: string }>()
    const todayStart = startOfDay(REFERENCE_TODAY)

    scopedProjects.forEach(p => {
        totalProgress += p.time.progressPercent
        if (p.time.progressPercent >= 30) { onTrackCount++ } else { atRiskCount++ }
        p.notes.forEach((n: any) => { allNotes.push({ ...n, projectName: p.name }) })

        p.workstreams.forEach((ws: any) => {
            ws.tasks.forEach((t: any) => {
                if (t.status === "done") { completedTasksCount++ } 
                else if (t.endDate && isBefore(startOfDay(new Date(t.endDate)), todayStart)) { overdueTasksCount++ }
                if (t.status !== "done" && t.assignee) {
                    const existing = resourceMap.get(t.assignee.name) || { count: 0, avatar: t.assignee.avatarUrl }
                    resourceMap.set(t.assignee.name, { count: existing.count + 1, avatar: t.assignee.avatarUrl })
                }
            })
        })
    })

    const avgProgress = scopedProjects.length ? Math.round(totalProgress / scopedProjects.length) : 0
    const openIssues = allNotes.filter(n => n.status === "processing" || n.noteType === "general")

    const executiveKpis = [
      { title: "Project Status Overview", value: `${onTrackCount}/${scopedProjects.length}`, description: "Projects running on schedule", tooltip: "Jumlah proyek yang realisasi fisiknya menyamai atau melebihi jadwal rencana.", icon: <ProjectorScreenChart className="h-5 w-5" weight="fill" />, tone: onTrackCount >= scopedProjects.length * 0.7 ? "positive" : "warning", trend: { value: "+1", label: "vs last month", direction: "up", isFavorable: true } },
      { title: "Average Progress", value: `${avgProgress}%`, description: "Overall physical progress", tooltip: "Persentase rata-rata progress dari seluruh proyek.", icon: <ChartBar className="h-5 w-5" weight="fill" />, tone: "info", trend: { value: "+4.2%", label: "vs last month", direction: "up", isFavorable: true } },
      { title: "Active Risks & Issues", value: String(openIssues.length), description: "Unresolved bottlenecks", tooltip: "Jumlah log kendala lapangan.", icon: <WarningOctagon className="h-5 w-5" weight="fill" />, tone: openIssues.length > 5 ? "danger" : openIssues.length > 0 ? "warning" : "positive", trend: { value: "-2", label: "resolved this week", direction: "down", isFavorable: true } },
      { title: "Output Capacity", value: totalTargetProduksi, description: "Estimated target delivery", tooltip: "Target komitmen kapasitas produksi.", icon: <Target className="h-5 w-5" weight="fill" />, tone: "neutral", trend: { value: "0%", label: "capacity stable", direction: "neutral", isFavorable: true } },
    ] as const

    const operationalKpis = [
        { title: "Projects at Risk", value: String(atRiskCount), description: "Requires immediate mitigation", tooltip: "Proyek yang mengalami keterlambatan signifikan.", icon: <WarningCircle className="h-5 w-5" weight="fill" />, tone: atRiskCount > 0 ? "danger" : "positive", trend: { value: "+1", label: "new risk detected", direction: "up", isFavorable: false } },
        { title: "On-Time Delivery Rate", value: "92%", description: "Tasks finished on schedule", tooltip: "Rasio pekerjaan yang diselesaikan tepat waktu.", icon: <CheckCircle className="h-5 w-5" weight="fill" />, tone: "positive", trend: { value: "+5%", label: "vs last month", direction: "up", isFavorable: true } },
        { title: "Overdue Tasks", value: String(overdueTasksCount), description: "Past deadline deliverables", tooltip: "Pekerjaan yang melewati batas waktu.", icon: <ClockAfternoon className="h-5 w-5" weight="fill" />, tone: overdueTasksCount > 5 ? "warning" : "neutral", trend: { value: "-3", label: "tasks cleared", direction: "down", isFavorable: true } },
        { title: "Completed Deliverables", value: String(completedTasksCount), description: "Total tasks finished", tooltip: "Total volume pekerjaan yang Selesai (Done).", icon: <Checks className="h-5 w-5" weight="bold" />, tone: "info", trend: { value: "+14", label: "vs last month", direction: "up", isFavorable: true } },
    ] as const

    const totalDays = Math.max(1, diffInDays(rangeStart, rangeEnd) + 1)
    const bucketCount = Math.min(6, totalDays)
    const baseBucketSize = Math.floor(totalDays / bucketCount)
    let bucketOffset = 0
    
    const trendBuckets = Array.from({ length: bucketCount }, (_, index) => {
      const size = baseBucketSize
      const start = addDays(rangeStart, bucketOffset)
      const end = addDays(rangeStart, bucketOffset + size - 1)
      bucketOffset += size
      const mockCount = Math.floor(Math.random() * 5) + (index * 2) 
      return { start, end, count: mockCount }
    })

    const maxTrend = Math.max(...trendBuckets.map((b) => b.count), 1)
    const trendSeries = trendBuckets.map((bucket) => ({
      label: `${format(bucket.start, "d MMM")} - ${format(bucket.end, "d MMM")}`,
      count: bucket.count, height: Math.round((bucket.count / maxTrend) * 100),
    }))

    const resourceWorkload = Array.from(resourceMap.entries())
        .map(([name, data]) => ({ name, count: data.count, avatar: data.avatar }))
        .sort((a, b) => b.count - a.count).slice(0, 5)

    const criticalIssues = openIssues.slice(0, 5)

    return { executiveKpis, operationalKpis, trendSeries, resourceWorkload, criticalIssues, rangeLabelText }
  }, [dateRange.end, dateRange.start, rangeId, selectedProjectId, allRichProjects])

  const maxWorkload = Math.max(...resourceWorkload.map(r => r.count), 1)

  if (!isMounted) return null;

  return (
    <div className="flex flex-1 flex-col bg-muted/10 mx-2 my-2 border border-border rounded-xl min-w-0 shadow-sm overflow-hidden">
      <header className="flex flex-col border-b border-border/60 bg-background">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground" />
            <div className="flex items-center gap-2">
                <ChartBar className="h-5 w-5 text-primary" weight="bold" />
                <h1 className="text-lg font-bold text-foreground tracking-tight">Project Monitoring Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 shadow-sm">Export Laporan</Button>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
             <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={isLoading}>
              <SelectTrigger className="h-8 w-[240px] rounded-lg border-border/60 bg-muted/30 px-3 font-medium">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {baseProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Select value={rangeId} onValueChange={(value) => setRangeId(value as RangeId)}>
              <SelectTrigger className="h-8 w-[170px] rounded-lg border-border/60 bg-muted/30 px-3 font-medium">
                <SelectValue placeholder="Pilih Waktu" />
              </SelectTrigger>
              <SelectContent>
                {RANGE_OPTIONS.map((range) => (
                  <SelectItem key={range.id} value={range.id}>{range.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* KONTEN DASHBOARD */}
      <div className="p-5 space-y-8 overflow-y-auto relative">
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
               <Spinner className="h-8 w-8 animate-spin text-primary" />
               <p className="text-sm font-medium text-muted-foreground">Menghitung Data Portofolio...</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wider">
                <CalendarBlank className="h-4 w-4" />
                <span>Menampilkan Data: {rangeLabelText}</span>
            </div>
        </div>

        {/* TIER 1: EXECUTIVE */}
        <section className="space-y-3">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-primary" /> Executive Summary</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {executiveKpis.map((kpi) => <MetricCard key={kpi.title} {...kpi} />)}
            </div>
        </section>

        {/* TIER 2: OPERATIONAL */}
        <section className="space-y-3">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" /> Operational Metrics</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {operationalKpis.map((kpi) => <MetricCard key={kpi.title} {...kpi} />)}
            </div>
        </section>

        {/* TIER 3: INSIGHTS */}
        <section className="space-y-3">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Insights & Analytics</h2>
            <div className="grid gap-4 lg:grid-cols-3">
                
                {/* Milestone Trend */}
                <Card className="border-border/60 bg-background shadow-sm lg:col-span-1 flex flex-col">
                    <CardHeader className="flex-row items-center justify-between pb-6 border-b border-border/40">
                        <div>
                            <CardTitle className="text-base font-bold text-foreground">Milestone Trend</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">Deliverables completed</p>
                        </div>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">S-Curve Eq.</Badge>
                    </CardHeader>
                    <CardContent className="pt-8 pb-4 flex-1 flex flex-col justify-end">
                        <div className="flex flex-col h-[180px]">
                            <div className="grid gap-2 items-end flex-1" style={{ gridTemplateColumns: `repeat(${trendSeries.length}, minmax(0, 1fr))` }}>
                                {trendSeries.map((item) => (
                                <TooltipProvider key={item.label}>
                                    <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex h-full w-full flex-col items-center justify-end p-0.5 group">
                                        <div className="w-full max-w-[32px] rounded-t-md bg-primary/20 group-hover:bg-primary/40 transition-all relative flex flex-col justify-end" style={{ height: `${Math.max(10, item.height)}%` }}>
                                            <div className="h-full w-full rounded-t-md bg-primary shadow-[inset_0_-2px_10px_rgba(0,0,0,0.1)]" />
                                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">{item.count}</span>
                                        </div>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">{item.count} Selesai</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                ))}
                            </div>
                            <div className="grid gap-2 mt-3 border-t border-border/50 pt-2" style={{ gridTemplateColumns: `repeat(${trendSeries.length}, minmax(0, 1fr))` }}>
                                {trendSeries.map((item) => (
                                <div key={item.label} className="text-[9px] font-medium text-muted-foreground text-center leading-tight truncate">{item.label.split(' - ')[0]}</div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Team Utilization */}
                <Card className="border-border/60 bg-background shadow-sm lg:col-span-1">
                    <CardHeader className="pb-4 border-b border-border/40">
                        <div className="flex items-center gap-2 text-amber-600">
                            <Users className="h-5 w-5" weight="fill" />
                            <CardTitle className="text-base font-bold text-foreground">Team Utilization</CardTitle>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Top 5 by active workload</p>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-5">
                    {resourceWorkload.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-4">Semua tugas selesai.</div>
                    ) : (
                        resourceWorkload.map((res) => (
                        <div key={res.name} className="flex items-center gap-4">
                            <div className="flex items-center gap-2 w-[110px] shrink-0">
                                <Avatar className="h-6 w-6 border border-border">
                                    {res.avatar && <AvatarImage src={res.avatar} />}
                                    <AvatarFallback className="text-[10px] font-bold">{res.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-semibold text-foreground truncate" title={res.name}>{res.name}</span>
                            </div>
                            <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden border border-border/50">
                                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(res.count / maxWorkload) * 100}%` }} />
                            </div>
                            <div className="w-6 text-right text-xs font-bold text-muted-foreground">{res.count}</div>
                        </div>
                        ))
                    )}
                    </CardContent>
                </Card>

                {/* Critical Issues Logs */}
                <Card className="border-border/60 bg-background shadow-sm lg:col-span-1">
                    <CardHeader className="pb-4 border-b border-border/40">
                        <div className="flex items-center gap-2 text-rose-600">
                            <Warning className="h-5 w-5" weight="fill" />
                            <CardTitle className="text-base font-bold text-foreground">Top Critical Issues</CardTitle>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Active bottlenecks</p>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/20">
                            <TableRow>
                                <TableHead className="font-semibold text-[11px]">Deskripsi</TableHead>
                                <TableHead className="font-semibold text-[11px]">Proyek</TableHead>
                                <TableHead className="font-semibold text-[11px] text-right">Status</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {criticalIssues.length === 0 ? (
                                <TableRow>
                                <TableCell colSpan={3} className="text-center text-sm text-muted-foreground h-24">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                    <CheckCircle className="h-6 w-6 text-emerald-500" />
                                    <span>Tidak ada issue.</span>
                                    </div>
                                </TableCell>
                                </TableRow>
                            ) : (
                                criticalIssues.map((issue, index) => (
                                <TableRow key={`${issue.id}-${index}`} className="hover:bg-muted/30">
                                    <TableCell>
                                    <div className="flex flex-col max-w-[140px]">
                                        <span className="font-semibold text-xs text-foreground truncate" title={issue.title}>{issue.title}</span>
                                        <span className="text-[10px] text-muted-foreground truncate">{format(new Date(issue.addedDate), "dd MMM")}</span>
                                    </div>
                                    </TableCell>
                                    <TableCell className="text-[11px] text-muted-foreground font-medium max-w-[100px] truncate" title={issue.projectName}>
                                        {issue.projectName}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 text-[9px] uppercase px-1 py-0 h-4">Unresolved</Badge>
                                    </TableCell>
                                </TableRow>
                                ))
                            )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </section>
      </div>
    </div>
  )
}