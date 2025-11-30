"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useDroppable } from "@dnd-kit/core"
import { User, Clock, Calendar, Edit, Trash2 } from "lucide-react"
import type { TeamTask, TeamTaskStatus } from "@/types/team-task"
import { useToast } from "@/hooks/use-toast"
import { updateTeamTask, deleteTeamTask } from "@/lib/api/team-tasks-api"
import type { User as UserType } from "@/lib/api/users-api"

const statusColumns: Array<{ id: TeamTaskStatus; label: string; color: string }> = [
  { id: "pending", label: "Pendiente", color: "#6B7280" },
  { id: "in-progress", label: "En Progreso", color: "#9333EA" },
  { id: "review", label: "En Revisión", color: "#F59E0B" },
  { id: "completed", label: "Completada", color: "#10B981" },
  { id: "cancelled", label: "Cancelada", color: "#EF4444" },
]

const priorityConfig = {
  high: { label: "Alta", color: "text-[#E02814] bg-[#E02814]/10" },
  medium: { label: "Media", color: "text-[#F59E0B] bg-[#F59E0B]/10" },
  low: { label: "Baja", color: "text-[#4BBAFF] bg-[#4BBAFF]/10" },
}

interface TeamTasksKanbanProps {
  tasks: TeamTask[]
  users: UserType[]
  onTaskClick: (task: TeamTask) => void
  onTaskEdit: (task: TeamTask) => void
  onTaskDelete: (taskId: string) => void
  onStatusChange: (taskId: string, newStatus: TeamTaskStatus) => void
}

function KanbanCard({ 
  task, 
  users, 
  onTaskClick, 
  onTaskEdit, 
  onTaskDelete 
}: { 
  task: TeamTask
  users: UserType[]
  onTaskClick: (task: TeamTask) => void
  onTaskEdit: (task: TeamTask) => void
  onTaskDelete: (taskId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const assignee = users.find(u => u.email === task.assignee)

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow mb-3"
      onClick={() => onTaskClick(task)}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm leading-tight flex-1">{task.title}</h4>
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
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

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`${priorityConfig[task.priority].color} text-xs px-1.5 py-0`} variant="outline">
            {priorityConfig[task.priority].label}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {task.category === 'Otra' ? (task.customCategory || 'Otra') : task.category}
          </Badge>
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          {assignee && (
            <div className="flex items-center gap-1.5">
              <User className="h-3 w-3" />
              <span className="truncate">{assignee.displayName}</span>
            </div>
          )}
          {task.projectName && (
            <div className="text-xs truncate">{task.projectName}</div>
          )}
          {task.dueDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              <span>{new Date(task.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
            </div>
          )}
          {(task.estimatedHours || task.actualHours) && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <span>
                {task.actualHours ? `${task.actualHours}h` : task.estimatedHours ? `${task.estimatedHours}h est.` : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

function KanbanColumn({ 
  column, 
  tasks, 
  users,
  onTaskClick,
  onTaskEdit,
  onTaskDelete
}: { 
  column: typeof statusColumns[0]
  tasks: TeamTask[]
  users: UserType[]
  onTaskClick: (task: TeamTask) => void
  onTaskEdit: (task: TeamTask) => void
  onTaskDelete: (taskId: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  return (
    <div className="flex-shrink-0 w-80">
      <div
        ref={setNodeRef}
        className={`bg-muted rounded-xl p-4 h-full transition-colors ${isOver ? "ring-2 ring-primary" : ""}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color }} />
            <h3 className="font-semibold text-sm">{column.label}</h3>
          </div>
          <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>

        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 min-h-[200px]">
            {tasks.map((task) => (
              <KanbanCard
                key={task.id}
                task={task}
                users={users}
                onTaskClick={onTaskClick}
                onTaskEdit={onTaskEdit}
                onTaskDelete={onTaskDelete}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}

export function TeamTasksKanban({ 
  tasks, 
  users, 
  onTaskClick, 
  onTaskEdit, 
  onTaskDelete,
  onStatusChange 
}: TeamTasksKanbanProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    const activeTask = tasks.find((task) => task.id === activeId)
    if (!activeTask) {
      setActiveId(null)
      return
    }

    // Check if dropped on a status column
    const targetStatus = statusColumns.find((col) => col.id === overId)
    if (targetStatus && targetStatus.id !== activeTask.status) {
      try {
        await onStatusChange(activeTask.id, targetStatus.id)
        toast({
          title: "Estado actualizado",
          description: `Tarea movida a ${targetStatus.label}`,
        })
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "No se pudo actualizar el estado",
          variant: "destructive",
        })
      }
    }

    setActiveId(null)
  }

  const getTasksByStatus = (status: TeamTaskStatus) => {
    return tasks.filter((task) => task.status === status)
  }

  const activeTask = tasks.find((task) => task.id === activeId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statusColumns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={getTasksByStatus(column.id)}
            users={users}
            onTaskClick={onTaskClick}
            onTaskEdit={onTaskEdit}
            onTaskDelete={onTaskDelete}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="rotate-3 opacity-80">
            <Card className="p-3 w-80">
              <h4 className="font-semibold text-sm">{activeTask.title}</h4>
            </Card>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

