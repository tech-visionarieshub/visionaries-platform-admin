"use client"

import { useState, useEffect } from "react"
import { Search, Filter, Plus, Clock, CheckCircle2, AlertCircle, FolderKanban } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { StatusBadge } from "@/components/ui/status-badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { getProjects } from "@/lib/api/projects-api"
import type { Project } from "@/lib/mock-data/projects"

const statusConfig = {
  "En desarrollo": { variant: "info" as const, icon: Clock },
  QA: { variant: "warning" as const, icon: AlertCircle },
  Garantía: { variant: "success" as const, icon: CheckCircle2 },
  Finalizado: { variant: "default" as const, icon: CheckCircle2 },
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    
    async function loadProjects() {
      try {
        setLoading(true)
        setError(null)
        console.log('[Projects Page] Iniciando carga de proyectos...')
        
        // Timeout de 15 segundos (más corto para detectar problemas más rápido)
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            console.error('[Projects Page] Timeout después de 15 segundos');
            reject(new Error('Timeout: La carga de proyectos tardó demasiado (15s)'))
          }, 15000)
        })
        
        console.log('[Projects Page] Iniciando Promise.race con timeout de 15s');
        const dataPromise = getProjects()
        const data = await Promise.race([dataPromise, timeoutPromise]) as Project[]
        console.log('[Projects Page] Promise.race completado, datos recibidos')
        
        if (cancelled) return
        
        console.log('[Projects Page] Proyectos cargados:', data?.length || 0)
        
        if (!data) {
          throw new Error('No se recibieron datos de la API')
        }
        
        if (!Array.isArray(data)) {
          console.error('[Projects Page] Datos recibidos no son un array:', data)
          throw new Error('Formato de datos inválido: se esperaba un array')
        }
        
        setProjects(data)
        setError(null)
      } catch (err: any) {
        if (cancelled) return
        
        // Si es error de autenticación, no mostrar error (ya redirige)
        if (err.name === 'AuthenticationError' || err.message?.includes('authentication')) {
          console.log('[Projects Page] Error de autenticación, redirigiendo...')
          return
        }
        const errorMessage = err.message || 'Error cargando proyectos'
        console.error('[Projects Page] Error loading projects:', {
          error: err,
          message: errorMessage,
          stack: err.stack
        })
        setError(errorMessage)
      } finally {
        if (!cancelled) {
          setLoading(false)
          console.log('[Projects Page] Carga finalizada')
        }
      }
    }
    
    loadProjects()
    
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center h-64 gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4514F9]"></div>
          <p className="text-muted-foreground">Cargando proyectos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-destructive font-medium">Error: {error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
          >
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#0E0734]">Proyectos</h1>
          <p className="text-muted-foreground mt-1">Gestión y seguimiento de proyectos activos</p>
        </div>
        <Link href="/projects/new">
          <Button className="bg-[#4514F9] hover:bg-[#3810C7]">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Proyecto
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar proyectos..." className="pl-10" />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
        </div>
      </Card>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const StatusIcon = statusConfig[project.status as keyof typeof statusConfig].icon

          return (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-[#0E0734] mb-1">{project.name}</h3>
                      <p className="text-sm text-muted-foreground">{project.client}</p>
                    </div>
                    <StatusBadge variant={statusConfig[project.status as keyof typeof statusConfig].variant}>
                      {project.status}
                    </StatusBadge>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progreso</span>
                      <span className="font-medium text-[#4514F9]">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                  </div>

                  {/* Features */}
                  <div className="flex items-center gap-2 text-sm">
                    <FolderKanban className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {project.completedFeatures}/{project.features} funcionalidades
                    </span>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center justify-between text-sm pt-2 border-t">
                    <div>
                      <p className="text-muted-foreground">Inicio</p>
                      <p className="font-medium">
                        {new Date(project.startDate).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Entrega</p>
                      <p className="font-medium">
                        {new Date(project.endDate).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Responsible */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <div className="h-8 w-8 rounded-full bg-[#4514F9] flex items-center justify-center text-white text-sm font-medium">
                      {project.responsible
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <span className="text-sm text-muted-foreground">{project.responsible}</span>
                  </div>
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
