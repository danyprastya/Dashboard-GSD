"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Filter } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

interface SiteHeaderProps {
  activePage: string;
  selectedArea?: string;
  selectedYear?: number;
  availableAreas?: string[];
  availableYears?: number[];
  onAreaChange?: (area: string) => void;
  onYearChange?: (year: number) => void;
}

export function SiteHeader({
  activePage,
  selectedArea,
  selectedYear,
  availableAreas = [],
  availableYears = [],
  onAreaChange,
  onYearChange,
}: SiteHeaderProps) {
  const pathname = usePathname();

  // Check if current route is dashboard root
  const isDashboardRoot = pathname === "/dashboard" || pathname === "/";

  // Generate breadcrumb items from pathname
  const breadcrumbItems = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const items = [];

    // Always start with Dashboard
    items.push({
      label: "Dashboard",
      href: "/dashboard",
      isLast: segments.length === 1,
    });

    // Add other segments
    if (segments.length > 1) {
      let currentPath = "";
      for (let i = 1; i < segments.length; i++) {
        currentPath += `/${segments[i]}`;
        const label = segments[i]
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        items.push({
          label,
          href: `/dashboard${currentPath}`,
          isLast: i === segments.length - 1,
        });
      }
    }

    return items;
  }, [pathname]);

  // Show filters only on dashboard root
  const showFilters =
    isDashboardRoot &&
    availableAreas.length > 0 &&
    availableYears.length > 0;

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b bg-white transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6 justify-between overflow-hidden">
        {/* Left Section - Title/Breadcrumb */}
        <div className="flex items-center gap-1 lg:gap-2 min-w-0 flex-shrink-0">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarTrigger className="-ml-1 flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Tutup/Buka Sidebar</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />

          {/* Breadcrumb Navigation */}
          {!isDashboardRoot ? (
            <Breadcrumb className="flex justify-center items-center text-center">
              <BreadcrumbList>
                {breadcrumbItems.map((item) => (
                  <div key={item.href} className="flex items-center">
                    <BreadcrumbItem>
                      {item.isLast ? (
                        <BreadcrumbPage className="font-medium">
                          {item.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink
                          href={item.href}
                          className="hover:text-foreground flex  flex-row transition-colors items-center justify-center"
                        >
                          {item.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!item.isLast && (
                      <BreadcrumbSeparator className="mx-2" />
                    )}
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          ) : (
            <h1 className="text-base font-medium truncate">{activePage}</h1>
          )}
        </div>

        {/* Right Section - Filters (only show on dashboard root) */}
        {showFilters && (
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 ml-auto">
            {/* Active Filter Indicator - Hidden on small screens */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
              <Filter className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
              <span className="text-xs font-medium text-blue-700 whitespace-nowrap">
                {selectedArea} • {selectedYear}
              </span>
            </div>

            <Separator orientation="vertical" className="h-6 hidden xl:block" />

            {/* Area Filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs md:text-sm font-medium text-gray-600 hidden md:block whitespace-nowrap">
                Area:
              </label>
              <Select value={selectedArea} onValueChange={onAreaChange}>
                <SelectTrigger className="w-[90px] md:w-[130px] h-9 text-xs md:text-sm border-gray-300 hover:border-blue-400 transition-colors">
                  <SelectValue placeholder="Pilih Area" />
                </SelectTrigger>
                <SelectContent>
                  {availableAreas.map((area) => (
                    <SelectItem
                      key={area}
                      value={area}
                      className="text-xs md:text-sm"
                    >
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Filter */}
            <div className="flex items-center gap-2">
              <label className="text-xs md:text-sm font-medium text-gray-600 hidden md:block whitespace-nowrap">
                Tahun:
              </label>
              <Select
                value={selectedYear?.toString()}
                onValueChange={(value) => onYearChange?.(parseInt(value))}
              >
                <SelectTrigger className="w-[80px] md:w-[110px] h-9 text-xs md:text-sm border-gray-300 hover:border-blue-400 transition-colors">
                  <SelectValue placeholder="Pilih Tahun" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem
                      key={year}
                      value={year.toString()}
                      className="text-xs md:text-sm"
                    >
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mobile Active Filter Indicator */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex xl:hidden items-center justify-center w-8 h-8 bg-blue-100 rounded-full flex-shrink-0">
                    <Filter className="h-4 w-4 text-blue-600" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">
                    {selectedArea} • {selectedYear}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
    </header>
  );
}