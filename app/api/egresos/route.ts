import { NextRequest, NextResponse } from 'next/server';
import { withFinanzasAuth } from '@/lib/api/middleware';
import { egresosRepository } from '@/lib/repositories/egresos-repository';
import type { Egreso } from '@/lib/mock-data/finanzas';

export async function GET(request: NextRequest) {
  return withFinanzasAuth(request, async (user) => {
    try {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status') as Egreso['status'] | null;
      const tipo = searchParams.get('tipo') as Egreso['tipo'] | null;
      const mes = searchParams.get('mes');
      const categoria = searchParams.get('categoria');
      const lineaNegocio = searchParams.get('lineaNegocio');
      const tipoEgreso = searchParams.get('tipoEgreso') as 'basadoEnHoras' | 'otro' | null;

      let egresos;
      if (tipoEgreso === 'basadoEnHoras') {
        egresos = await egresosRepository.getBasadosEnHoras();
      } else if (status) {
        egresos = await egresosRepository.getByStatus(status);
      } else if (tipo) {
        egresos = await egresosRepository.getByTipo(tipo);
      } else if (mes) {
        egresos = await egresosRepository.getByMes(mes);
      } else if (categoria) {
        egresos = await egresosRepository.getByCategoria(categoria);
      } else if (lineaNegocio) {
        egresos = await egresosRepository.getByLineaNegocio(lineaNegocio);
      } else {
        egresos = await egresosRepository.getAll();
      }

      return NextResponse.json({ success: true, data: egresos });
    } catch (error: any) {
      console.error('[Egresos API] Error:', error);
      return NextResponse.json(
        { error: 'Error fetching egresos', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return withFinanzasAuth(request, async (user) => {
    try {
      const body = await request.json();
      const { id, ...egresoData } = body;

      let egreso;
      if (id) {
        egreso = await egresosRepository.createWithId(id, egresoData);
      } else {
        egreso = await egresosRepository.create(egresoData);
      }

      return NextResponse.json({ success: true, data: egreso }, { status: 201 });
    } catch (error: any) {
      console.error('[Egresos API] Error:', error);
      return NextResponse.json(
        { error: 'Error creating egreso', message: error.message },
        { status: 500 }
      );
    }
  });
}

