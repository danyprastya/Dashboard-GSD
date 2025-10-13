"use client";

import React, { useMemo } from "react";
import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/data-table";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

// Impor data dummy dan kolom
import allData from "../data.json";
import { columns } from "../columns"; // Impor dari file baru
import { Gedung } from "../columns"; // Impor tipe data

export default function Dashboard() {
  const pathname = usePathname();

  // Ambil nama daerah berdasarkan path, contoh:
  // "/dashboard/table/bandung" → "bandung"
  // "/dashboard/table/priangan-timur" → "priangan_timur"
  const areaKey = useMemo(() => {
    const segments = pathname.split("/");
    const lastSegment = segments[segments.length - 1];
    // Normalisasi nama jadi sesuai key di data.json
    return lastSegment?.replace("-", "_") || "bandung";
  }, [pathname]);

  // Ambil data dari file JSON sesuai area
  const currentData = allData[areaKey as keyof typeof allData] || [];

  // Buat judul halaman dari area aktif
  const activeTitle =
    areaKey.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      {/* Sidebar otomatis aktif berdasarkan route */}
      <AppSidebar />

      <SidebarInset>
        <SiteHeader activePage={activeTitle} />

        <div className="flex flex-1 flex-col p-4 md:p-6">
          <DataTable columns={columns} data={currentData} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
