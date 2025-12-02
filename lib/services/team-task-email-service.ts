/**
 * Servicio para enviar emails relacionados con tareas del equipo
 */

import { gmailService, type EmailMessage } from './gmail-service'
import type { TeamTask } from '@/types/team-task'
import { getInternalFirestore } from '@/lib/firebase/admin-platform'

interface TaskEmailData {
  task: TeamTask
  assigneeEmail: string
  creatorEmail: string
  assigneeName?: string
  creatorName?: string
}

/**
 * Genera el template HTML del email de nueva tarea asignada
 */
function generateTaskAssignedEmailHTML(data: TaskEmailData): string {
  const { task, assigneeName, creatorName } = data
  
  // Formatear prioridad
  const priorityConfig = {
    high: { label: 'Alta', color: '#fee2e2', textColor: '#dc2626' },
    medium: { label: 'Media', color: '#fef3c7', textColor: '#92400e' },
    low: { label: 'Baja', color: '#d1fae5', textColor: '#065f46' },
  }
  const priority = priorityConfig[task.priority] || priorityConfig.medium
  
  // Formatear fecha límite
  let dueDateHTML = ''
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate)
    const formattedDate = dueDate.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Mexico_City',
    })
    
    // Calcular días de retraso
    const today = new Date()
    const todayInMexico = new Date(today.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }))
    const dueInMexico = new Date(dueDate.toLocaleString('en-US', { timeZone: 'America/Mexico_City' }))
    const todayDate = new Date(todayInMexico.getFullYear(), todayInMexico.getMonth(), todayInMexico.getDate())
    const dueDateOnly = new Date(dueInMexico.getFullYear(), dueInMexico.getMonth(), dueInMexico.getDate())
    const diffDays = Math.floor((todayDate.getTime() - dueDateOnly.getTime()) / (1000 * 60 * 60 * 24))
    
    dueDateHTML = `
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Fecha Límite:</td>
            <td style="padding: 8px 0; color: #1f2937;">
              <strong>${formattedDate}</strong>
              ${diffDays > 0 && task.status !== 'completed' && task.status !== 'cancelled' ? `
              <span style="background: #fee2e2; color: #dc2626; padding: 4px 8px; border-radius: 8px; font-size: 12px; margin-left: 8px;">
                ⚠️ ${diffDays} día${diffDays !== 1 ? 's' : ''} de retraso
              </span>
              ` : ''}
            </td>
          </tr>
    `
  }
  
  // URL de la tarea (asumiendo que la plataforma está en admin.visionarieshub.com)
  const taskUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://admin.visionarieshub.com'}/equipo`
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="background: linear-gradient(135deg, #4514F9 0%, #6B46C1 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">📋 Nueva Tarea Asignada</h1>
  </div>
  
  <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Hola <strong>${assigneeName || data.assigneeEmail}</strong>,
    </p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      <strong>${creatorName || data.creatorEmail}</strong> te ha asignado una nueva tarea en el sistema de gestión de tareas del equipo.
    </p>
    
    <div style="background: #f9fafb; border-left: 4px solid #4514F9; padding: 20px; margin: 25px 0; border-radius: 4px;">
      <h2 style="margin-top: 0; color: #4514F9; font-size: 20px;">${task.title}</h2>
      
      <div style="margin-top: 15px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #6b7280; width: 140px;">Categoría:</td>
            <td style="padding: 8px 0;">
              <span style="background: #e0e7ff; color: #4514F9; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 500;">
                ${task.category === 'Otra' ? (task.customCategory || 'Otra') : task.category}
              </span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Prioridad:</td>
            <td style="padding: 8px 0;">
              <span style="background: ${priority.color}; color: ${priority.textColor}; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 500;">
                ${priority.label}
              </span>
            </td>
          </tr>
          ${task.projectName ? `
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Proyecto:</td>
            <td style="padding: 8px 0; color: #1f2937;">${task.projectName}</td>
          </tr>
          ` : ''}${dueDateHTML}
          ${task.estimatedHours ? `
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #6b7280;">Horas Estimadas:</td>
            <td style="padding: 8px 0; color: #1f2937;"><strong>${task.estimatedHours} horas</strong></td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      ${task.description ? `
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="font-weight: 600; color: #6b7280; margin-bottom: 8px; font-size: 14px;">Descripción:</p>
        <p style="color: #1f2937; white-space: pre-wrap; margin: 0;">${task.description.replace(/\n/g, '<br>')}</p>
      </div>
      ` : ''}
      
      ${task.comentarios ? `
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="font-weight: 600; color: #6b7280; margin-bottom: 8px; font-size: 14px;">Comentarios / Notas:</p>
        <p style="color: #1f2937; white-space: pre-wrap; margin: 0;">${task.comentarios.replace(/\n/g, '<br>')}</p>
      </div>
      ` : ''}
    </div>
    
    <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <div style="display: flex; align-items: start; gap: 12px;">
        <div style="font-size: 24px;">⏱️</div>
        <div>
          <h3 style="margin: 0 0 8px 0; color: #92400e; font-size: 16px;">¡Recuerda usar el Timer!</h3>
          <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.5;">
            Para medir el tiempo real trabajado en esta tarea, utiliza el botón de <strong>Timer</strong> en la plataforma. 
            Esto nos ayuda a tener métricas precisas del tiempo invertido en cada tarea y mejorar la estimación de futuros proyectos.
          </p>
        </div>
      </div>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${taskUrl}" style="background: #4514F9; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">
        Ver Tarea en la Plataforma →
      </a>
    </div>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
      <p style="margin: 0;">
        Este es un email automático del sistema de gestión de tareas de Visionaries Hub.<br>
        ID de la tarea: <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${task.id}</code>
      </p>
    </div>
    
  </div>
  
</body>
</html>`
}

