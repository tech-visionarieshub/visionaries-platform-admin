"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { FileText, ExternalLink, Plus, X } from "lucide-react"
import { useState } from "react"

const documents = [
  {
    id: 1,
    name: "Brief del proyecto",
    required: true,
    uploaded: true,
    driveUrl: "https://drive.google.com/file/d/1abc123def456/view",
    uploadedBy: "Ana García",
    date: "2025-01-18",
  },
  {
    id: 2,
    name: "Identificación oficial",
    required: true,
    uploaded: true,
    driveUrl: "https://drive.google.com/file/d/2xyz789ghi012/view",
    uploadedBy: "Carlos Mendoza",
    date: "2025-01-17",
  },
  {
    id: 3,
    name: "Constancia fiscal",
    required: true,
    uploaded: false,
    driveUrl: null,
    uploadedBy: null,
    date: null,
  },
  {
    id: 4,
    name: "Contrato firmado",
    required: true,
    uploaded: false,
    driveUrl: null,
    uploadedBy: null,
    date: null,
  },
  {
    id: 5,
    name: "Comprobante de domicilio",
    required: false,
    uploaded: false,
    driveUrl: null,
    uploadedBy: null,
    date: null,
  },
]

export function LeadDocuments({ leadId }: { leadId: string }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newDocName, setNewDocName] = useState("")
  const [newDocUrl, setNewDocUrl] = useState("")

  const handleAddDocument = () => {
    if (newDocName && newDocUrl) {
      console.log("[v0] Adding document:", { name: newDocName, url: newDocUrl })
      // TODO: Save to database
      setNewDocName("")
      setNewDocUrl("")
      setShowAddForm(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Documentos</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Agrega links de Google Drive para los documentos requeridos
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          {showAddForm ? "Cancelar" : "Agregar documento"}
        </Button>
      </div>

      {showAddForm && (
        <Card className="p-4 mb-4 bg-muted/50">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Nombre del documento</label>
              <Input
                placeholder="Ej: Contrato firmado"
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Link de Google Drive</label>
              <Input
                placeholder="https://drive.google.com/file/d/..."
                value={newDocUrl}
                onChange={(e) => setNewDocUrl(e.target.value)}
              />
            </div>
            <Button onClick={handleAddDocument} className="w-full">
              Guardar documento
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <Checkbox checked={doc.uploaded} />
              <FileText className={`h-5 w-5 ${doc.uploaded ? "text-green-600" : "text-muted-foreground"}`} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{doc.name}</span>
                  {doc.required && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">Requerido</span>
                  )}
                </div>
                {doc.uploaded && doc.uploadedBy && (
                  <p className="text-sm text-muted-foreground">
                    Subido por {doc.uploadedBy} el {new Date(doc.date!).toLocaleDateString("es-MX")}
                  </p>
                )}
              </div>
            </div>
            {doc.uploaded && doc.driveUrl ? (
              <Button variant="outline" size="sm" onClick={() => window.open(doc.driveUrl!, "_blank")}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir en Drive
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar link
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
