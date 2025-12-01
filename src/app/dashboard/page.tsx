"use client";
import { useEffect, useState, useCallback } from "react"
import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTableOverall } from "@/components/data-table-overall";
import { StatsCards } from "@/components/stats-cards";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation"
import data from "./data-overall.json";

export default function Dashboard() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [statsData, setStatsData] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const router = useRouter()

  // Available years (hardcoded for now, bisa diganti dengan API)
  const availableYears = [2024, 2025, 2026];
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

  // Fetch stats data dari API
  const fetchStatsData = useCallback(async () => {
    try {
      setStatsLoading(true)
      const response = await fetch(`/api/overview/monthly?year=${selectedYear}`)
      const result = await response.json()
      
      if (result.success && result.totals) {
        setStatsData({
          totalGedung: result.totals.checklist || 0,
          approved1_20: result.totals.period_1_20?.approved || 0,
          approved21_30: result.totals.period_21_30?.approved || 0,
          pending: result.totals.period_1_20?.submitted || 0,
          open: result.totals.period_1_20?.open || 0,
          error: (result.totals.period_21_30?.error || 0) + (result.totals.period_21_30?.not_found || 0)
        })
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setStatsLoading(false)
    }
  }, [selectedYear])

  useEffect(() => {
    fetchStatsData()
  }, [fetchStatsData])

  
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
      suppressHydrationWarning
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
        <SiteHeader activePage={activePage} />
        
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Year Filter */}
              <div className="px-4 lg:px-6">
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-700">
                    Filter Tahun:
                  </label>
                  <Select 
                    value={selectedYear.toString()} 
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Pilih Tahun" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Stats Cards */}
              {/* <StatsCards data={statsData} loading={statsLoading} /> */}

              {/* Chart */}
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive 
                  year={selectedYear}
                />
              </div>

              {/* Table */}
              <div className="px-4 lg:px-6">
                <DataTableOverall selectedYear={selectedYear} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
      {/* <button
        onClick={handleLogout}
        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
      >
        Logout
      </button> */}
    </SidebarProvider>
  );
}