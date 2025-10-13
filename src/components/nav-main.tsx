"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Icon } from "@tabler/icons-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; // 1. Impor Accordion
import { cn } from "@/lib/utils";

// 2. Perbarui tipe data untuk mendukung sub-item
interface NavItem {
  title: string;
  icon?: Icon;
  subItems: {
    title: string;
    url: string;
  }[];
}

interface NavMainProps {
  items: NavItem[];
}

export function NavMain({ items }: NavMainProps) {
  const pathname = usePathname();

  return (
    // 3. Gunakan Accordion sebagai kontainer utama
    <Accordion
      type="multiple"
      className="w-full"
      // Otomatis membuka menu utama yang relevan dengan URL saat ini
      defaultValue={items
        .filter((item) =>
          item.subItems.some((sub) => pathname.startsWith(sub.url))
        )
        .map((item) => item.title)}
    >
      {items.map((item) => {
        const Icon = item.icon;
        // Cek apakah salah satu sub-item dari menu utama ini sedang aktif
        const isParentActive = item.subItems.some((sub) =>
          pathname.startsWith(sub.url)
        );

        return (
          <AccordionItem
            value={item.title}
            key={item.title}
            className="border-b-0"
          >
            <AccordionTrigger
              className={cn(
                "py-2 px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:no-underline rounded-md",
                isParentActive && "bg-muted text-foreground" // Highlight menu utama jika aktif
              )}
            >
              <div className="flex items-center gap-3">
                {Icon && <Icon className="h-4 w-4" />}
                <span>{item.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pl-8 pt-2 flex flex-col gap-1 space-y-1">
              {item.subItems.map((subItem) => {
                const isSubItemActive = pathname === subItem.url;
                return (
                    <Link
                      key={subItem.url}
                      href={subItem.url}
                      className={cn(
                        "py-1.5 px-3 text-sm text-muted-foreground hover:text-foreground",
                        isSubItemActive &&
                          "bg-primary text-primary-foreground hover:text-primary-foreground" // Highlight sub-menu jika aktif
                      )}
                    >
                      {subItem.title}
                    </Link>
                );
              })}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
