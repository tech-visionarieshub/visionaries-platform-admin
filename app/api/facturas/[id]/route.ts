import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { facturasRepository } from '@/lib/repositories/facturas-repository';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const factura = await facturasRepository.getById(params.id);

      if (!factura) {
        return NextResponse.json(
          { error: 'Factura not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: factura });
    } catch (error: any) {
      console.error('[Facturas API] Error:', error);
      return NextResponse.json(
        { error: 'Error fetching factura', message: error.message },
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

      const factura = await facturasRepository.update(params.id, updates);

      return NextResponse.json({ success: true, data: factura });
    } catch (error: any) {
      console.error('[Facturas API] Error:', error);
      
      if (error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Factura not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Error updating factura', message: error.message },
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
      await facturasRepository.delete(params.id);

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error('[Facturas API] Error:', error);
      return NextResponse.json(
        { error: 'Error deleting factura', message: error.message },
        { status: 500 }
      );
    }
  });
}

