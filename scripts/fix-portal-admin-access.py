#!/usr/bin/env python3
"""
Script para corregir el acceso al Portal Admin para usuarios.
Establece tanto custom claims (Firebase Auth) como hasPortalAdminAccess (Firestore).

Uso:
    # Revisar un usuario
    python3 scripts/fix-portal-admin-access.py --revisar gabypino@visionarieshub.com

    # Corregir un usuario
    python3 scripts/fix-portal-admin-access.py --corregir arelyibarra@visionarieshub.com

    # Corregir múltiples usuarios
    python3 scripts/fix-portal-admin-access.py --corregir usuario1@example.com usuario2@example.com

    # Corregir todos los usuarios que tienen hasPortalAdminAccess pero no custom claims
    python3 scripts/fix-portal-admin-access.py --corregir-todos
"""

import os
import sys
import argparse
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore, auth

SERVICE_ACCOUNT_PATH = "/Users/gabrielapino/Library/Mobile Documents/com~apple~CloudDocs/9 nov 2025/visionaries-tech-firebase-adminsdk-fbsvc-5e928cfca6.json"

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

def revisar_usuario(db, email: str):
    """Revisa la configuración completa de un usuario."""
    print("\n" + "=" * 80)
    print(f"🔍 REVISANDO: {email}")
    print("=" * 80)
    
    # 1. Firebase Auth
    try:
        auth_user = auth.get_user_by_email(email)
        print(f"\n✅ Firebase Auth:")
        print(f"   UID: {auth_user.uid}")
        print(f"   Email: {auth_user.email}")
        print(f"   Email Verified: {auth_user.email_verified}")
        
        # Custom Claims
        claims = auth_user.custom_claims or {}
        print(f"\n   Custom Claims:")
        print(f"   - internal: {claims.get('internal', False)}")
        print(f"   - role: {claims.get('role', 'N/A')}")
        print(f"   - superadmin: {claims.get('superadmin', False)}")
        
        has_internal = claims.get('internal') == True
        has_role = bool(claims.get('role'))
        
    except auth.UserNotFoundError:
        print(f"\n❌ Firebase Auth: Usuario no encontrado")
        return None
    
    # 2. Firestore (Admin Platform)
    admin_platform = find_platform_by_code(db, "visionaries-platform-admin")
    if not admin_platform:
        print(f"\n❌ Plataforma 'visionaries-platform-admin' no encontrada")
        return None
    
    admin_user = find_user_in_platform(db, admin_platform["platform_id"], email)
    
    if admin_user:
        print(f"\n✅ Firestore (Admin Platform):")
        print(f"   User ID: {admin_user['user_id']}")
        print(f"   hasPortalAdminAccess: {admin_user['data'].get('hasPortalAdminAccess', False)}")
        print(f"   isActive: {admin_user['data'].get('isActive', False)}")
    else:
        print(f"\n❌ Firestore (Admin Platform): Usuario no encontrado")
    
    # 3. Resumen
    print(f"\n📊 RESUMEN:")
    print(f"   Custom Claims (internal): {'✅' if has_internal else '❌'}")
    print(f"   Custom Claims (role): {'✅' if has_role else '❌'}")
    print(f"   Firestore (hasPortalAdminAccess): {'✅' if (admin_user and admin_user['data'].get('hasPortalAdminAccess')) else '❌'}")
    
    has_access = has_internal and has_role and (admin_user and admin_user['data'].get('hasPortalAdminAccess'))
    print(f"\n   Acceso Completo: {'✅ SÍ' if has_access else '❌ NO'}")
    
    return {
        "auth_user": auth_user,
        "claims": claims,
        "has_internal": has_internal,
        "has_role": has_role,
        "admin_user": admin_user,
        "has_portal_access": admin_user and admin_user['data'].get('hasPortalAdminAccess', False),
        "has_access": has_access
    }

