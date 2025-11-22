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

      console.log('[Projects API] Proyectos obtenidos:', projects?.length || 0);
      return NextResponse.json({ success: true, data: projects });
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

      let project;
      if (id) {
        project = await projectsRepository.createWithId(id, projectData);
      } else {
        project = await projectsRepository.create(projectData);
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

