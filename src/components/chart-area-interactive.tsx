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

export const description = "An interactive bar chart showing property status"

interface MonthData {
  bulan: string;
  checklist: number;
  open: number;
  submitted: number;
  approved: number;
  foto: number;
  prestasi: number;
}

interface ChartBarInteractiveProps {
  data: MonthData[];
  year: number;
  area: string;
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
    label: "Approved",
    color: "#10b981", // Green
  },
  foto: {
    label: "Foto",
    color: "#8b5cf6", // Purple
  },
  prestasi: {
    label: "Prestasi",
    color: "#ec4899", // Pink
  },
} satisfies ChartConfig

export function ChartAreaInteractive({ data, year }: ChartBarInteractiveProps) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("12m")
  const [selectedMetrics, setSelectedMetrics] = React.useState<string[]>([
    "checklist",
    "open", 
    "submitted",
    "approved"
  ])

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("6m")
    }
  }, [isMobile])

  // Filter data based on time range
  const filteredData = React.useMemo(() => {
    let monthsToShow = 12
    if (timeRange === "6m") {
      monthsToShow = 6
    } else if (timeRange === "3m") {
      monthsToShow = 3
    }
    
    // Get only months with data (non-zero checklist)
    const dataWithValues = data.filter(item => item.checklist > 0)
    return dataWithValues.slice(0, monthsToShow)
  }, [data, timeRange])

  // Calculate totals for summary
  const totals = React.useMemo(() => {
    return filteredData.reduce((acc, item) => ({
      checklist: acc.checklist + item.checklist,
      open: acc.open + item.open,
      submitted: acc.submitted + item.submitted,
      approved: acc.approved + item.approved,
      foto: acc.foto + item.foto,
      prestasi: acc.prestasi + item.prestasi,
    }), {
      checklist: 0,
      open: 0,
      submitted: 0,
      approved: 0,
      foto: 0,
      prestasi: 0,
    })
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
            <p className="text-xs text-gray-600">Approved</p>
            <p className="text-2xl font-bold text-green-600">{totals.approved}</p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">Foto</p>
            <p className="text-2xl font-bold text-purple-600">{totals.foto}</p>
          </div>
          <div className="bg-pink-50 p-3 rounded-lg">
            <p className="text-xs text-gray-600">Prestasi</p>
            <p className="text-2xl font-bold text-pink-600">{totals.prestasi}</p>
          </div>
        </div>

        {/* Chart */}
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[350px] w-full"
        >
          <BarChart data={filteredData}>
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
              dataKey="foto"
              fill={chartConfig.foto.color}
              radius={[4, 4, 0, 0]}
              name={chartConfig.foto.label}
            />
            <Bar
              dataKey="prestasi"
              fill={chartConfig.prestasi.color}
              radius={[4, 4, 0, 0]}
              name={chartConfig.prestasi.label}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}