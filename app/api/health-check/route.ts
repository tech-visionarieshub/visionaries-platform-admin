import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[Health Check] Verificando configuración...');
    
    const envCheck = {
      hasPlatformAdmin: !!process.env.FIREBASE_SERVICE_ACCOUNT_PLATFORM_ADMIN,
      hasTechAdmin: !!process.env.FIREBASE_SERVICE_ACCOUNT_VISIONARIES_TECH,
    };

    console.log('[Health Check] Variables de entorno:', envCheck);

    // Intentar cargar librerías dinámicamente para ver si fallan
    let firebaseError = null;
    try {
      const { getInternalApp } = await import('@/lib/firebase/admin-platform');
      getInternalApp();
      const { getAuraApp } = await import('@/lib/firebase/admin-tech');
      getAuraApp();
    } catch (e: any) {
      firebaseError = e.message;
      console.error('[Health Check] Error inicializando Firebase:', e);
    }

    return NextResponse.json({
      status: 'ok',
      env: envCheck,
      firebaseInit: firebaseError ? 'failed' : 'success',
      firebaseError,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message
    }, { status: 500 });
  }
}








