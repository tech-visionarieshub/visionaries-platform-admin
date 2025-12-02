"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Edit, Trash2, Mail, Building2, FileText, Upload, Users, CheckCircle, DollarSign, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { getClientes, getCotizaciones, updateCliente, createCliente } from "@/lib/api/finanzas-api"
import { getCotizaciones as getCotizacionesAPI } from "@/lib/api/cotizaciones-api"
import { getProjects } from "@/lib/api/projects-api"
import Link from "next/link"
import type { Cliente } from "@/lib/api/finanzas-api"
import type { Project } from "@/lib/mock-data/projects"
import { CargarClientesDialog } from "./cargar-clientes-dialog"
import { toast } from "sonner"

export function ClientesTable() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [cotizaciones, setCotizaciones] = useState<any[]>([])
  const [proyectos, setProyectos] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Cliente>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [proyectosFilter, setProyectosFilter] = useState<string>("todos")
  const [cotizacionesFilter, setCotizacionesFilter] = useState<string>("todos")

  useEffect(() => {
    async function loadData() {
      try {
        const [clientesData, cotizacionesData, proyectosData] = await Promise.all([
          getClientes(),
          getCotizacionesAPI(),
          getProjects(),
        ])
        setClientes(clientesData)
        setCotizaciones(cotizacionesData)
        setProyectos(proyectosData)
      } catch (err: any) {
        // Si es error de autenticación, no hacer nada (ya redirige)
        if (err.name === 'AuthenticationError' || err.message?.includes('authentication')) {
          return
        }
        console.error('Error loading data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const getClienteStats = (clienteId: string) => {
    const clienteCotizaciones = cotizaciones.filter((c) => c.clienteId === clienteId)
    const aceptadas = clienteCotizaciones.filter((c) => ["Aceptada", "Firmada", "Convertida"].includes(c.estado)).length
    const total = clienteCotizaciones.length
    const valorTotal = clienteCotizaciones
      .filter((c) => ["Aceptada", "Firmada", "Convertida"].includes(c.estado))
      .reduce((sum, c) => sum + (c.desglose?.costoTotal || 0), 0)

    return { total, aceptadas, valorTotal }
  }

  // Calcular métricas del dashboard
  const dashboardMetrics = useMemo(() => {
    const totalClientes = clientes.length
    const clientesConProyectosActivos = clientes.filter(c => clienteTieneProyectosActivos.get(c.id)).length
    const clientesConCotizacionesAceptadas = clientes.filter(c => {
      const stats = getClienteStats(c.id)
      return stats.aceptadas > 0
    }).length
    const totalCotizaciones = cotizaciones.length
    const cotizacionesAceptadas = cotizaciones.filter(c => ["Aceptada", "Firmada", "Convertida"].includes(c.estado)).length
    const valorTotalCotizaciones = cotizaciones
      .filter(c => ["Aceptada", "Firmada", "Convertida"].includes(c.estado))
      .reduce((sum, c) => sum + (c.desglose?.costoTotal || 0), 0)

    return {
      totalClientes,
      clientesConProyectosActivos,
      clientesConCotizacionesAceptadas,
      totalCotizaciones,
      cotizacionesAceptadas,
      valorTotalCotizaciones,
    }
  }, [clientes, cotizaciones, clienteTieneProyectosActivos])

  // Verificar si un cliente tiene proyectos activos
  const clienteTieneProyectosActivos = useMemo(() => {
    const map = new Map<string, boolean>()
    proyectos.forEach((proyecto) => {
      if (proyecto.status !== "Finalizado" && proyecto.clientId) {
        map.set(proyecto.clientId, true)
      }
    })
    return map
  }, [proyectos])

  const filteredClientes = useMemo(() => {
    let filtered = clientes.filter(
      (cliente) =>
        cliente.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.rfc.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    // Filtrar por proyectos activos
    if (proyectosFilter === "con-proyectos") {
      filtered = filtered.filter(c => clienteTieneProyectosActivos.get(c.id))
    } else if (proyectosFilter === "sin-proyectos") {
      filtered = filtered.filter(c => !clienteTieneProyectosActivos.get(c.id))
    }

    // Filtrar por cotizaciones
    if (cotizacionesFilter === "con-cotizaciones") {
      filtered = filtered.filter(c => {
        const stats = getClienteStats(c.id)
        return stats.total > 0
      })
    } else if (cotizacionesFilter === "con-cotizaciones-aceptadas") {
      filtered = filtered.filter(c => {
        const stats = getClienteStats(c.id)
        return stats.aceptadas > 0
      })
    } else if (cotizacionesFilter === "sin-cotizaciones") {
      filtered = filtered.filter(c => {
        const stats = getClienteStats(c.id)
        return stats.total === 0
      })
    }

    // Ordenar: primero los que tienen proyectos activos, luego los demás
    return filtered.sort((a, b) => {
      const aTieneActivos = clienteTieneProyectosActivos.get(a.id) || false
      const bTieneActivos = clienteTieneProyectosActivos.get(b.id) || false

      if (aTieneActivos && !bTieneActivos) return -1
      if (!aTieneActivos && bTieneActivos) return 1
      
      // Si ambos tienen o no tienen proyectos activos, ordenar alfabéticamente por empresa
      return a.empresa.localeCompare(b.empresa)
    })
  }, [clientes, searchTerm, proyectosFilter, cotizacionesFilter, clienteTieneProyectosActivos])

  const handleEdit = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setIsEditing(true)
    setFormData(cliente)
    setIsDialogOpen(true)
  }

  const handleNew = () => {
    setSelectedCliente(null)
    setIsEditing(false)
    setFormData({})
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.empresa || !formData.razonSocial || !formData.rfc) {
      toast.error("Por favor completa los campos requeridos: Empresa, Razón Social y RFC")
      return
    }

    setIsSaving(true)
    try {
      if (isEditing && selectedCliente) {
        await updateCliente(selectedCliente.id, formData)
        toast.success("Cliente actualizado exitosamente")
      } else {
        await createCliente(formData as Omit<Cliente, 'id'>)
        toast.success("Cliente creado exitosamente")
      }
      setIsDialogOpen(false)
      await handleRefresh()
    } catch (error: any) {
      console.error('Error saving cliente:', error)
      toast.error(error.message || "Error al guardar el cliente")
    } finally {
      setIsSaving(false)
    }
  }

  const handleRefresh = async () => {
    try {
      const clientesData = await getClientes()
      setClientes(clientesData)
    } catch (err: any) {
      console.error('Error refreshing clientes:', err)
    }
  }

  return (
    <div className="space-y-4">
      {/* Dashboard de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clientes</p>
                <p className="text-2xl font-bold">{dashboardMetrics.totalClientes}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Con Proyectos Activos</p>
                <p className="text-2xl font-bold text-green-600">{dashboardMetrics.clientesConProyectosActivos}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboardMetrics.totalClientes > 0 
                    ? `${Math.round((dashboardMetrics.clientesConProyectosActivos / dashboardMetrics.totalClientes) * 100)}% del total`
                    : '0%'}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Con Cotizaciones Aceptadas</p>
                <p className="text-2xl font-bold text-purple-600">{dashboardMetrics.clientesConCotizacionesAceptadas}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboardMetrics.cotizacionesAceptadas} cotizaciones aceptadas
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Valor Total Cotizaciones</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${dashboardMetrics.valorTotalCotizaciones.toLocaleString('es-MX')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {dashboardMetrics.totalCotizaciones} cotizaciones totales
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar y Filtros */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por empresa, razón social o RFC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsUploadDialogOpen(true)} size="sm" variant="outline">
              <Upload className="h-4 w-4 mr-1" />
              Cargar CSV
            </Button>
            <Button onClick={handleNew} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nuevo Cliente
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Proyectos</Label>
            <Select value={proyectosFilter} onValueChange={setProyectosFilter}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los clientes</SelectItem>
                <SelectItem value="con-proyectos">Con proyectos activos</SelectItem>
                <SelectItem value="sin-proyectos">Sin proyectos activos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Cotizaciones</Label>
            <Select value={cotizacionesFilter} onValueChange={setCotizacionesFilter}>
              <SelectTrigger className="w-[200px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los clientes</SelectItem>
                <SelectItem value="con-cotizaciones">Con cotizaciones</SelectItem>
                <SelectItem value="con-cotizaciones-aceptadas">Con cotizaciones aceptadas</SelectItem>
                <SelectItem value="sin-cotizaciones">Sin cotizaciones</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="min-w-[150px]">Empresa</TableHead>
                <TableHead className="min-w-[180px]">Razón Social</TableHead>
                <TableHead className="min-w-[120px]">RFC</TableHead>
                <TableHead className="min-w-[120px]">Cotizaciones</TableHead>
                <TableHead className="min-w-[150px]">Persona Cobranza</TableHead>
                <TableHead className="min-w-[200px]">Correo Cobranza</TableHead>
                <TableHead className="min-w-[100px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No se encontraron clientes
                  </TableCell>
                </TableRow>
              ) : (
                filteredClientes.map((cliente) => {
                  const stats = getClienteStats(cliente.id)
                  return (
                    <TableRow key={cliente.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-start gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <span>{cliente.empresa}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{cliente.razonSocial}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {cliente.rfc}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {stats.total > 0 ? (
                          <Link
                            href={`/cotizaciones?cliente=${cliente.id}`}
                            className="flex items-center gap-1.5 text-sm hover:underline"
                          >
                            <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium">
                              {stats.aceptadas}/{stats.total}
                            </span>
                            <span className="text-xs text-muted-foreground">cotizaciones</span>
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin cotizaciones</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{cliente.personaCobranza}</TableCell>
                      <TableCell>
                        <div className="flex items-start gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                          <span>{cliente.correoCobranza}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(cliente)} className="h-7 w-7 p-0">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
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

      {/* Dialog for Create/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
            <DialogDescription>Completa los datos fiscales y de cobranza del cliente</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            {/* Información General */}
            <div className="col-span-2">
              <h3 className="text-sm font-semibold mb-3">Información General</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa</Label>
              <Input 
                id="empresa" 
                value={formData.empresa || ''} 
                onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="razonSocial">Razón Social</Label>
              <Input 
                id="razonSocial" 
                value={formData.razonSocial || ''} 
                onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
              />
            </div>

            {/* Datos Fiscales */}
            <div className="col-span-2 mt-4">
              <h3 className="text-sm font-semibold mb-3">Datos Fiscales</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rfc">RFC</Label>
              <Input 
                id="rfc" 
                value={formData.rfc || ''} 
                onChange={(e) => setFormData({ ...formData, rfc: e.target.value })}
                className="font-mono" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp">Código Postal</Label>
              <Input 
                id="cp" 
                value={formData.cp || ''} 
                onChange={(e) => setFormData({ ...formData, cp: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regimenFiscal">Régimen Fiscal</Label>
              <Select 
                value={formData.regimenFiscal || ''} 
                onValueChange={(value) => setFormData({ ...formData, regimenFiscal: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar régimen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="601 - General de Ley Personas Morales">
                    601 - General de Ley Personas Morales
                  </SelectItem>
                  <SelectItem value="612 - Personas Físicas con Actividades Empresariales">
                    612 - Personas Físicas con Actividades Empresariales
                  </SelectItem>
                  <SelectItem value="626 - Régimen Simplificado de Confianza">
                    626 - Régimen Simplificado de Confianza
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="usoCFDI">Uso CFDI</Label>
              <Select 
                value={formData.usoCFDI || ''} 
                onValueChange={(value) => setFormData({ ...formData, usoCFDI: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar uso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="G03 - Gastos en general">G03 - Gastos en general</SelectItem>
                  <SelectItem value="P01 - Por definir">P01 - Por definir</SelectItem>
                  <SelectItem value="D10 - Pagos por servicios educativos">
                    D10 - Pagos por servicios educativos
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dirección Fiscal */}
            <div className="col-span-2 mt-4">
              <h3 className="text-sm font-semibold mb-3">Dirección Fiscal</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="calle">Calle</Label>
              <Input 
                id="calle" 
                value={formData.calle || ''} 
                onChange={(e) => setFormData({ ...formData, calle: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="colonia">Colonia</Label>
              <Input 
                id="colonia" 
                value={formData.colonia || ''} 
                onChange={(e) => setFormData({ ...formData, colonia: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="noExterior">No. Exterior</Label>
              <Input 
                id="noExterior" 
                value={formData.noExterior || ''} 
                onChange={(e) => setFormData({ ...formData, noExterior: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="noInterior">No. Interior</Label>
              <Input 
                id="noInterior" 
                value={formData.noInterior || ''} 
                onChange={(e) => setFormData({ ...formData, noInterior: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="municipio">Municipio</Label>
              <Input 
                id="municipio" 
                value={formData.municipio || ''} 
                onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Input 
                id="estado" 
                value={formData.estado || ''} 
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="localidad">Localidad</Label>
              <Input 
                id="localidad" 
                value={formData.localidad || ''} 
                onChange={(e) => setFormData({ ...formData, localidad: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pais">País</Label>
              <Input 
                id="pais" 
                value={formData.pais || 'MÉXICO'} 
                onChange={(e) => setFormData({ ...formData, pais: e.target.value })}
              />
            </div>

            {/* Datos de Cobranza */}
            <div className="col-span-2 mt-4">
              <h3 className="text-sm font-semibold mb-3">Datos de Cobranza</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="personaCobranza">Persona Cobranza</Label>
              <Input 
                id="personaCobranza" 
                value={formData.personaCobranza || ''} 
                onChange={(e) => setFormData({ ...formData, personaCobranza: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="correoCobranza">Correo Cobranza</Label>
              <Input 
                id="correoCobranza" 
                type="email" 
                value={formData.correoCobranza || ''} 
                onChange={(e) => setFormData({ ...formData, correoCobranza: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ccCobranza">CC Cobranza</Label>
              <Input 
                id="ccCobranza" 
                type="email" 
                value={formData.ccCobranza || ''} 
                onChange={(e) => setFormData({ ...formData, ccCobranza: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cuentaPago">Cuenta de Pago</Label>
              <Input 
                id="cuentaPago" 
                value={formData.cuentaPago || ''} 
                onChange={(e) => setFormData({ ...formData, cuentaPago: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="datosPago">Datos de Pago (CLABE, Cuenta, etc.)</Label>
              <Input 
                id="datosPago" 
                value={formData.datosPago || ''} 
                onChange={(e) => setFormData({ ...formData, datosPago: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Guardando..." : isEditing ? "Guardar Cambios" : "Crear Cliente"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <CargarClientesDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        onSuccess={handleRefresh}
      />
    </div>
  )
}
