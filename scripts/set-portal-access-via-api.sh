#!/bin/bash

# Script para establecer hasPortalAdminAccess usando la API
# Requiere estar autenticado en el admin-platform

EMAIL=$1
HAS_ACCESS=${2:-true}

if [ -z "$EMAIL" ]; then
  echo "❌ Error: Se requiere el email del usuario"
  echo ""
  echo "Uso:"
  echo "  ./scripts/set-portal-access-via-api.sh <email> [hasAccess]"
  exit 1
fi

echo "[Set Portal Admin Access] Configurando acceso para $EMAIL..."
echo ""
echo "⚠️  Este script requiere estar autenticado en admin.visionarieshub.com"
echo "   Necesitas un token de autenticación válido"
echo ""
echo "Opciones:"
echo "1. Usar desde Settings → Gestión de Usuarios → Agregar Usuario (recomendado)"
echo "2. Obtener token manualmente y ejecutar:"
echo "   curl -X POST https://admin.visionarieshub.com/api/users/set-portal-access \\"
echo "     -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"$EMAIL\",\"hasAccess\":$HAS_ACCESS}'"
echo ""
echo "3. O usar Firebase Console manualmente:"
echo "   https://console.firebase.google.com/project/visionaries-platform-admin/firestore"
echo "   Colección: users"
echo "   Buscar/crear documento con email: $EMAIL"
echo "   Campo: hasPortalAdminAccess = $HAS_ACCESS"
