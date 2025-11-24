"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Upload, FileText, Loader2, Sparkles } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getIdToken } from "@/lib/firebase/visionaries-tech"

export default function NewProjectFromDocumentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"upload" | "paste">("upload")
  const [file, setFile] = useState<File | null>(null)
  const [pastedText, setPastedText] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    responsible: "",
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      if (selectedFile.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
          selectedFile.name.endsWith('.docx')) {
        setFile(selectedFile)
      } else {
        toast({
          title: "Formato no válido",
          description: "Por favor, sube un archivo .docx",
          variant: "destructive",
        })
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let documentContent = ""

      // Obtener token de autenticación
      const token = await getIdToken()
      if (!token) {
        throw new Error("No hay token de autenticación disponible. Por favor, inicia sesión nuevamente.")
      }

      if (activeTab === "upload" && file) {
        // Leer el contenido del archivo
        const formDataFile = new FormData()
        formDataFile.append("file", file)
        
        const response = await fetch("/api/projects/parse-document", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: formDataFile,
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Error procesando el documento")
        }

        const data = await response.json()
        documentContent = data.content
      } else if (activeTab === "paste" && pastedText.trim()) {
        documentContent = pastedText
      } else {
        throw new Error("Por favor, sube un archivo o pega el contenido del documento")
      }

      if (!documentContent.trim()) {
        throw new Error("El documento está vacío")
      }

      // Generar proyecto desde el documento con IA
      const generateResponse = await fetch("/api/projects/generate-from-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          documentContent,
          projectName: formData.name || undefined,
          description: formData.description || undefined,
          startDate: formData.startDate,
          responsible: formData.responsible || undefined,
        }),
      })

      if (!generateResponse.ok) {
        const error = await generateResponse.json()
        throw new Error(error.error || "Error generando el proyecto")
      }

      const result = await generateResponse.json()
      const project = result.data.project

      toast({
        title: "Proyecto creado exitosamente",
        description: `Proyecto "${project.name}" creado con ${result.data.featuresCount || 0} funcionalidades`,
      })

      router.push(`/projects/${project.id}`)
    } catch (error: any) {
      console.error("Error creating project:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el proyecto",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Crear Proyecto desde Documento</h1>
          <p className="text-muted-foreground">
            Sube un documento Word o pega el contenido para generar un proyecto completo con IA
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Documento de Cotización</CardTitle>
            <CardDescription>
              Sube un archivo .docx o pega el contenido del documento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "upload" | "paste")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Archivo
                </TabsTrigger>
                <TabsTrigger value="paste">
                  <FileText className="h-4 w-4 mr-2" />
                  Pegar Texto
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">Archivo Word (.docx)</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                  {file && (
                    <p className="text-sm text-muted-foreground">
                      Archivo seleccionado: {file.name}
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="paste" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pastedText">Contenido del Documento</Label>
                  <Textarea
                    id="pastedText"
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Pega aquí el contenido completo del documento de cotización..."
                    rows={15}
                    disabled={loading}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Pega todo el contenido del documento. La IA extraerá automáticamente la información relevante.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información del Proyecto (Opcional)</CardTitle>
            <CardDescription>
              Puedes personalizar estos campos o dejar que la IA los genere desde el documento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Proyecto</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Dejar vacío para que la IA lo genere desde el documento"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Dejar vacío para que la IA genere una descripción profesional desde el documento"
                rows={4}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de Inicio</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsible">Responsable</Label>
                <Input
                  id="responsible"
                  value={formData.responsible}
                  onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                  placeholder="Dejar vacío para usar tu usuario"
                  disabled={loading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Link href="/projects">
            <Button type="button" variant="outline" disabled={loading}>
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={loading || (!file && !pastedText.trim())} className="bg-[#4514F9] hover:bg-[#3810C7]">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generando proyecto con IA...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generar Proyecto con IA
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

