"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Plus, Books, Article, Spinner } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

import type { ProjectNote, User } from "@/lib/data/project-details"
import { Button } from "@/components/ui/button"
import { NoteCard } from "@/components/projects/NoteCard"
import { NotesTable } from "@/components/projects/NotesTable"
import { CreateNoteModal } from "@/components/projects/CreateNoteModal"
import { UploadAudioModal } from "@/components/projects/UploadAudioModal"
import { NotePreviewModal } from "@/components/projects/NotePreviewModal"

type NotesTabProps = {
    notes: ProjectNote[]
    currentUser?: User
}

const defaultUser: User = {
    id: "andri-s",
    name: "Andri Setyawan",
    avatarUrl: undefined,
}

export function NotesTab({ notes, currentUser = defaultUser }: NotesTabProps) {
    const params = useParams()
    const urlId = params?.id as string

    // STATE MANAGEMENT DB
    const [localNotes, setLocalNotes] = useState<ProjectNote[]>([])
    const [projectDbId, setProjectDbId] = useState<string>("")
    const [isLoading, setIsLoading] = useState(true)
    
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
    const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
    const [selectedNote, setSelectedNote] = useState<ProjectNote | null>(null)

    // 1. FETCH DATA DARI SUPABASE
    useEffect(() => {
        const fetchNotesFromDB = async () => {
            if (!urlId) return;
            setIsLoading(true);
            try {
                let pid = urlId;
                if (urlId.startsWith('PRJ-')) {
                    const { data: pData } = await supabase.from('projects').select('id').eq('project_code', urlId).single();
                    if (pData) pid = pData.id;
                }
                setProjectDbId(pid);

                const { data: notesData, error } = await supabase
                    .from('project_notes')
                    .select('*')
                    .eq('project_id', pid)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (notesData) {
                    const mapped = notesData.map((n: any) => ({
                        id: n.id,
                        title: n.title,
                        content: n.content,
                        noteType: n.note_type,
                        status: n.status,
                        addedDate: new Date(n.created_at),
                        // PERBAIKAN TYPESCRIPT: Menambahkan format 'id' yang diminta oleh tipe User
                        addedBy: { id: n.added_by.toLowerCase().replace(/\s+/g, '-'), name: n.added_by }
                    }));
                    setLocalNotes(mapped);
                }
            } catch (error) {
                console.error("Gagal menarik catatan:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchNotesFromDB();
    }, [urlId]);

    const recentNotes = localNotes.slice(0, 8)

    const handleAddNote = () => setIsCreateModalOpen(true)

    // 2. CREATE NOTE KE SUPABASE
    const handleCreateNote = async (title: string, content: string, noteType: string) => {
        try {
            const newNotePayload = {
                project_id: projectDbId,
                title,
                content,
                note_type: noteType,
                status: 'open',
                added_by: currentUser.name
            };

            const { data, error } = await supabase.from('project_notes').insert([newNotePayload]).select().single();
            if (error) throw error;

            const newDocument: ProjectNote = {
                id: data.id,
                title: data.title,
                content: data.content,
                noteType: data.note_type as any,
                status: data.status as any,
                addedDate: new Date(data.created_at),
                // PERBAIKAN TYPESCRIPT: Menambahkan 'id' menggunakan currentUser
                addedBy: { id: currentUser.id, name: data.added_by }
            };

            setLocalNotes((prevNotes) => [newDocument, ...prevNotes]);
            toast.success("Dokumen berhasil ditambahkan ke Database!");
        } catch (error: any) {
            toast.error(`Gagal menyimpan dokumen: ${error.message}`);
        }
    }

    const handleUploadAudio = () => setIsUploadModalOpen(true)

    const handleFileSelect = (fileName: string) => {
        setIsUploadModalOpen(false)
        setIsCreateModalOpen(false)
        toast(`Memproses file "${fileName}"...`)
        setTimeout(() => toast.success(`File "${fileName}" berhasil dilampirkan.`), 2000)
    }

    const handleNoteClick = (note: ProjectNote) => {
        setSelectedNote(note)
        setIsPreviewModalOpen(true)
    }

    const handleEditNote = (noteId: string) => {
        toast.info("Fitur Edit akan segera disambungkan ke Database.")
    }

    // 3. DELETE NOTE DARI SUPABASE
    const handleDeleteNote = async (noteId: string) => {
        try {
            const { error } = await supabase.from('project_notes').delete().eq('id', noteId);
            if (error) throw error;
            
            setLocalNotes((prevNotes) => prevNotes.filter((n) => n.id !== noteId));
            toast.success("Dokumen berhasil dihapus dari Database.");
        } catch (error: any) {
            toast.error(`Gagal menghapus dokumen: ${error.message}`);
        }
    }

    return (
        <div className="space-y-8 p-1">
            <section>
                <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2 text-primary">
                        <Article className="h-5 w-5" weight="fill" />
                        <h2 className="text-base font-semibold text-foreground tracking-tight">
                            Recent Documents (MoM & Reports)
                        </h2>
                    </div>
                    <Button variant="default" size="sm" onClick={handleAddNote} className="shadow-sm">
                        <Plus className="mr-1.5 h-4 w-4" weight="bold" />
                        New Document
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Spinner className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : recentNotes.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {recentNotes.map((note) => (
                            <NoteCard key={note.id} note={note} onEdit={handleEditNote} onDelete={handleDeleteNote} onClick={() => handleNoteClick(note)} />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-8 text-center text-sm text-muted-foreground">
                        Belum ada dokumen atau laporan terbaru.
                    </div>
                )}
            </section>

            <section className="pt-4">
                <div className="mb-4 flex items-center gap-2 text-primary">
                    <Books className="h-5 w-5" weight="fill" />
                    <h2 className="text-base font-semibold text-foreground tracking-tight">
                        Project Logs Register
                    </h2>
                </div>
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden p-1">
                    <NotesTable notes={localNotes} onAddNote={handleAddNote} onEditNote={handleEditNote} onDeleteNote={handleDeleteNote} onNoteClick={handleNoteClick} />
                </div>
            </section>

            <CreateNoteModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} currentUser={currentUser} onCreateNote={handleCreateNote} onUploadAudio={handleUploadAudio} />
            <UploadAudioModal open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen} onFileSelect={handleFileSelect} />
            <NotePreviewModal open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen} note={selectedNote} />
        </div>
    )
}