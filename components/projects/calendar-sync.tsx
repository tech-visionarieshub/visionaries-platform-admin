"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Check, Clock, Users, Mail, RefreshCw, ExternalLink, Filter, Edit2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { getIdToken } from "@/lib/firebase/visionaries-tech"
import { getProjectTeam } from "@/lib/api/project-team-api"

const eventTypeColors = {
  milestone: "bg-purple-500/10 text-purple-700 border-purple-200",
  deadline: "bg-red-500/10 text-red-700 border-red-200",
  meeting: "bg-blue-500/10 text-blue-700 border-blue-200",
  review: "bg-green-500/10 text-green-700 border-green-200",
  warranty: "bg-orange-500/10 text-orange-700 border-orange-200",
}

interface CalendarEvent {
  id: string
  title: string
  description?: string
  start: string
  end: string
  attendees: string[]
  location?: string
  htmlLink?: string
  status?: string
}

interface SyncedEvent {
  id: string
  projectEventId: string
  googleEventId: string
  title: string
  type: 'milestone' | 'deadline' | 'meeting' | 'review' | 'warranty'
  syncedAt: string
  updatedAt: string
}

interface CalendarData {
  connected: boolean
  calendarId?: string
  error?: string
  events: CalendarEvent[]
  syncedEvents: SyncedEvent[]
  filterKeyword?: string | null
}

