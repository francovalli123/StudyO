# StudyO Security Policy

## Principios
- **Zero Trust**: cada request valida token, usuario y permisos antes de acceder a datos o acciones protegidas.
- **Seguridad sin fricción cognitiva**: la sesión se mantiene viva mientras exista actividad legítima para no interrumpir el foco.
- **Menor privilegio**: todas las rutas son protegidas por defecto; solo login, registro y recuperación de contraseña son públicas.

## Autenticación y sesión
- Token propio con **expiración por actividad** (TTL base y extensión dentro de ventana segura).
- Revocación inmediata de tokens en logout y al reiniciar contraseña.
- Invalidación de tokens previos al iniciar sesión.

## Recuperación de contraseña
- Solicitud siempre responde 200 para evitar enumeración de cuentas.
- Tokens de alta entropía, almacenados con hash y expiración corta.
- En confirmación se invalidan tokens de sesión activos.

## Integridad y privacidad
- ORM y validaciones server-side en todas las operaciones.
- Contraseñas gestionadas con `set_password` y `check_password`.
- Sin logs de credenciales ni tokens.

## Operación segura
- CORS y CSRF configurados para entornos locales.
- Parámetros sensibles y TTLs configurables por variables de entorno.
