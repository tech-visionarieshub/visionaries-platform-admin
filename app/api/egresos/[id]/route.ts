import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { egresosRepository } from '@/lib/repositories/egresos-repository';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const egreso = await egresosRepository.getById(params.id);

      if (!egreso) {
        return NextResponse.json(
          { error: 'Egreso not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: egreso });
    } catch (error: any) {
      console.error('[Egresos API] Error:', error);
      return NextResponse.json(
        { error: 'Error fetching egreso', message: error.message },
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

      const egreso = await egresosRepository.update(params.id, updates);

      return NextResponse.json({ success: true, data: egreso });
    } catch (error: any) {
      console.error('[Egresos API] Error:', error);
      
      if (error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Egreso not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Error updating egreso', message: error.message },
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
      await egresosRepository.delete(params.id);

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error('[Egresos API] Error:', error);
      return NextResponse.json(
        { error: 'Error deleting egreso', message: error.message },
        { status: 500 }
      );
    }
  });
}