export function CalendarSync({ projectId }: { projectId: string }) {
  const [isConnected, setIsConnected] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [syncedEvents, setSyncedEvents] = useState<SyncedEvent[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [filterKeyword, setFilterKeyword] = useState<string | null>(null)
  const [showFilterDialog, setShowFilterDialog] = useState(false)
  const [filterInput, setFilterInput] = useState("")
  const [savingFilter, setSavingFilter] = useState(false)
  
  // Form state
  const [eventTitle, setEventTitle] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [eventTime, setEventTime] = useState("10:00")
  const [eventType, setEventType] = useState("meeting")
  const [eventMode, setEventMode] = useState<"virtual" | "presencial">("virtual")
  const [eventAttendees, setEventAttendees] = useState("magic@visionarieshub.com")
  const [eventDescription, setEventDescription] = useState("")
  const [eventLocation, setEventLocation] = useState("")
  const [teamMembers, setTeamMembers] = useState<string[]>([])

  // Cargar datos del calendario
  const loadCalendarData = async () => {
    try {
      setLoading(true)
      const token = await getIdToken()
      if (!token) {
        toast.error("No hay token disponible. Por favor inicia sesión nuevamente.")
        return
      }

      const response = await fetch(`/api/projects/${projectId}/calendar`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(error.error || "Error al cargar datos del calendario")
      }

      const data: CalendarData = await response.json()
      setIsConnected(data.connected)
      setEvents(data.events || [])
      setSyncedEvents(data.syncedEvents || [])
      
      // Cargar filtro de palabra clave
      if (data.filterKeyword !== undefined) {
        const newFilterKeyword = data.filterKeyword
        setFilterKeyword(newFilterKeyword)
        // Si no hay filtro configurado y está conectado, mostrar diálogo solo una vez
        if (!newFilterKeyword && data.connected && !showFilterDialog) {
          // Usar setTimeout para evitar mostrar el diálogo durante la carga inicial
          setTimeout(() => {
            setShowFilterDialog(true)
          }, 500)
        }
      }
      
      // Si hay error, mostrarlo
      if (!data.connected && data.error) {
        console.error("Error de conexión:", data.error)
        // No mostrar toast aquí para evitar spam, se mostrará en el UI
      }
    } catch (error: any) {
      console.error("Error cargando datos del calendario:", error)
      toast.error(error.message || "Error al cargar datos del calendario")
      setIsConnected(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCalendarData()
  }, [projectId])

  const handleConnect = async () => {
    setSyncing(true)
    try {
      await loadCalendarData()
      if (isConnected) {
        toast.success("Conectado a Google Calendar")
      } else {
        toast.error("No se pudo conectar a Google Calendar. Verifica la configuración en Settings.")
      }
    } catch (error: any) {
      toast.error(error.message || "Error al conectar con Google Calendar")
    } finally {
      setSyncing(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const token = await getIdToken()
      if (!token) {
        toast.error("No hay token disponible")
        return
      }

      const response = await fetch(`/api/projects/${projectId}/calendar/sync`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(error.error || "Error al sincronizar")
      }

      const data = await response.json()
      toast.success(data.message || "Eventos sincronizados con Google Calendar")
      await loadCalendarData()
    } catch (error: any) {
      console.error("Error sincronizando:", error)
      toast.error(error.message || "Error al sincronizar eventos")
    } finally {
      setSyncing(false)
    }
  }

  const handleCreateEvent = async () => {
    if (!eventTitle || !eventDate) {
      toast.error("Título y fecha son requeridos")
      return
    }

    setSyncing(true)
    try {
      const token = await getIdToken()
      if (!token) {
        toast.error("No hay token disponible")
        return
      }

      // Formatear fecha y hora correctamente para evitar problemas de timezone
      // eventDate viene en formato "YYYY-MM-DD" (hora local)
      const [hours, minutes] = eventTime.split(":")
      const [year, month, day] = eventDate.split("-").map(Number)
      
      // Crear fecha en hora local (no UTC) para evitar el desfase de un día
      const startDateTime = new Date(year, month - 1, day, parseInt(hours, 10), parseInt(minutes, 10), 0, 0)
      
      const endDateTime = new Date(startDateTime)
      endDateTime.setHours(endDateTime.getHours() + 1) // Duración de 1 hora por defecto
      
      // Formatear fechas como strings en formato local para enviar al backend
      // Esto preserva la hora local sin convertir a UTC
      const formatLocalDateTime = (date: Date) => {
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const d = String(date.getDate()).padStart(2, '0')
        const h = String(date.getHours()).padStart(2, '0')
        const min = String(date.getMinutes()).padStart(2, '0')
        const s = String(date.getSeconds()).padStart(2, '0')
        return `${y}-${m}-${d}T${h}:${min}:${s}`
      }
      
      const startLocal = formatLocalDateTime(startDateTime)
      const endLocal = formatLocalDateTime(endDateTime)
      
      console.log('[CalendarSync] Fechas creadas:', {
        eventDate,
        eventTime,
        startLocal,
        endLocal,
        startISO: startDateTime.toISOString(),
        endISO: endDateTime.toISOString(),
      })

      // Parsear asistentes
      const attendees = eventAttendees
        .split(",")
        .map(email => email.trim())
        .filter(email => email.length > 0)

      const response = await fetch(`/api/projects/${projectId}/calendar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: eventTitle,
          description: eventDescription,
          start: startLocal, // Enviar como string local, no ISO (que convierte a UTC)
          end: endLocal,
          attendees,
          location: eventLocation,
          type: eventType,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(error.error || "Error al crear evento")
      }

      const data = await response.json()
      console.log('[CalendarSync] Evento creado:', data)
      
      if (data.success && data.event) {
        toast.success("Evento creado y sincronizado con Google Calendar")
        
        // Limpiar formulario
        resetEventForm()
        setShowCreateDialog(false)
        
        // Esperar un momento antes de recargar para que Google Calendar procese el evento
        setTimeout(async () => {
          await loadCalendarData()
        }, 1000)
      } else {
        throw new Error(data.error || 'Error desconocido al crear evento')
      }
    } catch (error: any) {
      console.error("Error creando evento:", error)
      toast.error(error.message || "Error al crear evento")
    } finally {
      setSyncing(false)
    }
  }

  // Función para cargar miembros del equipo
  const loadTeamMembers = async () => {
    try {
      const members = await getProjectTeam(projectId)
      const memberEmails = members.map(m => m.email)
      // Agregar magic@visionarieshub.com si no está
      if (!memberEmails.includes("magic@visionarieshub.com")) {
        memberEmails.push("magic@visionarieshub.com")
      }
      setTeamMembers(memberEmails)
      // Establecer los emails por defecto en los invitados
      setEventAttendees(memberEmails.join(", "))
    } catch (error: any) {
      console.error("Error cargando miembros del equipo:", error)
      // Si falla, al menos poner magic@visionarieshub.com
      setEventAttendees("magic@visionarieshub.com")
    }
  }

  // Función para resetear el formulario
  const resetEventForm = () => {
    setEventTitle("")
    setEventDate("")
    setEventTime("10:00")
    setEventType("meeting")
    setEventMode("virtual")
    setEventAttendees("magic@visionarieshub.com")
    setEventDescription("")
    setEventLocation("https://us06web.zoom.us/my/visionarieshub") // Link de Zoom por defecto para virtual
  }

  // Función para guardar el filtro
  const handleSaveFilter = async () => {
    // Permitir guardar filtro vacío para remover el filtro
    const keywordToSave = filterInput.trim() || null

    setSavingFilter(true)
    try {
      const token = await getIdToken()
      if (!token) {
        toast.error("No hay token disponible")
        return
      }

      const response = await fetch(`/api/projects/${projectId}/calendar/filter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ filterKeyword: keywordToSave }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Error desconocido" }))
        throw new Error(error.error || "Error al guardar filtro")
      }

      const data = await response.json()
      setFilterKeyword(data.filterKeyword)
      setShowFilterDialog(false)
      toast.success("Filtro guardado exitosamente")
      
      // Recargar eventos con el nuevo filtro
      await loadCalendarData()
    } catch (error: any) {
      console.error("Error guardando filtro:", error)
      toast.error(error.message || "Error al guardar filtro")
    } finally {
      setSavingFilter(false)
    }
  }

  // Combinar eventos de Google Calendar con eventos sincronizados
  const displayEvents = events.map(event => {
    const synced = syncedEvents.find(se => se.googleEventId === event.id)
    return {
      ...event,
      type: synced?.type || 'meeting',
      synced: !!synced,
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header con estado de conexión */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-medium">Google Calendar</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-muted-foreground">
                {isConnected ? "Sincronización activa" : "No conectado"}
              </p>
              {isConnected && filterKeyword && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Filter className="h-3 w-3" />
                  Filtro: {filterKeyword}
                </Badge>
              )}
            </div>
            {!isConnected && (
              <p className="text-xs text-red-600 mt-1">
                Configura Domain-Wide Delegation en Google Workspace Admin Console
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-700 border-green-200">
                <Check className="h-3 w-3" />
                Conectado
              </Badge>
              {filterKeyword && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setFilterInput(filterKeyword)
                    setShowFilterDialog(true)
                  }}
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Editar Filtro
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleSync} disabled={syncing}>
                <RefreshCw className={`h-3 w-3 mr-1 ${syncing ? "animate-spin" : ""}`} />
                Sincronizar
              </Button>
              <Dialog 
                open={showCreateDialog} 
                onOpenChange={(open) => {
                  setShowCreateDialog(open)
                  if (open) {
                    // Cargar miembros del equipo cuando se abre el diálogo
                    loadTeamMembers()
                    // Si es virtual, establecer link de Zoom
                    if (eventMode === "virtual") {
                      setEventLocation("https://us06web.zoom.us/my/visionarieshub")
                    }
                  } else {
                    // Limpiar formulario cuando se cierra
                    resetEventForm()
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Calendar className="h-3 w-3 mr-1" />
                    Crear Evento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Crear Evento en Calendar</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Título *</Label>
                      <Input
                        placeholder="Nombre del evento"
                        className="h-8 text-sm"
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Fecha *</Label>
                        <Input
                          type="date"
                          className="h-8 text-sm"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Hora</Label>
                        <Input
                          type="time"
                          className="h-8 text-sm"
                          value={eventTime}
                          onChange={(e) => setEventTime(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Tipo</Label>
                      <Select value={eventType} onValueChange={setEventType}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meeting">Reunión</SelectItem>
                          <SelectItem value="milestone">Milestone</SelectItem>
                          <SelectItem value="deadline">Deadline</SelectItem>
                          <SelectItem value="review">Review</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Modalidad</Label>
                      <Select value={eventMode} onValueChange={(value: "virtual" | "presencial") => {
                        setEventMode(value)
                        if (value === "virtual") {
                          // Si es virtual, agregar link de Zoom automáticamente
                          setEventLocation("https://us06web.zoom.us/my/visionarieshub")
                        } else {
                          // Si es presencial, limpiar ubicación para que el usuario la ingrese
                          setEventLocation("")
                        }
                      }}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="virtual">Virtual (Zoom)</SelectItem>
                          <SelectItem value="presencial">Presencial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">
                        {eventMode === "virtual" ? "Link de Zoom" : "Ubicación"}
                      </Label>
                      <Input
                        placeholder={eventMode === "virtual" ? "Link de Zoom" : "Ubicación del evento"}
                        className="h-8 text-sm"
                        value={eventLocation}
                        onChange={(e) => setEventLocation(e.target.value)}
                        disabled={eventMode === "virtual"}
                      />
                      {eventMode === "virtual" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Link de Zoom configurado automáticamente
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">Asistentes</Label>
                      <Textarea
                        placeholder="emails separados por coma"
                        className="h-16 text-sm resize-none"
                        value={eventAttendees}
                        onChange={(e) => setEventAttendees(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Por defecto: miembros del equipo del proyecto
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs">Descripción</Label>
                      <Textarea
                        placeholder="Detalles del evento"
                        className="h-16 text-sm resize-none"
                        value={eventDescription}
                        onChange={(e) => setEventDescription(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleCreateEvent} disabled={syncing} className="w-full">
                      {syncing ? "Creando..." : "Crear y Sincronizar"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <>
              <Button size="sm" onClick={handleConnect} disabled={syncing}>
                <Calendar className="h-3 w-3 mr-1" />
                {syncing ? "Conectando..." : "Conectar Calendar"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mensaje de error si no está conectado */}
      {!isConnected && !loading && (
        <Card className="p-3 bg-yellow-500/5 border-yellow-200">
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-yellow-900">Problema de Conexión</h4>
            <p className="text-xs text-yellow-700">
              No se pudo conectar con Google Calendar. Posibles causas:
            </p>
            <ul className="text-xs text-yellow-700 list-disc list-inside space-y-1 ml-2">
              <li>El usuario <strong>magic@visionarieshub.com</strong> no existe o no está activo en Google Workspace</li>
              <li>Domain-Wide Delegation necesita más tiempo para propagarse (espera 5-10 minutos)</li>
              <li>El scope no está exactamente como: <code className="bg-yellow-100 px-1 rounded">https://www.googleapis.com/auth/calendar</code></li>
              <li>El dominio <strong>visionarieshub.com</strong> no es correcto</li>
            </ul>
            <div className="mt-3 p-2 bg-yellow-100 rounded text-xs">
              <p className="font-medium text-yellow-900 mb-1">Verifica en Google Workspace Admin:</p>
              <ol className="list-decimal list-inside space-y-1 text-yellow-800">
                <li>Ve a <a href="https://admin.google.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">Admin Console</a></li>
                <li><strong>Seguridad</strong> → <strong>API Controls</strong> → <strong>Domain-wide Delegation</strong></li>
                <li>Verifica que el Client ID <strong>110617753637691984482</strong> esté listado</li>
                <li>Verifica que el scope sea exactamente: <code className="bg-white px-1 rounded">https://www.googleapis.com/auth/calendar</code></li>
                <li>Verifica que el usuario <strong>magic@visionarieshub.com</strong> exista en <strong>Usuarios</strong></li>
              </ol>
            </div>
          </div>
        </Card>
      )}

      {/* Eventos sincronizados */}
      {isConnected && (
        <Card className="p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-medium text-muted-foreground">Eventos Sincronizados</h4>
              <Badge variant="outline" className="text-xs">
                {displayEvents.length} eventos
              </Badge>
            </div>

            {displayEvents.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No hay eventos sincronizados. Haz clic en "Sincronizar" para sincronizar eventos del proyecto.
              </p>
            ) : (
              <div className="space-y-1.5">
                {displayEvents.map((event) => {
                  const eventDate = new Date(event.start)
                  const now = new Date()
                  const isPast = eventDate < now
                  const eventTime = eventDate.toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  
                  return (
                    <div
                      key={event.id}
                      className={`flex items-center justify-between p-2 rounded-md border transition-colors ${
                        isPast
                          ? 'bg-gray-50/50 border-gray-200 opacity-75'
                          : 'bg-card hover:bg-accent/50 border-border'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-xs font-medium truncate ${
                              isPast ? 'text-gray-500' : 'text-foreground'
                            }`}>
                              {event.title}
                            </p>
                            <Badge
                              variant="outline"
                              className={`text-xs px-1.5 py-0 ${
                                eventTypeColors[event.type as keyof typeof eventTypeColors] || 
                                eventTypeColors.meeting
                              } ${isPast ? 'opacity-60' : ''}`}
                            >
                              {event.type}
                            </Badge>
                            {isPast && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0 bg-gray-100 text-gray-600 border-gray-300">
                                Pasado
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <p className={`text-xs ${
                              isPast ? 'text-gray-400' : 'text-muted-foreground'
                            }`}>
                              {eventDate.toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}{" "}
                              • {eventTime}
                            </p>
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{event.attendees.length}</span>
                            </div>
                            {event.htmlLink && (
                              <a
                                href={event.htmlLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Ver en Calendar
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                      {event.synced && (
                        <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-700 border-green-200 ml-2">
                          <Check className="h-3 w-3" />
                          Sync
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Configuración de sincronización automática */}
      {isConnected && (
        <Card className="p-3">
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Sincronización Automática</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
                <Check className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Milestones del proyecto</p>
                  <p className="text-muted-foreground text-xs">Se crean automáticamente al definir fechas</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
                <Check className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Deadlines de sprints</p>
                  <p className="text-muted-foreground text-xs">Notificación 24h antes del vencimiento</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
                <Check className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Reuniones de seguimiento</p>
                  <p className="text-muted-foreground text-xs">Invitaciones automáticas al equipo</p>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2 rounded-md bg-muted/50">
                <Check className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Vencimiento de garantía</p>
                  <p className="text-muted-foreground text-xs">Alerta 7 días antes del vencimiento</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Admin siempre incluido */}
      <Card className="p-3 bg-blue-500/5 border-blue-200">
        <div className="flex items-start gap-2">
          <Mail className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-medium text-blue-900">Admin General</p>
            <p className="text-xs text-blue-700 mt-0.5">
              magic@visionarieshub.com se incluye automáticamente en todos los eventos del proyecto
            </p>
          </div>
        </div>
      </Card>

      {/* Diálogo para configurar filtro */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {filterKeyword ? "Editar Filtro de Calendario" : "Configurar Filtro de Calendario"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Palabra Clave para Filtrar Eventos</Label>
              <Input
                placeholder="Ej: SGAC, Cliente, Proyecto..."
                className="mt-1"
                value={filterInput}
                onChange={(e) => setFilterInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !savingFilter) {
                    handleSaveFilter()
                  }
                }}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Solo se mostrarán eventos que contengan esta palabra clave en el título o descripción.
                {filterKeyword && (
                  <span className="block mt-1">
                    Deja vacío y guarda para remover el filtro y mostrar todos los eventos.
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowFilterDialog(false)
                  setFilterInput(filterKeyword || "")
                }}
                disabled={savingFilter}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveFilter} 
                disabled={savingFilter || (!filterInput.trim() && !filterKeyword)}
              >
                {savingFilter ? "Guardando..." : filterKeyword && !filterInput.trim() ? "Remover Filtro" : "Guardar Filtro"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
