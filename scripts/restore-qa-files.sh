#!/bin/bash
# Script para restaurar archivos QA si se borran
cd "$(dirname "$0")/.."
if [ ! -s components/projects/qa-task-editor.tsx ]; then
  echo "Restaurando qa-task-editor.tsx..."
  git checkout HEAD -- components/projects/qa-task-editor.tsx
fi
if [ ! -s components/projects/qa-image-uploader.tsx ]; then
  echo "Restaurando qa-image-uploader.tsx..."
  git checkout HEAD -- components/projects/qa-image-uploader.tsx
fi
if [ ! -s components/projects/qa-system.tsx ]; then
  echo "Restaurando qa-system.tsx..."
  git checkout HEAD -- components/projects/qa-system.tsx
fi
echo "Archivos QA verificados."
