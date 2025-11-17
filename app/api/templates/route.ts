import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { templatesRepository } from '@/lib/repositories/templates-repository';
import type { CotizacionTemplate } from '@/lib/mock-data/cotizaciones-templates';

export async function GET(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { searchParams } = new URL(request.url);
      const tipoProyecto = searchParams.get('tipoProyecto') as CotizacionTemplate['tipoProyecto'] | null;
      const predefinido = searchParams.get('predefinido');

      let templates;
      if (tipoProyecto) {
        templates = await templatesRepository.getByTipoProyecto(tipoProyecto);
      } else if (predefinido === 'true') {
        templates = await templatesRepository.getPredefinidos();
      } else {
        templates = await templatesRepository.getAll();
      }

      return NextResponse.json({ success: true, data: templates });
    } catch (error: any) {
      console.error('[Templates API] Error:', error);
      return NextResponse.json(
        { error: 'Error fetching templates', message: error.message },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const body = await request.json();
      const { id, ...templateData } = body;

      let template;
      if (id) {
        template = await templatesRepository.createWithId(id, templateData);
      } else {
        template = await templatesRepository.create(templateData);
      }

      return NextResponse.json({ success: true, data: template }, { status: 201 });
    } catch (error: any) {
      console.error('[Templates API] Error:', error);
      return NextResponse.json(
        { error: 'Error creating template', message: error.message },
        { status: 500 }
      );
    }
  });
}

