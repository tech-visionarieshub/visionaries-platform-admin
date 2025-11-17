import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { complementosRepository } from '@/lib/repositories/complementos-repository';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (user) => {
    try {
      const complemento = await complementosRepository.getById(params.id);

      if (!complemento) {
        return NextResponse.json(
          { error: 'Complemento not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: complemento });
    } catch (error: any) {
      console.error('[Complementos API] Error:', error);
      return NextResponse.json(
        { error: 'Error fetching complemento', message: error.message },
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

      const complemento = await complementosRepository.update(params.id, updates);

      return NextResponse.json({ success: true, data: complemento });
    } catch (error: any) {
      console.error('[Complementos API] Error:', error);
      
      if (error.message?.includes('does not exist')) {
        return NextResponse.json(
          { error: 'Complemento not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Error updating complemento', message: error.message },
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
      await complementosRepository.delete(params.id);

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error('[Complementos API] Error:', error);
      return NextResponse.json(
        { error: 'Error deleting complemento', message: error.message },
        { status: 500 }
      );
    }
  });
}

