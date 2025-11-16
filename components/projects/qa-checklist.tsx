"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle2, Circle, AlertTriangle } from "lucide-react"

interface QAItem {
  id: number
  title: string
  completed: boolean
  priority: string
  notes?: string
}

const internalQA: QAItem[] = [
  { id: 1, title: "Pruebas unitarias completadas", completed: true, priority: "Alta" },
  { id: 2, title: "Pruebas de integración", completed: true, priority: "Alta" },
  { id: 3, title: "Revisión de código", completed: true, priority: "Alta" },
  { id: 4, title: "Pruebas de rendimiento", completed: false, priority: "Media" },
  { id: 5, title: "Pruebas de seguridad", completed: false, priority: "Alta" },
  { id: 6, title: "Documentación técnica", completed: false, priority: "Media" },
]

const clientQA: QAItem[] = [
  { id: 1, title: "Validación de funcionalidades core", completed: true, priority: "Alta" },
  { id: 2, title: "Pruebas de usabilidad", completed: false, priority: "Alta" },
  { id: 3, title: "Validación de diseño", completed: true, priority: "Media" },
  { id: 4, title: "Pruebas en diferentes dispositivos", completed: false, priority: "Media" },
  { id: 5, title: "Aprobación final del cliente", completed: false, priority: "Alta" },
]

export function QAChecklist() {
  const [internalItems, setInternalItems] = useState(internalQA)
  const [clientItems, setClientItems] = useState(clientQA)

  const getProgress = (items: QAItem[]) => {
    const completed = items.filter((item) => item.completed).length
    return Math.round((completed / items.length) * 100)
  }

  const toggleItem = (items: QAItem[], setItems: (items: QAItem[]) => void, id: number) => {
    setItems(items.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item)))
  }

  return (
    <Tabs defaultValue="internal" className="space-y-6">
      <TabsList>
        <TabsTrigger value="internal">QA Interno</TabsTrigger>
        <TabsTrigger value="client">QA Cliente</TabsTrigger>
      </TabsList>

      <TabsContent value="internal">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg text-[#0E0734]">Checklist QA Interno</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[#4514F9]">{getProgress(internalItems)}%</span>
              <span className="text-sm text-muted-foreground">completado</span>
            </div>
          </div>

          <div className="space-y-3">
            {internalItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={() => toggleItem(internalItems, setInternalItems, item.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {item.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-[#95C900]" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-300" />
                    )}
                    <p className={`font-medium ${item.completed ? "line-through text-gray-400" : "text-[#0E0734]"}`}>
                      {item.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <AlertTriangle
                      className={`h-3 w-3 ${item.priority === "Alta" ? "text-[#E02814]" : "text-[#F59E0B]"}`}
                    />
                    <span className="text-muted-foreground">Prioridad: {item.priority}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="client">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg text-[#0E0734]">Checklist QA Cliente</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[#4514F9]">{getProgress(clientItems)}%</span>
              <span className="text-sm text-muted-foreground">completado</span>
            </div>
          </div>

          <div className="space-y-3">
            {clientItems.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={() => toggleItem(clientItems, setClientItems, item.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {item.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-[#95C900]" />
                    ) : (
                      <Circle className="h-4 w-4 text-gray-300" />
                    )}
                    <p className={`font-medium ${item.completed ? "line-through text-gray-400" : "text-[#0E0734]"}`}>
                      {item.title}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <AlertTriangle
                      className={`h-3 w-3 ${item.priority === "Alta" ? "text-[#E02814]" : "text-[#F59E0B]"}`}
                    />
                    <span className="text-muted-foreground">Prioridad: {item.priority}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
