"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import { getClientes } from "@/lib/api/finanzas-api"
import { createProject } from "@/lib/api/projects-api"
import { getCurrentUser } from "@/lib/firebase/visionaries-tech"
import { useUser } from "@/hooks/use-user"

export default function NewProjectPage() {
  const router = useRouter()
  const { user } = useUser()
  const [clientes, setClientes] = useState<Array<{ id: string; nombre: string }>>([])
  const [loading, setLoading] = useState(false)
  const [loadingClientes, setLoadingClientes] = useState(true)
  const [currentUserName, setCurrentUserName] = useState<string>("")

  useEffect(() => {
    async function loadClientes() {
      try {
        const data = await getClientes()
        setClientes(data.map(c => ({ id: c.id, nombre: c.empresa })))
      } catch (err: any) {
        // Si es error de autenticación, no hacer nada (ya redirige)
        if (err.name === 'AuthenticationError' || err.message?.includes('authentication')) {
          return
        }
        console.error('Error loading clientes:', err)
      } finally {
        setLoadingClientes(false)
      }
    }
    loadClientes()
  }, [])

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        if (user?.name) {
          setCurrentUserName(user.name)
          if (!formData.responsible) {
            setFormData(prev => ({ ...prev, responsible: user.name }))
          }
        } else {
          const currentUser = getCurrentUser()
          if (currentUser) {
            const tokenResult = await currentUser.getIdTokenResult(true)
            const displayName = currentUser.displayName || tokenResult.claims.name as string || currentUser.email?.split('@')[0] || 'Usuario'
            setCurrentUserName(displayName)
            // Pre-seleccionar el usuario actual como responsable
            if (!formData.responsible) {
              setFormData(prev => ({ ...prev, responsible: displayName }))
            }
          }
        }
      } catch (error) {
        console.error('Error loading current user:', error)
      }
    }
    loadCurrentUser()
  }, [user])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    clientId: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    budget: "",
    features: "",
    responsible: "",
    cotizacionId: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const cliente = clientes.find((c) => c.id === formData.clientId)

      const newProject = await createProject({
        name: formData.name,
        description: formData.description,
        client: cliente?.nombre || "",
        clientId: formData.clientId,
        status: "En desarrollo" as const,
        progress: 0,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budget: Number.parseFloat(formData.budget) || 0,
        hoursEstimated: 0,
        hoursWorked: 0,
        features: Number.parseInt(formData.features) || 0,
        completedFeatures: 0,
        responsible: formData.responsible,
        cotizacionId: formData.cotizacionId || undefined,
      })

      router.push(`/projects/${newProject.id}`)
    } catch (error: any) {
      console.error('Error creating project:', error)
      alert('Error al crear el proyecto: ' + (error.message || 'Error desconocido'))
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
          <h1 className="text-3xl font-bold text-[#0E0734]">Nuevo Proyecto</h1>
          <p className="text-muted-foreground mt-1">Crear un nuevo proyecto en la plataforma</p>
        </div>
      </div>

      {/* Form */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[#0E0734]">Información Básica</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Proyecto *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Sistema de Gestión ERP"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientId">Cliente *</Label>
                <Select
                  required
                  value={formData.clientId}
                  onValueChange={(value) => setFormData({ ...formData, clientId: value })}
                >
                  <SelectTrigger id="clientId">
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe brevemente el proyecto..."
                rows={3}
              />
            </div>
          </div>

          {/* Fechas y Presupuesto */}
          <div className="space-y-4 pt-6 border-t">
            <h2 className="text-lg font-semibold text-[#0E0734]">Fechas y Presupuesto</h2>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="startDate">Fecha de Inicio *</Label>
                <Input
                  id="startDate"
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Fecha de Entrega *</Label>
                <Input
                  id="endDate"
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Presupuesto (MXN) *</Label>
                <Input
                  id="budget"
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Equipo y Alcance */}
          <div className="space-y-4 pt-6 border-t">
            <h2 className="text-lg font-semibold text-[#0E0734]">Equipo y Alcance</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="responsible">Responsable *</Label>
                <Input
                  id="responsible"
                  value={formData.responsible}
                  onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                  placeholder="Nombre del responsable"
                  required
                />
                {currentUserName && (
                  <p className="text-xs text-muted-foreground">
                    Usuario actual: {currentUserName}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="features">Número de Funcionalidades</Label>
                <Input
                  id="features"
                  type="number"
                  min="0"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cotizacionId">ID de Cotización (opcional)</Label>
              <Input
                id="cotizacionId"
                value={formData.cotizacionId}
                onChange={(e) => setFormData({ ...formData, cotizacionId: e.target.value })}
                placeholder="Si viene de una cotización, ingresa el ID"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t">
            <Link href="/projects" className="flex-1">
              <Button type="button" variant="outline" className="w-full bg-transparent">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={loading} className="flex-1 bg-[#4514F9] hover:bg-[#3810C7]">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Crear Proyecto
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
