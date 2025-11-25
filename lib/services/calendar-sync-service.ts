import { projectsRepository } from '@/lib/repositories/projects-repository';
import { featuresRepository } from '@/lib/repositories/features-repository';
import type { CalendarEvent } from './google-calendar-service';

const ADMIN_EMAIL = 'magic@visionarieshub.com';
const WARRANTY_PERIOD_DAYS = 90; // Período de garantía por defecto: 90 días

export interface ProjectEvent {
  id: string;
  type: 'milestone' | 'deadline' | 'meeting' | 'review' | 'warranty';
  title: string;
  description?: string;
  date: Date;
  time?: string;
  attendees?: string[];
  calendarEvent: CalendarEvent;
}

export class CalendarSyncService {
  /**
   * Extrae todos los eventos sincronizables de un proyecto
   */
  async extractProjectEvents(projectId: string): Promise<ProjectEvent[]> {
    const events: ProjectEvent[] = [];

    // Obtener proyecto
    const project = await projectsRepository.getById(projectId);
    if (!project) {
      return events;
    }

    // 1. Milestones del proyecto (fechas importantes)
    events.push(...this.extractMilestones(project));

    // 2. Deadlines de sprints (desde features)
    const sprintDeadlines = await this.extractSprintDeadlines(projectId);
    events.push(...sprintDeadlines);

    // 3. Vencimiento de garantía
    events.push(...this.extractWarrantyEvents(project));

    return events;
  }

