#!/usr/bin/env python3
"""
Script para vincular egresos de SGAC Platform con el cliente invomex.

Uso:
    python3 scripts/vincular-sgac-invomex.py
"""

import os
import sys
import firebase_admin
from firebase_admin import credentials, firestore

# Intentar primero con visionaries-platform-admin, luego con visionaries-tech
SERVICE_ACCOUNT_PATHS = [
    "/Users/gabrielapino/Downloads/visionaries-platform-admin-firebase-adminsdk-fbsvc-eb269c3166.json",
    "/Users/gabrielapino/Library/Mobile Documents/com~apple~CloudDocs/9 nov 2025/visionaries-tech-firebase-adminsdk-fbsvc-5e928cfca6.json",
]

def initialize_firebase():
    """Inicializa Firebase Admin SDK."""
    if not firebase_admin._apps:
        service_account_path = None
        for path in SERVICE_ACCOUNT_PATHS:
            if os.path.exists(path):
                service_account_path = path
                break
        
        if not service_account_path:
            raise FileNotFoundError(
                f"❌ No se encontró ningún service account en:\n   " + "\n   ".join(SERVICE_ACCOUNT_PATHS)
            )
        
        print(f"   Usando service account: {service_account_path}")
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)
    return firestore.client()

def normalize_empresa_for_matching(empresa: str) -> str:
    """Normaliza el nombre de empresa para matching (lowercase, sin espacios extra)."""
    if not empresa:
        return ""
    return empresa.lower().strip()

def find_cliente_invomex(db):
    """Busca el cliente invomex de manera flexible."""
    clientes_ref = db.collection('clientes')
    
    # Buscar por nombre exacto (varias variaciones)
    variaciones = ['invomex', 'Invomex', 'INVOMEX', 'Invomex Integración de Valor Orientado a México']
    for variacion in variaciones:
        query = clientes_ref.where('empresa', '==', variacion).limit(1)
        docs = list(query.stream())
        if docs:
            return docs[0]
    
    # Buscar case-insensitive en todos los clientes
    all_clientes = list(clientes_ref.stream())
    
    # Buscar por RFC (IV0100127GI5 según la imagen)
    for doc in all_clientes:
        data = doc.to_dict()
        rfc = data.get('rfc', '')
        if rfc and 'IV0100127GI5' in rfc.upper():
            empresa = data.get('empresa', '')
            print(f"   ✅ Encontrado por RFC: {empresa} (RFC: {rfc})")
            return doc
    
    # Buscar por nombre "invomex" o variaciones
    for doc in all_clientes:
        data = doc.to_dict()
        empresa = data.get('empresa', '')
        razon_social = data.get('razonSocial', '')
        empresa_normalizada = normalize_empresa_for_matching(empresa)
        razon_normalizada = normalize_empresa_for_matching(razon_social)
        
        # Buscar "invomex" en el nombre
        if 'invomex' in empresa_normalizada or 'invomex' in razon_normalizada:
            print(f"   ✅ Encontrado: {empresa} (Razón Social: {razon_social})")
            return doc
        
        # Buscar por "integración de valor orientado a méxico"
        if all(palabra in empresa_normalizada or palabra in razon_normalizada 
               for palabra in ['integración', 'valor', 'méxico']):
            print(f"   ✅ Encontrado por nombre completo: {empresa} (Razón Social: {razon_social})")
            return doc
    
    # Si no se encuentra, intentar crearlo automáticamente
    print("   ⚠️  No se encontró el cliente Invomex en la base de datos")
    print("   Creando cliente Invomex automáticamente...")
    
    # Crear cliente Invomex
    cliente_data = {
        'empresa': 'Invomex',
        'razonSocial': 'Integración de Valor Orientado a México',
        'rfc': 'IV0100127GI5',
        'personaCobranza': '',
        'correoCobranza': '',
    }
    doc_ref = clientes_ref.document()
    doc_ref.set(cliente_data)
    print(f"   ✅ Cliente Invomex creado con ID: {doc_ref.id}")
    # Obtener el documento creado
    return doc_ref.get()

