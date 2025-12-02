import { NextRequest, NextResponse } from 'next/server';
import { withFinanzasAuth } from '@/lib/api/middleware';
import { egresosRepository } from '@/lib/repositories/egresos-repository';
import { teamTasksRepository } from '@/lib/repositories/team-tasks-repository';
import { featuresRepository } from '@/lib/repositories/features-repository';
import { projectsRepository } from '@/lib/repositories/projects-repository';
import type { Egreso } from '@/lib/mock-data/finanzas';

/**
 * Genera egresos automáticamente basados en tareas completadas y funcionalidades done
 * para una persona con precio por hora configurado
 */
export async function POST(request: NextRequest) {
  return withFinanzasAuth(request, async (user) => {
    try {
      const body = await request.json();
      const { personaEmail, precioPorHora } = body;

      if (!personaEmail || !precioPorHora || precioPorHora <= 0) {
        return NextResponse.json(
          { error: 'personaEmail y precioPorHora son requeridos' },
          { status: 400 }
        );
      }

      // Obtener mes actual
      const ahora = new Date();
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                     'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const mesActual = `${meses[ahora.getMonth()]} ${ahora.getFullYear()}`;

      // Obtener todas las tareas completadas de la persona
      const teamTasks = await teamTasksRepository.getAll({
        status: 'completed',
        assignee: personaEmail,
      });

      // Obtener todos los proyectos para buscar features
      const proyectos = await projectsRepository.getAll();
      
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

      const egresosCreados: Egreso[] = [];
      const errores: string[] = [];

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
          egresosCreados.push(egreso);
        } catch (error: any) {
          errores.push(`Error creando egreso para tarea ${task.id}: ${error.message}`);
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
          egresosCreados.push(egreso);
        } catch (error: any) {
          errores.push(`Error creando egreso para feature ${feature.id}: ${error.message}`);
        }
      }

      return NextResponse.json({
        success: true,
        creados: egresosCreados.length,
        egresos: egresosCreados,
        errores: errores.length > 0 ? errores : undefined,
      });
    } catch (error: any) {
      console.error('[Generar Automáticos API] Error:', error);
      return NextResponse.json(
        { error: 'Error generando egresos automáticos', message: error.message },
        { status: 500 }
      );
    }
  });
}

