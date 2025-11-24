import { NextRequest, NextResponse } from 'next/server';
import { githubService } from '@/lib/services/github-service';
import { withAuth } from '@/lib/api/middleware';

type ProjectParamsContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  context: ProjectParamsContext
) {
  return withAuth(request, async (user, req) => {
    try {
      const { id: projectId } = await context.params;

      // Obtener repositorio asociado al proyecto
      const projectRepo = await githubService.getProjectRepository(projectId);

      if (!projectRepo) {
        return NextResponse.json({
          connected: false,
          repository: null,
          recentCommits: [],
          pullRequests: [],
          metrics: {
            totalCommits: 0,
            totalPRs: 0,
            openPRs: 0,
            mergedPRs: 0,
            averageReviewTime: '0 horas',
            codeChurn: 0,
          },
          developerStats: [],
        });
      }

      const [owner, repo] = projectRepo.split('/');
      if (!owner || !repo) {
        return NextResponse.json({
          connected: false,
          repository: null,
          recentCommits: [],
          pullRequests: [],
          metrics: {
            totalCommits: 0,
            totalPRs: 0,
            openPRs: 0,
            mergedPRs: 0,
            averageReviewTime: '0 horas',
            codeChurn: 0,
          },
          developerStats: [],
        });
      }

      // Obtener datos del repositorio
      const [commits, prs, metrics, devStats] = await Promise.all([
        githubService.getRecentCommits(owner, repo, 20),
        githubService.getPullRequests(owner, repo, 'all'),
        githubService.getRepositoryMetrics(owner, repo),
        githubService.getDeveloperStats(owner, repo),
      ]);

      // Calcular tiempo promedio de review (simplificado)
      const openPRs = prs.filter(pr => pr.state === 'open');
      const mergedPRs = prs.filter(pr => pr.merged_at !== null);

      return NextResponse.json({
        connected: true,
        repository: {
          name: repo,
          fullName: projectRepo,
          url: `https://github.com/${projectRepo}`,
        },
        recentCommits: commits.map(commit => ({
          id: commit.sha.substring(0, 7),
          message: commit.commit.message.split('\n')[0],
          author: commit.author?.login || commit.commit.author.name,
          date: commit.commit.author.date,
          branch: commit.commit.message.split('\n')[0] || 'main',
          additions: commit.stats?.additions || 0,
          deletions: commit.stats?.deletions || 0,
          url: commit.html_url,
        })),
        pullRequests: prs.slice(0, 20).map(pr => ({
          id: pr.number.toString(),
          title: pr.title,
          author: pr.user.login,
          status: pr.state,
          reviews: pr.reviews || 0,
          created: pr.created_at.split('T')[0],
          url: pr.html_url,
        })),
        metrics: {
          ...metrics,
          openPRs: openPRs.length,
          mergedPRs: mergedPRs.length,
        },
        developerStats: devStats,
      });
    } catch (error: any) {
      console.error('[GitHub Project API] Error:', error);
      return NextResponse.json(
        { error: error.message || 'Error al obtener datos de GitHub' },
        { status: 500 }
      );
    }
  });
}

export async function POST(
  request: NextRequest,
  context: ProjectParamsContext
) {
  return withAuth(request, async (user, req) => {
    try {
      const { id: projectId } = await context.params;
      const body = await request.json();
      const { repository } = body;

      if (!repository || typeof repository !== 'string') {
        return NextResponse.json(
          { error: 'repository es requerido y debe ser un string' },
          { status: 400 }
        );
      }

      // Validar formato de repositorio (owner/repo)
      const parts = repository.split('/');
      if (parts.length !== 2 || !parts[0] || !parts[1]) {
        return NextResponse.json(
          { error: 'Formato inválido. Debe ser: owner/repo' },
          { status: 400 }
        );
      }

      await githubService.saveProjectRepository(projectId, repository);

      return NextResponse.json({
        success: true,
        message: 'Repositorio guardado exitosamente',
        repository,
      });
    } catch (error: any) {
      console.error('[GitHub Project API POST] Error:', error);
      return NextResponse.json(
        { error: error.message || 'Error al guardar repositorio' },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  context: ProjectParamsContext
) {
  return withAuth(request, async (user, req) => {
    try {
      const { id: projectId } = await context.params;

      await githubService.saveProjectRepository(projectId, null);

      return NextResponse.json({
        success: true,
        message: 'Repositorio desconectado exitosamente',
      });
    } catch (error: any) {
      console.error('[GitHub Project API DELETE] Error:', error);
      return NextResponse.json(
        { error: error.message || 'Error al desconectar repositorio' },
        { status: 500 }
      );
    }
  });
}

