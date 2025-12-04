#!/usr/bin/env python3
"""
Script para revisar y corregir el usuario arelyibarra@visionarieshub.com
"""

import firebase_admin
from firebase_admin import credentials, firestore, auth
from datetime import datetime
import sys
import os

# Rutas de service accounts
SERVICE_ACCOUNT_PATHS = [
    "/Users/gabrielapino/Downloads/visionaries-platform-admin-firebase-adminsdk-fbsvc-eb269c3166.json",
    "/Users/gabrielapino/Library/Mobile Documents/com~apple~CloudDocs/9 nov 2025/visionaries-tech-firebase-adminsdk-fbsvc-5e928cfca6.json"
]

EMAIL = "arelyibarra@visionarieshub.com"

def find_service_account(project_id):
    """Encuentra el service account para un proyecto específico."""
    for path in SERVICE_ACCOUNT_PATHS:
        if os.path.exists(path):
            try:
                # Leer el JSON para verificar el project_id
                import json
                with open(path, 'r') as f:
                    data = json.load(f)
                    if data.get('project_id') == project_id:
                        return path
            except:
                continue
    return None

def initialize_firebase():
    """Inicializa Firebase Admin SDK para ambos proyectos."""
    apps = {}
    
    # Inicializar visionaries-tech (para Auth)
    try:
        tech_path = find_service_account('visionaries-tech')
        if not tech_path:
            # Intentar con cualquier service account disponible
            for path in SERVICE_ACCOUNT_PATHS:
                if os.path.exists(path):
                    tech_path = path
                    break
        
        if tech_path:
            cred_tech = credentials.Certificate(tech_path)
            try:
                app_tech = firebase_admin.get_app('tech')
            except ValueError:
                app_tech = firebase_admin.initialize_app(cred_tech, {
                    'projectId': 'visionaries-tech'
                }, name='tech')
            apps['tech'] = app_tech
            print("✓ Firebase Admin inicializado (visionaries-tech)")
    except Exception as e:
        print(f"⚠️  Error inicializando visionaries-tech: {e}")
    
    # Inicializar visionaries-platform-admin (para Firestore)
    try:
        platform_path = find_service_account('visionaries-platform-admin')
        if not platform_path:
            # Intentar con cualquier service account disponible
            for path in SERVICE_ACCOUNT_PATHS:
                if os.path.exists(path):
                    platform_path = path
                    break
        
        if platform_path:
            cred_platform = credentials.Certificate(platform_path)
            try:
                app_platform = firebase_admin.get_app('platform-admin')
            except ValueError:
                app_platform = firebase_admin.initialize_app(cred_platform, {
                    'projectId': 'visionaries-platform-admin'
                }, name='platform-admin')
            apps['platform'] = app_platform
            print("✓ Firebase Admin inicializado (visionaries-platform-admin)")
    except Exception as e:
        print(f"⚠️  Error inicializando visionaries-platform-admin: {e}")
    
    return apps

