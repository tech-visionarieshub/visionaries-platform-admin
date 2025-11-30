#!/usr/bin/env python3
"""
Script para crear los usuarios faltantes con terminación -pz.
"""

import os
import sys
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore, auth

SERVICE_ACCOUNT_PATH = "/Users/gabrielapino/Library/Mobile Documents/com~apple~CloudDocs/9 nov 2025/visionaries-tech-firebase-adminsdk-fbsvc-5e928cfca6.json"

# Usuarios -pz faltantes
USUARIOS_PZ_FALTANTES = [
    ("finsa-pz@visionarieshub.com", "finsa", "Finsa PZ"),
    ("gefe-pz@visionarieshub.com", "gefe", "Grupo EFE PZ"),
    ("tauro-pz@visionarieshub.com", "tauro", "Tauro PZ"),
    ("edc-pz@visionarieshub.com", "edc", "EDC PZ"),
    ("powerstein-pz@visionarieshub.com", "powerstein", "Powerstein PZ"),
    ("unoretail-pz@visionarieshub.com", "unoretail", "Unoretail PZ"),
    ("alurtek-pz@visionarieshub.com", "alurtek", "Alurtek PZ"),
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

def get_automations_from_other_aliases(db, platform_id: str, platform_code: str):
    """Obtiene las automatizaciones de otros usuarios alias de la misma plataforma."""
    users_ref = db.collection("platforms").document(platform_id).collection("users")
    all_users = list(users_ref.stream())
    
    # Buscar usuarios alias que tengan automatizaciones
    for user_doc in all_users:
        user_data = user_doc.to_dict()
        email = user_data.get("email", "")
        
        # Si es un alias y tiene automatizaciones, usar esas
        if any(suffix in email for suffix in ["-ai@", "-gp@", "-ra@"]):
            automations = user_data.get("allowedAutomationsIds", [])
            if automations:
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
    automations_ids, automations_fields = get_automations_from_other_aliases(db, platform_id, platform_code)
    
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
        print(f"   ✅ Copiadas {len(automations_ids)} automatizaciones de otros alias")
    if automations_fields:
        user_data["allowedAutomationsFields"] = automations_fields
    
    new_user_ref = users_ref.add(user_data)
    print(f"✅ Usuario creado en {platform_name}:")
    print(f"   User ID: {new_user_ref[1].id}")
    if automations_ids:
        print(f"   Automatizaciones: {len(automations_ids)}")
    
    return new_user_ref[1].id

def process_user(db, email: str, name: str, platform_code: str):
    """Procesa la creación de un usuario completo."""
    print("\n" + "=" * 80)
    print(f"🔧 PROCESANDO: {email}")
    print("=" * 80)
    
    # 1. Crear en Firebase Auth
    print("\n📝 Paso 1: Crear en Firebase Auth...")
    auth_uid = create_user_in_auth(email, name)
    
    # 2. Crear en Aura
    print("\n📝 Paso 2: Crear en Aura...")
    aura_user_id = create_user_in_aura(db, email, auth_uid, name)
    
    # 3. Crear en plataforma específica
    print(f"\n📝 Paso 3: Crear en plataforma '{platform_code}'...")
    platform_user_id = create_user_in_platform(db, platform_code, email, name, aura_user_id)
    
    print("\n" + "=" * 80)
    print("✅ USUARIO PROCESADO EXITOSAMENTE")
    print("=" * 80)
    print(f"Email: {email}")
    print(f"Firebase Auth UID: {auth_uid}")
    print(f"Aura User ID: {aura_user_id}")
    print(f"{platform_code} User ID: {platform_user_id}")
    print("=" * 80 + "\n")
    
    return True

def main():
    """Función principal."""
    print("=" * 80)
    print("🔧 CREAR USUARIOS -PZ FALTANTES")
    print("=" * 80)
    print(f"\nSe crearán {len(USUARIOS_PZ_FALTANTES)} usuarios con terminación -pz\n")
    
    db = initialize_firebase()
    
    results = {
        "success": [],
        "failed": [],
        "skipped": []
    }
    
    for email, platform_code, name in USUARIOS_PZ_FALTANTES:
        try:
            success = process_user(db, email, name, platform_code)
            if success:
                results["success"].append(email)
        except Exception as e:
            print(f"\n❌ Error procesando {email}: {e}")
            results["failed"].append(email)
            import traceback
            traceback.print_exc()
    
    # Resumen final
    print("\n" + "=" * 80)
    print("📊 RESUMEN FINAL")
    print("=" * 80)
    print(f"✅ Exitosos: {len(results['success'])}")
    if results["success"]:
        for email in results["success"]:
            print(f"   - {email}")
    print(f"❌ Fallidos: {len(results['failed'])}")
    if results["failed"]:
        for email in results["failed"]:
            print(f"   - {email}")
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

