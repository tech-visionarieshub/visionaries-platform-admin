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
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Pencil, Trash2, Download } from "lucide-react"
import { toast } from "sonner"
import { mockTeamMembers, type PaymentMethod, type TeamMember } from "@/lib/mock-data/finanzas"

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

export function NominaTable() {
  const [team, setTeam] = useState<TeamMember[]>(mockTeamMembers)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedYear, setSelectedYear] = useState("2025")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>("")

  // Form states
  const [formData, setFormData] = useState({
    nombre: "",
    formaPago: "Efectivo" as PaymentMethod,
    clabe: "",
    banco: "",
  })

  const [paymentAmount, setPaymentAmount] = useState("")

  // Filtrar equipo
  const filteredTeam = team.filter((member) => member.nombre.toLowerCase().includes(searchTerm.toLowerCase()))

  // Calcular totales por mes
  const monthlyTotals = MESES.reduce(
    (acc, mes, index) => {
      const mesKey = `${selectedYear}-${String(index + 1).padStart(2, "0")}`
      const total = team.reduce((sum, member) => sum + (member.pagos[mesKey] || 0), 0)
      acc[mesKey] = total
      return acc
    },
    {} as Record<string, number>,
  )

  // Calcular total anual
  const totalAnual = Object.values(monthlyTotals).reduce((sum, val) => sum + val, 0)

  const handleAddMember = () => {
    const newMember: TeamMember = {
      id: Date.now().toString(),
      nombre: formData.nombre,
      formaPago: formData.formaPago,
      clabe: formData.clabe || undefined,
      banco: formData.banco || undefined,
      pagos: MESES.reduce(
        (acc, _, index) => {
          acc[`${selectedYear}-${String(index + 1).padStart(2, "0")}`] = 0
          return acc
        },
        {} as Record<string, number>,
      ),
    }

    setTeam([...team, newMember])
    setIsAddDialogOpen(false)
    setFormData({ nombre: "", formaPago: "Efectivo", clabe: "", banco: "" })
    toast.success("Miembro del equipo agregado")
  }

  const handleEditMember = () => {
    if (!selectedMember) return

    setTeam(team.map((member) => (member.id === selectedMember.id ? { ...member, ...formData } : member)))
    setIsEditDialogOpen(false)
    setSelectedMember(null)
    setFormData({ nombre: "", formaPago: "Efectivo", clabe: "", banco: "" })
    toast.success("Miembro del equipo actualizado")
  }

  const handleDeleteMember = (id: string) => {
    setTeam(team.filter((member) => member.id !== id))
    toast.success("Miembro del equipo eliminado")
  }

  const handleOpenEditDialog = (member: TeamMember) => {
    setSelectedMember(member)
    setFormData({
      nombre: member.nombre,
      formaPago: member.formaPago,
      clabe: member.clabe || "",
      banco: member.banco || "",
    })
    setIsEditDialogOpen(true)
  }

  const handleOpenPaymentDialog = (member: TeamMember, mes: string) => {
    setSelectedMember(member)
    setSelectedMonth(mes)
    setPaymentAmount(String(member.pagos[mes] || 0))
    setIsPaymentDialogOpen(true)
  }

  const handleSavePayment = () => {
    if (!selectedMember || !selectedMonth) return

    setTeam(
      team.map((member) =>
        member.id === selectedMember.id
          ? {
              ...member,
              pagos: {
                ...member.pagos,
                [selectedMonth]: Number.parseFloat(paymentAmount) || 0,
              },
            }
          : member,
      ),
    )
    setIsPaymentDialogOpen(false)
    setSelectedMember(null)
    setSelectedMonth("")
    setPaymentAmount("")
    toast.success("Pago actualizado")
  }

  const handleExport = () => {
    toast.success("Exportando reporte de nómina...")
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      {/* Métricas superiores */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Anual {selectedYear}</div>
          <div className="text-2xl font-bold">{formatCurrency(totalAnual)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Promedio Mensual</div>
          <div className="text-2xl font-bold">{formatCurrency(totalAnual / 12)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Miembros del Equipo</div>
          <div className="text-2xl font-bold">{team.length}</div>
        </Card>
      </div>

      {/* Controles */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Buscar</label>
            <Input
              placeholder="Buscar por nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-[200px]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Año</label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Miembro
          </Button>
        </div>
      </div>

      {/* Tabla con scroll horizontal */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-background z-10 min-w-[150px]">Nombre</TableHead>
              <TableHead className="min-w-[120px]">Forma de Pago</TableHead>
              <TableHead className="min-w-[150px]">CLABE</TableHead>
              <TableHead className="min-w-[100px]">Banco</TableHead>
              {MESES.map((mes) => (
                <TableHead key={mes} className="text-right min-w-[100px]">
                  {mes}
                </TableHead>
              ))}
              <TableHead className="text-right min-w-[120px]">Total Anual</TableHead>
              <TableHead className="sticky right-0 bg-background z-10 min-w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTeam.map((member) => {
              const totalMiembro = Object.values(member.pagos).reduce((sum, val) => sum + val, 0)
              return (
                <TableRow key={member.id}>
                  <TableCell className="sticky left-0 bg-background z-10 font-medium">{member.nombre}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{member.formaPago}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{member.clabe || "-"}</TableCell>
                  <TableCell>{member.banco || "-"}</TableCell>
                  {MESES.map((_, index) => {
                    const mesKey = `${selectedYear}-${String(index + 1).padStart(2, "0")}`
                    const monto = member.pagos[mesKey] || 0
                    return (
                      <TableCell
                        key={mesKey}
                        className="text-right cursor-pointer hover:bg-muted/50"
                        onClick={() => handleOpenPaymentDialog(member, mesKey)}
                      >
                        {monto > 0 ? formatCurrency(monto) : "-"}
                      </TableCell>
                    )
                  })}
                  <TableCell className="text-right font-semibold">{formatCurrency(totalMiembro)}</TableCell>
                  <TableCell className="sticky right-0 bg-background z-10">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenEditDialog(member)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteMember(member.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {/* Fila de totales */}
            <TableRow className="bg-muted/50 font-semibold">
              <TableCell className="sticky left-0 bg-muted/50 z-10">Total Mensual</TableCell>
              <TableCell colSpan={3}></TableCell>
              {MESES.map((_, index) => {
                const mesKey = `${selectedYear}-${String(index + 1).padStart(2, "0")}`
                return (
                  <TableCell key={mesKey} className="text-right">
                    {formatCurrency(monthlyTotals[mesKey] || 0)}
                  </TableCell>
                )
              })}
              <TableCell className="text-right">{formatCurrency(totalAnual)}</TableCell>
              <TableCell className="sticky right-0 bg-muted/50 z-10"></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Dialog: Agregar Miembro */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Miembro del Equipo</DialogTitle>
            <DialogDescription>Agrega un nuevo miembro del equipo para gestionar su nómina.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Forma de Pago</label>
              <Select
                value={formData.formaPago}
                onValueChange={(value: PaymentMethod) => setFormData({ ...formData, formaPago: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Efectivo">Efectivo</SelectItem>
                  <SelectItem value="Factura">Factura</SelectItem>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(formData.formaPago === "Factura" || formData.formaPago === "Transferencia") && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">CLABE</label>
                  <Input
                    value={formData.clabe}
                    onChange={(e) => setFormData({ ...formData, clabe: e.target.value })}
                    placeholder="0000 0000 0000 000000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Banco</label>
                  <Input
                    value={formData.banco}
                    onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                    placeholder="Nombre del banco"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddMember} disabled={!formData.nombre}>
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Miembro */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Miembro del Equipo</DialogTitle>
            <DialogDescription>Actualiza la información del miembro del equipo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nombre</label>
              <Input
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Forma de Pago</label>
              <Select
                value={formData.formaPago}
                onValueChange={(value: PaymentMethod) => setFormData({ ...formData, formaPago: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Efectivo">Efectivo</SelectItem>
                  <SelectItem value="Factura">Factura</SelectItem>
                  <SelectItem value="Transferencia">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(formData.formaPago === "Factura" || formData.formaPago === "Transferencia") && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">CLABE</label>
                  <Input
                    value={formData.clabe}
                    onChange={(e) => setFormData({ ...formData, clabe: e.target.value })}
                    placeholder="0000 0000 0000 000000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Banco</label>
                  <Input
                    value={formData.banco}
                    onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                    placeholder="Nombre del banco"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditMember} disabled={!formData.nombre}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Registrar Pago */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago</DialogTitle>
            <DialogDescription>
              Registra el pago para {selectedMember?.nombre} en{" "}
              {selectedMonth && MESES[Number.parseInt(selectedMonth.split("-")[1]) - 1]} {selectedYear}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Monto</label>
              <Input
                type="number"
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSavePayment}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
