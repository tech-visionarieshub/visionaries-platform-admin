#!/usr/bin/env python3
"""
Script para crear el usuario edc-ja@visionarieshub.com y asignarle permisos.
"""

import os
import sys
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore, auth

SERVICE_ACCOUNT_PATH = "/Users/gabrielapino/Library/Mobile Documents/com~apple~CloudDocs/9 nov 2025/visionaries-tech-firebase-adminsdk-fbsvc-5e928cfca6.json"

EMAIL = "edc-ja@visionarieshub.com"
PLATFORM_CODE = "edc"
NAME = "EDC JA"

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
            "data": doc.to_dict(),
            "ref": doc.reference
        }
    return None

def find_user_in_platform(db, platform_id: str, email: str):
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

def create_user_in_auth(email: str, display_name: str = None):
    """Crea un usuario en Firebase Auth."""
    try:
        existing = auth.get_user_by_email(email)
        print(f"⚠️  Usuario ya existe en Firebase Auth (UID: {existing.uid})")
        return existing.uid
    except auth.UserNotFoundError:
        try:
            user_data = {
                "email": email,
                "email_verified": True,
            }
            if display_name:
                user_data["display_name"] = display_name
            
            new_user = auth.create_user(**user_data)
            print(f"✅ Usuario creado en Firebase Auth:")
            print(f"   UID: {new_user.uid}")
            return new_user.uid
        except Exception as e:
            print(f"❌ Error al crear usuario en Auth: {e}")
            raise

def create_user_in_aura(db, email: str, auth_uid: str, display_name: str = None):
    """Crea un usuario en la plataforma Aura."""
    aura_platform = find_platform_by_code(db, "visionaries-aura")
    if not aura_platform:
        raise Exception("Plataforma visionaries-aura no encontrada")
    
    existing = find_user_in_aura(db, email)
    if existing:
        print(f"⚠️  Usuario ya existe en Aura (User ID: {existing['user_id']})")
        return existing['user_id']
    
    users_ref = db.collection("platforms").document(aura_platform["platform_id"]).collection("users")
    user_data = {
        "email": email,
        "isActive": True,
        "providerId": email,
        "visionariesFirebaseUserId": auth_uid,
        "onboardedAt": "",
        "firstName": display_name.split()[0] if display_name else "",
        "lastName": " ".join(display_name.split()[1:]) if display_name and len(display_name.split()) > 1 else "",
        "companyName": "",
    }
    
    new_user_ref = users_ref.add(user_data)
    print(f"✅ Usuario creado en Aura:")
    print(f"   User ID: {new_user_ref[1].id}")
    return new_user_ref[1].id

def get_automations_from_other_aliases(db, platform_id: str):
    """Obtiene las automatizaciones de otros usuarios alias de la misma plataforma."""
    users_ref = db.collection("platforms").document(platform_id).collection("users")
    all_users = list(users_ref.stream())
    
    # Buscar usuarios alias que tengan automatizaciones
    for user_doc in all_users:
        user_data = user_doc.to_dict()
        email = user_data.get("email", "")
        
        # Si es un alias y tiene automatizaciones, usar esas
        if any(suffix in email for suffix in ["-ai@", "-gp@", "-ra@", "-pz@"]):
            automations = user_data.get("allowedAutomationsIds", [])
            if automations:
                print(f"   📋 Encontradas automatizaciones en: {email}")
                return automations, user_data.get("allowedAutomationsFields", [])
    
    return [], []

def create_user_in_platform(db, platform_code: str, email: str, name: str, aura_user_id: str):
    """Crea un usuario en una plataforma específica."""
    platform = find_platform_by_code(db, platform_code)
    if not platform:
        raise Exception(f"Plataforma '{platform_code}' no encontrada")
    
    platform_id = platform["platform_id"]
    platform_name = platform["data"].get("name", platform_code)
    
    existing = find_user_in_platform(db, platform_id, email)
    if existing:
        print(f"⚠️  Usuario '{email}' ya existe en {platform_name}")
        return existing['user_id']
    
    # Obtener automatizaciones de otros alias
    print(f"\n📋 Buscando automatizaciones de otros usuarios alias...")
    automations_ids, automations_fields = get_automations_from_other_aliases(db, platform_id)
    
    users_ref = db.collection("platforms").document(platform_id).collection("users")
    user_data = {
        "email": email,
        "name": name,
        "isActive": True,
        "createdAt": datetime.utcnow().isoformat() + "Z",
        "auraUserId": aura_user_id,
    }
    
    if automations_ids:
        user_data["allowedAutomationsIds"] = automations_ids
        print(f"   ✅ Copiadas {len(automations_ids)} automatizaciones")
    if automations_fields:
        user_data["allowedAutomationsFields"] = automations_fields
    
    new_user_ref = users_ref.add(user_data)
    print(f"✅ Usuario creado en {platform_name}:")
    print(f"   User ID: {new_user_ref[1].id}")
    if automations_ids:
        print(f"   Automatizaciones: {len(automations_ids)}")
    
    return new_user_ref[1].id

