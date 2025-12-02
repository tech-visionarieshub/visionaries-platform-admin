import { NextRequest, NextResponse } from 'next/server';
import { extractBearerToken } from '@/lib/firebase/auth-helpers';
import { verifyIdToken } from '@/lib/firebase/admin-tech';
import { gmailService, type EmailMessage } from '@/lib/services/gmail-service';
import { z } from 'zod';

const sendEmailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  cc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  bcc: z.union([z.string().email(), z.array(z.string().email())]).optional(),
  subject: z.string().min(1, 'El asunto es requerido'),
  body: z.string().min(1, 'El cuerpo del mensaje es requerido'),
  htmlBody: z.string().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(), // Base64 encoded
    contentType: z.string().optional(),
  })).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const token = extractBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const decoded = await verifyIdToken(token);
    const isSuperAdmin = decoded.email === 'adminplatform@visionarieshub.com' || decoded.superadmin === true;
    const hasInternalAccess = decoded.internal === true;

    // Permitir a superadmins o usuarios con acceso interno
    if (!isSuperAdmin && !hasInternalAccess) {
      return NextResponse.json(
        { error: 'Solo superadmins o usuarios con acceso interno pueden enviar emails' },
        { status: 403 }
      );
    }

    // Validar y parsear el body
    const body = await request.json();
    const validatedData = sendEmailSchema.parse(body);

    // Enviar email
    const result = await gmailService.sendEmail(validatedData as EmailMessage);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          error: result.error || 'Error al enviar email' 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      message: 'Email enviado exitosamente',
    });
  } catch (error: any) {
    console.error('[Gmail Send] Error:', error);
    
    // Si es un error de validación de Zod
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Datos inválidos',
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Error al enviar email' 
      },
      { status: 500 }
    );
  }
}



