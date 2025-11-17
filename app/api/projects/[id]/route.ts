import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { projectsRepository } from '@/lib/repositories/projects-repository';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const project = await projectsRepository.getById(params.id);

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: project });
    } catch (error: any) {
      console.error('[Projects API] Error:', error);
      return NextResponse.json(
        { error: 'Error fetching project', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json();
      const { id, ...updates } = body;

      const project = await projectsRepository.update(params.id, updates);

      return NextResponse.json({ success: true, data: project });
    } catch (error: any) {
      console.error('[Projects API] Error:', error);
      
      if (error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Error updating project', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      await projectsRepository.delete(params.id);

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error('[Projects API] Error:', error);
      return NextResponse.json(
        { error: 'Error deleting project', message: error.message },
        { status: 500 }
      );
    }
  });
}

