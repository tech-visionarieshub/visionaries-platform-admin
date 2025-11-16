"use client"

import { useState } from "react"
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
import { KanbanColumn } from "./kanban-column"
import { KanbanCard } from "./kanban-card"

export type Lead = {
  id: string
  name: string
  company: string
  email: string
  budget: number
  responsible: string
  daysInStage: number
  priority: "high" | "medium" | "low"
  stage: string
}

const stages = [
  { id: "lead", name: "Lead ingresado", color: "#4BBAFF" },
  { id: "contacted", name: "Contactado", color: "#9832FF" },
  { id: "discovery", name: "Discovery", color: "#4514F9" },
  { id: "proposal", name: "Propuesta", color: "#95C900" },
  { id: "negotiation", name: "Negociación", color: "#F59E0B" },
  { id: "onboarding", name: "Onboarding", color: "#4BBAFF" },
  { id: "active", name: "Cliente Activo", color: "#95C900" },
  { id: "project", name: "Proyecto", color: "#4514F9" },
  { id: "warranty", name: "Garantía", color: "#9832FF" },
  { id: "finished", name: "Finalizado", color: "#6B7280" },
]

const mockLeads: Lead[] = [
  {
    id: "1",
    name: "Juan Pérez",
    company: "Tech Solutions SA",
    email: "juan@techsolutions.com",
    budget: 50000,
    responsible: "María García",
    daysInStage: 3,
    priority: "high",
    stage: "lead",
  },
  {
    id: "2",
    name: "Ana Martínez",
    company: "Innovate Corp",
    email: "ana@innovate.com",
    budget: 75000,
    responsible: "Carlos López",
    daysInStage: 5,
    priority: "medium",
    stage: "contacted",
  },
  {
    id: "3",
    name: "Pedro Sánchez",
    company: "Digital Plus",
    email: "pedro@digitalplus.com",
    budget: 120000,
    responsible: "María García",
    daysInStage: 8,
    priority: "high",
    stage: "discovery",
  },
  {
    id: "4",
    name: "Laura Rodríguez",
    company: "StartUp XYZ",
    email: "laura@startupxyz.com",
    budget: 35000,
    responsible: "Carlos López",
    daysInStage: 12,
    priority: "low",
    stage: "proposal",
  },
  {
    id: "5",
    name: "Miguel Torres",
    company: "Enterprise Global",
    email: "miguel@enterprise.com",
    budget: 200000,
    responsible: "María García",
    daysInStage: 15,
    priority: "high",
    stage: "negotiation",
  },
]

export function KanbanBoard() {
  const [leads, setLeads] = useState<Lead[]>(mockLeads)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeLead = leads.find((lead) => lead.id === activeId)
    if (!activeLead) return

    // Check if dropped on a stage column
    const targetStage = stages.find((stage) => stage.id === overId)
    if (targetStage) {
      setLeads((leads) => leads.map((lead) => (lead.id === activeId ? { ...lead, stage: targetStage.id } : lead)))
    }

    setActiveId(null)
  }

  const getLeadsByStage = (stageId: string) => {
    return leads.filter((lead) => lead.stage === stageId)
  }

  const activeLead = leads.find((lead) => lead.id === activeId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <KanbanColumn key={stage.id} stage={stage} leads={getLeadsByStage(stage.id)} />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? (
          <div className="rotate-3 opacity-80">
            <KanbanCard lead={activeLead} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
