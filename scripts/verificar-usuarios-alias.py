#!/usr/bin/env python3
"""
Script para verificar que todas las empresas tengan los 4 usuarios alias:
-ai, -pz, -ra, -gp
"""

import os
import sys
import firebase_admin
from firebase_admin import credentials, firestore, auth

SERVICE_ACCOUNT_PATH = "/Users/gabrielapino/Library/Mobile Documents/com~apple~CloudDocs/9 nov 2025/visionaries-tech-firebase-adminsdk-fbsvc-5e928cfca6.json"

# Lista de empresas a verificar
EMPRESAS = [
    "finsa", "privarsa", "donleo", "gefe", "cheicargo", "tauro", "edc",
    "evco", "lasalle", "powerstein", "unoretail", "alurtek", "3a", "sgac",
    "lozen", "racing"
]

SUFIJOS_ALIAS = ["-ai", "-pz", "-ra", "-gp"]

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

def extract_alias_type(email: str):
    """Extrae el tipo de alias del email."""
    for suffix in SUFIJOS_ALIAS:
        if f"{suffix}@" in email:
            return suffix
    return None

def verify_platform_aliases(db, platform_code: str):
    """Verifica que una plataforma tenga los 4 usuarios alias."""
    print(f"\n{'='*80}")
    print(f"🏢 VERIFICANDO: {platform_code.upper()}")
    print(f"{'='*80}")
    
    # 1. Buscar la plataforma
    platform = find_platform_by_code(db, platform_code)
    if not platform:
        print(f"❌ Plataforma '{platform_code}' NO EXISTE")
        return {
            "platform_code": platform_code,
            "exists": False,
            "aliases_found": {},
            "aliases_missing": SUFIJOS_ALIAS.copy(),
            "total_users": 0
        }
    
    platform_id = platform["platform_id"]
    platform_name = platform["data"].get("name", platform_code)
    print(f"✅ Plataforma encontrada: {platform_name} ({platform_id})")
    
    # 2. Obtener todos los usuarios
    all_users = get_all_users_in_platform(db, platform_id)
    print(f"📋 Total de usuarios en la plataforma: {len(all_users)}")
    
    # 3. Identificar usuarios alias
    aliases_found = {}
    aliases_missing = []
    
    for user in all_users:
        email = user["data"].get("email", "")
        alias_type = extract_alias_type(email)
        if alias_type:
            if alias_type not in aliases_found:
                aliases_found[alias_type] = []
            aliases_found[alias_type].append({
                "email": email,
                "user_id": user["user_id"],
                "automations": len(user["data"].get("allowedAutomationsIds", []))
            })
    
    # 4. Verificar qué sufijos faltan
    for suffix in SUFIJOS_ALIAS:
        if suffix not in aliases_found:
            aliases_missing.append(suffix)
    
    # 5. Mostrar resultados
    print(f"\n📊 USUARIOS ALIAS ENCONTRADOS:")
    for suffix in SUFIJOS_ALIAS:
        if suffix in aliases_found:
            users = aliases_found[suffix]
            print(f"   ✅ {suffix}: {len(users)} usuario(s)")
            for u in users:
                auto_count = u["automations"]
                auto_status = f"({auto_count} automatizaciones)" if auto_count > 0 else "(sin automatizaciones)"
                print(f"      - {u['email']} {auto_status}")
        else:
            print(f"   ❌ {suffix}: FALTANTE")
    
    if aliases_missing:
        print(f"\n⚠️  FALTAN {len(aliases_missing)} USUARIO(S) ALIAS:")
        for suffix in aliases_missing:
            expected_email = f"{platform_code}{suffix}@visionarieshub.com"
            print(f"   - {expected_email}")
    
    return {
        "platform_code": platform_code,
        "platform_name": platform_name,
        "exists": True,
        "aliases_found": aliases_found,
        "aliases_missing": aliases_missing,
        "total_users": len(all_users)
    }

def main():
    """Función principal."""
    print("=" * 80)
    print("🔍 VERIFICACIÓN DE USUARIOS ALIAS POR EMPRESA")
    print("=" * 80)
    print("\nVerificando que todas las empresas tengan los 4 usuarios alias:")
    print("   -ai, -pz, -ra, -gp\n")
    
    db = initialize_firebase()
    
    results = []
    for empresa in EMPRESAS:
        result = verify_platform_aliases(db, empresa)
        results.append(result)
    
    # Resumen final
    print("\n" + "=" * 80)
    print("📊 RESUMEN FINAL")
    print("=" * 80)
    
    # Agrupar por estado
    completas = []
    incompletas = []
    no_existen = []
    
    for result in results:
        if not result["exists"]:
            no_existen.append(result)
        elif len(result["aliases_missing"]) == 0:
            completas.append(result)
        else:
            incompletas.append(result)
    
    print(f"\n✅ EMPRESAS COMPLETAS ({len(completas)}):")
    for r in completas:
        print(f"   - {r['platform_code']}: {len(r['aliases_found'])}/4 alias")
    
    print(f"\n⚠️  EMPRESAS INCOMPLETAS ({len(incompletas)}):")
    for r in incompletas:
        missing = ", ".join(r["aliases_missing"])
        print(f"   - {r['platform_code']}: Faltan {missing} ({len(r['aliases_found'])}/4 alias)")
    
    print(f"\n❌ EMPRESAS SIN PLATAFORMA ({len(no_existen)}):")
    for r in no_existen:
        print(f"   - {r['platform_code']}: Plataforma no existe en Firestore")
    
    # Detalle de faltantes
    if incompletas or no_existen:
        print(f"\n{'='*80}")
        print("📋 DETALLE DE USUARIOS FALTANTES")
        print("=" * 80)
        
        for r in incompletas:
            print(f"\n{r['platform_code'].upper()}:")
            for suffix in r["aliases_missing"]:
                expected_email = f"{r['platform_code']}{suffix}@visionarieshub.com"
                print(f"   - {expected_email}")
        
        for r in no_existen:
            print(f"\n{r['platform_code'].upper()} (plataforma no existe):")
            for suffix in SUFIJOS_ALIAS:
                expected_email = f"{r['platform_code']}{suffix}@visionarieshub.com"
                print(f"   - {expected_email}")
    
    print("\n" + "=" * 80)

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

