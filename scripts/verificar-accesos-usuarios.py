#!/usr/bin/env python3
"""
Script para verificar que todos los usuarios tengan acceso a sus respectivas plataformas.
"""

import os
import json
import sys
import firebase_admin
from firebase_admin import credentials, firestore, auth

SERVICE_ACCOUNT_PATH = "/Users/gabrielapino/Library/Mobile Documents/com~apple~CloudDocs/9 nov 2025/visionaries-tech-firebase-adminsdk-fbsvc-5e928cfca6.json"

# Lista de usuarios a verificar
USUARIOS_AI = [
    "finsa-ai@visionarieshub.com",
    "privarsa-ai@visionarieshub.com",
    "donleo-ai@visionarieshub.com",
    "gefe-ai@visionarieshub.com",
    "cheicargo-ai@visionarieshub.com",
    "tauro-ai@visionarieshub.com",
    "edc-ai@visionarieshub.com",
    "evco-ai@visionarieshub.com",
    "lasalle-ai@visionarieshub.com",
    "powerstein-ai@visionarieshub.com",
    "unoretail-ai@visionarieshub.com",
    "alurtek-ai@visionarieshub.com",
    "3a-ai@visionarieshub.com",
    "sgac-ai@visionarieshub.com",
    "lozen-ai@visionarieshub.com",
    "racing-ai@visionarieshub.com",
]

USUARIOS_GP = [
    "finsa-gp@visionarieshub.com",
    "privarsa-gp@visionarieshub.com",
    "donleo-gp@visionarieshub.com",
    "gefe-gp@visionarieshub.com",
    "cheicargo-gp@visionarieshub.com",
    "tauro-gp@visionarieshub.com",
    "edc-gp@visionarieshub.com",
    "evco-gp@visionarieshub.com",
    "lasalle-gp@visionarieshub.com",
    "powerstein-gp@visionarieshub.com",
    "unoretail-gp@visionarieshub.com",
    "alurtek-gp@visionarieshub.com",
    "3a-gp@visionarieshub.com",
    "sgac-gp@visionarieshub.com",
    "lozen-gp@visionarieshub.com",
    "racing-gp@visionarieshub.com",
]

USUARIOS_RA = [
    "finsa-ra@visionarieshub.com",
    "privarsa-ra@visionarieshub.com",
    "donleo-ra@visionarieshub.com",
    "gefe-ra@visionarieshub.com",
    "cheicargo-ra@visionarieshub.com",
    "tauro-ra@visionarieshub.com",
    "edc-ra@visionarieshub.com",
    "evco-ra@visionarieshub.com",
    "lasalle-ra@visionarieshub.com",
    "powerstein-ra@visionarieshub.com",
    "unoretail-ra@visionarieshub.com",
    "alurtek-ra@visionarieshub.com",
    "3a-ra@visionarieshub.com",
    "sgac-ra@visionarieshub.com",
    "lozen-ra@visionarieshub.com",
    "racing-ra@visionarieshub.com",
]

def initialize_firebase():
    """Inicializa Firebase Admin SDK."""
    if not firebase_admin._apps:
        if not os.path.exists(SERVICE_ACCOUNT_PATH):
            raise FileNotFoundError(
                f"❌ No se encontró el service account en:\n   {SERVICE_ACCOUNT_PATH}"
            )
        cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
        firebase_admin.initialize_app(cred)
    return firestore.client()

def extract_platform_code(email: str) -> str:
    """Extrae el código de plataforma del email."""
    # Ejemplo: finsa-ai@visionarieshub.com -> finsa
    prefix = email.split("@")[0]
    # Remover sufijos: -ai, -gp, -ra
    for suffix in ["-ai", "-gp", "-ra"]:
        if prefix.endswith(suffix):
            return prefix[:-len(suffix)]
    return prefix

def find_user_in_platform(db, platform_code: str, email: str):
    """Busca un usuario en una plataforma específica."""
    platforms_ref = db.collection("platforms")
    query = platforms_ref.where("code", "==", platform_code).limit(1)
    docs = query.stream()
    
    for platform_doc in docs:
        users_ref = platform_doc.reference.collection("users")
        user_query = users_ref.where("email", "==", email).limit(1)
        user_docs = user_query.stream()
        
        for user_doc in user_docs:
            return {
                "platform_id": platform_doc.id,
                "platform_code": platform_code,
                "platform_name": platform_doc.to_dict().get("name", platform_code),
                "user_id": user_doc.id,
                "is_active": user_doc.to_dict().get("isActive", True),
            }
    return None

def find_user_in_auth(email: str):
    """Busca un usuario en Firebase Auth."""
    try:
        return auth.get_user_by_email(email)
    except auth.UserNotFoundError:
        return None
    except Exception as e:
        print(f"⚠️  Error al buscar en Auth: {e}")
        return None

