"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Check, Clock, Users, Mail, RefreshCw } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

// Mock data - eventos sincronizados
const mockSyncedEvents = [
  {
    id: "1",
    title: "Sprint 1 Planning",
    type: "meeting",
    date: "2025-02-01",
    time: "10:00",
    attendees: ["magic@visionarieshub.com", "dev1@example.com", "dev2@example.com"],
    calendarId: "cal_abc123",
    synced: true,
  },
  {
    id: "2",
    title: "Milestone: MVP Release",
    type: "milestone",
    date: "2025-02-15",
    time: "17:00",
    attendees: ["magic@visionarieshub.com", "pm@example.com"],
    calendarId: "cal_def456",
    synced: true,
  },
  {
    id: "3",
    title: "Sprint 1 Review",
    type: "meeting",
    date: "2025-02-14",
    time: "15:00",
    attendees: ["magic@visionarieshub.com", "team@example.com"],
    calendarId: "cal_ghi789",
    synced: true,
  },
  {
    id: "4",
    title: "Warranty Expiration",
    type: "deadline",
    date: "2025-03-30",
    time: "23:59",
    attendees: ["magic@visionarieshub.com"],
    calendarId: "cal_jkl012",
    synced: true,
  },
]

const eventTypeColors = {
  milestone: "bg-purple-500/10 text-purple-700 border-purple-200",
  deadline: "bg-red-500/10 text-red-700 border-red-200",
  meeting: "bg-blue-500/10 text-blue-700 border-blue-200",
  review: "bg-green-500/10 text-green-700 border-green-200",
}

export function CalendarSync() {
  const [isConnected, setIsConnected] = useState(true) // Simulado como conectado
  const [syncing, setSyncing] = useState(false)
  const [events, setEvents] = useState(mockSyncedEvents)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  const handleConnect = async () => {
    setSyncing(true)
    // Simular conexión con Google Calendar
    await new Promise((r) => setTimeout(r, 1500))
    setIsConnected(true)
    setSyncing(false)
    toast.success("Conectado a Google Calendar")
  }

  const handleSync = async () => {
    setSyncing(true)
    // Simular sincronización
    await new Promise((r) => setTimeout(r, 2000))
    setSyncing(false)
    toast.success("Eventos sincronizados con Google Calendar")
  }

  const handleCreateEvent = async () => {
    setSyncing(true)
    // Simular creación de evento
    await new Promise((r) => setTimeout(r, 1500))
    setSyncing(false)
    setShowCreateDialog(false)
    toast.success("Evento creado y sincronizado")
  }

  return (
    <div className="space-y-4">
      {/* Header con estado de conexión */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="text-sm font-medium">Google Calendar</h3>
            <p className="text-xs text-muted-foreground">{isConnected ? "Sincronización activa" : "No conectado"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-700 border-green-200">
                <Check className="h-3 w-3" />
                Conectado
              </Badge>
              <Button size="sm" variant="outline" onClick={handleSync} disabled={syncing}>
                <RefreshCw className={`h-3 w-3 mr-1 ${syncing ? "animate-spin" : ""}`} />
                Sincronizar
              </Button>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
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
                      <Label className="text-xs">Título</Label>
                      <Input placeholder="Nombre del evento" className="h-8 text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Fecha</Label>
                        <Input type="date" className="h-8 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs">Hora</Label>
                        <Input type="time" className="h-8 text-sm" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Tipo</Label>
                      <Select defaultValue="meeting">
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
                      <Label className="text-xs">Asistentes</Label>
                      <Textarea
                        placeholder="emails separados por coma"
                        className="h-16 text-sm resize-none"
                        defaultValue="magic@visionarieshub.com"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Descripción</Label>
                      <Textarea placeholder="Detalles del evento" className="h-16 text-sm resize-none" />
                    </div>
                    <Button onClick={handleCreateEvent} disabled={syncing} className="w-full">
                      {syncing ? "Creando..." : "Crear y Sincronizar"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <Button size="sm" onClick={handleConnect} disabled={syncing}>
              <Calendar className="h-3 w-3 mr-1" />
              {syncing ? "Conectando..." : "Conectar Calendar"}
            </Button>
          )}
        </div>
      </div>

      {/* Eventos sincronizados */}
      {isConnected && (
        <Card className="p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-medium text-muted-foreground">Eventos Sincronizados</h4>
              <Badge variant="outline" className="text-xs">
                {events.length} eventos
              </Badge>
            </div>

            <div className="space-y-1.5">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-medium truncate">{event.title}</p>
                        <Badge
                          variant="outline"
                          className={`text-xs px-1.5 py-0 ${eventTypeColors[event.type as keyof typeof eventTypeColors]}`}
                        >
                          {event.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.date).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          • {event.time}
                        </p>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{event.attendees.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-700 border-green-200 ml-2">
                    <Check className="h-3 w-3" />
                    Sync
                  </Badge>
                </div>
              ))}
            </div>
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
    </div>
  )
}