def corregir_usuario(db, email: str):
    """Corrige la configuración de un usuario para que tenga acceso completo."""
    print("\n" + "=" * 80)
    print(f"🔧 CORRIGIENDO: {email}")
    print("=" * 80)
    
    # Revisar estado actual
    estado = revisar_usuario(db, email)
    if not estado:
        print(f"\n❌ No se pudo revisar el usuario. Verifica que exista en Firebase Auth.")
        return False
    
    auth_user = estado["auth_user"]
    claims = estado["claims"]
    admin_user = estado["admin_user"]
    
    cambios = []
    
    # 1. Actualizar Custom Claims si es necesario
    needs_claims_update = False
    new_claims = {**claims}
    
    if not claims.get('internal'):
        new_claims['internal'] = True
        needs_claims_update = True
        cambios.append("internal: true")
    
    if not claims.get('role'):
        new_claims['role'] = 'admin'
        needs_claims_update = True
        cambios.append("role: 'admin'")
    
    if needs_claims_update:
        try:
            auth.set_custom_user_claims(auth_user.uid, new_claims)
            print(f"\n✅ Custom Claims actualizados:")
            for cambio in cambios:
                print(f"   - {cambio}")
        except Exception as e:
            print(f"\n❌ Error actualizando custom claims: {e}")
            return False
    else:
        print(f"\n✅ Custom Claims ya están correctos")
    
    # 2. Actualizar/Crear en Firestore si es necesario
    admin_platform = find_platform_by_code(db, "visionaries-platform-admin")
    if not admin_platform:
        print(f"\n❌ Plataforma 'visionaries-platform-admin' no encontrada")
        return False
    
    platform_id = admin_platform["platform_id"]
    
    if admin_user:
        # Actualizar si no tiene hasPortalAdminAccess
        if not admin_user['data'].get('hasPortalAdminAccess'):
            try:
                admin_user['ref'].update({
                    "hasPortalAdminAccess": True,
                    "updatedAt": datetime.utcnow().isoformat() + "Z"
                })
                print(f"\n✅ Firestore actualizado: hasPortalAdminAccess = True")
                cambios.append("hasPortalAdminAccess: true (Firestore)")
            except Exception as e:
                print(f"\n❌ Error actualizando Firestore: {e}")
                return False
        else:
            print(f"\n✅ Firestore ya tiene hasPortalAdminAccess = True")
    else:
        # Crear usuario en Admin Platform
        # Primero necesitamos el Aura User ID
        aura_platform = find_platform_by_code(db, "visionaries-aura")
        if not aura_platform:
            print(f"\n❌ Plataforma 'visionaries-aura' no encontrada")
            return False
        
        aura_user = find_user_in_platform(db, aura_platform["platform_id"], email)
        if not aura_user:
            print(f"\n⚠️  Usuario no encontrado en Aura. Creando...")
            # Crear en Aura primero
            users_ref = db.collection("platforms").document(aura_platform["platform_id"]).collection("users")
            name_parts = email.split('@')[0].replace('.', ' ').title().split()
            firstName = name_parts[0] if name_parts else ""
            lastName = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
            
            aura_user_data = {
                "email": email,
                "isActive": True,
                "providerId": email,
                "visionariesFirebaseUserId": auth_user.uid,
                "onboardedAt": "",
                "firstName": firstName,
                "lastName": lastName,
                "companyName": "",
            }
            aura_user_ref = users_ref.add(aura_user_data)
            aura_user_id = aura_user_ref[1].id
            print(f"✅ Usuario creado en Aura: {aura_user_id}")
        else:
            aura_user_id = aura_user['user_id']
        
        # Crear en Admin Platform
        try:
            users_ref = db.collection("platforms").document(platform_id).collection("users")
            user_data = {
                "email": email,
                "name": email.split('@')[0].replace('.', ' ').title(),
                "isActive": True,
                "createdAt": datetime.utcnow().isoformat() + "Z",
                "auraUserId": aura_user_id,
                "hasPortalAdminAccess": True,
            }
            new_user_ref = users_ref.add(user_data)
            print(f"\n✅ Usuario creado en Admin Platform:")
            print(f"   User ID: {new_user_ref[1].id}")
            print(f"   hasPortalAdminAccess: True")
            cambios.append("Usuario creado en Admin Platform con hasPortalAdminAccess: true")
        except Exception as e:
            print(f"\n❌ Error creando usuario en Admin Platform: {e}")
            return False
    
    print("\n" + "=" * 80)
    print("✅ USUARIO CORREGIDO EXITOSAMENTE")
    print("=" * 80)
    if cambios:
        print("Cambios realizados:")
        for cambio in cambios:
            print(f"   - {cambio}")
    else:
        print("No se requirieron cambios (ya estaba correcto)")
    print("=" * 80)
    
    return True

