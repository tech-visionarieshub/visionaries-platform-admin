"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Badge } from "@/components/ui/badge"
import { Search, Plus, FileText, Download, LinkIcon } from "lucide-react"
import { toast } from "sonner"
import { mockComplementos, type Complemento } from "@/lib/mock-data/finanzas"

const FORMAS_PAGO = [
  { value: "01", label: "01 - Efectivo" },
  { value: "02", label: "02 - Cheque nominativo" },
  { value: "03", label: "03 - Transferencia electrónica" },
  { value: "04", label: "04 - Tarjeta de crédito" },
  { value: "28", label: "28 - Tarjeta de débito" },
]

export function ComplementosTable() {
  const [complementos, setComplementos] = useState<Complemento[]>(mockComplementos)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [mesFilter, setMesFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newComplemento, setNewComplemento] = useState<Partial<Complemento>>({
    moneda: "MXN",
    formaPago: "03",
    status: "Activo",
  })

  const filteredComplementos = complementos.filter((comp) => {
    const matchesSearch =
      comp.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.folioFactura.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.rfcReceptor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.numeroOperacion.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || comp.status === statusFilter
    const matchesMes = mesFilter === "all" || comp.mesFacturacion === mesFilter

    return matchesSearch && matchesStatus && matchesMes
  })

  const mesesUnicos = Array.from(new Set(complementos.map((c) => c.mesFacturacion)))

  const handleCreateComplemento = () => {
    if (!newComplemento.facturaId || !newComplemento.montoPago || !newComplemento.fechaPago) {
      toast.error("Por favor completa todos los campos requeridos")
      return
    }

    const complemento: Complemento = {
      id: `${complementos.length + 1}`,
      facturaId: newComplemento.facturaId!,
      folioFactura: newComplemento.folioFactura || "A-XXX",
      empresa: newComplemento.empresa || "Empresa Mock",
      rfcReceptor: newComplemento.rfcReceptor || "XXX000000XXX",
      razonSocial: newComplemento.razonSocial || "RAZON SOCIAL MOCK",
      moneda: newComplemento.moneda || "MXN",
      montoPago: newComplemento.montoPago!,
      formaPago: newComplemento.formaPago || "03",
      fechaPago: newComplemento.fechaPago!,
      horaPago: newComplemento.horaPago || new Date().toTimeString().split(" ")[0],
      numeroOperacion: newComplemento.numeroOperacion || `OP${Date.now()}`,
      folioFiscal: `${Math.random().toString(36).substring(2, 15).toUpperCase()}-MOCK`,
      status: "Activo",
      mesFacturacion: new Date(newComplemento.fechaPago!).toLocaleDateString("es-MX", {
        month: "long",
        year: "numeric",
      }),
    }

    setComplementos([complemento, ...complementos])
    setIsCreateDialogOpen(false)
    setNewComplemento({ moneda: "MXN", formaPago: "03", status: "Activo" })
    toast.success("Complemento de pago generado exitosamente (simulado)")
  }

  const handleCancelar = (id: string) => {
    setComplementos(complementos.map((comp) => (comp.id === id ? { ...comp, status: "Cancelado" as const } : comp)))
    toast.success("Complemento cancelado (simulado)")
  }

  return (
    <div className="space-y-4">
      {/* Filtros y búsqueda */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por empresa, folio, RFC, operación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Activo">Activo</SelectItem>
                <SelectItem value="Cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Mes</Label>
            <Select value={mesFilter} onValueChange={setMesFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los meses</SelectItem>
                {mesesUnicos.map((mes) => (
                  <SelectItem key={mes} value={mes}>
                    {mes}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Generar Complemento
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[100px]">Folio</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>RFC</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Forma Pago</TableHead>
              <TableHead>Fecha Pago</TableHead>
              <TableHead>No. Operación</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Mes</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredComplementos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  No se encontraron complementos
                </TableCell>
              </TableRow>
            ) : (
              filteredComplementos.map((complemento) => (
                <TableRow key={complemento.id} className="h-12">
                  <TableCell className="font-mono text-xs">{complemento.folioFactura}</TableCell>
                  <TableCell className="font-medium">{complemento.empresa}</TableCell>
                  <TableCell className="font-mono text-xs">{complemento.rfcReceptor}</TableCell>
                  <TableCell className="font-semibold">
                    {complemento.moneda} ${complemento.montoPago.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs">{complemento.formaPago}</TableCell>
                  <TableCell className="text-xs">
                    {new Date(complemento.fechaPago).toLocaleDateString("es-MX")}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{complemento.numeroOperacion}</TableCell>
                  <TableCell>
                    <Badge
                      variant={complemento.status === "Activo" ? "default" : "secondary"}
                      className={complemento.status === "Activo" ? "bg-green-500 hover:bg-green-600" : "bg-gray-500"}
                    >
                      {complemento.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{complemento.mesFacturacion}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {complemento.pdfUrl && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            window.open(complemento.pdfUrl, "_blank")
                            toast.success("Abriendo PDF (simulado)")
                          }}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                      {complemento.xmlUrl && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            toast.success("Descargando XML (simulado)")
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          toast.info(`Factura vinculada: ${complemento.facturaId}`)
                        }}
                      >
                        <LinkIcon className="h-4 w-4" />
                      </Button>
                      {complemento.status === "Activo" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleCancelar(complemento.id)}
                        >
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog para crear complemento */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generar Complemento de Pago</DialogTitle>
            <DialogDescription>Genera un complemento de pago para una factura con método PPD</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facturaId">
                  ID Factura <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="facturaId"
                  placeholder="F-2025-001"
                  value={newComplemento.facturaId || ""}
                  onChange={(e) => setNewComplemento({ ...newComplemento, facturaId: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="folioFactura">Folio Factura</Label>
                <Input
                  id="folioFactura"
                  placeholder="A-100"
                  value={newComplemento.folioFactura || ""}
                  onChange={(e) => setNewComplemento({ ...newComplemento, folioFactura: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="empresa">Empresa</Label>
                <Input
                  id="empresa"
                  placeholder="TechCorp SA"
                  value={newComplemento.empresa || ""}
                  onChange={(e) => setNewComplemento({ ...newComplemento, empresa: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rfcReceptor">RFC Receptor</Label>
                <Input
                  id="rfcReceptor"
                  placeholder="TCO850101ABC"
                  value={newComplemento.rfcReceptor || ""}
                  onChange={(e) => setNewComplemento({ ...newComplemento, rfcReceptor: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="razonSocial">Razón Social</Label>
              <Input
                id="razonSocial"
                placeholder="TECHCORP SA DE CV"
                value={newComplemento.razonSocial || ""}
                onChange={(e) => setNewComplemento({ ...newComplemento, razonSocial: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="montoPago">
                  Monto del Pago <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="montoPago"
                  type="number"
                  placeholder="50000"
                  value={newComplemento.montoPago || ""}
                  onChange={(e) =>
                    setNewComplemento({ ...newComplemento, montoPago: Number.parseFloat(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="moneda">Moneda</Label>
                <Select
                  value={newComplemento.moneda}
                  onValueChange={(value) => setNewComplemento({ ...newComplemento, moneda: value })}
                >
                  <SelectTrigger id="moneda">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MXN">MXN</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="formaPago">Forma de Pago</Label>
                <Select
                  value={newComplemento.formaPago}
                  onValueChange={(value) => setNewComplemento({ ...newComplemento, formaPago: value })}
                >
                  <SelectTrigger id="formaPago">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMAS_PAGO.map((forma) => (
                      <SelectItem key={forma.value} value={forma.value}>
                        {forma.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fechaPago">
                  Fecha de Pago <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="fechaPago"
                  type="date"
                  value={newComplemento.fechaPago || ""}
                  onChange={(e) => setNewComplemento({ ...newComplemento, fechaPago: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="horaPago">Hora de Pago</Label>
                <Input
                  id="horaPago"
                  type="time"
                  value={newComplemento.horaPago || ""}
                  onChange={(e) => setNewComplemento({ ...newComplemento, horaPago: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numeroOperacion">Número de Operación</Label>
              <Input
                id="numeroOperacion"
                placeholder="OP123456789"
                value={newComplemento.numeroOperacion || ""}
                onChange={(e) => setNewComplemento({ ...newComplemento, numeroOperacion: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateComplemento}>Generar Complemento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
