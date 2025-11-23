import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { nominaRepository } from '@/lib/repositories/nomina-repository';

type IdParamsContext = { params: Promise<{ id: string }> };

export async function GET(
  request: NextRequest,
  context: IdParamsContext
) {
  const { id } = await context.params;

  return withAuth(request, async (user) => {
    try {
      const member = await nominaRepository.getById(id);

      if (!member) {
        return NextResponse.json(
          { error: 'Nomina member not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: member });
    } catch (error: any) {
      console.error('[Nomina API] Error:', error);
      return NextResponse.json(
        { error: 'Error fetching nomina member', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function PUT(
  request: NextRequest,
  context: IdParamsContext
) {
  const { id } = await context.params;

  return withAuth(request, async (user) => {
    try {
      const body = await request.json();
      const { id, ...updates } = body;

      const member = await nominaRepository.update(id, updates);

      return NextResponse.json({ success: true, data: member });
    } catch (error: any) {
      console.error('[Nomina API] Error:', error);
      
      if (error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Nomina member not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Error updating nomina member', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(
  request: NextRequest,
  context: IdParamsContext
) {
  const { id } = await context.params;

  return withAuth(request, async (user) => {
    try {
      await nominaRepository.delete(id);

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error('[Nomina API] Error:', error);
      return NextResponse.json(
        { error: 'Error deleting nomina member', message: error.message },
        { status: 500 }
      );
    }
  });
}

