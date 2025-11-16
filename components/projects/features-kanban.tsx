"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { GripVertical, AlertCircle, Clock } from "lucide-react"

interface Feature {
  id: number
  name: string
  status: string
  priority: string
  assignee?: string
  dueDate?: string
}

interface FeaturesKanbanProps {
  features: Feature[]
}

const columns = [
  { id: "Pendiente", title: "Pendiente", color: "#6B7280" },
  { id: "En progreso", title: "En Progreso", color: "#4BBAFF" },
  { id: "En revisión", title: "En Revisión", color: "#9832FF" },
  { id: "Completado", title: "Completado", color: "#95C900" },
]

export function FeaturesKanban({ features }: FeaturesKanbanProps) {
  const [items, setItems] = useState(features)

  const getFeaturesByStatus = (status: string) => {
    return items.filter((item) => item.status === status)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Alta":
        return "text-[#E02814]"
      case "Media":
        return "text-[#F59E0B]"
      case "Baja":
        return "text-[#4BBAFF]"
      default:
        return "text-gray-500"
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => {
        const columnFeatures = getFeaturesByStatus(column.id)
        return (
          <div key={column.id} className="flex-shrink-0 w-80">
            <div className="bg-[#F9FAFB] rounded-lg p-4">
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: column.color }} />
                  <h3 className="font-semibold text-[#0E0734]">{column.title}</h3>
                </div>
                <span className="text-sm text-muted-foreground">{columnFeatures.length}</span>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {columnFeatures.map((feature) => (
                  <Card
                    key={feature.id}
                    className="p-4 cursor-move hover:shadow-md transition-shadow"
                    style={{ borderLeft: `4px solid ${column.color}` }}
                  >
                    <div className="flex items-start gap-2 mb-3">
                      <GripVertical className="h-4 w-4 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm text-[#0E0734] mb-2">{feature.name}</h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className={`flex items-center gap-1 text-xs ${getPriorityColor(feature.priority)}`}>
                            <AlertCircle className="h-3 w-3" />
                            {feature.priority}
                          </div>
                          {feature.dueDate && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(feature.dueDate).toLocaleDateString("es-ES", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </div>
                          )}
                        </div>
                        {feature.assignee && <p className="text-xs text-muted-foreground mt-2">{feature.assignee}</p>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
