"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { 
  IconBell, 
  IconChevronDown, 
  IconMicrophone, 
  IconSearch, 
  IconVideo,
  IconMenu2,
  IconDashboard,
  IconCalendarTime,
  IconFileUpload,
  IconListDetails,
  IconReportAnalytics,
  IconSettings,
  IconHelp,
  IconLogout,
  IconUserCircle,
  IconCreditCard,
  IconNotification
} from "@tabler/icons-react"
import { Input } from "./ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useState } from "react"

const navItems = [
  { title: "Beranda", url: "/dashboard", icon: IconDashboard },
  { title: "Meeting", url: "/dashboard/meeting", icon: IconCalendarTime },
  { title: "Uploads", url: "/dashboard/uploads", icon: IconFileUpload },
  { title: "Status Meeting", url: "/dashboard/status-meeting", icon: IconListDetails },
  { title: "Analytics", url: "/dashboard/analytics", icon: IconReportAnalytics },
  { title: "Kanban", url: "/dashboard/kanban", icon: IconListDetails },
]

const secondaryItems = [
  { title: "Settings", url: "/dashboard/settings", icon: IconSettings },
  { title: "Get Help", url: "#", icon: IconHelp },
]

export function SiteHeader() {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const user = {
    name: session?.user?.name || "Guest",
    email: session?.user?.email || "",
    avatar: session?.user?.image || "",
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  const handleNavClick = (url: string) => {
    router.push(url)
    setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 py-8 flex h-(--header-height) bg-sidebar shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex justify-between w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <div className="flex gap-2 items-center">
          {/* Mobile Menu Trigger */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden -ml-1">
                <IconMenu2 className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="flex items-center gap-2">
                  <img src="/logo.png" alt="logo" width={25} height={25} />
                  <span className="text-base font-semibold">Notu.ai</span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col h-full">
                {/* Main Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Menu</p>
                  {navItems.map((item) => {
                    const isActive = pathname === item.url || pathname.startsWith(item.url + '/')
                    return (
                      <button
                        key={item.url}
                        onClick={() => handleNavClick(item.url)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                          isActive 
                            ? 'bg-primary/10 text-primary font-medium' 
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.title}
                      </button>
                    )
                  })}
                  
                  <Separator className="my-4" />
                  
                  <p className="text-xs font-medium text-muted-foreground mb-2 px-2">Lainnya</p>
                  {secondaryItems.map((item) => (
                    <button
                      key={item.url}
                      onClick={() => handleNavClick(item.url)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    >
                      <item.icon className="h-5 w-5" />
                      {item.title}
                    </button>
                  ))}
                </nav>
                
                {/* User Section at Bottom */}
                <div className="p-4 border-t">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                    onClick={handleLogout}
                  >
                    <IconLogout className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          {/* Desktop Sidebar Trigger */}
          <SidebarTrigger className="-ml-1 hidden lg:flex" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4 hidden lg:block"
          />
          <h1 className="text-base font-medium hidden lg:block">Documents</h1>
        </div>
        
        {/* Center - Quota & Upgrade */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 p-1 pl-2.5 sm:pl-3 rounded-full bg-blue-500/10 dark:bg-blue-950/30 border border-blue-500/20 dark:border-blue-800/40">
            <div className="flex items-center gap-1.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[11px] font-bold ring-1 ring-blue-500/30">
                1
              </span>
              <span className="text-xs font-medium text-foreground/80 hidden sm:inline">
                Free meeting
              </span>
            </div>
            <Button
              size="sm"
              onClick={() => router.push('/dashboard/settings')}
              className="h-7 rounded-full px-3 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-xs border-0 transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Upgrade
            </Button>
          </div>

          <Separator
            orientation="vertical"
            className="data-[orientation=vertical]:h-4 hidden sm:block"
          />

          {/* Right - Actions and Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Button className="h-8 sm:h-9 px-3 sm:px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-xs rounded-lg sm:rounded-xl text-xs sm:text-sm transition-all cursor-pointer">
              <IconVideo className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Capture</span>
            </Button>
            <button 
              type="button"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors hidden sm:flex items-center justify-center cursor-pointer"
              title="Voice recording"
            >
              <IconMicrophone className="h-4 w-4" />
            </button>
            
            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 ring-2 ring-transparent hover:ring-primary/20 transition-all cursor-pointer">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 rounded-xl p-1.5 shadow-xl border border-border/80 bg-popover/95 backdrop-blur-md" align="end" sideOffset={6} forceMount>
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/40 mb-1 border border-border/40 text-left text-sm">
                    <Avatar className="h-9 w-9 rounded-lg ring-1 ring-border/50">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                      <span className="truncate font-semibold text-foreground">{user.name}</span>
                      <span className="text-muted-foreground truncate text-xs">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem 
                    onClick={() => router.push('/dashboard/settings')} 
                    className="cursor-pointer rounded-lg px-2.5 py-2 text-sm font-medium text-foreground/90 transition-colors duration-150 focus:bg-muted focus:text-foreground hover:bg-muted hover:text-foreground [&_svg]:size-4 [&_svg]:text-muted-foreground focus:[&_svg]:text-foreground hover:[&_svg]:text-foreground"
                  >
                    <IconUserCircle className="mr-2" />
                    <span>Profil Akun</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => router.push('/dashboard/settings')} 
                    className="cursor-pointer rounded-lg px-2.5 py-2 text-sm font-medium text-foreground/90 transition-colors duration-150 focus:bg-muted focus:text-foreground hover:bg-muted hover:text-foreground [&_svg]:size-4 [&_svg]:text-muted-foreground focus:[&_svg]:text-foreground hover:[&_svg]:text-foreground"
                  >
                    <IconCreditCard className="mr-2" />
                    <span>Paket & Tagihan</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => router.push('/dashboard/settings')} 
                    className="cursor-pointer rounded-lg px-2.5 py-2 text-sm font-medium text-foreground/90 transition-colors duration-150 focus:bg-muted focus:text-foreground hover:bg-muted hover:text-foreground [&_svg]:size-4 [&_svg]:text-muted-foreground focus:[&_svg]:text-foreground hover:[&_svg]:text-foreground"
                  >
                    <IconNotification className="mr-2" />
                    <span>Notifikasi</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => router.push('/dashboard/settings')} 
                    className="cursor-pointer rounded-lg px-2.5 py-2 text-sm font-medium text-foreground/90 transition-colors duration-150 focus:bg-muted focus:text-foreground hover:bg-muted hover:text-foreground [&_svg]:size-4 [&_svg]:text-muted-foreground focus:[&_svg]:text-foreground hover:[&_svg]:text-foreground"
                  >
                    <IconSettings className="mr-2" />
                    <span>Pengaturan</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-border/60 -mx-1 my-1" />
                <DropdownMenuItem 
                  onClick={handleLogout} 
                  className="cursor-pointer rounded-lg px-2.5 py-2 text-sm font-medium text-red-600 dark:text-red-400 transition-colors duration-150 focus:bg-red-500/10 focus:text-red-600 dark:focus:bg-red-500/20 dark:focus:text-red-400 hover:bg-red-500/10 hover:text-red-600 [&_svg]:size-4 [&_svg]:!text-red-600 dark:[&_svg]:!text-red-400"
                >
                  <IconLogout className="mr-2" />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
