"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface QuickCreateModalLayoutProps {
    open: boolean
    onClose: () => void
    isDescriptionExpanded?: boolean
    onSubmitShortcut?: () => void
    className?: string
    contentClassName?: string
    children: React.ReactNode
}

export function QuickCreateModalLayout({
    open,
    onClose,
    isDescriptionExpanded,
    className,
    contentClassName,
    children,
}: QuickCreateModalLayoutProps) {
    if (!open) return null

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            {/* Klik di luar untuk tutup */}
            <div className="absolute inset-0" onClick={onClose} />
            
            {/* Kontainer Putih Utama */}
            <div
                className={cn(
                    "relative flex w-full max-w-[720px] bg-background rounded-[32px] shadow-2xl border border-border overflow-hidden",
                    isDescriptionExpanded ? "h-[85vh]" : "min-h-[500px]",
                    className,
                )}
            >
                <div className={cn("flex flex-1 flex-col p-2 w-full", contentClassName)}>
                    {children}
                </div>
            </div>
        </div>
    )
}