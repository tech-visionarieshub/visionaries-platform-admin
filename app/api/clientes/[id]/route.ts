import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { clientesRepository } from '@/lib/repositories/clientes-repository';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const cliente = await clientesRepository.getById(params.id);

      if (!cliente) {
        return NextResponse.json(
          { error: 'Cliente not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: cliente });
    } catch (error: any) {
      console.error('[Clientes API] Error:', error);
      return NextResponse.json(
        { error: 'Error fetching cliente', message: error.message },
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

      const cliente = await clientesRepository.update(params.id, updates);

      return NextResponse.json({ success: true, data: cliente });
    } catch (error: any) {
      console.error('[Clientes API] Error:', error);
      
      if (error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Cliente not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Error updating cliente', message: error.message },
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
      await clientesRepository.delete(params.id);

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error('[Clientes API] Error:', error);
      return NextResponse.json(
        { error: 'Error deleting cliente', message: error.message },
        { status: 500 }
      );
    }
  });
}

