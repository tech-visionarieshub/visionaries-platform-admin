import { NextRequest, NextResponse } from 'next/server';
import { withFinanzasAuth } from '@/lib/api/middleware';
import { preciosPorHoraRepository } from '@/lib/repositories/precios-por-hora-repository';
import { teamTasksRepository } from '@/lib/repositories/team-tasks-repository';
import { featuresRepository } from '@/lib/repositories/features-repository';
import { projectsRepository } from '@/lib/repositories/projects-repository';
import { egresosRepository } from '@/lib/repositories/egresos-repository';

/**
 * Endpoint de diagnóstico para ver el estado de tareas, features y precios por hora
 */
export async function GET(request: NextRequest) {
  return withFinanzasAuth(request, async (user) => {
    try {
      const diagnostico: any = {
        precios: {
          total: 0,
          lista: [] as any[],
        },
        teamTasks: {
          total: 0,
          porStatus: {} as Record<string, number>,
          conHoras: 0,
          sinHoras: 0,
          completadasConHoras: 0,
          completadasSinHoras: 0,
          ejemplos: [] as any[],
        },
        features: {
          total: 0,
          porStatus: {} as Record<string, number>,
          conHoras: 0,
          sinHoras: 0,
          completadasConHoras: 0,
          completadasSinHoras: 0,
          ejemplos: [] as any[],
        },
        egresos: {
          total: 0,
          basadosEnHoras: 0,
          porMes: {} as Record<string, number>,
        },
        proyectos: {
          total: 0,
        },
      };

      // 1. Obtener precios por hora
      try {
        const precios = await preciosPorHoraRepository.getAll();
        diagnostico.precios.total = precios.length;
        diagnostico.precios.lista = precios.map(p => ({
          personaEmail: p.personaEmail,
          personaNombre: p.personaNombre,
          precioPorHora: p.precioPorHora,
        }));
      } catch (error: any) {
        diagnostico.precios.error = error.message;
      }

      // 2. Obtener team tasks
      try {
        const allTasks = await teamTasksRepository.getAll({});
        diagnostico.teamTasks.total = allTasks.length;

        for (const task of allTasks) {
          // Contar por status
          const status = task.status || 'sin-status';
          diagnostico.teamTasks.porStatus[status] = (diagnostico.teamTasks.porStatus[status] || 0) + 1;

          // Contar con/sin horas
          if (task.actualHours && task.actualHours > 0) {
            diagnostico.teamTasks.conHoras++;
            if (task.status === 'completed') {
              diagnostico.teamTasks.completadasConHoras++;
            }
          } else {
            diagnostico.teamTasks.sinHoras++;
            if (task.status === 'completed') {
              diagnostico.teamTasks.completadasSinHoras++;
            }
          }
        }

        // Agregar ejemplos de tareas con horas
        diagnostico.teamTasks.ejemplos = allTasks
          .filter(t => t.actualHours && t.actualHours > 0)
          .slice(0, 5)
          .map(t => ({
            id: t.id,
            title: t.title,
            status: t.status,
            assignee: t.assignee,
            actualHours: t.actualHours,
          }));
      } catch (error: any) {
        diagnostico.teamTasks.error = error.message;
      }

      // 3. Obtener features de todos los proyectos
      try {
        const proyectos = await projectsRepository.getAll();
        diagnostico.proyectos.total = proyectos.length;

        for (const proyecto of proyectos) {
          try {
            const features = await featuresRepository.getAll(proyecto.id);
            diagnostico.features.total += features.length;

            for (const feature of features) {
              // Contar por status
              const status = feature.status || 'sin-status';
              diagnostico.features.porStatus[status] = (diagnostico.features.porStatus[status] || 0) + 1;

              // Contar con/sin horas
              if (feature.actualHours && feature.actualHours > 0) {
                diagnostico.features.conHoras++;
                if (feature.status === 'done' || feature.status === 'completed') {
                  diagnostico.features.completadasConHoras++;
                }
              } else {
                diagnostico.features.sinHoras++;
                if (feature.status === 'done' || feature.status === 'completed') {
                  diagnostico.features.completadasSinHoras++;
                }
              }
            }

            // Agregar ejemplos de features con horas
            const featuresConHoras = features
              .filter(f => f.actualHours && f.actualHours > 0)
              .slice(0, 3)
              .map(f => ({
                id: f.id,
                projectId: proyecto.id,
                title: f.title,
                status: f.status,
                assignee: f.assignee,
                actualHours: f.actualHours,
              }));
            diagnostico.features.ejemplos.push(...featuresConHoras);
          } catch (error: any) {
            // Continuar con el siguiente proyecto
          }
        }

        // Limitar ejemplos a 5
        diagnostico.features.ejemplos = diagnostico.features.ejemplos.slice(0, 5);
      } catch (error: any) {
        diagnostico.features.error = error.message;
      }

      // 4. Obtener egresos
      try {
        const egresos = await egresosRepository.getAll();
        diagnostico.egresos.total = egresos.length;
        diagnostico.egresos.basadosEnHoras = egresos.filter(e => e.tipoEgreso === 'basadoEnHoras').length;

        for (const egreso of egresos) {
          const mes = egreso.mes || 'sin-mes';
          diagnostico.egresos.porMes[mes] = (diagnostico.egresos.porMes[mes] || 0) + 1;
        }
      } catch (error: any) {
        diagnostico.egresos.error = error.message;
      }

      // 5. Resumen y recomendaciones
      diagnostico.resumen = {
        puedeGenerarEgresos: diagnostico.precios.total > 0 && 
          (diagnostico.teamTasks.completadasConHoras > 0 || diagnostico.features.completadasConHoras > 0),
        razonesNoGenera: [] as string[],
      };

      if (diagnostico.precios.total === 0) {
        diagnostico.resumen.razonesNoGenera.push('No hay precios por hora configurados');
      }
      if (diagnostico.teamTasks.completadasConHoras === 0 && diagnostico.features.completadasConHoras === 0) {
        diagnostico.resumen.razonesNoGenera.push('No hay tareas/features completadas con horas trabajadas');
      }
      if (diagnostico.teamTasks.completadasSinHoras > 0) {
        diagnostico.resumen.razonesNoGenera.push(`Hay ${diagnostico.teamTasks.completadasSinHoras} tareas completadas SIN horas - usar "Arreglar Horas"`);
      }
      if (diagnostico.features.completadasSinHoras > 0) {
        diagnostico.resumen.razonesNoGenera.push(`Hay ${diagnostico.features.completadasSinHoras} features completadas SIN horas - usar "Arreglar Horas"`);
      }

      // Tareas con horas pero no completadas
      const tareasConHorasNoCompletadas = diagnostico.teamTasks.conHoras - diagnostico.teamTasks.completadasConHoras;
      if (tareasConHorasNoCompletadas > 0) {
        diagnostico.resumen.razonesNoGenera.push(`Hay ${tareasConHorasNoCompletadas} tareas CON horas pero NO completadas`);
      }

      const featuresConHorasNoCompletadas = diagnostico.features.conHoras - diagnostico.features.completadasConHoras;
      if (featuresConHorasNoCompletadas > 0) {
        diagnostico.resumen.razonesNoGenera.push(`Hay ${featuresConHorasNoCompletadas} features CON horas pero NO completadas`);
      }

      return NextResponse.json({
        success: true,
        data: diagnostico,
      });
    } catch (error: any) {
      console.error('[Diagnóstico API] Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Error obteniendo diagnóstico',
          message: error.message,
        },
        { status: 500 }
      );
    }
  });
}

