"use client"

import { useState, useMemo } from "react"
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
import { Plus, Search, FileText, Download, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { getEgresos, type Egreso } from "@/lib/api/finanzas-api"
import { useEffect } from "react"

const mockCategorias = ["Automatización", "Plataforma", "Estudios", "Cursos", "Conferencias", "Productos", "CFH"]
const mockLineasNegocio = ["iLab", "Pivot", "Co-Founders Academy", "Gaby Pino"]

export function EgresosTable() {
  const [egresos, setEgresos] = useState<Egreso[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEgresos() {
      try {
        const data = await getEgresos()
        setEgresos(data)
      } catch (err: any) {
        // Si es error de autenticación, no hacer nada (ya redirige)
        if (err.name === 'AuthenticationError' || err.message?.includes('authentication')) {
          return
        }
        console.error('Error loading egresos:', err)
      } finally {
        setLoading(false)
      }
    }
    loadEgresos()
  }, [])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [tipoFilter, setTipoFilter] = useState<string>("all")
  const [mesFilter, setMesFilter] = useState<string>("all")
  const [categoriaFilter, setCategoriaFilter] = useState<string>("all")
  const [empresaFilter, setEmpresaFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newEgreso, setNewEgreso] = useState<Partial<Egreso>>({
    tipo: "Variable",
    status: "Pendiente",
  })

  const [categorias, setCategorias] = useState<string[]>(mockCategorias)
  const [lineasNegocio, setLineasNegocio] = useState<string[]>(mockLineasNegocio)
  const [showCategoriesDialog, setShowCategoriesDialog] = useState(false)
  const [showLineasDialog, setShowLineasDialog] = useState(false)
  const [newCategoria, setNewCategoria] = useState("")
  const [newLineaNegocio, setNewLineaNegocio] = useState("")

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

  const handleCreateEgreso = () => {
    if (!newEgreso.concepto || !newEgreso.subtotal || !newEgreso.categoria || !newEgreso.mes) {
      toast.error("Por favor completa todos los campos requeridos")
      return
    }

    const iva = newEgreso.subtotal * 0.16
    const total = newEgreso.subtotal + iva

    const egreso: Egreso = {
      id: `${egresos.length + 1}`,
      lineaNegocio: newEgreso.lineaNegocio || "General",
      categoria: newEgreso.categoria!,
      empresa: newEgreso.empresa || "N/A",
      equipo: newEgreso.equipo || "N/A",
      concepto: newEgreso.concepto!,
      subtotal: newEgreso.subtotal!,
      iva,
      total,
      tipo: newEgreso.tipo as "Variable" | "Fijo",
      mes: newEgreso.mes!,
      status: newEgreso.status as "Pagado" | "Pendiente" | "Cancelado",
    }

    setEgresos([egreso, ...egresos])
    setIsCreateDialogOpen(false)
    setNewEgreso({ tipo: "Variable", status: "Pendiente" })
    toast.success("Egreso creado exitosamente (simulado)")
  }

  const handleDeleteEgreso = (id: string) => {
    setEgresos(egresos.filter((e) => e.id !== id))
    toast.success("Egreso eliminado")
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

  const handleAddCategoria = () => {
    if (!newCategoria.trim()) {
      toast.error("El nombre de la categoría no puede estar vacío")
      return
    }
    if (categorias.includes(newCategoria)) {
      toast.error("Esta categoría ya existe")
      return
    }
    setCategorias([...categorias, newCategoria])
    setNewCategoria("")
    toast.success(`Categoría "${newCategoria}" agregada`)
  }

  const handleDeleteCategoria = (categoria: string) => {
    setCategorias(categorias.filter((c) => c !== categoria))
    toast.success(`Categoría "${categoria}" eliminada`)
  }

  const handleAddLineaNegocio = () => {
    if (!newLineaNegocio.trim()) {
      toast.error("El nombre de la línea de negocio no puede estar vacío")
      return
    }
    if (lineasNegocio.includes(newLineaNegocio)) {
      toast.error("Esta línea de negocio ya existe")
      return
    }
    setLineasNegocio([...lineasNegocio, newLineaNegocio])
    setNewLineaNegocio("")
    toast.success(`Línea de negocio "${newLineaNegocio}" agregada`)
  }

  const handleDeleteLineaNegocio = (linea: string) => {
    setLineasNegocio(lineasNegocio.filter((l) => l !== linea))
    toast.success(`Línea de negocio "${linea}" eliminada`)
  }

  const totalEgresos = filteredEgresos.reduce((sum, e) => sum + e.total, 0)
  const totalPagado = filteredEgresos.filter((e) => e.status === "Pagado").reduce((sum, e) => sum + e.total, 0)
  const totalPendiente = filteredEgresos.filter((e) => e.status === "Pendiente").reduce((sum, e) => sum + e.total, 0)

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
        <div className="relative w-full">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por concepto, cliente o categoría..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Categoría</Label>
            <div className="flex gap-2">
              <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => setShowCategoriesDialog(true)} className="shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
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
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 col-span-2 sm:col-span-3 lg:col-span-1">
            <Label className="text-xs text-muted-foreground opacity-0">Acción</Label>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[180px]">Concepto</TableHead>
                <TableHead className="min-w-[120px]">Categoría</TableHead>
                <TableHead className="min-w-[150px]">Cliente</TableHead>
                <TableHead className="min-w-[120px]">Equipo</TableHead>
                <TableHead className="min-w-[100px]">Tipo</TableHead>
                <TableHead className="min-w-[100px]">Mes</TableHead>
                <TableHead className="text-right min-w-[100px]">Subtotal</TableHead>
                <TableHead className="text-right min-w-[100px]">IVA</TableHead>
                <TableHead className="text-right min-w-[100px]">Total</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                <TableHead className="text-right min-w-[120px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEgresos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    No se encontraron egresos
                  </TableCell>
                </TableRow>
              ) : (
                filteredEgresos.map((egreso) => (
                  <TableRow key={egreso.id}>
                    <TableCell className="font-medium">{egreso.concepto}</TableCell>
                    <TableCell>{egreso.categoria}</TableCell>
                    <TableCell>{egreso.empresa}</TableCell>
                    <TableCell>{egreso.equipo}</TableCell>
                    <TableCell>{getTipoBadge(egreso.tipo)}</TableCell>
                    <TableCell>{egreso.mes}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">${egreso.subtotal.toLocaleString("es-MX")}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">${egreso.iva.toLocaleString("es-MX")}</TableCell>
                    <TableCell className="text-right font-medium whitespace-nowrap">${egreso.total.toLocaleString("es-MX")}</TableCell>
                    <TableCell>{getStatusBadge(egreso.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {egreso.factura && (
                        <Button variant="ghost" size="icon" onClick={() => toast.info("Abriendo factura (simulado)")}>
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                      {egreso.comprobante && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toast.info("Abriendo comprobante (simulado)")}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteEgreso(egreso.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo Egreso</DialogTitle>
            <DialogDescription>Registra un nuevo gasto o egreso de la empresa</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lineaNegocio">Línea de Negocio</Label>
                <div className="flex gap-2">
                  <Select
                    value={newEgreso.lineaNegocio}
                    onValueChange={(value) => setNewEgreso({ ...newEgreso, lineaNegocio: value })}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {lineasNegocio.map((linea) => (
                        <SelectItem key={linea} value={linea}>
                          {linea}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={() => setShowLineasDialog(true)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoria">
                  Categoría <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={newEgreso.categoria}
                  onValueChange={(value) => setNewEgreso({ ...newEgreso, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="empresa">Cliente</Label>
                <Input
                  id="empresa"
                  value={newEgreso.empresa || ""}
                  onChange={(e) => setNewEgreso({ ...newEgreso, empresa: e.target.value })}
                  placeholder="Cliente para quien se realizó el trabajo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipo">Persona del Equipo</Label>
                <Input
                  id="equipo"
                  value={newEgreso.equipo || ""}
                  onChange={(e) => setNewEgreso({ ...newEgreso, equipo: e.target.value })}
                  placeholder="Persona que recibirá el pago"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="concepto">
                Concepto <span className="text-red-500">*</span>
              </Label>
              <Input
                id="concepto"
                value={newEgreso.concepto || ""}
                onChange={(e) => setNewEgreso({ ...newEgreso, concepto: e.target.value })}
                placeholder="Descripción del gasto"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subtotal">
                  Subtotal <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subtotal"
                  type="number"
                  value={newEgreso.subtotal || ""}
                  onChange={(e) =>
                    setNewEgreso({
                      ...newEgreso,
                      subtotal: Number.parseFloat(e.target.value),
                    })
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  value={newEgreso.tipo}
                  onValueChange={(value) => setNewEgreso({ ...newEgreso, tipo: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Variable">Variable</SelectItem>
                    <SelectItem value="Fijo">Fijo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mes">
                  Mes <span className="text-red-500">*</span>
                </Label>
                <Select value={newEgreso.mes} onValueChange={(value) => setNewEgreso({ ...newEgreso, mes: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Enero 2025">Enero 2025</SelectItem>
                    <SelectItem value="Febrero 2025">Febrero 2025</SelectItem>
                    <SelectItem value="Marzo 2025">Marzo 2025</SelectItem>
                    <SelectItem value="Abril 2025">Abril 2025</SelectItem>
                    <SelectItem value="Mayo 2025">Mayo 2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={newEgreso.status}
                onValueChange={(value) => setNewEgreso({ ...newEgreso, status: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Pagado">Pagado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-muted-foreground">IVA (16%) se calculará automáticamente</div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateEgreso}>Crear Egreso</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showCategoriesDialog} onOpenChange={setShowCategoriesDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gestionar Categorías</DialogTitle>
            <DialogDescription>Agrega o elimina categorías de servicios</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nueva categoría"
                value={newCategoria}
                onChange={(e) => setNewCategoria(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategoria()}
              />
              <Button onClick={handleAddCategoria}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {categorias.map((cat) => (
                <div key={cat} className="flex items-center justify-between p-2 border rounded">
                  <span>{cat}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteCategoria(cat)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showLineasDialog} onOpenChange={setShowLineasDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gestionar Líneas de Negocio</DialogTitle>
            <DialogDescription>Agrega o elimina unidades de negocio</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nueva línea de negocio"
                value={newLineaNegocio}
                onChange={(e) => setNewLineaNegocio(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddLineaNegocio()}
              />
              <Button onClick={handleAddLineaNegocio}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {lineasNegocio.map((linea) => (
                <div key={linea} className="flex items-center justify-between p-2 border rounded">
                  <span>{linea}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteLineaNegocio(linea)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
