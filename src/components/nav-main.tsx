/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface NavMainProps {
  items: {
    title: string
    icon: React.ElementType
    url?: string
    subItems?: { title: string; url: string }[]
  }[]
  currentPath: string
  onNavClick: (url: string) => void
}

export function NavMain({ items }: NavMainProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleNavClick = (url: string) => {
    router.push(url);
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Daftar Area</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isParentActive =
            pathname === item.url ||
            item.subItems?.some((sub) => pathname === sub.url);

          const Icon = item.icon;

          // jika tidak punya submenu → tampilkan tombol langsung
          if (!item.subItems) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  onClick={() => handleNavClick(item.url!)}
                  tooltip={isMounted ? item.title : undefined}
                  className={cn(
                    "transition-colors",
                    isParentActive &&
                      "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                  suppressHydrationWarning
                >
                  {Icon && <Icon className="h-5 w-5" />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          // jika punya submenu → gunakan Collapsible
          return (
            <Collapsible
              key={item.title}
              asChild
              open={openMenu === item.title}
              onOpenChange={() =>
                setOpenMenu(openMenu === item.title ? null : item.title)
              }
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={isMounted ? item.title : undefined}
                    className={cn(
                      "transition-colors",
                      isParentActive &&
                        "bg-primary/10 text-primary hover:bg-primary/20"
                    )}
                    suppressHydrationWarning
                  >
                    {Icon && <Icon className="h-5 w-5" />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.subItems.map((sub) => {
                      const isSubActive = pathname === sub.url;
                      return (
                        <SidebarMenuSubItem key={sub.title}>
                          <SidebarMenuSubButton
                            asChild
                            className={cn(
                              isSubActive &&
                                "bg-primary/10 text-primary hover:bg-primary/20"
                            )}
                          >
                            <button onClick={() => handleNavClick(sub.url)} suppressHydrationWarning>
                              <span>{sub.title}</span>
                            </button>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
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
