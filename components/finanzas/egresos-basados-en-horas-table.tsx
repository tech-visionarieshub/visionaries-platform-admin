"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, FileText, Download, Trash2, Upload, ExternalLink, Loader2, Link2, Pencil, Edit } from "lucide-react"
import { toast } from "sonner"
import { getEgresosBasadosEnHoras, deleteEgreso, updateEgreso, getClientes, type Egreso, type Cliente } from "@/lib/api/finanzas-api"
import { apiPost } from "@/lib/api/client"
import { normalizeEmpresa } from "@/lib/utils/normalize-empresa"
import { CargarHistoricoDialog } from "./cargar-historico-dialog"
import { DashboardMensual } from "./dashboard-mensual"
import { NuevoEgresoDialog } from "./nuevo-egreso-dialog"
import { EditarEgresoDialog } from "./editar-egreso-dialog"
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
  const [generandoAutomaticos, setGenerandoAutomaticos] = useState(false)
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: 'factura' | 'comprobante' } | null>(null)
  const [linkDialog, setLinkDialog] = useState<{ open: boolean; egresoId: string; tipo: 'factura' | 'comprobante' } | null>(null)
  const [linkUrl, setLinkUrl] = useState("")
  const [savingLink, setSavingLink] = useState(false)
  const [editingEgreso, setEditingEgreso] = useState<Egreso | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

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
      
      // Preparar updates: si clienteId es undefined, enviarlo explícitamente para eliminar el campo
      const updates: any = {};
      if (clienteId) {
        updates.clienteId = clienteId;
      } else {
        // Si es undefined, enviar null para que Firestore lo elimine
        updates.clienteId = null;
      }
      
      await updateEgreso(egresoId, updates)
      
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

  const handleOpenLinkDialog = (egresoId: string, tipo: 'factura' | 'comprobante', currentUrl?: string) => {
    setLinkDialog({ open: true, egresoId, tipo })
    setLinkUrl(currentUrl || "")
  }

  const handleSaveLink = async () => {
    if (!linkDialog) return

    const url = linkUrl.trim()
    if (!url) {
      toast.error("Por favor ingresa una URL válida")
      return
    }

    // Validar que sea una URL válida
    try {
      new URL(url)
    } catch {
      toast.error("Por favor ingresa una URL válida (debe comenzar con http:// o https://)")
      return
    }

    setSavingLink(true)
    try {
      await updateEgreso(linkDialog.egresoId, {
        [linkDialog.tipo === 'factura' ? 'facturaUrl' : 'comprobanteUrl']: url,
      })

      // Actualizar estado local
      setEgresos(egresos.map(e => 
        e.id === linkDialog.egresoId 
          ? { 
              ...e, 
              [linkDialog.tipo === 'factura' ? 'facturaUrl' : 'comprobanteUrl']: url 
            }
          : e
      ))

      toast.success(`${linkDialog.tipo === 'factura' ? 'Factura' : 'Comprobante'} actualizado exitosamente`)
      setLinkDialog(null)
      setLinkUrl("")
    } catch (error: any) {
      console.error("Error saving link:", error)
      toast.error(error.message || "Error al guardar el link")
    } finally {
      setSavingLink(false)
    }
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

  const handleGenerarAutomaticos = async () => {
    if (!confirm("¿Estás seguro de que deseas generar egresos automáticos para todas las personas con precio por hora configurado?")) {
      return
    }

    setGenerandoAutomaticos(true)
    try {
      console.log('[Generar Automáticos] Iniciando generación...')
      const response = await apiPost<{
        success?: boolean
        error?: string
        mensaje?: string
        creados?: number
        totalEgresos?: any[]
        resumenPorPersona?: Array<{ persona: string; creados: number }>
        errores?: string[]
      }>('/api/egresos/generar-automaticos-todos', {})
      
      console.log('[Generar Automáticos] Respuesta recibida:', response)
      
      // apiPost devuelve response.data, así que result ya es el objeto data
      const result = response as any
      
      // Verificar si hay error en la respuesta
      if (result?.error) {
        throw new Error(result.error)
      }

      // Verificar que result existe y tiene la estructura esperada
      if (!result) {
        throw new Error('No se recibió respuesta del servidor')
      }

      console.log('[Generar Automáticos] Resultado procesado:', {
        creados: result.creados,
        totalEgresos: result.totalEgresos?.length,
        mensaje: result.mensaje,
        resumenPorPersona: result.resumenPorPersona,
      })

      // Si hay egresos creados, mostrar éxito
      if (result.totalEgresos && result.totalEgresos.length > 0) {
        toast.success(`Se generaron ${result.totalEgresos.length} egresos automáticos`)
        
        // Mostrar resumen por persona si existe
        if (result.resumenPorPersona && result.resumenPorPersona.length > 0) {
          const resumen = result.resumenPorPersona
            .map((r: { persona: string; creados: number }) => `${r.persona}: ${r.creados}`)
            .join(', ')
          toast.info(`Resumen: ${resumen}`)
        }

        // Mostrar errores si los hay (pero no críticos)
        if (result.errores && result.errores.length > 0) {
          console.warn('Errores parciales al generar egresos:', result.errores)
          if (result.errores.length <= 3) {
            result.errores.forEach((err: string) => toast.warning(err))
          } else {
            toast.warning(`${result.errores.length} errores menores durante la generación`)
          }
        }
      } else {
        // No se generaron egresos, mostrar mensaje informativo
        const mensaje = result.mensaje || 'No se generaron nuevos egresos. Verifica que haya tareas/features completadas con horas trabajadas.'
        toast.info(mensaje)
        console.log('[Generar Automáticos]', mensaje)
      }

      // Refrescar la lista de egresos
      await handleRefresh()
    } catch (error: any) {
      console.error('[Generar Automáticos] Error completo:', error)
      const errorMessage = error?.message || error?.error || 'Error al generar egresos automáticos'
      toast.error(`Error: ${errorMessage}`)
    } finally {
      setGenerandoAutomaticos(false)
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
            <Button 
              onClick={handleGenerarAutomaticos} 
              variant="outline"
              disabled={generandoAutomaticos}
            >
              {generandoAutomaticos ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Generar Automáticos
                </>
              )}
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
                      <div className="flex items-center justify-center gap-1">
                        {facturaUrl ? (
                          <>
                            <a
                              href={facturaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline text-xs flex items-center gap-1"
                              title={facturaUrl}
                            >
                              <Link2 className="h-3 w-3" />
                              <span className="max-w-[100px] truncate">Ver factura</span>
                            </a>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenLinkDialog(egreso.id, 'factura', facturaUrl)}
                              title="Editar link de factura"
                              className="h-6 w-6"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenLinkDialog(egreso.id, 'factura')}
                            title="Agregar link de factura"
                            className="h-8 w-8"
                          >
                            <Link2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {comprobanteUrl ? (
                          <>
                            <a
                              href={comprobanteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline text-xs flex items-center gap-1"
                              title={comprobanteUrl}
                            >
                              <Link2 className="h-3 w-3" />
                              <span className="max-w-[100px] truncate">Ver comprobante</span>
                            </a>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenLinkDialog(egreso.id, 'comprobante', comprobanteUrl)}
                              title="Editar link de comprobante"
                              className="h-6 w-6"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenLinkDialog(egreso.id, 'comprobante')}
                            title="Agregar link de comprobante"
                            className="h-8 w-8"
                          >
                            <Link2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                      <TableCell>{egreso.fechaPago || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {egreso.status !== "Pagado" && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => {
                                setEditingEgreso(egreso)
                                setIsEditDialogOpen(true)
                              }} 
                              className="h-8 w-8"
                              title="Editar egreso"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteEgreso(egreso.id)} className="h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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

      {/* Editar Egreso Dialog */}
      <EditarEgresoDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        egreso={editingEgreso}
        onSuccess={handleRefresh}
      />

      {/* Link Dialog */}
      <Dialog open={linkDialog?.open || false} onOpenChange={(open) => {
        if (!open) {
          setLinkDialog(null)
          setLinkUrl("")
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {linkDialog?.tipo === 'factura' ? 'Agregar/Editar Link de Factura' : 'Agregar/Editar Link de Comprobante'}
            </DialogTitle>
            <DialogDescription>
              Pega el link de la {linkDialog?.tipo === 'factura' ? 'factura' : 'comprobante'} (puede ser Google Drive, Dropbox, o cualquier URL)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="linkUrl">URL <span className="text-red-500">*</span></Label>
              <Input
                id="linkUrl"
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://..."
                disabled={savingLink}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setLinkDialog(null)
                setLinkUrl("")
              }} 
              disabled={savingLink}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveLink} disabled={savingLink || !linkUrl.trim()}>
              {savingLink ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Link"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

