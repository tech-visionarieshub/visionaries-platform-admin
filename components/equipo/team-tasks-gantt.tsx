"use client"

import { useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Calendar, Edit, Trash2, User } from "lucide-react"
import type { TeamTask } from "@/types/team-task"
import type { User as UserType } from "@/lib/api/users-api"

const priorityConfig = {
  high: { label: "Alta", color: "bg-[#E02814]" },
  medium: { label: "Media", color: "bg-[#F59E0B]" },
  low: { label: "Baja", color: "bg-[#4BBAFF]" },
}

interface TeamTasksGanttProps {
  tasks: TeamTask[]
  users: UserType[]
  onTaskClick: (task: TeamTask) => void
  onTaskEdit: (task: TeamTask) => void
  onTaskDelete: (taskId: string) => void
}

export function TeamTasksGantt({ 
  tasks, 
  users, 
  onTaskClick, 
  onTaskEdit, 
  onTaskDelete 
}: TeamTasksGanttProps) {
  // Calcular el rango de fechas
  const dateRange = useMemo(() => {
    if (tasks.length === 0) {
      const today = new Date()
      return {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: new Date(today.getFullYear(), today.getMonth() + 1, 0),
      }
    }

    const dates = tasks
      .map(task => {
        const start = task.createdAt ? new Date(task.createdAt) : new Date()
        const end = task.dueDate ? new Date(task.dueDate) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000) // +7 días si no hay fecha límite
        return { start, end }
      })
      .flat()

    const allDates = dates.flatMap(d => [d.start, d.end])
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())))

    // Ajustar al inicio del mes de inicio y fin del mes de fin
    return {
      start: new Date(minDate.getFullYear(), minDate.getMonth(), 1),
      end: new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0),
    }
  }, [tasks])

  // Generar días del rango
  const days = useMemo(() => {
    const daysArray: Date[] = []
    const current = new Date(dateRange.start)
    while (current <= dateRange.end) {
      daysArray.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    return daysArray
  }, [dateRange])

  // Calcular posición y ancho de cada tarea
  const taskPositions = useMemo(() => {
    return tasks.map((task, index) => {
      const startDate = task.createdAt ? new Date(task.createdAt) : new Date()
      const endDate = task.dueDate ? new Date(task.dueDate) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)

      const startIndex = days.findIndex(
        d => d.toDateString() === startDate.toDateString()
      )
      const endIndex = days.findIndex(
        d => d.toDateString() === endDate.toDateString()
      )

      const left = startIndex >= 0 ? (startIndex / days.length) * 100 : 0
      const width = startIndex >= 0 && endIndex >= 0 
        ? ((endIndex - startIndex + 1) / days.length) * 100 
        : 10

      return {
        task,
        left: `${left}%`,
        width: `${Math.max(width, 2)}%`,
        row: index,
      }
    })
  }, [tasks, days])

  const getDayLabel = (date: Date) => {
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  const getMonthLabel = (date: Date) => {
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  }

  // Agrupar días por mes
  const months = useMemo(() => {
    const monthGroups: { [key: string]: Date[] } = {}
    days.forEach(day => {
      const key = `${day.getFullYear()}-${day.getMonth()}`
      if (!monthGroups[key]) {
        monthGroups[key] = []
      }
      monthGroups[key].push(day)
    })
    return Object.values(monthGroups)
  }, [days])

  return (
    <Card className="p-4">
      <ScrollArea className="w-full">
        <div className="min-w-full">
          {/* Header con meses */}
          <div className="border-b mb-4 pb-2">
            <div className="flex">
              <div className="w-64 flex-shrink-0"></div>
              <div className="flex-1 flex">
                {months.map((monthDays, idx) => (
                  <div
                    key={idx}
                    className="border-l px-2"
                    style={{ width: `${(monthDays.length / days.length) * 100}%` }}
                  >
                    <div className="text-xs font-semibold text-muted-foreground">
                      {getMonthLabel(monthDays[0])}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {monthDays.length} días
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline con barras de tareas */}
          <div className="space-y-2">
            {taskPositions.map(({ task, left, width, row }) => {
              const assignee = users.find(u => u.email === task.assignee)
              const startDate = task.createdAt ? new Date(task.createdAt) : new Date()
              const endDate = task.dueDate ? new Date(task.dueDate) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000)

              return (
                <div key={task.id} className="flex items-center gap-4 h-16">
                  {/* Información de la tarea */}
                  <div className="w-64 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm truncate flex-1">{task.title}</h4>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => onTaskEdit(task)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive"
                          onClick={() => onTaskDelete(task.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {assignee && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{assignee.displayName}</span>
                        </div>
                      )}
                      <Badge className={`${priorityConfig[task.priority].color} text-xs px-1.5 py-0 text-white`}>
                        {task.priority}
                      </Badge>
                    </div>
                  </div>

                  {/* Barra de Gantt */}
                  <div className="flex-1 relative h-12 bg-muted/50 rounded">
                    <div
                      className={`absolute h-full ${priorityConfig[task.priority].color} rounded cursor-pointer hover:opacity-80 transition-opacity flex items-center justify-center text-white text-xs font-medium`}
                      style={{ left, width }}
                      onClick={() => onTaskClick(task)}
                      title={`${task.title} - ${getDayLabel(startDate)} a ${getDayLabel(endDate)}`}
                    >
                      <span className="truncate px-2">{task.title}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Línea de tiempo con días */}
          <div className="mt-4 border-t pt-2">
            <div className="flex">
              <div className="w-64 flex-shrink-0"></div>
              <div className="flex-1 flex text-xs text-muted-foreground">
                {days.map((day, idx) => {
                  // Mostrar solo algunos días para no saturar
                  if (idx % Math.ceil(days.length / 30) !== 0 && idx !== days.length - 1) {
                    return null
                  }
                  return (
                    <div
                      key={idx}
                      className="border-l px-1 text-center"
                      style={{ width: `${100 / days.length}%` }}
                    >
                      {day.getDate()}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </Card>
  )
}

