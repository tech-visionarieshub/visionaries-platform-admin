#!/usr/bin/env python3
"""
Script para asignar las automatizaciones del usuario original a todos los usuarios alias.

Este script:
1. Para cada empresa, encuentra el usuario original (el que tiene automatizaciones)
2. Copia esas automatizaciones a todos los usuarios alias (-ai, -gp, -ra, -pz) de esa empresa
"""

import os
import sys
import firebase_admin
from firebase_admin import credentials, firestore, auth

SERVICE_ACCOUNT_PATH = "/Users/gabrielapino/Library/Mobile Documents/com~apple~CloudDocs/9 nov 2025/visionaries-tech-firebase-adminsdk-fbsvc-5e928cfca6.json"

# Lista de empresas y sus usuarios originales conocidos
# Si no se especifica, el script buscará el usuario con más automatizaciones
USUARIOS_ORIGINALES = {
    "privarsa": "magic@visionarieshub.com",  # Usuario original con automatizaciones
    "donleo": "arelyibarra@visionarieshub.com",
    "gefe": "rodolfo@visionarieshub.com",
    # Para las demás, el script buscará automáticamente
}

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

def get_all_users_in_platform(db, platform_id: str):
    """Obtiene todos los usuarios de una plataforma."""
    users_ref = db.collection("platforms").document(platform_id).collection("users")
    users = []
    for doc in users_ref.stream():
        users.append({
            "user_id": doc.id,
            "data": doc.to_dict(),
            "ref": doc.reference
        })
    return users

def find_original_user(users, platform_code: str):
    """Encuentra el usuario original (el que tiene automatizaciones)."""
    # Primero, intentar usar el usuario original conocido
    if platform_code in USUARIOS_ORIGINALES:
        original_email = USUARIOS_ORIGINALES[platform_code]
        for user in users:
            if user["data"].get("email") == original_email:
                automations = user["data"].get("allowedAutomationsIds", [])
                if automations:
                    return user
    
    # Buscar el usuario con más automatizaciones (priorizando no-alias, pero aceptando cualquiera)
    best_user = None
    max_automations = 0
    best_is_alias = True
    
    for user in users:
        email = user["data"].get("email", "")
        is_alias = any(suffix in email for suffix in ["-ai@", "-gp@", "-ra@", "-pz@"])
        automations = user["data"].get("allowedAutomationsIds", [])
        
        # Preferir usuarios no-alias, pero si no hay, usar el que tenga más automatizaciones
        if len(automations) > 0:
            if not is_alias and (best_user is None or best_is_alias or len(automations) > max_automations):
                max_automations = len(automations)
                best_user = user
                best_is_alias = False
            elif is_alias and (best_user is None or (best_is_alias and len(automations) > max_automations)):
                max_automations = len(automations)
                best_user = user
                best_is_alias = True
    
    return best_user

def is_alias_user(email: str) -> bool:
    """Verifica si un email es un usuario alias."""
    return any(suffix in email for suffix in ["-ai@", "-gp@", "-ra@", "-pz@"])

def assign_automations_to_user(user_ref, automations_ids: list, automations_fields: list = None):
    """Asigna automatizaciones a un usuario."""
    updates = {
        "allowedAutomationsIds": automations_ids
    }
    
    if automations_fields:
        updates["allowedAutomationsFields"] = automations_fields
    
    user_ref.update(updates)
    return True

