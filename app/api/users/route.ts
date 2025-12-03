import { NextRequest, NextResponse } from 'next/server'
import { extractBearerToken } from '@/lib/firebase/auth-helpers'
import { verifyIdToken } from '@/lib/firebase/admin-tech'
import { getInternalFirestore } from '@/lib/firebase/admin-platform'

/**
 * API para obtener usuarios globales
 * GET /api/users
 */
export async function GET(request: NextRequest) {
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
    const usersSnapshot = await db.collection('users').get()
    
    const users = usersSnapshot.docs.map(doc => ({
      id: doc.id,
      email: doc.id, // El ID es el email
      displayName: doc.data().displayName || '',
      role: doc.data().role || 'member',
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
    }))

    return NextResponse.json({
      success: true,
      users,
    })
  } catch (error: any) {
    console.error('[Users API] Error:', error)
    return NextResponse.json(
      { error: 'Error obteniendo usuarios', message: error.message },
      { status: 500 }
    )
  }
}