  /**
   * Extrae milestones del proyecto (inicio, entrega, etc.)
   */
  private extractMilestones(project: any): ProjectEvent[] {
    const events: ProjectEvent[] = [];

    // Milestone: Inicio del proyecto
    if (project.startDate) {
      const startDate = new Date(project.startDate);
      events.push({
        id: `milestone_start_${project.id}`,
        type: 'milestone',
        title: `Inicio: ${project.name}`,
        description: `Inicio del proyecto ${project.name}`,
        date: startDate,
        time: '09:00',
        attendees: [ADMIN_EMAIL],
        calendarEvent: {
          title: `Inicio: ${project.name}`,
          description: `Inicio del proyecto ${project.name}\nCliente: ${project.client}`,
          start: {
            dateTime: this.formatDateTime(startDate, '09:00'),
            timeZone: 'America/Mexico_City',
          },
          end: {
            dateTime: this.formatDateTime(startDate, '10:00'),
            timeZone: 'America/Mexico_City',
          },
          attendees: [{ email: ADMIN_EMAIL }],
        },
      });
    }

    // Milestone: Entrega del proyecto
    if (project.endDate) {
      const endDate = new Date(project.endDate);
      events.push({
        id: `milestone_end_${project.id}`,
        type: 'milestone',
        title: `Entrega: ${project.name}`,
        description: `Fecha de entrega del proyecto ${project.name}`,
        date: endDate,
        time: '17:00',
        attendees: [ADMIN_EMAIL],
        calendarEvent: {
          title: `Entrega: ${project.name}`,
          description: `Fecha de entrega del proyecto ${project.name}\nCliente: ${project.client}`,
          start: {
            dateTime: this.formatDateTime(endDate, '17:00'),
            timeZone: 'America/Mexico_City',
          },
          end: {
            dateTime: this.formatDateTime(endDate, '18:00'),
            timeZone: 'America/Mexico_City',
          },
          attendees: [{ email: ADMIN_EMAIL }],
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 }, // 24 horas antes
              { method: 'popup', minutes: 60 }, // 1 hora antes
            ],
          },
        },
      });
    }

    return events;
  }

  /**
   * Extrae deadlines de sprints desde las features
   */
  private async extractSprintDeadlines(projectId: string): Promise<ProjectEvent[]> {
    const events: ProjectEvent[] = [];

    try {
      const features = await featuresRepository.getAll(projectId);
      
      // Agrupar features por sprint
      const sprintFeatures = new Map<string, typeof features>();
      features.forEach(feature => {
        if (feature.sprint) {
          if (!sprintFeatures.has(feature.sprint)) {
            sprintFeatures.set(feature.sprint, []);
          }
          sprintFeatures.get(feature.sprint)!.push(feature);
        }
      });

      // Crear evento de deadline para cada sprint
      // Asumimos que el deadline es 2 semanas después del inicio del sprint
      // (esto se puede mejorar con datos reales de sprints)
      sprintFeatures.forEach((sprintFeatures, sprintName) => {
        // Calcular fecha estimada del deadline basada en las horas estimadas
        const totalHours = sprintFeatures.reduce((sum, f) => sum + (f.estimatedHours || 0), 0);
        const estimatedDays = Math.ceil(totalHours / 8); // 8 horas por día
        
        // Usar la fecha de creación más reciente como referencia
        const latestFeature = sprintFeatures.reduce((latest, f) => {
          const fDate = f.createdAt instanceof Date ? f.createdAt : new Date(f.createdAt);
          const lDate = latest.createdAt instanceof Date ? latest.createdAt : new Date(latest.createdAt);
          return fDate > lDate ? f : latest;
        });

        const sprintStartDate = latestFeature.createdAt instanceof Date 
          ? latestFeature.createdAt 
          : new Date(latestFeature.createdAt);
        
        const deadlineDate = new Date(sprintStartDate);
        deadlineDate.setDate(deadlineDate.getDate() + estimatedDays);

        // Solo crear eventos futuros
        if (deadlineDate >= new Date()) {
          const incompleteFeatures = sprintFeatures.filter(
            f => f.status !== 'done' && f.status !== 'completed'
          );

          events.push({
            id: `sprint_deadline_${projectId}_${sprintName}`,
            type: 'deadline',
            title: `Deadline Sprint: ${sprintName}`,
            description: `Deadline del sprint ${sprintName}\n` +
              `Features pendientes: ${incompleteFeatures.length}\n` +
              `Total features: ${sprintFeatures.length}`,
            date: deadlineDate,
            time: '17:00',
            attendees: [ADMIN_EMAIL],
            calendarEvent: {
              title: `Deadline Sprint: ${sprintName}`,
              description: `Deadline del sprint ${sprintName}\n` +
                `Features pendientes: ${incompleteFeatures.length}\n` +
                `Total features: ${sprintFeatures.length}`,
              start: {
                dateTime: this.formatDateTime(deadlineDate, '17:00'),
                timeZone: 'America/Mexico_City',
              },
              end: {
                dateTime: this.formatDateTime(deadlineDate, '18:00'),
                timeZone: 'America/Mexico_City',
              },
              attendees: [{ email: ADMIN_EMAIL }],
              reminders: {
                useDefault: false,
                overrides: [
                  { method: 'email', minutes: 24 * 60 }, // 24 horas antes
                  { method: 'popup', minutes: 60 }, // 1 hora antes
                ],
              },
            },
          });
        }
      });
    } catch (error) {
      console.error('[CalendarSyncService] Error extrayendo deadlines de sprints:', error);
    }

    return events;
  }

  /**
   * Extrae eventos relacionados con la garantía
   */
  private extractWarrantyEvents(project: any): ProjectEvent[] {
    const events: ProjectEvent[] = [];

    if (!project.endDate) {
      return events;
    }

    const endDate = new Date(project.endDate);
    const warrantyExpiryDate = new Date(endDate);
    warrantyExpiryDate.setDate(warrantyExpiryDate.getDate() + WARRANTY_PERIOD_DAYS);

    // Solo crear evento si la garantía aún no ha expirado
    if (warrantyExpiryDate >= new Date()) {
      // Evento de vencimiento de garantía
      events.push({
        id: `warranty_expiry_${project.id}`,
        type: 'warranty',
        title: `Vencimiento Garantía: ${project.name}`,
        description: `Vencimiento del período de garantía del proyecto ${project.name}\n` +
          `Cliente: ${project.client}\n` +
          `Fecha de entrega: ${endDate.toLocaleDateString('es-ES')}`,
        date: warrantyExpiryDate,
        time: '23:59',
        attendees: [ADMIN_EMAIL],
        calendarEvent: {
          title: `Vencimiento Garantía: ${project.name}`,
          description: `Vencimiento del período de garantía del proyecto ${project.name}\n` +
            `Cliente: ${project.client}\n` +
            `Fecha de entrega: ${endDate.toLocaleDateString('es-ES')}`,
          start: {
            dateTime: this.formatDateTime(warrantyExpiryDate, '23:59'),
            timeZone: 'America/Mexico_City',
          },
          end: {
            dateTime: this.formatDateTime(warrantyExpiryDate, '23:59'),
            timeZone: 'America/Mexico_City',
          },
          attendees: [{ email: ADMIN_EMAIL }],
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 7 * 24 * 60 }, // 7 días antes
              { method: 'popup', minutes: 24 * 60 }, // 1 día antes
            ],
          },
        },
      });
    }

    return events;
  }

  /**
   * Formatea una fecha y hora en formato ISO para Google Calendar
   */
  private formatDateTime(date: Date, time: string): string {
    const [hours, minutes] = time.split(':');
    const dateTime = new Date(date);
    dateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    return dateTime.toISOString();
  }
}

export const calendarSyncService = new CalendarSyncService();


