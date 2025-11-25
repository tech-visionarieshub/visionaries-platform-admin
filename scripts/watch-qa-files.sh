#!/bin/bash
# Script para monitorear y restaurar automáticamente archivos QA si se borran
# Uso: ./scripts/watch-qa-files.sh

cd "$(dirname "$0")/.."

QA_FILES=(
  "components/projects/qa-task-editor.tsx"
  "components/projects/qa-image-uploader.tsx"
  "components/projects/qa-system.tsx"
)

echo "🔍 Monitoreando archivos QA..."
echo "Presiona Ctrl+C para detener"

while true; do
  for file in "${QA_FILES[@]}"; do
    if [ ! -s "$file" ]; then
      echo "⚠️  Archivo vacío detectado: $file"
      echo "🔄 Restaurando desde git..."
      git checkout HEAD -- "$file" 2>/dev/null
      if [ -s "$file" ]; then
        echo "✅ Restaurado: $file"
        # Hacer commit automático para proteger el archivo
        git add "$file"
        git commit -m "fix: restaurar $file (auto-restore)" --no-verify 2>/dev/null || true
      else
        echo "❌ Error restaurando: $file"
      fi
    fi
  done
  sleep 5
done





