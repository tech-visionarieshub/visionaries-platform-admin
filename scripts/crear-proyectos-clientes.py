#!/usr/bin/env python3
"""
Script para crear proyectos para los clientes listados.
Asigna AURA al cliente "visionaries hub".

Uso:
    python3 scripts/crear-proyectos-clientes.py
"""

import os
import sys
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore

# Intentar primero con visionaries-platform-admin, luego con visionaries-tech como fallback
SERVICE_ACCOUNT_PATHS = [
    "/Users/gabrielapino/Downloads/visionaries-platform-admin-firebase-adminsdk-fbsvc-eb269c3166.json",
    "/Users/gabrielapino/Library/Mobile Documents/com~apple~CloudDocs/9 nov 2025/visionaries-tech-firebase-adminsdk-fbsvc-5e928cfca6.json",
]

# Mapeo de meses en español a números
MESES_ESP = {
    'ene': 1, 'enero': 1,
    'feb': 2, 'febrero': 2,
    'mar': 3, 'marzo': 3,
    'abr': 4, 'abril': 4,
    'may': 5, 'mayo': 5,
    'jun': 6, 'junio': 6,
    'jul': 7, 'julio': 7,
    'ago': 8, 'agosto': 8,
    'sep': 9, 'septiembre': 9, 'sept': 9,
    'oct': 10, 'octubre': 10,
    'nov': 11, 'noviembre': 11,
    'dic': 12, 'diciembre': 12,
}

# Datos de proyectos a crear
# Formato: (cliente, meses_duracion, fecha_inicio, fecha_fin, cliente_asignado)
# Si cliente_asignado es None, se usa el mismo cliente
PROYECTOS_DATA = [
    # AURA -> visionaries hub
    ("AURA", 1, "15-feb-2024", "15-may-2024", "visionaries hub"),
    # Powerstein
    ("Powerstein", 1, "15-feb-2024", "15-may-2024", None),
    ("Powerstein", 1, "15-mar-2024", "15-may-2024", None),
    # Don Leo
    ("DON LEO", 2, "30-may-2024", "30-jul-2024", None),
    # EDC
    ("EDC", None, "21-jun-2024", "21-sep-2024", None),
    ("EDC", None, "21-jun-2024", "21-sep-2024", None),
    # FINSA
    ("FINSA", 3, "23-sep-2024", "23-dic-2024", None),
    ("FINSA", 2, "23-dic-2024", "23-feb-2025", None),
    # TAURO
    ("TAURO", 2, "16-ene-2025", "16-mar-2025", None),
    # ALUR TEK
    ("ALUR TEK", 2, "4-feb-2025", "4-abr-2025", None),
    ("ALUR TEK", 1, "4-mar-2025", "4-abr-2025", None),
    ("ALUR TEK", 1, "4-mar-2025", "4-abr-2025", None),
    # EVCO (no está en la lista inicial, pero lo incluyo)
    ("EVCO", 3, "12-mar-2025", "12-jun-2025", None),
    ("EVCO", 2, "12-mar-2025", "12-may-2025", None),
    ("EVCO", 2, "12-may-2025", "12-jul-2025", None),
    ("EVCO", 2, "12-may-2025", "12-jul-2025", None),
    # PRIVARSA
    ("PRIVARSA", 2.5, "28-feb-2025", "13-may-2025", None),
    # LA SALLE (no está en la lista inicial, pero lo incluyo)
    ("LA SALLE", 3, "17-mar-2025", "17-jun-2025", None),
    # 3A
    ("3A", 2, "19-sep-2025", "19-nov-2025", None),
]

# Clientes que necesitan proyectos (sin AURA, que se maneja aparte)
CLIENTES_LISTA = [
    "UNORETAIL",
    "DON LEO",
    "EDC",
    "FINSA",
    "TAURO",
    "ALUR TEK",
    "PRIVARSA",
    "GRUPO EFE",
    "3A",
    "LOZEN",
    "CHEICARGO",
    "RACING CARGO",
]

