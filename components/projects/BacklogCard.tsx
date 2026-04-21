"use client"

import { Hash, Suitcase, Users, UserCircle, Tag } from "@phosphor-icons/react/dist/ssr"
import type { BacklogSummary } from "@/lib/data/project-details"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type BacklogCardProps = {
  backlog: BacklogSummary
}

export function BacklogCard({ backlog }: BacklogCardProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-primary mb-4">
        <Suitcase className="h-5 w-5" weight="fill" />
        <h3 className="text-base font-bold text-foreground">Informasi Utama</h3>
      </div>

      <div className="space-y-4">
        {/* Divisi / Group */}
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Hash className="h-4 w-4" />
            Divisi
          </span>
          <span className="font-semibold text-foreground">R&D Dept.</span>
        </div>

        {/* Prioritas */}
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Tag className="h-4 w-4" />
            Prioritas
          </span>
          <span className="font-semibold text-foreground">{backlog.priorityLabel}</span>
        </div>

        {/* Kategori Label */}
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Suitcase className="h-4 w-4" />
            Kategori
          </span>
          <Badge variant="secondary" className="font-medium text-[11px] bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">
            {backlog.labelBadge}
          </Badge>
        </div>

        {/* PIC Utama */}
        <div className="flex items-center justify-between text-sm pt-2">
          <span className="flex items-center gap-2 text-muted-foreground">
            <UserCircle className="h-4 w-4" />
            Lead Engineer (PIC)
          </span>
          <div className="flex -space-x-2">
            {backlog.picUsers.slice(0, 3).map((user) => (
              <Avatar key={user.id} className="size-6 border-2 border-background shadow-sm" title={user.name}>
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>

        {/* Support Team */}
        {backlog.supportUsers && backlog.supportUsers.length > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              Support Team
            </span>
            <div className="flex -space-x-2">
              {backlog.supportUsers.map((user) => (
                <Avatar key={user.id} className="size-6 border-2 border-background shadow-sm bg-muted" title={user.name}>
                  {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                  <AvatarFallback className="text-[9px] font-bold text-muted-foreground">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}