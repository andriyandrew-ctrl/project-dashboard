"use client"

import { Link as LinkIcon, FilePdf, FileImage, File, DownloadSimple } from "@phosphor-icons/react/dist/ssr"
import { Button } from "@/components/ui/button"
import type { QuickLink } from "@/lib/data/project-details"
import { cn } from "@/lib/utils"

// Diubah prop-nya untuk menerima 1 file referensi utama saja
type QuickLinksCardProps = {
  fileRef?: QuickLink
}

export function QuickLinksCard({ fileRef }: QuickLinksCardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-primary mb-2">
        <LinkIcon className="h-5 w-5" weight="bold" />
        <h3 className="text-base font-bold text-foreground">Referensi Utama</h3>
      </div>

      <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-4">
        {fileRef ? (
          <div className="flex items-center gap-3">
             <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background border border-border shadow-sm">
                <FileIcon type={fileRef.type} className="h-5 w-5" />
             </div>
             <div className="flex flex-col flex-1 min-w-0">
                <span className="text-xs font-semibold text-foreground truncate" title={fileRef.name}>
                  {fileRef.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {fileRef.sizeMB} MB • Tor / Kontrak Dasar
                </span>
             </div>
             <Button variant="ghost" size="icon-sm" className="shrink-0 h-8 w-8 text-muted-foreground hover:text-primary">
                <DownloadSimple className="h-4 w-4" weight="bold" />
             </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <p className="text-xs text-muted-foreground mb-3">
              Tidak ada dokumen referensi utama yang disematkan.
            </p>
            <Button variant="outline" size="sm" className="h-7 text-[11px] shadow-sm bg-background">
              Sematkan File
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function FileIcon({ type, className }: { type: string; className?: string }) {
    switch (type.toLowerCase()) {
        case "pdf":
            return <FilePdf className={cn("text-red-500", className)} weight="fill" />
        case "fig":
        case "jpg":
        case "png":
            return <FileImage className={cn("text-emerald-500", className)} weight="fill" />
        case "dwg":
        case "cad":
            return <File className={cn("text-indigo-500", className)} weight="fill" />
        default:
            return <File className={cn("text-blue-500", className)} weight="fill" />
    }
}