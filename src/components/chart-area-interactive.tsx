"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend, Tooltip, ResponsiveContainer } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { RefreshCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export const description = "An interactive bar chart showing property status"

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
}

interface ChartBarInteractiveProps {
  year: number;
}

const chartConfig = {
  checklist: {
    label: "Checklist",
    color: "#3b82f6", // Blue
  },
  open: {
    label: "Open",
    color: "#ef4444", // Red
  },
  submitted: {
    label: "Submitted",
    color: "#f59e0b", // Orange
  },
  approved: {
    label: "Approved (1-20)",
    color: "#10b981", // Green
  },
  approved_21_30: {
    label: "Approved (21-30)",
    color: "#059669", // Dark Green
  },
  not_approved: {
    label: "Not Approved",
    color: "#dc2626", // Dark Red
  },
} satisfies ChartConfig

export function ChartAreaInteractive({ year }: ChartBarInteractiveProps) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("12m")
  const [loading, setLoading] = React.useState(true)
  const [apiData, setApiData] = React.useState<ApiResponse | null>(null)

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("6m")
    }
  }, [isMobile])

  // Fetch data dari API
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/overview/monthly?year=${year}`)
      const result: ApiResponse = await response.json()
      
      if (result.success) {
        setApiData(result)
      }
    } catch (err) {
      console.error('Error fetching chart data:', err)
    } finally {
      setLoading(false)
    }
  }, [year])

  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  // Filter data based on time range
  const filteredData = React.useMemo(() => {
    if (!apiData?.data) return []
    
    let monthsToShow = 12
    if (timeRange === "6m") {
      monthsToShow = 6
    } else if (timeRange === "3m") {
      monthsToShow = 3
    }
    
    // Get only months with data (non-zero checklist)
    const dataWithValues = apiData.data.filter(item => item.checklist > 0)
    return dataWithValues.slice(0, monthsToShow)
  }, [apiData, timeRange])

  // Calculate totals for summary
  const totals = React.useMemo(() => {
    if (!filteredData.length) {
      return {
        checklist: 0,
        open: 0,
        submitted: 0,
        approved: 0,
        approved_21_30: 0,
        not_approved: 0,
      }
    }
    
    return filteredData.reduce((acc, item) => ({
      checklist: acc.checklist + item.checklist,
      open: acc.open + item.period_1_20.open,
      submitted: acc.submitted + item.period_1_20.submitted,
      approved: acc.approved + item.period_1_20.approved,
      approved_21_30: acc.approved_21_30 + item.period_21_30.approved,
      not_approved: acc.not_approved + item.period_21_30.not_approved,
    }), {
      checklist: 0,
      open: 0,
      submitted: 0,
      approved: 0,
      approved_21_30: 0,
      not_approved: 0,
    })
  }, [filteredData])

  // Transform data untuk chart (flatten nested structure)
  const chartData = React.useMemo(() => {
    return filteredData.map(item => ({
      bulan: item.bulan,
      checklist: item.checklist,
      open: item.period_1_20.open,
      submitted: item.period_1_20.submitted,
      approved: item.period_1_20.approved,
      approved_21_30: item.period_21_30.approved,
      not_approved: item.period_21_30.not_approved,
    }))
  }, [filteredData])

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Data Properti {year}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Statistik checklist, status, dan prestasi properti
          </span>
          <span className="@[540px]/card:hidden">Statistik properti</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="12m">12 Bulan</ToggleGroupItem>
            <ToggleGroupItem value="6m">6 Bulan</ToggleGroupItem>
            <ToggleGroupItem value="3m">3 Bulan</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="12 Bulan" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="12m" className="rounded-lg">
                12 Bulan
              </SelectItem>
              <SelectItem value="6m" className="rounded-lg">
                6 Bulan
              </SelectItem>
              <SelectItem value="3m" className="rounded-lg">
                3 Bulan
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {loading && (
          <div className="space-y-4">
            {/* Chart Skeleton */}
            <div className="h-[300px] sm:h-[400px] w-full flex items-end justify-between gap-2 px-4">
              {[180, 220, 160, 250, 200, 240, 190, 210].map((height, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-1">
                  <Skeleton 
                    className="w-full" 
                    style={{ height: `${height}px` }}
                  />
                  <Skeleton className="h-4 w-8" />
                </div>
              ))}
            </div>
            
            {/* Legend Skeleton */}
            <div className="flex flex-wrap gap-4 justify-center">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-6 w-24" />
              ))}
            </div>
            
            {/* Summary Cards Skeleton */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Total Checklist</p>
                <p className="text-2xl font-bold text-blue-600">{totals.checklist}</p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Open</p>
                <p className="text-2xl font-bold text-red-600">{totals.open}</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Submitted</p>
                <p className="text-2xl font-bold text-orange-600">{totals.submitted}</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Approved (1-20)</p>
                <p className="text-2xl font-bold text-green-600">{totals.approved}</p>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Approved (21-30)</p>
                <p className="text-2xl font-bold text-emerald-600">{totals.approved_21_30}</p>
              </div>
              <div className="bg-rose-50 p-3 rounded-lg">
                <p className="text-xs text-gray-600">Not Approved</p>
                <p className="text-2xl font-bold text-rose-600">{totals.not_approved}</p>
              </div>
            </div>

            {/* Chart */}
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[350px] w-full"
            >
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="bulan"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      indicator="dot"
                      labelFormatter={(value) => `Bulan ${value}`}
                    />
                  }
                />
                <Legend 
                  wrapperStyle={{ paddingTop: "20px" }}
                  iconType="circle"
                />
                <Bar
                  dataKey="checklist"
                  fill={chartConfig.checklist.color}
                  radius={[4, 4, 0, 0]}
                  name={chartConfig.checklist.label}
                />
                <Bar
                  dataKey="open"
                  fill={chartConfig.open.color}
                  radius={[4, 4, 0, 0]}
                  name={chartConfig.open.label}
                />
                <Bar
                  dataKey="submitted"
                  fill={chartConfig.submitted.color}
                  radius={[4, 4, 0, 0]}
                  name={chartConfig.submitted.label}
                />
                <Bar
                  dataKey="approved"
                  fill={chartConfig.approved.color}
                  radius={[4, 4, 0, 0]}
                  name={chartConfig.approved.label}
                />
                <Bar
                  dataKey="approved_21_30"
                  fill={chartConfig.approved_21_30.color}
                  radius={[4, 4, 0, 0]}
                  name={chartConfig.approved_21_30.label}
                />
                <Bar
                  dataKey="not_approved"
                  fill={chartConfig.not_approved.color}
                  radius={[4, 4, 0, 0]}
                  name={chartConfig.not_approved.label}
                />
              </BarChart>
            </ChartContainer>
          </>
        )}
      </CardContent>
    </Card>
  )
}