def main():
    print("=" * 60)
    print("REVISIÓN Y CORRECCIÓN DE USUARIO")
    print("=" * 60)
    print(f"\nEmail: {EMAIL}")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Inicializar Firebase
    apps = initialize_firebase()
    
    if 'tech' not in apps:
        print("❌ Error: No se pudo inicializar visionaries-tech")
        print("   Necesitas el service account de visionaries-tech para Auth")
        sys.exit(1)
    
    if 'platform' not in apps:
        print("❌ Error: No se pudo inicializar visionaries-platform-admin")
        print("   Necesitas el service account de visionaries-platform-admin para Firestore")
        sys.exit(1)
    
    # 1. Verificar en Firebase Auth
    print("\n🔍 1. VERIFICANDO EN FIREBASE AUTH...\n")
    try:
        auth_instance = auth.Client(app=apps['tech'])
        user = auth_instance.get_user_by_email(EMAIL)
        print(f"✅ Usuario encontrado en Firebase Auth")
        print(f"   UID: {user.uid}")
        print(f"   Email verificado: {user.email_verified}")
        
        # Custom Claims
        claims = user.custom_claims or {}
        print(f"\n📋 Custom Claims actuales:")
        print(f"   internal: {claims.get('internal', False)}")
        print(f"   role: {claims.get('role', 'NO')}")
        print(f"   superadmin: {claims.get('superadmin', False)}")
        
        has_internal = claims.get('internal', False) == True
        has_role = bool(claims.get('role'))
        
        # 2. Verificar en Firestore
        print("\n🔍 2. VERIFICANDO EN FIRESTORE...\n")
        db = firestore.client(app=apps['platform'])
        users_ref = db.collection('users')
        snapshot = list(users_ref.where('email', '==', EMAIL).limit(1).stream())
        
        firestore_data = None
        if len(snapshot) > 0:
            doc = snapshot[0]
            data = doc.to_dict()
            firestore_data = {
                'doc_id': doc.id,
                'has_portal_access': data.get('hasPortalAdminAccess', False),
                'is_active': data.get('isActive', True),
            }
            print("✅ Usuario encontrado en Firestore")
            print(f"   Document ID: {doc.id}")
            print(f"   hasPortalAdminAccess: {firestore_data['has_portal_access']}")
            print(f"   isActive: {firestore_data['is_active']}")
        else:
            print("❌ Usuario NO encontrado en Firestore")
        
        # 3. Verificar proyectos
        print("\n🔍 3. VERIFICANDO PROYECTOS...\n")
        projects_ref = db.collection('projects')
        all_projects = list(projects_ref.stream())
        
        total = len(all_projects)
        con_acceso = sum(1 for doc in all_projects if EMAIL in (doc.to_dict().get('teamMembers', [])))
        
        print(f"📊 Total de proyectos: {total}")
        print(f"📊 Proyectos con acceso: {con_acceso}")
        print(f"📊 Proyectos sin acceso: {total - con_acceso}")
        
        # 4. Corregir problemas
        print("\n" + "─" * 60)
        print("🔧 CORRIGIENDO PROBLEMAS...\n")
        
        cambios = False
        
        # Corregir Custom Claims
        nuevos_claims = dict(claims) if claims else {}
        claims_actualizados = False
        
        if not has_internal:
            nuevos_claims['internal'] = True
            claims_actualizados = True
        
        if not has_role:
            nuevos_claims['role'] = 'admin'
            claims_actualizados = True
        
        # Agregar allowedRoutes para Finanzas, CRM y Equipo
        allowed_routes = nuevos_claims.get('allowedRoutes', [])
        rutas_necesarias = ['/finanzas', '/crm', '/equipo']
        rutas_agregadas = []
        
        for ruta in rutas_necesarias:
            if ruta not in allowed_routes:
                allowed_routes.append(ruta)
                rutas_agregadas.append(ruta)
                claims_actualizados = True
        
        if claims_actualizados:
            nuevos_claims['allowedRoutes'] = allowed_routes
            print("📝 Actualizando Custom Claims...")
            auth_instance.set_custom_user_claims(user.uid, nuevos_claims)
            print("✅ Custom Claims actualizados:")
            print(f"   internal: {nuevos_claims.get('internal', False)}")
            print(f"   role: {nuevos_claims.get('role', 'NO')}")
            if rutas_agregadas:
                print(f"   allowedRoutes agregadas: {', '.join(rutas_agregadas)}")
            print(f"   Total allowedRoutes: {len(allowed_routes)}")
            cambios = True
        else:
            print("✅ Custom Claims correctos")
            if allowed_routes:
                print(f"   allowedRoutes actuales: {', '.join(allowed_routes)}")
        
        # Corregir Firestore
        if not firestore_data or not firestore_data['has_portal_access']:
            print("📝 Actualizando Firestore...")
            if firestore_data:
                # Actualizar documento existente
                users_ref.document(firestore_data['doc_id']).update({
                    'hasPortalAdminAccess': True,
                    'updatedAt': firestore.SERVER_TIMESTAMP
                })
                print("✅ Firestore actualizado: hasPortalAdminAccess = true")
            else:
                # Crear nuevo documento
                new_doc = users_ref.document()
                new_doc.set({
                    'email': EMAIL,
                    'name': EMAIL.split('@')[0],
                    'isActive': True,
                    'hasPortalAdminAccess': True,
                    'createdAt': firestore.SERVER_TIMESTAMP,
                    'updatedAt': firestore.SERVER_TIMESTAMP
                })
                print(f"✅ Documento creado en Firestore con hasPortalAdminAccess = true")
            cambios = True
        else:
            print("✅ Firestore correcto: hasPortalAdminAccess = true")
        
        # Resumen final
        print("\n" + "═" * 60)
        print("📋 RESUMEN FINAL\n")
        
        if cambios:
            print("✅ Cambios realizados exitosamente")
            print("\n⚠️  IMPORTANTE: El usuario debe:")
            print("   1. Cerrar sesión en Aura")
            print("   2. Volver a iniciar sesión")
            print("   3. Los Custom Claims se actualizarán en el próximo login")
        else:
            print("✅ Usuario ya está correctamente configurado")
            print("\n💡 Si el usuario no puede ver proyectos, verifica:")
            print(f"   - Que esté en el array teamMembers de los proyectos ({con_acceso}/{total} proyectos)")
            print("   - Que haya cerrado sesión y vuelto a entrar")
            print("   - Que el token no esté cacheado")
        
        print("\n" + "═" * 60 + "\n")
        
    except Exception as e:
        if 'user-not-found' in str(e).lower():
            print("❌ Usuario NO encontrado en Firebase Auth")
            print("   El usuario debe registrarse primero en Aura")
            sys.exit(1)
        else:
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)

if __name__ == "__main__":
    main()

