"use client"

import type { ProjectDetails } from "@/lib/data/project-details"
import { TimeCard } from "@/components/projects/TimeCard"
import { BacklogCard } from "@/components/projects/BacklogCard"
import { QuickLinksCard } from "@/components/projects/QuickLinksCard"
import { Separator } from "@/components/ui/separator"
import { ClientCard } from "@/components/projects/ClientCard"
import { getClientByName } from "@/lib/data/clients"

type RightMetaPanelProps = {
  project: ProjectDetails
}

export function RightMetaPanel({ project }: RightMetaPanelProps) {
  const clientName = project.source?.client
  const client = clientName ? getClientByName(clientName) : undefined

  return (
    // PERUBAHAN: Menghapus bg-card, border, dan padding (p-4). 
    // Menambahkan pt-2 (padding-top kecil) agar tulisan persis sejajar dengan garis tengah Judul Proyek.
    <aside className="flex flex-col gap-8 pt-2 lg:sticky lg:top-8 lg:self-start w-full">
      
      {/* Waktu Pelaksanaan */}
      <TimeCard time={project.time} />
      
      <Separator className="bg-border/60" />
      
      {/* Informasi Utama */}
      <BacklogCard backlog={project.backlog} />
      
      {client && (
        <>
          <Separator className="bg-border/60" />
          <ClientCard client={client} />
        </>
      )}
      
      <Separator className="bg-border/60" />
      
      {/* Referensi Utama */}
      <QuickLinksCard fileRef={project.files?.[0]} />
      
    </aside>
  )
}