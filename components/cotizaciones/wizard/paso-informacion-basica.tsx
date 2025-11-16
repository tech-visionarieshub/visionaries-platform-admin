"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import type { CotizacionDraft } from "@/lib/types/cotizacion"
import { mockClientes } from "@/lib/mock-data/finanzas"

type Props = {
  cotizacion: CotizacionDraft
  actualizarCotizacion: (datos: Partial<CotizacionDraft>) => void
}

export function PasoInformacionBasica({ cotizacion, actualizarCotizacion }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Información Básica</h2>
        <p className="text-muted-foreground">Ingresa los datos generales de la cotización</p>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="titulo">Título del Proyecto *</Label>
          <Input
            id="titulo"
            placeholder="ej: Sistema de Gestión de Inventarios"
            value={cotizacion.titulo}
            onChange={(e) => actualizarCotizacion({ titulo: e.target.value })}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="cliente">Cliente *</Label>
          <Select
            value={cotizacion.clienteId}
            onValueChange={(value) => {
              const cliente = mockClientes.find((c) => c.id === value)
              actualizarCotizacion({
                clienteId: value,
                clienteNombre: cliente?.nombre || "",
              })
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un cliente" />
            </SelectTrigger>
            <SelectContent>
              {mockClientes.map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="tipo">Tipo de Proyecto *</Label>
          <Select
            value={cotizacion.tipoProyecto}
            onValueChange={(value: any) => actualizarCotizacion({ tipoProyecto: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Dashboard">Dashboard</SelectItem>
              <SelectItem value="CRM">CRM</SelectItem>
              <SelectItem value="E-commerce">E-commerce</SelectItem>
              <SelectItem value="App Móvil">App Móvil</SelectItem>
              <SelectItem value="Website">Website</SelectItem>
              <SelectItem value="Personalizado">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="descripcion">Descripción General</Label>
          <Textarea
            id="descripcion"
            placeholder="Describe brevemente el proyecto..."
            value={cotizacion.descripcion}
            onChange={(e) => actualizarCotizacion({ descripcion: e.target.value })}
            rows={4}
          />
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="template">Usar Template</Label>
            <p className="text-sm text-muted-foreground">Pre-llenar información desde un template existente</p>
          </div>
          <Switch
            id="template"
            checked={cotizacion.usarTemplate}
            onCheckedChange={(checked) => actualizarCotizacion({ usarTemplate: checked })}
          />
        </div>

        {cotizacion.usarTemplate && (
          <div className="grid gap-2">
            <Label htmlFor="templateId">Seleccionar Template</Label>
            <Select
              value={cotizacion.templateId}
              onValueChange={(value) => actualizarCotizacion({ templateId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Dashboard Básico</SelectItem>
                <SelectItem value="2">CRM Estándar</SelectItem>
                <SelectItem value="3">E-commerce Completo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  )
}
