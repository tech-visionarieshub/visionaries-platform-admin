"use client"

import { QASystem } from "@/components/projects/qa-system"
import { useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Info } from "lucide-react"

export default function QAPage() {
  const params = useParams()
  const projectId = params.id as string
  
  return (
    <div className="space-y-4">
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-blue-900">Información sobre Tareas QA</h3>
            <p className="text-xs text-blue-700">
              Las tareas QA se crean automáticamente cuando una funcionalidad se marca como completada en la sección de Funcionalidades.
              También puedes crear tareas QA independientes para bugs o casos especiales.
            </p>
          </div>
        </div>
      </Card>
      <QASystem projectId={projectId} />
    </div>
  )
}
