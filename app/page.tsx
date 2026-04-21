"use client"

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ProjectCardsView } from "@/components/project-cards-view"
import { ProjectWizard } from "@/components/project-wizard/ProjectWizard"

// IMPORT PIPA DATABASE KITA
import { getAllProjects } from "@/lib/data/project-actions"

// Ini adalah format data proyek yang kita ambil dari Supabase
// Kita ubah sedikit agar cocok dengan komponen ProjectCardsView Bapak
interface DBProject {
  id: string;
  project_code: string; // <--- TAMBAHKAN BARIS INI
  name: string;
  status: string;
  priority: string;
  start_date: string;
  end_date: string;
  progress_percent: number;
}

export default function DashboardPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  
  // STATE BARU UNTUK MENYIMPAN DATA DARI DATABASE
  const [projectsData, setProjectsData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // FUNGSI UNTUK MENARIK DATA SAAT HALAMAN DIBUKA
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const dataFromDB = await getAllProjects()
        
        // Kita sesuaikan format datanya agar mirip dengan data palsu sebelumnya
        // agar komponen ProjectCardsView Bapak tidak rusak
        const formattedProjects = dataFromDB.map((dbProj: DBProject) => ({
          id: dbProj.id,
          name: dbProj.name,   // <-- Tambahkan ini agar judul card muncul
          title: dbProj.name,
          project_code: dbProj.project_code, // <-- Ambil kode PRJ-XXXXX
          status: dbProj.status,
          priority: dbProj.priority,
          progress: dbProj.progress_percent || 0,
          dueDate: new Date(dbProj.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          assignees: [ { avatar: "", name: "Andri S" } ],
          tags: ["R&D"]
        }))

        setProjectsData(formattedProjects)
      } catch (error) {
        console.error("Gagal menarik data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProjects()
  }, [])

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        
        <SidebarInset className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <header className="flex h-16 shrink-0 items-center justify-between border-b px-6 bg-white/50 backdrop-blur-md sticky top-0 z-10">
            <h1 className="text-xl font-bold tracking-tight">General Project Dashboard</h1>
            <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-wider">
              Manager R&D
            </span>
          </header>

          <main className="flex-1 overflow-y-auto bg-muted/10 p-4">
            {/* SEKARANG KITA MASUKKAN DATA DARI DATABASE */}
            <ProjectCardsView 
              projects={projectsData} 
              loading={isLoading}
              onCreateProject={() => setIsWizardOpen(true)}
            />
          </main>
        </SidebarInset>
      </div>

      {isWizardOpen && (
        <ProjectWizard 
          onClose={() => setIsWizardOpen(false)} 
          onCreate={() => {
            setIsWizardOpen(false)
            window.location.reload() 
          }} 
        />
      )}
    </SidebarProvider>
  )
}