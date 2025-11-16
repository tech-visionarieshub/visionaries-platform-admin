"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ConvertToProjectDialog } from "./convert-to-project-dialog"
import { CheckCircle } from "lucide-react"

type ConvertToProjectButtonProps = {
  cotizacion: any
  allowWithoutSignature?: boolean
}

export function ConvertToProjectButton({ cotizacion, allowWithoutSignature = false }: ConvertToProjectButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const showSignatureWarning = allowWithoutSignature && cotizacion.estado === "Aceptada"

  return (
    <>
      <Button onClick={() => setDialogOpen(true)}>
        <CheckCircle className="h-4 w-4 mr-2" />
        Convertir a Proyecto
      </Button>
      <ConvertToProjectDialog
        cotizacion={cotizacion}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        showSignatureWarning={showSignatureWarning}
      />
    </>
  )
}
