#!/usr/bin/env python3
"""
Script para configurar elena@visionarieshub.com como alias de talent@visionarieshub.com.
- talent@visionarieshub.com es la cuenta principal (Google Sign-In)
- elena@visionarieshub.com es el alias para envío de correos
- Ambos deben tener los mismos permisos y acceso
"""

import os
import sys
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore, auth

SERVICE_ACCOUNT_PATH = "/Users/gabrielapino/Library/Mobile Documents/com~apple~CloudDocs/9 nov 2025/visionaries-tech-firebase-adminsdk-fbsvc-5e928cfca6.json"

EMAIL_PRINCIPAL = "talent@visionarieshub.com"  # Cuenta de Google Sign-In
EMAIL_ALIAS = "elena@visionarieshub.com"  # Alias para correos
NAME_ALIAS = "Elena Cerón"

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

def find_user_in_aura(db, email: str):
    """Busca un usuario en Aura."""
    aura_platform = find_platform_by_code(db, "visionaries-aura")
    if not aura_platform:
        return None
    
    users_ref = db.collection("platforms").document(aura_platform["platform_id"]).collection("users")
    query = users_ref.where("email", "==", email).limit(1)
    docs = query.stream()
    
    for doc in docs:
        return {
            "user_id": doc.id,
            "data": doc.to_dict(),
            "ref": doc.reference
        }
    return None

def get_talent_user_info():
    """Obtiene información del usuario talent."""
    try:
        user = auth.get_user_by_email(EMAIL_PRINCIPAL)
        return {
            "uid": user.uid,
            "email": user.email,
            "display_name": user.display_name,
            "custom_claims": user.custom_claims or {},
        }
    except auth.UserNotFoundError:
        raise Exception(f"Usuario {EMAIL_PRINCIPAL} no encontrado en Firebase Auth")
    except Exception as e:
        raise Exception(f"Error obteniendo usuario {EMAIL_PRINCIPAL}: {e}")

def create_or_update_elena_in_aura(db, talent_uid: str):
    """Crea o actualiza el usuario elena en Aura, vinculado al UID de talent."""
    existing = find_user_in_aura(db, EMAIL_ALIAS)
    
    aura_platform = find_platform_by_code(db, "visionaries-aura")
    if not aura_platform:
        raise Exception("Plataforma visionaries-aura no encontrada")
    
    users_ref = db.collection("platforms").document(aura_platform["platform_id"]).collection("users")
    
    name_parts = NAME_ALIAS.split()
    user_data = {
        "email": EMAIL_ALIAS,  # Usar el alias como email principal en Firestore
        "isActive": True,
        "providerId": EMAIL_ALIAS,
        "visionariesFirebaseUserId": talent_uid,  # Vincular al UID de talent
        "onboardedAt": "",
        "firstName": name_parts[0] if name_parts else "",
        "lastName": " ".join(name_parts[1:]) if len(name_parts) > 1 else "",
        "companyName": "",
        "aliasOf": EMAIL_PRINCIPAL,  # Campo adicional para indicar que es alias
    }
    
    if existing:
        # Actualizar usuario existente
        existing["ref"].update(user_data)
        print(f"   ✅ Usuario actualizado en Aura (User ID: {existing['user_id']})")
        return existing['user_id']
    else:
        # Crear nuevo usuario
        new_user_ref = users_ref.add(user_data)
        print(f"   ✅ Usuario creado en Aura (User ID: {new_user_ref[1].id})")
        return new_user_ref[1].id

def create_or_update_elena_in_admin_platform(db, talent_uid: str, aura_user_id: str):
    """Crea o actualiza el usuario elena en Admin Platform."""
    admin_users_ref = db.collection("visionaries-platform-admin").document("users").collection("users")
    query = admin_users_ref.where("email", "==", EMAIL_ALIAS).limit(1)
    docs = list(query.stream())
    
    # Obtener allowedRoutes del usuario talent
    talent_user = auth.get_user(talent_uid)
    talent_claims = talent_user.custom_claims or {}
    allowed_routes = talent_claims.get("allowedRoutes", ["/projects", "/equipo"])
    
    user_data = {
        "email": EMAIL_ALIAS,  # Usar el alias como email principal
        "auraUserId": aura_user_id,
        "firebaseUserId": talent_uid,  # Vincular al UID de talent
        "hasPortalAdminAccess": True,
        "allowedRoutes": allowed_routes,
        "role": "admin",
        "aliasOf": EMAIL_PRINCIPAL,  # Campo adicional
        "updatedAt": datetime.utcnow().isoformat() + "Z",
    }
    
    if docs:
        # Actualizar usuario existente
        doc_ref = docs[0].reference
        doc_ref.update(user_data)
        print(f"   ✅ Usuario actualizado en Admin Platform (User ID: {docs[0].id})")
        return docs[0].id
    else:
        # Crear nuevo usuario
        user_data["createdAt"] = datetime.utcnow().isoformat() + "Z"
        new_user_ref = admin_users_ref.add(user_data)
        print(f"   ✅ Usuario creado en Admin Platform (User ID: {new_user_ref[1].id})")
        return new_user_ref[1].id

