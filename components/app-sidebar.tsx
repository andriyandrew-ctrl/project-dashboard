"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tray,
  CheckSquare,
  Folder,
  Users,
  ChartBar,
  Gear,
  Layout,
  Question,
  SignOut,
  CaretRight,
  ChartPieSlice
} from "@phosphor-icons/react/dist/ssr"
import { footerItems, navItems, type NavItemId, type SidebarFooterItemId } from "@/lib/data/sidebar"
import { SettingsDialog } from "@/components/settings/SettingsDialog"
import { AuthDialog, type AuthMode } from "@/components/auth/AuthDialog"

const navItemIcons: Record<NavItemId, React.ComponentType<{ className?: string }>> = {
  inbox: Tray,
  "my-tasks": CheckSquare,
  projects: Folder,
  clients: Users,
  performance: ChartBar,
}

const footerItemIcons: Record<SidebarFooterItemId, React.ComponentType<{ className?: string }>> = {
  settings: Gear,
  templates: Layout,
  help: Question,
}

export function AppSidebar() {
  const pathname = usePathname()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>("sign-in")

  const openAuth = (mode: AuthMode) => {
    setAuthMode(mode)
    setIsAuthOpen(true)
  }

  const getHrefForNavItem = (id: NavItemId): string => {
    if (id === "my-tasks") return "/tasks"
    if (id === "projects") return "/"
    if (id === "inbox") return "/inbox"
    if (id === "clients") return "/clients"
    if (id === "performance") return "/performance"
    return "#"
  }

  const isItemActive = (id: NavItemId): boolean => {
    if (id === "projects") {
      return pathname === "/" || pathname.startsWith("/projects")
    }
    if (id === "my-tasks") {
      return pathname.startsWith("/tasks")
    }
    if (id === "inbox") {
      return pathname.startsWith("/inbox")
    }
    if (id === "clients") {
      return pathname.startsWith("/clients")
    }
    if (id === "performance") {
      return pathname.startsWith("/performance")
    }
    return false
  }

  return (
    <Sidebar className="border-border/40 border-r-0 shadow-none border-none">
      {/* PENAMBAHAN GARIS PEMISAH DI BAWAH HEADER (border-b border-border/40) */}
      <SidebarHeader className="p-4 border-b border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[inset_0_-5px_6.6px_0_rgba(0,0,0,0.25)]">
              <ChartPieSlice className="h-5 w-5" weight="fill" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate">Dashboard Project</span>
              {/* PERBESAR FONT DARI text-[10px] MENJADI text-xs */}
              <span className="text-xs text-muted-foreground truncate" title="Market Dev. Prod. Downstream">
                Market Dev. Prod. Downstream
              </span>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-0 gap-0 pt-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const href = getHrefForNavItem(item.id)
                const active = isItemActive(item.id)

                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className="h-9 rounded-lg px-3 font-normal text-muted-foreground"
                    >
                      <Link href={href}>
                        {(() => {
                          const Icon = navItemIcons[item.id]
                          return Icon ? <Icon className="h-[18px] w-[18px]" /> : null
                        })()}
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.badge && (
                      <SidebarMenuBadge className="bg-muted text-muted-foreground rounded-full px-2">
                        {item.badge}
                      </SidebarMenuBadge>
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-2">
        <SidebarMenu>
          {footerItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                className="h-9 rounded-lg px-3 text-muted-foreground"
                onClick={() => {
                  if (item.id === "settings") {
                    setIsSettingsOpen(true)
                  }
                }}
              >
                {(() => {
                  const Icon = footerItemIcons[item.id]
                  return Icon ? <Icon className="h-[18px] w-[18px]" /> : null
                })()}
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="mt-2 flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-accent cursor-pointer"
            >
              <Avatar className="h-8 w-8 border border-border">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">AS</AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col min-w-0">
                <span className="text-sm font-medium truncate">Andri S</span>
                <span className="text-[10px] text-muted-foreground truncate">andriyandrew@gmail.com</span>
              </div>
              <CaretRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="end" className="w-40">
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onSelect={() => openAuth("sign-in")}
            >
              <SignOut className="h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>

      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      <AuthDialog
        open={isAuthOpen}
        onOpenChange={setIsAuthOpen}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </Sidebar>
  )
}