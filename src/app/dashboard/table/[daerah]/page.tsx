"use client";

import React, { useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { DataTable } from "@/components/data-table";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TableSkeleton } from "@/components/table-skeleton";

// Impor kolom dan tipe data
import { columns, Gedung } from "../columns";

export default function Dashboard() {
  const pathname = usePathname();
  const [data, setData] = useState<Gedung[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [filterState, setFilterState] = useState({
    bulan: [] as string[],
    period_1_20: "SEMUA",
    period_21_30: "SEMUA"
  });

  // Memoize filters object to prevent unnecessary re-renders
  const filters = React.useMemo(() => filterState, [filterState]);

  // Memoize filter change handler to prevent infinite loop
  const handleFilterChange = React.useCallback((newFilters: typeof filters) => {
    console.log('[Parent handleFilterChange] Received new filters:', newFilters);
    setFilterState(prev => {
      // Only update if actually changed
      const bulanChanged = JSON.stringify(prev.bulan.sort()) !== JSON.stringify(newFilters.bulan.sort());
      const period1Changed = prev.period_1_20 !== newFilters.period_1_20;
      const period2Changed = prev.period_21_30 !== newFilters.period_21_30;
      
      console.log('[Parent handleFilterChange] Changes detected:', { bulanChanged, period1Changed, period2Changed });
      
      if (bulanChanged || period1Changed || period2Changed) {
        console.log('[Parent handleFilterChange] Updating filters to:', newFilters);
        return newFilters;
      }
      console.log('[Parent handleFilterChange] No changes, keeping prev');
      return prev;
    });
  }, []);

  // Ambil nama daerah berdasarkan path, contoh:
  // "/dashboard/table/bandung" → "bandung"
  // "/dashboard/table/priangan-timur" → "priangantimur"
  const areaKey = useMemo(() => {
    const segments = pathname.split("/");
    const lastSegment = segments[segments.length - 1];
    // Normalisasi nama: remove hyphens
    return lastSegment?.replace(/-/g, "") || "bandung";
  }, [pathname]);

  // Buat judul halaman dari area aktif
  const activeTitle = useMemo(() => {
    const titleMap: Record<string, string> = {
      bandung: "Bandung",
      corpu: "Kawasan Corpu",
      prianganbarat: "Priangan Barat",
      priangantimur: "Priangan Timur",
    };
    return titleMap[areaKey] || "Dashboard";
  }, [areaKey]);

  // Fetch available months saat component mount
  useEffect(() => {
    const fetchMonths = async () => {
      try {
        const response = await fetch("/api/gedung/filter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kawasan: areaKey })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setAvailableMonths(result.months);
          }
        }
      } catch (err) {
        console.error("Error fetching months:", err);
      }
    };

    fetchMonths();
  }, [areaKey]);

  // Fetch data with filters
  useEffect(() => {
    console.log('[Parent useEffect] Triggered with filters:', filterState);
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build query params
        const params = new URLSearchParams();
        params.append("kawasan", areaKey);
        
        if (filterState.bulan.length > 0) {
          params.append("bulan", filterState.bulan.join(","));
        }
        if (filterState.period_1_20 !== "SEMUA") {
          params.append("period_1_20", filterState.period_1_20);
        }
        if (filterState.period_21_30 !== "SEMUA") {
          params.append("period_21_30", filterState.period_21_30);
        }

        // Gunakan endpoint filter jika ada filter, endpoint biasa jika tidak
        const hasFilters = filterState.bulan.length > 0 || 
                          filterState.period_1_20 !== "SEMUA" || 
                          filterState.period_21_30 !== "SEMUA";
        
        const endpoint = hasFilters 
          ? `/api/gedung/filter?${params.toString()}`
          : `/api/gedung?kawasan=${areaKey}`;
        
        console.log(`[Parent useEffect] Fetching data: ${endpoint}`);
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
          console.log(`[Parent useEffect] Loaded ${result.data.length} records`);
        } else {
          throw new Error(result.error || "Failed to load data");
        }
      } catch (err) {
        console.error("[Parent useEffect] Error fetching gedung data:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      } finally {
        setLoading(false);
        console.log('[Parent useEffect] Loading complete');
      }
    };

    fetchData();
  }, [areaKey, filterState]);

  // Handler untuk navigasi dari sidebar
  const handleNavItemClick = (url: string) => {
    // Navigation handled by Next.js Link component
    // This is just a placeholder to satisfy the prop requirement
  };

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
      {/* Sidebar otomatis aktif berdasarkan route */}
      <AppSidebar 
        activePage={activeTitle}
        onNavItemClick={handleNavItemClick}
      />

      <SidebarInset>
        <SiteHeader activePage={activeTitle} />

        <div className="flex flex-1 flex-col p-4 md:p-6">
          {loading ? (
            <TableSkeleton rows={10} columns={6} />
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-red-500 font-semibold">Error: {error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Reload
                </button>
              </div>
            </div>
          ) : (
            <DataTable 
              columns={columns} 
              data={data}
              availableMonths={availableMonths}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
