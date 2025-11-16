"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUser, type UserRole } from "@/hooks/use-user"
import { RoleBadge } from "@/components/auth/role-badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Save, LogOut, Shield, Plus, Trash2, DollarSign, RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import {
  getRoles,
  getModules,
  getPermissionsMatrix,
  addRole,
  addModule,
  updatePermission,
  deleteRole,
  moduleLabels,
  type Permission,
} from "@/lib/permissions"
// Gestión de usuarios ahora se hace desde visionaries-tech con Custom Claims
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  getCotizacionesConfig,
  saveCotizacionesConfig,
  resetCotizacionesConfig,
  validateConfig,
  calcularTarifaArely,
  type CotizacionesConfig,
} from "@/lib/mock-data/cotizaciones-config"
import { Alert, AlertDescription } from "@/components/ui/alert"

type PermissionMatrix = {
  [role: string]: {
    [module: string]: Permission
  }
}

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, setUser, logout } = useUser()

  // User profile state
  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [role, setRole] = useState<UserRole>(user?.role || "admin")

  // Gestión de usuarios removida - ahora se maneja desde visionaries-tech con Custom Claims

  const [apiKeys, setApiKeys] = useState({
    github: "••••••••••••••••",
    toggl: "••••••••••••••••",
    googleDrive: "••••••••••••••••",
    googleCalendar: "••••••••••••••••",
    brevo: "••••••••••••••••",
    firebase: "••••••••••••••••",
    openai: "••••••••••••••••",
    facturamaUsername: "usuario_demo",
    facturamaPassword: "password_demo",
  })

  const [showKeys, setShowKeys] = useState({
    github: false,
    toggl: false,
    googleDrive: false,
    googleCalendar: false,
    brevo: false,
    firebase: false,
    openai: false,
    facturamaUsername: false,
    facturamaPassword: false,
  })

  const [facturamaSandbox, setFacturamaSandbox] = useState(true)

  // Dynamic permissions state
  const [roles, setRoles] = useState<string[]>(getRoles())
  const [modules, setModules] = useState<string[]>(getModules())
  const [permissionsMatrix, setPermissionsMatrix] = useState<PermissionMatrix>(getPermissionsMatrix())
  const [newRoleName, setNewRoleName] = useState("")
  const [newModuleKey, setNewModuleKey] = useState("")
  const [newModuleLabel, setNewModuleLabel] = useState("")
  const [showAddRoleDialog, setShowAddRoleDialog] = useState(false)
  const [showAddModuleDialog, setShowAddModuleDialog] = useState(false)

  const [cotizacionesConfig, setCotizacionesConfig] = useState<CotizacionesConfig>(getCotizacionesConfig())
  const [configErrors, setConfigErrors] = useState<string[]>([])

  useEffect(() => {
    const errors = validateConfig(cotizacionesConfig)
    setConfigErrors(errors)
  }, [cotizacionesConfig])

  const handleSaveProfile = () => {
    if (user) {
      setUser({ ...user, name, email, role })
      toast({
        title: "Perfil actualizado",
        description: "Los cambios se han guardado correctamente (simulado)",
      })
    }
  }

  const handleSaveApiKey = (key: keyof typeof apiKeys, value: string) => {
    setApiKeys({ ...apiKeys, [key]: value })
    toast({
      title: "API Key guardada",
      description: `La clave de ${key} se ha actualizado (simulado)`,
    })
  }

  // handleUserRoleChange removido - ahora se maneja desde visionaries-tech

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const handleAddRole = () => {
    if (!newRoleName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del rol no puede estar vacío",
        variant: "destructive",
      })
      return
    }

    try {
      addRole(newRoleName.toLowerCase().replace(/\s+/g, "_"))
      setRoles(getRoles())
      setPermissionsMatrix(getPermissionsMatrix())
      setNewRoleName("")
      setShowAddRoleDialog(false)
      toast({
        title: "Rol agregado",
        description: `El rol "${newRoleName}" se ha creado correctamente`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al agregar rol",
        variant: "destructive",
      })
    }
  }

  const handleAddModule = () => {
    if (!newModuleKey.trim() || !newModuleLabel.trim()) {
      toast({
        title: "Error",
        description: "Todos los campos son requeridos",
        variant: "destructive",
      })
      return
    }

    try {
      addModule(newModuleKey, newModuleLabel)
      setModules(getModules())
      setPermissionsMatrix(getPermissionsMatrix())
      setNewModuleKey("")
      setNewModuleLabel("")
      setShowAddModuleDialog(false)
      toast({
        title: "Módulo agregado",
        description: `El módulo "${newModuleLabel}" se ha creado correctamente`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al agregar módulo",
        variant: "destructive",
      })
    }
  }

  const handleDeleteRole = (roleName: string) => {
    try {
      deleteRole(roleName)
      setRoles(getRoles())
      setPermissionsMatrix(getPermissionsMatrix())
      toast({
        title: "Rol eliminado",
        description: `El rol "${roleName}" se ha eliminado correctamente`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar rol",
        variant: "destructive",
      })
    }
  }

  const handlePermissionChange = (role: string, module: string, permission: Permission) => {
    updatePermission(role, module, permission)
    setPermissionsMatrix(getPermissionsMatrix())
    toast({
      title: "Permiso actualizado",
      description: `Permiso de ${role} en ${moduleLabels[module]} actualizado a ${permission}`,
    })
  }

  // handleAddUser y handleDeleteUser removidos - ahora se maneja desde visionaries-tech

  const handleSaveCotizacionesConfig = () => {
    const errors = validateConfig(cotizacionesConfig)
    if (errors.length > 0) {
      toast({
        title: "Error de validación",
        description: errors[0],
        variant: "destructive",
      })
      return
    }

    saveCotizacionesConfig(cotizacionesConfig)
    toast({
      title: "Configuración guardada",
      description: "Los cambios en la configuración de cotizaciones se han guardado correctamente",
    })
  }

  const handleResetCotizacionesConfig = () => {
    resetCotizacionesConfig()
    setCotizacionesConfig(getCotizacionesConfig())
    toast({
      title: "Configuración restablecida",
      description: "Se han restaurado los valores por defecto",
    })
  }

  if (!user) {
    router.push("/login")
    return null
  }

  const permissionLabels: Record<keyof PermissionMatrix, string> = {
    backlog: "Backlog Scrum",
    githubMetrics: "Métricas GitHub",
    togglHours: "Horas Toggl",
    taskAssignment: "Asignación de Tasks",
    qaManagement: "Gestión QA",
    statusReports: "Status Reports",
    warranty: "Garantía",
    documentation: "Documentación",
    calendarSync: "Sincronización Calendar",
    projectSettings: "Configuración Proyecto",
    aiGenerator: "Generador IA",
  }

  const tarifaArely = calcularTarifaArely(cotizacionesConfig)
  const sumaPorcentajes = Object.values(cotizacionesConfig.porcentajes).reduce((sum, val) => sum + val, 0)

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-muted-foreground">Gestiona tu perfil y las integraciones de la plataforma</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar sesión
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="integrations">Integraciones</TabsTrigger>
          {user.role === "admin" && (
            <>
              <TabsTrigger value="roles">
                <Shield className="h-4 w-4 mr-2" />
                Roles y Permisos
              </TabsTrigger>
              <TabsTrigger value="cotizaciones">
                <DollarSign className="h-4 w-4 mr-2" />
                Cotizaciones
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información personal</CardTitle>
              <CardDescription>Actualiza tu información de perfil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <RoleBadge role={user.role} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Rol (solo para testing)</Label>
                  <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
                    <SelectTrigger id="role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="pm">Project Manager</SelectItem>
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="qa">QA Tester</SelectItem>
                      <SelectItem value="client">Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Cambia tu rol para probar diferentes permisos en la plataforma
                  </p>
                </div>

                <Button onClick={handleSaveProfile}>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <div className="bg-muted/50 border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Nota:</strong> Todas las integraciones están simuladas. No se requieren API keys reales para usar
              la plataforma en modo demo.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Facturama API</CardTitle>
              <CardDescription>Genera facturas electrónicas (CFDI 4.0) automáticamente (Simulado)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="facturama-username">Usuario</Label>
                <div className="flex gap-2">
                  <Input
                    id="facturama-username"
                    type={showKeys.facturamaUsername ? "text" : "password"}
                    value={apiKeys.facturamaUsername}
                    onChange={(e) => setApiKeys({ ...apiKeys, facturamaUsername: e.target.value })}
                    placeholder="usuario@empresa.com"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowKeys({ ...showKeys, facturamaUsername: !showKeys.facturamaUsername })}
                  >
                    {showKeys.facturamaUsername ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="facturama-password">Contraseña</Label>
                <div className="flex gap-2">
                  <Input
                    id="facturama-password"
                    type={showKeys.facturamaPassword ? "text" : "password"}
                    value={apiKeys.facturamaPassword}
                    onChange={(e) => setApiKeys({ ...apiKeys, facturamaPassword: e.target.value })}
                    placeholder="••••••••••••"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowKeys({ ...showKeys, facturamaPassword: !showKeys.facturamaPassword })}
                  >
                    {showKeys.facturamaPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="facturama-sandbox">Modo Sandbox</Label>
                  <p className="text-xs text-muted-foreground">Usa el ambiente de pruebas de Facturama</p>
                </div>
                <Switch id="facturama-sandbox" checked={facturamaSandbox} onCheckedChange={setFacturamaSandbox} />
              </div>
              <Button
                onClick={() => {
                  handleSaveApiKey("facturamaUsername", apiKeys.facturamaUsername)
                  handleSaveApiKey("facturamaPassword", apiKeys.facturamaPassword)
                  toast({
                    title: "Facturama configurado (simulado)",
                    description: `Modo: ${facturamaSandbox ? "Sandbox" : "Producción"}`,
                  })
                }}
              >
                Guardar
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>GitHub API</CardTitle>
              <CardDescription>Conecta con GitHub para tracking automático de commits y PRs (Simulado)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="github-token">Personal Access Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="github-token"
                    type={showKeys.github ? "text" : "password"}
                    value={apiKeys.github}
                    onChange={(e) => setApiKeys({ ...apiKeys, github: e.target.value })}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowKeys({ ...showKeys, github: !showKeys.github })}
                  >
                    {showKeys.github ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button onClick={() => handleSaveApiKey("github", apiKeys.github)}>Guardar</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Toggl API</CardTitle>
              <CardDescription>Sincroniza el tracking de tiempo con Toggl (Simulado)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="toggl-token">API Token</Label>
                <div className="flex gap-2">
                  <Input
                    id="toggl-token"
                    type={showKeys.toggl ? "text" : "password"}
                    value={apiKeys.toggl}
                    onChange={(e) => setApiKeys({ ...apiKeys, toggl: e.target.value })}
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowKeys({ ...showKeys, toggl: !showKeys.toggl })}
                  >
                    {showKeys.toggl ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button onClick={() => handleSaveApiKey("toggl", apiKeys.toggl)}>Guardar</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Google Drive API</CardTitle>
              <CardDescription>Importa documentos y genera tasks automáticamente (Simulado)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="drive-credentials">Service Account JSON</Label>
                <div className="flex gap-2">
                  <Input
                    id="drive-credentials"
                    type={showKeys.googleDrive ? "text" : "password"}
                    value={apiKeys.googleDrive}
                    onChange={(e) => setApiKeys({ ...apiKeys, googleDrive: e.target.value })}
                    placeholder="Pega el contenido del JSON aquí"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowKeys({ ...showKeys, googleDrive: !showKeys.googleDrive })}
                  >
                    {showKeys.googleDrive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button onClick={() => handleSaveApiKey("googleDrive", apiKeys.googleDrive)}>Guardar</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Google Calendar API</CardTitle>
              <CardDescription>Sincroniza eventos del cronograma con Google Calendar (Simulado)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="calendar-credentials">Service Account JSON</Label>
                <div className="flex gap-2">
                  <Input
                    id="calendar-credentials"
                    type={showKeys.googleCalendar ? "text" : "password"}
                    value={apiKeys.googleCalendar}
                    onChange={(e) => setApiKeys({ ...apiKeys, googleCalendar: e.target.value })}
                    placeholder="Pega el contenido del JSON aquí"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowKeys({ ...showKeys, googleCalendar: !showKeys.googleCalendar })}
                  >
                    {showKeys.googleCalendar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button onClick={() => handleSaveApiKey("googleCalendar", apiKeys.googleCalendar)}>Guardar</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Brevo (Email)</CardTitle>
              <CardDescription>Envía status reports y notificaciones por email (Simulado)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brevo-key">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="brevo-key"
                    type={showKeys.brevo ? "text" : "password"}
                    value={apiKeys.brevo}
                    onChange={(e) => setApiKeys({ ...apiKeys, brevo: e.target.value })}
                    placeholder="xkeysib-xxxxxxxxxxxxxxxx"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowKeys({ ...showKeys, brevo: !showKeys.brevo })}
                  >
                    {showKeys.brevo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button onClick={() => handleSaveApiKey("brevo", apiKeys.brevo)}>Guardar</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Firebase Hosting</CardTitle>
              <CardDescription>Crea preview deployments temporales para clientes (Simulado)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firebase-config">Firebase Config JSON</Label>
                <div className="flex gap-2">
                  <Input
                    id="firebase-config"
                    type={showKeys.firebase ? "text" : "password"}
                    value={apiKeys.firebase}
                    onChange={(e) => setApiKeys({ ...apiKeys, firebase: e.target.value })}
                    placeholder="Pega el contenido del JSON aquí"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowKeys({ ...showKeys, firebase: !showKeys.firebase })}
                  >
                    {showKeys.firebase ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button onClick={() => handleSaveApiKey("firebase", apiKeys.firebase)}>Guardar</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>OpenAI API</CardTitle>
              <CardDescription>Genera tasks, reportes y documentación con IA (Simulado)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openai-key">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="openai-key"
                    type={showKeys.openai ? "text" : "password"}
                    value={apiKeys.openai}
                    onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                    placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowKeys({ ...showKeys, openai: !showKeys.openai })}
                  >
                    {showKeys.openai ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button onClick={() => handleSaveApiKey("openai", apiKeys.openai)}>Guardar</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {user.role === "admin" && (
          <TabsContent value="roles" className="space-y-6">
            <div className="bg-muted/50 border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Nota:</strong> La gestión de usuarios ahora se realiza desde visionaries-tech usando Custom Claims de Firebase Auth.
              </p>
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Matriz de Permisos
                    </CardTitle>
                    <CardDescription>Gestiona permisos por rol en cada módulo de la plataforma</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Dialog open={showAddModuleDialog} onOpenChange={setShowAddModuleDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Módulo
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Agregar Nuevo Módulo</DialogTitle>
                          <DialogDescription>
                            Crea un nuevo módulo en la plataforma. Por defecto, solo admin tendrá acceso.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="module-key">Clave del módulo</Label>
                            <Input
                              id="module-key"
                              placeholder="ej: crmContacts"
                              value={newModuleKey}
                              onChange={(e) => setNewModuleKey(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                              Usa camelCase sin espacios (ej: crmContacts, salesPipeline)
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="module-label">Nombre del módulo</Label>
                            <Input
                              id="module-label"
                              placeholder="ej: Contactos CRM"
                              value={newModuleLabel}
                              onChange={(e) => setNewModuleLabel(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowAddModuleDialog(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleAddModule}>Agregar Módulo</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={showAddRoleDialog} onOpenChange={setShowAddRoleDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Agregar Rol
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Agregar Nuevo Rol</DialogTitle>
                          <DialogDescription>
                            Crea un nuevo rol en la plataforma. Por defecto, no tendrá acceso a ningún módulo.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="role-name">Nombre del rol</Label>
                            <Input
                              id="role-name"
                              placeholder="ej: Contador, Vendedor, etc."
                              value={newRoleName}
                              onChange={(e) => setNewRoleName(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowAddRoleDialog(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={handleAddRole}>Agregar Rol</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Módulo</TableHead>
                        {roles.map((role) => (
                          <TableHead key={role} className="text-center min-w-[120px]">
                            <div className="flex items-center justify-center gap-2">
                              <span className="capitalize">{role}</span>
                              {role !== "admin" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleDeleteRole(role)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modules.map((module) => (
                        <TableRow key={module}>
                          <TableCell className="font-medium">{moduleLabels[module] || module}</TableCell>
                          {roles.map((role) => {
                            const permission = permissionsMatrix[role]?.[module] || "none"
                            return (
                              <TableCell key={role} className="text-center">
                                <Select
                                  value={permission}
                                  onValueChange={(value) => handlePermissionChange(role, module, value as Permission)}
                                  disabled={role === "admin"}
                                >
                                  <SelectTrigger className="w-[100px] mx-auto">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="edit">
                                      <Badge variant="default" className="bg-green-500">
                                        Editar
                                      </Badge>
                                    </SelectItem>
                                    <SelectItem value="view">
                                      <Badge variant="secondary" className="bg-blue-500 text-white">
                                        Ver
                                      </Badge>
                                    </SelectItem>
                                    <SelectItem value="none">
                                      <Badge variant="outline" className="text-muted-foreground">
                                        Sin acceso
                                      </Badge>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            )
                          })}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-2">
                  <p className="text-sm">
                    <strong>Cómo usar:</strong>
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Haz clic en "Agregar Rol" para crear un nuevo rol personalizado</li>
                    <li>Haz clic en "Agregar Módulo" para agregar una nueva sección a la plataforma</li>
                    <li>Los nuevos módulos aparecen automáticamente con acceso solo para admin</li>
                    <li>Usa los selectores para cambiar permisos: Editar, Ver o Sin acceso</li>
                    <li>El rol admin siempre tiene acceso completo y no puede ser modificado</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {user.role === "admin" && (
          <TabsContent value="cotizaciones" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Configuración de Cotizaciones</h2>
                <p className="text-muted-foreground">
                  Gestiona las variables y porcentajes para el cálculo automático de cotizaciones
                </p>
              </div>
              <Button variant="outline" onClick={handleResetCotizacionesConfig}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restablecer
              </Button>
            </div>

            {configErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {configErrors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Tarifas por Rol</CardTitle>
                <CardDescription>Define las tarifas mínimas por hora para cada rol (MXN/hora)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tarifa-dev">Tarifa Desarrollador (mínima)</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        id="tarifa-dev"
                        type="number"
                        value={cotizacionesConfig.tarifas.desarrolladorMin}
                        onChange={(e) =>
                          setCotizacionesConfig({
                            ...cotizacionesConfig,
                            tarifas: {
                              ...cotizacionesConfig.tarifas,
                              desarrolladorMin: Number(e.target.value),
                            },
                          })
                        }
                        min={0}
                      />
                      <span className="text-muted-foreground">MXN/hora</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tarifa-gaby">Tarifa Gaby (mínima)</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        id="tarifa-gaby"
                        type="number"
                        value={cotizacionesConfig.tarifas.gabyMin}
                        onChange={(e) =>
                          setCotizacionesConfig({
                            ...cotizacionesConfig,
                            tarifas: {
                              ...cotizacionesConfig.tarifas,
                              gabyMin: Number(e.target.value),
                            },
                          })
                        }
                        min={1000}
                      />
                      <span className="text-muted-foreground">MXN/hora</span>
                    </div>
                    <p className="text-xs text-muted-foreground">No puede ser menor a $1,000/hora</p>
                  </div>
                </div>

                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm">
                    <strong>Tarifa calculada de Arely (Gestión/QA):</strong> ${tarifaArely.toFixed(2)} MXN/hora
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Se calcula automáticamente según su porcentaje de participación
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribución de Porcentajes</CardTitle>
                <CardDescription>Define cómo se distribuye el total del proyecto (debe sumar 100%)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="p-impuestos">Impuestos</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="p-impuestos"
                        type="number"
                        step="0.01"
                        value={cotizacionesConfig.porcentajes.impuestos}
                        onChange={(e) =>
                          setCotizacionesConfig({
                            ...cotizacionesConfig,
                            porcentajes: {
                              ...cotizacionesConfig.porcentajes,
                              impuestos: Number(e.target.value),
                            },
                          })
                        }
                        min={0}
                        max={100}
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="p-arely">Arely (Gestión/QA)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="p-arely"
                        type="number"
                        step="0.01"
                        value={cotizacionesConfig.porcentajes.arely}
                        onChange={(e) =>
                          setCotizacionesConfig({
                            ...cotizacionesConfig,
                            porcentajes: {
                              ...cotizacionesConfig.porcentajes,
                              arely: Number(e.target.value),
                            },
                          })
                        }
                        min={0}
                        max={100}
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="p-desarrollador">Desarrollador (Back/Deploy)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="p-desarrollador"
                        type="number"
                        step="0.01"
                        value={cotizacionesConfig.porcentajes.desarrollador}
                        onChange={(e) =>
                          setCotizacionesConfig({
                            ...cotizacionesConfig,
                            porcentajes: {
                              ...cotizacionesConfig.porcentajes,
                              desarrollador: Number(e.target.value),
                            },
                          })
                        }
                        min={27}
                        max={100}
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Mínimo 27%</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="p-gastos">Gastos Operativos</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="p-gastos"
                        type="number"
                        step="0.01"
                        value={cotizacionesConfig.porcentajes.gastosOperativos}
                        onChange={(e) =>
                          setCotizacionesConfig({
                            ...cotizacionesConfig,
                            porcentajes: {
                              ...cotizacionesConfig.porcentajes,
                              gastosOperativos: Number(e.target.value),
                            },
                          })
                        }
                        min={0}
                        max={100}
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="p-marketing">Marketing</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="p-marketing"
                        type="number"
                        step="0.01"
                        value={cotizacionesConfig.porcentajes.marketing}
                        onChange={(e) =>
                          setCotizacionesConfig({
                            ...cotizacionesConfig,
                            porcentajes: {
                              ...cotizacionesConfig.porcentajes,
                              marketing: Number(e.target.value),
                            },
                          })
                        }
                        min={0}
                        max={100}
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="p-ahorro">Ahorro</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="p-ahorro"
                        type="number"
                        step="0.01"
                        value={cotizacionesConfig.porcentajes.ahorro}
                        onChange={(e) =>
                          setCotizacionesConfig({
                            ...cotizacionesConfig,
                            porcentajes: {
                              ...cotizacionesConfig.porcentajes,
                              ahorro: Number(e.target.value),
                            },
                          })
                        }
                        min={0}
                        max={100}
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="p-gaby">Gaby (Diseño/Front)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="p-gaby"
                        type="number"
                        step="0.01"
                        value={cotizacionesConfig.porcentajes.gaby}
                        onChange={(e) =>
                          setCotizacionesConfig({
                            ...cotizacionesConfig,
                            porcentajes: {
                              ...cotizacionesConfig.porcentajes,
                              gaby: Number(e.target.value),
                            },
                          })
                        }
                        min={0}
                        max={100}
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>

                <div className={`p-3 rounded-lg ${sumaPorcentajes === 100 ? "bg-green-500/10" : "bg-destructive/10"}`}>
                  <p className="text-sm font-medium">
                    <strong>Suma total:</strong> {sumaPorcentajes.toFixed(2)}%
                  </p>
                  {sumaPorcentajes !== 100 && (
                    <p className="text-xs text-muted-foreground mt-1">Los porcentajes deben sumar exactamente 100%</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reglas de Negocio</CardTitle>
                <CardDescription>Define las reglas y valores generales para las cotizaciones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mensualidad-min">Mensualidad Mínima</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        id="mensualidad-min"
                        type="number"
                        value={cotizacionesConfig.reglas.mensualidadMinima}
                        onChange={(e) =>
                          setCotizacionesConfig({
                            ...cotizacionesConfig,
                            reglas: {
                              ...cotizacionesConfig.reglas,
                              mensualidadMinima: Number(e.target.value),
                            },
                          })
                        }
                        min={0}
                      />
                      <span className="text-muted-foreground">MXN</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="horas-semana">Horas de Trabajo por Semana</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="horas-semana"
                        type="number"
                        value={cotizacionesConfig.reglas.horasTrabajoSemana}
                        onChange={(e) =>
                          setCotizacionesConfig({
                            ...cotizacionesConfig,
                            reglas: {
                              ...cotizacionesConfig.reglas,
                              horasTrabajoSemana: Number(e.target.value),
                            },
                          })
                        }
                        min={1}
                      />
                      <span className="text-muted-foreground">horas</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="costo-prototipo">Costo de Prototipado</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        id="costo-prototipo"
                        type="number"
                        value={cotizacionesConfig.reglas.costoPrototipadoUSD}
                        onChange={(e) =>
                          setCotizacionesConfig({
                            ...cotizacionesConfig,
                            reglas: {
                              ...cotizacionesConfig.reglas,
                              costoPrototipadoUSD: Number(e.target.value),
                            },
                          })
                        }
                        min={0}
                      />
                      <span className="text-muted-foreground">USD por front</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo-cambio">Tipo de Cambio USD/MXN</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        id="tipo-cambio"
                        type="number"
                        step="0.01"
                        value={cotizacionesConfig.reglas.tipoCambioUSD}
                        onChange={(e) =>
                          setCotizacionesConfig({
                            ...cotizacionesConfig,
                            reglas: {
                              ...cotizacionesConfig.reglas,
                              tipoCambioUSD: Number(e.target.value),
                            },
                          })
                        }
                        min={0}
                      />
                      <span className="text-muted-foreground">MXN por USD</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleResetCotizacionesConfig}>
                Restablecer valores por defecto
              </Button>
              <Button onClick={handleSaveCotizacionesConfig} disabled={configErrors.length > 0}>
                <Save className="h-4 w-4 mr-2" />
                Guardar Configuración
              </Button>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
