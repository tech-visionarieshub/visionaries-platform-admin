"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles, Send, Eye, Clock, ExternalLink, Mail, Loader2, AlertCircle, Languages, Trash2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { getIdToken } from "@/lib/firebase/visionaries-tech"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

interface StatusReport {
  id: string
  projectId: string
  weekStartDate: string
  weekEndDate: string
  subject: string
  content: string
  status: 'draft' | 'sent'
  sentTo?: string
  sentAt?: string
  previewUrl?: string
  openRate?: number
  createdAt: string
  updatedAt: string
  createdBy: string
}

export function StatusReports() {
  const params = useParams()
  const projectId = params?.id as string
  
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [creatingPreview, setCreatingPreview] = useState(false)
  const [generatedReport, setGeneratedReport] = useState("")
  const [subject, setSubject] = useState("")
  const [previewUrl, setPreviewUrl] = useState("")
  const [currentReportId, setCurrentReportId] = useState<string | null>(null)
  const [reports, setReports] = useState<StatusReport[]>([])
  const [sentTo, setSentTo] = useState("")
  const [showLanguageDialog, setShowLanguageDialog] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<"es" | "en">("es")

  useEffect(() => {
    loadReports()
  }, [projectId])

  const loadReports = async () => {
    if (!projectId) return
    
    setLoading(true)
    try {
      const token = await getIdToken()
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      const response = await fetch(`/api/projects/${projectId}/status`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al cargar reportes")
      }

      const data = await response.json()
      setReports(data.reports || [])
    } catch (error: any) {
      console.error("Error loading reports:", error)
      toast.error("Error al cargar reportes")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateClick = () => {
    setShowLanguageDialog(true)
  }

  const handleGenerateReport = async () => {
    if (!projectId) return

    setShowLanguageDialog(false)
    setGenerating(true)
    try {
      const token = await getIdToken()
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      const response = await fetch(`/api/projects/${projectId}/status/generate`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: selectedLanguage,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Error al generar reporte")
      }

      const data = await response.json()
      setGeneratedReport(data.report.content)
      setSubject(data.report.subject)
      setCurrentReportId(null) // Nuevo reporte, no tiene ID aún
      
      toast.success(selectedLanguage === "es" ? "Reporte generado con IA" : "Report generated with AI")
    } catch (error: any) {
      console.error("Error generating report:", error)
      toast.error(error.message || "Error al generar reporte. Verifica que OpenAI esté configurado en Settings.")
    } finally {
      setGenerating(false)
    }
  }

  const handleLoadDraft = async (report: StatusReport) => {
    if (report.status !== 'draft') {
      toast.error("Solo se pueden editar los drafts")
      return
    }

    try {
      const token = await getIdToken()
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      // Limpiar el editor antes de cargar el nuevo draft
      setGeneratedReport("")
      setSubject("")
      setSentTo("")
      setCurrentReportId(null)
      setPreviewUrl("")

      const response = await fetch(`/api/projects/${projectId}/status/${report.id}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al cargar draft")
      }

      const data = await response.json()
      setGeneratedReport(data.report.content)
      setSubject(data.report.subject)
      setSentTo(data.report.sentTo || "")
      setCurrentReportId(data.report.id)
      setPreviewUrl(data.report.previewUrl || "")

      // Scroll al editor
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      toast.success("Draft cargado para edición")
    } catch (error: any) {
      console.error("Error loading draft:", error)
      toast.error(error.message || "Error al cargar draft")
    }
  }

  const handleMarkAsSent = async (report: StatusReport) => {
    if (report.status === 'sent') {
      toast.error("Este reporte ya está marcado como enviado")
      return
    }

    if (!confirm(`¿Marcar el reporte "${report.subject}" como enviado?`)) {
      return
    }

    try {
      const token = await getIdToken()
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      const response = await fetch(`/api/projects/${projectId}/status/${report.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: 'sent',
          sentAt: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Error al marcar como enviado")
      }

      toast.success("Reporte marcado como enviado")
      
      // Si el reporte marcado como enviado era el que estaba editando, limpiar el editor
      if (currentReportId === report.id) {
        setGeneratedReport("")
        setSubject("")
        setSentTo("")
        setCurrentReportId(null)
        setPreviewUrl("")
      }
      
      await loadReports()
    } catch (error: any) {
      console.error("Error marking as sent:", error)
      toast.error(error.message || "Error al marcar como enviado")
    }
  }

  const handleDeleteDraft = async (report: StatusReport) => {
    if (report.status === 'sent') {
      toast.error("No se pueden borrar reportes enviados")
      return
    }

    if (!confirm(`¿Estás seguro de que deseas borrar el draft "${report.subject}"?`)) {
      return
    }

    try {
      const token = await getIdToken()
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      const response = await fetch(`/api/projects/${projectId}/status/${report.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Error al borrar draft")
      }

      toast.success("Draft borrado exitosamente")
      
      // Si el draft borrado era el que estaba editando, limpiar el editor
      if (currentReportId === report.id) {
        setGeneratedReport("")
        setSubject("")
        setSentTo("")
        setCurrentReportId(null)
        setPreviewUrl("")
      }
      
      await loadReports()
    } catch (error: any) {
      console.error("Error deleting draft:", error)
      toast.error(error.message || "Error al borrar draft")
    }
  }

  const handleSaveDraft = async () => {
    if (!projectId || !subject || !generatedReport) {
      toast.error("Por favor completa el asunto y el contenido del reporte")
      return
    }

    setSaving(true)
    try {
      const token = await getIdToken()
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      const weekEndDate = new Date()
      const weekStartDate = new Date()
      weekStartDate.setDate(weekStartDate.getDate() - 7)

      const url = currentReportId
        ? `/api/projects/${projectId}/status/${currentReportId}`
        : `/api/projects/${projectId}/status`

      const method = currentReportId ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          content: generatedReport,
          weekStartDate: weekStartDate.toISOString(),
          weekEndDate: weekEndDate.toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Error al guardar reporte")
      }

      const data = await response.json()
      setCurrentReportId(data.report.id)
      toast.success("Draft guardado exitosamente")
      await loadReports()
    } catch (error: any) {
      console.error("Error saving draft:", error)
      toast.error(error.message || "Error al guardar draft")
    } finally {
      setSaving(false)
    }
  }

  const handleCreatePreview = async () => {
    setCreatingPreview(true)
    // TODO: Implementar creación de preview deployment
    await new Promise((r) => setTimeout(r, 1500))

    const mockUrl = `https://preview-${Math.random().toString(36).substring(7)}.web.app`
    setPreviewUrl(mockUrl)
    setCreatingPreview(false)
    toast.success("Preview deployment creado (expira en 7 días)")
  }

  const handleSendReport = async () => {
    if (!projectId || !subject || !generatedReport) {
      toast.error("Por favor completa el asunto y el contenido del reporte")
      return
    }

    if (!sentTo) {
      toast.error("Por favor ingresa el email del destinatario")
      return
    }

    // Primero guardar si no tiene ID
    if (!currentReportId) {
      await handleSaveDraft()
      // Esperar un momento para que se guarde
      await new Promise((r) => setTimeout(r, 500))
    }

    setSending(true)
    try {
      const token = await getIdToken()
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      const reportIdToSend = currentReportId
      if (!reportIdToSend) {
        throw new Error("Error: No se pudo obtener el ID del reporte")
      }

      const response = await fetch(`/api/projects/${projectId}/status/${reportIdToSend}/send`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sentTo,
          previewUrl: previewUrl || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Error al enviar reporte")
      }

    toast.success("Reporte enviado exitosamente")
    setGeneratedReport("")
    setSubject("")
    setPreviewUrl("")
      setSentTo("")
      setCurrentReportId(null)
      await loadReports()
    } catch (error: any) {
      console.error("Error sending report:", error)
      toast.error(error.message || "Error al enviar reporte")
    } finally {
      setSending(false)
    }
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
          <Button 
            onClick={handleGenerateClick} 
            disabled={generating} 
            className="bg-[#4514F9] hover:bg-[#3810C7]"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
            <Sparkles className="mr-2 h-4 w-4" />
                Generar con IA
              </>
            )}
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
                <Input 
                  value={subject} 
                  onChange={(e) => setSubject(e.target.value)} 
                  placeholder="Asunto del reporte" 
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Email del Destinatario</label>
                <Input 
                  value={sentTo} 
                  onChange={(e) => setSentTo(e.target.value)} 
                  placeholder="cliente@ejemplo.com" 
                  type="email"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Contenido del Reporte</label>
                <Textarea
                  value={generatedReport}
                  onChange={(e) => setGeneratedReport(e.target.value)}
                  rows={15}
                  className="font-mono text-sm"
                  readOnly={false}
                  disabled={false}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSaveDraft}
                  disabled={saving}
                  variant="outline"
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Draft"
                  )}
                </Button>
                <Button
                  onClick={handleCreatePreview}
                  disabled={creatingPreview}
                  variant="outline"
                  className="flex-1 bg-transparent"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {creatingPreview ? "Creando..." : "Crear Preview"}
                </Button>
                <Button
                  onClick={handleSendReport}
                  disabled={sending || !sentTo}
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
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {generatedReport}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </Card>
      )}

      {/* History */}
      <Card className="p-4">
        <h4 className="font-semibold text-[#0E0734] mb-3">Historial de Reportes</h4>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#4514F9]" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No hay reportes enviados</p>
            <p className="text-sm mt-1">Genera tu primer reporte usando el botón de arriba</p>
          </div>
        ) : (
        <div className="space-y-2">
            {reports.map((report) => (
            <div key={report.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm">{report.subject}</p>
                    <Badge variant={report.status === "sent" ? "default" : "secondary"} className="text-xs">
                      {report.status === "sent" ? "Enviado" : "Draft"}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                      {new Date(report.weekStartDate).toLocaleDateString("es-ES")} - {new Date(report.weekEndDate).toLocaleDateString("es-ES")}
                  </span>
                    {report.sentTo && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {report.sentTo}
                  </span>
                    )}
                  {report.openRate && (
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {report.openRate}% abierto
                    </span>
                  )}
                </div>
              </div>
                <div className="flex items-center gap-2">
                  {report.status === 'draft' && (
                    <>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleLoadDraft(report)}
                      >
                        Editar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleMarkAsSent(report)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Marcar como Enviado
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteDraft(report)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
              {report.previewUrl && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={report.previewUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
                </div>
            </div>
          ))}
        </div>
        )}
      </Card>

      {/* Dialog para seleccionar idioma */}
      <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Seleccionar Idioma del Reporte</DialogTitle>
            <DialogDescription>
              Elige el idioma en el que deseas generar el reporte de status
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup value={selectedLanguage} onValueChange={(value) => setSelectedLanguage(value as "es" | "en")}>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="es" id="es" />
                <Label htmlFor="es" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🇪🇸</span>
                    <div>
                      <p className="font-medium">Español</p>
                      <p className="text-sm text-muted-foreground">Reporte en español</p>
                    </div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="en" id="en" />
                <Label htmlFor="en" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🇺🇸</span>
                    <div>
                      <p className="font-medium">English</p>
                      <p className="text-sm text-muted-foreground">Report in English</p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLanguageDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerateReport} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generar Reporte
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
