"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { KanbanCard } from "./kanban-card"
import type { Lead } from "./kanban-board"

type Stage = {
  id: string
  name: string
  color: string
}

type KanbanColumnProps = {
  stage: Stage
  leads: Lead[]
}

export function KanbanColumn({ stage, leads }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
  })

  return (
    <div className="flex-shrink-0 w-80">
      <div
        ref={setNodeRef}
        className={`bg-muted rounded-xl p-4 transition-colors ${isOver ? "ring-2 ring-primary" : ""}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
            <h3 className="font-semibold text-sm">{stage.name}</h3>
          </div>
          <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded-full">{leads.length}</span>
        </div>

        <SortableContext items={leads.map((lead) => lead.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 min-h-[200px]">
            {leads.map((lead) => (
              <KanbanCard key={lead.id} lead={lead} />
            ))}
          </div>
        </SortableContext>
      </div>
    </div>
  )
}
