"use client"

import * as React from "react"
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MultiSelect } from "@/components/ui/multi-select"
import { Search, Filter, RotateCcw, Check, Calendar, ListFilter } from "lucide-react"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  availableMonths?: string[]
  filters?: {
    bulan: string[]
    period_1_20: string
    period_21_30: string
  }
  onFilterChange?: (filters: {
    bulan: string[]
    period_1_20: string
    period_21_30: string
  }) => void
}

export function DataTable<TData, TValue>({ 
  columns, 
  data,
  availableMonths = [],
  filters: externalFilters,
  onFilterChange
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [pageSize, setPageSize] = React.useState(10)
  const [pageIndex, setPageIndex] = React.useState(0)
  
  // Filter states - fully controlled by component, not synced from parent
  const [selectedMonths, setSelectedMonths] = React.useState<string[]>([])
  const [selectedPeriod1, setSelectedPeriod1] = React.useState<string>("SEMUA")
  const [selectedPeriod2, setSelectedPeriod2] = React.useState<string>("SEMUA")
  
  // Temporary filter states (before apply)
  const [tempMonths, setTempMonths] = React.useState<string[]>([])
  const [tempPeriod1, setTempPeriod1] = React.useState<string>("SEMUA")
  const [tempPeriod2, setTempPeriod2] = React.useState<string>("SEMUA")
  
  // Track if we've initialized to prevent re-initialization on re-renders
  const isInitialized = React.useRef(false)
  // Track if we're currently notifying parent to prevent circular updates
  const isNotifying = React.useRef(false)

  // Initialize filters from external filters only once on mount
  React.useEffect(() => {
    console.log('[Child Init] isInitialized:', isInitialized.current, 'externalFilters:', externalFilters);
    if (!isInitialized.current && externalFilters) {
      console.log('[Child Init] Initializing with external filters');
      // Initialize both selected and temp states from external
      setSelectedMonths(externalFilters.bulan)
      setSelectedPeriod1(externalFilters.period_1_20)
      setSelectedPeriod2(externalFilters.period_21_30)
      setTempMonths(externalFilters.bulan)
      setTempPeriod1(externalFilters.period_1_20)
      setTempPeriod2(externalFilters.period_21_30)
      isInitialized.current = true
    }
  }, [externalFilters])

  // Apply filter button handler
  const handleApplyFilter = () => {
    console.log('[Child Apply] Applying filters:', { tempMonths, tempPeriod1, tempPeriod2 })
    isNotifying.current = true
    setSelectedMonths(tempMonths)
    setSelectedPeriod1(tempPeriod1)
    setSelectedPeriod2(tempPeriod2)
  }

  // Reset filter button handler
  const handleResetFilter = () => {
    setTempMonths([])
    setTempPeriod1("SEMUA")
    setTempPeriod2("SEMUA")
    setSelectedMonths([])
    setSelectedPeriod1("SEMUA")
    setSelectedPeriod2("SEMUA")
  }

  // Check if filters have changed (to enable/disable apply button)
  const hasFilterChanges = React.useMemo(() => {
    const monthsChanged = JSON.stringify(tempMonths.sort()) !== JSON.stringify(selectedMonths.sort())
    const period1Changed = tempPeriod1 !== selectedPeriod1
    const period2Changed = tempPeriod2 !== selectedPeriod2
    return monthsChanged || period1Changed || period2Changed
  }, [tempMonths, tempPeriod1, tempPeriod2, selectedMonths, selectedPeriod1, selectedPeriod2])

  // Notify parent when filters change (only when applied)
  React.useEffect(() => {
    // Only notify if initialized (prevent initial empty state notification)
    if (!isInitialized.current) {
      console.log('[Child Notify] Skipping - not initialized yet');
      return;
    }

    // Only notify if this is from user action, not from external sync
    if (!isNotifying.current) {
      console.log('[Child Notify] Skipping - not from user action');
      return;
    }

    console.log('[Child Notify] Selected filters changed, notifying parent:', { 
      selectedMonths, selectedPeriod1, selectedPeriod2 
    })

    if (onFilterChange) {
      onFilterChange({
        bulan: selectedMonths,
        period_1_20: selectedPeriod1,
        period_21_30: selectedPeriod2
      })
    }

    // Reset the flag after notifying
    isNotifying.current = false;
    console.log('[Child Notify] Notification complete, flag reset');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonths, selectedPeriod1, selectedPeriod2])

  const statusOptionsPeriod1 = ["SEMUA", "OPEN", "SUBMITTED", "APPROVED"]
  const statusOptionsPeriod2 = [
    "SEMUA",
    "OPEN",
    "SUBMITTED",
    "APPROVED",
    "NOT APPROVED",
    "ERROR",
    "NONE",
    "NOT FOUND"
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const newState = updater({ pageIndex, pageSize })
        setPageIndex(newState.pageIndex)
        setPageSize(newState.pageSize)
      }
    },
    state: {
      sorting,
      globalFilter,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    manualPagination: false,
  })

  return (
    <div className="space-y-4">
      {/* Search and Filter Section */}
      <div className="flex flex-col gap-3 sticky top-0 z-10 bg-background pt-4">
        {/* Search Box and Rows per page */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari data..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="pl-9"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ListFilter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Baris per halaman</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(val) => {
                const newSize = Number(val)
                setPageSize(newSize)
                setPageIndex(0)
              }}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filter Section */}
        <div className="rounded-lg border bg-card">
          <div className="flex items-center gap-2 border-b px-4 py-3 bg-muted/50">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Filter Data</h3>
            {(selectedMonths.length > 0 || selectedPeriod1 !== "SEMUA" || selectedPeriod2 !== "SEMUA") && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                Aktif
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-end gap-3 p-4">
            {/* Bulan Filter (Multi-select) */}
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Bulan
              </label>
              <MultiSelect
                options={availableMonths}
                selected={tempMonths}
                onChange={setTempMonths}
                placeholder="Semua Bulan"
                maxDisplay={2}
              />
            </div>

            {/* Period 1-20 Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Status Periode 1-20
              </label>
              <Select
                value={tempPeriod1}
                onValueChange={setTempPeriod1}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptionsPeriod1.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Period 21-30 Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Status Periode 21-30
              </label>
              <Select
                value={tempPeriod2}
                onValueChange={setTempPeriod2}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptionsPeriod2.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilter}
                disabled={selectedMonths.length === 0 && selectedPeriod1 === "SEMUA" && selectedPeriod2 === "SEMUA"}
                className="gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleApplyFilter}
                disabled={!hasFilterChanges}
                className="gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                Terapkan Filter
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Tidak ada data ditemukan.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-4 py-4">
        <div className="text-sm text-muted-foreground">
          Menampilkan{" "}
          <strong>
            {table.getState().pagination.pageIndex * pageSize + 1} -{" "}
            {Math.min((table.getState().pagination.pageIndex + 1) * pageSize, data.length)}
          </strong>{" "}
          dari <strong>{data.length}</strong> data
        </div>

        <div className="flex items-center gap-1">
          {/* First Page Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8"
          >
            «
          </Button>

          {/* Previous Page Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8"
          >
            ‹
          </Button>

          {/* Page Numbers */}
          {(() => {
            const currentPage = table.getState().pagination.pageIndex;
            const totalPages = table.getPageCount();
            const pages: (number | string)[] = [];

            if (totalPages <= 7) {
              // Show all pages if 7 or fewer
              for (let i = 0; i < totalPages; i++) {
                pages.push(i);
              }
            } else {
              // Always show first page
              pages.push(0);

              if (currentPage <= 3) {
                // Near start
                for (let i = 1; i <= 4; i++) {
                  pages.push(i);
                }
                pages.push("...");
                pages.push(totalPages - 1);
              } else if (currentPage >= totalPages - 4) {
                // Near end
                pages.push("...");
                for (let i = totalPages - 5; i < totalPages - 1; i++) {
                  pages.push(i);
                }
                pages.push(totalPages - 1);
              } else {
                // Middle
                pages.push("...");
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                  pages.push(i);
                }
                pages.push("...");
                pages.push(totalPages - 1);
              }
            }

            return pages.map((page, index) => {
              if (page === "...") {
                return (
                  <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                    ...
                  </span>
                );
              }

              const pageNumber = page as number;
              return (
                <Button
                  key={pageNumber}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  size="icon"
                  onClick={() => table.setPageIndex(pageNumber)}
                  className="h-8 w-8"
                >
                  {pageNumber + 1}
                </Button>
              );
            });
          })()}

          {/* Next Page Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 w-8"
          >
            ›
          </Button>

          {/* Last Page Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="h-8 w-8"
          >
            »
          </Button>
        </div>
      </div>
    </div>
  )
}
