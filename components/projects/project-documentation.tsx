"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, ExternalLink, Calendar, Plus, X, Search, Filter } from "lucide-react"
import { useState } from "react"

const CATEGORIES = [
  { id: "all", name: "Todas", color: "bg-gray-100 text-gray-700" },
  { id: "administrative", name: "Administrativa", color: "bg-blue-100 text-blue-700" },
  { id: "client", name: "Cliente", color: "bg-green-100 text-green-700" },
  { id: "technical", name: "Técnica", color: "bg-purple-100 text-purple-700" },
  { id: "manuals", name: "Manuales", color: "bg-orange-100 text-orange-700" },
  { id: "legal", name: "Legal", color: "bg-red-100 text-red-700" },
]

const documents = [
  {
    id: 1,
    name: "Contrato de Servicios",
    type: "PDF",
    category: "administrative",
    version: "v2.0",
    lastModified: "2025-03-15",
    driveUrl: "https://drive.google.com/file/d/contract-123/view",
  },
  {
    id: 2,
    name: "Brief del Cliente",
    type: "DOC",
    category: "client",
    version: "v1.0",
    lastModified: "2025-03-10",
    driveUrl: "https://drive.google.com/file/d/brief-456/view",
  },
  {
    id: 3,
    name: "Arquitectura del Sistema",
    type: "PDF",
    category: "technical",
    version: "v3.1",
    lastModified: "2025-03-20",
    driveUrl: "https://drive.google.com/file/d/architecture-789/view",
  },
  {
    id: 4,
    name: "Manual de Usuario",
    type: "PDF",
    category: "manuals",
    version: "v1.2",
    lastModified: "2025-03-08",
    driveUrl: "https://drive.google.com/file/d/user-manual-012/view",
  },
  {
    id: 5,
    name: "NDA",
    type: "PDF",
    category: "legal",
    version: "v1.0",
    lastModified: "2025-02-28",
    driveUrl: "https://drive.google.com/file/d/nda-345/view",
  },
  {
    id: 6,
    name: "API Documentation",
    type: "Link",
    category: "technical",
    version: "v2.5",
    lastModified: "2025-03-18",
    driveUrl: "https://drive.google.com/file/d/api-docs-678/view",
  },
  {
    id: 7,
    name: "Cotización",
    type: "PDF",
    category: "administrative",
    version: "v1.0",
    lastModified: "2025-02-15",
    driveUrl: "https://drive.google.com/file/d/quote-901/view",
  },
  {
    id: 8,
    name: "Manual de Administrador",
    type: "PDF",
    category: "manuals",
    version: "v1.0",
    lastModified: "2025-03-12",
    driveUrl: "https://drive.google.com/file/d/admin-manual-234/view",
  },
]

export function ProjectDocumentation() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newDocName, setNewDocName] = useState("")
  const [newDocType, setNewDocType] = useState("")
  const [newDocCategory, setNewDocCategory] = useState("")
  const [newDocUrl, setNewDocUrl] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const handleAddDocument = () => {
    if (newDocName && newDocUrl && newDocCategory) {
      console.log("[v0] Adding document:", {
        name: newDocName,
        type: newDocType,
        category: newDocCategory,
        url: newDocUrl,
      })
      // TODO: Save to database
      setNewDocName("")
      setNewDocType("")
      setNewDocCategory("")
      setNewDocUrl("")
      setShowAddForm(false)
    }
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

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
            <Button onClick={handleAddDocument} className="w-full h-8 text-sm bg-[#4514F9] hover:bg-[#3810C7]">
              Guardar
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
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs flex-shrink-0 bg-transparent"
                    onClick={() => window.open(doc.driveUrl, "_blank")}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Abrir
                  </Button>
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
