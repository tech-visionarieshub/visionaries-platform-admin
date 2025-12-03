import { NextRequest, NextResponse } from 'next/server';
import { withFinanzasAuth } from '@/lib/api/middleware';
import { teamTasksRepository } from '@/lib/repositories/team-tasks-repository';
import { featuresRepository } from '@/lib/repositories/features-repository';
import { projectsRepository } from '@/lib/repositories/projects-repository';

/**
 * Endpoint para actualizar tareas y features completadas sin horas
 * Les asigna 0.1 horas por defecto
 */
export async function POST(request: NextRequest) {
  return withFinanzasAuth(request, async (user) => {
    try {
      const results = {
        teamTasksUpdated: 0,
        featuresUpdated: 0,
        teamTasksErrors: [] as string[],
        featuresErrors: [] as string[],
      };

      console.log('[Fix Completed Tasks Hours] Iniciando actualización...');

      // 1. Buscar y actualizar team tasks completadas sin horas
      try {
        const completedTasks = await teamTasksRepository.getAll({
          status: 'completed',
        });

        console.log(`[Fix Completed Tasks Hours] Encontradas ${completedTasks.length} tareas completadas`);

        for (const task of completedTasks) {
          // Verificar si actualHours es 0, null o undefined
          const needsUpdate = !task.actualHours || task.actualHours === 0;

          if (needsUpdate) {
            try {
              await teamTasksRepository.update(task.id, {
                actualHours: 0.1,
              });
              results.teamTasksUpdated++;
              console.log(`[Fix Completed Tasks Hours] Actualizada tarea ${task.id}: ${task.title}`);
            } catch (error: any) {
              const errorMsg = `Error actualizando tarea ${task.id}: ${error.message}`;
              results.teamTasksErrors.push(errorMsg);
              console.error(`[Fix Completed Tasks Hours] ${errorMsg}`);
            }
          }
        }
      } catch (error: any) {
        console.error('[Fix Completed Tasks Hours] Error obteniendo team tasks:', error);
        results.teamTasksErrors.push(`Error obteniendo team tasks: ${error.message}`);
      }

      // 2. Buscar y actualizar features completadas sin horas
      try {
        const proyectos = await projectsRepository.getAll();
        console.log(`[Fix Completed Tasks Hours] Encontrados ${proyectos.length} proyectos`);

        for (const proyecto of proyectos) {
          try {
            const features = await featuresRepository.getAll(proyecto.id);
            const completedFeatures = features.filter(
              f => (f.status === 'done' || f.status === 'completed')
            );

            console.log(`[Fix Completed Tasks Hours] Proyecto ${proyecto.id}: ${completedFeatures.length} features completadas`);

            for (const feature of completedFeatures) {
              // Verificar si actualHours es 0, null o undefined
              const needsUpdate = !feature.actualHours || feature.actualHours === 0;

              if (needsUpdate) {
                try {
                  await featuresRepository.update(proyecto.id, feature.id, {
                    actualHours: 0.1,
                  });
                  results.featuresUpdated++;
                  console.log(`[Fix Completed Tasks Hours] Actualizada feature ${feature.id} en proyecto ${proyecto.id}`);
                } catch (error: any) {
                  const errorMsg = `Error actualizando feature ${feature.id} en proyecto ${proyecto.id}: ${error.message}`;
                  results.featuresErrors.push(errorMsg);
                  console.error(`[Fix Completed Tasks Hours] ${errorMsg}`);
                }
              }
            }
          } catch (error: any) {
            const errorMsg = `Error obteniendo features del proyecto ${proyecto.id}: ${error.message}`;
            results.featuresErrors.push(errorMsg);
            console.error(`[Fix Completed Tasks Hours] ${errorMsg}`);
          }
        }
      } catch (error: any) {
        console.error('[Fix Completed Tasks Hours] Error obteniendo proyectos:', error);
        results.featuresErrors.push(`Error obteniendo proyectos: ${error.message}`);
      }

      const totalUpdated = results.teamTasksUpdated + results.featuresUpdated;
      const totalErrors = results.teamTasksErrors.length + results.featuresErrors.length;

      console.log('[Fix Completed Tasks Hours] Resultado final:', {
        teamTasksUpdated: results.teamTasksUpdated,
        featuresUpdated: results.featuresUpdated,
        totalUpdated,
        totalErrors,
      });

      return NextResponse.json({
        success: true,
        data: {
          mensaje: `Se actualizaron ${totalUpdated} tareas/features completadas sin horas (${results.teamTasksUpdated} team tasks, ${results.featuresUpdated} features)`,
          teamTasksUpdated: results.teamTasksUpdated,
          featuresUpdated: results.featuresUpdated,
          totalUpdated,
          errores: totalErrors > 0 ? {
            teamTasks: results.teamTasksErrors,
            features: results.featuresErrors,
          } : undefined,
        },
      });
    } catch (error: any) {
      console.error('[Fix Completed Tasks Hours] Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Error actualizando tareas/features completadas',
          message: error.message,
          data: {
            mensaje: error.message,
            teamTasksUpdated: 0,
            featuresUpdated: 0,
            totalUpdated: 0,
            errores: [error.message],
          },
        },
        { status: 500 }
      );
    }
  });
}

