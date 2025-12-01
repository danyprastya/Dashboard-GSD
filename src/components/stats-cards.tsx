"use client"

import React from "react"
import { IconTrendingUp, IconBuilding, IconCheck, IconAlertTriangle } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface StatsCardsProps {
  data: {
    totalGedung: number
    approved1_20: number
    approved21_30: number
    pending: number
    open: number
    error: number
  } | null
  loading?: boolean
}

export function StatsCards({ data, loading = false }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
              <CardAction>
                <Skeleton className="h-6 w-16" />
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) return null

  const approvalRate = data.totalGedung > 0 
    ? Math.round(((data.approved1_20 + data.approved21_30) / (data.totalGedung * 2)) * 100) 
    : 0

  const pendingRate = data.totalGedung > 0
    ? Math.round((data.pending / data.totalGedung) * 100)
    : 0

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Total Gedung */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Gedung</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.totalGedung.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1">
              <IconBuilding className="h-3 w-3" />
              Aktif
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total gedung yang dimonitor
          </div>
          <div className="text-muted-foreground text-xs">
            Data tahun berjalan
          </div>
        </CardFooter>
      </Card>

      {/* Approved Rate */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Tingkat Persetujuan</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {approvalRate}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className={`gap-1 ${approvalRate >= 80 ? 'text-green-600' : 'text-orange-600'}`}>
              {approvalRate >= 80 ? (
                <>
                  <IconTrendingUp className="h-3 w-3" />
                  Baik
                </>
              ) : (
                <>
                  <IconAlertTriangle className="h-3 w-3" />
                  Perlu Ditingkatkan
                </>
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            <span className="text-green-600">{data.approved1_20 + data.approved21_30}</span> dari {data.totalGedung * 2} periode
          </div>
          <div className="text-muted-foreground text-xs">
            Gabungan Periode 1-20 & 21-30
          </div>
        </CardFooter>
      </Card>

      {/* Pending/Open */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Pending & Open</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {(data.pending + data.open).toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="gap-1 text-orange-600">
              <IconAlertTriangle className="h-3 w-3" />
              {pendingRate}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Membutuhkan tindakan
          </div>
          <div className="text-muted-foreground text-xs">
            {data.open} Open · {data.pending} Submitted
          </div>
        </CardFooter>
      </Card>

      {/* Error/Issues */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Issues & Error</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data.error.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className={`gap-1 ${data.error === 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.error === 0 ? (
                <>
                  <IconCheck className="h-3 w-3" />
                  Clear
                </>
              ) : (
                <>
                  <IconAlertTriangle className="h-3 w-3" />
                  Perlu Perhatian
                </>
              )}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {data.error === 0 ? 'Tidak ada masalah' : 'Perlu diperbaiki'}
          </div>
          <div className="text-muted-foreground text-xs">
            Status error dan not found
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
