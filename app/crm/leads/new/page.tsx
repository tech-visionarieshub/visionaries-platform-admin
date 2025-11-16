"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

export default function NewLeadPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Redirect to kanban after creation
    router.push("/crm/kanban")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <PageHeader title="Nuevo Lead" description="Registra un nuevo lead en el sistema" />
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información de Contacto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información de Contacto</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del Contacto *</Label>
                <Input id="name" name="name" placeholder="Ej: Juan Pérez" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Empresa *</Label>
                <Input id="company" name="company" placeholder="Ej: Tech Solutions SA" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" placeholder="contacto@empresa.com" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" name="phone" type="tel" placeholder="+52 81 1234 5678" />
              </div>
            </div>
          </div>

          {/* Información del Lead */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Información del Lead</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="source">Origen del Lead *</Label>
                <Select name="source" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el origen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Sitio Web</SelectItem>
                    <SelectItem value="referral">Referido</SelectItem>
                    <SelectItem value="social">Redes Sociales</SelectItem>
                    <SelectItem value="email">Email Marketing</SelectItem>
                    <SelectItem value="event">Evento</SelectItem>
                    <SelectItem value="cold">Llamada en Frío</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service">Servicio de Interés *</Label>
                <Select name="service" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el servicio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="web">Desarrollo Web</SelectItem>
                    <SelectItem value="mobile">Desarrollo Mobile</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="consulting">Consultoría</SelectItem>
                    <SelectItem value="design">Diseño UI/UX</SelectItem>
                    <SelectItem value="other">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Presupuesto Estimado</Label>
                <Input id="budget" name="budget" type="number" placeholder="50000" min="0" step="1000" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_date">Fecha de Contacto Inicial</Label>
                <Input
                  id="contact_date"
                  name="contact_date"
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select name="priority" defaultValue="medium">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assigned_to">Responsable Asignado</Label>
                <Select name="assigned_to">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un responsable" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user1">Carlos Méndez</SelectItem>
                    <SelectItem value="user2">Ana García</SelectItem>
                    <SelectItem value="user3">Luis Torres</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Notas Iniciales</h3>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Agrega cualquier información adicional sobre el lead..."
                rows={4}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creando..." : "Crear Lead"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