def initialize_firebase():
    """Inicializa Firebase Admin SDK con service account de visionaries-platform-admin."""
    if not firebase_admin._apps:
        service_account_path = None
        for path in SERVICE_ACCOUNT_PATHS:
            if os.path.exists(path):
                service_account_path = path
                break
        
        if not service_account_path:
            raise FileNotFoundError(
                f"❌ No se encontró ningún service account en:\n   " + "\n   ".join(SERVICE_ACCOUNT_PATHS) +
                "\n\n   Este script necesita el service account de visionaries-platform-admin para crear proyectos y clientes."
            )
        
        print(f"   Usando service account: {service_account_path}")
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred, {
            'projectId': 'visionaries-platform-admin',
        })
    return firestore.client()

def parse_fecha(fecha_str: str) -> datetime:
    """Parsea una fecha del formato '15-feb-2024' a datetime."""
    try:
        partes = fecha_str.lower().split('-')
        if len(partes) != 3:
            raise ValueError(f"Formato de fecha inválido: {fecha_str}")
        
        dia = int(partes[0])
        mes_str = partes[1]
        año = int(partes[2])
        
        mes = MESES_ESP.get(mes_str)
        if not mes:
            raise ValueError(f"Mes no reconocido: {mes_str}")
        
        return datetime(año, mes, dia)
    except Exception as e:
        raise ValueError(f"Error parseando fecha '{fecha_str}': {e}")

def find_cliente_by_empresa(db, empresa: str):
    """Busca un cliente por nombre de empresa (case-insensitive)."""
    clientes_ref = db.collection('clientes')
    
    # Buscar exacto
    query = clientes_ref.where('empresa', '==', empresa).limit(1)
    docs = list(query.stream())
    if docs:
        return docs[0]
    
    # Buscar case-insensitive
    all_clientes = clientes_ref.stream()
    for doc in all_clientes:
        data = doc.to_dict()
        if data.get('empresa', '').upper() == empresa.upper():
            return doc
    
    return None

def find_or_create_cliente(db, empresa: str):
    """Busca un cliente o lo crea si no existe."""
    cliente_doc = find_cliente_by_empresa(db, empresa)
    
    if cliente_doc:
        return cliente_doc.id, cliente_doc.to_dict().get('empresa', empresa)
    
    # Crear cliente básico
    print(f"   ⚠️  Cliente '{empresa}' no encontrado. Creando cliente básico...")
    cliente_data = {
        'empresa': empresa,
        'razonSocial': empresa,
        'rfc': '',  # Se debe completar después
        'personaCobranza': '',
        'correoCobranza': '',
        'createdAt': firestore.SERVER_TIMESTAMP,
        'updatedAt': firestore.SERVER_TIMESTAMP,
    }
    
    doc_ref = db.collection('clientes').document()
    doc_ref.set(cliente_data)
    print(f"   ✅ Cliente '{empresa}' creado con ID: {doc_ref.id}")
    
    return doc_ref.id, empresa

def create_project(db, cliente_empresa: str, client_id: str, meses_duracion, fecha_inicio: datetime, fecha_fin: datetime, created_by: str = "gabypino@visionarieshub.com"):
    """Crea un proyecto en Firestore."""
    # Generar nombre del proyecto
    nombre_proyecto = f"{cliente_empresa} - {fecha_inicio.strftime('%b %Y')}"
    
    # Calcular horas estimadas basadas en meses (asumiendo 160 horas/mes)
    horas_estimadas = int((meses_duracion or 2) * 160)
    
    project_data = {
        'name': nombre_proyecto,
        'client': cliente_empresa,
        'clientId': client_id,
        'status': 'En ejecución',
        'progress': 0,
        'startDate': fecha_inicio.strftime('%Y-%m-%d'),
        'endDate': fecha_fin.strftime('%Y-%m-%d'),
        'responsible': created_by,
        'features': 0,
        'completedFeatures': 0,
        'budget': 0,
        'hoursEstimated': horas_estimadas,
        'hoursWorked': 0,
        'createdBy': created_by,
        'createdAt': firestore.SERVER_TIMESTAMP,
        'updatedAt': firestore.SERVER_TIMESTAMP,
    }
    
    doc_ref = db.collection('projects').document()
    doc_ref.set(project_data)
    
    return doc_ref.id, project_data

