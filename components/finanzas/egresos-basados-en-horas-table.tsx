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
import { getEgresosBasadosEnHoras, deleteEgreso, updateEgreso, getClientes, type Egreso, type Cliente } from "@/lib/api/finanzas-api"
import { normalizeEmpresa } from "@/lib/utils/normalize-empresa"
import { CargarHistoricoDialog } from "./cargar-historico-dialog"
import { DashboardMensual } from "./dashboard-mensual"
import { NuevoEgresoDialog } from "./nuevo-egreso-dialog"
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
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [updatingEgresoId, setUpdatingEgresoId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [tipoFilter, setTipoFilter] = useState<string>("all")
  const [mesFilter, setMesFilter] = useState<string>("all")
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all")
  const [empresaFilter, setEmpresaFilter] = useState<string>("all")
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [isNuevoEgresoDialogOpen, setIsNuevoEgresoDialogOpen] = useState(false)
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

  useEffect(() => {
    async function loadClientes() {
      try {
        setLoadingClientes(true)
        const data = await getClientes()
        setClientes(data)
      } catch (err: any) {
        if (err.name === 'AuthenticationError' || err.message?.includes('authentication')) {
          return
        }
        console.error('Error loading clientes:', err)
      } finally {
        setLoadingClientes(false)
      }
    }
    loadClientes()
  }, [])

  // Función para parsear mes en formato "Enero 2024" a fecha para ordenar
  const parseMesToDate = (mes: string): Date => {
    if (!mes) return new Date(0)
    
    const mesesMap: Record<string, number> = {
      'enero': 0, 'febrero': 1, 'marzo': 2, 'abril': 3,
      'mayo': 4, 'junio': 5, 'julio': 6, 'agosto': 7,
      'septiembre': 8, 'octubre': 9, 'noviembre': 10, 'diciembre': 11,
    }
    
    const partes = mes.trim().split(' ')
    if (partes.length < 2) return new Date(0)
    
    const mesNombre = partes[0].toLowerCase()
    const año = parseInt(partes[1])
    
    if (isNaN(año) || !mesesMap[mesNombre]) return new Date(0)
    
    return new Date(año, mesesMap[mesNombre], 1)
  }

  const uniqueCategorias = useMemo(() => {
    return Array.from(new Set(egresos.map((e) => e.categoria).filter(Boolean))).sort()
  }, [egresos])

  const uniqueEmpresas = useMemo(() => {
    // Normalizar empresas (sin emojis) para los filtros
    const empresasNormalizadas = egresos
      .map((e) => e.empresaNormalizada || normalizeEmpresa(e.empresa || ''))
      .filter(Boolean)
    return Array.from(new Set(empresasNormalizadas)).sort()
  }, [egresos])

  const uniqueMeses = useMemo(() => {
    // Ordenar meses del más actual al más viejo
    const meses = Array.from(new Set(egresos.map((e) => e.mes).filter(Boolean)))
    return meses.sort((a, b) => {
      const dateA = parseMesToDate(a)
      const dateB = parseMesToDate(b)
      return dateB.getTime() - dateA.getTime() // Más reciente primero
    })
  }, [egresos])

  const uniqueTipos = useMemo(() => {
    return Array.from(new Set(egresos.map((e) => e.tipo).filter(Boolean))).sort()
  }, [egresos])

  const uniqueStatuses = useMemo(() => {
    return Array.from(new Set(egresos.map((e) => e.status).filter(Boolean))).sort()
  }, [egresos])

  // Filtrar por año en curso por defecto
  const añoActual = new Date().getFullYear()
  
  const filteredEgresos = useMemo(() => {
    const filtered = egresos.filter((egreso) => {
      const empresaNormalizada = egreso.empresaNormalizada || normalizeEmpresa(egreso.empresa || '')
      
      // Filtrar por año en curso (extraer año del mes)
      const mesDate = parseMesToDate(egreso.mes || '')
      const matchesAño = mesDate.getFullYear() === añoActual
      
      const matchesSearch =
        egreso.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (egreso.empresa || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        empresaNormalizada.toLowerCase().includes(searchTerm.toLowerCase()) ||
        egreso.categoria.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === "all" || egreso.status === statusFilter
      const matchesTipo = tipoFilter === "all" || egreso.tipo === tipoFilter
      const matchesMes = mesFilter === "all" || egreso.mes === mesFilter
      const matchesCategoria = categoriaFilter === "all" || egreso.categoria === categoriaFilter
      // Comparar con empresa normalizada en el filtro
      const matchesEmpresa = empresaFilter === "all" || empresaNormalizada === empresaFilter

      return matchesAño && matchesSearch && matchesStatus && matchesTipo && matchesMes && matchesCategoria && matchesEmpresa
    })
    
    // Ordenar por mes (más actual primero)
    return filtered.sort((a, b) => {
      const dateA = parseMesToDate(a.mes || '')
      const dateB = parseMesToDate(b.mes || '')
      return dateB.getTime() - dateA.getTime() // Más reciente primero
    })
  }, [egresos, searchTerm, statusFilter, tipoFilter, mesFilter, categoriaFilter, empresaFilter, añoActual])

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

  const handleUpdateCliente = async (egresoId: string, clienteId: string | undefined) => {
    try {
      setUpdatingEgresoId(egresoId)
      
      await updateEgreso(egresoId, {
        clienteId: clienteId || undefined,
      })
      
      // Actualizar el estado local
      setEgresos(egresos.map(e => 
        e.id === egresoId 
          ? { ...e, clienteId: clienteId || undefined }
          : e
      ))
      
      toast.success("Cliente vinculado exitosamente")
    } catch (error: any) {
      console.error("Error updating cliente:", error)
      toast.error(error.message || "Error al vincular cliente")
    } finally {
      setUpdatingEgresoId(null)
    }
  }

  const getClienteName = (clienteId: string | undefined): string => {
    if (!clienteId) return ""
    const cliente = clientes.find(c => c.id === clienteId)
    return cliente?.empresa || ""
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
      {/* Dashboard Mensual */}
      <DashboardMensual egresos={egresos} />

      {/* Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Total Egresos {añoActual}</div>
          <div className="text-2xl font-bold">${totalEgresos.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {filteredEgresos.length} egreso{filteredEgresos.length !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Pagado {añoActual}</div>
          <div className="text-2xl font-bold text-green-600">${totalPagado.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {filteredEgresos.filter((e) => e.status === "Pagado").length} egreso
            {filteredEgresos.filter((e) => e.status === "Pagado").length !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Pendiente {añoActual}</div>
          <div className="text-2xl font-bold text-orange-600">${totalPendiente.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
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
          <div className="flex gap-2">
            <Button onClick={() => setIsNuevoEgresoDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Egreso
            </Button>
            <Button onClick={() => setIsUploadDialogOpen(true)} variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Cargar Histórico
            </Button>
          </div>
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
                <TableHead className="min-w-[100px]">Línea de negocio</TableHead>
                <TableHead className="min-w-[100px]">Categoría</TableHead>
                <TableHead className="min-w-[120px]">Empresa</TableHead>
                <TableHead className="min-w-[150px]">Cliente Vinculado</TableHead>
                <TableHead className="min-w-[100px]">Equipo</TableHead>
                <TableHead className="min-w-[150px]">Concepto</TableHead>
                <TableHead className="min-w-[90px] text-right">Subtotal</TableHead>
                <TableHead className="min-w-[90px] text-right">IVA</TableHead>
                <TableHead className="min-w-[90px] text-right">Total</TableHead>
                <TableHead className="min-w-[80px]">Tipo</TableHead>
                <TableHead className="min-w-[100px]">Mes</TableHead>
                <TableHead className="min-w-[90px]">Status</TableHead>
                <TableHead className="min-w-[70px]">Factura</TableHead>
                <TableHead className="min-w-[100px]">Comprobante</TableHead>
                <TableHead className="min-w-[100px]">Fecha pago</TableHead>
                <TableHead className="min-w-[80px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEgresos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={16} className="text-center py-8">
                    No se encontraron egresos basados en horas
                  </TableCell>
                </TableRow>
              ) : (
                filteredEgresos.map((egreso) => {
                  const facturaUrl = egreso.facturaUrl || egreso.factura
                  const comprobanteUrl = egreso.comprobanteUrl || egreso.comprobante
                  
                  return (
                    <TableRow key={egreso.id}>
                      <TableCell>{egreso.lineaNegocio || '-'}</TableCell>
                      <TableCell>{egreso.categoria || '-'}</TableCell>
                      <TableCell>{egreso.empresa || '-'}</TableCell>
                      <TableCell>
                        {updatingEgresoId === egreso.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Select
                            value={egreso.clienteId || "sin-cliente"}
                            onValueChange={(value) => handleUpdateCliente(egreso.id, value === "sin-cliente" ? undefined : value)}
                            disabled={loadingClientes}
                          >
                            <SelectTrigger className="w-full min-w-[150px]">
                              <SelectValue placeholder="Seleccionar cliente" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="sin-cliente">Sin cliente</SelectItem>
                              {clientes.map((cliente) => (
                                <SelectItem key={cliente.id} value={cliente.id}>
                                  {cliente.empresa}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {egreso.clienteId && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {getClienteName(egreso.clienteId)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{egreso.equipo || '-'}</TableCell>
                      <TableCell className="font-medium">{egreso.concepto || '-'}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">${(egreso.subtotal || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">${(egreso.iva || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right whitespace-nowrap font-medium">${(egreso.total || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell>{getTipoBadge(egreso.tipo)}</TableCell>
                      <TableCell>{egreso.mes || '-'}</TableCell>
                      <TableCell>{getStatusBadge(egreso.status)}</TableCell>
                    <TableCell className="text-center">
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
                    <TableCell className="text-center">
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
                      <TableCell>{egreso.fechaPago || '-'}</TableCell>
                      <TableCell className="text-right">
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

      {/* Nuevo Egreso Dialog */}
      <NuevoEgresoDialog
        open={isNuevoEgresoDialogOpen}
        onOpenChange={setIsNuevoEgresoDialogOpen}
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

