import { NextRequest, NextResponse } from 'next/server';
import { withFinanzasAuth } from '@/lib/api/middleware';
import { teamTasksRepository } from '@/lib/repositories/team-tasks-repository';
import { featuresRepository } from '@/lib/repositories/features-repository';
import { projectsRepository } from '@/lib/repositories/projects-repository';

/**
 * Endpoint para:
 * 1. Asignar 0.1 horas a tareas/features completadas sin horas
 * 2. Marcar como completadas las tareas/features que tienen horas pero no están completadas
 */
export async function POST(request: NextRequest) {
  return withFinanzasAuth(request, async (user) => {
    try {
      const results = {
        teamTasksHorasAsignadas: 0,
        teamTasksCompletadas: 0,
        featuresHorasAsignadas: 0,
        featuresCompletadas: 0,
        teamTasksErrors: [] as string[],
        featuresErrors: [] as string[],
      };

      console.log('[Fix Tasks] Iniciando actualización...');

      // 1. Procesar team tasks
      try {
        // Obtener TODAS las tareas (no solo completadas)
        const allTasks = await teamTasksRepository.getAll({});
        console.log(`[Fix Tasks] Encontradas ${allTasks.length} tareas totales`);

        for (const task of allTasks) {
          const isCompleted = task.status === 'completed';
          const hasHours = task.actualHours && task.actualHours > 0;

          // Caso 1: Tarea completada sin horas -> asignar 0.1 horas
          if (isCompleted && !hasHours) {
            try {
              await teamTasksRepository.update(task.id, {
                actualHours: 0.1,
              });
              results.teamTasksHorasAsignadas++;
              console.log(`[Fix Tasks] Asignadas 0.1 horas a tarea completada ${task.id}: ${task.title}`);
            } catch (error: any) {
              results.teamTasksErrors.push(`Error asignando horas a tarea ${task.id}: ${error.message}`);
            }
          }
          // Caso 2: Tarea con horas pero no completada -> marcar como completada
          else if (!isCompleted && hasHours) {
            try {
              await teamTasksRepository.update(task.id, {
                status: 'completed',
              });
              results.teamTasksCompletadas++;
              console.log(`[Fix Tasks] Marcada como completada tarea ${task.id}: ${task.title} (tenía ${task.actualHours} horas)`);
            } catch (error: any) {
              results.teamTasksErrors.push(`Error completando tarea ${task.id}: ${error.message}`);
            }
          }
        }
      } catch (error: any) {
        console.error('[Fix Tasks] Error obteniendo team tasks:', error);
        results.teamTasksErrors.push(`Error obteniendo team tasks: ${error.message}`);
      }

      // 2. Procesar features de todos los proyectos
      try {
        const proyectos = await projectsRepository.getAll();
        console.log(`[Fix Tasks] Encontrados ${proyectos.length} proyectos`);

        for (const proyecto of proyectos) {
          try {
            const features = await featuresRepository.getAll(proyecto.id);

            for (const feature of features) {
              const isCompleted = feature.status === 'done' || feature.status === 'completed';
              const hasHours = feature.actualHours && feature.actualHours > 0;

              // Caso 1: Feature completada sin horas -> asignar 0.1 horas
              if (isCompleted && !hasHours) {
                try {
                  await featuresRepository.update(proyecto.id, feature.id, {
                    actualHours: 0.1,
                  });
                  results.featuresHorasAsignadas++;
                  console.log(`[Fix Tasks] Asignadas 0.1 horas a feature completada ${feature.id}`);
                } catch (error: any) {
                  results.featuresErrors.push(`Error asignando horas a feature ${feature.id}: ${error.message}`);
                }
              }
              // Caso 2: Feature con horas pero no completada -> marcar como completada
              else if (!isCompleted && hasHours) {
                try {
                  await featuresRepository.update(proyecto.id, feature.id, {
                    status: 'done',
                  });
                  results.featuresCompletadas++;
                  console.log(`[Fix Tasks] Marcada como completada feature ${feature.id} (tenía ${feature.actualHours} horas)`);
                } catch (error: any) {
                  results.featuresErrors.push(`Error completando feature ${feature.id}: ${error.message}`);
                }
              }
            }
          } catch (error: any) {
            results.featuresErrors.push(`Error obteniendo features del proyecto ${proyecto.id}: ${error.message}`);
          }
        }
      } catch (error: any) {
        console.error('[Fix Tasks] Error obteniendo proyectos:', error);
        results.featuresErrors.push(`Error obteniendo proyectos: ${error.message}`);
      }

      const totalUpdated = results.teamTasksHorasAsignadas + results.teamTasksCompletadas + 
                          results.featuresHorasAsignadas + results.featuresCompletadas;
      const totalErrors = results.teamTasksErrors.length + results.featuresErrors.length;

      const mensajes: string[] = [];
      if (results.teamTasksHorasAsignadas > 0) {
        mensajes.push(`${results.teamTasksHorasAsignadas} tareas: asignadas 0.1 horas`);
      }
      if (results.teamTasksCompletadas > 0) {
        mensajes.push(`${results.teamTasksCompletadas} tareas: marcadas como completadas`);
      }
      if (results.featuresHorasAsignadas > 0) {
        mensajes.push(`${results.featuresHorasAsignadas} features: asignadas 0.1 horas`);
      }
      if (results.featuresCompletadas > 0) {
        mensajes.push(`${results.featuresCompletadas} features: marcadas como completadas`);
      }

      const mensaje = totalUpdated > 0 
        ? `Se actualizaron ${totalUpdated} elementos: ${mensajes.join(', ')}`
        : 'No se encontraron tareas/features que necesiten actualización';

      console.log('[Fix Tasks] Resultado final:', {
        teamTasksHorasAsignadas: results.teamTasksHorasAsignadas,
        teamTasksCompletadas: results.teamTasksCompletadas,
        featuresHorasAsignadas: results.featuresHorasAsignadas,
        featuresCompletadas: results.featuresCompletadas,
        totalUpdated,
        totalErrors,
      });

      return NextResponse.json({
        success: true,
        data: {
          mensaje,
          teamTasksHorasAsignadas: results.teamTasksHorasAsignadas,
          teamTasksCompletadas: results.teamTasksCompletadas,
          featuresHorasAsignadas: results.featuresHorasAsignadas,
          featuresCompletadas: results.featuresCompletadas,
          totalUpdated,
          errores: totalErrors > 0 ? {
            teamTasks: results.teamTasksErrors,
            features: results.featuresErrors,
          } : undefined,
        },
      });
    } catch (error: any) {
      console.error('[Fix Tasks] Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Error actualizando tareas/features',
          message: error.message,
          data: {
            mensaje: error.message,
            totalUpdated: 0,
            errores: [error.message],
          },
        },
        { status: 500 }
      );
    }
  });
}

