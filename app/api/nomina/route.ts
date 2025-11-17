import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { nominaRepository } from '@/lib/repositories/nomina-repository';
import type { TeamMember } from '@/lib/mock-data/finanzas';

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { searchParams } = new URL(request.url);
      const formaPago = searchParams.get('formaPago') as TeamMember['formaPago'] | null;

      let nomina;
      if (formaPago) {
        nomina = await nominaRepository.getByFormaPago(formaPago);
      } else {
        nomina = await nominaRepository.getAll();
      }

      return NextResponse.json({ success: true, data: nomina });
    } catch (error: any) {
      console.error('[Nomina API] Error:', error);
      return NextResponse.json(
        { error: 'Error fetching nomina', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json();
      const { id, ...nominaData } = body;

      let member;
      if (id) {
        member = await nominaRepository.createWithId(id, nominaData);
      } else {
        member = await nominaRepository.create(nominaData);
      }

      return NextResponse.json({ success: true, data: member }, { status: 201 });
    } catch (error: any) {
      console.error('[Nomina API] Error:', error);
      return NextResponse.json(
        { error: 'Error creating nomina member', message: error.message },
        { status: 500 }
      );
    }
  });
}

