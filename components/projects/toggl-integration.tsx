"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, AlertTriangle, CheckCircle2, TrendingUp, Users } from "lucide-react"
import { Progress } from "@/components/ui/progress"

// Mock data - Toggl time entries
const mockTimeEntries = [
  {
    id: "1",
    taskId: "TASK-101",
    taskName: "Implementar autenticación JWT",
    user: "Carlos Méndez",
    date: "2025-01-28",
    duration: 4.5,
    estimated: 6,
    status: "on-track" as const,
  },
  {
    id: "2",
    taskId: "TASK-102",
    taskName: "Diseño de dashboard principal",
    user: "Ana García",
    date: "2025-01-28",
    duration: 8.2,
    estimated: 6,
    status: "over" as const,
  },
  {
    id: "3",
    taskId: "TASK-103",
    taskName: "API de usuarios",
    user: "Carlos Méndez",
    date: "2025-01-27",
    duration: 3.5,
    estimated: 8,
    status: "on-track" as const,
  },
  {
    id: "4",
    taskId: "TASK-104",
    taskName: "Integración con Stripe",
    user: "Luis Torres",
    date: "2025-01-27",
    duration: 5.0,
    estimated: 4,
    status: "over" as const,
  },
]

const mockTeamSummary = [
  { user: "Carlos Méndez", hours: 24.5, estimated: 28, efficiency: 87 },
  { user: "Ana García", hours: 32.2, estimated: 30, efficiency: 107 },
  { user: "Luis Torres", hours: 18.0, estimated: 20, efficiency: 90 },
]

export function TogglIntegration() {
  const [syncing, setSyncing] = useState(false)
  const [filter, setFilter] = useState<"all" | "on-track" | "over">("all")

  const handleSync = async () => {
    setSyncing(true)
    await new Promise((r) => setTimeout(r, 1500))
    setSyncing(false)
  }

  const filteredEntries = mockTimeEntries.filter((entry) => (filter === "all" ? true : entry.status === filter))

  const totalHours = mockTimeEntries.reduce((sum, e) => sum + e.duration, 0)
  const totalEstimated = mockTimeEntries.reduce((sum, e) => sum + e.estimated, 0)
  const overBudget = mockTimeEntries.filter((e) => e.status === "over").length

  return (
    <div className="space-y-4">
      {/* Header con resumen */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Tracking de Horas (Toggl)</h3>
          <p className="text-xs text-muted-foreground">
            {totalHours.toFixed(1)}h trabajadas de {totalEstimated}h estimadas
          </p>
        </div>
        <Button size="sm" onClick={handleSync} disabled={syncing}>
          {syncing ? (
            <>
              <Clock className="h-3 w-3 mr-1 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <Clock className="h-3 w-3 mr-1" />
              Sincronizar
            </>
          )}
        </Button>
      </div>

      {/* Métricas rápidas */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Total Horas</p>
              <p className="text-lg font-bold">{totalHours.toFixed(1)}h</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Eficiencia</p>
              <p className="text-lg font-bold">{Math.round((totalHours / totalEstimated) * 100)}%</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Sobre presupuesto</p>
              <p className="text-lg font-bold">{overBudget}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>
          Todas ({mockTimeEntries.length})
        </Button>
        <Button size="sm" variant={filter === "on-track" ? "default" : "outline"} onClick={() => setFilter("on-track")}>
          En tiempo ({mockTimeEntries.filter((e) => e.status === "on-track").length})
        </Button>
        <Button size="sm" variant={filter === "over" ? "default" : "outline"} onClick={() => setFilter("over")}>
          Excedidas ({mockTimeEntries.filter((e) => e.status === "over").length})
        </Button>
      </div>

      {/* Lista de time entries */}
      <div className="space-y-2">
        {filteredEntries.map((entry) => {
          const percentage = (entry.duration / entry.estimated) * 100
          const isOver = entry.status === "over"

          return (
            <Card key={entry.id} className="p-3">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {entry.taskId}
                      </Badge>
                      <p className="text-sm font-medium truncate">{entry.taskName}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">{entry.user}</p>
                      <span className="text-xs text-muted-foreground">•</span>
                      <p className="text-xs text-muted-foreground">{entry.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isOver ? (
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${isOver ? "text-orange-600" : "text-green-600"}`}>
                        {entry.duration.toFixed(1)}h
                      </p>
                      <p className="text-xs text-muted-foreground">de {entry.estimated}h</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Progress value={Math.min(percentage, 100)} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">{percentage.toFixed(0)}% del tiempo estimado</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Resumen por persona */}
      <Card className="p-3">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4" />
          <h4 className="text-sm font-semibold">Resumen por Persona</h4>
        </div>
        <div className="space-y-2">
          {mockTeamSummary.map((member) => (
            <div key={member.user} className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium">{member.user}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={(member.hours / member.estimated) * 100} className="h-1.5 flex-1" />
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {member.hours}h / {member.estimated}h
                  </p>
                </div>
              </div>
              <Badge variant={member.efficiency > 100 ? "destructive" : "default"} className="ml-2">
                {member.efficiency}%
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
