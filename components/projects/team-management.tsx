"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
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
import { UserPlus, Pencil, Trash2, Mail, Calendar, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { RoleBadge } from "@/components/auth/role-badge"
import { getProjectTeam, addTeamMember, removeTeamMember, type TeamMember } from "@/lib/api/project-team-api"
import { getUsers, type User } from "@/lib/api/users-api"

export function TeamManagement() {
  const params = useParams()
  const projectId = params.id as string
  const [team, setTeam] = useState<TeamMember[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedUserEmail, setSelectedUserEmail] = useState("")

  // Cargar equipo y usuarios
  useEffect(() => {
    if (projectId) {
      loadTeam()
      loadAllUsers()
    }
  }, [projectId])

  const loadTeam = async () => {
    try {
      setLoading(true)
      const teamMembers = await getProjectTeam(projectId)
      setTeam(teamMembers)
    } catch (error: any) {
      console.error('[TeamManagement] Error loading team:', error)
      toast.error(error.message || "Error cargando equipo")
    } finally {
      setLoading(false)
    }
  }

  const loadAllUsers = async () => {
    try {
      const users = await getUsers()
      console.log('[TeamManagement] Usuarios cargados:', users.length, users)
      setAllUsers(users)
      if (users.length === 0) {
        toast.error("No hay usuarios disponibles. Ejecuta el script de carga de usuarios.")
      }
    } catch (error: any) {
      console.error('[TeamManagement] Error loading users:', error)
      toast.error(`Error cargando usuarios: ${error.message}`)
    }
  }

  const handleAdd = async () => {
    if (!selectedUserEmail) {
      toast.error("Selecciona un usuario")
      return
    }

    try {
      await addTeamMember(projectId, selectedUserEmail)
      toast.success("Miembro agregado al equipo")
      setIsAddDialogOpen(false)
      setSelectedUserEmail("")
      loadTeam()
    } catch (error: any) {
      toast.error(error.message || "Error agregando miembro")
    }
  }

  const handleDelete = async (email: string) => {
    try {
      await removeTeamMember(projectId, email)
      toast.success("Miembro eliminado del equipo")
      loadTeam()
    } catch (error: any) {
      toast.error(error.message || "Error eliminando miembro")
    }
  }

  // Filtrar usuarios que no están en el equipo
  const availableUsers = allUsers.filter(
    user => !team.some(member => member.email === user.email)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#4514F9]" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header con métricas */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Equipo del Proyecto</h3>
          <p className="text-xs text-muted-foreground">
            {team.length} miembros
          </p>
        </div>
        <Button size="sm" onClick={() => setIsAddDialogOpen(true)}>
          <UserPlus className="h-3.5 w-3.5 mr-1.5" />
          Agregar Miembro
        </Button>
      </div>

      {/* Tabla de equipo */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8 text-xs">Nombre</TableHead>
              <TableHead className="h-8 text-xs">Email</TableHead>
              <TableHead className="h-8 text-xs">Rol</TableHead>
              <TableHead className="h-8 text-xs w-20">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {team.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
                  No hay miembros en el equipo. Agrega miembros desde el botón "Agregar Miembro".
                </TableCell>
              </TableRow>
            ) : (
              team.map((member) => (
                <TableRow key={member.email} className="h-10">
                  <TableCell className="py-1.5 text-xs font-medium">{member.displayName}</TableCell>
                  <TableCell className="py-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {member.email}
                    </div>
                  </TableCell>
                  <TableCell className="py-1.5">
                    <Badge variant="outline" className="text-xs">
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-1.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(member.email)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Dialog para agregar miembro */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Agregar Miembro al Equipo</DialogTitle>
            <DialogDescription>Selecciona un usuario de la lista global para agregarlo al equipo del proyecto.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="user-select" className="text-xs">
                Usuario
              </Label>
              <Select value={selectedUserEmail} onValueChange={setSelectedUserEmail}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Selecciona un usuario" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length === 0 ? (
                    <SelectItem value="" disabled>Todos los usuarios ya están en el equipo</SelectItem>
                  ) : (
                    availableUsers.map((user) => (
                      <SelectItem key={user.email} value={user.email}>
                        {user.displayName} ({user.email})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => {
              setIsAddDialogOpen(false)
              setSelectedUserEmail("")
            }}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleAdd} disabled={!selectedUserEmail || availableUsers.length === 0}>
              Agregar Miembro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