def assign_automations_to_existing_user(db, platform_code: str, email: str):
    """Asigna automatizaciones a un usuario existente en la plataforma."""
    platform = find_platform_by_code(db, platform_code)
    if not platform:
        raise Exception(f"Plataforma '{platform_code}' no encontrada")
    
    platform_id = platform["platform_id"]
    platform_name = platform["data"].get("name", platform_code)
    
    user = find_user_in_platform(db, platform_id, email)
    if not user:
        raise Exception(f"Usuario '{email}' no encontrado en {platform_name}")
    
    # Obtener automatizaciones de otros alias
    print(f"\n📋 Buscando automatizaciones de otros usuarios alias...")
    automations_ids, automations_fields = get_automations_from_other_aliases(db, platform_id)
    
    if not automations_ids:
        print(f"⚠️  No se encontraron automatizaciones para copiar")
        return False
    
    # Actualizar usuario
    updates = {
        "allowedAutomationsIds": automations_ids
    }
    
    if automations_fields:
        updates["allowedAutomationsFields"] = automations_fields
    
    user["ref"].update(updates)
    print(f"✅ Automatizaciones asignadas a {email}:")
    print(f"   Automatizaciones: {len(automations_ids)}")
    
    return True

def main():
    """Función principal."""
    print("=" * 80)
    print("🔧 CREAR USUARIO EDC-JA Y ASIGNAR PERMISOS")
    print("=" * 80)
    print(f"\nEmail: {EMAIL}")
    print(f"Plataforma: {PLATFORM_CODE}")
    print(f"Nombre: {NAME}\n")
    
    db = initialize_firebase()
    
    # Paso 1: Crear usuario
    print("=" * 80)
    print("📝 PASO 1: CREAR USUARIO")
    print("=" * 80)
    
    # 1. Crear en Firebase Auth
    print("\n📝 Paso 1.1: Crear en Firebase Auth...")
    auth_uid = create_user_in_auth(EMAIL, NAME)
    
    # 2. Crear en Aura
    print("\n📝 Paso 1.2: Crear en Aura...")
    aura_user_id = create_user_in_aura(db, EMAIL, auth_uid, NAME)
    
    # 3. Crear en plataforma EDC
    print(f"\n📝 Paso 1.3: Crear en plataforma '{PLATFORM_CODE}'...")
    platform_user_id = create_user_in_platform(db, PLATFORM_CODE, EMAIL, NAME, aura_user_id)
    
    print("\n" + "=" * 80)
    print("✅ USUARIO CREADO EXITOSAMENTE")
    print("=" * 80)
    print(f"Email: {EMAIL}")
    print(f"Firebase Auth UID: {auth_uid}")
    print(f"Aura User ID: {aura_user_id}")
    print(f"{PLATFORM_CODE} User ID: {platform_user_id}")
    print("=" * 80)
    
    # Paso 2: Asignar permisos/automatizaciones
    print("\n" + "=" * 80)
    print("📝 PASO 2: ASIGNAR PERMISOS/AUTOMATIZACIONES")
    print("=" * 80)
    
    # Verificar si ya tiene automatizaciones
    platform = find_platform_by_code(db, PLATFORM_CODE)
    if platform:
        user = find_user_in_platform(db, platform["platform_id"], EMAIL)
        if user:
            current_automations = user["data"].get("allowedAutomationsIds", [])
            if current_automations:
                print(f"\n✅ El usuario ya tiene {len(current_automations)} automatizaciones asignadas")
            else:
                print(f"\n⚠️  El usuario no tiene automatizaciones, asignando...")
                assign_automations_to_existing_user(db, PLATFORM_CODE, EMAIL)
    
    print("\n" + "=" * 80)
    print("✅ PROCESO COMPLETADO")
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

