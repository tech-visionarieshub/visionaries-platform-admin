"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ProjectStatus } from "@/lib/mock-data/projects"

interface StatusSelectorProps {
  value: ProjectStatus
  onValueChange: (value: ProjectStatus) => void
  disabled?: boolean
}

const statusColors: Record<ProjectStatus, { bg: string; text: string; border: string; dot: string }> = {
  "lead": { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300", dot: "#6B7280" },
  "Onboarding": { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300", dot: "#93C5FD" },
  "Mapeo de procesos": { bg: "bg-blue-200", text: "text-blue-800", border: "border-blue-400", dot: "#3B82F6" },
  "Lista de funcionalidades": { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-300", dot: "#6366F1" },
  "Planificación": { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-300", dot: "#A855F7" },
  "Kickoff": { bg: "bg-purple-200", text: "text-purple-800", border: "border-purple-400", dot: "#7C3AED" },
  "En ejecución": { bg: "bg-green-100", text: "text-green-700", border: "border-green-300", dot: "#10B981" },
  "En espera": { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300", dot: "#F59E0B" },
  "Bloqueado": { bg: "bg-red-100", text: "text-red-700", border: "border-red-300", dot: "#EF4444" },
  "Revisión interna": { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300", dot: "#F97316" },
  "Revisión cliente": { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300", dot: "#D97706" },
  "Carta de aceptación": { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300", dot: "#34D399" },
  "Último pago pendiente": { bg: "bg-yellow-200", text: "text-yellow-800", border: "border-yellow-400", dot: "#EAB308" },
  "Entregado": { bg: "bg-green-200", text: "text-green-800", border: "border-green-400", dot: "#059669" },
  "En-garantía": { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-300", dot: "#14B8A6" },
  "Finalizado": { bg: "bg-gray-200", text: "text-gray-800", border: "border-gray-400", dot: "#374151" },
}

const allStatuses: ProjectStatus[] = [
  "lead",
  "Onboarding",
  "Mapeo de procesos",
  "Lista de funcionalidades",
  "Planificación",
  "Kickoff",
  "En ejecución",
  "En espera",
  "Bloqueado",
  "Revisión interna",
  "Revisión cliente",
  "Carta de aceptación",
  "Último pago pendiente",
  "Entregado",
  "En-garantía",
  "Finalizado",
]

export function StatusSelector({ value, onValueChange, disabled }: StatusSelectorProps) {
  const colorConfig = statusColors[value] || statusColors["lead"]

  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger 
        className={`w-full ${colorConfig.bg} ${colorConfig.text} ${colorConfig.border} border font-medium`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {allStatuses.map((status) => {
          const statusColor = statusColors[status]
          return (
            <SelectItem 
              key={status} 
              value={status}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: statusColor.dot }}
                />
                <span>{status}</span>
              </div>
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
