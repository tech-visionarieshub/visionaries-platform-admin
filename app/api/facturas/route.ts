import { NextRequest, NextResponse } from 'next/server';
import { withFinanzasAuth } from '@/lib/api/middleware';
import { facturasRepository } from '@/lib/repositories/facturas-repository';
import type { Factura } from '@/lib/mock-data/finanzas';

export async function GET(request: NextRequest) {
  return withFinanzasAuth(request, async (user) => {
    try {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status') as Factura['status'] | null;
      const empresa = searchParams.get('empresa');
      const mes = searchParams.get('mes');

      let facturas;
      if (status) {
        facturas = await facturasRepository.getByStatus(status);
      } else if (empresa) {
        facturas = await facturasRepository.getByEmpresa(empresa);
      } else if (mes) {
        facturas = await facturasRepository.getByMesFacturacion(mes);
      } else {
        facturas = await facturasRepository.getAll();
      }

      return NextResponse.json({ success: true, data: facturas });
    } catch (error: any) {
      console.error('[Facturas API] Error:', error);
      return NextResponse.json(
        { error: 'Error fetching facturas', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return withFinanzasAuth(request, async (user) => {
    try {
      const body = await request.json();
      const { id, ...facturaData } = body;

      let factura;
      if (id) {
        factura = await facturasRepository.createWithId(id, facturaData);
      } else {
        factura = await facturasRepository.create(facturaData);
      }

      return NextResponse.json({ success: true, data: factura }, { status: 201 });
    } catch (error: any) {
      console.error('[Facturas API] Error:', error);
      return NextResponse.json(
        { error: 'Error creating factura', message: error.message },
        { status: 500 }
      );
    }
  });
}

