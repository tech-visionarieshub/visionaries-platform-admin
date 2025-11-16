"use client"

import { useState } from "react"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Search, Filter, Download, Plus } from "lucide-react"
import Link from "next/link"

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Mock data
  const invoices = [
    {
      id: 1,
      numero: "FAC-2024-001",
      cliente: "Tech Solutions SA",
      fechaEmision: "2024-01-05",
      fechaVencimiento: "2024-01-20",
      monto: 25000,
      estado: "Pendiente",
    },
    {
      id: 2,
      numero: "FAC-2024-002",
      cliente: "Global Enterprises",
      fechaEmision: "2024-01-08",
      fechaVencimiento: "2024-01-23",
      monto: 42000,
      estado: "Pagada",
    },
    {
      id: 3,
      numero: "FAC-2024-003",
      cliente: "Innovate Corp",
      fechaEmision: "2024-01-10",
      fechaVencimiento: "2024-01-25",
      monto: 18000,
      estado: "Pendiente",
    },
    {
      id: 4,
      numero: "FAC-2024-004",
      cliente: "StartUp Inc",
      fechaEmision: "2023-12-20",
      fechaVencimiento: "2024-01-05",
      monto: 15000,
      estado: "Vencida",
    },
    {
      id: 5,
      numero: "FAC-2024-005",
      cliente: "Digital Ventures",
      fechaEmision: "2024-01-12",
      fechaVencimiento: "2024-01-27",
      monto: 32000,
      estado: "Parcial",
    },
  ]

  const getStatusType = (estado: string) => {
    switch (estado) {
      case "Pagada":
        return "success"
      case "Pendiente":
        return "warning"
      case "Vencida":
        return "error"
      case "Parcial":
        return "info"
      default:
        return "default"
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facturas"
        description="Gestión de facturas y cobros"
        action={
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nueva Factura
          </Button>
        }
      />

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2 bg-transparent">
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de facturas */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Número</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Emisión</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Vencimiento</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Monto</th>
                  <th className="text-center p-4 text-sm font-medium text-muted-foreground">Estado</th>
                  <th className="text-center p-4 text-sm font-medium text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <Link
                        href={`/finance/invoices/${invoice.id}`}
                        className="font-medium text-brand-purple hover:underline"
                      >
                        {invoice.numero}
                      </Link>
                    </td>
                    <td className="p-4">{invoice.cliente}</td>
                    <td className="p-4 text-muted-foreground">{invoice.fechaEmision}</td>
                    <td className="p-4 text-muted-foreground">{invoice.fechaVencimiento}</td>
                    <td className="p-4 text-right font-semibold">${invoice.monto.toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <StatusBadge status={getStatusType(invoice.estado)} label={invoice.estado} />
                    </td>
                    <td className="p-4 text-center">
                      <Button variant="ghost" size="sm">
                        Ver
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
