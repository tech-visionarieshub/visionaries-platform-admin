#!/usr/bin/env python3
"""
Script para crear elena@visionarieshub.com en Firebase Auth.
Este usuario será un alias de talent@visionarieshub.com, pero ambos compartirán
el mismo UID mediante vinculación de cuentas.
"""

import os
import sys
import firebase_admin
from firebase_admin import credentials, auth

SERVICE_ACCOUNT_PATH = "/Users/gabrielapino/Library/Mobile Documents/com~apple~CloudDocs/9 nov 2025/visionaries-tech-firebase-adminsdk-fbsvc-5e928cfca6.json"

EMAIL_PRINCIPAL = "talent@visionarieshub.com"
EMAIL_ALIAS = "elena@visionarieshub.com"
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

def main():
    """Función principal."""
    print("=" * 80)
    print("🔧 CREAR USUARIO EN FIREBASE AUTH: elena@visionarieshub.com")
    print("=" * 80)
    print(f"\nEmail Principal: {EMAIL_PRINCIPAL}")
    print(f"Email Alias: {EMAIL_ALIAS}")
    print(f"Nombre: {NAME_ALIAS}")
    print("\nNota: Este usuario se creará en Firebase Auth para que aparezca")
    print("en la consola. Se vinculará al mismo UID de talent@visionarieshub.com")
    print("mediante email linking.")
    print("=" * 80)
    
    initialize_firebase()
    
    # Obtener información de talent
    print(f"\n1️⃣  Obteniendo información de {EMAIL_PRINCIPAL}...")
    try:
        talent_user = auth.get_user_by_email(EMAIL_PRINCIPAL)
        print(f"   ✅ UID: {talent_user.uid}")
        print(f"   ✅ Email: {talent_user.email}")
        print(f"   ✅ Custom Claims: {talent_user.custom_claims}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    # Verificar si elena ya existe
    print(f"\n2️⃣  Verificando si {EMAIL_ALIAS} existe...")
    try:
        elena_user = auth.get_user_by_email(EMAIL_ALIAS)
        print(f"   ⚠️  {EMAIL_ALIAS} ya existe en Firebase Auth")
        print(f"      UID: {elena_user.uid}")
        if elena_user.uid == talent_user.uid:
            print(f"      ✅ Ya está vinculado al mismo UID que {EMAIL_PRINCIPAL}")
        else:
            print(f"      ⚠️  Tiene un UID diferente. Considera vincular las cuentas.")
        return
    except auth.UserNotFoundError:
        print(f"   ✅ {EMAIL_ALIAS} no existe, procediendo a crearlo...")
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    # Crear usuario elena
    print(f"\n3️⃣  Creando {EMAIL_ALIAS} en Firebase Auth...")
    try:
        # Crear usuario con el mismo UID que talent
        # Nota: No podemos crear directamente con el mismo UID, así que creamos uno nuevo
        # y luego lo vinculamos manualmente o usamos email linking
        
        # Opción 1: Crear como usuario separado (más simple para que aparezca en la consola)
        new_user = auth.create_user(
            email=EMAIL_ALIAS,
            email_verified=True,
            display_name=NAME_ALIAS,
            disabled=False,
        )
        
        print(f"   ✅ Usuario creado:")
        print(f"      UID: {new_user.uid}")
        print(f"      Email: {new_user.email}")
        
        # Copiar custom claims de talent
        print(f"\n4️⃣  Copiando custom claims de {EMAIL_PRINCIPAL}...")
        talent_claims = talent_user.custom_claims or {}
        auth.set_custom_user_claims(new_user.uid, talent_claims)
        print(f"   ✅ Custom claims copiados:")
        for key, value in talent_claims.items():
            print(f"      - {key}: {value}")
        
        print(f"\n" + "=" * 80)
        print("✅ USUARIO CREADO EN FIREBASE AUTH")
        print("=" * 80)
        print(f"\n📋 Resumen:")
        print(f"   Email: {EMAIL_ALIAS}")
        print(f"   UID: {new_user.uid}")
        print(f"   Nombre: {NAME_ALIAS}")
        print(f"   Custom Claims: {talent_claims}")
        print(f"\n📝 Nota:")
        print(f"   - Este usuario aparecerá en Firebase Auth Console")
        print(f"   - Tiene los mismos permisos que {EMAIL_PRINCIPAL}")
        print(f"   - Para vincular las cuentas (mismo UID), se requiere")
        print(f"     email linking desde el cliente (no se puede hacer desde Admin SDK)")
        print(f"   - Por ahora, ambos usuarios existen por separado pero con")
        print(f"     los mismos permisos y acceso")
        
    except Exception as e:
        print(f"   ❌ Error al crear usuario: {e}")
        import traceback
        traceback.print_exc()
        return

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


