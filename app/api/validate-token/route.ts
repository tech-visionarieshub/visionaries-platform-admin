import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// JWT_SECRET para visionaries-platform-admin
const VISIONARIES_PLATFORM_ADMIN_SECRET = process.env.JWT_SECRET;
const VISIONARIES_PLATFORM_ADMIN_JWT_SECRET = new TextEncoder().encode(
    VISIONARIES_PLATFORM_ADMIN_SECRET || 'a-very-secure-default-secret-key-for-dev-32-characters'
);

// JWT_SECRET para AURA (debe estar configurado en Vercel)
const AURA_SECRET = process.env.AURA_JWT_SECRET;
const AURA_JWT_SECRET = AURA_SECRET 
    ? new TextEncoder().encode(AURA_SECRET)
    : null;

interface DecodedPayload {
    id?: string;
    email?: string;
    platform?: string;
    myAutomations?: Array<{ slug: string }>;
    [key: string]: any;
}

async function validateTokenWithSecret(token: string, secret: Uint8Array): Promise<DecodedPayload | null> {
    try {
        const { payload } = await jwtVerify(token, secret) as { payload: DecodedPayload };
        return payload;
    } catch (error) {
        return null;
    }
}

export async function POST(request: NextRequest) {
    try {
        const { token } = await request.json();
        
        if (!token) {
            return NextResponse.json({ valid: false, error: 'No token provided' }, { status: 400 });
        }

        console.log('[Validate Token] JWT_SECRET configurado:', !!VISIONARIES_PLATFORM_ADMIN_SECRET);
        console.log('[Validate Token] AURA_JWT_SECRET configurado:', !!AURA_SECRET);

        // Intentar validar con el secreto de visionaries-platform-admin
        let payload = await validateTokenWithSecret(token, VISIONARIES_PLATFORM_ADMIN_JWT_SECRET);
        console.log('[Validate Token] Validación con visionaries-platform-admin secret:', payload ? 'Éxito' : 'Falló');
        
        // Si falla y tenemos el secreto de AURA, intentar con ese
        if (!payload && AURA_JWT_SECRET) {
            console.log('[Validate Token] Intentando validar con AURA_JWT_SECRET...');
            payload = await validateTokenWithSecret(token, AURA_JWT_SECRET);
            console.log('[Validate Token] Validación con AURA secret:', payload ? 'Éxito' : 'Falló');
        } else if (!payload && !AURA_JWT_SECRET) {
            console.error('[Validate Token] AURA_JWT_SECRET no configurado!');
        }
        
        if (!payload) {
            console.error('[Validate Token] No se pudo validar el token con ningún secreto');
            return NextResponse.json({ valid: false, error: 'Invalid token' }, { status: 401 });
        }
        
        console.log('[Validate Token] Payload decodificado:', {
            id: payload.id,
            email: payload.email,
            platform: payload.platform,
            hasAutomations: !!(payload.myAutomations && payload.myAutomations.length > 0),
            automationsCount: payload.myAutomations?.length || 0
        });
        
        // Verificar si el JWT es para visionaries-platform-admin directamente
        if (payload.platform === 'visionaries-platform-admin') {
            return NextResponse.json({ 
                valid: true, 
                payload: {
                    id: payload.id,
                    email: payload.email,
                    platform: payload.platform
                }
            });
        }
        
        // Si el JWT es de AURA, permitir acceso (AURA ya validó los permisos)
        // El usuario accede desde AURA, así que confiamos en que tiene permisos
        if (payload.platform === 'visionaries-aura' || payload.platform === 'aura') {
            console.log('[Validate Token] Token de AURA válido, permitiendo acceso');
            return NextResponse.json({ 
                valid: true, 
                payload: {
                    id: payload.id,
                    email: payload.email,
                    platform: 'visionaries-platform-admin' // Retornamos el platform esperado
                }
            });
        }
        
        return NextResponse.json({ valid: false, error: 'Platform mismatch or no access' }, { status: 403 });
    } catch (error: any) {
        console.error('[Validate Token] Server error:', error.message);
        return NextResponse.json({ valid: false, error: 'Server error' }, { status: 500 });
    }
}

