"use client";
import { useEffect } from "react"
import React, { useState, useMemo } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTableOverall } from "@/components/data-table-overall";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { useRouter } from "next/navigation"
import data from "./data-overall.json";

export default function Dashboard() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [selectedArea, setSelectedArea] = useState<string>("Bandung"); // Default Area A
  const [selectedYear, setSelectedYear] = useState<number>(2025); // Default tahun 2025

  // Get unique areas from data
  const availableAreas = useMemo(() => {
    const areas = [...new Set(data.map(item => item.area))];
    return areas.sort();
  }, []);

  // Get unique years from data
  const availableYears = useMemo(() => {
    const years = [...new Set(data.map(item => item.tahun))];
    return years.sort((a, b) => a - b);
  }, []);

  // Get data for selected area and year
  const selectedData = useMemo(() => {
    return data.find(item => item.area === selectedArea && item.tahun === selectedYear);
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

  }, [selectedArea, selectedYear]);

  // Filter data by area for table (all years)
  const filteredDataByArea = useMemo(() => {
    return data.filter(item => item.area === selectedArea);
  }, [selectedArea]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        activePage={activePage} 
        onNavItemClick={setActivePage}
      />
      
      <SidebarInset>
        <SiteHeader 
          activePage={activePage}
          selectedArea={selectedArea}
          selectedYear={selectedYear}
          availableAreas={availableAreas}
          availableYears={availableYears}
          onAreaChange={setSelectedArea}
          onYearChange={setSelectedYear}
        />
        
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Chart */}
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive 
                  data={selectedData?.data || []} 
                  year={selectedYear}
                  area={selectedArea}
                />
              </div>

              {/* Table */}
              <div className="px-4 lg:px-6">
                <DataTableOverall 
                  data={filteredDataByArea} 
                  selectedYear={selectedYear}
                  selectedArea={selectedArea}
                />
              </div>
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