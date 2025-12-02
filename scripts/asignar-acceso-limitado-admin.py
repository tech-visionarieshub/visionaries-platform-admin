#!/usr/bin/env python3
"""
Script para asignar acceso limitado al Admin Platform.
Usuarios con acceso solo a /projects y /equipo.
En /projects solo verán proyectos donde están en teamMembers.
"""

import os
import sys
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore, auth

SERVICE_ACCOUNT_PATH = "/Users/gabrielapino/Library/Mobile Documents/com~apple~CloudDocs/9 nov 2025/visionaries-tech-firebase-adminsdk-fbsvc-5e928cfca6.json"

# Usuarios a asignar con acceso limitado
USUARIOS_LIMITADOS = [
    "talent@visionarieshub.com",
    "design@visionarieshub.com",
    "ximena@visionarieshub.com",
    "rodolfo@visionarieshub.com",
    "joseangel@visionarieshub.com",
]

# Rutas permitidas para estos usuarios
ALLOWED_ROUTES = ["/projects", "/equipo"]

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

def create_user_in_auth(email: str, display_name: str = None):
    """Crea o verifica un usuario en Firebase Auth."""
    try:
        existing = auth.get_user_by_email(email)
        print(f"   ✅ Usuario ya existe en Firebase Auth (UID: {existing.uid})")
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
            print(f"   ✅ Usuario creado en Firebase Auth (UID: {new_user.uid})")
            return new_user.uid
        except Exception as e:
            print(f"   ❌ Error al crear usuario en Auth: {e}")
            raise

def create_user_in_aura(db, email: str, auth_uid: str, display_name: str = None):
    """Crea o verifica un usuario en la plataforma Aura."""
    existing = find_user_in_aura(db, email)
    if existing:
        print(f"   ✅ Usuario ya existe en Aura (User ID: {existing['user_id']})")
        return existing['user_id']
    
    aura_platform = find_platform_by_code(db, "visionaries-aura")
    if not aura_platform:
        raise Exception("Plataforma visionaries-aura no encontrada")
    
    users_ref = db.collection("platforms").document(aura_platform["platform_id"]).collection("users")
    
    name_parts = display_name.split() if display_name else []
    user_data = {
        "email": email,
        "isActive": True,
        "providerId": email,
        "visionariesFirebaseUserId": auth_uid,
        "onboardedAt": "",
        "firstName": name_parts[0] if name_parts else "",
        "lastName": " ".join(name_parts[1:]) if len(name_parts) > 1 else "",
        "companyName": "",
    }
    
    new_user_ref = users_ref.add(user_data)
    print(f"   ✅ Usuario creado en Aura (User ID: {new_user_ref[1].id})")
    return new_user_ref[1].id

