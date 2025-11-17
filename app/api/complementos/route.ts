import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { complementosRepository } from '@/lib/repositories/complementos-repository';
import type { Complemento } from '@/lib/mock-data/finanzas';

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { searchParams } = new URL(request.url);
      const facturaId = searchParams.get('facturaId');
      const status = searchParams.get('status') as Complemento['status'] | null;
      const mes = searchParams.get('mes');

      let complementos;
      if (facturaId) {
        complementos = await complementosRepository.getByFacturaId(facturaId);
      } else if (status) {
        complementos = await complementosRepository.getByStatus(status);
      } else if (mes) {
        complementos = await complementosRepository.getByMesFacturacion(mes);
      } else {
        complementos = await complementosRepository.getAll();
      }

      return NextResponse.json({ success: true, data: complementos });
    } catch (error: any) {
      console.error('[Complementos API] Error:', error);
      return NextResponse.json(
        { error: 'Error fetching complementos', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json();
      const { id, ...complementoData } = body;

      let complemento;
      if (id) {
        complemento = await complementosRepository.createWithId(id, complementoData);
      } else {
        complemento = await complementosRepository.create(complementoData);
      }

      return NextResponse.json({ success: true, data: complemento }, { status: 201 });
    } catch (error: any) {
      console.error('[Complementos API] Error:', error);
      return NextResponse.json(
        { error: 'Error creating complemento', message: error.message },
        { status: 500 }
      );
    }
  });
}