def main():
    """Función principal."""
    print("=" * 80)
    print("🚀 CREAR PROYECTOS PARA CLIENTES")
    print("=" * 80)
    print()
    
    db = initialize_firebase()
    
    # Buscar cliente "visionaries hub" para AURA
    print("1️⃣  Buscando cliente 'visionaries hub' para AURA...")
    visionaries_hub_doc = find_cliente_by_empresa(db, "visionaries hub")
    if not visionaries_hub_doc:
        # Intentar variaciones
        visionaries_hub_doc = find_cliente_by_empresa(db, "Visionaries Hub")
        if not visionaries_hub_doc:
            visionaries_hub_doc = find_cliente_by_empresa(db, "VISIONARIES HUB")
    
    if visionaries_hub_doc:
        visionaries_hub_id = visionaries_hub_doc.id
        visionaries_hub_empresa = visionaries_hub_doc.to_dict().get('empresa', 'visionaries hub')
        print(f"   ✅ Cliente encontrado: {visionaries_hub_empresa} (ID: {visionaries_hub_id})")
    else:
        print("   ⚠️  Cliente 'visionaries hub' no encontrado. Creando...")
        visionaries_hub_id, visionaries_hub_empresa = find_or_create_cliente(db, "visionaries hub")
    
    print()
    print("2️⃣  Creando proyectos...")
    print()
    
    proyectos_creados = []
    proyectos_errores = []
    
    # Crear proyectos para todos los clientes
    for cliente_empresa, meses_duracion, fecha_inicio_str, fecha_fin_str, cliente_asignado in PROYECTOS_DATA:
        # Determinar cliente asignado
        if cliente_asignado:
            cliente_final = cliente_asignado
            if cliente_final.lower() == "visionaries hub":
                client_id = visionaries_hub_id
                empresa_nombre = visionaries_hub_empresa
            else:
                client_id, empresa_nombre = find_or_create_cliente(db, cliente_final)
            print(f"   📦 {cliente_empresa} -> {cliente_final}")
        else:
            cliente_final = cliente_empresa
            client_id, empresa_nombre = find_or_create_cliente(db, cliente_empresa)
            print(f"   📦 {cliente_empresa}")
        
        try:
            # Parsear fechas
            fecha_inicio = parse_fecha(fecha_inicio_str)
            fecha_fin = parse_fecha(fecha_fin_str)
            
            # Crear proyecto (usar nombre del proyecto, no del cliente asignado)
            project_id, project_data = create_project(
                db,
                cliente_empresa,  # Nombre del proyecto
                client_id,  # ID del cliente asignado
                meses_duracion,
                fecha_inicio,
                fecha_fin
            )
            
            proyectos_creados.append((cliente_empresa, project_id, project_data['name']))
            print(f"      ✅ Proyecto creado: {project_data['name']} (ID: {project_id})")
            if cliente_asignado:
                print(f"      📌 Asignado a cliente: {empresa_nombre}")
            
        except Exception as e:
            proyectos_errores.append((cliente_empresa, str(e)))
            print(f"      ❌ Error: {e}")
    
    print()
    print("=" * 80)
    print("📊 RESUMEN")
    print("=" * 80)
    print(f"✅ Proyectos creados: {len(proyectos_creados)}")
    print(f"❌ Errores: {len(proyectos_errores)}")
    print()
    
    if proyectos_creados:
        print("Proyectos creados exitosamente:")
        for cliente, project_id, nombre in proyectos_creados:
            print(f"   • {cliente}: {nombre} ({project_id})")
        print()
    
    if proyectos_errores:
        print("Errores:")
        for cliente, error in proyectos_errores:
            print(f"   • {cliente}: {error}")
        print()
    
    print("=" * 80)
    print("✅ Proceso completado")
    print("=" * 80)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Proceso cancelado por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error fatal: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

