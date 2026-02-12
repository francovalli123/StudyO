# StudyO

## Frontend build y artefactos

- El código fuente TypeScript vive en `frontend/src/ts/`.
- Los archivos en `frontend/dist/` (incluyendo `frontend/dist/ts/responsive.js`) son **artefactos generados**.
- No se deben editar manualmente los archivos dentro de `dist/`.

### Flujo recomendado

1. Edita archivos fuente en `frontend/src/`.
2. Genera artefactos con:
   ```bash
   npm run build:frontend
   ```
3. Verifica que `dist/` refleje solamente cambios provenientes de `src/`.

### Verificación automática

- CI ejecuta `scripts/check-dist-sync.sh` para bloquear cambios manuales en `frontend/dist/` sin cambios en `frontend/src/`.
- Hook local de pre-commit incluido en `.githooks/pre-commit`.

Para activar hooks locales:

```bash
git config core.hooksPath .githooks
```
