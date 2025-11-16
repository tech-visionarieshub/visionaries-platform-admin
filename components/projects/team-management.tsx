"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Pencil, Trash2, Mail, Calendar } from "lucide-react"
import { toast } from "sonner"
import { RoleBadge } from "@/components/auth/role-badge"

type Role = "admin" | "pm" | "developer" | "qa" | "client"

interface TeamMember {
  id: string
  name: string
  email: string
  role: Role
  availability: number // horas por semana
  joinDate: string
  tasksAssigned: number
  hoursLogged: number
}

// Mock data
const mockTeam: TeamMember[] = [
  {
    id: "1",
    name: "Arley Ibarra",
    email: "magic@visionarieshub.com",
    role: "admin",
    availability: 40,
    joinDate: "2024-01-15",
    tasksAssigned: 12,
    hoursLogged: 156,
  },
  {
    id: "2",
    name: "Carlos Mendoza",
    email: "carlos@visionarieshub.com",
    role: "developer",
    availability: 40,
    joinDate: "2024-02-01",
    tasksAssigned: 8,
    hoursLogged: 124,
  },
  {
    id: "3",
    name: "Ana García",
    email: "ana@visionarieshub.com",
    role: "qa",
    availability: 30,
    joinDate: "2024-02-15",
    tasksAssigned: 5,
    hoursLogged: 87,
  },
  {
    id: "4",
    name: "Luis Torres",
    email: "luis@visionarieshub.com",
    role: "developer",
    availability: 40,
    joinDate: "2024-03-01",
    tasksAssigned: 6,
    hoursLogged: 98,
  },
]

export function TeamManagement() {
  const [team, setTeam] = useState<TeamMember[]>(mockTeam)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "developer" as Role,
    availability: 40,
  })

  const handleAdd = () => {
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      role: formData.role,
      availability: formData.availability,
      joinDate: new Date().toISOString().split("T")[0],
      tasksAssigned: 0,
      hoursLogged: 0,
    }
    setTeam([...team, newMember])
    setIsAddDialogOpen(false)
    setFormData({ name: "", email: "", role: "developer", availability: 40 })
    toast.success("Miembro agregado al equipo")
  }

  const handleEdit = () => {
    if (!selectedMember) return
    setTeam(
      team.map((m) =>
        m.id === selectedMember.id
          ? {
              ...m,
              name: formData.name,
              email: formData.email,
              role: formData.role,
              availability: formData.availability,
            }
          : m,
      ),
    )
    setIsEditDialogOpen(false)
    setSelectedMember(null)
    toast.success("Miembro actualizado")
  }

  const handleDelete = (id: string) => {
    setTeam(team.filter((m) => m.id !== id))
    toast.success("Miembro eliminado del equipo")
  }

  const openEditDialog = (member: TeamMember) => {
    setSelectedMember(member)
    setFormData({
      name: member.name,
      email: member.email,
      role: member.role,
      availability: member.availability,
    })
    setIsEditDialogOpen(true)
  }

  const totalAvailability = team.reduce((sum, m) => sum + m.availability, 0)
  const totalTasks = team.reduce((sum, m) => sum + m.tasksAssigned, 0)
  const totalHours = team.reduce((sum, m) => sum + m.hoursLogged, 0)

  return (
    <div className="space-y-3">
      {/* Header con métricas */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Equipo del Proyecto</h3>
          <p className="text-xs text-muted-foreground">
            {team.length} miembros · {totalAvailability}h/semana disponibles
          </p>
        </div>
        <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
          <UserPlus className="h-3.5 w-3.5 mr-1.5" />
          Agregar Miembro
        </Button>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-2.5">
          <div className="text-xs text-muted-foreground">Tasks Asignadas</div>
          <div className="text-lg font-bold">{totalTasks}</div>
        </Card>
        <Card className="p-2.5">
          <div className="text-xs text-muted-foreground">Horas Trabajadas</div>
          <div className="text-lg font-bold">{totalHours}h</div>
        </Card>
        <Card className="p-2.5">
          <div className="text-xs text-muted-foreground">Disponibilidad</div>
          <div className="text-lg font-bold">{totalAvailability}h/sem</div>
        </Card>
      </div>

      {/* Tabla de equipo */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8 text-xs">Nombre</TableHead>
              <TableHead className="h-8 text-xs">Email</TableHead>
              <TableHead className="h-8 text-xs">Rol</TableHead>
              <TableHead className="h-8 text-xs">Disponibilidad</TableHead>
              <TableHead className="h-8 text-xs">Tasks</TableHead>
              <TableHead className="h-8 text-xs">Horas</TableHead>
              <TableHead className="h-8 text-xs">Fecha Ingreso</TableHead>
              <TableHead className="h-8 text-xs w-20">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {team.map((member) => (
              <TableRow key={member.id} className="h-10">
                <TableCell className="py-1.5 text-xs font-medium">{member.name}</TableCell>
                <TableCell className="py-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {member.email}
                  </div>
                </TableCell>
                <TableCell className="py-1.5">
                  <RoleBadge role={member.role} />
                </TableCell>
                <TableCell className="py-1.5 text-xs">{member.availability}h/sem</TableCell>
                <TableCell className="py-1.5 text-xs">
                  <Badge variant="secondary" className="text-xs px-1.5 py-0">
                    {member.tasksAssigned}
                  </Badge>
                </TableCell>
                <TableCell className="py-1.5 text-xs">{member.hoursLogged}h</TableCell>
                <TableCell className="py-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(member.joinDate).toLocaleDateString()}
                  </div>
                </TableCell>
                <TableCell className="py-1.5">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditDialog(member)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(member.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Dialog para agregar miembro */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Miembro al Equipo</DialogTitle>
            <DialogDescription>Completa la información del nuevo miembro del equipo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">
                Nombre Completo
              </Label>
              <Input
                id="name"
                placeholder="Ej: Juan Pérez"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="juan@ejemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role" className="text-xs">
                Rol
              </Label>
              <Select value={formData.role} onValueChange={(value: Role) => setFormData({ ...formData, role: value })}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="pm">Project Manager</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="qa">QA</SelectItem>
                  <SelectItem value="client">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="availability" className="text-xs">
                Disponibilidad (horas/semana)
              </Label>
              <Input
                id="availability"
                type="number"
                min="1"
                max="60"
                value={formData.availability}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    availability: Number.parseInt(e.target.value) || 40,
                  })
                }
                className="h-8 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleAdd} disabled={!formData.name || !formData.email}>
              Agregar Miembro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar miembro */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Miembro del Equipo</DialogTitle>
            <DialogDescription>Actualiza la información del miembro.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-name" className="text-xs">
                Nombre Completo
              </Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email" className="text-xs">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-role" className="text-xs">
                Rol
              </Label>
              <Select value={formData.role} onValueChange={(value: Role) => setFormData({ ...formData, role: value })}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="pm">Project Manager</SelectItem>
                  <SelectItem value="developer">Developer</SelectItem>
                  <SelectItem value="qa">QA</SelectItem>
                  <SelectItem value="client">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-availability" className="text-xs">
                Disponibilidad (horas/semana)
              </Label>
              <Input
                id="edit-availability"
                type="number"
                min="1"
                max="60"
                value={formData.availability}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    availability: Number.parseInt(e.target.value) || 40,
                  })
                }
                className="h-8 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleEdit}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
