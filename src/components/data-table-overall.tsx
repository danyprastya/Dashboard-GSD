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
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface MonthData {
  bulan: string;
  checklist: number;
  open: number;
  submitted: number;
  approved: number;
  foto: number;
  prestasi: number;
}

interface YearData {
  tahun: number;
  data: MonthData[];
}

interface DataTableOverallProps {
  data: YearData[];
  selectedYear: number;
}

export function DataTableOverall({ data, selectedYear }: DataTableOverallProps) {
  const [searchTerm, setSearchTerm] = React.useState("")

  // Get data for selected year
  const yearData = data.find(item => item.tahun === selectedYear)?.data || []

  // Filter data based on search
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return yearData

    return yearData.filter(item => 
      item.bulan.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [yearData, searchTerm])

  // Calculate totals
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

  // Helper function to get status color
  const getStatusColor = (value: number, total: number) => {
    if (value === 0) return "text-gray-400"
    if (value === total) return "text-green-600 font-semibold"
    return "text-orange-600"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle>Data Keseluruhan {selectedYear}</CardTitle>
            <CardDescription>Detail data per bulan untuk tahun {selectedYear}</CardDescription>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari bulan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Bulan</TableHead>
                <TableHead className="text-center font-semibold">Checklist</TableHead>
                <TableHead className="text-center font-semibold">Open</TableHead>
                <TableHead className="text-center font-semibold">Submitted</TableHead>
                <TableHead className="text-center font-semibold">Approved</TableHead>
                <TableHead className="text-center font-semibold">Foto</TableHead>
                <TableHead className="text-center font-semibold">Prestasi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item, index) => (
                <TableRow key={index} className="hover:bg-gray-50">
                  <TableCell className="font-medium">{item.bulan}</TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                      {item.checklist}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full ${
                      item.open > 0 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-400'
                    } text-sm font-medium`}>
                      {item.open}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full ${
                      item.submitted > 0 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-400'
                    } text-sm font-medium`}>
                      {item.submitted}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full ${
                      item.approved > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-400'
                    } text-sm font-medium`}>
                      {item.approved}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full ${
                      item.foto > 0 ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-400'
                    } text-sm font-medium`}>
                      {item.foto}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full ${
                      item.prestasi > 0 ? 'bg-pink-100 text-pink-800' : 'bg-gray-100 text-gray-400'
                    } text-sm font-medium`}>
                      {item.prestasi}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Total Row */}
              <TableRow className="bg-gray-100 font-semibold border-t-2">
                <TableCell className="font-bold">TOTAL</TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full bg-blue-200 text-blue-900 text-sm font-bold">
                    {totals.checklist}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full bg-red-200 text-red-900 text-sm font-bold">
                    {totals.open}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full bg-orange-200 text-orange-900 text-sm font-bold">
                    {totals.submitted}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full bg-green-200 text-green-900 text-sm font-bold">
                    {totals.approved}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full bg-purple-200 text-purple-900 text-sm font-bold">
                    {totals.foto}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full bg-pink-200 text-pink-900 text-sm font-bold">
                    {totals.prestasi}
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
      </CardContent>
    </Card>
  )
}