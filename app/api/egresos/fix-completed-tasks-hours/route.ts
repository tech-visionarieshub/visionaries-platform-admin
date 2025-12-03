import { NextRequest, NextResponse } from 'next/server';
import { withFinanzasAuth } from '@/lib/api/middleware';
import { teamTasksRepository } from '@/lib/repositories/team-tasks-repository';
import { featuresRepository } from '@/lib/repositories/features-repository';
import { projectsRepository } from '@/lib/repositories/projects-repository';

/**
 * Endpoint para asignar 0.1 horas a tareas/features completadas sin horas
 * NO marca como completadas las tareas/features que tienen horas pero no están completadas
 */
export async function POST(request: NextRequest) {
  return withFinanzasAuth(request, async (user) => {
    try {
      const results = {
        teamTasksHorasAsignadas: 0,
        featuresHorasAsignadas: 0,
        teamTasksErrors: [] as string[],
        featuresErrors: [] as string[],
      };

      console.log('[Fix Tasks] Iniciando actualización...');

      // 1. Procesar team tasks completadas sin horas
      try {
        const completedTasks = await teamTasksRepository.getAll({
          status: 'completed',
        });
        console.log(`[Fix Tasks] Encontradas ${completedTasks.length} tareas completadas`);

        for (const task of completedTasks) {
          // Solo asignar horas si no tiene horas (0, null o undefined)
          const hasHours = task.actualHours && task.actualHours > 0;
          
          if (!hasHours) {
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
        }
      } catch (error: any) {
        console.error('[Fix Tasks] Error obteniendo team tasks:', error);
        results.teamTasksErrors.push(`Error obteniendo team tasks: ${error.message}`);
      }

      // 2. Procesar features completadas sin horas
      try {
        const proyectos = await projectsRepository.getAll();
        console.log(`[Fix Tasks] Encontrados ${proyectos.length} proyectos`);

        for (const proyecto of proyectos) {
          try {
            const features = await featuresRepository.getAll(proyecto.id);
            const completedFeatures = features.filter(
              f => f.status === 'done' || f.status === 'completed'
            );

            console.log(`[Fix Tasks] Proyecto ${proyecto.id}: ${completedFeatures.length} features completadas`);

            for (const feature of completedFeatures) {
              // Solo asignar horas si no tiene horas (0, null o undefined)
              const hasHours = feature.actualHours && feature.actualHours > 0;
              
              if (!hasHours) {
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
            }
          } catch (error: any) {
            results.featuresErrors.push(`Error obteniendo features del proyecto ${proyecto.id}: ${error.message}`);
          }
        }
      } catch (error: any) {
        console.error('[Fix Tasks] Error obteniendo proyectos:', error);
        results.featuresErrors.push(`Error obteniendo proyectos: ${error.message}`);
      }

      const totalUpdated = results.teamTasksHorasAsignadas + results.featuresHorasAsignadas;
      const totalErrors = results.teamTasksErrors.length + results.featuresErrors.length;

      const mensajes: string[] = [];
      if (results.teamTasksHorasAsignadas > 0) {
        mensajes.push(`${results.teamTasksHorasAsignadas} tareas: asignadas 0.1 horas`);
      }
      if (results.featuresHorasAsignadas > 0) {
        mensajes.push(`${results.featuresHorasAsignadas} features: asignadas 0.1 horas`);
      }

      const mensaje = totalUpdated > 0 
        ? `Se actualizaron ${totalUpdated} elementos: ${mensajes.join(', ')}`
        : 'No se encontraron tareas/features completadas sin horas para actualizar';

      console.log('[Fix Tasks] Resultado final:', {
        teamTasksHorasAsignadas: results.teamTasksHorasAsignadas,
        featuresHorasAsignadas: results.featuresHorasAsignadas,
        totalUpdated,
        totalErrors,
      });

      return NextResponse.json({
        success: true,
        data: {
          mensaje,
          teamTasksHorasAsignadas: results.teamTasksHorasAsignadas,
          featuresHorasAsignadas: results.featuresHorasAsignadas,
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

