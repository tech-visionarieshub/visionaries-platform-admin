import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { cotizacionesRepository } from '@/lib/repositories/cotizaciones-repository';

type IdParamsContext = { params: Promise<{ id: string }> };

export async function GET(
  request: NextRequest,
  context: IdParamsContext
) {
  const { id } = await context.params;

  return withAuth(request, async (user) => {
    try {
      const cotizacion = await cotizacionesRepository.getById(id);

      if (!cotizacion) {
        return NextResponse.json(
          { error: 'Cotizacion not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: cotizacion });
    } catch (error: any) {
      console.error('[Cotizaciones API] Error:', error);
      return NextResponse.json(
        { error: 'Error fetching cotizacion', message: error.message },
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

      const cotizacion = await cotizacionesRepository.update(id, updates);

      return NextResponse.json({ success: true, data: cotizacion });
    } catch (error: any) {
      console.error('[Cotizaciones API] Error:', error);
      
      if (error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Cotizacion not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Error updating cotizacion', message: error.message },
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
      await cotizacionesRepository.delete(id);

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error('[Cotizaciones API] Error:', error);
      return NextResponse.json(
        { error: 'Error deleting cotizacion', message: error.message },
        { status: 500 }
      );
    }
  });
}