def create_user_in_admin_platform(db, email: str, auth_uid: str, aura_user_id: str):
    """Crea o actualiza un usuario en visionaries-platform-admin."""
    admin_users_ref = db.collection("visionaries-platform-admin").document("users").collection("users")
    query = admin_users_ref.where("email", "==", email).limit(1)
    docs = list(query.stream())
    
    user_data = {
        "email": email,
        "auraUserId": aura_user_id,
        "firebaseUserId": auth_uid,
        "hasPortalAdminAccess": True,
        "allowedRoutes": ALLOWED_ROUTES,
        "role": "admin",
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

def set_custom_claims(auth_uid: str, email: str):
    """Establece los custom claims en Firebase Auth."""
    try:
        # Obtener claims actuales
        user = auth.get_user(auth_uid)
        current_claims = user.custom_claims or {}
        
        # Actualizar claims
        new_claims = {
            **current_claims,
            "internal": True,
            "role": "admin",
            "allowedRoutes": ALLOWED_ROUTES,
            "superadmin": False,  # Asegurar que NO es superadmin
        }
        
        auth.set_custom_user_claims(auth_uid, new_claims)
        print(f"   ✅ Custom claims asignados:")
        print(f"      - internal: True")
        print(f"      - role: admin")
        print(f"      - allowedRoutes: {ALLOWED_ROUTES}")
        print(f"      - superadmin: False")
        return True
    except Exception as e:
        print(f"   ❌ Error al asignar custom claims: {e}")
        raise

def process_user(db, email: str):
    """Procesa un usuario completo."""
    print(f"\n{'='*80}")
    print(f"📝 Procesando: {email}")
    print(f"{'='*80}")
    
    # Obtener nombre del email
    name = email.split("@")[0].replace(".", " ").title()
    
    # Paso 1: Firebase Auth
    print(f"\n1️⃣  Firebase Auth:")
    auth_uid = create_user_in_auth(email, name)
    
    # Paso 2: Aura
    print(f"\n2️⃣  Aura:")
    aura_user_id = create_user_in_aura(db, email, auth_uid, name)
    
    # Paso 3: Admin Platform (Firestore)
    print(f"\n3️⃣  Admin Platform (Firestore):")
    admin_user_id = create_user_in_admin_platform(db, email, auth_uid, aura_user_id)
    
    # Paso 4: Custom Claims
    print(f"\n4️⃣  Custom Claims (Firebase Auth):")
    set_custom_claims(auth_uid, email)
    
    print(f"\n✅ {email} configurado correctamente")
    return {
        "email": email,
        "auth_uid": auth_uid,
        "aura_user_id": aura_user_id,
        "admin_user_id": admin_user_id,
    }

def verify_user(db, email: str):
    """Verifica la configuración de un usuario."""
    print(f"\n{'='*80}")
    print(f"🔍 Verificando: {email}")
    print(f"{'='*80}")
    
    try:
        # Verificar Firebase Auth
        user = auth.get_user_by_email(email)
        claims = user.custom_claims or {}
        
        print(f"\n📋 Firebase Auth:")
        print(f"   UID: {user.uid}")
        print(f"   Email: {user.email}")
        print(f"   Custom Claims:")
        print(f"      - internal: {claims.get('internal', 'NO')}")
        print(f"      - role: {claims.get('role', 'NO')}")
        print(f"      - allowedRoutes: {claims.get('allowedRoutes', 'NO')}")
        print(f"      - superadmin: {claims.get('superadmin', 'NO')}")
        
        # Verificar Aura
        aura_user = find_user_in_aura(db, email)
        if aura_user:
            print(f"\n📋 Aura:")
            print(f"   User ID: {aura_user['user_id']}")
            print(f"   Is Active: {aura_user['data'].get('isActive', False)}")
        else:
            print(f"\n⚠️  Aura: Usuario no encontrado")
        
        # Verificar Admin Platform
        admin_users_ref = db.collection("visionaries-platform-admin").document("users").collection("users")
        query = admin_users_ref.where("email", "==", email).limit(1)
        docs = list(query.stream())
        
        if docs:
            admin_data = docs[0].to_dict()
            print(f"\n📋 Admin Platform:")
            print(f"   User ID: {docs[0].id}")
            print(f"   hasPortalAdminAccess: {admin_data.get('hasPortalAdminAccess', False)}")
            print(f"   allowedRoutes: {admin_data.get('allowedRoutes', [])}")
            print(f"   role: {admin_data.get('role', 'NO')}")
        else:
            print(f"\n⚠️  Admin Platform: Usuario no encontrado")
        
        # Verificar consistencia
        print(f"\n✅ Verificación completada")
        return True
        
    except auth.UserNotFoundError:
        print(f"\n❌ Usuario no encontrado en Firebase Auth")
        return False
    except Exception as e:
        print(f"\n❌ Error en verificación: {e}")
        return False

def main():
    """Función principal."""
    print("=" * 80)
    print("🔧 ASIGNAR ACCESO LIMITADO AL ADMIN PLATFORM")
    print("=" * 80)
    print(f"\nUsuarios a configurar: {len(USUARIOS_LIMITADOS)}")
    print(f"Rutas permitidas: {ALLOWED_ROUTES}")
    print(f"\nEstos usuarios podrán:")
    print(f"  ✅ Acceder a /projects (solo proyectos donde están en teamMembers)")
    print(f"  ✅ Acceder a /equipo")
    print(f"  ❌ NO podrán acceder a otras secciones (CRM, Finanzas, Cotizaciones, etc.)")
    print("=" * 80)
    
    db = initialize_firebase()
    
    results = []
    for email in USUARIOS_LIMITADOS:
        try:
            result = process_user(db, email)
            results.append(result)
        except Exception as e:
            print(f"\n❌ Error procesando {email}: {e}")
            import traceback
            traceback.print_exc()
            results.append({"email": email, "error": str(e)})
    
    # Resumen
    print("\n" + "=" * 80)
    print("📊 RESUMEN")
    print("=" * 80)
    print(f"\nTotal procesados: {len(results)}")
    successful = [r for r in results if "error" not in r]
    failed = [r for r in results if "error" in r]
    
    if successful:
        print(f"\n✅ Exitosos ({len(successful)}):")
        for r in successful:
            print(f"   - {r['email']}")
    
    if failed:
        print(f"\n❌ Fallidos ({len(failed)}):")
        for r in failed:
            print(f"   - {r['email']}: {r['error']}")
    
    # Verificación final
    print("\n" + "=" * 80)
    print("🔍 VERIFICACIÓN FINAL")
    print("=" * 80)
    
    for email in USUARIOS_LIMITADOS:
        verify_user(db, email)
    
    print("\n" + "=" * 80)
    print("✅ PROCESO COMPLETADO")
    print("=" * 80)
    print("\n📝 Nota: Los usuarios necesitarán cerrar sesión y volver a iniciar")
    print("   sesión para que los custom claims se actualicen en su token.")

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




