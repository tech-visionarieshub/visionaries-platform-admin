import { NextRequest, NextResponse } from 'next/server';
import { withFinanzasAuth } from '@/lib/api/middleware';
import { preciosPorHoraRepository } from '@/lib/repositories/precios-por-hora-repository';

export async function GET(request: NextRequest) {
  return withFinanzasAuth(request, async (user) => {
    try {
      const precios = await preciosPorHoraRepository.getAll();
      return NextResponse.json({ success: true, data: precios });
    } catch (error: any) {
      console.error('[Precios por Hora API] Error:', error);
      return NextResponse.json(
        { error: 'Error fetching precios por hora', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return withFinanzasAuth(request, async (user) => {
    try {
      const body = await request.json();
      const { id, ...precioData } = body;

      // Agregar timestamps
      const now = new Date();
      const precioWithTimestamps = {
        ...precioData,
        createdAt: now,
        updatedAt: now,
      };

      let precio;
      if (id) {
        precio = await preciosPorHoraRepository.createWithId(id, precioWithTimestamps);
      } else {
        precio = await preciosPorHoraRepository.create(precioWithTimestamps);
      }

      return NextResponse.json({ success: true, data: precio }, { status: 201 });
    } catch (error: any) {
      console.error('[Precios por Hora API] Error:', error);
      return NextResponse.json(
        { error: 'Error creating precio por hora', message: error.message },
        { status: 500 }
      );
    }
  });
}

