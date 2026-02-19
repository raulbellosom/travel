# 16_MIGRATION_PLAN_RESOURCES

## Objetivo

Plan operativo para migrar de `properties` a `resources` sin romper produccion.

---

## 1. Estrategia

Migracion progresiva por fases, con doble lectura/escritura temporal y rollback simple.

---

## 2. Fases

## Fase 1 - Schema y docs

- Crear `resources`, `resource_images`, `rate_plans`, `instance_settings`.
- Mantener `properties/property_images` como legacy.
- Actualizar documentos canonicos (`02`, `03`, `05`, `06`, `07`, `11`, `12`, `13`).

## Fase 2 - Modulos y root UI

- Activar hook `useInstanceModules`.
- Publicar `/app/root/instance` y `/app/root/modules`.
- Integrar activity logs de cambios de modulos/limites.

## Fase 3 - Frontend resource-first

- Wizard/editor con `resourceType/category/commercialMode/pricingModel`.
- Perfil dinamico de campos por `resourceType + category + commercialMode`.
- Matriz de `pricingModel` por `resourceType + commercialMode` (no solo por modo comercial).
- Campos no inmobiliarios serializados en `attributes` para vehicle/service/experience/venue.
- Ajustes semanticos por vertical (ejemplo: `attributes.vehicleModelYear` en lugar de `yearBuilt` para vehiculos).
- `rentPeriod` en largo plazo con soporte `daily`,`weekly`,`monthly`,`yearly`.
- `getResourceBehavior` como fuente unica.
- Mantener rutas SEO legacy (`/propiedades/:slug`).

## Fase 4 - Functions

- Migrar functions criticas a `resourceId` canonico con fallback `propertyId`.
- Enforce de modulos y limites en backend.

## Fase 5 - Chat y dominio cruzado

- conversations con `resourceId/resourceTitle`.
- leads/reservations/payments con `resourceId`.

## Fase 6 - Corte legacy

- eliminar dependencias a `properties/propertyId` solo despues de QA y metricas estables.

---

## 3. Riesgos

1. Divergencia de datos entre `resourceId` y `propertyId` durante dual-write.
2. Rechazos funcionales por modulos deshabilitados si UI no sincroniza correctamente.
3. Regresiones en rutas publicas SEO.
4. Integraciones de pago atadas a contratos legacy.

---

## 4. Mitigaciones

- Priorizar `resourceId` en todas las escrituras nuevas.
- Backend valida modulos y responde errores normalizados.
- Mantener fallback de lectura en servicios/functions.
- Monitorear logs de `MODULE_DISABLED` y `LIMIT_EXCEEDED`.

---

## 5. Rollback

Si release falla:

1. Mantener `properties` como fuente temporal (feature flag/fallback).
2. Revertir funciones a flujo legacy conservando datos nuevos.
3. No borrar colecciones nuevas; solo detener su uso.
4. Analizar activity logs para reconciliacion.

---

## 6. Criterio de exito

- build frontend verde
- functions criticas en sintaxis/ejecucion
- QA manual de escenarios 1-7 en checklist
- errores de modulo/limite controlados

---

Ultima actualizacion: 2026-02-19
Version: 1.2.0
