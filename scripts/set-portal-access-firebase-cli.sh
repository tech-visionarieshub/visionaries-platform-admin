#!/bin/bash

# Script para establecer hasPortalAdminAccess usando Firebase CLI
# Uso: ./scripts/set-portal-access-firebase-cli.sh <email> [hasAccess]

EMAIL=$1
HAS_ACCESS=${2:-true}

if [ -z "$EMAIL" ]; then
  echo "❌ Error: Se requiere el email del usuario"
  echo ""
  echo "Uso:"
  echo "  ./scripts/set-portal-access-firebase-cli.sh <email> [hasAccess]"
  echo ""
  echo "Ejemplo:"
  echo "  ./scripts/set-portal-access-firebase-cli.sh adminplatform@visionarieshub.com true"
  exit 1
fi

if ! command -v firebase &> /dev/null; then
  echo "❌ Error: Firebase CLI no está instalado"
  echo "Instala con: npm install -g firebase-tools"
  exit 1
fi

echo "[Set Portal Admin Access] Configurando acceso para $EMAIL..."

# Cambiar al proyecto visionaries-platform-admin
firebase use visionaries-platform-admin 2>&1 | grep -q "Now using" || {
  echo "⚠️  No se pudo cambiar al proyecto visionaries-platform-admin"
  echo "   Asegúrate de estar autenticado: firebase login"
  exit 1
}

# Buscar si existe un documento con ese email
EXISTING_DOC=$(firebase firestore:get users --project visionaries-platform-admin 2>/dev/null | grep -i "$EMAIL" | head -1)

if [ -z "$EXISTING_DOC" ]; then
  echo "[Set Portal Admin Access] Usuario no encontrado, creando nuevo documento..."
  
  # Crear nuevo documento
  firebase firestore:set users/$(date +%s) \
    --project visionaries-platform-admin \
    --data "{
      email: '$EMAIL',
      name: '${EMAIL%@*}',
      isActive: true,
      hasPortalAdminAccess: $HAS_ACCESS,
      createdAt: '$(date -u +%Y-%m-%dT%H:%M:%S.000Z)',
      updatedAt: '$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'
    }" 2>&1
  
  if [ $? -eq 0 ]; then
    echo "✅ Usuario creado con hasPortalAdminAccess: $HAS_ACCESS"
  else
    echo "❌ Error al crear usuario"
    exit 1
  fi
else
  echo "[Set Portal Admin Access] Usuario encontrado, actualizando..."
  echo "⚠️  Firebase CLI no soporta actualización condicional por email"
  echo "   Usa la API /api/users/set-portal-access o Firebase Console"
  echo ""
  echo "O manualmente desde Firebase Console:"
  echo "1. Ve a: https://console.firebase.google.com/project/visionaries-platform-admin/firestore"
  echo "2. Navega a colección 'users'"
  echo "3. Busca documento con email: $EMAIL"
  echo "4. Agrega/actualiza campo: hasPortalAdminAccess = $HAS_ACCESS"
  exit 1
fi

echo ""
echo "✅ Proceso completado exitosamente."
echo ""
echo "⚠️  IMPORTANTE: El usuario debe cerrar sesión y volver a entrar en Aura para que los cambios surtan efecto."


