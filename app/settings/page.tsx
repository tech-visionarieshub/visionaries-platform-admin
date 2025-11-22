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
import { Eye, EyeOff, Save, LogOut, Shield, Plus, Trash2, DollarSign, RotateCcw, Users } from "lucide-react"
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
} from "@/lib/api/config-api"
import {
  validateConfig,
  calcularTarifaArely,
  type CotizacionesConfig,
} from "@/lib/mock-data/cotizaciones-config"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getIdToken, getCurrentUser } from "@/lib/firebase/visionaries-tech"
import { RouteSelector } from "@/components/admin/route-selector"

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

  // Gestión de usuarios internos
  interface InternalUser {
    uid: string
    email: string
    displayName: string
    role: string
    allowedRoutes?: string[]
    internal: boolean
    emailVerified: boolean
    disabled: boolean
    creationTime: string
    lastSignInTime: string | null
  }

  const [internalUsers, setInternalUsers] = useState<InternalUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserRole, setNewUserRole] = useState<UserRole>("admin")
  const [newUserSuperadmin, setNewUserSuperadmin] = useState(false)
  const [newUserRoutes, setNewUserRoutes] = useState<string[]>([])
  const [assigningAccess, setAssigningAccess] = useState(false)
  const [editingUser, setEditingUser] = useState<InternalUser | null>(null)
  const [editingUserRoutes, setEditingUserRoutes] = useState<string[]>([])

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

  const [cotizacionesConfig, setCotizacionesConfig] = useState<CotizacionesConfig | null>(null)
  const [configErrors, setConfigErrors] = useState<string[]>([])
  const [loadingConfig, setLoadingConfig] = useState(true)

  useEffect(() => {
    async function loadConfig() {
      const defaultConfig: CotizacionesConfig = {
        tarifas: {
          desarrolladorMin: 800,
          gabyMin: 1000,
        },
        porcentajes: {
          impuestos: 2,
          arely: 5,
          desarrollador: 27,
          gastosOperativos: 18.15,
          marketing: 3,
          ahorro: 5,
          gaby: 40,
        },
        reglas: {
          mensualidadMinima: 64000,
          horasTrabajoSemana: 20,
          costoPrototipadoUSD: 600,
          tipoCambioUSD: 20,
        },
      }

      try {
        console.log('[Settings] Iniciando carga de configuración...')
        
        // Agregar timeout de 10 segundos
        const timeoutPromise = new Promise<null>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Timeout: La carga de configuración tardó demasiado'))
          }, 10000)
        })

        const configPromise = getCotizacionesConfig()
        const config = await Promise.race([configPromise, timeoutPromise])
        
        console.log('[Settings] Configuración cargada:', config)
        
        // Si config es null, usar configuración por defecto
        if (!config) {
          console.log('[Settings] Config es null, usando configuración por defecto')
          setCotizacionesConfig(defaultConfig)
          setLoadingConfig(false)
          return
        }
        
        // Normalizar la configuración para asegurar que tenga todas las propiedades necesarias
        const normalizedConfig: CotizacionesConfig = {
          tarifas: {
            desarrolladorMin: config?.tarifas?.desarrolladorMin ?? 800,
            gabyMin: config?.tarifas?.gabyMin ?? 1000,
          },
          porcentajes: {
            impuestos: config?.porcentajes?.impuestos ?? 2,
            arely: config?.porcentajes?.arely ?? 5,
            desarrollador: config?.porcentajes?.desarrollador ?? 27,
            gastosOperativos: config?.porcentajes?.gastosOperativos ?? 18.15,
            marketing: config?.porcentajes?.marketing ?? 3,
            ahorro: config?.porcentajes?.ahorro ?? 5,
            gaby: config?.porcentajes?.gaby ?? 40,
          },
          reglas: {
            mensualidadMinima: config?.reglas?.mensualidadMinima ?? 64000,
            horasTrabajoSemana: config?.reglas?.horasTrabajoSemana ?? 20,
            costoPrototipadoUSD: config?.reglas?.costoPrototipadoUSD ?? 600,
            tipoCambioUSD: config?.reglas?.tipoCambioUSD ?? 20,
          },
        }
        setCotizacionesConfig(normalizedConfig)
        setLoadingConfig(false)
      } catch (err: any) {
        console.error('[Settings] Error loading config:', err)
        
        // Si es error de autenticación, no hacer nada (ya redirige)
        if (err.name === 'AuthenticationError' || err.message?.includes('authentication')) {
          console.log('[Settings] Error de autenticación, redirigiendo...')
          setLoadingConfig(false)
          return
        }
        
        // En caso de cualquier error (incluyendo timeout), usar configuración por defecto
        console.log('[Settings] Usando configuración por defecto debido a error')
        setCotizacionesConfig(defaultConfig)
        setLoadingConfig(false)
      }
    }
    loadConfig()
  }, [])

  useEffect(() => {
    if (cotizacionesConfig) {
      const errors = validateConfig(cotizacionesConfig)
      setConfigErrors(errors)
    }
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

  // Funciones para gestión de usuarios internos
  const loadInternalUsers = async () => {
    setLoadingUsers(true)
    try {
      // Intentar obtener token del sessionStorage primero (SSO desde Aura)
      let token = typeof window !== 'undefined' ? sessionStorage.getItem('portalAuthToken') : null
      
      // Si no hay token en sessionStorage, obtenerlo de Firebase Auth
      if (!token) {
        token = await getIdToken()
      }

      if (!token) {
        throw new Error('No hay token disponible')
      }

      const response = await fetch('/api/admin/list-internal-users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Error al cargar usuarios')
      }

      const data = await response.json()
      setInternalUsers(data.users || [])
    } catch (error) {
      console.error('Error cargando usuarios:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los usuarios. Asegúrate de estar autenticado.",
        variant: "destructive",
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleAddInternalUser = async () => {
    if (!newUserEmail.trim()) {
      toast({
        title: "Error",
        description: "El email es requerido",
        variant: "destructive",
      })
      return
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newUserEmail.trim())) {
      toast({
        title: "Error",
        description: "El formato del email no es válido",
        variant: "destructive",
      })
      return
    }

    setAssigningAccess(true)

    try {
      let token = typeof window !== 'undefined' ? sessionStorage.getItem('portalAuthToken') : null
      if (!token) {
        token = await getIdToken()
      }
      if (!token) {
        throw new Error('No hay token disponible')
      }

      const response = await fetch('/api/users/assign-access', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: newUserEmail.trim(),
          role: newUserRole,
          superadmin: newUserSuperadmin,
        }),
      })

      const data = await response.json()

      if (data.success) {
        // También establecer hasPortalAdminAccess en Firestore
        try {
          const portalAccessResponse = await fetch('/api/users/set-portal-access', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: newUserEmail.trim(),
              hasAccess: true,
            }),
          })

          const portalAccessData = await portalAccessResponse.json()
          
          if (!portalAccessData.success) {
            console.warn('[Settings] No se pudo establecer hasPortalAdminAccess:', portalAccessData.error)
            // No fallar, solo mostrar advertencia
          }
        } catch (error) {
          console.warn('[Settings] Error al establecer hasPortalAdminAccess:', error)
          // No fallar, solo loguear
        }

        toast({
          title: "✅ Acceso asignado",
          description: data.message + (data.note ? ` ${data.note}` : ''),
        })
        setShowAddUserDialog(false)
        setNewUserEmail("")
        setNewUserRole("admin")
        setNewUserSuperadmin(false)
        setNewUserRoutes([])
        loadInternalUsers()
      } else {
        throw new Error(data.error || 'Error al agregar usuario')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al agregar usuario",
        variant: "destructive",
      })
    }
  }

  const handleUpdateUserRole = async (userEmail: string, newRole: UserRole, allowedRoutes?: string[]) => {
    try {
      let token = typeof window !== 'undefined' ? sessionStorage.getItem('portalAuthToken') : null
      if (!token) {
        token = await getIdToken()
      }
      if (!token) {
        throw new Error('No hay token disponible')
      }

      const response = await fetch('/api/admin/update-user-role', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          role: newRole,
          allowedRoutes: allowedRoutes,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Rol actualizado",
          description: data.message,
        })
        loadInternalUsers()
      } else {
        throw new Error(data.error || 'Error al actualizar rol')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar rol",
        variant: "destructive",
      })
    }
  }

  const handleRevokeAccess = async (userEmail: string) => {
    if (!confirm(`¿Estás seguro de revocar el acceso interno de ${userEmail}?`)) {
      return
    }

    try {
      let token = typeof window !== 'undefined' ? sessionStorage.getItem('portalAuthToken') : null
      if (!token) {
        token = await getIdToken()
      }
      if (!token) {
        throw new Error('No hay token disponible')
      }

      const response = await fetch('/api/admin/revoke-internal-access', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Acceso revocado",
          description: data.message,
        })
        loadInternalUsers()
      } else {
        throw new Error(data.error || 'Error al revocar acceso')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al revocar acceso",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (user?.role === 'admin' || user?.superadmin) {
      loadInternalUsers()
    }
  }, [user])

  const handleSaveCotizacionesConfig = async () => {
    if (!cotizacionesConfig) return
    
    const errors = validateConfig(cotizacionesConfig)
    if (errors.length > 0) {
      toast({
        title: "Error de validación",
        description: errors[0],
        variant: "destructive",
      })
      return
    }

    try {
      await saveCotizacionesConfig(cotizacionesConfig)
      toast({
        title: "Configuración guardada",
        description: "Los cambios en la configuración de cotizaciones se han guardado correctamente",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Error al guardar la configuración",
        variant: "destructive",
      })
    }
  }

  const handleResetCotizacionesConfig = async () => {
    try {
      await resetCotizacionesConfig()
      const config = await getCotizacionesConfig()
      setCotizacionesConfig(config)
      toast({
        title: "Configuración restablecida",
        description: "Se han restaurado los valores por defecto",
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Error al restablecer la configuración",
        variant: "destructive",
      })
    }
  }

  // El layout-wrapper ya maneja la autenticación
  // Si llegamos aquí, el usuario está autorizado
  // Cargar usuario desde Firebase Auth si no está en el store
  useEffect(() => {
    const loadUserFromFirebase = async () => {
      try {
        const currentUser = getCurrentUser()
        if (currentUser) {
          // Verificar si el usuario es superadmin
          const isSuperAdmin = currentUser.email === 'adminplatform@visionarieshub.com'
          
          // Forzar refresh del token para obtener displayName actualizado
          const tokenResult = await currentUser.getIdTokenResult(true)
          const updatedDisplayName = currentUser.displayName || tokenResult.claims.name || currentUser.email?.split('@')[0] || 'Usuario'
          
          // Si hay usuario de Firebase pero no en el store, o si el usuario cambió, actualizar el store
          if (!user || user.id !== currentUser.uid || user.name !== updatedDisplayName) {
            setUser({
              id: currentUser.uid,
              name: updatedDisplayName,
              email: currentUser.email || '',
              role: 'admin', // Default, se puede actualizar desde la API
              avatar: currentUser.photoURL || undefined,
              superadmin: isSuperAdmin,
            })
          }
        }
      } catch (error) {
        console.error('Error loading user from Firebase:', error)
      }
    }
    loadUserFromFirebase()
    
    // Refrescar cada 30 segundos para obtener cambios en displayName
    const interval = setInterval(loadUserFromFirebase, 30000)
    return () => clearInterval(interval)
  }, [user, setUser])

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

  if (loadingConfig || !cotizacionesConfig) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <p>Cargando configuración...</p>
      </div>
    )
  }

  // Verificaciones defensivas adicionales
  if (!cotizacionesConfig.tarifas || !cotizacionesConfig.porcentajes || !cotizacionesConfig.reglas) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <Alert variant="destructive">
          <AlertDescription>
            Error: La configuración está incompleta. Por favor, recarga la página.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Verificar que el usuario esté disponible antes de renderizar
  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <p>Cargando usuario...</p>
      </div>
    )
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
          {(user?.role === "admin" || user?.superadmin) && (
            <>
              <TabsTrigger value="roles">
                <Shield className="h-4 w-4 mr-2" />
                Roles y Permisos
              </TabsTrigger>
              <TabsTrigger value="cotizaciones">
                <DollarSign className="h-4 w-4 mr-2" />
                Cotizaciones
              </TabsTrigger>
              <TabsTrigger value="internal-users">
                <Users className="h-4 w-4 mr-2" />
                Usuarios Internos
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

        {user?.role === "admin" && (
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

        {user?.role === "admin" && (
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

        {user?.role === "admin" && (
          <TabsContent value="internal-users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Gestión de Usuarios Internos</CardTitle>
                    <CardDescription>
                      Administra los usuarios con acceso al Portal Admin y sus permisos por ruta
                    </CardDescription>
                  </div>
                  <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Usuario
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Agregar Usuario Interno</DialogTitle>
                        <DialogDescription>
                          Asigna acceso interno a un usuario. El usuario debe existir en visionaries-tech.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="new-user-email">Email</Label>
                          <Input
                            id="new-user-email"
                            type="email"
                            placeholder="usuario@example.com"
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="new-user-role">Rol</Label>
                          <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as UserRole)}>
                            <SelectTrigger id="new-user-role">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="pm">PM</SelectItem>
                              <SelectItem value="developer">Developer</SelectItem>
                              <SelectItem value="qa">QA</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {user?.superadmin && (
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="new-user-superadmin"
                              checked={newUserSuperadmin}
                              onCheckedChange={setNewUserSuperadmin}
                            />
                            <Label htmlFor="new-user-superadmin" className="cursor-pointer">
                              Superadmin (acceso completo sin restricciones)
                            </Label>
                          </div>
                        )}
                        <Alert>
                          <AlertDescription className="text-sm">
                            <strong>Importante:</strong> El usuario debe existir en Firebase Auth (proyecto visionaries-tech).
                            Si no existe, debe registrarse primero en Aura. Después de asignar acceso, el usuario debe
                            cerrar sesión y volver a iniciar sesión para que los cambios surtan efecto.
                          </AlertDescription>
                        </Alert>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleAddInternalUser} disabled={!newUserEmail.trim() || assigningAccess}>
                          {assigningAccess ? "Asignando..." : "Asignar Acceso"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="text-center py-8">Cargando usuarios...</div>
                ) : internalUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay usuarios con acceso interno
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Rutas Permitidas</TableHead>
                        <TableHead>Último Acceso</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {internalUsers.map((internalUser) => (
                        <TableRow key={internalUser.uid}>
                          <TableCell className="font-medium">{internalUser.email}</TableCell>
                          <TableCell>
                            <RoleBadge role={internalUser.role as UserRole} />
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {internalUser.allowedRoutes && internalUser.allowedRoutes.length > 0 ? (
                                <Badge variant="secondary" className="text-xs">
                                  {internalUser.allowedRoutes.length} ruta{internalUser.allowedRoutes.length !== 1 ? 's' : ''}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  Sin rutas
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {internalUser.lastSignInTime
                              ? new Date(internalUser.lastSignInTime).toLocaleDateString()
                              : 'Nunca'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingUser(internalUser)
                                      setEditingUserRoutes(internalUser.allowedRoutes || [])
                                    }}
                                  >
                                    Editar
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Editar Usuario: {internalUser.email}</DialogTitle>
                                    <DialogDescription>
                                      Actualiza el rol y las rutas permitidas para este usuario
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label>Rol</Label>
                                      <Select
                                        value={internalUser.role}
                                        onValueChange={(value) => {
                                          handleUpdateUserRole(internalUser.email, value as UserRole, editingUserRoutes)
                                        }}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="admin">Admin</SelectItem>
                                          <SelectItem value="pm">PM</SelectItem>
                                          <SelectItem value="developer">Developer</SelectItem>
                                          <SelectItem value="qa">QA</SelectItem>
                                          <SelectItem value="client">Client</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <RouteSelector
                                        selectedRoutes={editingUserRoutes}
                                        onRoutesChange={setEditingUserRoutes}
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setEditingUser(null)
                                        setEditingUserRoutes([])
                                      }}
                                    >
                                      Cancelar
                                    </Button>
                                    <Button
                                      onClick={() => {
                                        if (editingUser) {
                                          handleUpdateUserRole(editingUser.email, internalUser.role as UserRole, editingUserRoutes)
                                          setEditingUser(null)
                                          setEditingUserRoutes([])
                                        }
                                      }}
                                    >
                                      Guardar Cambios
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRevokeAccess(internalUser.email)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
