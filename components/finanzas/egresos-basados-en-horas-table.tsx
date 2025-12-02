"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, FileText, Download, Trash2, Upload, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { getEgresosBasadosEnHoras, deleteEgreso, type Egreso } from "@/lib/api/finanzas-api"
import { CargarHistoricoDialog } from "./cargar-historico-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function EgresosBasadosEnHorasTable() {
  const [egresos, setEgresos] = useState<Egreso[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [tipoFilter, setTipoFilter] = useState<string>("all")
  const [mesFilter, setMesFilter] = useState<string>("all")
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all")
  const [empresaFilter, setEmpresaFilter] = useState<string>("all")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: 'factura' | 'comprobante' } | null>(null)

  useEffect(() => {
    async function loadEgresos() {
      try {
        const data = await getEgresosBasadosEnHoras()
        setEgresos(data)
      } catch (err: any) {
        if (err.name === 'AuthenticationError' || err.message?.includes('authentication')) {
          return
        }
        console.error('Error loading egresos:', err)
        toast.error('Error al cargar egresos')
      } finally {
        setLoading(false)
      }
    }
    loadEgresos()
  }, [])

  const uniqueCategorias = useMemo(() => {
    return Array.from(new Set(egresos.map((e) => e.categoria))).sort()
  }, [egresos])

  const uniqueEmpresas = useMemo(() => {
    return Array.from(new Set(egresos.map((e) => e.empresa))).sort()
  }, [egresos])

  const filteredEgresos = egresos.filter((egreso) => {
    const matchesSearch =
      egreso.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      egreso.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      egreso.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || egreso.status === statusFilter
    const matchesTipo = tipoFilter === "all" || egreso.tipo === tipoFilter
    const matchesMes = mesFilter === "all" || egreso.mes === mesFilter
    const matchesCategoria = categoriaFilter === "all" || egreso.categoria === categoriaFilter
    const matchesEmpresa = empresaFilter === "all" || egreso.empresa === empresaFilter

    return matchesSearch && matchesStatus && matchesTipo && matchesMes && matchesCategoria && matchesEmpresa
  })

  const handleDeleteEgreso = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este egreso?")) {
      return
    }

    try {
      await deleteEgreso(id)
      setEgresos(egresos.filter((e) => e.id !== id))
      toast.success("Egreso eliminado")
    } catch (error: any) {
      console.error('Error deleting egreso:', error)
      toast.error('Error al eliminar egreso')
    }
  }

  const handleViewFile = (url: string, name: string, type: 'factura' | 'comprobante') => {
    setPreviewFile({ url, name, type })
  }

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const data = await getEgresosBasadosEnHoras()
      setEgresos(data)
    } catch (err: any) {
      console.error('Error refreshing egresos:', err)
      toast.error('Error al actualizar egresos')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      Pagado: "default",
      Pendiente: "secondary",
      Cancelado: "destructive",
    }
    return <Badge variant={variants[status]}>{status}</Badge>
  }

  const getTipoBadge = (tipo: string) => {
    return <Badge variant={tipo === "Fijo" ? "outline" : "secondary"}>{tipo}</Badge>
  }

  const totalEgresos = filteredEgresos.reduce((sum, e) => sum + e.total, 0)
  const totalPagado = filteredEgresos.filter((e) => e.status === "Pagado").reduce((sum, e) => sum + e.total, 0)
  const totalPendiente = filteredEgresos.filter((e) => e.status === "Pendiente").reduce((sum, e) => sum + e.total, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Total Egresos</div>
          <div className="text-2xl font-bold">${totalEgresos.toLocaleString("es-MX")}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {filteredEgresos.length} egreso{filteredEgresos.length !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Pagado</div>
          <div className="text-2xl font-bold text-green-600">${totalPagado.toLocaleString("es-MX")}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {filteredEgresos.filter((e) => e.status === "Pagado").length} egreso
            {filteredEgresos.filter((e) => e.status === "Pagado").length !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Pendiente</div>
          <div className="text-2xl font-bold text-orange-600">${totalPendiente.toLocaleString("es-MX")}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {filteredEgresos.filter((e) => e.status === "Pendiente").length} egreso
            {filteredEgresos.filter((e) => e.status === "Pendiente").length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por concepto, cliente o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={() => setIsUploadDialogOpen(true)} variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Cargar Histórico
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Categoría</Label>
            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {uniqueCategorias.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Cliente</Label>
            <Select value={empresaFilter} onValueChange={setEmpresaFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {uniqueEmpresas.map((emp) => (
                  <SelectItem key={emp} value={emp}>
                    {emp}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Pagado">Pagado</SelectItem>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Tipo</Label>
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Variable">Variable</SelectItem>
                <SelectItem value="Fijo">Fijo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Mes</Label>
            <Select value={mesFilter} onValueChange={setMesFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Enero 2025">Enero 2025</SelectItem>
                <SelectItem value="Febrero 2025">Febrero 2025</SelectItem>
                <SelectItem value="Marzo 2025">Marzo 2025</SelectItem>
                <SelectItem value="Abril 2025">Abril 2025</SelectItem>
                <SelectItem value="Mayo 2025">Mayo 2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Concepto</TableHead>
              <TableHead className="min-w-[120px]">Categoría</TableHead>
              <TableHead className="min-w-[150px]">Cliente</TableHead>
              <TableHead className="min-w-[120px]">Equipo</TableHead>
              <TableHead className="min-w-[120px]">Línea de Negocio</TableHead>
              <TableHead className="min-w-[80px]">Tipo</TableHead>
              <TableHead className="min-w-[100px]">Mes</TableHead>
              <TableHead className="text-right min-w-[100px]">Subtotal</TableHead>
              <TableHead className="text-right min-w-[100px]">IVA</TableHead>
              <TableHead className="text-right min-w-[100px]">Total</TableHead>
              <TableHead className="min-w-[100px]">Status</TableHead>
              <TableHead className="min-w-[100px]">Fecha Pago</TableHead>
              <TableHead className="min-w-[120px]">Archivos</TableHead>
              <TableHead className="text-right min-w-[120px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEgresos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} className="text-center py-8">
                  No se encontraron egresos basados en horas
                </TableCell>
              </TableRow>
            ) : (
              filteredEgresos.map((egreso) => {
                const facturaUrl = egreso.facturaUrl || egreso.factura
                const comprobanteUrl = egreso.comprobanteUrl || egreso.comprobante
                
                return (
                  <TableRow key={egreso.id}>
                    <TableCell className="font-medium">{egreso.concepto}</TableCell>
                    <TableCell>{egreso.categoria}</TableCell>
                    <TableCell>{egreso.empresa}</TableCell>
                    <TableCell>{egreso.equipo}</TableCell>
                    <TableCell>{egreso.lineaNegocio}</TableCell>
                    <TableCell>{getTipoBadge(egreso.tipo)}</TableCell>
                    <TableCell>{egreso.mes}</TableCell>
                    <TableCell className="text-right">${egreso.subtotal.toLocaleString("es-MX")}</TableCell>
                    <TableCell className="text-right">${egreso.iva.toLocaleString("es-MX")}</TableCell>
                    <TableCell className="text-right font-medium">${egreso.total.toLocaleString("es-MX")}</TableCell>
                    <TableCell>{getStatusBadge(egreso.status)}</TableCell>
                    <TableCell>{egreso.fechaPago || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {facturaUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewFile(facturaUrl, egreso.facturaFileName || 'factura.pdf', 'factura')}
                            title="Ver factura"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        )}
                        {comprobanteUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewFile(comprobanteUrl, egreso.comprobanteFileName || 'comprobante.pdf', 'comprobante')}
                            title="Ver comprobante"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        {!facturaUrl && !comprobanteUrl && (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteEgreso(egreso.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Upload Dialog */}
      <CargarHistoricoDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onSuccess={handleRefresh}
      />

      {/* File Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {previewFile?.type === 'factura' ? 'Factura' : 'Comprobante'}
            </DialogTitle>
            <DialogDescription>
              {previewFile?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="w-full h-[70vh] flex items-center justify-center">
            {previewFile && (
              <iframe
                src={previewFile.url}
                className="w-full h-full border rounded"
                title={previewFile.name}
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewFile(null)}>
              Cerrar
            </Button>
            {previewFile && (
              <Button asChild>
                <a href={previewFile.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Abrir en nueva pestaña
                </a>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

