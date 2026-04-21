import type { Project as ProjectListItem } from "@/lib/data/projects"
import { projects } from "@/lib/data/projects"
import { getAvatarUrl } from "@/lib/assets/avatars"

function addDays(base: Date, days: number): Date {
  const d = new Date(base)
  d.setDate(d.getDate() + days)
  return d
}

// 1. TIPE DATA DASAR
export type User = { id: string; name: string; avatarUrl?: string; role?: string }
export type ProjectMeta = { priorityLabel: string; locationLabel: string; sprintLabel: string; lastSyncLabel: string }
export type ProjectScope = { inScope: string[]; outOfScope: string[] }

// 2. TIPE DATA BARU UNTUK R&D & MANUFAKTUR
export type RndTargets = {
  intentLabel: string;
  successTypeLabel: string;
  targetProduksi: string;
  targetRevenue: string;
  kpiDescription: string;
  structureType: string;
}

// 3. TIPE DATA TASK & WORKSTREAM
export type TimelineTask = { id: string; name: string; startDate: Date; endDate: Date; status: "planned" | "in-progress" | "done" }
export type WorkstreamTaskStatus = "todo" | "in-progress" | "done"

// REVISI: Menambahkan "neutral" ke dalam dueTone
export type WorkstreamTask = { id: string; name: string; status: WorkstreamTaskStatus; dueLabel?: string; dueTone?: "danger" | "warning" | "muted" | "neutral"; assignee?: User; startDate?: Date; priority?: "no-priority" | "low" | "medium" | "high" | "urgent"; tag?: string; description?: string }
export type WorkstreamGroup = { id: string; name: string; tasks: WorkstreamTask[] }
export type ProjectTask = WorkstreamTask & { projectId: string; projectName: string; workstreamId: string; workstreamName: string }

export type TimeSummary = { estimateLabel: string; dueDate: Date; daysRemainingLabel: string; progressPercent: number }
export type BacklogSummary = { statusLabel: "Active" | "Backlog" | "Planned" | "Completed" | "Cancelled"; groupLabel: string; priorityLabel: string; labelBadge: string; picUsers: User[]; supportUsers?: User[] }

// REVISI: Memperluas kamus tipe file agar mendukung dwg, xlsx, dll.
export type QuickLink = { id: string; name: string; type: "pdf" | "zip" | "fig" | "doc" | "file" | "dwg" | "xlsx" | "csv" | "img"; sizeMB: number; url: string }
export type ProjectFile = QuickLink & { addedBy: User; addedDate: Date; description?: string; isLinkAsset?: boolean; attachments?: QuickLink[] }

export type NoteType = "general" | "meeting" | "audio"
export type NoteStatus = "completed" | "processing"
export type TranscriptSegment = { id: string; speaker: string; timestamp: string; text: string }
export type AudioNoteData = { duration: string; fileName: string; aiSummary: string; keyPoints: string[]; insights: string[]; transcript: TranscriptSegment[] }
export type ProjectNote = { id: string; title: string; content?: string; noteType: NoteType; status: NoteStatus; addedDate: Date; addedBy: User; audioData?: AudioNoteData }

// Legacy Types
export type KeyFeatures = { p0: string[]; p1: string[]; p2: string[] }

// TIPE DATA UTAMA PROJECT DETAILS
export type ProjectDetails = { 
  id: string; 
  name: string; 
  description: string; 
  meta: ProjectMeta; 
  scope: ProjectScope; 
  targets: RndTargets; 
  timelineTasks: TimelineTask[]; 
  workstreams: WorkstreamGroup[]; 
  time: TimeSummary; 
  backlog: BacklogSummary; 
  quickLinks: QuickLink[]; 
  files: ProjectFile[]; 
  notes: ProjectNote[]; 
  source?: ProjectListItem;
  outcomes?: string[]; 
  keyFeatures?: KeyFeatures; 
}

export function getProjectTasks(details: ProjectDetails): ProjectTask[] {
  const workstreams = details.workstreams ?? []
  return workstreams.flatMap((group) =>
    group.tasks.map((task) => ({
      ...task, projectId: details.id, projectName: details.name, workstreamId: group.id, workstreamName: group.name,
    })),
  )
}

function userFromName(name: string, role?: string): User {
  return { id: name.trim().toLowerCase().replace(/\s+/g, "-"), name, avatarUrl: getAvatarUrl(name), role }
}

