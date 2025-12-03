import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/api/middleware'
import { projectsRepository } from '@/lib/repositories/projects-repository'
import { featuresRepository } from '@/lib/repositories/features-repository'

type ProjectParamsContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: ProjectParamsContext
) {
  const { id } = await context.params

  return withAuth(request, async (user) => {
    try {
      const project = await projectsRepository.getById(id)

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }

      // Verificar acceso: superadmins pueden ver todo, otros solo si están en el equipo
      const isSuperAdmin = user.superadmin === true || user.email === 'adminplatform@visionarieshub.com'
      
      if (!isSuperAdmin && user.email) {
        const teamMembers = (project as any).teamMembers || []
        const hasAccess = teamMembers.includes(user.email)
        
        if (!hasAccess) {
          console.log(`[Projects API] Acceso denegado: usuario ${user.email} no está en el equipo del proyecto ${id}`)
          return NextResponse.json(
            { error: 'No tienes acceso a este proyecto. Debes estar en el equipo del proyecto para verlo.' },
            { status: 403 }
          )
        }
      }

      // Si el proyecto no tiene createdBy pero el usuario actual tiene email, actualizarlo
      if (!(project as any).createdBy && user.email) {
        try {
          await projectsRepository.update(id, {
            createdBy: user.email,
          } as any)
          // Recargar el proyecto con el createdBy actualizado
          const updatedProject = await projectsRepository.getById(id)
          if (updatedProject) {
            project = updatedProject
          }
        } catch (updateError) {
          console.error('[Projects API] Error actualizando createdBy:', updateError)
        }
      }

      // Calcular métricas dinámicas basadas en features reales
      try {
        const features = await featuresRepository.getAll(id)
        const totalFeatures = features.length
        const completedFeatures = features.filter(f => f.status === 'done' || f.status === 'completed').length
        const progress = totalFeatures > 0 
          ? Math.round((completedFeatures / totalFeatures) * 100)
          : (project.progress || 0)

        // Calcular horas trabajadas sumando las horas reales de las features completadas
        const hoursWorkedRaw = features
          .filter(f => f.status === 'done' || f.status === 'completed')
          .reduce((sum, f) => sum + (f.actualHours || 0), 0)
        // Redondear a 1 decimal para evitar problemas de precisión de punto flotante
        const hoursWorked = Math.round(hoursWorkedRaw * 10) / 10

        // Calcular horas estimadas sumando las horas estimadas de todas las features
        const hoursEstimatedRaw = features.reduce((sum, f) => sum + (f.estimatedHours || 0), 0)
        // Redondear a 1 decimal para evitar problemas de precisión de punto flotante
        const hoursEstimated = Math.round(hoursEstimatedRaw * 10) / 10

        // Obtener nombre del usuario creador - SIEMPRE usar createdBy si existe
        let responsibleName = 'Sin asignar'
        if ((project as any).createdBy) {
          try {
            const { getAuraAuth } = await import('@/lib/firebase/admin-tech')
            const auth = getAuraAuth()
            const creatorUser = await auth.getUserByEmail((project as any).createdBy)
            responsibleName = creatorUser.displayName || creatorUser.email?.split('@')[0] || (project as any).createdBy
          } catch (authError) {
            // Si no se puede obtener el usuario, usar el email
            responsibleName = (project as any).createdBy?.split('@')[0] || 'Sin asignar'
          }
        } else {
          // Si no hay createdBy, usar el responsable guardado como fallback
          responsibleName = project.responsible || 'Sin asignar'
        }

        // Actualizar el proyecto con las métricas calculadas
        const projectWithMetrics = {
          ...project,
          features: totalFeatures,
          completedFeatures,
          progress,
          hoursWorked: hoursWorked || project.hoursWorked || 0,
          hoursEstimated: hoursEstimated || project.hoursEstimated || 0,
          responsible: responsibleName,
        }

        return NextResponse.json({ success: true, data: projectWithMetrics })
      } catch (featuresError) {
        console.error('[Projects API] Error calculando métricas de features:', featuresError)
        // Si hay error obteniendo features, devolver el proyecto sin métricas actualizadas
        return NextResponse.json({ success: true, data: project })
      }
    } catch (error: any) {
      console.error('[Projects API] Error:', error)
      return NextResponse.json(
        { error: 'Error fetching project', message: error.message },
        { status: 500 }
      )
    }
  })
}

export async function PUT(
  request: NextRequest,
  context: ProjectParamsContext
) {
  const { id } = await context.params

  return withAuth(request, async (user) => {
    try {
      const body = await request.json()
      const { id: _bodyId, ...updates } = body

      const project = await projectsRepository.update(id, updates)

      return NextResponse.json({ success: true, data: project })
    } catch (error: any) {
      console.error('[Projects API] Error:', error)

      if (error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: 'Error updating project', message: error.message },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(
  request: NextRequest,
  context: ProjectParamsContext
) {
  const { id } = await context.params

  return withAuth(request, async (user) => {
    try {
      await projectsRepository.delete(id)

      return NextResponse.json({ success: true })
    } catch (error: any) {
      console.error('[Projects API] Error:', error)
      return NextResponse.json(
        { error: 'Error deleting project', message: error.message },
        { status: 500 }
      )
    }
  })
}
