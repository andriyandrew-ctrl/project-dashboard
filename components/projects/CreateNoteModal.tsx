"use client"

import { useEffect, useState } from "react"
import { Paperclip, Tag, X } from "@phosphor-icons/react/dist/ssr"

import type { User } from "@/lib/data/project-details"
import { Button } from "@/components/ui/button"
import { QuickCreateModalLayout } from "@/components/QuickCreateModalLayout"
import { ProjectDescriptionEditor } from "@/components/project-wizard/ProjectDescriptionEditor"

type CreateNoteModalProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    currentUser?: User 
    // PERBAIKAN: Fungsi ini sekarang menerima parameter ke-3 yaitu "noteType"
    onCreateNote: (title: string, content: string, noteType: string) => void 
    onUploadAudio: () => void 
}

export function CreateNoteModal({
    open,
    onOpenChange,
    currentUser,
    onCreateNote,
    onUploadAudio,
}: CreateNoteModalProps) {
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState<string | undefined>(undefined)
    const [noteType, setNoteType] = useState("mom") // STATE BARU UNTUK KATEGORI
    const [isExpanded, setIsExpanded] = useState(false)

    useEffect(() => {
        if (!open) return
        setTitle("")
        setDescription(undefined)
        setNoteType("mom")
        setIsExpanded(false)
    }, [open])

    const handleClose = () => {
        onOpenChange(false)
    }

    const handleCreate = () => {
        if (!title.trim()) return 
        onCreateNote(title, description ?? "", noteType) // MENGIRIM KATEGORI KE DATABASE
        setTitle("")
        setDescription(undefined)
        setNoteType("mom")
        onOpenChange(false)
    }

    const handleAttachClick = () => {
        onUploadAudio() 
    }

    return (
        <QuickCreateModalLayout
            open={open}
            onClose={handleClose}
            isDescriptionExpanded={isExpanded}
            onSubmitShortcut={handleCreate}
        >
            <div className="flex items-center justify-between gap-2 w-full shrink-0 mt-1">
                <div className="flex flex-col gap-2 flex-1">
                    <div className="flex gap-1 h-10 items-center w-full">
                        <input
                            id="note-create-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Judul Dokumen (Cth: MoM Vendor, Revisi DED)"
                            className="w-full font-bold leading-7 text-foreground placeholder:text-muted-foreground/60 text-xl outline-none bg-transparent border-none p-0"
                            autoComplete="off"
                            autoFocus
                        />
                    </div>
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="h-8 w-8 rounded-full opacity-70 hover:opacity-100 hover:bg-muted"
                    onClick={handleClose}
                >
                    <X className="h-5 w-5 text-muted-foreground" />
                </Button>
            </div>

            <div className="mt-2">
                <ProjectDescriptionEditor
                    value={description}
                    onChange={setDescription}
                    onExpandChange={setIsExpanded}
                    placeholder="Tulis ringkasan rapat, keterangan revisi, atau isu lapangan di sini..."
                    showTemplates={false}
                />
            </div>

            <div className="flex items-center gap-2 mt-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border/60 hover:bg-muted/50 cursor-pointer transition-colors">
                    <Tag className="h-4 w-4 text-primary" weight="bold" />
                    <select 
                        value={noteType} 
                        onChange={(e) => setNoteType(e.target.value)} 
                        className="text-sm bg-transparent outline-none cursor-pointer font-medium text-foreground"
                    >
                        <option value="mom">Minutes of Meeting (MoM)</option>
                        <option value="report">Site Visit Report</option>
                        <option value="blocker">Issue / Bottleneck Log</option>
                        <option value="design">Design / Drawing Log</option>
                        <option value="general">Lainnya</option>
                    </select>
                </div>
            </div>

            <div className="flex items-center justify-between mt-auto w-full pt-6 shrink-0">
                
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleAttachClick}
                        className="bg-background shadow-sm hover:border-primary/50 hover:text-primary"
                    >
                        <Paperclip className="h-4 w-4 mr-2" weight="bold" />
                        Attach File
                    </Button>
                    <span className="text-[11px] text-muted-foreground hidden sm:block font-medium">
                        (PDF, DOCX, DWG, XLSX)
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Button 
                        size="sm" 
                        onClick={handleCreate}
                        disabled={!title.trim()} 
                        className="font-medium shadow-sm"
                    >
                        Save Document
                    </Button>
                </div>
            </div>
        </QuickCreateModalLayout>
    )
}