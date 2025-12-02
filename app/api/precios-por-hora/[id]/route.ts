import { NextRequest, NextResponse } from 'next/server';
import { withFinanzasAuth } from '@/lib/api/middleware';
import { preciosPorHoraRepository } from '@/lib/repositories/precios-por-hora-repository';

type IdParamsContext = { params: Promise<{ id: string }> };

export async function GET(
  request: NextRequest,
  context: IdParamsContext
) {
  const { id } = await context.params;

  return withFinanzasAuth(request, async (user) => {
    try {
      const precio = await preciosPorHoraRepository.getById(id);

      if (!precio) {
        return NextResponse.json(
          { error: 'Precio por hora not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: precio });
    } catch (error: any) {
      console.error('[Precios por Hora API] Error:', error);
      return NextResponse.json(
        { error: 'Error fetching precio por hora', message: error.message },
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

  return withFinanzasAuth(request, async (user) => {
    try {
      const body = await request.json();
      const { id: _, ...updates } = body;

      // Agregar timestamp de actualización
      const updatesWithTimestamp = {
        ...updates,
        updatedAt: new Date(),
      };

      const precio = await preciosPorHoraRepository.update(id, updatesWithTimestamp);

      return NextResponse.json({ success: true, data: precio });
    } catch (error: any) {
      console.error('[Precios por Hora API] Error:', error);
      
      if (error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Precio por hora not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Error updating precio por hora', message: error.message },
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

  return withFinanzasAuth(request, async (user) => {
    try {
      await preciosPorHoraRepository.delete(id);

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error('[Precios por Hora API] Error:', error);
      return NextResponse.json(
        { error: 'Error deleting precio por hora', message: error.message },
        { status: 500 }
      );
    }
  });
}

