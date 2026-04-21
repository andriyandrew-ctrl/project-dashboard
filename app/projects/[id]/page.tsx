import { AppSidebar } from "@/components/app-sidebar"
import { ProjectDetailsPage } from "@/components/projects/ProjectDetailsPage"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { notFound } from "next/navigation"

// IMPORT FUNGSI PENYEDOT DATA DARI DATABASE
import { getProjectById } from "@/lib/data/project-actions"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params

  // 1. TARIK DATA ASLI DARI SUPABASE BERDASARKAN ID
  const projectData = await getProjectById(id)

  // Jika data tidak ditemukan di database, tampilkan halaman 404
  if (!projectData) {
    notFound()
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* 2. LEMPAR DATA ASLI (projectData) KE KOMPONEN UI BAPAK */}
        <ProjectDetailsPage projectId={id} dbData={projectData} />
      </SidebarInset>
    </SidebarProvider>
  )
}