function baseDetailsFromListItem(p: ProjectListItem): ProjectDetails {
  const picUsers = p.assignees && p.assignees.length > 0
    ? p.assignees.map((a) => userFromName(a.name, "PIC")) 
    : []
    
  const today = new Date()

  // DUMMY DATA WORKSTREAM
  const defaultWorkstreams: WorkstreamGroup[] = [
    {
      id: "ws-1",
      name: "Phase 1: Engineering & Design (DED)",
      tasks: [
        { id: "t-1", name: "Survei Lokasi & Pengukuran", status: "done", priority: "high", assignee: userFromName("Mohammad Ivan Effendy Putra") },
        { id: "t-2", name: "Persetujuan Gambar Kerja (Client)", status: "in-progress", priority: "urgent", dueLabel: "2 Days", dueTone: "danger" }
      ]
    },
    {
      id: "ws-2",
      name: "Phase 2: Procurement (Pengadaan)",
      tasks: [
        { id: "t-3", name: "PO Material Baja WF & Pelat", status: "todo", priority: "high", assignee: userFromName("Shafa Aldanissya Imron") },
        { id: "t-4", name: "Kedatangan Mesin / Pompa Tambang", status: "todo", priority: "medium" }
      ]
    },
    {
      id: "ws-3",
      name: "Phase 3: Pabrikasi & Konstruksi",
      tasks: [
        { id: "t-5", name: "Cutting & Welding Struktur Utama", status: "todo", priority: "medium" },
        { id: "t-6", name: "Inspeksi Quality Control (NDT)", status: "todo", priority: "high" }
      ]
    }
  ];

  return {
    id: p.id,
    name: p.name,
    description: p.description ?? "Deskripsi proyek belum tersedia.",
    meta: {
      priorityLabel: p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
      locationLabel: "Cilegon, Indonesia", 
      sprintLabel: "Fase Eksekusi",
      lastSyncLabel: "Just now",
    },
    scope: {
      inScope: ["Pembangunan fasilitas utama", "Instalasi mesin & kelistrikan", "Testing & Commissioning"],
      outOfScope: ["Izin Lokasi (Client)", "Operasional Komersial & Marketing"],
    },
    targets: {
      intentLabel: "Delivery (Eksekusi Proyek)",
      successTypeLabel: "Berbasis Deliverable",
      targetProduksi: "150 Ton / Bulan",
      targetRevenue: "Rp 2.5 Miliar",
      kpiDescription: "Selesainya fabrikasi 1 line konveyor dengan scrap rate di bawah 2%",
      structureType: "Milestone-based (Fase Bertahap)"
    },
    workstreams: defaultWorkstreams,
    timelineTasks: [],
    time: {
      estimateLabel: "2 Bulan",
      dueDate: addDays(today, 60),
      daysRemainingLabel: "60 Hari lagi",
      progressPercent: Math.floor(Math.random() * 60) + 10,
    },
    backlog: {
      statusLabel: "Active",
      groupLabel: "None",
      priorityLabel: p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
      labelBadge: "Engineering",
      picUsers, 
      supportUsers: p.client ? [userFromName(p.client, "Partner")] : [], 
    },
    quickLinks: [], 
    
    // DATA DUMMY UNTUK TAB ASSETS & FILES
    files: [
      {
        id: "file-1",
        name: "DED_Konveyor_Utama_V2.dwg",
        type: "dwg",
        sizeMB: 14.5,
        url: "#",
        addedBy: userFromName("Mohammad Ivan Effendy Putra"),
        addedDate: new Date(),
        description: "Gambar kerja detail revisi terbaru"
      },
      {
        id: "file-2",
        name: "RAB_Pengadaan_Material.xlsx",
        type: "xlsx",
        sizeMB: 2.1,
        url: "#",
        addedBy: userFromName("Shafa Aldanissya Imron"),
        addedDate: addDays(new Date(), -2),
        description: "Estimasi budget material pelat baja"
      },
      {
        id: "file-3",
        name: "Spesifikasi_Motor_Drive.pdf",
        type: "pdf",
        sizeMB: 5.8,
        url: "#",
        addedBy: userFromName("Andri Setyawan"),
        addedDate: addDays(new Date(), -5)
      }
    ], 
    
    // DATA DUMMY UNTUK TAB NOTES / LOGS
    notes: [
      {
        id: "note-1",
        title: "MoM Kickoff Meeting dengan Pemda",
        content: "Kesepakatan awal terkait timeline konstruksi dan batas area kerja (scope of work). Pemda meminta percepatan di Fase 1.",
        noteType: "meeting",
        status: "completed",
        addedDate: addDays(today, -10),
        addedBy: userFromName("Andri Setyawan")
      },
      {
        id: "note-2",
        title: "Issue Log: Keterlambatan Pengiriman Baja",
        content: "Vendor PT ABC melaporkan adanya delay pengiriman pelat baja 4mm karena cuaca buruk di pelabuhan. Estimasi mundur 3 hari.",
        noteType: "general",
        status: "processing",
        addedDate: addDays(today, -1),
        addedBy: userFromName("Shafa Aldanissya Imron")
      }
    ], 
    
    source: p,
    outcomes: ["Selesai tepat waktu", "Lulus uji spesifikasi material"],
    keyFeatures: { p0: ["Sistem Mekanikal"], p1: ["Sistem Kelistrikan"], p2: ["Finishing"] },
  }
}

export function getProjectDetailsById(id: string): ProjectDetails {
  const base = projects.find((p) => p.id === id)
  const effectiveBase: ProjectListItem = base ?? {
      id, name: `Untitled project ${id}`, status: "in-progress", priority: "medium", tags: [], assignees: [],
    }

  const details = baseDetailsFromListItem(effectiveBase)

  if (base?.id === "PRJ-01") {
    details.time.progressPercent = 40;
    details.time.estimateLabel = "45 Hari";
  }

  return details
}