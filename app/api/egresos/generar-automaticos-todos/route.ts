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
 */
export async function POST(request: NextRequest) {
  return withFinanzasAuth(request, async (user) => {
    try {
      // Obtener mes actual
      const ahora = new Date();
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const mesActual = `${meses[ahora.getMonth()]} ${ahora.getFullYear()}`;

      // Obtener todos los precios por hora configurados
      const precios = await preciosPorHoraRepository.getAll();
      
      if (precios.length === 0) {
        return NextResponse.json({
          success: true,
          mensaje: 'No hay precios por hora configurados',
          creados: 0,
          totalEgresos: [],
        });
      }

      // Obtener todos los proyectos una vez
      const proyectos = await projectsRepository.getAll();
      
      // Obtener egresos existentes del mes actual para evitar duplicados
      const egresosExistentes = await egresosRepository.getByMes(mesActual);
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
        const teamTasks = await teamTasksRepository.getAll({
          status: 'completed',
          assignee: personaEmail,
        });

        // Obtener todas las features completadas de la persona
        const featuresCompletadas: Array<{ feature: any; projectId: string; projectName: string }> = [];
        for (const proyecto of proyectos) {
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
        }

        // Crear egresos para team tasks completadas
        for (const task of teamTasks) {
          const key = `team-task-${task.id}`;
          if (egresosExistentesMap.has(key)) {
            continue; // Ya existe un egreso para esta tarea
          }

          const horas = task.actualHours || 0;
          if (horas <= 0) {
            continue; // No tiene horas trabajadas
          }

          const subtotal = horas * precioPorHora;
          const total = subtotal; // Sin IVA por defecto

          try {
            const egresoData: Omit<Egreso, 'id'> = {
              lineaNegocio: '',
              categoria: task.category || 'Tareas del Equipo',
              empresa: '',
              equipo: task.assignee || personaEmail,
              concepto: `${task.assignee?.split('@')[0] || personaEmail.split('@')[0]} - ${task.title}`,
              subtotal,
              iva: 0,
              total,
              tipo: 'Variable',
              mes: mesActual,
              status: 'Pendiente',
              tipoEgreso: 'basadoEnHoras',
              persona: task.assignee || personaEmail,
              tarea: task.title,
              horas,
              precioPorHora,
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
            errores.push(`Error creando egreso para tarea ${task.id} de ${personaEmail}: ${error.message}`);
          }
        }

        // Crear egresos para features completadas
        for (const { feature, projectId, projectName } of featuresCompletadas) {
          const key = `feature-${feature.id}`;
          if (egresosExistentesMap.has(key)) {
            continue; // Ya existe un egreso para esta feature
          }

          const horas = feature.actualHours || 0;
          if (horas <= 0) {
            continue; // No tiene horas trabajadas
          }

          const subtotal = horas * precioPorHora;
          const total = subtotal; // Sin IVA por defecto

          try {
            const egresoData: Omit<Egreso, 'id'> = {
              lineaNegocio: '',
              categoria: 'Funcionalidades',
              empresa: projectName,
              equipo: feature.assignee || personaEmail,
              concepto: `${feature.assignee?.split('@')[0] || personaEmail.split('@')[0]} - ${feature.name}`,
              subtotal,
              iva: 0,
              total,
              tipo: 'Variable',
              mes: mesActual,
              status: 'Pendiente',
              tipoEgreso: 'basadoEnHoras',
              persona: feature.assignee || personaEmail,
              tarea: feature.name,
              horas,
              precioPorHora,
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
            errores.push(`Error creando egreso para feature ${feature.id} de ${personaEmail}: ${error.message}`);
          }
        }

        if (egresosPersona > 0) {
          resumenPorPersona.push({
            persona: precio.personaNombre,
            creados: egresosPersona,
          });
        }
      }

      return NextResponse.json({
        success: true,
        creados: totalEgresosCreados.length,
        totalEgresos: totalEgresosCreados,
        resumenPorPersona,
        errores: errores.length > 0 ? errores : undefined,
      });
    } catch (error: any) {
      console.error('[Generar Automáticos Todos API] Error:', error);
      return NextResponse.json(
        { error: 'Error generando egresos automáticos', message: error.message },
        { status: 500 }
      );
    }
  });
}

