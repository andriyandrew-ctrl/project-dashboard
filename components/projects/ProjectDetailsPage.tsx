"use client"

import { useCallback, useState } from "react"
import { LinkSimple, SquareHalf } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { AnimatePresence, motion } from "motion/react"
import { differenceInDays } from "date-fns"

import { Breadcrumbs } from "@/components/projects/Breadcrumbs"
import { ProjectHeader } from "@/components/projects/ProjectHeader"
import { TimelineGantt } from "@/components/projects/TimelineGantt"
import { RightMetaPanel } from "@/components/projects/RightMetaPanel"
import { WorkstreamTab } from "@/components/projects/WorkstreamTab"
import { ProjectTasksTab } from "@/components/projects/ProjectTasksTab"
import { NotesTab } from "@/components/projects/NotesTab"
import { AssetsFilesTab } from "@/components/projects/AssetsFilesTab"
import { ProjectWizard } from "@/components/project-wizard/ProjectWizard"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge" 
import { Target, ChartLineUp, Package, Info, CheckCircle, Factory, Coins, XCircle, CalendarBlank, PencilSimpleLine, X, Spinner } from "@phosphor-icons/react/dist/ssr"

import { updateProjectScope } from "@/lib/data/project-actions"

export function ProjectDetailsPage({ projectId, dbData }: { projectId: string, dbData?: any }) {
  const [showMeta, setShowMeta] = useState(true)
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [isScopeModalOpen, setIsScopeModalOpen] = useState(false)
  const [inScopeText, setInScopeText] = useState("")
  const [outOfScopeText, setOutOfScopeText] = useState("")
  const [isSavingScope, setIsSavingScope] = useState(false)

  const formatTanggal = (dateString?: string) => {
    if (!dateString) return "Belum diatur";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return "Format invalid";
    }
  };

  const calculateTime = () => {
    const startDate = dbData?.start_date ? new Date(dbData.start_date) : new Date();
    const endDate = dbData?.end_date ? new Date(dbData.end_date) : new Date(startDate.getTime() + 60 * 24 * 60 * 60 * 1000);
    const totalDays = differenceInDays(endDate, startDate) || 0;
    const daysLeft = differenceInDays(endDate, new Date()) || 0;
    const timeProgress = totalDays > 0 ? Math.max(0, Math.min(100, ((totalDays - daysLeft) / totalDays) * 100)) : 0;
    return {
      estimateLabel: `${totalDays > 0 ? Math.ceil(totalDays / 30) : 2} Bulan`,
      dueDate: endDate, 
      daysRemainingLabel: daysLeft > 0 ? `${daysLeft} Hari lagi` : "Selesai / Terlambat",
      progressPercent: Math.round(timeProgress)
    };
  };

  const rawTasks = dbData?.tasks || [];
  const timelineTasks = rawTasks.map((t: any) => ({
    id: t.id, name: t.name,
    startDate: t.start_date ? new Date(t.start_date) : new Date(),
    endDate: t.end_date ? new Date(t.end_date) : new Date(Date.now() + 86400000),
    status: t.status === 'done' ? 'done' : (t.status === 'in-progress' ? 'in-progress' : 'planned')
  }));

  const workstreamMap: Record<string, any[]> = {};
  rawTasks.forEach((t: any) => {
    if (!workstreamMap[t.phase]) workstreamMap[t.phase] = [];
    const picName = t.assignee_id === 'u1' ? 'Ivan Engineer' : t.assignee_id === 'u2' ? 'Shafa QA' : t.assignee_id === 'u3' ? 'Andri Setyawan' : t.assignee_id;
    workstreamMap[t.phase].push({
      id: t.id, name: t.name, status: t.status, priority: t.priority,
      dueLabel: t.end_date ? formatTanggal(t.end_date) : "-", dueTone: "neutral",
      assignee: t.assignee_id ? { id: t.assignee_id, name: picName || "Assigned" } : undefined
    });
  });

  const mappedWorkstreams = Object.keys(workstreamMap).map((phase, index) => ({
    id: `ws-${index}`, name: phase, tasks: workstreamMap[phase]
  }));

  const rawScopes = dbData?.project_scopes?.[0] || {};
  const rawFiles = dbData?.project_files || [];
  const mappedFiles = rawFiles.map((f: any) => ({
    id: f.id,
    name: f.file_name,
    type: f.file_type,
    size: `${f.file_size_mb} MB`,
    url: f.file_url,
    path: f.storage_path,
    addedBy: f.added_by,
    date: new Date(f.created_at).toLocaleDateString('id-ID')
  }));

  const project = {
    id: dbData?.project_code || projectId,
    dbId: dbData?.id || projectId,
    name: dbData?.name || "Untitled Project",
    description: dbData?.description || "Deskripsi belum ditambahkan.",
    status: dbData?.status || "todo",
    priority: dbData?.priority || "medium",
    meta: {
      priorityLabel: dbData?.priority ? dbData.priority.charAt(0).toUpperCase() + dbData.priority.slice(1) : "Medium",
      locationLabel: dbData?.location || "Lokasi belum diatur",
      sprintLabel: "Fase Eksekusi",
      lastSyncLabel: "Just now",
    },
    backlog: {
      totalTasks: rawTasks.length,
      completedTasks: rawTasks.filter((t:any) => t.status === 'done').length,
      picUsers: [{ id: dbData?.pic_name ? dbData.pic_name.toLowerCase().replace(/\s+/g, "-") : "unassigned", name: dbData?.pic_name || "Belum ditugaskan" }],
      supportUsers: []
    },
    time: calculateTime(),
    source: { client: dbData?.client || "" },
    targets: {
      intentLabel: dbData?.intent || "Eksekusi Proyek",
      targetProduksi: dbData?.target_produksi || "-",
      targetRevenue: dbData?.target_revenue || "-",
      kpiDescription: dbData?.description || "Target spesifik belum ditentukan."
    },
    scope: {
      inScope: rawScopes.in_scope?.length > 0 ? rawScopes.in_scope : ["Gunakan tombol Edit Scope untuk mengisi data"],
      outOfScope: rawScopes.out_of_scope?.length > 0 ? rawScopes.out_of_scope : ["Gunakan tombol Edit Scope untuk mengisi data"]
    },
    timelineTasks: timelineTasks, 
    workstreams: mappedWorkstreams, 
    notes: [],
    files: mappedFiles
  }

  const breadcrumbs = [{ label: "Projects", href: "/" }, { label: project.name }]

  const copyLink = useCallback(async () => {
    try { await navigator.clipboard.writeText(window.location.href); toast.success("Link copied"); } catch { toast.error("Failed to copy link"); }
  }, [])

  const openScopeModal = () => {
    setInScopeText(project.scope.inScope.join('\n'));
    setOutOfScopeText(project.scope.outOfScope.join('\n'));
    setIsScopeModalOpen(true);
  }

  const handleSaveScope = async () => {
    setIsSavingScope(true);
    try {
      const inScopeArray = inScopeText.split('\n').map(s => s.trim()).filter(s => s !== "");
      const outOfScopeArray = outOfScopeText.split('\n').map(s => s.trim()).filter(s => s !== "");
      await updateProjectScope(project.dbId, inScopeArray, outOfScopeArray);
      toast.success("Scope of Work berhasil diperbarui!");
      setIsScopeModalOpen(false);
      window.location.reload(); 
    } catch (error) { toast.error("Gagal menyimpan Scope of Work. Cek koneksi Anda."); } finally { setIsSavingScope(false); }
  }

  return (
    <div className="flex flex-1 flex-col min-w-0 m-2 border border-border rounded-lg bg-background shadow-sm">
      <div className="flex items-center justify-between gap-4 px-4 py-4 border-b border-border/50 bg-muted/20 rounded-t-lg">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent text-muted-foreground" />
          <div className="hidden sm:block"><Breadcrumbs items={breadcrumbs} /></div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" onClick={copyLink}><LinkSimple className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon-sm" className={showMeta ? "bg-muted shadow-inner" : ""} onClick={() => setShowMeta((v) => !v)}><SquareHalf className="h-4 w-4" weight="duotone" /></Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-2 my-0 rounded-b-lg min-w-0 overflow-y-auto">
        <div className="px-4">
          <div className="mx-auto w-full max-w-7xl">
            <div className={`mt-0 grid grid-cols-1 gap-10 ${showMeta ? "lg:grid-cols-[minmax(0,2fr)_minmax(0,320px)]" : "lg:grid-cols-[minmax(0,1fr)_minmax(0,0px)]"}`}>
              <div className="space-y-6 pt-6 pb-12">
                <ProjectHeader project={project as any} onEditProject={() => setIsWizardOpen(true)} />

                <Tabs defaultValue="overview" className="mt-8">
                  <TabsList className="w-full gap-6 justify-start border-b border-border/60 rounded-none bg-transparent h-12 p-0 overflow-x-auto">
                    <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 data-[state=active]:shadow-none font-medium">Overview</TabsTrigger>
                    <TabsTrigger value="workstream" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 data-[state=active]:shadow-none font-medium">Workstream</TabsTrigger>
                    <TabsTrigger value="tasks" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 data-[state=active]:shadow-none font-medium">Tasks</TabsTrigger>
                    <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 data-[state=active]:shadow-none font-medium">Notes</TabsTrigger>
                    <TabsTrigger value="assets" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 data-[state=active]:shadow-none font-medium">Assets & Files</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="pt-4 outline-none">
                    <div className="space-y-7">
                      <section>
                        <div className="flex items-center gap-2 mb-3 text-primary"><Target className="h-5 w-5" weight="fill" /><h3 className="text-lg font-semibold text-foreground tracking-tight">Tujuan Proyek</h3></div>
                        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                          <div className="flex items-center gap-2 mb-3"><Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 px-3 py-1 text-xs">{project.targets.intentLabel}</Badge></div>
                          <p className="text-[15px] leading-relaxed text-muted-foreground whitespace-pre-wrap">{project.description}</p>
                        </div>
                      </section>

                      <section>
                        <div className="flex items-center gap-2 mb-3 text-primary"><ChartLineUp className="h-5 w-5" weight="fill" /><h3 className="text-lg font-semibold text-foreground tracking-tight">Target & Indikator</h3></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="group rounded-2xl border border-border/60 bg-card p-5 flex flex-col justify-center relative overflow-hidden shadow-sm hover:border-primary/30 transition-colors"><div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300"><Factory className="h-32 w-32" weight="fill" /></div><span className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold mb-1.5 uppercase tracking-wider relative z-10"><Factory className="h-4 w-4" /> Target Produksi</span><span className="text-2xl font-bold text-foreground relative z-10 tracking-tight">{project.targets.targetProduksi}</span></div>
                          <div className="group rounded-2xl border border-border/60 bg-card p-5 flex flex-col justify-center relative overflow-hidden shadow-sm hover:border-primary/30 transition-colors"><div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300"><Coins className="h-32 w-32" weight="fill" /></div><span className="flex items-center gap-1.5 text-xs text-muted-foreground font-bold mb-1.5 uppercase tracking-wider relative z-10"><Coins className="h-4 w-4" /> Target Revenue</span><span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 relative z-10 tracking-tight">{project.targets.targetRevenue}</span></div>
                          <div className="rounded-2xl border border-border/60 bg-card p-5 md:col-span-2 shadow-sm hover:shadow-md transition-shadow duration-300"><span className="text-xs text-muted-foreground font-bold mb-2 uppercase tracking-wider block">Deskripsi KPI</span><p className="text-[15px] leading-relaxed text-foreground">{project.targets.kpiDescription}</p></div>
                        </div>
                      </section>

                      <section>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 text-primary"><Package className="h-5 w-5" weight="fill" /><h3 className="text-lg font-semibold text-foreground tracking-tight">Scope of Work</h3></div>
                          <Button variant="outline" size="sm" className="h-8 text-xs font-medium" onClick={openScopeModal}><PencilSimpleLine className="mr-2 h-3.5 w-3.5" /> Edit Scope</Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/10 p-5 border border-emerald-100 dark:border-emerald-900/30">
                            <div className="flex items-center gap-2 font-bold text-sm text-emerald-700 dark:text-emerald-400 border-b border-emerald-200/50 dark:border-emerald-800/30 pb-3 mb-3"><CheckCircle weight="fill" className="h-5 w-5" /> Termasuk Lingkup (In Scope)</div>
                            <ul className="space-y-3">{project.scope.inScope.map((item: string, i: number) => (<li key={i} className="flex items-start gap-3 text-[14px] text-muted-foreground group"><CheckCircle weight="bold" className="h-[18px] w-[18px] shrink-0 text-emerald-500 mt-[2px] opacity-70 group-hover:opacity-100 transition-opacity" /><span className="leading-snug">{item}</span></li>))}</ul>
                          </div>
                          <div className="space-y-4 rounded-2xl bg-orange-50/50 dark:bg-orange-950/10 p-5 border border-orange-100 dark:border-orange-900/30">
                            <div className="flex items-center gap-2 font-bold text-sm text-orange-700 dark:text-orange-400 border-b border-orange-200/50 dark:border-orange-800/30 pb-3 mb-3"><Info weight="fill" className="h-5 w-5" /> Di Luar Lingkup (Out of Scope)</div>
                            <ul className="space-y-3">{project.scope.outOfScope.map((item: string, i: number) => (<li key={i} className="flex items-start gap-3 text-[14px] text-muted-foreground group"><XCircle weight="bold" className="h-[18px] w-[18px] shrink-0 text-orange-500 mt-[2px] opacity-70 group-hover:opacity-100 transition-opacity" /><span className="leading-snug">{item}</span></li>))}</ul>
                          </div>
                        </div>
                      </section>

                      <section className="pt-2">
                        <div className="flex items-center gap-2 mb-4 text-primary"><CalendarBlank className="h-5 w-5" weight="fill" /><h3 className="text-lg font-semibold text-foreground tracking-tight">Expected Timeline</h3></div>
                        <TimelineGantt tasks={project.timelineTasks as any} />
                      </section>
                    </div>
                  </TabsContent>

                  <TabsContent value="workstream" className="pt-6 outline-none"><WorkstreamTab workstreams={project.workstreams as any} /></TabsContent>
                  <TabsContent value="tasks" className="pt-6 outline-none"><ProjectTasksTab project={project as any} /></TabsContent>
                  <TabsContent value="notes" className="pt-6 outline-none"><NotesTab notes={project.notes as any} /></TabsContent>

                  {/* TAB ASSETS & FILES DIUPDATE UNTUK MENERIMA PROJECT ID */}
                  <TabsContent value="assets" className="pt-6 outline-none">
                    <AssetsFilesTab projectId={project.dbId} files={project.files as any} />
                  </TabsContent>

                </Tabs>
              </div>

              <AnimatePresence initial={false}>
                {showMeta && (
                  <motion.div key="meta-panel" initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 80, opacity: 0 }} transition={{ type: "spring", stiffness: 260, damping: 26 }} className="lg:border-l lg:border-border lg:pl-6 pt-6 pb-12">
                    <RightMetaPanel project={project as any} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {isScopeModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-3xl bg-card rounded-xl shadow-xl border border-border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 bg-muted/20">
              <div className="flex items-center gap-2 text-primary"><Package className="h-5 w-5" weight="fill" /><h3 className="text-base font-bold text-foreground">Edit Scope of Work</h3></div>
              <button onClick={() => setIsScopeModalOpen(false)} disabled={isSavingScope} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" weight="bold" /></button>
            </div>
            <div className="p-6 space-y-4 bg-muted/5">
              <p className="text-sm text-muted-foreground bg-background p-3 rounded-lg border border-border/60">💡 <strong>Tips:</strong> Ketik setiap poin pekerjaan pada baris baru (tekan <strong>Enter</strong>).</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-3"><label className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider"><CheckCircle className="h-4 w-4" weight="fill" />Termasuk Lingkup (In Scope)</label><textarea value={inScopeText} onChange={(e) => setInScopeText(e.target.value)} disabled={isSavingScope} className="w-full h-64 p-3 text-[14px] leading-relaxed rounded-xl border border-emerald-200 bg-emerald-50/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none shadow-sm" /></div>
                <div className="space-y-3"><label className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-wider"><XCircle className="h-4 w-4" weight="fill" />Di Luar Lingkup (Out of Scope)</label><textarea value={outOfScopeText} onChange={(e) => setOutOfScopeText(e.target.value)} disabled={isSavingScope} className="w-full h-64 p-3 text-[14px] leading-relaxed rounded-xl border border-orange-200 bg-orange-50/30 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none shadow-sm" /></div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border/60 bg-muted/20 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsScopeModalOpen(false)} disabled={isSavingScope} className="bg-background">Batal</Button>
              <Button onClick={handleSaveScope} disabled={isSavingScope}>{isSavingScope ? <Spinner className="mr-2 h-4 w-4 animate-spin" /> : null}Simpan Perubahan</Button>
            </div>
          </div>
        </div>
      )}

      {isWizardOpen && <ProjectWizard onClose={() => setIsWizardOpen(false)} onCreate={() => { setIsWizardOpen(false); window.location.reload(); }} />}
    </div>
  )
}