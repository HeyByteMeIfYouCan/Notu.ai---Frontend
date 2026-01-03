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
import { NavTodolist } from "@/components/nav-todolist"
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
      url: "/dashboard/settings",
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
        url: "/dashboard/settings",
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
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#" className="flex items-center gap-2">
                <img src={"/logo.png"} alt="logo" width={25} height={25} />
                <span className="text-base font-semibold">Notu.ai</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavTodolist />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
