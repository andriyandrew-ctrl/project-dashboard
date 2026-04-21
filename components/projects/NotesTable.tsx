"use client"

import { useState } from "react"
import { DotsThree, MagnifyingGlass, Funnel, Export } from "@phosphor-icons/react/dist/ssr"
import { format } from "date-fns"

import type { ProjectNote, NoteStatus } from "@/lib/data/project-details"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

type NotesTableProps = {
    notes: ProjectNote[]
    onAddNote?: () => void
    onEditNote?: (noteId: string) => void
    onDeleteNote?: (noteId: string) => void
    onNoteClick?: (note: ProjectNote) => void
}

export function NotesTable({ notes, onAddNote, onEditNote, onDeleteNote, onNoteClick }: NotesTableProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedNotes, setSelectedNotes] = useState<string[]>([])

    const filteredNotes = notes.filter((note) =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const toggleSelectAll = () => {
        if (selectedNotes.length === filteredNotes.length) {
            setSelectedNotes([])
        } else {
            setSelectedNotes(filteredNotes.map((note) => note.id))
        }
    }

    const toggleSelectNote = (noteId: string) => {
        setSelectedNotes((prev) =>
            prev.includes(noteId)
                ? prev.filter((id) => id !== noteId)
                : [...prev, noteId]
        )
    }

    return (
        <div className="space-y-4 p-3 bg-muted/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                    <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Cari nomor dokumen atau judul..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-background border-border/60"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="bg-background shadow-sm">
                        <Funnel className="mr-1.5 h-4 w-4" />
                        Filter
                    </Button>
                    <Button variant="outline" size="sm" className="bg-background shadow-sm">
                        <Export className="mr-1.5 h-4 w-4" />
                        Export Log
                    </Button>
                </div>
            </div>

            <div className="rounded-lg border border-border bg-background shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead className="w-12 text-center">
                                <Checkbox
                                    checked={
                                        filteredNotes.length > 0 &&
                                        selectedNotes.length === filteredNotes.length
                                    }
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead className="font-semibold text-foreground">Document Title</TableHead>
                            <TableHead className="font-semibold text-foreground">Author / PIC</TableHead>
                            <TableHead className="font-semibold text-foreground">Date Logged</TableHead>
                            <TableHead className="font-semibold text-foreground">Status</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredNotes.length > 0 ? (
                            filteredNotes.map((note) => (
                                <TableRow key={note.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => onNoteClick?.(note)}>
                                    <TableCell className="text-center" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={selectedNotes.includes(note.id)}
                                            onCheckedChange={() => toggleSelectNote(note.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium text-foreground">{note.title}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {note.addedBy.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {format(note.addedDate, "dd MMM yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <StatusBadge status={note.status} />
                                    </TableCell>
                                    <TableCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
                                                >
                                                    <DotsThree className="h-5 w-5" weight="bold" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-40">
                                                <DropdownMenuItem onClick={() => onEditNote?.(note.id)}>
                                                    Edit Document
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600" onClick={() => onDeleteNote?.(note.id)}>
                                                    Delete Log
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    Tidak ada dokumen yang ditemukan.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}

function StatusBadge({ status }: { status: NoteStatus }) {
    return (
        <Badge
            variant="outline"
            className={cn(
                "text-[11px] font-bold uppercase tracking-wider px-2 py-0.5",
                status === "completed"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-400"
                    : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-400"
            )}
        >
            {status}
        </Badge>
    )
}