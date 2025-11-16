"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Plus } from "lucide-react"
import { useState } from "react"

const notes = [
  {
    id: 1,
    content:
      "Cliente muy interesado en integración con sistemas existentes. Mencionó que tienen un ERP legacy que necesita conectarse.",
    author: "Ana García",
    date: "2025-01-20 15:45",
    isPrivate: true,
  },
  {
    id: 2,
    content: "Presupuesto aprobado por dirección. Esperan comenzar en febrero. Prioridad alta para Q1.",
    author: "Ana García",
    date: "2025-01-18 11:20",
    isPrivate: true,
  },
  {
    id: 3,
    content: "Primera llamada muy positiva. Carlos es el CTO y tiene poder de decisión. Equipo técnico de 5 personas.",
    author: "Ana García",
    date: "2025-01-16 09:30",
    isPrivate: true,
  },
]

export function LeadNotes({ leadId }: { leadId: string }) {
  const [isAdding, setIsAdding] = useState(false)

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Notas Internas</h3>
        <Button onClick={() => setIsAdding(!isAdding)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva nota
        </Button>
      </div>

      {isAdding && (
        <div className="mb-6 p-4 border border-border rounded-lg bg-muted/30">
          <Textarea placeholder="Escribe una nota interna sobre este lead..." className="mb-3" rows={4} />
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAdding(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setIsAdding(false)}>Guardar nota</Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {notes.map((note) => (
          <div key={note.id} className="p-4 border border-border rounded-lg bg-white">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground mb-2">{note.content}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-medium">{note.author}</span>
                  <span>•</span>
                  <span>{note.date}</span>
                  {note.isPrivate && (
                    <>
                      <span>•</span>
                      <span className="text-yellow-600">Privada</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
