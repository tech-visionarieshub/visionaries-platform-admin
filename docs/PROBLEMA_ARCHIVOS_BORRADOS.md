# Problema: Archivos QA se Borran Automáticamente

## Descripción del Problema

Los archivos de componentes QA (`qa-task-editor.tsx`, `qa-image-uploader.tsx`, `qa-system.tsx`) se están borrando o vaciando automáticamente sin intervención manual.

## Archivos Afectados

- `components/projects/qa-task-editor.tsx` (374 líneas)
- `components/projects/qa-image-uploader.tsx` (187 líneas)
- `components/projects/qa-system.tsx` (12771 bytes)

## Síntomas

- Los archivos aparecen con 0 bytes
- Error en runtime: "Element type is invalid: expected a string... but got: undefined"
- El componente no se puede importar porque el export no existe

## Posibles Causas

1. **Cursor/Editor**: Algún proceso del editor podría estar limpiando archivos
2. **Next.js Hot Reload**: Problema con el sistema de hot reload de Next.js 15
3. **Sistema de Archivos macOS**: Problema con el sistema de archivos
4. **Proceso Externo**: Algún script o proceso que no hemos identificado

## Soluciones Implementadas

### 1. Script de Restauración Manual

**Archivo**: `scripts/restore-qa-files.sh`

```bash
./scripts/restore-qa-files.sh
```

Este script verifica y restaura los archivos desde git si están vacíos.

### 2. Script de Monitoreo Automático

**Archivo**: `scripts/watch-qa-files.sh`

```bash
./scripts/watch-qa-files.sh
```

Este script monitorea los archivos cada 5 segundos y los restaura automáticamente si se borran.

### 3. Protección con Git

Los archivos están protegidos en git. Si se borran, se pueden restaurar con:

```bash
git checkout HEAD -- components/projects/qa-task-editor.tsx
git checkout HEAD -- components/projects/qa-image-uploader.tsx
git checkout HEAD -- components/projects/qa-system.tsx
```

## Recomendaciones

1. **Hacer commits frecuentes**: Protege los archivos en git regularmente
2. **Usar el script de monitoreo**: Ejecuta `watch-qa-files.sh` en una terminal separada mientras desarrollas
3. **Verificar antes de trabajar**: Ejecuta `restore-qa-files.sh` antes de empezar a trabajar en QA
4. **Reportar si persiste**: Si el problema continúa, podría ser necesario investigar procesos del sistema o del editor

## Comandos Útiles

```bash
# Verificar estado de archivos
wc -l components/projects/qa-*.tsx

# Restaurar todos los archivos QA
./scripts/restore-qa-files.sh

# Monitorear archivos (ejecutar en terminal separada)
./scripts/watch-qa-files.sh

# Verificar si hay procesos usando los archivos
lsof +D components/projects | grep qa
```

## Estado Actual

- ✅ Scripts de restauración creados
- ✅ Archivos restaurados y protegidos en git
- ⚠️ Causa raíz aún no identificada
- 🔍 Monitoreo continuo recomendado









