import { NextRequest, NextResponse } from 'next/server';
import { withFinanzasAuth } from '@/lib/api/middleware';
import { preciosPorHoraRepository } from '@/lib/repositories/precios-por-hora-repository';
import { teamTasksRepository } from '@/lib/repositories/team-tasks-repository';
import { featuresRepository } from '@/lib/repositories/features-repository';
import { projectsRepository } from '@/lib/repositories/projects-repository';
import { egresosRepository } from '@/lib/repositories/egresos-repository';

/**
 * Endpoint de debug para ver exactamente qué se procesaría
 */
export async function GET(request: NextRequest) {
  return withFinanzasAuth(request, async (user) => {
    try {
      const debug: any = {
        mesActual: '',
        precios: [],
        proyectos: [],
        egresosExistentes: {
          total: 0,
          conTareaId: 0,
          conFeatureId: 0,
        },
        tareasCompletadas: [],
        featuresCompletadas: [],
        tareasAProcesar: [],
        featuresAProcesar: [],
        errores: [],
      };

      // Mes actual
      const ahora = new Date();
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      debug.mesActual = `${meses[ahora.getMonth()]} ${ahora.getFullYear()}`;

      // 1. Obtener precios
      const precios = await preciosPorHoraRepository.getAll();
      debug.precios = precios.map(p => ({
        email: p.personaEmail,
        nombre: p.personaNombre,
        precio: p.precioPorHora,
      }));

      // 2. Obtener proyectos
      const proyectos = await projectsRepository.getAll();
      debug.proyectos = proyectos.map(p => ({
        id: p.id,
        name: p.name,
        client: p.client,
      }));

      // 3. Obtener egresos existentes del mes
      const egresosExistentes = await egresosRepository.getByMes(debug.mesActual);
      debug.egresosExistentes.total = egresosExistentes.length;
      debug.egresosExistentes.conTareaId = egresosExistentes.filter(e => e.tareaId).length;
      debug.egresosExistentes.conFeatureId = egresosExistentes.filter(e => e.featureId).length;

      const egresosMap = new Map<string, boolean>();
      egresosExistentes.forEach(e => {
        if (e.tareaId) egresosMap.set(`team-task-${e.tareaId}`, true);
        if (e.featureId) egresosMap.set(`feature-${e.featureId}`, true);
      });

      // 4. Obtener tareas completadas
      for (const precio of precios) {
        try {
          const tareas = await teamTasksRepository.getAll({
            status: 'completed',
            assignee: precio.personaEmail,
          });
          
          for (const t of tareas) {
            debug.tareasCompletadas.push({
              id: t.id,
              title: t.title,
              assignee: t.assignee,
              actualHours: t.actualHours,
              status: t.status,
            });
            
            const key = `team-task-${t.id}`;
            const yaExiste = egresosMap.has(key);
            const tieneHoras = t.actualHours && t.actualHours > 0;
            
            if (!yaExiste && tieneHoras) {
              debug.tareasAProcesar.push({
                id: t.id,
                title: t.title,
                assignee: t.assignee,
                horas: t.actualHours,
                precio: precio.precioPorHora,
                total: (t.actualHours || 0) * precio.precioPorHora,
              });
            }
          }
        } catch (error: any) {
          debug.errores.push(`Error obteniendo tareas para ${precio.personaEmail}: ${error.message}`);
        }
      }

      // 5. Obtener features completadas
      for (const precio of precios) {
        for (const proyecto of proyectos) {
          try {
            const features = await featuresRepository.getAll(proyecto.id);
            const completadas = features.filter(
              f => (f.status === 'done' || f.status === 'completed') && 
                   f.assignee === precio.personaEmail
            );
            
            for (const f of completadas) {
              debug.featuresCompletadas.push({
                id: f.id,
                projectId: proyecto.id,
                title: f.title,
                assignee: f.assignee,
                actualHours: f.actualHours,
                status: f.status,
              });
              
              const key = `feature-${f.id}`;
              const yaExiste = egresosMap.has(key);
              const tieneHoras = f.actualHours && f.actualHours > 0;
              
              if (!yaExiste && tieneHoras) {
                debug.featuresAProcesar.push({
                  id: f.id,
                  projectId: proyecto.id,
                  projectName: proyecto.name,
                  title: f.title,
                  assignee: f.assignee,
                  horas: f.actualHours,
                  precio: precio.precioPorHora,
                  total: (f.actualHours || 0) * precio.precioPorHora,
                });
              }
            }
          } catch (error: any) {
            debug.errores.push(`Error obteniendo features de proyecto ${proyecto.id} (${proyecto.name}): ${error.message}`);
          }
        }
      }

      // Resumen
      debug.resumen = {
        tareasCompletadasTotal: debug.tareasCompletadas.length,
        tareasAProcesarTotal: debug.tareasAProcesar.length,
        featuresCompletadasTotal: debug.featuresCompletadas.length,
        featuresAProcesarTotal: debug.featuresAProcesar.length,
        erroresTotal: debug.errores.length,
      };

      return NextResponse.json({
        success: true,
        data: debug,
      });
    } catch (error: any) {
      console.error('[Debug Generación] Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }
  });
}

