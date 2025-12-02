"use client"

import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Edit, Trash2, User, Clock } from "lucide-react"
import type { TeamTask } from "@/types/team-task"
import type { User as UserType } from "@/lib/api/users-api"

const priorityConfig = {
  high: { label: "Alta", color: "text-[#E02814] bg-[#E02814]/10" },
  medium: { label: "Media", color: "text-[#F59E0B] bg-[#F59E0B]/10" },
  low: { label: "Baja", color: "text-[#4BBAFF] bg-[#4BBAFF]/10" },
}

interface TeamTasksCalendarProps {
  tasks: TeamTask[]
  users: UserType[]
  onTaskClick: (task: TeamTask) => void
  onTaskEdit: (task: TeamTask) => void
  onTaskDelete: (taskId: string) => void
}

export function TeamTasksCalendar({ 
  tasks, 
  users, 
  onTaskClick, 
  onTaskEdit, 
  onTaskDelete 
}: TeamTasksCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Primer día del mes y último día del mes
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  // Navegación
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Obtener tareas por fecha
  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return tasks.filter(task => {
      const taskDate = task.dueDate 
        ? new Date(task.dueDate).toISOString().split('T')[0]
        : task.createdAt 
        ? new Date(task.createdAt).toISOString().split('T')[0]
        : null
      return taskDate === dateStr
    })
  }

  const getTasksForCreatedDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return tasks.filter(task => {
      const taskDate = task.createdAt 
        ? new Date(task.createdAt).toISOString().split('T')[0]
        : null
      return taskDate === dateStr
    })
  }

  const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  const today = new Date()
  const isToday = (day: number) => {
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header del calendario */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold capitalize">{monthName}</h3>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoy
          </Button>
        </div>

        {/* Calendario */}
        <div className="grid grid-cols-7 gap-1">
          {/* Días de la semana */}
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
              {day}
            </div>
          ))}

          {/* Días vacíos al inicio */}
          {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} className="aspect-square"></div>
          ))}

          {/* Días del mes */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const day = idx + 1
            const date = new Date(year, month, day)
            const dayTasks = getTasksForDate(date)
            const createdTasks = getTasksForCreatedDate(date)

            return (
              <div
                key={day}
                className={`aspect-square border rounded-lg p-1 overflow-y-auto ${
                  isToday(day) ? 'bg-primary/10 border-primary' : 'bg-background'
                }`}
              >
                <div className={`text-xs font-medium mb-1 ${isToday(day) ? 'text-primary' : ''}`}>
                  {day}
                </div>
                <div className="space-y-1">
                  {createdTasks.length > 0 && (
                    <div className="text-[10px] text-muted-foreground">
                      Creadas: {createdTasks.length}
                    </div>
                  )}
                  {dayTasks.slice(0, 3).map((task) => {
                    const assignee = users.find(u => u.email === task.assignee)
                    return (
                      <div
                        key={task.id}
                        className={`text-[10px] p-1 rounded cursor-pointer hover:opacity-80 ${priorityConfig[task.priority].color}`}
                        onClick={() => onTaskClick(task)}
                        title={task.title}
                      >
                        <div className="truncate font-medium">{task.title}</div>
                        {assignee && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <User className="h-2.5 w-2.5" />
                            <span className="truncate">{assignee.displayName}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {dayTasks.length > 3 && (
                    <div className="text-[10px] text-muted-foreground">
                      +{dayTasks.length - 3} más
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Leyenda */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary/10 border border-primary"></div>
            <span>Hoy</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${priorityConfig.high.color} text-xs`}>Alta</Badge>
            <Badge className={`${priorityConfig.medium.color} text-xs`}>Media</Badge>
            <Badge className={`${priorityConfig.low.color} text-xs`}>Baja</Badge>
          </div>
        </div>
      </div>
    </Card>
  )
}