def corregir_todos(db):
    """Corrige todos los usuarios que tienen hasPortalAdminAccess pero no custom claims."""
    print("\n" + "=" * 80)
    print("🔍 BUSCANDO USUARIOS A CORREGIR...")
    print("=" * 80)
    
    admin_platform = find_platform_by_code(db, "visionaries-platform-admin")
    if not admin_platform:
        print(f"\n❌ Plataforma 'visionaries-platform-admin' no encontrada")
        return
    
    platform_id = admin_platform["platform_id"]
    users_ref = db.collection("platforms").document(platform_id).collection("users")
    
    # Buscar usuarios con hasPortalAdminAccess
    query = users_ref.where("hasPortalAdminAccess", "==", True).stream()
    
    usuarios_a_corregir = []
    for doc in query:
        user_data = doc.to_dict()
        email = user_data.get("email")
        if email:
            usuarios_a_corregir.append(email)
    
    print(f"\n📋 Encontrados {len(usuarios_a_corregir)} usuarios con hasPortalAdminAccess")
    
    if not usuarios_a_corregir:
        print("✅ No hay usuarios que corregir")
        return
    
    resultados = []
    for email in usuarios_a_corregir:
        try:
            estado = revisar_usuario(db, email)
            if estado and not estado["has_access"]:
                print(f"\n🔧 Corrigiendo {email}...")
                if corregir_usuario(db, email):
                    resultados.append({"email": email, "status": "corregido"})
                else:
                    resultados.append({"email": email, "status": "error"})
            elif estado and estado["has_access"]:
                print(f"\n✅ {email} ya está correcto")
                resultados.append({"email": email, "status": "ya_correcto"})
        except Exception as e:
            print(f"\n❌ Error procesando {email}: {e}")
            resultados.append({"email": email, "status": "error"})
    
    print("\n" + "=" * 80)
    print("📊 RESUMEN")
    print("=" * 80)
    corregidos = len([r for r in resultados if r["status"] == "corregido"])
    ya_correctos = len([r for r in resultados if r["status"] == "ya_correcto"])
    errores = len([r for r in resultados if r["status"] == "error"])
    print(f"✅ Corregidos: {corregidos}")
    print(f"✅ Ya correctos: {ya_correctos}")
    print(f"❌ Errores: {errores}")
    print("=" * 80)

def main():
    """Función principal."""
    parser = argparse.ArgumentParser(
        description="Corregir acceso al Portal Admin",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Ejemplos:
  # Revisar un usuario
  python3 scripts/fix-portal-admin-access.py --revisar gabypino@visionarieshub.com

  # Corregir un usuario
  python3 scripts/fix-portal-admin-access.py --corregir arelyibarra@visionarieshub.com

  # Corregir múltiples usuarios
  python3 scripts/fix-portal-admin-access.py --corregir usuario1@example.com usuario2@example.com

  # Corregir todos los usuarios que necesitan corrección
  python3 scripts/fix-portal-admin-access.py --corregir-todos
        """
    )
    
    parser.add_argument("--revisar", help="Email del usuario a revisar")
    parser.add_argument("--corregir", nargs="+", help="Email(s) del(los) usuario(s) a corregir")
    parser.add_argument("--corregir-todos", action="store_true", help="Corregir todos los usuarios que necesitan corrección")
    
    args = parser.parse_args()
    
    if not args.revisar and not args.corregir and not args.corregir_todos:
        parser.print_help()
        sys.exit(1)
    
    try:
        db = initialize_firebase()
        
        if args.revisar:
            revisar_usuario(db, args.revisar)
        elif args.corregir:
            for email in args.corregir:
                corregir_usuario(db, email)
        elif args.corregir_todos:
            corregir_todos(db)
            
    except KeyboardInterrupt:
        print("\n\n❌ Operación cancelada por el usuario")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()

