"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

// Definisikan tipe data untuk satu baris gedung
export type Gedung = {
  kode_gedung: string;
  nama_gedung: string;
  provinsi: string;
  area: string;
  alamat: string;
};

export const columns: ColumnDef<Gedung>[] = [
  {
    accessorKey: "kode_gedung",
    header: "Kode Gedung",
  },
  {
    accessorKey: "nama_gedung",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Nama Gedung
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "provinsi",
    header: "Provinsi",
  },
  {
    accessorKey: "area",
    header: "Area",
  },
  {
    accessorKey: "alamat",
    header: "Alamat",
  },
  {
    id: "actions",
    header: "Detail",
    cell: ({ row }) => {
      const gedung = row.original;
      return (
        <Link href={`/dashboard/gedung/${gedung.kode_gedung}`}>
          <Button variant="outline" size="sm">
            Lihat Detail
          </Button>
        </Link>
      );
    },
  },
];