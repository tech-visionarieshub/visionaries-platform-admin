#!/usr/bin/env python3
"""
Script para asignar usuarios faltantes a sus plataformas.
"""

import os
import sys
import firebase_admin
from firebase_admin import credentials, firestore, auth
from datetime import datetime

SERVICE_ACCOUNT_PATH = "/Users/gabrielapino/Library/Mobile Documents/com~apple~CloudDocs/9 nov 2025/visionaries-tech-firebase-adminsdk-fbsvc-5e928cfca6.json"

# Usuarios que faltan asignar
USUARIOS_FALTANTES = [
    ("cheicargo-ai@visionarieshub.com", "cheicargo", "Cheicargo AI"),
    ("evco-ai@visionarieshub.com", "evco", "Evco AI"),
    ("3a-ai@visionarieshub.com", "3a", "3A AI"),
    ("sgac-ai@visionarieshub.com", "sgac", "SGAC AI"),
    ("lozen-ai@visionarieshub.com", "lozen", "Lozen AI"),
    ("racing-ai@visionarieshub.com", "racing", "Racing AI"),
    ("cheicargo-gp@visionarieshub.com", "cheicargo", "Cheicargo GP"),
    ("evco-gp@visionarieshub.com", "evco", "Evco GP"),
    ("3a-gp@visionarieshub.com", "3a", "3A GP"),
    ("sgac-gp@visionarieshub.com", "sgac", "SGAC GP"),
    ("lozen-gp@visionarieshub.com", "lozen", "Lozen GP"),
    ("racing-gp@visionarieshub.com", "racing", "Racing GP"),
    ("cheicargo-ra@visionarieshub.com", "cheicargo", "Cheicargo RA"),
    ("evco-ra@visionarieshub.com", "evco", "Evco RA"),
    ("3a-ra@visionarieshub.com", "3a", "3A RA"),
    ("sgac-ra@visionarieshub.com", "sgac", "SGAC RA"),
    ("lozen-ra@visionarieshub.com", "lozen", "Lozen RA"),
    ("racing-ra@visionarieshub.com", "racing", "Racing RA"),
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

def find_platform_by_code(db, platform_code: str):
    """Busca una plataforma por su código."""
    platforms_ref = db.collection("platforms")
    query = platforms_ref.where("code", "==", platform_code).limit(1)
    docs = query.stream()
    
    for doc in docs:
        return {
            "platform_id": doc.id,
            "data": doc.to_dict()
        }
    return None

def find_user_in_platform(db, platform_id, email: str):
    """Busca un usuario en una plataforma específica."""
    users_ref = db.collection("platforms").document(platform_id).collection("users")
    query = users_ref.where("email", "==", email).limit(1)
    docs = query.stream()
    
    for doc in docs:
        return {
            "user_id": doc.id,
            "data": doc.to_dict(),
            "ref": doc.reference
        }
    return None

def find_user_in_aura(db, email: str):
    """Busca un usuario en Aura."""
    aura_platform = find_platform_by_code(db, "visionaries-aura")
    if not aura_platform:
        return None
    return find_user_in_platform(db, aura_platform["platform_id"], email)

def asignar_usuario_a_plataforma(db, email: str, platform_code: str, name: str):
    """Asigna un usuario a una plataforma."""
    print(f"\n{'='*80}")
    print(f"🔧 ASIGNANDO: {email} → {platform_code}")
    print(f"{'='*80}")
    
    # 1. Verificar que la plataforma existe
    platform = find_platform_by_code(db, platform_code)
    if not platform:
        print(f"❌ Plataforma '{platform_code}' no encontrada en Firestore")
        return False
    
    platform_id = platform["platform_id"]
    platform_name = platform["data"].get("name", platform_code)
    print(f"✅ Plataforma encontrada: {platform_name} ({platform_id})")
    
    # 2. Verificar que el usuario existe en Firebase Auth
    try:
        auth_user = auth.get_user_by_email(email)
        print(f"✅ Usuario encontrado en Firebase Auth (UID: {auth_user.uid})")
    except auth.UserNotFoundError:
        print(f"❌ Usuario no encontrado en Firebase Auth")
        return False
    
    # 3. Verificar que el usuario existe en Aura
    aura_user = find_user_in_aura(db, email)
    if not aura_user:
        print(f"❌ Usuario no encontrado en Aura")
        return False
    print(f"✅ Usuario encontrado en Aura (User ID: {aura_user['user_id']})")
    
    # 4. Verificar si ya existe en la plataforma
    existing = find_user_in_platform(db, platform_id, email)
    if existing:
        print(f"⚠️  Usuario ya existe en {platform_name} (User ID: {existing['user_id']})")
        return True
    
    # 5. Crear usuario en la plataforma
    users_ref = db.collection("platforms").document(platform_id).collection("users")
    user_data = {
        "email": email,
        "name": name,
        "isActive": True,
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "auraUserId": aura_user["user_id"],
    }
    
    new_user_ref = users_ref.add(user_data)
    print(f"✅ Usuario creado en {platform_name}:")
    print(f"   User ID: {new_user_ref[1].id}")
    print(f"   Email: {email}")
    
    return True

def main():
    """Función principal."""
    print("=" * 80)
    print("🔧 ASIGNACIÓN DE USUARIOS FALTANTES")
    print("=" * 80)
    print()
    
    db = initialize_firebase()
    
    exitosos = 0
    fallidos = 0
    
    for email, platform_code, name in USUARIOS_FALTANTES:
        try:
            if asignar_usuario_a_plataforma(db, email, platform_code, name):
                exitosos += 1
            else:
                fallidos += 1
        except Exception as e:
            print(f"❌ Error asignando {email}: {e}")
            import traceback
            traceback.print_exc()
            fallidos += 1
    
    print("\n" + "=" * 80)
    print("📊 RESUMEN")
    print("=" * 80)
    print(f"✅ Exitosos: {exitosos}/{len(USUARIOS_FALTANTES)}")
    print(f"❌ Fallidos: {fallidos}/{len(USUARIOS_FALTANTES)}")
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

