"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

// Mock data - reemplazar con datos reales
const mockPayments = [
  {
    id: 1,
    fecha: "2024-02-05",
    cliente: "Tech Solutions SA",
    factura: "INV-2024-001",
    monto: 37000,
    estado: "Próximo",
  },
  {
    id: 2,
    fecha: "2024-02-10",
    cliente: "Digital Marketing Inc",
    factura: "INV-2024-002",
    monto: 25000,
    estado: "Próximo",
  },
  {
    id: 3,
    fecha: "2024-02-15",
    cliente: "E-commerce Plus",
    factura: "INV-2024-003",
    monto: 45000,
    estado: "Próximo",
  },
  {
    id: 4,
    fecha: "2024-02-01",
    cliente: "Startup Ventures",
    factura: "INV-2024-004",
    monto: 30000,
    estado: "Vencido",
  },
  {
    id: 5,
    fecha: "2024-01-28",
    cliente: "Creative Agency",
    factura: "INV-2023-099",
    monto: 20000,
    estado: "Pagado",
  },
]

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 1, 1)) // Febrero 2024

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek }
  }

  const getPaymentsForDate = (date: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`
    return mockPayments.filter((payment) => payment.fecha === dateStr)
  }

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "Pagado":
        return "bg-[#95C900]/20 text-[#95C900] border-[#95C900]/30"
      case "Próximo":
        return "bg-[#4BBAFF]/20 text-[#4BBAFF] border-[#4BBAFF]/30"
      case "Vencido":
        return "bg-[#E02814]/20 text-[#E02814] border-[#E02814]/30"
      default:
        return "bg-[#6B7280]/20 text-[#6B7280] border-[#6B7280]/30"
    }
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate)
  const monthName = currentDate.toLocaleDateString("es-MX", { month: "long", year: "numeric" })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0E0734]">Calendario de Cobros</h1>
          <p className="text-sm text-[#6B7280]">Vista mensual de pagos esperados y realizados</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 px-4">
            <CalendarIcon className="h-4 w-4 text-[#4514F9]" />
            <span className="font-medium capitalize text-[#0E0734]">{monthName}</span>
          </div>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Leyenda */}
      <Card>
        <CardContent className="flex items-center gap-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#95C900]" />
            <span className="text-sm text-[#6B7280]">Pagado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#4BBAFF]" />
            <span className="text-sm text-[#6B7280]">Próximo</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#E02814]" />
            <span className="text-sm text-[#6B7280]">Vencido</span>
          </div>
        </CardContent>
      </Card>

      {/* Calendario */}
      <Card>
        <CardContent className="p-6">
          {/* Días de la semana */}
          <div className="mb-4 grid grid-cols-7 gap-2">
            {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-[#6B7280]">
                {day}
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-2">
            {/* Espacios vacíos antes del primer día */}
            {Array.from({ length: startingDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {/* Días del mes */}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1
              const payments = getPaymentsForDate(day)
              const isToday =
                day === new Date().getDate() &&
                currentDate.getMonth() === new Date().getMonth() &&
                currentDate.getFullYear() === new Date().getFullYear()

              return (
                <div
                  key={day}
                  className={`aspect-square rounded-lg border p-2 ${
                    isToday ? "border-[#4514F9] bg-[#4514F9]/5" : "border-[#E5E7EB]"
                  }`}
                >
                  <div className="flex h-full flex-col">
                    <span className={`text-sm font-medium ${isToday ? "text-[#4514F9]" : "text-[#1A1A1A]"}`}>
                      {day}
                    </span>
                    <div className="mt-1 flex-1 space-y-1 overflow-y-auto">
                      {payments.map((payment) => (
                        <div
                          key={payment.id}
                          className={`cursor-pointer rounded border px-1 py-0.5 text-xs ${getStatusColor(payment.estado)}`}
                          title={`${payment.cliente} - $${payment.monto.toLocaleString("es-MX")}`}
                        >
                          <div className="truncate font-medium">${(payment.monto / 1000).toFixed(0)}k</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pagos del Mes */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-4 font-semibold text-[#0E0734]">Pagos de {monthName}</h3>
          <div className="space-y-3">
            {mockPayments
              .filter((payment) => {
                const paymentDate = new Date(payment.fecha)
                return (
                  paymentDate.getMonth() === currentDate.getMonth() &&
                  paymentDate.getFullYear() === currentDate.getFullYear()
                )
              })
              .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
              .map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg border border-[#E5E7EB] p-4"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        payment.estado === "Pagado"
                          ? "bg-[#95C900]"
                          : payment.estado === "Vencido"
                            ? "bg-[#E02814]"
                            : "bg-[#4BBAFF]"
                      }`}
                    />
                    <div>
                      <p className="font-medium text-[#0E0734]">{payment.cliente}</p>
                      <p className="text-sm text-[#6B7280]">
                        {payment.factura} • {new Date(payment.fecha).toLocaleDateString("es-MX")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#0E0734]">${payment.monto.toLocaleString("es-MX")}</p>
                    <p className="text-sm text-[#6B7280]">{payment.estado}</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
