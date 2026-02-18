# 15_MODULE_SYSTEM_SPEC

## Objetivo

Definir sistema de modulos/planes por instancia para monetizacion SaaS.

---

## 1. Fuente de verdad

Coleccion: `instance_settings`

Documento principal recomendado:

- `$id = main`
- `key = main`

Campos:

- `planKey`
- `enabledModules[]`
- `limits` (JSON)
- `enabled`

---

## 2. Catalogo minimo de modulos

Core:

- `module.resources`
- `module.leads`
- `module.staff`
- `module.analytics.basic`

Booking/Pagos:

- `module.booking.long_term`
- `module.booking.short_term`
- `module.booking.hourly`
- `module.payments.online`

Extras:

- `module.messaging.realtime`
- `module.reviews`
- `module.calendar.advanced`

---

## 3. Limites sugeridos

Dentro de `limits`:

```json
{
  "maxPublishedResources": 50,
  "maxStaffUsers": 5,
  "maxActiveReservationsPerMonth": 200
}
```

---

## 4. Frontend

Hook: `useInstanceModules()`

API esperada:

- `isEnabled(moduleKey)`
- `getLimit(limitKey)`
- `assertEnabled(moduleKey)`

Comportamientos UI:

- ocultar opciones no habilitadas en wizard.
- deshabilitar acciones si modulo no esta activo.
- mostrar mensajes claros de plan/modulo.

---

## 5. Backend (obligatorio)

Cada function critica usa helper de modulo:

- `assertModuleEnabled(moduleKey)`
- `assertLimitNotExceeded(limitKey, currentValue)`

Errores estandar 403:

- `MODULE_DISABLED`
- `LIMIT_EXCEEDED`

---

## 6. Root UI

Rutas root:

- `/app/root/instance`
- `/app/root/modules`

Capacidades:

- editar `planKey`
- activar/desactivar modulos
- editar limites numericos
- registrar activity logs por cambio

---

## 7. Auditoria

Acciones que deben auditarse:

- cambio de plan
- toggle de modulo
- cambio de limites
- intentos denegados de usuarios no root

---

## 8. Compatibilidad y rollout

- Si `instance_settings` no existe, usar defaults seguros en helper.
- En despliegues nuevos, crear documento `main` durante provisioning.

---

Ultima actualizacion: 2026-02-18
Version: 1.0.0