def main():
    """Función principal."""
    print("=" * 80)
    print("🔧 CONFIGURAR ALIAS: elena@visionarieshub.com")
    print("=" * 80)
    print(f"\nEmail Principal (Google Sign-In): {EMAIL_PRINCIPAL}")
    print(f"Email Alias (para correos): {EMAIL_ALIAS}")
    print(f"Nombre: {NAME_ALIAS}")
    print("\nConfiguración:")
    print("  ✅ elena@visionarieshub.com se vinculará al UID de talent@visionarieshub.com")
    print("  ✅ Mismos permisos que talent (acceso a /projects y /equipo)")
    print("  ✅ En Firestore se usará elena@visionarieshub.com como email principal")
    print("=" * 80)
    
    db = initialize_firebase()
    
    # Paso 1: Obtener información del usuario talent
    print(f"\n1️⃣  Obteniendo información de {EMAIL_PRINCIPAL}...")
    talent_info = get_talent_user_info()
    print(f"   ✅ UID: {talent_info['uid']}")
    print(f"   ✅ Email: {talent_info['email']}")
    print(f"   ✅ Allowed Routes: {talent_info['custom_claims'].get('allowedRoutes', [])}")
    
    # Paso 2: Crear/actualizar en Aura
    print(f"\n2️⃣  Configurando en Aura...")
    aura_user_id = create_or_update_elena_in_aura(db, talent_info['uid'])
    
    # Paso 3: Crear/actualizar en Admin Platform
    print(f"\n3️⃣  Configurando en Admin Platform...")
    admin_user_id = create_or_update_elena_in_admin_platform(db, talent_info['uid'], aura_user_id)
    
    # Paso 4: Verificar que no exista como usuario separado en Auth
    print(f"\n4️⃣  Verificando Firebase Auth...")
    try:
        elena_user = auth.get_user_by_email(EMAIL_ALIAS)
        if elena_user.uid != talent_info['uid']:
            print(f"   ⚠️  ADVERTENCIA: {EMAIL_ALIAS} existe como usuario separado en Firebase Auth")
            print(f"      UID: {elena_user.uid} (diferente de {talent_info['uid']})")
            print(f"      Esto puede causar conflictos. Considera eliminar este usuario o vincularlo.")
        else:
            print(f"   ✅ {EMAIL_ALIAS} está vinculado al mismo UID que {EMAIL_PRINCIPAL}")
    except auth.UserNotFoundError:
        print(f"   ✅ {EMAIL_ALIAS} no existe como usuario separado en Firebase Auth (correcto)")
        print(f"      El usuario se autenticará con {EMAIL_PRINCIPAL} pero usará {EMAIL_ALIAS} en Firestore")
    
    # Resumen
    print("\n" + "=" * 80)
    print("✅ CONFIGURACIÓN COMPLETADA")
    print("=" * 80)
    print(f"\n📋 Resumen:")
    print(f"   Email Principal (Google Sign-In): {EMAIL_PRINCIPAL}")
    print(f"   Email Alias (Firestore): {EMAIL_ALIAS}")
    print(f"   Firebase Auth UID: {talent_info['uid']}")
    print(f"   Aura User ID: {aura_user_id}")
    print(f"   Admin Platform User ID: {admin_user_id}")
    print(f"\n📝 Notas:")
    print(f"   - El usuario se autenticará con Google usando {EMAIL_PRINCIPAL}")
    print(f"   - En Firestore (Aura y Admin Platform) se usará {EMAIL_ALIAS}")
    print(f"   - Los correos deben enviarse a {EMAIL_ALIAS}")
    print(f"   - Tiene los mismos permisos que {EMAIL_PRINCIPAL}")

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


