"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, FileText, Send, XCircle, Receipt } from "lucide-react"
import { getFacturas, type Factura } from "@/lib/api/finanzas-api"
import { useEffect } from "react"

export function FacturasTable() {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadFacturas() {
      try {
        const data = await getFacturas()
        setFacturas(data)
      } catch (err: any) {
        // Si es error de autenticación, no hacer nada (ya redirige)
        if (err.name === 'AuthenticationError' || err.message?.includes('authentication')) {
          return
        }
        console.error('Error loading facturas:', err)
      } finally {
        setLoading(false)
      }
    }
    loadFacturas()
  }, [])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [mesFilter, setMesFilter] = useState<string>("all")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [sendDialogOpen, setSendDialogOpen] = useState(false)
  const [selectedFactura, setSelectedFactura] = useState<Factura | null>(null)

  const filteredFacturas = facturas.filter((factura) => {
    const matchesSearch =
      factura.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factura.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factura.rfc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      factura.folio.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || factura.status === statusFilter
    const matchesMes = mesFilter === "all" || factura.mesFacturacion === mesFilter

    return matchesSearch && matchesStatus && matchesMes
  })

  const getStatusBadge = (status: Factura["status"]) => {
    const variants = {
      Pagada: "default",
      Pendiente: "secondary",
      Cancelada: "destructive",
      Vencida: "destructive",
    }
    return (
      <Badge variant={variants[status] as any} className="text-xs">
        {status}
      </Badge>
    )
  }

  const handleSendFactura = (factura: Factura) => {
    setSelectedFactura(factura)
    setSendDialogOpen(true)
  }

  const handleCancelFactura = (id: string) => {
    setFacturas(facturas.map((f) => (f.id === id ? { ...f, status: "Cancelada" as const } : f)))
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount)
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por empresa, razón social, RFC o folio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Pagada">Pagada</SelectItem>
              <SelectItem value="Pendiente">Pendiente</SelectItem>
              <SelectItem value="Vencida">Vencida</SelectItem>
              <SelectItem value="Cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Mes</Label>
          <Select value={mesFilter} onValueChange={setMesFilter}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Enero 2025">Enero 2025</SelectItem>
              <SelectItem value="Febrero 2025">Febrero 2025</SelectItem>
              <SelectItem value="Marzo 2025">Marzo 2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Nueva Factura
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="h-8 text-xs w-[8%]">Folio</TableHead>
                <TableHead className="h-8 text-xs w-[15%]">Empresa</TableHead>
                <TableHead className="h-8 text-xs w-[10%]">RFC</TableHead>
                <TableHead className="h-8 text-xs w-[18%]">Conceptos</TableHead>
                <TableHead className="h-8 text-xs text-right w-[8%]">Subtotal</TableHead>
                <TableHead className="h-8 text-xs text-right w-[8%]">IVA</TableHead>
                <TableHead className="h-8 text-xs text-right w-[8%]">Total</TableHead>
                <TableHead className="h-8 text-xs w-[8%]">Status</TableHead>
                <TableHead className="h-8 text-xs w-[8%]">Mes</TableHead>
                <TableHead className="h-8 text-xs w-[9%]">Vencimiento</TableHead>
                <TableHead className="h-8 text-xs text-right w-[10%]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFacturas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    No se encontraron facturas
                  </TableCell>
                </TableRow>
              ) : (
                filteredFacturas.map((factura) => (
                  <TableRow key={factura.id}>
                    <TableCell className="py-1 text-xs font-mono break-words">{factura.folio}</TableCell>
                    <TableCell className="py-1 text-xs break-words">
                      <div className="flex flex-col">
                        <span className="font-medium break-words">{factura.empresa}</span>
                        <span className="text-muted-foreground text-[10px] break-words">{factura.razonSocial}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-1 text-xs font-mono break-words">{factura.rfc}</TableCell>
                    <TableCell className="py-1 text-xs break-words">{factura.conceptos}</TableCell>
                    <TableCell className="py-1 text-xs text-right whitespace-nowrap">{formatCurrency(factura.subtotal)}</TableCell>
                    <TableCell className="py-1 text-xs text-right whitespace-nowrap">{formatCurrency(factura.iva)}</TableCell>
                    <TableCell className="py-1 text-xs text-right font-medium whitespace-nowrap">{formatCurrency(factura.total)}</TableCell>
                    <TableCell className="py-1 break-words">{getStatusBadge(factura.status)}</TableCell>
                    <TableCell className="py-1 text-xs break-words">{factura.mesFacturacion}</TableCell>
                    <TableCell className="py-1 text-xs break-words">
                      {new Date(factura.fechaVencimiento).toLocaleDateString("es-MX")}
                    </TableCell>
                    <TableCell className="py-1 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {factura.pdfUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => window.open(factura.pdfUrl, "_blank")}
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {factura.status !== "Cancelada" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => handleSendFactura(factura)}
                            >
                              <Send className="h-3.5 w-3.5" />
                            </Button>
                            {factura.requiereComplemento && factura.status === "Pagada" && (
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <Receipt className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-destructive"
                              onClick={() => handleCancelFactura(factura.id)}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
        </Table>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        Mostrando {filteredFacturas.length} de {facturas.length} facturas
      </div>

      {/* Send Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Factura</DialogTitle>
            <DialogDescription>
              Envía la factura {selectedFactura?.folio} a {selectedFactura?.empresa}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Destinatarios</Label>
              <Input placeholder="correo@ejemplo.com, otro@ejemplo.com" defaultValue="facturacion@example.com" />
              <p className="text-xs text-muted-foreground">Separa múltiples correos con comas</p>
            </div>
            <div className="space-y-2">
              <Label>Asunto</Label>
              <Input defaultValue={`Factura ${selectedFactura?.folio} - ${selectedFactura?.empresa}`} />
            </div>
            <div className="space-y-2">
              <Label>Mensaje</Label>
              <Textarea
                placeholder="Mensaje personalizado..."
                defaultValue={`Estimado cliente,\n\nAdjunto encontrará la factura ${selectedFactura?.folio} por un total de ${selectedFactura ? formatCurrency(selectedFactura.total) : ""}.\n\nSaludos cordiales,\nVisionaries Hub`}
                rows={6}
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Se adjuntarán PDF y XML de la factura</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setSendDialogOpen(false)
                // Simular envío
                alert("Factura enviada correctamente vía Brevo")
              }}
            >
              <Send className="h-4 w-4 mr-2" />
              Enviar Factura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Factura</DialogTitle>
            <DialogDescription>Crea una nueva factura seleccionando un cliente y agregando conceptos</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">TechCorp Solutions</SelectItem>
                    <SelectItem value="2">Digital Systems</SelectItem>
                    <SelectItem value="3">Innovatech SA</SelectItem>
                    <SelectItem value="4">CloudTech Inc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Método de Pago</Label>
                <Select defaultValue="PUE">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUE">PUE - Pago en una sola exhibición</SelectItem>
                    <SelectItem value="PPD">PPD - Pago en parcialidades</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Forma de Pago</Label>
                <Select defaultValue="03">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="03">03 - Transferencia electrónica</SelectItem>
                    <SelectItem value="99">99 - Por definir</SelectItem>
                    <SelectItem value="01">01 - Efectivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Uso CFDI</Label>
                <Select defaultValue="G03">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="G03">G03 - Gastos en general</SelectItem>
                    <SelectItem value="P01">P01 - Por definir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Conceptos</Label>
              <Textarea placeholder="Describe los servicios o productos facturados..." rows={3} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Subtotal</Label>
                <Input type="number" placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label>IVA (16%)</Label>
                <Input type="number" placeholder="0.00" disabled />
              </div>
              <div className="space-y-2">
                <Label>Total</Label>
                <Input type="number" placeholder="0.00" disabled />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Emisión</Label>
                <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
              </div>
              <div className="space-y-2">
                <Label>Fecha de Vencimiento</Label>
                <Input type="date" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setCreateDialogOpen(false)
                alert("Factura creada correctamente")
              }}
            >
              Crear Factura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
