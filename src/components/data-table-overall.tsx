"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search, RefreshCw, ChevronDown, ChevronRight, Download, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface Gedung {
  kode_gedung: string;
  nama_lokasi: string;
  kawasan: string;
  kelas_berbayar?: string;
  period_1_20?: string;
  period_21_30?: string;
  month?: string;
}

interface KawasanBreakdown {
  kawasan: string;
  checklist: number;
  period_1_20: {
    open: number;
    submitted: number;
    approved: number;
  };
  period_21_30: {
    none: number;
    error: number;
    not_approved: number;
    approved: number;
    not_found: number;
  };
}

interface MonthlyData {
  bulan: string;
  checklist: number;
  period_1_20: {
    open: number;
    submitted: number;
    approved: number;
  };
  period_21_30: {
    none: number;
    error: number;
    not_approved: number;
    approved: number;
    not_found: number;
  };
  breakdown: KawasanBreakdown[];
}

interface ApiResponse {
  success: boolean;
  year: number;
  data: MonthlyData[];
  totals: {
    checklist: number;
    period_1_20: {
      open: number;
      submitted: number;
      approved: number;
    };
    period_21_30: {
      none: number;
      error: number;
      not_approved: number;
      approved: number;
      not_found: number;
    };
  };
  error?: string;
}

interface DataTableOverallProps {
  selectedYear: number;
}

