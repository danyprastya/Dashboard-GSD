"use client";
import { useEffect } from "react"
import React, { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { useRouter } from "next/navigation"
import data from "./data.json";

export default function Dashboard() {
  // 1. Buat state untuk melacak halaman yang aktif
  const [activePage, setActivePage] = useState("Dashboard"); // Default ke 'Dashboard'
  const router = useRouter()
    // useEffect(() => {
    //   const loggedIn = document.cookie.includes("isLoggedIn=true")
    //   if (!loggedIn) {
    //     router.push("/")
    //   }
    // }, [])

    useEffect(() => {
    const roleMatch = document.cookie.match(/userRole=([^;]+)/)
    const role = roleMatch ? roleMatch[1] : ''
    if (role !== 'admin') router.push('/')
  }, [])

  
  // Fungsi untuk logout
  const handleLogout = () => {
    // Hapus data session user
    localStorage.removeItem("user")
    document.cookie = "isLoggedIn=; path=/; max-age=0"
    document.cookie = "userRole=; path=/; max-age=0"

    // Arahkan ke halaman login
    router.push("/")
  }


  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      {/* 2. Berikan state dan fungsi ke AppSidebar */}
      <AppSidebar 
        variant="inset" 
        activePage={activePage} 
        onNavItemClick={setActivePage}
      />
      
      <SidebarInset>
        {/* 3. Berikan state ke SiteHeader */}
        <SiteHeader activePage={activePage} />
        
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* <SectionCards /> */}
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
      <button
        onClick={handleLogout}
        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
      >
        Logout
      </button>
    </SidebarProvider>
  );
}
