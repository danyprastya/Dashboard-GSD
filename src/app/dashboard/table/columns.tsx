"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Eye, History, Edit2, Save, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Definisikan tipe data untuk satu baris gedung (sesuai dengan database schema)
export type Gedung = {
  id: string;
  kode_gedung: string;
  nama_lokasi: string;
  provinsi: string;
  kawasan: string;
  area: string;
  alamat_lokasi: string;
  peruntukan: string;
  kab_kota: string;
  witel: string;
  kelas_berbayar: string;
  luasan_berbayar: string;
  keterangan: string;
  histori?: string;
  simpan?: string;
  created_at: string;
  updated_at: string;
  label: string;
};

// Tipe data untuk status bulanan
type StatusBulanan = {
  id: string;
  id_gedung: string;
  month: string;
  period_1_20: string;
  period_21_30: string;
  created_at: string;
  updated_at: string;
};

// Component untuk dialog status bulanan
function StatusBulananDialog({ kode_gedung }: { kode_gedung: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusData, setStatusData] = useState<StatusBulanan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ period_1_20: string; period_21_30: string }>({
    period_1_20: "",
    period_21_30: ""
  });
  const [saving, setSaving] = useState(false);

  // Status options untuk dropdown - berbeda per periode
  const statusOptionsPeriod1 = [
    "OPEN",
    "SUBMITTED",
    "APPROVED"
  ];

  const statusOptionsPeriod2 = [
    "OPEN",
    "SUBMITTED",
    "APPROVED",
    "NOT APPROVED",
    "ERROR",
    "NONE",
    "NOT FOUND"
  ];

  const fetchStatusData = async () => {
    if (statusData.length > 0) return; // Already loaded
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/status-bulanan?kode_gedung=${kode_gedung}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch status: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setStatusData(result.data);
      } else {
        throw new Error(result.error || "Failed to load status data");
      }
    } catch (err) {
      console.error("Error fetching status data:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (status: StatusBulanan) => {
    setEditingId(status.id);
    setEditValues({
      period_1_20: status.period_1_20,
      period_21_30: status.period_21_30
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValues({ period_1_20: "", period_21_30: "" });
  };

  const handleSave = async (statusId: string) => {
    try {
      setSaving(true);
      
      const response = await fetch("/api/status-bulanan", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: statusId,
          period_1_20: editValues.period_1_20,
          period_21_30: editValues.period_21_30
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        // Update local state
        setStatusData(prev => 
          prev.map(item => 
            item.id === statusId 
              ? { ...item, period_1_20: editValues.period_1_20, period_21_30: editValues.period_21_30 }
              : item
          )
        );
        setEditingId(null);
        setEditValues({ period_1_20: "", period_21_30: "" });
      } else {
        throw new Error(result.error || "Failed to save changes");
      }
    } catch (err) {
      console.error("Error saving status:", err);
      alert(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && statusData.length === 0) {
      fetchStatusData();
    }
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    const upperStatus = status.toUpperCase();
    if (upperStatus === "APPROVED") return "default";
    if (upperStatus === "SUBMITTED") return "secondary";
    if (upperStatus === "OPEN") return "outline";
    if (upperStatus === "NOT APPROVED" || upperStatus === "ERROR") return "destructive";
    return "secondary";
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="mr-2 h-4 w-4" />
          Lihat Status
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[65vw] sm:max-w-[70vw] lg:max-w-xl xl:max-w-2xl max-h-[90vh] overflow-y-auto p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl">Status Bulanan</DialogTitle>
          <DialogDescription className="text-base">
            Riwayat status untuk {kode_gedung}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-4 text-sm text-muted-foreground">Loading status data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-red-500 font-semibold">Error: {error}</p>
              <Button
                onClick={fetchStatusData}
                className="mt-4"
                variant="outline"
              >
                Retry
              </Button>
            </div>
          </div>
        ) : statusData.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Tidak ada data status untuk gedung ini</p>
          </div>
        ) : (
          <div className="mt-6">
            {/* Desktop View - Table */}
            <div className="hidden md:block">
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">
                        Bulan
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">
                        Periode 1-20
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">
                        Periode 21-30
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusData.map((status, index) => {
                      const isEditing = editingId === status.id;
                      return (
                        <tr key={status.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                          <td className="px-4 py-4 font-medium">
                            {status.month}
                          </td>
                          <td className="px-4 py-4">
                            {isEditing ? (
                              <Select
                                value={editValues.period_1_20}
                                onValueChange={(value) => setEditValues(prev => ({ ...prev, period_1_20: value }))}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {statusOptionsPeriod1.map(option => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant={getStatusBadgeVariant(status.period_1_20)} className="text-sm">
                                {status.period_1_20}
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {isEditing ? (
                              <Select
                                value={editValues.period_21_30}
                                onValueChange={(value) => setEditValues(prev => ({ ...prev, period_21_30: value }))}
                              >
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {statusOptionsPeriod2.map(option => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant={getStatusBadgeVariant(status.period_21_30)} className="text-sm">
                                {status.period_21_30}
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            {isEditing ? (
                              <div className="flex gap-1">
                                <Button
                                  size="icon"
                                  variant="default"
                                  className="h-8 w-8"
                                  onClick={() => handleSave(status.id)}
                                  disabled={saving}
                                >
                                  {saving ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                                  ) : (
                                    <Save className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8"
                                  onClick={handleCancelEdit}
                                  disabled={saving}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handleEdit(status)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile View - Cards */}
            <div className="md:hidden space-y-4">
              {statusData.map((status) => {
                const isEditing = editingId === status.id;
                return (
                  <div key={status.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        Bulan
                      </span>
                      <span className="font-semibold">{status.month}</span>
                    </div>
                    <div className="flex flex-col gap-2 border-b pb-3">
                      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        Periode 1-20
                      </span>
                      {isEditing ? (
                        <Select
                          value={editValues.period_1_20}
                          onValueChange={(value) => setEditValues(prev => ({ ...prev, period_1_20: value }))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptionsPeriod1.map(option => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={getStatusBadgeVariant(status.period_1_20)} className="text-sm w-fit">
                          {status.period_1_20}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 border-b pb-3">
                      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        Periode 21-30
                      </span>
                      {isEditing ? (
                        <Select
                          value={editValues.period_21_30}
                          onValueChange={(value) => setEditValues(prev => ({ ...prev, period_21_30: value }))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptionsPeriod2.map(option => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={getStatusBadgeVariant(status.period_21_30)} className="text-sm w-fit">
                          {status.period_21_30}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2 pt-2">
                      {isEditing ? (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleSave(status.id)}
                            disabled={saving}
                            className="flex-1"
                          >
                            {saving ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                            ) : (
                              <>
                                <Save className="mr-1 h-4 w-4" />
                                Simpan
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={saving}
                            className="flex-1"
                          >
                            <X className="mr-1 h-4 w-4" />
                            Batal
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(status)}
                          className="w-full"
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Edit Status
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export const columns: ColumnDef<Gedung>[] = [
  {
    accessorKey: "kode_gedung",
    header: "Kode Gedung",
  },
  {
    accessorKey: "nama_lokasi",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nama Lokasi
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "area",
    header: "Area",
  },
  {
    accessorKey: "kelas_berbayar",
    header: "Kelas Berbayar",
  },
  {
    accessorKey: "keterangan",
    header: "Keterangan",
    cell: ({ row }) => {
      const keterangan = row.getValue("keterangan") as string;
      return (
        <Badge variant={keterangan === "AKTIF" ? "default" : "secondary"}>
          {keterangan}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Aksi",
    cell: ({ row }) => {
      const gedung = row.original;
      const [openDetail, setOpenDetail] = useState(false);
      
      return (
        <div className="flex gap-2">
          {/* Tombol Lihat Status */}
          <StatusBulananDialog kode_gedung={gedung.kode_gedung} />
          
          {/* Tombol Lihat Detail */}
          <Dialog open={openDetail} onOpenChange={setOpenDetail}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => setOpenDetail(true)}>
                <Eye className="mr-2 h-4 w-4" />
                Lihat Detail
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-[60vw] sm:max-w-[60vw] lg:max-w-3xl xl:max-w-4xl max-h-[90vh] overflow-y-auto p-8">
            <DialogHeader>
              <DialogTitle className="text-2xl">Detail Gedung</DialogTitle>
              <DialogDescription className="text-base">
                Informasi lengkap untuk {gedung.kode_gedung}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              {/* Kolom Kiri */}
              <div className="space-y-5">
                <div className="border-b pb-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2.5">
                    Kode Gedung
                  </p>
                  <p className="text-base font-medium">{gedung.kode_gedung}</p>
                </div>
                <div className="border-b pb-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2.5">
                    Nama Lokasi
                  </p>
                  <p className="text-base font-medium">{gedung.nama_lokasi}</p>
                </div>
                <div className="border-b pb-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2.5">
                    Provinsi
                  </p>
                  <p className="text-base font-medium">{gedung.provinsi}</p>
                </div>
                <div className="border-b pb-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2.5">
                    Kawasan
                  </p>
                  <p className="text-base font-medium">{gedung.kawasan}</p>
                </div>
                <div className="border-b pb-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2.5">
                    Area
                  </p>
                  <p className="text-base font-medium">{gedung.area}</p>
                </div>
                <div className="border-b pb-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2.5">
                    Kabupaten/Kota
                  </p>
                  <p className="text-base font-medium">{gedung.kab_kota}</p>
                </div>
                <div className="border-b pb-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2.5">
                    Witel
                  </p>
                  <p className="text-base font-medium">{gedung.witel}</p>
                </div>
              </div>
              
              {/* Kolom Kanan */}
              <div className="space-y-5">
                <div className="border-b pb-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2.5">
                    Peruntukan
                  </p>
                  <p className="text-base font-medium">{gedung.peruntukan}</p>
                </div>
                <div className="border-b pb-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2.5">
                    Kelas Berbayar
                  </p>
                  <p className="text-base font-medium">{gedung.kelas_berbayar}</p>
                </div>
                <div className="border-b pb-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2.5">
                    Luasan Berbayar
                  </p>
                  <p className="text-base font-medium">{gedung.luasan_berbayar} m²</p>
                </div>
                <div className="border-b pb-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2.5">
                    Keterangan
                  </p>
                  <Badge variant={gedung.keterangan === "AKTIF" ? "default" : "secondary"} className="text-sm px-3 py-1">
                    {gedung.keterangan}
                  </Badge>
                </div>
                <div className="border-b pb-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2.5">
                    Alamat Lokasi
                  </p>
                  <p className="text-base font-medium break-words">{gedung.alamat_lokasi}</p>
                </div>
                {gedung.histori && (
                  <div className="border-b pb-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2.5">
                      Histori
                    </p>
                    <p className="text-base font-medium">{gedung.histori}</p>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      );
    },
  },
];