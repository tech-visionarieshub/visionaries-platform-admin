import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET_STRING = process.env.JWT_SECRET;
if (!JWT_SECRET_STRING) {
    console.warn('JWT_SECRET no configurado. Usando clave por defecto (solo desarrollo)');
}
const JWT_SECRET = new TextEncoder().encode(
    JWT_SECRET_STRING || 'a-very-secure-default-secret-key-for-dev-32-characters'
);

const AURA_LOGIN_URL = 'https://aura.visionarieshub.com/auth';
const PUBLIC_PATHS = ['/login'];

interface DecodedJwtPayload {
    platform?: string;
    email?: string;
    exp?: number;
    [key: string]: any;
}

async function validateJWT(token: string): Promise<DecodedJwtPayload | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as DecodedJwtPayload;
    } catch (error) {
        console.error('JWT validation failed:', error);
        return null;
    }
}

export async function middleware(request: NextRequest) {
    // Deshabilitado: La validación se hace en el cliente
    // Esto evita problemas con redirecciones en iframes
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|icon.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)',
    ],
};

