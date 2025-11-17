import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { templatesRepository } from '@/lib/repositories/templates-repository';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const template = await templatesRepository.getById(params.id);

      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: template });
    } catch (error: any) {
      console.error('[Templates API] Error:', error);
      return NextResponse.json(
        { error: 'Error fetching template', message: error.message },
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

      const template = await templatesRepository.update(params.id, updates);

      return NextResponse.json({ success: true, data: template });
    } catch (error: any) {
      console.error('[Templates API] Error:', error);
      
      if (error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Error updating template', message: error.message },
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
      await templatesRepository.delete(params.id);

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error('[Templates API] Error:', error);
      return NextResponse.json(
        { error: 'Error deleting template', message: error.message },
        { status: 500 }
      );
    }
  });
}

