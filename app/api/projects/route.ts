import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { projectsRepository } from '@/lib/repositories/projects-repository';
import type { Project } from '@/lib/mock-data/projects';

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      console.log('[Projects API] GET request iniciada');
      const { searchParams } = new URL(request.url);
      const clientId = searchParams.get('clientId');
      const status = searchParams.get('status') as Project['status'] | null;

      console.log('[Projects API] Parámetros:', { clientId, status });
      console.log('[Projects API] Usuario:', { email: user.email, superadmin: user.superadmin });

      const isSuperAdmin = user.superadmin === true || user.email === 'adminplatform@visionarieshub.com';

      let projects;
      if (clientId) {
        console.log('[Projects API] Obteniendo proyectos por clientId:', clientId);
        projects = await projectsRepository.getByClientId(clientId);
      } else if (status) {
        console.log('[Projects API] Obteniendo proyectos por status:', status);
        projects = await projectsRepository.getByStatus(status);
      } else {
        console.log('[Projects API] Obteniendo todos los proyectos');
        projects = await projectsRepository.getAll();
      }

      // Filtrar proyectos por acceso del equipo (excepto superadmins)
      if (!isSuperAdmin && user.email) {
        const filteredProjects = projects.filter((project: any) => {
          const teamMembers = project.teamMembers || [];
          const hasAccess = teamMembers.includes(user.email);
          console.log(`[Projects API] Proyecto ${project.id} (${project.name}): acceso=${hasAccess}, equipo=${teamMembers.length} miembros`);
          return hasAccess;
        });
        console.log(`[Projects API] Filtrados ${filteredProjects.length} de ${projects.length} proyectos para usuario ${user.email}`);
        projects = filteredProjects;
      } else {
        console.log(`[Projects API] Superadmin: mostrando todos los ${projects.length} proyectos`);
      }

      // Calcular métricas y responsable para cada proyecto
      const { featuresRepository } = await import('@/lib/repositories/features-repository');
      const { getAuraAuth } = await import('@/lib/firebase/admin-tech');
      const auth = getAuraAuth();

      const projectsWithMetrics = await Promise.all(
        projects.map(async (project: any) => {
          try {
            // Calcular métricas de features
            const features = await featuresRepository.getAll(project.id);
            const totalFeatures = features.length;
            const completedFeatures = features.filter((f: any) => f.status === 'done' || f.status === 'completed').length;
            const progress = totalFeatures > 0 
              ? Math.round((completedFeatures / totalFeatures) * 100)
              : (project.progress || 0);

            // Obtener nombre del usuario creador - SIEMPRE usar createdBy si existe
            let responsibleName = 'Sin asignar';
            if (project.createdBy) {
              try {
                const creatorUser = await auth.getUserByEmail(project.createdBy);
                responsibleName = creatorUser.displayName || creatorUser.email?.split('@')[0] || project.createdBy;
              } catch (authError) {
                // Si no se puede obtener el usuario, usar el email
                responsibleName = project.createdBy?.split('@')[0] || 'Sin asignar';
              }
            } else {
              // Si no hay createdBy, usar el responsable guardado como fallback
              responsibleName = project.responsible || 'Sin asignar';
            }

            return {
              ...project,
              features: totalFeatures,
              completedFeatures,
              progress,
              responsible: responsibleName,
            };
          } catch (error) {
            console.error(`[Projects API] Error calculando métricas para proyecto ${project.id}:`, error);
            // Si hay error, devolver el proyecto sin métricas actualizadas
            return project;
          }
        })
      );

      console.log('[Projects API] Proyectos obtenidos:', projectsWithMetrics?.length || 0);
      return NextResponse.json({ success: true, data: projectsWithMetrics });
    } catch (error: any) {
      console.error('[Projects API] Error:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
      });
      return NextResponse.json(
        { 
          success: false,
          error: 'Error fetching projects', 
          message: error.message 
        },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json();
      const { id, ...projectData } = body;

      // Asegurar que siempre se guarde el createdBy
      const projectDataWithCreator = {
        ...projectData,
        createdBy: user.email || user.id || 'unknown',
      };

      let project;
      if (id) {
        project = await projectsRepository.createWithId(id, projectDataWithCreator);
      } else {
        project = await projectsRepository.create(projectDataWithCreator);
      }

      return NextResponse.json({ success: true, data: project }, { status: 201 });
    } catch (error: any) {
      console.error('[Projects API] Error:', error);
      return NextResponse.json(
        { error: 'Error creating project', message: error.message },
        { status: 500 }
      );
    }
  });
}

