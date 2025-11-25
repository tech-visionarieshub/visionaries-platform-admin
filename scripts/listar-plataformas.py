#!/usr/bin/env python3
"""
Script para listar todas las plataformas disponibles en Firestore.
"""

import os
import sys
import firebase_admin
from firebase_admin import credentials, firestore

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

def main():
    """Función principal."""
    print("=" * 80)
    print("📦 PLATAFORMAS DISPONIBLES EN FIRESTORE")
    print("=" * 80)
    print()
    
    db = initialize_firebase()
    
    platforms_ref = db.collection("platforms")
    platforms = platforms_ref.stream()
    
    plataformas = []
    for platform_doc in platforms:
        data = platform_doc.to_dict()
        plataformas.append({
            "id": platform_doc.id,
            "code": data.get("code", platform_doc.id),
            "name": data.get("name", platform_doc.id),
        })
    
    # Ordenar por código
    plataformas.sort(key=lambda x: x["code"])
    
    print(f"Total de plataformas: {len(plataformas)}\n")
    
    for i, p in enumerate(plataformas, 1):
        print(f"{i:2}. {p['name']:30} (code: {p['code']:20}) ID: {p['id']}")
    
    print()
    print("=" * 80)
    
    # Buscar plataformas que podrían coincidir
    print("\n🔍 BUSCANDO PLATAFORMAS SIMILARES:")
    print("=" * 80)
    
    buscadas = ["cheicargo", "evco", "3a", "sgac", "lozen", "racing"]
    
    for buscada in buscadas:
        print(f"\n📋 Buscando: '{buscada}'")
        coincidencias = []
        for p in plataformas:
            code_lower = p["code"].lower()
            name_lower = p["name"].lower()
            if buscada.lower() in code_lower or buscada.lower() in name_lower:
                coincidencias.append(p)
        
        if coincidencias:
            for c in coincidencias:
                print(f"   ✅ {c['name']} (code: {c['code']})")
        else:
            print(f"   ❌ No se encontró ninguna coincidencia")

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

