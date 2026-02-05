# Onboarding (producción) — reglas finales

## Condición de aparición
Se muestra **solo** cuando:
- `onboarding_completed = false`
- `subjects_count = 0`

Si `onboarding_step` es `DONE` o `SKIPPED`, no se vuelve a mostrar automáticamente.

## Endurecimiento backend
Validado en `CurrentUserView.patch`:
- Transiciones permitidas: `CREATE_SUBJECT -> CREATE_HABIT -> CONFIG_POMODORO -> START_SESSION -> DONE`.
- Se rechaza salto directo a `DONE`.
- `SKIPPED` es terminal.
- `onboarding_completed` no puede volver a `false`.
- `onboarding_completed=true` exige al menos 1 pomodoro válido (`subject` no nulo y `duration > 0`).

## Telemetría mínima
Emitida desde `frontend/src/ts/onboarding.ts` vía eventos DOM:
- `onboarding_started` `{ step, ts }`
- `onboarding_step_completed` `{ step, ts }`
- `onboarding_completed` `{ step: 'DONE', ts }`
- `onboarding_skipped` `{ step: 'SKIPPED', ts }`

Se envían por `CustomEvent` en:
- `analytics:event`
- `onboarding:event`

Y se deduplican por usuario/evento en `localStorage`.


## Reanudación por evento de dominio
- El paso `CREATE_SUBJECT` avanza por `onSubjectCreated()` (no por navegación/click).
- `onSubjectCreated()` persiste `CREATE_HABIT` y muestra inmediatamente el overlay siguiente.
