import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { githubService } from '@/lib/services/github-service';
import { openAIService } from '@/lib/services/openai-service';
import { featuresRepository } from '@/lib/repositories/features-repository';
import { projectsRepository } from '@/lib/repositories/projects-repository';

type ProjectParamsContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: NextRequest,
  context: ProjectParamsContext
) {
  return withAuth(request, async (user, req) => {
    try {
      const { id: projectId } = await context.params;
      const body = await request.json().catch(() => ({}));
      const language = body.language || 'es'; // Por defecto español

      // Obtener información del proyecto
      const project = await projectsRepository.getById(projectId);
      if (!project) {
        return NextResponse.json(
          { error: 'Proyecto no encontrado' },
          { status: 404 }
        );
      }

      // Calcular fechas de la semana (últimos 7 días)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      // Obtener todas las features del proyecto
      const allFeatures = await featuresRepository.getAll(projectId);

      // Features completadas en los últimos 7 días
      const completedFeatures = allFeatures.filter((f) => {
        if (f.status !== 'done' && f.status !== 'completed') return false;
        const updatedAt = f.updatedAt instanceof Date ? f.updatedAt : new Date(f.updatedAt);
        return updatedAt >= startDate && updatedAt <= endDate;
      });

      // Features en progreso o pendientes (para "lo que se hará")
      const inProgressFeatures = allFeatures.filter(
        (f) => f.status === 'in-progress' || f.status === 'todo' || f.status === 'backlog'
      );

      // Detectar blockers
      const blockers: Feature[] = [];
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      for (const feature of allFeatures) {
        const updatedAt = feature.updatedAt instanceof Date ? feature.updatedAt : new Date(feature.updatedAt);
        const isStale = updatedAt < sevenDaysAgo;
        const needsReview = feature.status === 'review';
        const unassigned = !feature.assignee;
        const hasClientDependency =
          feature.comentarios?.toLowerCase().includes('cliente') ||
          feature.comentarios?.toLowerCase().includes('pendiente') ||
          feature.comentarios?.toLowerCase().includes('bloqueado');

        if (needsReview || (unassigned && isStale) || hasClientDependency) {
          blockers.push(feature);
        }
      }

      // Calcular porcentaje de avance
      const totalFeatures = allFeatures.length;
      const completedCount = allFeatures.filter(
        (f) => f.status === 'done' || f.status === 'completed'
      ).length;
      const progressPercentage = totalFeatures > 0 ? Math.round((completedCount / totalFeatures) * 100) : 0;

      // Obtener commits de GitHub de los últimos 7 días
      let commits: Array<{
        message: string;
        author: string;
        date: string;
        additions?: number;
        deletions?: number;
      }> = [];

      try {
        const projectRepo = await githubService.getProjectRepository(projectId);
        if (projectRepo) {
          const [owner, repo] = projectRepo.split('/');
          if (owner && repo) {
            console.log(`[Status Generate] Obteniendo commits de ${projectRepo} para período ${startDate.toISOString()} a ${endDate.toISOString()}`);
            
            // Obtener más commits para asegurar que capturemos todos los del período
            const githubCommits = await githubService.getRecentCommits(owner, repo, 100);
            
            console.log(`[Status Generate] Total commits obtenidos: ${githubCommits.length}`);
            
            // Filtrar commits de los últimos 7 días
            commits = githubCommits
              .filter((c) => {
                const commitDate = new Date(c.commit.author.date);
                const isInRange = commitDate >= startDate && commitDate <= endDate;
                if (isInRange) {
                  console.log(`[Status Generate] Commit incluido: ${c.commit.message.split('\n')[0]} (${commitDate.toISOString()})`);
                }
                return isInRange;
              })
              .map((c) => ({
                message: c.commit.message.split('\n')[0],
                author: c.author?.login || c.commit.author.name,
                date: c.commit.author.date,
                additions: c.stats?.additions,
                deletions: c.stats?.deletions,
              }));
            
            console.log(`[Status Generate] Commits filtrados para el período: ${commits.length}`);
          } else {
            console.log(`[Status Generate] Repositorio no válido: ${projectRepo}`);
          }
        } else {
          console.log(`[Status Generate] No hay repositorio conectado para el proyecto ${projectId}`);
        }
      } catch (error: any) {
        console.error('[Status Generate] Error obteniendo commits de GitHub:', error);
        console.error('[Status Generate] Error details:', error.message, error.stack);
        // Continuar sin commits si hay error
      }

      // Calcular número de semana basado en la fecha de inicio del proyecto
      const projectStartDate = project.startDate 
        ? new Date(project.startDate)
        : (project.createdAt instanceof Date ? project.createdAt : new Date(project.createdAt || new Date()));
      const weekNumber = Math.max(1, Math.ceil((startDate.getTime() - projectStartDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1);

      // Generar reporte con IA
      const reportContent = await openAIService.generateStatusReport({
        completedFeatures: completedFeatures.map((f) => ({
          id: f.id,
          title: f.title,
          description: f.description,
          epicTitle: f.epicTitle,
          tipo: f.tipo,
          categoria: f.categoria,
          completedAt: f.updatedAt instanceof Date ? f.updatedAt : new Date(f.updatedAt),
        })),
        commits,
        inProgressFeatures: inProgressFeatures.slice(0, 10).map((f) => ({
          id: f.id,
          title: f.title,
          description: f.description,
          epicTitle: f.epicTitle,
          tipo: f.tipo,
          categoria: f.categoria,
          status: f.status,
        })),
        blockers: blockers.slice(0, 10).map((f) => ({
          id: f.id,
          title: f.title,
          description: f.description,
          epicTitle: f.epicTitle,
          tipo: f.tipo,
          categoria: f.categoria,
          status: f.status,
          assignee: f.assignee,
          comentarios: f.comentarios,
        })),
        progressPercentage,
        projectName: project.name,
        weekStartDate: startDate,
        weekEndDate: endDate,
        language: language as 'es' | 'en',
        weekNumber: weekNumber,
      });

      // Generar subject del email según el idioma
      const subject = language === 'en'
        ? `Weekly Report - ${project.name} - Week ${weekNumber}`
        : `Reporte Semanal - ${project.name} - Semana ${weekNumber}`;

      return NextResponse.json({
        success: true,
        report: {
          subject,
          content: reportContent,
          weekStartDate: startDate.toISOString(),
          weekEndDate: endDate.toISOString(),
          progressPercentage,
          completedFeaturesCount: completedFeatures.length,
          inProgressFeaturesCount: inProgressFeatures.length,
          blockersCount: blockers.length,
          commitsCount: commits.length,
        },
      });
    } catch (error: any) {
      console.error('[Status Generate] Error:', error);
      return NextResponse.json(
        { error: error.message || 'Error al generar reporte de status' },
        { status: 500 }
      );
    }
  });
}