def process_platform(db, platform_code: str):
    """Procesa una plataforma: encuentra el usuario original y copia automatizaciones a los alias."""
    print("\n" + "=" * 80)
    print(f"🏢 PROCESANDO: {platform_code.upper()}")
    print("=" * 80)
    
    # 1. Buscar la plataforma
    platform = find_platform_by_code(db, platform_code)
    if not platform:
        print(f"❌ Plataforma '{platform_code}' no encontrada")
        return False
    
    platform_id = platform["platform_id"]
    platform_name = platform["data"].get("name", platform_code)
    print(f"✅ Plataforma encontrada: {platform_name} ({platform_id})")
    
    # 2. Obtener todos los usuarios de la plataforma
    all_users = get_all_users_in_platform(db, platform_id)
    print(f"📋 Total de usuarios en la plataforma: {len(all_users)}")
    
    if not all_users:
        print(f"⚠️  No hay usuarios en esta plataforma")
        return False
    
    # 3. Encontrar el usuario original (el que tiene automatizaciones)
    original_user = find_original_user(all_users, platform_code)
    
    if not original_user:
        print(f"❌ No se encontró usuario original con automatizaciones")
        return False
    
    original_email = original_user["data"].get("email")
    automations_ids = original_user["data"].get("allowedAutomationsIds", [])
    automations_fields = original_user["data"].get("allowedAutomationsFields", [])
    
    print(f"\n👤 Usuario original encontrado: {original_email}")
    print(f"   Automatizaciones: {len(automations_ids)}")
    
    if not automations_ids:
        print(f"⚠️  El usuario original no tiene automatizaciones asignadas")
        return False
    
    # 4. Encontrar todos los usuarios alias
    alias_users = [u for u in all_users if is_alias_user(u["data"].get("email", ""))]
    
    if not alias_users:
        print(f"⚠️  No se encontraron usuarios alias en esta plataforma")
        return False
    
    print(f"\n📋 Usuarios alias encontrados: {len(alias_users)}")
    for alias in alias_users:
        print(f"   - {alias['data'].get('email')}")
    
    # 5. Asignar automatizaciones a cada usuario alias
    print(f"\n🔄 Asignando automatizaciones a usuarios alias...")
    updated_count = 0
    
    for alias in alias_users:
        alias_email = alias["data"].get("email")
        current_automations = alias["data"].get("allowedAutomationsIds", [])
        
        # Verificar si ya tiene las mismas automatizaciones
        if set(current_automations) == set(automations_ids):
            print(f"   ⏭️  {alias_email}: Ya tiene las automatizaciones correctas")
            continue
        
        # Actualizar
        try:
            assign_automations_to_user(
                alias["ref"],
                automations_ids,
                automations_fields
            )
            print(f"   ✅ {alias_email}: {len(automations_ids)} automatizaciones asignadas")
            updated_count += 1
        except Exception as e:
            print(f"   ❌ {alias_email}: Error al asignar - {e}")
    
    print(f"\n✅ Proceso completado: {updated_count} usuario(s) actualizado(s)")
    return True

def main():
    """Función principal."""
    print("=" * 80)
    print("🤖 ASIGNAR AUTOMATIZACIONES A USUARIOS ALIAS")
    print("=" * 80)
    print("\nEste script copiará las automatizaciones del usuario original")
    print("a todos los usuarios alias (-ai, -gp, -ra, -pz) de cada empresa.\n")
    
    # Lista de empresas a procesar
    empresas = [
        "finsa", "privarsa", "donleo", "gefe", "cheicargo", "tauro", "edc",
        "evco", "lasalle", "powerstein", "unoretail", "alurtek", "3a", "sgac",
        "lozen", "racing"
    ]
    
    db = initialize_firebase()
    
    results = {
        "success": [],
        "failed": [],
        "skipped": []
    }
    
    for empresa in empresas:
        try:
            success = process_platform(db, empresa)
            if success:
                results["success"].append(empresa)
            else:
                results["skipped"].append(empresa)
        except Exception as e:
            print(f"\n❌ Error procesando {empresa}: {e}")
            results["failed"].append(empresa)
    
    # Resumen final
    print("\n" + "=" * 80)
    print("📊 RESUMEN FINAL")
    print("=" * 80)
    print(f"✅ Exitosos: {len(results['success'])}")
    if results["success"]:
        print(f"   → {', '.join(results['success'])}")
    print(f"⏭️  Omitidos: {len(results['skipped'])}")
    if results["skipped"]:
        print(f"   → {', '.join(results['skipped'])}")
    print(f"❌ Fallidos: {len(results['failed'])}")
    if results["failed"]:
        print(f"   → {', '.join(results['failed'])}")
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

