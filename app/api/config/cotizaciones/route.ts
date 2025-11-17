import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { configRepository } from '@/lib/repositories/config-repository';
import type { CotizacionesConfig } from '@/lib/mock-data/cotizaciones-config';

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const config = await configRepository.get();

      if (!config) {
        // Retornar configuración por defecto si no existe
        return NextResponse.json({
          success: true,
          data: {
            tarifas: {
              desarrolladorMin: 800,
              gabyMin: 1000,
            },
            porcentajes: {
              impuestos: 2,
              arely: 5,
              desarrollador: 27,
              gastosOperativos: 18.15,
              marketing: 3,
              ahorro: 5,
              gaby: 40,
            },
            reglas: {
              mensualidadMinima: 64000,
              horasTrabajoSemana: 20,
              costoPrototipadoUSD: 600,
              tipoCambioUSD: 20,
            },
          } as CotizacionesConfig,
        });
      }

      return NextResponse.json({ success: true, data: config });
    } catch (error: any) {
      console.error('[Config API] Error:', error);
      return NextResponse.json(
        { error: 'Error fetching config', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function PUT(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json();
      const config = await configRepository.save(body);

      return NextResponse.json({ success: true, data: config });
    } catch (error: any) {
      console.error('[Config API] Error:', error);
      return NextResponse.json(
        { error: 'Error saving config', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function DELETE(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      await configRepository.reset();

      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error('[Config API] Error:', error);
      return NextResponse.json(
        { error: 'Error resetting config', message: error.message },
        { status: 500 }
      );
    }
  });
}