/**
 * Genera el texto plano del email de nueva tarea asignada
 */
function generateTaskAssignedEmailText(data: TaskEmailData): string {
  const { task, assigneeName, creatorName } = data
  
  const priorityConfig = {
    high: 'Alta',
    medium: 'Media',
    low: 'Baja',
  }
  const priorityLabel = priorityConfig[task.priority] || 'Media'
  
  let dueDateText = ''
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate)
    const formattedDate = dueDate.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Mexico_City',
    })
    dueDateText = `Fecha Límite: ${formattedDate}\n`
  }
  
  const taskUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://admin.visionarieshub.com'}/equipo`
  
  return `Nueva Tarea Asignada: ${task.title}

Hola ${assigneeName || data.assigneeEmail},

${creatorName || data.creatorEmail} te ha asignado una nueva tarea en el sistema de gestión de tareas del equipo.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DETALLES DE LA TAREA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Título: ${task.title}
Categoría: ${task.category === 'Otra' ? (task.customCategory || 'Otra') : task.category}
Prioridad: ${priorityLabel}
${task.projectName ? `Proyecto: ${task.projectName}\n` : ''}${dueDateText}${task.estimatedHours ? `Horas Estimadas: ${task.estimatedHours} horas\n` : ''}
${task.description ? `\nDescripción:\n${task.description}\n` : ''}
${task.comentarios ? `\nComentarios / Notas:\n${task.comentarios}\n` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ ¡RECUERDA USAR EL TIMER!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para medir el tiempo real trabajado en esta tarea, utiliza el botón de Timer en la plataforma. Esto nos ayuda a tener métricas precisas del tiempo invertido en cada tarea y mejorar la estimación de futuros proyectos.

Ver tarea: ${taskUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Este es un email automático del sistema de gestión de tareas de Visionaries Hub.
ID de la tarea: ${task.id}`
}

/**
 * Envía un email cuando se asigna una tarea a un usuario diferente al creador
 */
export async function sendTaskAssignedEmail(
  task: TeamTask,
  assigneeEmail: string,
  creatorEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Solo enviar si el assignee es diferente al creador
    if (!assigneeEmail || assigneeEmail === creatorEmail) {
      return { success: true }
    }
    
    // Obtener nombres de usuarios desde Firestore
    let assigneeName: string | undefined
    let creatorName: string | undefined
    
    try {
      const db = getInternalFirestore()
      
      // Obtener nombre del assignee
      try {
        const assigneeDoc = await db.collection('users').doc(assigneeEmail).get()
        if (assigneeDoc.exists) {
          assigneeName = assigneeDoc.data()?.displayName
        }
      } catch (error) {
        console.warn('[TeamTaskEmailService] No se pudo obtener nombre del assignee:', error)
      }
      
      // Obtener nombre del creador
      try {
        const creatorDoc = await db.collection('users').doc(creatorEmail).get()
        if (creatorDoc.exists) {
          creatorName = creatorDoc.data()?.displayName
        }
      } catch (error) {
        console.warn('[TeamTaskEmailService] No se pudo obtener nombre del creador:', error)
      }
    } catch (error) {
      console.warn('[TeamTaskEmailService] No se pudieron obtener nombres de usuarios:', error)
    }
    
    const emailData: TaskEmailData = {
      task,
      assigneeEmail,
      creatorEmail,
      assigneeName,
      creatorName,
    }
    
    const htmlBody = generateTaskAssignedEmailHTML(emailData)
    const textBody = generateTaskAssignedEmailText(emailData)
    
    const emailMessage: EmailMessage = {
      to: assigneeEmail,
      subject: `Nueva tarea asignada: ${task.title}`,
      body: textBody,
      htmlBody: htmlBody,
    }
    
    const result = await gmailService.sendEmail(emailMessage)
    
    if (!result.success) {
      console.error('[TeamTaskEmailService] Error enviando email:', result.error)
      return { success: false, error: result.error }
    }
    
    console.log('[TeamTaskEmailService] Email enviado exitosamente a:', assigneeEmail)
    return { success: true }
  } catch (error: any) {
    console.error('[TeamTaskEmailService] Error:', error)
    return { success: false, error: error.message || 'Error desconocido' }
  }
}