export function DataTableOverall({ selectedYear }: DataTableOverallProps) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [apiData, setApiData] = React.useState<ApiResponse | null>(null)
  const [expandedMonths, setExpandedMonths] = React.useState<Set<string>>(new Set())
  const [isMounted, setIsMounted] = React.useState(false)

  // Dialog state
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [dialogLoading, setDialogLoading] = React.useState(false)
  const [dialogData, setDialogData] = React.useState<Gedung[]>([])
  const [dialogSearch, setDialogSearch] = React.useState("")
  const [dialogParams, setDialogParams] = React.useState<{
    kawasan: string;
    bulan: string;
    period: string;
    status: string;
    count: number;
  } | null>(null)

  // Set mounted flag untuk mencegah hydration mismatch
  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  // Toggle expand/collapse for a month
  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => {
      const newSet = new Set(prev)
      if (newSet.has(month)) {
        newSet.delete(month)
      } else {
        newSet.add(month)
      }
      return newSet
    })
  }

  // Mapping kawasan untuk display yang lebih baik
  const kawasanDisplayMap: { [key: string]: string } = {
    'BANDUNG': 'Bandung',
    'CORPU': 'Corpu',
    'PRIANGANBARAT': 'Priangan Barat',
    'PRIANGANTIMUR': 'Priangan Timur'
  }

  // Handle badge click to open detail dialog
  const handleBadgeClick = async (
    kawasan: string,
    bulan: string,
    period: 'period_1_20' | 'period_21_30',
    status: string,
    count: number,
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // Prevent row click
    
    if (count === 0) return; // Don't open dialog for 0 count

    // Set dialog params
    setDialogParams({
      kawasan,
      bulan,
      period: period === 'period_1_20' ? '1-20' : '21-30',
      status,
      count
    });

    setDialogOpen(true);
    setDialogLoading(true);
    setDialogData([]);
    setDialogSearch("");

    try {
      // Build API URL
      const params = new URLSearchParams();
      params.append('kawasan', kawasan.toLowerCase());
      params.append('bulan', bulan);
      params.append(period, status);

      const response = await fetch(`/api/gedung/filter?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch gedung data');
      }

      const result = await response.json();
      
      if (result.success) {
        setDialogData(result.data || []);
      } else {
        throw new Error(result.error || 'Failed to load data');
      }
    } catch (err: any) {
      console.error('Error fetching gedung detail:', err);
      setError(err.message);
    } finally {
      setDialogLoading(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!dialogData.length || !dialogParams) return;

    const headers = ['Kode Gedung', 'Nama Lokasi', 'Kelas', 'Status Periode 1-20', 'Status Periode 21-30'];
    const csvContent = [
      headers.join(','),
      ...dialogData.map(item => [
        item.kode_gedung,
        `"${item.nama_lokasi}"`, // Quote nama lokasi untuk handle commas
        item.kelas_berbayar || '',
        item.period_1_20 || '',
        item.period_21_30 || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `detail_${dialogParams.kawasan}_${dialogParams.bulan}_${dialogParams.period}_${dialogParams.status}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter dialog data based on search
  const filteredDialogData = React.useMemo(() => {
    if (!dialogSearch) return dialogData;
    
    const searchLower = dialogSearch.toLowerCase();
    return dialogData.filter(item => 
      item.kode_gedung?.toLowerCase().includes(searchLower) ||
      item.nama_lokasi?.toLowerCase().includes(searchLower)
    );
  }, [dialogData, dialogSearch]);

  // Helper function to render clickable badge
  const renderClickableBadge = (
    count: number,
    colorClasses: string,
    kawasan: string,
    bulan: string,
    period: 'period_1_20' | 'period_21_30',
    status: string
  ) => {
    const isClickable = count > 0;
    
    return (
      <span 
        className={`inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full text-xs font-medium transition-all ${colorClasses} ${
          isClickable 
            ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 hover:shadow-md' 
            : 'opacity-50 cursor-not-allowed'
        }`}
        onClick={(e) => isClickable && handleBadgeClick(kawasan, bulan, period, status, count, e)}
        title={isClickable ? `Klik untuk lihat ${count} gedung` : 'Tidak ada data'}
      >
        {count}
      </span>
    );
  };

  // Fetch data dari API
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/overview/monthly?year=${selectedYear}`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result: ApiResponse = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data')
      }
      
      setApiData(result)
    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [selectedYear])

  // Fetch data on mount dan ketika year berubah
  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filter data based on search
  const filteredData = React.useMemo(() => {
    if (!apiData?.data) return []
    
    if (!searchTerm) return apiData.data

    return apiData.data.filter(item => 
      item.bulan.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [apiData, searchTerm])

  // Calculate filtered totals
  const totals = React.useMemo(() => {
    if (!filteredData.length) {
      return {
        checklist: 0,
        period_1_20: { open: 0, submitted: 0, approved: 0 },
        period_21_30: { none: 0, error: 0, not_approved: 0, approved: 0, not_found: 0 }
      }
    }

    return filteredData.reduce((acc, item) => ({
      checklist: acc.checklist + item.checklist,
      period_1_20: {
        open: acc.period_1_20.open + item.period_1_20.open,
        submitted: acc.period_1_20.submitted + item.period_1_20.submitted,
        approved: acc.period_1_20.approved + item.period_1_20.approved,
      },
      period_21_30: {
        none: acc.period_21_30.none + item.period_21_30.none,
        error: acc.period_21_30.error + item.period_21_30.error,
        not_approved: acc.period_21_30.not_approved + item.period_21_30.not_approved,
        approved: acc.period_21_30.approved + item.period_21_30.approved,
        not_found: acc.period_21_30.not_found + item.period_21_30.not_found,
      }
    }), {
      checklist: 0,
      period_1_20: { open: 0, submitted: 0, approved: 0 },
      period_21_30: { none: 0, error: 0, not_approved: 0, approved: 0, not_found: 0 }
    })
  }, [filteredData])

  return (
    <Card suppressHydrationWarning>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle>Data Keseluruhan {selectedYear}</CardTitle>
            <CardDescription>Detail data per bulan untuk tahun {selectedYear}</CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari bulan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                disabled={loading}
                suppressHydrationWarning
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchData}
              disabled={loading}
              title="Refresh data"
              suppressHydrationWarning
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!isMounted ? (
          // Server-side render: show minimal placeholder
          <div className="h-[400px]" />
        ) : loading ? (
          // Client-side loading: show skeleton
          <div className="space-y-4">
            {/* Table Header Skeleton */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-[200px]" />
              <Skeleton className="h-10 w-[100px]" />
            </div>
            
            {/* Table Skeleton */}
            <div className="border rounded-lg overflow-hidden">
              {/* Header Row */}
              <div className="flex gap-2 p-4 bg-gray-50 border-b">
                <Skeleton className="h-8 w-[180px]" />
                <Skeleton className="h-8 w-[100px]" />
                <Skeleton className="h-8 flex-1" />
              </div>
              
              {/* Data Rows */}
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex gap-2 p-4 border-b last:border-b-0">
                  <Skeleton className="h-6 w-[180px]" />
                  <Skeleton className="h-6 w-[100px]" />
                  <div className="flex-1 flex gap-2">
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-6 w-12" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <p className="font-semibold">❌ Error: {error}</p>
            <Button onClick={fetchData} className="mt-4" variant="outline">
              Coba Lagi
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead rowSpan={2} className="font-semibold align-middle border-r w-[180px]">Bulan</TableHead>
                  <TableHead rowSpan={2} className="text-center font-semibold align-middle border-r w-[100px]">Checklist</TableHead>
                  <TableHead colSpan={3} className="text-center font-semibold border-r bg-blue-50">Periode 1-20</TableHead>
                  <TableHead colSpan={5} className="text-center font-semibold bg-purple-50">Periode 21-30</TableHead>
                </TableRow>
                <TableRow>
                  {/* Periode 1-20 Sub Headers */}
                  <TableHead className="text-center font-semibold text-xs">Open</TableHead>
                  <TableHead className="text-center font-semibold text-xs">Submitted</TableHead>
                  <TableHead className="text-center font-semibold text-xs border-r">Approved</TableHead>
                  
                  {/* Periode 21-30 Sub Headers */}
                  <TableHead className="text-center font-semibold text-xs">None</TableHead>
                  <TableHead className="text-center font-semibold text-xs">Error</TableHead>
                  <TableHead className="text-center font-semibold text-xs">Not Approved</TableHead>
                  <TableHead className="text-center font-semibold text-xs">Approved</TableHead>
                  <TableHead className="text-center font-semibold text-xs">Not Found</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item, index) => (
                  <React.Fragment key={index}>
                    {/* Parent Row - Bulan */}
                    <TableRow className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleMonth(item.bulan)}>
                      <TableCell className="font-medium border-r w-[180px]">
                        <div className="flex items-center gap-2">
                          {expandedMonths.has(item.bulan) ? (
                            <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          )}
                          <span className="font-semibold">{item.bulan}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center border-r w-[100px]">
                        <span className="inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                          {item.checklist}
                        </span>
                      </TableCell>
                      
                      {/* Periode 1-20 Data */}
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full ${
                          item.period_1_20.open > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-400'
                        } text-sm font-medium`}>
                          {item.period_1_20.open}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full ${
                          item.period_1_20.submitted > 0 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-400'
                        } text-sm font-medium`}>
                          {item.period_1_20.submitted}
                        </span>
                      </TableCell>
                      <TableCell className="text-center border-r">
                        <span className={`inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full ${
                          item.period_1_20.approved > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
                        } text-sm font-medium`}>
                          {item.period_1_20.approved}
                        </span>
                      </TableCell>
                      
                      {/* Periode 21-30 Data */}
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full ${
                          item.period_21_30.none > 0 ? 'bg-gray-200 text-gray-700' : 'bg-gray-100 text-gray-400'
                        } text-sm font-medium`}>
                          {item.period_21_30.none}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full ${
                          item.period_21_30.error > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-400'
                        } text-sm font-medium`}>
                          {item.period_21_30.error}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full ${
                          item.period_21_30.not_approved > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-400'
                        } text-sm font-medium`}>
                          {item.period_21_30.not_approved}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full ${
                          item.period_21_30.approved > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
                        } text-sm font-medium`}>
                          {item.period_21_30.approved}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full ${
                          item.period_21_30.not_found > 0 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-400'
                        } text-sm font-medium`}>
                          {item.period_21_30.not_found}
                        </span>
                      </TableCell>
                    </TableRow>

                    {/* Child Rows - Kawasan Breakdown */}
                    {expandedMonths.has(item.bulan) && item.breakdown.map((kawasan, kawasanIdx) => (
                      <TableRow key={`${index}-${kawasanIdx}`} className="bg-gray-50/50 hover:bg-gray-100/50">
                        <TableCell className="border-r w-[180px]">
                          <div className="flex items-center gap-2 pl-6">
                            <span className="text-gray-400 flex-shrink-0">↳</span>
                            <span className="text-gray-600 text-sm">
                              {kawasanDisplayMap[kawasan.kawasan] || kawasan.kawasan}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center border-r w-[100px]">
                          <span className="inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                            {kawasan.checklist}
                          </span>
                        </TableCell>
                        
                        {/* Periode 1-20 Data */}
                        <TableCell className="text-center">
                          {renderClickableBadge(
                            kawasan.period_1_20.open,
                            kawasan.period_1_20.open > 0 ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-400',
                            kawasan.kawasan,
                            item.bulan,
                            'period_1_20',
                            'OPEN'
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {renderClickableBadge(
                            kawasan.period_1_20.submitted,
                            kawasan.period_1_20.submitted > 0 ? 'bg-orange-50 text-orange-700' : 'bg-gray-50 text-gray-400',
                            kawasan.kawasan,
                            item.bulan,
                            'period_1_20',
                            'SUBMITTED'
                          )}
                        </TableCell>
                        <TableCell className="text-center border-r">
                          {renderClickableBadge(
                            kawasan.period_1_20.approved,
                            kawasan.period_1_20.approved > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400',
                            kawasan.kawasan,
                            item.bulan,
                            'period_1_20',
                            'APPROVED'
                          )}
                        </TableCell>
                        
                        {/* Periode 21-30 Data */}
                        <TableCell className="text-center">
                          {renderClickableBadge(
                            kawasan.period_21_30.none,
                            kawasan.period_21_30.none > 0 ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-400',
                            kawasan.kawasan,
                            item.bulan,
                            'period_21_30',
                            'NONE'
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {renderClickableBadge(
                            kawasan.period_21_30.error,
                            kawasan.period_21_30.error > 0 ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50 text-gray-400',
                            kawasan.kawasan,
                            item.bulan,
                            'period_21_30',
                            'ERROR'
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {renderClickableBadge(
                            kawasan.period_21_30.not_approved,
                            kawasan.period_21_30.not_approved > 0 ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-400',
                            kawasan.kawasan,
                            item.bulan,
                            'period_21_30',
                            'NOT APPROVED'
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {renderClickableBadge(
                            kawasan.period_21_30.approved,
                            kawasan.period_21_30.approved > 0 ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-400',
                            kawasan.kawasan,
                            item.bulan,
                            'period_21_30',
                            'APPROVED'
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {renderClickableBadge(
                            kawasan.period_21_30.not_found,
                            kawasan.period_21_30.not_found > 0 ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-400',
                            kawasan.kawasan,
                            item.bulan,
                            'period_21_30',
                            'NOT FOUND'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
                
                {/* Total Row */}
                <TableRow className="bg-gray-100 font-semibold border-t-2">
                  <TableCell className="font-bold border-r w-[180px]">TOTAL</TableCell>
                  <TableCell className="text-center border-r w-[100px]">
                    <span className="inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full bg-blue-200 text-blue-900 text-sm font-bold">
                      {totals.checklist}
                    </span>
                  </TableCell>
                  
                  {/* Periode 1-20 Totals */}
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full bg-red-200 text-red-900 text-sm font-bold">
                      {totals.period_1_20.open}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full bg-orange-200 text-orange-900 text-sm font-bold">
                      {totals.period_1_20.submitted}
                    </span>
                  </TableCell>
                  <TableCell className="text-center border-r">
                    <span className="inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full bg-green-200 text-green-900 text-sm font-bold">
                      {totals.period_1_20.approved}
                    </span>
                  </TableCell>
                  
                  {/* Periode 21-30 Totals */}
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full bg-gray-300 text-gray-900 text-sm font-bold">
                      {totals.period_21_30.none}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full bg-yellow-200 text-yellow-900 text-sm font-bold">
                      {totals.period_21_30.error}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full bg-red-200 text-red-900 text-sm font-bold">
                      {totals.period_21_30.not_approved}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full bg-green-200 text-green-900 text-sm font-bold">
                      {totals.period_21_30.approved}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full bg-orange-200 text-orange-900 text-sm font-bold">
                      {totals.period_21_30.not_found}
                    </span>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {filteredData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Tidak ada data untuk ditampilkan
            </div>
          )}
          </>
        )}
      </CardContent>

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent suppressHydrationWarning className="max-w-[95vw] lg:max-w-6xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 border-b">
            <DialogTitle className="text-lg sm:text-xl font-bold">
              Detail Gedung - {dialogParams && kawasanDisplayMap[dialogParams.kawasan]} ({dialogParams?.bulan} {selectedYear})
            </DialogTitle>
            <DialogDescription className="text-sm">
              Periode {dialogParams?.period}: {dialogParams?.status} - {dialogParams?.count} Gedung
            </DialogDescription>
          </DialogHeader>

          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 px-4 sm:px-6 py-3 border-b bg-gray-50">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari kode atau nama lokasi..."
                value={dialogSearch}
                onChange={(e) => setDialogSearch(e.target.value)}
                className="pl-9"
                disabled={dialogLoading}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={dialogLoading || !dialogData.length}
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-auto px-4 sm:px-6">
            {dialogLoading ? (
              <div className="py-4 space-y-4">
                {/* Table Header Skeleton */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="flex gap-2 p-3 bg-gray-50 border-b">
                    <Skeleton className="h-5 w-[60px]" />
                    <Skeleton className="h-5 w-[120px]" />
                    <Skeleton className="h-5 flex-1" />
                    <Skeleton className="h-5 w-[100px]" />
                    <Skeleton className="h-5 w-[100px]" />
                    <Skeleton className="h-5 w-[100px]" />
                  </div>
                  
                  {/* Table Rows Skeleton */}
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="flex gap-2 p-3 border-b last:border-b-0">
                      <Skeleton className="h-5 w-[60px]" />
                      <Skeleton className="h-5 w-[120px]" />
                      <Skeleton className="h-5 flex-1" />
                      <Skeleton className="h-6 w-[100px]" />
                      <Skeleton className="h-6 w-[100px]" />
                      <Skeleton className="h-6 w-[100px]" />
                    </div>
                  ))}
                </div>
              </div>
            ) : filteredDialogData.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {dialogSearch ? 'Tidak ada gedung yang sesuai dengan pencarian' : 'Tidak ada data gedung'}
              </div>
            ) : (
              <div className="w-full">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="w-[60px] sm:w-[80px]">No</TableHead>
                      <TableHead className="w-[120px] sm:w-[140px]">Kode</TableHead>
                      <TableHead className="min-w-[180px] sm:min-w-[220px]">Nama Lokasi</TableHead>
                      <TableHead className="w-[100px] sm:w-[120px]">Kelas</TableHead>
                      <TableHead className="w-[100px] sm:w-[130px] text-center">P1-20</TableHead>
                      <TableHead className="w-[100px] sm:w-[130px] text-center">P21-30</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDialogData.map((item, idx) => (
                      <TableRow key={idx} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-sm">{idx + 1}</TableCell>
                        <TableCell className="font-mono text-xs sm:text-sm">{item.kode_gedung}</TableCell>
                        <TableCell className="text-sm">{item.nama_lokasi}</TableCell>
                        <TableCell className="text-sm">
                          <span className="inline-flex px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                            {item.kelas_berbayar || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex px-1.5 sm:px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                            item.period_1_20 === 'OPEN' ? 'bg-red-100 text-red-700' :
                            item.period_1_20 === 'SUBMITTED' ? 'bg-orange-100 text-orange-700' :
                            item.period_1_20 === 'APPROVED' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {item.period_1_20 || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex px-1.5 sm:px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                            item.period_21_30 === 'APPROVED' ? 'bg-green-100 text-green-700' :
                            item.period_21_30 === 'NOT APPROVED' ? 'bg-red-100 text-red-700' :
                            item.period_21_30 === 'ERROR' ? 'bg-yellow-100 text-yellow-700' :
                            item.period_21_30 === 'NOT FOUND' ? 'bg-orange-100 text-orange-700' :
                            item.period_21_30 === 'NONE' ? 'bg-gray-200 text-gray-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {item.period_21_30 || '-'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Footer Info */}
          {!dialogLoading && filteredDialogData.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 sm:px-6 py-3 sm:py-4 border-t rounded-xl text-xs sm:text-sm text-gray-600 bg-gray-50">
              <span>
                Menampilkan <span className="font-semibold">{filteredDialogData.length}</span> dari <span className="font-semibold">{dialogData.length}</span> gedung
              </span>
              {/* <Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">
                <X className="h-4 w-4 mr-1" />
                Tutup
              </Button> */}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}