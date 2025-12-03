"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ProjectStatus } from "@/lib/mock-data/projects"

interface StatusInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const statusDescriptions: Record<ProjectStatus, string> = {
  "lead": "El cliente ha mostrado interés pero aún no ha confirmado que quiere avanzar.",
  "Onboarding": "El cliente ya aceptó avanzar y estamos recopilando información básica para iniciar.",
  "Mapeo de procesos": "Estamos documentando cómo funciona actualmente el cliente y cómo debería funcionar para poder diseñar el sistema o servicio.",
  "Lista de funcionalidades": "Estamos definiendo qué debe incluir el proyecto: alcance, requisitos y características.",
  "Planificación": "Estamos organizando tiempos, recursos, tareas y el orden del trabajo.",
  "Kickoff": "Inicio formal del proyecto: se confirma qué se hará, cómo se hará y quién hará qué.",
  "En ejecución": "El equipo está realizando las tareas definidas y avanzando en el proyecto.",
  "En espera": "No podemos avanzar hasta recibir información, aprobaciones o materiales de otra parte.",
  "Bloqueado": "No es posible continuar debido a un impedimento crítico que debe resolverse antes de seguir.",
  "Revisión interna": "Estamos validando nosotros mismos la calidad del trabajo antes de enviarlo al cliente.",
  "Revisión cliente": "El cliente está revisando lo entregado para aprobar o solicitar ajustes.",
  "Carta de aceptación": "El cliente revisó y aceptó formalmente el trabajo realizado.",
  "Último pago pendiente": "Proyecto terminado a nivel operativo, pero aún estamos esperando el pago final.",
  "Entregado": "Enviamos el material final que corresponde a esta etapa del proyecto.",
  "En-garantía": "El proyecto está entregado y aprobado; solo atendemos ajustes o correcciones pactadas.",
  "Finalizado": "Todo está completo: entregas, aprobaciones y pagos. El proyecto se cierra oficialmente.",
}

const statusColors: Record<ProjectStatus, { bg: string; text: string }> = {
  "lead": { bg: "bg-gray-100", text: "text-gray-700" },
  "Onboarding": { bg: "bg-blue-100", text: "text-blue-700" },
  "Mapeo de procesos": { bg: "bg-blue-200", text: "text-blue-800" },
  "Lista de funcionalidades": { bg: "bg-indigo-100", text: "text-indigo-700" },
  "Planificación": { bg: "bg-purple-100", text: "text-purple-700" },
  "Kickoff": { bg: "bg-purple-200", text: "text-purple-800" },
  "En ejecución": { bg: "bg-green-100", text: "text-green-700" },
  "En espera": { bg: "bg-yellow-100", text: "text-yellow-700" },
  "Bloqueado": { bg: "bg-red-100", text: "text-red-700" },
  "Revisión interna": { bg: "bg-orange-100", text: "text-orange-700" },
  "Revisión cliente": { bg: "bg-amber-100", text: "text-amber-700" },
  "Carta de aceptación": { bg: "bg-emerald-100", text: "text-emerald-700" },
  "Último pago pendiente": { bg: "bg-yellow-200", text: "text-yellow-800" },
  "Entregado": { bg: "bg-green-200", text: "text-green-800" },
  "En-garantía": { bg: "bg-teal-100", text: "text-teal-700" },
  "Finalizado": { bg: "bg-gray-200", text: "text-gray-800" },
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

export function StatusInfoDialog({ open, onOpenChange }: StatusInfoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Guía de Status de Proyectos</DialogTitle>
          <DialogDescription>
            Información sobre cuándo usar cada status en un proyecto
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {allStatuses.map((status) => {
            const colorConfig = statusColors[status]
            return (
              <div
                key={status}
                className={`p-4 rounded-lg border ${colorConfig.bg} ${colorConfig.text} border-opacity-50`}
              >
                <h4 className="font-semibold mb-1">{status}</h4>
                <p className="text-sm opacity-90">{statusDescriptions[status]}</p>
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

