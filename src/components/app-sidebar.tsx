/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  IconInnerShadowTop,
  IconBuilding,
  IconBuildingCommunity,
  IconBuildingFactory,
  IconBuildingStore,
} from "@tabler/icons-react";

import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { NavMain } from "@/components/nav-main";

const data = {
  navMain: [
    {
      title: "Dashboard",
      icon: IconInnerShadowTop,
      url: "/dashboard",
    },
    {
      title: "Bandung",
      icon: IconBuilding,
      subItems: [{ title: "Detail Gedung", url: "/dashboard/table/bandung" }],
    },
    {
      title: "Kawasan Corpu",
      icon: IconBuildingCommunity,
      subItems: [{ title: "Detail Gedung", url: "/dashboard/table/corpu" }],
    },
    {
      title: "Priangan Barat",
      icon: IconBuildingStore,
      subItems: [
        { title: "Detail Gedung", url: "/dashboard/table/prianganbarat" },
      ],
    },
    {
      title: "Priangan Timur",
      icon: IconBuildingFactory,
      subItems: [
        { title: "Detail Gedung", url: "/dashboard/table/priangantimur" },
      ],
    },
  ],
};

export function AppSidebar({
  activePage,
  onNavItemClick,
  ...props
}: {
  activePage: string;
  onNavItemClick: (url: string) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Handle navigation & auto-active
  const handleNavClick = (url: string) => {
    router.push(url);
    onNavItemClick(url);
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      {/* Header */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#" className="flex items-center gap-2">
                <IconInnerShadowTop className="!size-5 text-primary" />
                <span className="text-base font-semibold">DiGI SLAM</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Content */}
      <SidebarContent>
        <NavMain
          items={data.navMain}
          currentPath={pathname}
          onNavClick={handleNavClick}
        />
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