def main():
    """Función principal."""
    print("=" * 80)
    print("🔗 VINCULAR EGRESOS SGAC PLATFORM CON INVOMEX")
    print("=" * 80)
    print()
    
    db = initialize_firebase()
    
    # Buscar cliente invomex
    print("1️⃣  Buscando cliente invomex...")
    invomex_doc = find_cliente_invomex(db)
    if not invomex_doc:
        print("   ❌ No se encontró el cliente invomex")
        print("   Por favor, crea el cliente invomex primero")
        return
    
    invomex_id = invomex_doc.id
    invomex_empresa = invomex_doc.to_dict().get('empresa', 'invomex')
    print(f"   ✅ Cliente encontrado: {invomex_empresa} (ID: {invomex_id})")
    print()
    
    # Buscar egresos de SGAC Platform
    print("2️⃣  Buscando egresos de SGAC Platform...")
    egresos_ref = db.collection('egresos')
    
    # Buscar todos los egresos
    all_egresos = list(egresos_ref.stream())
    print(f"   Total de egresos en la base de datos: {len(all_egresos)}")
    
    sgac_egresos = []
    sgac_encontrados = []
    
    for doc in all_egresos:
        data = doc.to_dict()
        empresa = data.get('empresa', '')
        empresa_normalizada = data.get('empresaNormalizada', '')
        categoria = data.get('categoria', '')
        tipo_egreso = data.get('tipoEgreso', '')
        cliente_id_actual = data.get('clienteId')
        
        # Verificar si es SGAC Platform
        empresa_match = normalize_empresa_for_matching(empresa)
        empresa_norm_match = normalize_empresa_for_matching(empresa_normalizada) if empresa_normalizada else ""
        
        if 'sgac' in empresa_match or 'sgac' in empresa_norm_match:
            sgac_encontrados.append({
                'id': doc.id,
                'empresa': empresa,
                'empresaNormalizada': empresa_normalizada,
                'categoria': categoria,
                'tipoEgreso': tipo_egreso,
                'clienteId': cliente_id_actual,
                'concepto': data.get('concepto', '')[:50],
                'mes': data.get('mes', ''),
            })
            
            # Verificar que no tenga clienteId o que tenga uno diferente
            if cliente_id_actual != invomex_id:
                sgac_egresos.append({
                    'id': doc.id,
                    'empresa': empresa,
                    'empresaNormalizada': empresa_normalizada,
                    'categoria': categoria,
                    'tipoEgreso': tipo_egreso,
                    'clienteId': cliente_id_actual,
                    'concepto': data.get('concepto', ''),
                    'mes': data.get('mes', ''),
                })
    
    print(f"   Total de egresos de SGAC Platform encontrados: {len(sgac_encontrados)}")
    if len(sgac_encontrados) > 0:
        print("   Detalle de egresos SGAC Platform encontrados:")
        for i, egreso in enumerate(sgac_encontrados[:10], 1):
            cliente_info = f"Cliente: {egreso['clienteId']}" if egreso['clienteId'] else "Sin cliente"
            print(f"      {i}. {egreso['empresa']} | {egreso['categoria']} | {egreso['tipoEgreso']} | {cliente_info} | {egreso['concepto']}")
        if len(sgac_encontrados) > 10:
            print(f"      ... y {len(sgac_encontrados) - 10} más")
    
    print(f"   ✅ Encontrados {len(sgac_egresos)} egresos de SGAC Platform sin vincular a invomex")
    print()
    
    if len(sgac_egresos) == 0:
        print("   ℹ️  No hay egresos para vincular")
        return
    
    # Mostrar resumen
    print("3️⃣  Resumen de egresos a vincular:")
    for i, egreso in enumerate(sgac_egresos[:10], 1):
        print(f"   {i}. {egreso['empresa']} - {egreso['concepto'][:50]}... ({egreso['mes']})")
    if len(sgac_egresos) > 10:
        print(f"   ... y {len(sgac_egresos) - 10} más")
    print()
    
    # Vincular automáticamente (sin confirmación)
    print(f"   🔗 Vinculando automáticamente {len(sgac_egresos)} egresos con invomex...")
    
    # Vincular egresos
    print()
    print("4️⃣  Vinculando egresos...")
    actualizados = 0
    errores = []
    
    for egreso in sgac_egresos:
        try:
            egreso_ref = egresos_ref.document(egreso['id'])
            egreso_ref.update({
                'clienteId': invomex_id,
                'empresaNormalizada': 'SGAC Platform',  # Asegurar normalización
            })
            actualizados += 1
        except Exception as e:
            errores.append(f"Error actualizando {egreso['id']}: {str(e)}")
    
    print()
    print("=" * 80)
    print("📊 RESUMEN")
    print("=" * 80)
    print(f"✅ Egresos actualizados: {actualizados}")
    if errores:
        print(f"❌ Errores: {len(errores)}")
        for error in errores[:5]:
            print(f"   • {error}")
        if len(errores) > 5:
            print(f"   ... y {len(errores) - 5} errores más")
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

