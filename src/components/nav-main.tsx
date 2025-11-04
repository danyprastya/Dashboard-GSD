"use client";

import { ChevronRight } from "lucide-react";
import * as React from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url?: string;
  icon?: React.ElementType;
  subItems?: {
    title: string;
    url: string;
  }[];
}

interface NavMainProps {
  items: NavItem[];
  currentPath: string;
  onNavClick: (url: string) => void;
}

export function NavMain({ items, currentPath, onNavClick }: NavMainProps) {
  const [openItems, setOpenItems] = React.useState<Record<string, boolean>>({});

  // Initialize open state based on current path
  React.useEffect(() => {
    const initialOpenState: Record<string, boolean> = {};
    
    items.forEach((item) => {
      if (item.subItems) {
        // Check if any subItem matches current path
        const hasActiveSubItem = item.subItems.some(
          (subItem) => currentPath === subItem.url || currentPath.startsWith(subItem.url)
        );
        initialOpenState[item.title] = hasActiveSubItem;
      }
    });
    
    setOpenItems(initialOpenState);
  }, [currentPath, items]);

  const handleToggle = (title: string) => {
    setOpenItems((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const isActiveItem = (url: string) => {
    return currentPath === url || currentPath.startsWith(url);
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          // Item without subItems (Dashboard)
          if (!item.subItems) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={isActiveItem(item.url!)}
                  onClick={() => onNavClick(item.url!)}
                >
                  <a href={item.url}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          // Item with subItems
          const hasActiveChild = item.subItems.some((subItem) =>
            isActiveItem(subItem.url)
          );

          return (
            <Collapsible
              key={item.title}
              asChild
              open={openItems[item.title]}
              onOpenChange={() => handleToggle(item.title)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item.title}
                    isActive={hasActiveChild}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.subItems.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isActiveItem(subItem.url)}
                          onClick={() => onNavClick(subItem.url)}
                        >
                          <a href={subItem.url}>
                            <span>{subItem.title}</span>
                          </a>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}