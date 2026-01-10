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
        
        {/* Center - Search and Upgrade */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-400 text-xs font-semibold text-[var(--accent-foreground)]">1</div>
            <span className="text-sm text-[var(--muted-foreground)] hidden sm:inline">Free meetings</span>
            <Button className="bg-green-400 hover:brightness-90 text-[var(--accent-foreground)] text-xs sm:text-sm">Upgrade</Button>
          </div>
          <Separator
            orientation="vertical"
            className="data-[orientation=vertical]:h-4 hidden sm:block"
          />
          {/* Right - Actions and Profile */}
          <div className="flex items-center gap-2 sm:gap-4">
            <Button className="bg-[var(--primary)] hover:brightness-90 text-[var(--primary-foreground)]">
              <IconVideo className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Capture</span>
            </Button>
            <IconMicrophone className="h-5 w-5 text-gray-600 hidden sm:block" />
            
            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                    <IconUserCircle className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconCreditCard className="mr-2 h-4 w-4" />
                    <span>Billing</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconNotification className="mr-2 h-4 w-4" />
                    <span>Notifications</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                    <IconSettings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <IconLogout className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
