"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Mail, DollarSign, Clock, User } from "lucide-react"
import type { Lead } from "./kanban-board"

type KanbanCardProps = {
  lead: Lead
}

export function KanbanCard({ lead }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const priorityColors = {
    high: "bg-red-100 text-red-700 border-red-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    low: "bg-blue-100 text-blue-700 border-blue-200",
  }

  const priorityLabels = {
    high: "Alta",
    medium: "Media",
    low: "Baja",
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm leading-tight">{lead.name}</h4>
          <Badge variant="outline" className={`text-xs ${priorityColors[lead.priority]}`}>
            {priorityLabels[lead.priority]}
          </Badge>
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{lead.company}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-3 w-3" />
            <span className="truncate">{lead.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-3 w-3" />
            <span>${lead.budget.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{lead.responsible}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{lead.daysInStage}d</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
