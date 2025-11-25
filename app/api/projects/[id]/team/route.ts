import { NextRequest, NextResponse } from 'next/server'
import { extractBearerToken } from '@/lib/firebase/auth-helpers'
import { verifyIdToken } from '@/lib/firebase/admin-tech'
import { getInternalFirestore } from '@/lib/firebase/admin-platform'

type ProjectParamsContext = {
  params: Promise<{ id: string }>
}

/**
 * API para gestionar miembros del equipo del proyecto
 * GET /api/projects/[id]/team - Obtener miembros del equipo
 * POST /api/projects/[id]/team - Agregar miembro al equipo
 * DELETE /api/projects/[id]/team - Remover miembro del equipo
 */
export async function GET(
  request: NextRequest,
  context: ProjectParamsContext
) {
  const { id: projectId } = await context.params

  try {
    const token = extractBearerToken(request)
    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const decoded = await verifyIdToken(token)
    const isSuperAdmin = decoded.email === 'adminplatform@visionarieshub.com' || decoded.superadmin === true
    const hasInternalAccess = decoded.internal === true

    if (!hasInternalAccess && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'No tienes acceso a esta funcionalidad' },
        { status: 403 }
      )
    }

    const db = getInternalFirestore()
    const projectDoc = await db.collection('projects').doc(projectId).get()
    
    if (!projectDoc.exists) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      )
    }

    const projectData = projectDoc.data()
    const teamMemberEmails = projectData?.teamMembers || []

    // Obtener información de los usuarios
    const users: any[] = []
    for (const email of teamMemberEmails) {
      const userDoc = await db.collection('users').doc(email).get()
      if (userDoc.exists) {
        users.push({
          email: userDoc.id,
          displayName: userDoc.data()?.displayName || email,
          role: userDoc.data()?.role || 'member',
        })
      } else {
        // Si no existe en users, agregarlo con email como displayName
        users.push({
          email,
          displayName: email,
          role: 'member',
        })
      }
    }

    return NextResponse.json({
      success: true,
      teamMembers: users,
    })
  } catch (error: any) {
    console.error('[Team API] Error:', error)
    return NextResponse.json(
      { error: 'Error obteniendo miembros del equipo', message: error.message },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: ProjectParamsContext
) {
  const { id: projectId } = await context.params

  try {
    const token = extractBearerToken(request)
    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const decoded = await verifyIdToken(token)
    const isSuperAdmin = decoded.email === 'adminplatform@visionarieshub.com' || decoded.superadmin === true
    const hasInternalAccess = decoded.internal === true

    if (!hasInternalAccess && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'No tienes acceso a esta funcionalidad' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      )
    }

    const db = getInternalFirestore()
    const projectRef = db.collection('projects').doc(projectId)
    const projectDoc = await projectRef.get()

    if (!projectDoc.exists) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      )
    }

    const projectData = projectDoc.data()
    const teamMembers = projectData?.teamMembers || []

    if (teamMembers.includes(email)) {
      return NextResponse.json(
        { error: 'El usuario ya está en el equipo' },
        { status: 400 }
      )
    }

    // Agregar email al array de teamMembers
    await projectRef.update({
      teamMembers: [...teamMembers, email],
      updatedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: 'Miembro agregado al equipo',
    })
  } catch (error: any) {
    console.error('[Team API] Error:', error)
    return NextResponse.json(
      { error: 'Error agregando miembro al equipo', message: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: ProjectParamsContext
) {
  const { id: projectId } = await context.params

  try {
    const token = extractBearerToken(request)
    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const decoded = await verifyIdToken(token)
    const isSuperAdmin = decoded.email === 'adminplatform@visionarieshub.com' || decoded.superadmin === true
    const hasInternalAccess = decoded.internal === true

    if (!hasInternalAccess && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'No tienes acceso a esta funcionalidad' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      )
    }

    const db = getInternalFirestore()
    const projectRef = db.collection('projects').doc(projectId)
    const projectDoc = await projectRef.get()

    if (!projectDoc.exists) {
      return NextResponse.json(
        { error: 'Proyecto no encontrado' },
        { status: 404 }
      )
    }

    const projectData = projectDoc.data()
    const teamMembers = projectData?.teamMembers || []

    if (!teamMembers.includes(email)) {
      return NextResponse.json(
        { error: 'El usuario no está en el equipo' },
        { status: 400 }
      )
    }

    // Remover email del array de teamMembers
    await projectRef.update({
      teamMembers: teamMembers.filter((e: string) => e !== email),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      message: 'Miembro removido del equipo',
    })
  } catch (error: any) {
    console.error('[Team API] Error:', error)
    return NextResponse.json(
      { error: 'Error removiendo miembro del equipo', message: error.message },
      { status: 500 }
    )
  }
}




