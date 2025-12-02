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
    return Array.from(new Set(egresos.map((e) => e.categoria).filter(Boolean))).sort()
  }, [egresos])

  const uniqueEmpresas = useMemo(() => {
    return Array.from(new Set(egresos.map((e) => e.empresa).filter(Boolean))).sort()
  }, [egresos])

  const uniqueMeses = useMemo(() => {
    return Array.from(new Set(egresos.map((e) => e.mes).filter(Boolean))).sort()
  }, [egresos])

  const uniqueTipos = useMemo(() => {
    return Array.from(new Set(egresos.map((e) => e.tipo).filter(Boolean))).sort()
  }, [egresos])

  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(egresos.map((e) => e.status).filter(Boolean))).sort()
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
                  {uniqueCategorias.filter(cat => cat && cat.trim() !== '').map((cat) => (
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
                  {uniqueEmpresas.filter(emp => emp && emp.trim() !== '').map((emp) => (
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
                {uniqueStatuses.filter(s => s && s.trim() !== '').map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
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
                {uniqueTipos.filter(t => t && t.trim() !== '').map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
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
                {uniqueMeses.filter(m => m && m.trim() !== '').map((mes) => (
                  <SelectItem key={mes} value={mes}>
                    {mes}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border w-full overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">Línea de negocio</TableHead>
                <TableHead className="whitespace-nowrap">Categoría</TableHead>
                <TableHead className="whitespace-nowrap">Empresa</TableHead>
                <TableHead className="whitespace-nowrap">Equipo</TableHead>
                <TableHead className="whitespace-nowrap">Concepto</TableHead>
                <TableHead className="text-right whitespace-nowrap">Subtotal</TableHead>
                <TableHead className="text-right whitespace-nowrap">IVA</TableHead>
                <TableHead className="text-right whitespace-nowrap">Total</TableHead>
                <TableHead className="whitespace-nowrap">Tipo</TableHead>
                <TableHead className="whitespace-nowrap">Mes</TableHead>
                <TableHead className="whitespace-nowrap">Status</TableHead>
                <TableHead className="whitespace-nowrap">Factura</TableHead>
                <TableHead className="whitespace-nowrap">Comprobante</TableHead>
                <TableHead className="whitespace-nowrap">Fecha pago</TableHead>
                <TableHead className="text-right whitespace-nowrap">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEgresos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={15} className="text-center py-8">
                    No se encontraron egresos basados en horas
                  </TableCell>
                </TableRow>
              ) : (
                filteredEgresos.map((egreso) => {
                  const facturaUrl = egreso.facturaUrl || egreso.factura
                  const comprobanteUrl = egreso.comprobanteUrl || egreso.comprobante
                  
                  return (
                    <TableRow key={egreso.id}>
                      <TableCell className="break-words max-w-[120px]">{egreso.lineaNegocio || '-'}</TableCell>
                      <TableCell className="break-words max-w-[120px]">{egreso.categoria || '-'}</TableCell>
                      <TableCell className="break-words max-w-[150px]">{egreso.empresa || '-'}</TableCell>
                      <TableCell className="break-words max-w-[120px]">{egreso.equipo || '-'}</TableCell>
                      <TableCell className="break-words max-w-[200px] font-medium">{egreso.concepto || '-'}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">${egreso.subtotal.toLocaleString("es-MX")}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">${egreso.iva.toLocaleString("es-MX")}</TableCell>
                      <TableCell className="text-right whitespace-nowrap font-medium">${egreso.total.toLocaleString("es-MX")}</TableCell>
                      <TableCell className="whitespace-nowrap">{getTipoBadge(egreso.tipo)}</TableCell>
                      <TableCell className="whitespace-nowrap">{egreso.mes || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap">{getStatusBadge(egreso.status)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {facturaUrl ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewFile(facturaUrl, egreso.facturaFileName || 'factura.pdf', 'factura')}
                            title="Ver factura"
                            className="h-8 w-8"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {comprobanteUrl ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewFile(comprobanteUrl, egreso.comprobanteFileName || 'comprobante.pdf', 'comprobante')}
                            title="Ver comprobante"
                            className="h-8 w-8"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{egreso.fechaPago || '-'}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteEgreso(egreso.id)} className="h-8 w-8">
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

