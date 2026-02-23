# expire-pending-reservations

Expira reservas con hold vencido.

## Contrato de ejecucion

- Tipo: Function programada (cron cada 5 minutos) o HTTP POST.
- Metodo: `POST`.
- Execute recomendado: `[]` (solo scheduler).

## Regla

- Busca reservas `pending` + `unpaid` con `holdExpiresAt <= now`.
- Cambia `status` a `expired`.
- Registra evento en `activity_logs`.
