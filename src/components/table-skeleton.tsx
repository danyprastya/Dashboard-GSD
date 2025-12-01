import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface TableSkeletonProps {
  rows?: number
  columns?: number
  showHeader?: boolean
}

export function TableSkeleton({ 
  rows = 10, 
  columns = 6, 
  showHeader = true 
}: TableSkeletonProps) {
  return (
    <div className="space-y-4">
      {/* Search and Filter Skeleton */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 flex-1 max-w-md" />
        <Skeleton className="h-10 w-[120px]" />
      </div>

      {/* Filters Skeleton */}
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 w-[200px]" />
        <Skeleton className="h-10 w-[150px]" />
        <Skeleton className="h-10 w-[150px]" />
        <Skeleton className="h-10 w-[100px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-md border">
        <Table>
          {showHeader && (
            <TableHeader>
              <TableRow>
                {[...Array(columns)].map((_, i) => (
                  <TableHead key={i}>
                    <Skeleton className="h-5 w-full max-w-[120px]" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
          )}
          <TableBody>
            {[...Array(rows)].map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {[...Array(columns)].map((_, colIndex) => (
                  <TableCell key={colIndex}>
                    <Skeleton 
                      className="h-5" 
                      style={{ 
                        width: colIndex === 0 ? '40px' : 
                               colIndex === 1 ? '100px' : 
                               colIndex === columns - 1 ? '80px' :
                               '120px' 
                      }} 
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-[200px]" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  )
}
