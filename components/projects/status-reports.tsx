"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Send, Eye, Clock, ExternalLink, Mail } from "lucide-react"
import { toast } from "sonner"

// Mock data
const mockReports = [
  {
    id: 1,
    date: "2025-01-28",
    subject: "Reporte Semanal - Semana 4",
    status: "Enviado",
    openRate: 85,
    previewUrl: "https://preview-abc123.web.app",
    sentTo: "cliente@techstore.com",
  },
  {
    id: 2,
    date: "2025-01-21",
    subject: "Reporte Semanal - Semana 3",
    status: "Enviado",
    openRate: 92,
    previewUrl: "https://preview-def456.web.app",
    sentTo: "cliente@techstore.com",
  },
  {
    id: 3,
    date: "2025-01-14",
    subject: "Reporte Semanal - Semana 2",
    status: "Enviado",
    openRate: 78,
    previewUrl: null,
    sentTo: "cliente@techstore.com",
  },
]

export function StatusReports() {
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [creatingPreview, setCreatingPreview] = useState(false)
  const [generatedReport, setGeneratedReport] = useState("")
  const [subject, setSubject] = useState("")
  const [previewUrl, setPreviewUrl] = useState("")

  const handleGenerateReport = async () => {
    setGenerating(true)
    // Simulate AI generation
    await new Promise((r) => setTimeout(r, 2000))

    const report = `# Reporte de Progreso - Semana 4

## Resumen Ejecutivo
Durante esta semana, el equipo ha completado 8 tasks del backlog, enfocándose principalmente en el módulo de carrito de compras y la integración de la pasarela de pagos.

## Progreso General
- **Completado:** 65% del proyecto
- **Tasks completadas:** 8/12 esta semana
- **Commits:** 47 commits en GitHub
- **Horas trabajadas:** 156 horas

## Logros Principales
1. ✅ Carrito de compras funcional con persistencia
2. ✅ Integración con Stripe completada
3. ✅ Sistema de notificaciones por email
4. ✅ Tests unitarios para módulo de pagos

## En Progreso
- Panel administrativo (75% completado)
- Sistema de reportes (40% completado)

## Próximos Pasos
- Finalizar panel administrativo
- Iniciar fase de QA
- Preparar documentación técnica

## Métricas
- Velocity: 8 story points/semana
- Code coverage: 82%
- Bugs reportados: 3 (todos resueltos)

¿Tienes alguna pregunta o comentario sobre el progreso?`

    setGeneratedReport(report)
    setSubject(`Reporte Semanal - ${new Date().toLocaleDateString("es-ES", { month: "long", day: "numeric" })}`)
    setGenerating(false)
    toast.success("Reporte generado con IA")
  }

  const handleCreatePreview = async () => {
    setCreatingPreview(true)
    // Simulate Firebase Hosting deployment
    await new Promise((r) => setTimeout(r, 1500))

    const mockUrl = `https://preview-${Math.random().toString(36).substring(7)}.web.app`
    setPreviewUrl(mockUrl)
    setCreatingPreview(false)
    toast.success("Preview deployment creado (expira en 7 días)")
  }

  const handleSendReport = async () => {
    setSending(true)
    // Simulate Brevo email send
    await new Promise((r) => setTimeout(r, 1500))

    setSending(false)
    toast.success("Reporte enviado exitosamente")
    setGeneratedReport("")
    setSubject("")
    setPreviewUrl("")
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[#0E0734]">Status Reports para Cliente</h3>
            <p className="text-sm text-muted-foreground">Genera reportes automáticos con IA y envíalos al cliente</p>
          </div>
          <Button onClick={handleGenerateReport} disabled={generating} className="bg-[#4514F9] hover:bg-[#3810C7]">
            <Sparkles className="mr-2 h-4 w-4" />
            {generating ? "Generando..." : "Generar con IA"}
          </Button>
        </div>
      </Card>

      {/* Generated Report Editor */}
      {generatedReport && (
        <Card className="p-4">
          <Tabs defaultValue="edit" className="space-y-4">
            <TabsList>
              <TabsTrigger value="edit">Editar</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Asunto del Email</label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Asunto del reporte" />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Contenido del Reporte</label>
                <Textarea
                  value={generatedReport}
                  onChange={(e) => setGeneratedReport(e.target.value)}
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleCreatePreview}
                  disabled={creatingPreview}
                  variant="outline"
                  className="flex-1 bg-transparent"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {creatingPreview ? "Creando..." : "Crear Preview Deployment"}
                </Button>
                <Button
                  onClick={handleSendReport}
                  disabled={sending}
                  className="flex-1 bg-[#4514F9] hover:bg-[#3810C7]"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {sending ? "Enviando..." : "Enviar al Cliente"}
                </Button>
              </div>

              {previewUrl && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <ExternalLink className="h-4 w-4 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">Preview Deployment Creado</p>
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {previewUrl}
                    </a>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Expira en 7 días
                  </Badge>
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview">
              <Card className="p-6 bg-white">
                <div className="prose prose-sm max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: generatedReport.replace(/\n/g, "<br />") }} />
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {/* History */}
      <Card className="p-4">
        <h4 className="font-semibold text-[#0E0734] mb-3">Historial de Reportes</h4>
        <div className="space-y-2">
          {mockReports.map((report) => (
            <div key={report.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm">{report.subject}</p>
                  <Badge variant={report.status === "Enviado" ? "default" : "secondary"} className="text-xs">
                    {report.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(report.date).toLocaleDateString("es-ES")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {report.sentTo}
                  </span>
                  {report.openRate && (
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {report.openRate}% abierto
                    </span>
                  )}
                </div>
              </div>
              {report.previewUrl && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={report.previewUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
