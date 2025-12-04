#!/usr/bin/env python3
"""
Script para agregar miembros al equipo de todos los proyectos activos.

Agrega arelyibarra@visionarieshub.com y design@visionarieshub.com
a todos los proyectos que no estén archivados ni finalizados.
"""

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
import sys

# Rutas de service accounts (priorizar platform-admin)
SERVICE_ACCOUNT_PATHS = [
    "/Users/gabrielapino/Downloads/visionaries-platform-admin-firebase-adminsdk-fbsvc-eb269c3166.json",
    "/Users/gabrielapino/Library/Mobile Documents/com~apple~CloudDocs/9 nov 2025/visionaries-tech-firebase-adminsdk-fbsvc-5e928cfca6.json"
]

# Emails a agregar
EMAILS_TO_ADD = [
    "arelyibarra@visionarieshub.com",
    "design@visionarieshub.com"
]

def initialize_firebase():
    """Inicializa Firebase Admin SDK con el service account correcto."""
    try:
        # Intentar cargar el service account de platform-admin primero
        cred = None
        for path in SERVICE_ACCOUNT_PATHS:
            try:
                cred = credentials.Certificate(path)
                print(f"✓ Service account cargado: {path}")
                break
            except FileNotFoundError:
                continue
        
        if not cred:
            raise FileNotFoundError("No se encontró ningún service account válido")
        
        # Inicializar Firebase Admin
        try:
            app = firebase_admin.get_app('platform-admin')
            print("✓ Firebase Admin ya inicializado")
        except ValueError:
            app = firebase_admin.initialize_app(cred, {
                'projectId': 'visionaries-platform-admin'
            }, name='platform-admin')
            print("✓ Firebase Admin inicializado correctamente")
        
        return firestore.client(app=app)
    except Exception as e:
        print(f"❌ Error inicializando Firebase: {e}")
        sys.exit(1)

def get_active_projects(db):
    """Obtiene todos los proyectos activos (no archivados ni finalizados)."""
    try:
        projects_ref = db.collection('projects')
        
        # Obtener todos los proyectos
        all_projects = projects_ref.stream()
        
        active_projects = []
        for doc in all_projects:
            project_data = doc.to_dict()
            project_id = doc.id
            
            # Verificar si está archivado
            archived = project_data.get('archived', False)
            if archived:
                continue
            
            # Verificar si está finalizado
            status = project_data.get('status', '')
            if status == 'Finalizado':
                continue
            
            active_projects.append({
                'id': project_id,
                'name': project_data.get('name', 'Sin nombre'),
                'status': status,
                'teamMembers': project_data.get('teamMembers', [])
            })
        
        return active_projects
    except Exception as e:
        print(f"❌ Error obteniendo proyectos: {e}")
        return []

def add_members_to_project(db, project_id, project_name, current_team_members):
    """Agrega los emails al proyecto si no están ya incluidos."""
    try:
        updated_members = list(current_team_members) if current_team_members else []
        added_count = 0
        
        for email in EMAILS_TO_ADD:
            if email not in updated_members:
                updated_members.append(email)
                added_count += 1
        
        if added_count > 0:
            # Actualizar el proyecto
            project_ref = db.collection('projects').document(project_id)
            project_ref.update({
                'teamMembers': updated_members,
                'updatedAt': firestore.SERVER_TIMESTAMP
            })
            return added_count, updated_members
        
        return 0, current_team_members
    except Exception as e:
        print(f"❌ Error actualizando proyecto {project_id}: {e}")
        return 0, current_team_members

def main():
    print("=" * 60)
    print("Agregar miembros a proyectos activos")
    print("=" * 60)
    print(f"\nEmails a agregar: {', '.join(EMAILS_TO_ADD)}")
    print(f"Fecha: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    # Inicializar Firebase
    db = initialize_firebase()
    
    # Obtener proyectos activos
    print("📋 Obteniendo proyectos activos...")
    active_projects = get_active_projects(db)
    print(f"✓ Se encontraron {len(active_projects)} proyectos activos\n")
    
    if len(active_projects) == 0:
        print("⚠️  No hay proyectos activos para actualizar")
        return
    
    # Procesar cada proyecto
    print("🔄 Procesando proyectos...\n")
    updated_count = 0
    skipped_count = 0
    error_count = 0
    
    for project in active_projects:
        project_id = project['id']
        project_name = project['name']
        current_members = project['teamMembers']
        
        print(f"📁 {project_name} ({project_id})")
        print(f"   Status: {project['status']}")
        print(f"   Miembros actuales: {len(current_members)}")
        
        added, new_members = add_members_to_project(
            db, 
            project_id, 
            project_name, 
            current_members
        )
        
        if added > 0:
            print(f"   ✅ Agregados {added} miembro(s) - Total: {len(new_members)}")
            updated_count += 1
        else:
            print(f"   ⏭️  Todos los miembros ya estaban agregados")
            skipped_count += 1
        
        print()
    
    # Resumen
    print("=" * 60)
    print("RESUMEN")
    print("=" * 60)
    print(f"Total proyectos activos: {len(active_projects)}")
    print(f"Proyectos actualizados: {updated_count}")
    print(f"Proyectos sin cambios: {skipped_count}")
    print(f"Errores: {error_count}")
    print(f"\nEmails agregados: {', '.join(EMAILS_TO_ADD)}")
    print("=" * 60)

if __name__ == "__main__":
    main()