def find_user_in_aura(db, email: str):
    """Busca un usuario en Aura."""
    return find_user_in_platform(db, "visionaries-aura", email)

def verificar_usuario(db, email: str):
    """Verifica el acceso de un usuario."""
    platform_code = extract_platform_code(email)
    
    # Verificar Firebase Auth
    auth_user = find_user_in_auth(email)
    auth_exists = auth_user is not None
    
    # Verificar Aura
    aura_user = find_user_in_aura(db, email)
    aura_exists = aura_user is not None
    
    # Verificar plataforma específica
    platform_user = find_user_in_platform(db, platform_code, email)
    platform_exists = platform_user is not None
    
    return {
        "email": email,
        "platform_code": platform_code,
        "auth_exists": auth_exists,
        "aura_exists": aura_exists,
        "platform_exists": platform_exists,
        "platform_name": platform_user["platform_name"] if platform_user else None,
        "is_complete": auth_exists and aura_exists and platform_exists,
    }

def main():
    """Función principal."""
    print("=" * 80)
    print("🔍 VERIFICACIÓN DE ACCESOS DE USUARIOS")
    print("=" * 80)
    print()
    
    db = initialize_firebase()
    
    # Combinar todos los usuarios
    todos_usuarios = USUARIOS_AI + USUARIOS_GP + USUARIOS_RA
    
    print(f"📋 Verificando {len(todos_usuarios)} usuarios...\n")
    
    resultados = []
    for email in todos_usuarios:
        try:
            resultado = verificar_usuario(db, email)
            resultados.append(resultado)
        except Exception as e:
            print(f"❌ Error verificando {email}: {e}")
            resultados.append({
                "email": email,
                "platform_code": extract_platform_code(email),
                "auth_exists": False,
                "aura_exists": False,
                "platform_exists": False,
                "is_complete": False,
                "error": str(e),
            })
    
    # Resumen
    print("=" * 80)
    print("📊 RESUMEN DE VERIFICACIÓN")
    print("=" * 80)
    print()
    
    completos = [r for r in resultados if r.get("is_complete", False)]
    incompletos = [r for r in resultados if not r.get("is_complete", False)]
    
    print(f"✅ Usuarios completos: {len(completos)}/{len(resultados)}")
    print(f"❌ Usuarios incompletos: {len(incompletos)}/{len(resultados)}")
    print()
    
    if incompletos:
        print("=" * 80)
        print("❌ USUARIOS CON PROBLEMAS")
        print("=" * 80)
        print()
        
        for r in incompletos:
            print(f"📧 {r['email']}")
            print(f"   Plataforma esperada: {r['platform_code']}")
            print(f"   Firebase Auth: {'✅' if r['auth_exists'] else '❌'}")
            print(f"   Aura: {'✅' if r['aura_exists'] else '❌'}")
            print(f"   {r['platform_code']}: {'✅' if r['platform_exists'] else '❌'}")
            if r.get('error'):
                print(f"   Error: {r['error']}")
            print()
    
    # Agrupar por plataforma
    print("=" * 80)
    print("📦 USUARIOS POR PLATAFORMA")
    print("=" * 80)
    print()
    
    plataformas = {}
    for r in resultados:
        platform = r['platform_code']
        if platform not in plataformas:
            plataformas[platform] = {"completos": [], "incompletos": []}
        
        if r.get("is_complete", False):
            plataformas[platform]["completos"].append(r['email'])
        else:
            plataformas[platform]["incompletos"].append(r['email'])
    
    for platform, usuarios in sorted(plataformas.items()):
        total = len(usuarios["completos"]) + len(usuarios["incompletos"])
        print(f"🏢 {platform.upper()}: {len(usuarios['completos'])}/{total} completos")
        if usuarios["incompletos"]:
            print(f"   ❌ Faltan: {', '.join(usuarios['incompletos'])}")
        print()
    
    # Generar lista de comandos para corregir
    if incompletos:
        print("=" * 80)
        print("🔧 COMANDOS PARA CORREGIR")
        print("=" * 80)
        print()
        
        for r in incompletos:
            if not r.get("platform_exists", False):
                platform_code = r['platform_code']
                email = r['email']
                name = platform_code.upper() + " " + email.split("-")[-1].split("@")[0].upper()
                print(f"python3 scripts/crear-usuario-plataforma.py --email {email} --name \"{name}\" --platform {platform_code}")
        print()
    
    print("=" * 80)
    print("✅ VERIFICACIÓN COMPLETADA")
    print("=" * 80)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Operación cancelada por el usuario")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

