"use client";

import React, { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTableOverall } from "@/components/data-table-overall";
import { SectionCards } from "@/components/section-cards";
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

import data from "./data-overall.json";

export default function Dashboard() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [selectedYear, setSelectedYear] = useState<number>(2025); // Default tahun 2025

  // Get available years from data
  const availableYears = data.map(item => item.tahun);

  // Get data for selected year
  const selectedYearData = data.find(item => item.tahun === selectedYear);

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

              {/* Chart */}
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive 
                  data={selectedYearData?.data || []} 
                  year={selectedYear}
                />
              </div>

              {/* Table */}
              <div className="px-4 lg:px-6">
                <DataTableOverall data={data} selectedYear={selectedYear} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}