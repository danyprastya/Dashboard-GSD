"use client";

import React, { useMemo } from "react";
import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/data-table";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AreaCrawlerTrigger from "@/components/AreaCrawlerTrigger";

// Impor data dummy dan kolom
import allData from "../data.json";
import { columns } from "../columns";

export default function Dashboard() {
  const pathname = usePathname();

  // Ambil nama daerah berdasarkan path
  const areaKey = useMemo(() => {
    const segments = pathname.split("/");
    const lastSegment = segments[segments.length - 1];
    return lastSegment?.replace("-", "_") || "bandung";
  }, [pathname]);

  // Ambil data dari file JSON sesuai area
  const currentData = allData[areaKey as keyof typeof allData] || [];

  // Buat judul halaman dari area aktif
  const activeTitle = areaKey
    .replace("_", " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <SidebarProvider>
      {/* Sidebar without props - will auto-detect active page */}
      <AppSidebar />
      
      <SidebarInset>
        {/* SiteHeader without filter props - will show breadcrumb only */}
        <SiteHeader activePage={activeTitle} />
        
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Crawler Trigger Button - Dinamis per area */}
          <AreaCrawlerTrigger 
            areaKey={areaKey}
            areaTitle={activeTitle}
          />
          
          {/* Data Table */}
          <DataTable 
            columns={columns} 
            data={currentData}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}