"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, ExternalLink, Calendar, Plus, X, Search, Filter, Loader2, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { getIdToken } from "@/lib/firebase/visionaries-tech"

const CATEGORIES = [
  { id: "all", name: "Todas", color: "bg-gray-100 text-gray-700" },
  { id: "administrative", name: "Administrativa", color: "bg-blue-100 text-blue-700" },
  { id: "client", name: "Cliente", color: "bg-green-100 text-green-700" },
  { id: "technical", name: "Técnica", color: "bg-purple-100 text-purple-700" },
  { id: "manuals", name: "Manuales", color: "bg-orange-100 text-orange-700" },
  { id: "legal", name: "Legal", color: "bg-red-100 text-red-700" },
]

interface ProjectDocument {
  id: string
  name: string
  type: string
  category: 'administrative' | 'client' | 'technical' | 'manuals' | 'legal'
  version?: string
  lastModified: Date | string
  driveUrl: string
}

export function ProjectDocumentation() {
  const params = useParams()
  const projectId = params?.id as string
  
  const [documents, setDocuments] = useState<ProjectDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newDocName, setNewDocName] = useState("")
  const [newDocType, setNewDocType] = useState("")
  const [newDocCategory, setNewDocCategory] = useState("")
  const [newDocUrl, setNewDocUrl] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (projectId) {
      loadDocuments()
    }
  }, [projectId])

  const loadDocuments = async () => {
    if (!projectId) return
    
    setLoading(true)
    try {
      const token = await getIdToken()
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      const response = await fetch(`/api/projects/${projectId}/documents`, {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Error al cargar documentos")
      }

      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error: any) {
      console.error("Error loading documents:", error)
      toast.error("Error al cargar documentos")
    } finally {
      setLoading(false)
    }
  }

  const handleAddDocument = async () => {
    if (!newDocName || !newDocUrl || !newDocCategory) {
      toast.error("Por favor completa todos los campos requeridos")
      return
    }

    if (!projectId) return

    setSaving(true)
    try {
      const token = await getIdToken()
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      const response = await fetch(`/api/projects/${projectId}/documents`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
        name: newDocName,
        type: newDocType,
        category: newDocCategory,
          driveUrl: newDocUrl,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Error al crear documento")
      }

      toast.success("Documento agregado exitosamente")
      setNewDocName("")
      setNewDocType("")
      setNewDocCategory("")
      setNewDocUrl("")
      setShowAddForm(false)
      await loadDocuments()
    } catch (error: any) {
      console.error("Error adding document:", error)
      toast.error(error.message || "Error al agregar documento")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este documento?")) {
      return
    }

    if (!projectId) return

    setDeleting(documentId)
    try {
      const token = await getIdToken()
      if (!token) {
        throw new Error("No hay token de autenticación")
      }

      const response = await fetch(`/api/projects/${projectId}/documents/${documentId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Error al eliminar documento")
      }

      toast.success("Documento eliminado exitosamente")
      await loadDocuments()
    } catch (error: any) {
      console.error("Error deleting document:", error)
      toast.error(error.message || "Error al eliminar documento")
    } finally {
      setDeleting(null)
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#4514F9]" />
        </div>
      </Card>
    )
  }

  const documentsByCategory = CATEGORIES.filter((cat) => cat.id !== "all")
    .map((category) => ({
      ...category,
      docs: filteredDocuments.filter((doc) => doc.category === category.id),
    }))
    .filter((cat) => cat.docs.length > 0)

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-base text-[#0E0734]">Documentación</h3>
          <p className="text-xs text-muted-foreground">
            {filteredDocuments.length} documento{filteredDocuments.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button size="sm" className="bg-[#4514F9] hover:bg-[#3810C7]" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? <X className="h-3 w-3 mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
          {showAddForm ? "Cancelar" : "Agregar"}
        </Button>
      </div>

      {showAddForm && (
        <Card className="p-3 mb-3 bg-muted/50">
          <div className="space-y-2">
            <Input
              placeholder="Nombre del documento"
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              className="h-8 text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Tipo (PDF, DOC...)"
                value={newDocType}
                onChange={(e) => setNewDocType(e.target.value)}
                className="h-8 text-sm"
              />
              <Select value={newDocCategory} onValueChange={setNewDocCategory}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder="Link de Google Drive"
              value={newDocUrl}
              onChange={(e) => setNewDocUrl(e.target.value)}
              className="h-8 text-sm"
            />
            <Button 
              onClick={handleAddDocument} 
              disabled={saving}
              className="w-full h-8 text-sm bg-[#4514F9] hover:bg-[#3810C7]"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </div>
        </Card>
      )}

      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Buscar documentos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-sm pl-7"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="h-8 w-[140px] text-sm">
            <Filter className="h-3 w-3 mr-1" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {documentsByCategory.map((category) => (
          <div key={category.id}>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${category.color} text-xs px-2 py-0`}>{category.name}</Badge>
              <span className="text-xs text-muted-foreground">
                {category.docs.length} documento{category.docs.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-1">
              {category.docs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 text-sm"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="h-4 w-4 text-[#4514F9] flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[#0E0734] truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{doc.type}</span>
                        <span>•</span>
                        <span>{doc.version}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(doc.lastModified).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs flex-shrink-0 bg-transparent"
                    onClick={() => window.open(doc.driveUrl, "_blank")}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Abrir
                  </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 text-xs flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteDocument(doc.id)}
                      disabled={deleting === doc.id}
                    >
                      {deleting === doc.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No se encontraron documentos</p>
        </div>
      )}
    </Card>
  )
}
