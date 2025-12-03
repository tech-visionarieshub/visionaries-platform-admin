"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertCircle, Info } from "lucide-react"

interface PriorityInfoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PriorityInfoDialog({ open, onOpenChange }: PriorityInfoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-[#4514F9]" />
            Cómo Priorizar Tareas y Funcionalidades
          </DialogTitle>
          <DialogDescription>
            Guía para determinar la prioridad correcta de tus tareas
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="p-4 rounded-lg border border-red-200 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 mb-1">Alta</h4>
                <p className="text-sm text-red-800">
                  Si no lo haces hoy o en la fecha establecida, pasa algo malo (afecta pagos, clientes o plazos).
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-900 mb-1">Media</h4>
                <p className="text-sm text-yellow-800">
                  Importa, pero si lo mueves un día no pasa nada.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-blue-200 bg-blue-50">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Baja</h4>
                <p className="text-sm text-blue-800">
                  Pregunta: "Si no lo hago… ¿importa?" Si no, es baja. Es opcional.
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border-2 border-[#4514F9] bg-[#4514F9]/5">
            <h4 className="font-semibold text-[#0E0734] mb-2">Regla Rápida</h4>
            <p className="text-sm text-[#0E0734]">
              ¿Qué pasa si no lo hago hoy?
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[#0E0734]">
              <li>• <strong>Grave</strong> = Alta</li>
              <li>• <strong>Molesto</strong> = Media</li>
              <li>• <strong>Nada</strong> = Baja</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

