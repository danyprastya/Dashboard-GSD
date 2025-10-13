"use client";

import * as React from "react";
import {
  IconInnerShadowTop,
  IconBuilding,
  IconBuildingCommunity,
  IconBuildingFactory,
  IconBuildingStore,
} from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
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

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Bandung",
      icon: IconBuilding,
      subItems: [
        { title: "Detail Gedung", url: "/bandung/detail" },
        { title: "Gedung Rusak", url: "/bandung/rusak" },
      ],
    },
    {
      title: "Kawasan Corpu",
      icon: IconBuildingCommunity,
      subItems: [
        { title: "Detail Gedung", url: "/corpu/detail" },
        { title: "Gedung Rusak", url: "/corpu/rusak" },
      ],
    },
    {
      title: "Priangan Timur",
      icon: IconBuildingFactory,
      subItems: [
        { title: "Detail Gedung", url: "/priangan-timur/detail" },
        { title: "Gedung Rusak", url: "/priangan-timur/rusak" },
      ],
    },
    {
      title: "Priangan Barat",
      icon: IconBuildingStore,
      subItems: [
        { title: "Detail Gedung", url: "/priangan-barat/detail" },
        { title: "Gedung Rusak", url: "/priangan-barat/rusak" },
      ],
    },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onNavItemClick: (title: string) => void;
  activePage: string;
}

export function AppSidebar({
  onNavItemClick,
  activePage,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">DiGI SLAM</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={data.navMain}
          activePage={activePage}
          onNavItemClick={onNavItemClick}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
