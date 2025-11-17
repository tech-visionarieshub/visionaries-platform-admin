"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowLeft, Shield, Mail } from "lucide-react"

export default function UnauthorizedPage() {
  const handleGoToAura = () => {
    window.location.href = "https://aura.visionarieshub.com"
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Acceso No Autorizado</CardTitle>
          <CardDescription>
            No tienes permiso para acceder a esta plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-3 text-sm text-muted-foreground bg-amber-50 p-4 rounded-lg border border-amber-200">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <p>
                El Portal Admin solo está disponible para usuarios autorizados con acceso interno.
              </p>
              <p>
                Si necesitas acceso a esta plataforma, por favor contacta al administrador.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              className="w-full" 
              onClick={handleGoToAura}
              size="lg"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Aura
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                ¿Necesitas acceso?
              </p>
              <a 
                href="mailto:adminplatform@visionarieshub.com?subject=Solicitud de acceso al Portal Admin"
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
              >
                <Mail className="h-4 w-4" />
                Contactar al administrador
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
