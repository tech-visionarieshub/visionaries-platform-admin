import { NextRequest, NextResponse } from 'next/server';
import { withFinanzasAuth } from '@/lib/api/middleware';
import { clientesRepository } from '@/lib/repositories/clientes-repository';

export async function GET(request: NextRequest) {
  return withFinanzasAuth(request, async (user) => {
    try {
      const clientes = await clientesRepository.getAll();
      return NextResponse.json({ success: true, data: clientes });
    } catch (error: any) {
      console.error('[Clientes API] Error:', error);
      return NextResponse.json(
        { error: 'Error fetching clientes', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return withFinanzasAuth(request, async (user) => {
    try {
      const body = await request.json();
      const { id, ...clienteData } = body;

      let cliente;
      if (id) {
        cliente = await clientesRepository.createWithId(id, clienteData);
      } else {
        cliente = await clientesRepository.create(clienteData);
      }

      return NextResponse.json({ success: true, data: cliente }, { status: 201 });
    } catch (error: any) {
      console.error('[Clientes API] Error:', error);
      return NextResponse.json(
        { error: 'Error creating cliente', message: error.message },
        { status: 500 }
      );
    }
  });
}

