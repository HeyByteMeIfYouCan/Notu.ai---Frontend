"use client"

import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
  IconFileUpload,
  IconListDetails,
  IconReportAnalytics,
  IconSettings,
  IconCalendarTime,
  IconHelp,
  IconSearch,
} from "@tabler/icons-react"
import { useSession } from "next-auth/react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavPinned } from "@/components/nav-pinned"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import Image from "next/image"

const data = {
  navMain: [
    { title: "Beranda", url: "/dashboard", icon: IconDashboard },
    { title: "Meeting", url: "/dashboard/meeting", icon: IconCalendarTime },
    { title: "Uploads", url: "/dashboard/uploads", icon: IconFileUpload },
    { title: "Status Meeting", url: "/dashboard/status-meeting", icon: IconListDetails },
    { title: "Analytics", url: "/dashboard/analytics", icon: IconReportAnalytics },
    { title: "Kanban", url: "/dashboard/kanban", icon: IconListDetails },
  ],
  navClouds: [],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
  ],
  documents: [
      {
        name: "Settings",
        url: "#",
      },
      {
        name: "Get Help",
        url: "#",
      },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const { setOpen } = useSidebar()

  const user = {
    name: session?.user?.name || "Guest",
    email: session?.user?.email || "",
    avatar: session?.user?.image || "",
  }

  return (
    <Sidebar >
      <SidebarHeader className="pt-6 pb-2 px-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <a href="/dashboard" className="flex items-center gap-3 px-2 transition-opacity hover:opacity-90">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 shadow-sm">
                <img src={"/logo.png"} alt="logo" width={20} height={20} className="object-contain" />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">Notu.ai</span>
            </a>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavPinned />
        {/* <NavTodolist /> */}
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
