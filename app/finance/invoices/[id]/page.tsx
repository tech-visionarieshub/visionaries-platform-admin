"use client"

import type React from "react"

import { useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Download, Send, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/ui/status-badge"

// Mock data - reemplazar con datos reales
const mockInvoice = {
  id: "INV-2024-001",
  numero: "INV-2024-001",
  cliente: {
    nombre: "Tech Solutions SA",
    email: "contacto@techsolutions.com",
    telefono: "+52 81 1234 5678",
    direccion: "Av. Constitución 123, Monterrey, NL",
  },
  fechaEmision: "2024-01-15",
  fechaVencimiento: "2024-02-15",
  estado: "Parcial",
  items: [
    {
      id: 1,
      descripcion: "Desarrollo de aplicación web",
      cantidad: 1,
      precioUnitario: 50000,
    },
    {
      id: 2,
      descripcion: "Diseño UI/UX",
      cantidad: 1,
      precioUnitario: 20000,
    },
    {
      id: 3,
      descripcion: "Hosting y dominio (12 meses)",
      cantidad: 1,
      precioUnitario: 5000,
    },
  ],
  subtotal: 75000,
  iva: 12000,
  total: 87000,
  pagado: 50000,
  saldo: 37000,
  pagos: [
    {
      id: 1,
      fecha: "2024-01-20",
      monto: 50000,
      metodo: "Transferencia",
      referencia: "TRANS-001234",
      notas: "Pago inicial 50%",
    },
  ],
}

export default function InvoiceDetailPage() {
  const params = useParams()
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentData, setPaymentData] = useState({
    monto: "",
    fecha: new Date().toISOString().split("T")[0],
    metodo: "Transferencia",
    referencia: "",
    notas: "",
  })

  const invoice = mockInvoice

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Registrando pago:", paymentData)
    // Aquí iría la lógica para registrar el pago
    setShowPaymentForm(false)
    setPaymentData({
      monto: "",
      fecha: new Date().toISOString().split("T")[0],
      metodo: "Transferencia",
      referencia: "",
      notas: "",
    })
  }

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case "Pagada":
        return <CheckCircle2 className="h-5 w-5 text-[#95C900]" />
      case "Pendiente":
        return <Clock className="h-5 w-5 text-[#F59E0B]" />
      case "Vencida":
        return <AlertCircle className="h-5 w-5 text-[#E02814]" />
      case "Parcial":
        return <Clock className="h-5 w-5 text-[#4BBAFF]" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/finance/invoices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#0E0734]">Factura {invoice.numero}</h1>
            <p className="text-sm text-[#6B7280]">
              Emitida el {new Date(invoice.fechaEmision).toLocaleDateString("es-MX")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Descargar PDF
          </Button>
          <Button variant="outline" size="sm">
            <Send className="mr-2 h-4 w-4" />
            Enviar Recordatorio
          </Button>
          {invoice.saldo > 0 && (
            <Button size="sm" onClick={() => setShowPaymentForm(true)}>
              Registrar Pago
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Información Principal */}
        <div className="space-y-6 lg:col-span-2">
          {/* Datos del Cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-[#6B7280]">Cliente</p>
                <p className="text-base font-semibold text-[#0E0734]">{invoice.cliente.nombre}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-[#6B7280]">Email</p>
                  <p className="text-sm text-[#1A1A1A]">{invoice.cliente.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-[#6B7280]">Teléfono</p>
                  <p className="text-sm text-[#1A1A1A]">{invoice.cliente.telefono}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-[#6B7280]">Dirección</p>
                <p className="text-sm text-[#1A1A1A]">{invoice.cliente.direccion}</p>
              </div>
            </CardContent>
          </Card>

          {/* Items de la Factura */}
          <Card>
            <CardHeader>
              <CardTitle>Conceptos Facturados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E5E7EB]">
                      <th className="pb-3 text-left text-xs font-medium uppercase text-[#6B7280]">Descripción</th>
                      <th className="pb-3 text-right text-xs font-medium uppercase text-[#6B7280]">Cantidad</th>
                      <th className="pb-3 text-right text-xs font-medium uppercase text-[#6B7280]">Precio Unit.</th>
                      <th className="pb-3 text-right text-xs font-medium uppercase text-[#6B7280]">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="border-b border-[#E5E7EB]">
                        <td className="py-3 text-sm text-[#1A1A1A]">{item.descripcion}</td>
                        <td className="py-3 text-right text-sm text-[#1A1A1A]">{item.cantidad}</td>
                        <td className="py-3 text-right text-sm text-[#1A1A1A]">
                          ${item.precioUnitario.toLocaleString("es-MX")}
                        </td>
                        <td className="py-3 text-right text-sm font-medium text-[#1A1A1A]">
                          ${(item.cantidad * item.precioUnitario).toLocaleString("es-MX")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-b border-[#E5E7EB]">
                      <td colSpan={3} className="py-3 text-right text-sm font-medium text-[#6B7280]">
                        Subtotal
                      </td>
                      <td className="py-3 text-right text-sm font-medium text-[#1A1A1A]">
                        ${invoice.subtotal.toLocaleString("es-MX")}
                      </td>
                    </tr>
                    <tr className="border-b border-[#E5E7EB]">
                      <td colSpan={3} className="py-3 text-right text-sm font-medium text-[#6B7280]">
                        IVA (16%)
                      </td>
                      <td className="py-3 text-right text-sm font-medium text-[#1A1A1A]">
                        ${invoice.iva.toLocaleString("es-MX")}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="py-3 text-right text-base font-bold text-[#0E0734]">
                        Total
                      </td>
                      <td className="py-3 text-right text-base font-bold text-[#0E0734]">
                        ${invoice.total.toLocaleString("es-MX")} MXN
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Historial de Pagos */}
          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.pagos.length > 0 ? (
                <div className="space-y-4">
                  {invoice.pagos.map((pago) => (
                    <div
                      key={pago.id}
                      className="flex items-start justify-between rounded-lg border border-[#E5E7EB] p-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-[#95C900]" />
                          <p className="font-medium text-[#0E0734]">${pago.monto.toLocaleString("es-MX")} MXN</p>
                        </div>
                        <p className="text-sm text-[#6B7280]">
                          {new Date(pago.fecha).toLocaleDateString("es-MX")} • {pago.metodo}
                        </p>
                        <p className="text-sm text-[#6B7280]">Ref: {pago.referencia}</p>
                        {pago.notas && <p className="text-sm text-[#6B7280]">{pago.notas}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-[#6B7280]">No hay pagos registrados</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Resumen de Estado */}
          <Card>
            <CardHeader>
              <CardTitle>Estado de la Factura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                {getStatusIcon(invoice.estado)}
                <StatusBadge status={invoice.estado} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Total</span>
                  <span className="font-medium text-[#0E0734]">${invoice.total.toLocaleString("es-MX")}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6B7280]">Pagado</span>
                  <span className="font-medium text-[#95C900]">${invoice.pagado.toLocaleString("es-MX")}</span>
                </div>
                <div className="flex justify-between border-t border-[#E5E7EB] pt-2 text-sm">
                  <span className="font-medium text-[#6B7280]">Saldo Pendiente</span>
                  <span className="font-bold text-[#E02814]">${invoice.saldo.toLocaleString("es-MX")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fechas */}
          <Card>
            <CardHeader>
              <CardTitle>Fechas Importantes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-[#6B7280]">Fecha de Emisión</p>
                <p className="text-sm text-[#1A1A1A]">{new Date(invoice.fechaEmision).toLocaleDateString("es-MX")}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-[#6B7280]">Fecha de Vencimiento</p>
                <p className="text-sm text-[#1A1A1A]">
                  {new Date(invoice.fechaVencimiento).toLocaleDateString("es-MX")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Formulario de Pago */}
          {showPaymentForm && (
            <Card>
              <CardHeader>
                <CardTitle>Registrar Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitPayment} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="monto">Monto *</Label>
                    <Input
                      id="monto"
                      type="number"
                      placeholder="0.00"
                      value={paymentData.monto}
                      onChange={(e) => setPaymentData({ ...paymentData, monto: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fecha">Fecha *</Label>
                    <Input
                      id="fecha"
                      type="date"
                      value={paymentData.fecha}
                      onChange={(e) => setPaymentData({ ...paymentData, fecha: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="metodo">Método de Pago *</Label>
                    <select
                      id="metodo"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={paymentData.metodo}
                      onChange={(e) => setPaymentData({ ...paymentData, metodo: e.target.value })}
                      required
                    >
                      <option value="Transferencia">Transferencia</option>
                      <option value="Efectivo">Efectivo</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Tarjeta">Tarjeta</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referencia">Referencia</Label>
                    <Input
                      id="referencia"
                      placeholder="Número de referencia"
                      value={paymentData.referencia}
                      onChange={(e) => setPaymentData({ ...paymentData, referencia: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notas">Notas</Label>
                    <Textarea
                      id="notas"
                      placeholder="Notas adicionales..."
                      value={paymentData.notas}
                      onChange={(e) => setPaymentData({ ...paymentData, notas: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      Registrar
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowPaymentForm(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
