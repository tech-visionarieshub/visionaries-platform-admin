"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Plus, Edit, Trash2, Mail, Building2, FileText, Upload } from "lucide-react"
import { getClientes, getCotizaciones } from "@/lib/api/finanzas-api"
import { getCotizaciones as getCotizacionesAPI } from "@/lib/api/cotizaciones-api"
import { getProjects } from "@/lib/api/projects-api"
import Link from "next/link"
import { useEffect, useMemo } from "react"
import type { Cliente } from "@/lib/api/finanzas-api"
import type { Project } from "@/lib/mock-data/projects"
import { CargarClientesDialog } from "./cargar-clientes-dialog"

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
    const filtered = clientes.filter(
      (cliente) =>
        cliente.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.rfc.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    // Ordenar: primero los que tienen proyectos activos, luego los demás
    return filtered.sort((a, b) => {
      const aTieneActivos = clienteTieneProyectosActivos.get(a.id) || false
      const bTieneActivos = clienteTieneProyectosActivos.get(b.id) || false

      if (aTieneActivos && !bTieneActivos) return -1
      if (!aTieneActivos && bTieneActivos) return 1
      
      // Si ambos tienen o no tienen proyectos activos, ordenar alfabéticamente por empresa
      return a.empresa.localeCompare(b.empresa)
    })
  }, [clientes, searchTerm, clienteTieneProyectosActivos])

  const handleEdit = (cliente: Cliente) => {
    setSelectedCliente(cliente)
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleNew = () => {
    setSelectedCliente(null)
    setIsEditing(false)
    setIsDialogOpen(true)
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
    <div className="space-y-3">
      {/* Toolbar */}
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

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[15%]">Empresa</TableHead>
                <TableHead className="w-[18%]">Razón Social</TableHead>
                <TableHead className="w-[10%]">RFC</TableHead>
                <TableHead className="w-[12%]">Cotizaciones</TableHead>
                <TableHead className="w-[15%]">Persona Cobranza</TableHead>
                <TableHead className="w-[18%]">Correo Cobranza</TableHead>
                <TableHead className="w-[12%] text-right">Acciones</TableHead>
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
                      <TableCell className="font-medium break-words text-wrap">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="break-words">{cliente.empresa}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm break-words text-wrap">{cliente.razonSocial}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs break-words">
                          {cliente.rfc}
                        </Badge>
                      </TableCell>
                      <TableCell className="break-words text-wrap">
                        {stats.total > 0 ? (
                          <Link
                            href={`/cotizaciones?cliente=${cliente.id}`}
                            className="flex items-center gap-1.5 text-sm hover:underline"
                          >
                            <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium break-words">
                              {stats.aceptadas}/{stats.total}
                            </span>
                            <span className="text-xs text-muted-foreground break-words">cotizaciones</span>
                          </Link>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin cotizaciones</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm break-words text-wrap">{cliente.personaCobranza}</TableCell>
                      <TableCell className="break-words text-wrap">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="break-words">{cliente.correoCobranza}</span>
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
              <Input id="empresa" defaultValue={selectedCliente?.empresa} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="razonSocial">Razón Social</Label>
              <Input id="razonSocial" defaultValue={selectedCliente?.razonSocial} />
            </div>

            {/* Datos Fiscales */}
            <div className="col-span-2 mt-4">
              <h3 className="text-sm font-semibold mb-3">Datos Fiscales</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rfc">RFC</Label>
              <Input id="rfc" defaultValue={selectedCliente?.rfc} className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cp">Código Postal</Label>
              <Input id="cp" defaultValue={selectedCliente?.cp} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="regimenFiscal">Régimen Fiscal</Label>
              <Select defaultValue={selectedCliente?.regimenFiscal}>
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
              <Select defaultValue={selectedCliente?.usoCFDI}>
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
              <Input id="calle" defaultValue={selectedCliente?.calle} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="colonia">Colonia</Label>
              <Input id="colonia" defaultValue={selectedCliente?.colonia} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="noExterior">No. Exterior</Label>
              <Input id="noExterior" defaultValue={selectedCliente?.noExterior} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="noInterior">No. Interior</Label>
              <Input id="noInterior" defaultValue={selectedCliente?.noInterior} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="municipio">Municipio</Label>
              <Input id="municipio" defaultValue={selectedCliente?.municipio} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Input id="estado" defaultValue={selectedCliente?.estado} />
            </div>

            {/* Datos de Cobranza */}
            <div className="col-span-2 mt-4">
              <h3 className="text-sm font-semibold mb-3">Datos de Cobranza</h3>
            </div>
            <div className="space-y-2">
              <Label htmlFor="personaCobranza">Persona Cobranza</Label>
              <Input id="personaCobranza" defaultValue={selectedCliente?.personaCobranza} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="correoCobranza">Correo Cobranza</Label>
              <Input id="correoCobranza" type="email" defaultValue={selectedCliente?.correoCobranza} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ccCobranza">CC Cobranza</Label>
              <Input id="ccCobranza" type="email" defaultValue={selectedCliente?.ccCobranza} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cuentaPago">Cuenta de Pago</Label>
              <Input id="cuentaPago" defaultValue={selectedCliente?.cuentaPago} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="datosPago">Datos de Pago (CLABE, Cuenta, etc.)</Label>
              <Input id="datosPago" defaultValue={selectedCliente?.datosPago} />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setIsDialogOpen(false)}>{isEditing ? "Guardar Cambios" : "Crear Cliente"}</Button>
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
