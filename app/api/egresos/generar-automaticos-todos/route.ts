import { NextRequest, NextResponse } from 'next/server';
import { withFinanzasAuth } from '@/lib/api/middleware';
import { preciosPorHoraRepository } from '@/lib/repositories/precios-por-hora-repository';
import { egresosRepository } from '@/lib/repositories/egresos-repository';
import { teamTasksRepository } from '@/lib/repositories/team-tasks-repository';
import { featuresRepository } from '@/lib/repositories/features-repository';
import { projectsRepository } from '@/lib/repositories/projects-repository';
import type { Egreso } from '@/lib/mock-data/finanzas';

/**
 * Genera egresos automáticos para TODAS las personas que tienen precio por hora configurado
 * Busca tareas completadas y funcionalidades done de cada persona
 * 
 * IMPORTANTE: Solo procesa tareas/features que:
 * 1. Tienen status 'completed' o 'done'
 * 2. Tienen actualHours > 0
 * 3. No tienen ya un egreso creado para el mes actual
 */
export async function POST(request: NextRequest) {
  return withFinanzasAuth(request, async (user) => {
    try {
      // Obtener mes actual
      const ahora = new Date();
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const mesActual = `${meses[ahora.getMonth()]} ${ahora.getFullYear()}`;

      console.log(`[Generar Automáticos] Generando egresos para ${mesActual}`);

      // Obtener todos los precios por hora configurados
      let precios;
      try {
        precios = await preciosPorHoraRepository.getAll();
        console.log(`[Generar Automáticos] Encontrados ${precios.length} precios por hora:`, 
          precios.map(p => `${p.personaNombre} (${p.personaEmail}): $${p.precioPorHora}`));
      } catch (error: any) {
        console.error('[Generar Automáticos Todos API] Error obteniendo precios:', error);
        throw new Error(`Error obteniendo precios por hora: ${error.message}`);
      }
      
      if (precios.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            mensaje: 'No hay precios por hora configurados. Ve a Finanzas > Precios por Hora para configurarlos.',
            creados: 0,
            totalEgresos: [],
            resumenPorPersona: [],
            errores: [],
          },
        });
      }

      // Buscar precio de gabypino para asignar tareas sin assignee
      const precioGabypino = precios.find(p => 
        p.personaEmail?.toLowerCase().includes('gabypino') || 
        p.personaNombre?.toLowerCase().includes('gabypino')
      );
      
      console.log(`[Generar Automáticos] Precio gabypino encontrado:`, precioGabypino ? 'Sí' : 'No');

      // Obtener todos los proyectos una vez
      let proyectos;
      try {
        proyectos = await projectsRepository.getAll();
      } catch (error: any) {
        console.error('[Generar Automáticos Todos API] Error obteniendo proyectos:', error);
        throw new Error(`Error obteniendo proyectos: ${error.message}`);
      }
      
      // Obtener egresos existentes del mes actual para evitar duplicados
      let egresosExistentes;
      try {
        egresosExistentes = await egresosRepository.getByMes(mesActual);
      } catch (error: any) {
        console.error('[Generar Automáticos Todos API] Error obteniendo egresos existentes:', error);
        throw new Error(`Error obteniendo egresos existentes: ${error.message}`);
      }
      const egresosExistentesMap = new Map<string, boolean>();
      egresosExistentes.forEach(e => {
        if (e.tareaId) {
          egresosExistentesMap.set(`team-task-${e.tareaId}`, true);
        }
        if (e.featureId) {
          egresosExistentesMap.set(`feature-${e.featureId}`, true);
        }
      });

      const totalEgresosCreados: Egreso[] = [];
      const errores: string[] = [];
      const resumenPorPersona: Array<{ persona: string; creados: number }> = [];

      // Procesar cada persona con precio por hora
      for (const precio of precios) {
        const personaEmail = precio.personaEmail;
        const precioPorHora = precio.precioPorHora;
        let egresosPersona = 0;

        // Obtener todas las tareas completadas de la persona
        let teamTasks;
        try {
          teamTasks = await teamTasksRepository.getAll({
            status: 'completed',
            assignee: personaEmail,
          });
          console.log(`[Generar Automáticos] ${personaEmail}: ${teamTasks.length} tareas completadas`);
        } catch (error: any) {
          console.error(`[Generar Automáticos Todos API] Error obteniendo team tasks para ${personaEmail}:`, error);
          errores.push(`Error obteniendo tareas para ${personaEmail}: ${error.message}`);
          continue; // Continuar con la siguiente persona
        }

        // Obtener todas las features completadas de la persona
        const featuresCompletadas: Array<{ feature: any; projectId: string; projectName: string }> = [];
        for (const proyecto of proyectos) {
          try {
            const features = await featuresRepository.getAll(proyecto.id);
            const completadas = features.filter(
              f => (f.status === 'done' || f.status === 'completed') && 
                   f.assignee === personaEmail
            );
            for (const feature of completadas) {
              featuresCompletadas.push({
                feature,
                projectId: proyecto.id,
                projectName: proyecto.name || proyecto.client || 'Sin nombre',
              });
            }
          } catch (error: any) {
            const errorMsg = `Error obteniendo features para proyecto ${proyecto.id} (${proyecto.name || proyecto.client || 'Sin nombre'}): ${error.message}`;
            console.error(`[Generar Automáticos Todos API] ${errorMsg}`, error);
            errores.push(errorMsg);
            // Continuar con el siguiente proyecto
          }
        }
        
        console.log(`[Generar Automáticos] ${personaEmail}: ${featuresCompletadas.length} features completadas`);

        // Crear egresos para team tasks completadas
        for (const task of teamTasks) {
          const key = `team-task-${task.id}`;
          if (egresosExistentesMap.has(key)) {
            console.log(`[Generar Automáticos] Tarea ${task.id} ya tiene egreso, saltando`);
            continue; // Ya existe un egreso para esta tarea
          }

          const horas = task.actualHours || 0;
          if (horas <= 0) {
            console.log(`[Generar Automáticos] Tarea ${task.id} sin horas (${horas}), saltando`);
            continue; // No tiene horas trabajadas
          }
          
          console.log(`[Generar Automáticos] Procesando tarea ${task.id}: ${task.title}, ${horas} horas`);

          const subtotal = horas * precioPorHora;
          const total = subtotal; // Sin IVA por defecto

          try {
            // Si la tarea no tiene assignee, usar gabypino
            const assigneeFinal = task.assignee || (precioGabypino?.personaEmail || 'gabypino@visionarieshub.com');
            const personaFinal = assigneeFinal || personaEmail;
            
            const egresoData: Omit<Egreso, 'id'> = {
              lineaNegocio: '',
              categoria: task.category || 'Tareas del Equipo',
              empresa: '',
              equipo: personaFinal,
              concepto: `${personaFinal.split('@')[0]} - ${task.title}`,
              subtotal,
              iva: 0,
              total,
              tipo: 'Variable',
              mes: mesActual,
              status: 'Pendiente',
              tipoEgreso: 'basadoEnHoras',
              persona: personaFinal,
              tarea: task.title,
              horas,
              precioPorHora: precioGabypino && !task.assignee ? precioGabypino.precioPorHora : precioPorHora,
              tareaId: task.id,
              tareaTipo: 'team-task',
              aplicarIva: false,
            };

            const egreso = await egresosRepository.create(egresoData);
            totalEgresosCreados.push(egreso);
            egresosPersona++;
            // Agregar a la lista de existentes para evitar duplicados en el mismo batch
            egresosExistentesMap.set(key, true);
          } catch (error: any) {
            const errorMsg = `Error creando egreso para tarea ${task.id} (${task.title}) de ${personaEmail}: ${error.message}`;
            console.error(`[Generar Automáticos] ${errorMsg}`, error);
            errores.push(errorMsg);
          }
        }

        // Crear egresos para features completadas
        for (const { feature, projectId, projectName } of featuresCompletadas) {
          const key = `feature-${feature.id}`;
          if (egresosExistentesMap.has(key)) {
            console.log(`[Generar Automáticos] Feature ${feature.id} ya tiene egreso, saltando`);
            continue; // Ya existe un egreso para esta feature
          }

          const horas = feature.actualHours || 0;
          if (horas <= 0) {
            console.log(`[Generar Automáticos] Feature ${feature.id} sin horas (${horas}), saltando`);
            continue; // No tiene horas trabajadas
          }
          
          // Usar title o name (algunos documentos usan name en lugar de title)
          const featureName = feature.title || feature.name || 'Sin nombre';
          console.log(`[Generar Automáticos] Procesando feature ${feature.id}: ${featureName}, ${horas} horas`);

          const subtotal = horas * precioPorHora;
          const total = subtotal; // Sin IVA por defecto

          try {
            // Si la feature no tiene assignee, usar gabypino
            const assigneeFinal = feature.assignee || (precioGabypino?.personaEmail || 'gabypino@visionarieshub.com');
            const personaFinal = assigneeFinal || personaEmail;
            
            const egresoData: Omit<Egreso, 'id'> = {
              lineaNegocio: '',
              categoria: 'Funcionalidades',
              empresa: projectName,
              equipo: personaFinal,
              concepto: `${personaFinal.split('@')[0]} - ${feature.title || feature.name || 'Funcionalidad'}`,
              subtotal,
              iva: 0,
              total,
              tipo: 'Variable',
              mes: mesActual,
              status: 'Pendiente',
              tipoEgreso: 'basadoEnHoras',
              persona: personaFinal,
              tarea: feature.title || feature.name || 'Funcionalidad',
              horas,
              precioPorHora: precioGabypino && !feature.assignee ? precioGabypino.precioPorHora : precioPorHora,
              featureId: feature.id,
              tareaTipo: 'feature',
              aplicarIva: false,
              proyectoIds: [projectId],
            };

            const egreso = await egresosRepository.create(egresoData);
            totalEgresosCreados.push(egreso);
            egresosPersona++;
            // Agregar a la lista de existentes para evitar duplicados en el mismo batch
            egresosExistentesMap.set(key, true);
          } catch (error: any) {
            const errorMsg = `Error creando egreso para feature ${feature.id} (${feature.title || feature.name || 'Sin nombre'}) de ${personaEmail}: ${error.message}`;
            console.error(`[Generar Automáticos] ${errorMsg}`, error);
            errores.push(errorMsg);
          }
        }

        if (egresosPersona > 0) {
          resumenPorPersona.push({
            persona: precio.personaNombre,
            creados: egresosPersona,
          });
        }
      }

      // Buscar tareas y features sin assignee y asignarlas a gabypino
      if (precioGabypino) {
        try {
          // Buscar todas las tareas completadas sin assignee
          const todasLasTareas = await teamTasksRepository.getAll({
            status: 'completed',
          });
          const tareasSinAssignee = todasLasTareas.filter(t => !t.assignee || t.assignee.trim() === '');
          
          for (const task of tareasSinAssignee) {
            const key = `team-task-${task.id}`;
            if (egresosExistentesMap.has(key)) {
              continue; // Ya existe un egreso para esta tarea
            }

            const horas = task.actualHours || 0;
            if (horas <= 0) {
              continue; // No tiene horas trabajadas
            }

            const subtotal = horas * precioGabypino.precioPorHora;
            const total = subtotal;

            try {
              const egresoData: Omit<Egreso, 'id'> = {
                lineaNegocio: '',
                categoria: task.category || 'Tareas del Equipo',
                empresa: '',
                equipo: precioGabypino.personaEmail,
                concepto: `${precioGabypino.personaEmail.split('@')[0]} - ${task.title}`,
                subtotal,
                iva: 0,
                total,
                tipo: 'Variable',
                mes: mesActual,
                status: 'Pendiente',
                tipoEgreso: 'basadoEnHoras',
                persona: precioGabypino.personaEmail,
                tarea: task.title,
                horas,
                precioPorHora: precioGabypino.precioPorHora,
                tareaId: task.id,
                tareaTipo: 'team-task',
                aplicarIva: false,
              };

              const egreso = await egresosRepository.create(egresoData);
              totalEgresosCreados.push(egreso);
              egresosExistentesMap.set(key, true);
              
              // Actualizar resumen
              const resumenIndex = resumenPorPersona.findIndex(r => r.persona === precioGabypino.personaNombre);
              if (resumenIndex >= 0) {
                resumenPorPersona[resumenIndex].creados++;
              } else {
                resumenPorPersona.push({
                  persona: precioGabypino.personaNombre,
                  creados: 1,
                });
              }
            } catch (error: any) {
              const errorMsg = `Error creando egreso para tarea sin assignee ${task.id} (${task.title}): ${error.message}`;
              console.error(`[Generar Automáticos] ${errorMsg}`, error);
              errores.push(errorMsg);
            }
          }

          // Buscar todas las features completadas sin assignee
          let totalFeaturesSinAssignee = 0;
          let featuresSinAssigneeConHoras = 0;
          for (const proyecto of proyectos) {
            try {
              const features = await featuresRepository.getAll(proyecto.id);
              const completadasSinAssignee = features.filter(
                f => (f.status === 'done' || f.status === 'completed') && 
                     (!f.assignee || f.assignee.trim() === '')
              );
              
              totalFeaturesSinAssignee += completadasSinAssignee.length;
              console.log(`[Generar Automáticos] Proyecto ${proyecto.id}: ${completadasSinAssignee.length} features completadas sin assignee`);
              
              for (const feature of completadasSinAssignee) {
                const key = `feature-${feature.id}`;
                if (egresosExistentesMap.has(key)) {
                  console.log(`[Generar Automáticos] Feature sin assignee ${feature.id} ya tiene egreso, saltando`);
                  continue; // Ya existe un egreso para esta feature
                }

                const horas = feature.actualHours || 0;
                console.log(`[Generar Automáticos] Feature sin assignee ${feature.id}: status=${feature.status}, horas=${horas}, assignee=${feature.assignee || 'sin assignee'}`);
                
                if (horas <= 0) {
                  console.log(`[Generar Automáticos] Feature sin assignee ${feature.id} sin horas (${horas}), saltando`);
                  continue; // No tiene horas trabajadas
                }
                
                featuresSinAssigneeConHoras++;

                const subtotal = horas * precioGabypino.precioPorHora;
                const total = subtotal;

                try {
                  const egresoData: Omit<Egreso, 'id'> = {
                    lineaNegocio: '',
                    categoria: 'Funcionalidades',
                    empresa: proyecto.name || proyecto.client || 'Sin nombre',
                    equipo: precioGabypino.personaEmail,
                    concepto: `${precioGabypino.personaEmail.split('@')[0]} - ${feature.title || feature.name || 'Funcionalidad'}`,
                    subtotal,
                    iva: 0,
                    total,
                    tipo: 'Variable',
                    mes: mesActual,
                    status: 'Pendiente',
                    tipoEgreso: 'basadoEnHoras',
                    persona: precioGabypino.personaEmail,
                    tarea: feature.title || feature.name || 'Funcionalidad',
                    horas,
                    precioPorHora: precioGabypino.precioPorHora,
                    featureId: feature.id,
                    tareaTipo: 'feature',
                    aplicarIva: false,
                    proyectoIds: [proyecto.id],
                  };

                  const egreso = await egresosRepository.create(egresoData);
                  totalEgresosCreados.push(egreso);
                  egresosExistentesMap.set(key, true);
                  
                  // Actualizar resumen
                  const resumenIndex = resumenPorPersona.findIndex(r => r.persona === precioGabypino.personaNombre);
                  if (resumenIndex >= 0) {
                    resumenPorPersona[resumenIndex].creados++;
                  } else {
                    resumenPorPersona.push({
                      persona: precioGabypino.personaNombre,
                      creados: 1,
                    });
                  }
                } catch (error: any) {
                  const errorMsg = `Error creando egreso para feature sin assignee ${feature.id} (${feature.title || feature.name || 'Sin nombre'}): ${error.message}`;
                  console.error(`[Generar Automáticos] ${errorMsg}`, error);
                  errores.push(errorMsg);
                }
              }
            } catch (error: any) {
              const errorMsg = `Error obteniendo features sin assignee para proyecto ${proyecto.id} (${proyecto.name || proyecto.client || 'Sin nombre'}): ${error.message}`;
              console.error(`[Generar Automáticos Todos API] ${errorMsg}`, error);
              errores.push(errorMsg);
            }
          }
          
          console.log(`[Generar Automáticos] Resumen features sin assignee: ${totalFeaturesSinAssignee} total, ${featuresSinAssigneeConHoras} con horas`);
        } catch (error: any) {
          console.error('[Generar Automáticos Todos API] Error procesando tareas/features sin assignee:', error);
          errores.push(`Error procesando tareas/features sin assignee: ${error.message}`);
        }
      }

      const mensaje = totalEgresosCreados.length > 0 
        ? `Se generaron ${totalEgresosCreados.length} egresos automáticos exitosamente`
        : 'No se generaron nuevos egresos. Verifica que haya tareas/features completadas con horas trabajadas y precios por hora configurados.';

      console.log('[Generar Automáticos Todos API] Resultado final:', {
        creados: totalEgresosCreados.length,
        resumenPorPersona: resumenPorPersona.length,
        errores: errores.length,
        mensaje,
      });

      return NextResponse.json({
        success: true,
        data: {
          mensaje,
          creados: totalEgresosCreados.length,
          totalEgresos: totalEgresosCreados,
          resumenPorPersona: resumenPorPersona,
          errores: errores.length > 0 ? errores : undefined,
        },
      });
    } catch (error: any) {
      console.error('[Generar Automáticos Todos API] Error:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Error generando egresos automáticos', 
          message: error.message,
          data: {
            mensaje: error.message,
            creados: 0,
            totalEgresos: [],
            resumenPorPersona: [],
            errores: [error.message],
          },
        },
        { status: 500 }
      );
    }
  });
}

