import type React from "react"
import { ArrowLeft, Calendar, User, DollarSign, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { mockProjects } from "@/lib/mock-data/projects"

const navItems = [
  { href: "", label: "Resumen" },
  { href: "/backlog", label: "Funcionalidades" },
  { href: "/ai-generator", label: "IA Generator" },
  { href: "/timeline", label: "Cronograma" },
  { href: "/team", label: "Equipo" },
  { href: "/github", label: "GitHub" },
  { href: "/toggl", label: "Horas (Toggl)" },
  { href: "/qa", label: "QA" },
  { href: "/status", label: "Status Cliente" },
  { href: "/calendar", label: "Calendar" },
  { href: "/deliverables", label: "Entregas" },
  { href: "/documentation", label: "Documentación" },
  { href: "/warranty", label: "Garantía" },
  { href: "/finanzas", label: "Finanzas" }, // Added Finanzas tab
]

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  const project = mockProjects.find((p) => p.id === params.id) || mockProjects[0]

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link href="/projects">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Proyectos
        </Button>
      </Link>

      {/* Project Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-[#0E0734]">{project.name}</h1>
              <StatusBadge variant="info">{project.status}</StatusBadge>
            </div>
            <p className="text-muted-foreground">{project.description}</p>
          </div>
          <Button className="bg-[#4514F9] hover:bg-[#3810C7]">Editar Proyecto</Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <User className="h-4 w-4" />
              Cliente
            </div>
            <p className="font-semibold text-[#0E0734]">{project.client}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar className="h-4 w-4" />
              Fecha de Entrega
            </div>
            <p className="font-semibold text-[#0E0734]">
              {new Date(project.endDate).toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <DollarSign className="h-4 w-4" />
              Presupuesto
            </div>
            <p className="font-semibold text-[#0E0734]">${project.budget.toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="h-4 w-4" />
              Progreso
            </div>
            <p className="font-semibold text-[#4514F9]">{project.progress}%</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <Progress value={project.progress} className="h-3" />
        </div>
      </Card>

      {/* Navigation */}
      <Card className="p-2">
        <nav className="flex gap-1 overflow-x-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={`/projects/${params.id}${item.href}`}
              className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent whitespace-nowrap transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </Card>

      {/* Page Content */}
      {children}
    </div>
  )
}
