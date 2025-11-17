import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { cotizacionesRepository } from '@/lib/repositories/cotizaciones-repository';
import type { EstadoCotizacion } from '@/lib/mock-data/cotizaciones';

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { searchParams } = new URL(request.url);
      const clienteId = searchParams.get('clienteId');
      const estado = searchParams.get('estado') as EstadoCotizacion | null;

      let cotizaciones;
      if (clienteId) {
        cotizaciones = await cotizacionesRepository.getByClienteId(clienteId);
      } else if (estado) {
        cotizaciones = await cotizacionesRepository.getByEstado(estado);
      } else {
        cotizaciones = await cotizacionesRepository.getAll();
      }

      return NextResponse.json({ success: true, data: cotizaciones });
    } catch (error: any) {
      console.error('[Cotizaciones API] Error:', error);
      return NextResponse.json(
        { error: 'Error fetching cotizaciones', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json();
      const { id, ...cotizacionData } = body;

      let cotizacion;
      if (id) {
        cotizacion = await cotizacionesRepository.createWithId(id, cotizacionData);
      } else {
        cotizacion = await cotizacionesRepository.create(cotizacionData);
      }

      return NextResponse.json({ success: true, data: cotizacion }, { status: 201 });
    } catch (error: any) {
      console.error('[Cotizaciones API] Error:', error);
      return NextResponse.json(
        { error: 'Error creating cotizacion', message: error.message },
        { status: 500 }
      );
    }
  });
}

