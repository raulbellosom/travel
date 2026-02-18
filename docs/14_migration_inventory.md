# 14_MIGRATION_INVENTORY - RESOURCE REFACTOR

## Contexto

Inventario de referencias legacy solicitado en prompt v3.

Patrones analizados:

- `properties`
- `operationType`
- `propertyType`
- `propertyId`
- `/propiedades/`
- nombres de servicios/hooks relacionados

Fecha de corte: 2026-02-18

---

## Inventario por archivo (resumen accionable)

| Archivo | Patron detectado | Accion | Estado |
| --- | --- | --- | --- |
| `src/services/propertiesService.js` | `properties`, `propertyId`, `operationType`, `propertyType` | adapt (capa legacy + puente a resources) | en uso compat |
| `src/services/resourcesService.js` | `resources` | mantener canonico | vigente |
| `src/services/leadsService.js` | `propertyId` | adapt -> priorizar `resourceId` | en migracion |
| `src/services/reservationsService.js` | `propertyId` | adapt -> `resourceId` canonico + fallback | en migracion |
| `src/services/chatService.js` | `propertyId` | adapt -> `resourceId/resourceTitle` | en migracion |
| `src/features/listings/components/wizard/useWizardForm.jsx` | `operationType`, `propertyType` | adapt -> `commercialMode/category` + aliases | migrado |
| `src/features/listings/components/wizard/steps/StepTypeAndInfo.jsx` | `operationType`, `propertyType` | adapt -> selector `resourceType` + gating modulos | migrado |
| `src/features/listings/components/wizard/steps/StepPricing.jsx` | `pricePerUnit` | replace -> `pricingModel` | migrado |
| `src/features/listings/components/wizard/steps/StepSummary.jsx` | `operationType/propertyType` | adapt -> resumen canonico + alias | migrado |
| `src/features/listings/components/editor/PropertyEditor.jsx` | tabs por operacion legacy | adapt -> pasos dinamicos por behavior/modulos | migrado |
| `src/utils/resourceModel.js` | mapping legacy/canonico | mantener como core helper | vigente |
| `src/components/common/molecules/PropertyCard.jsx` | labels por operation/property type | adapt -> `getResourceBehavior` | parcial |
| `src/pages/PropertyDetail.jsx` | `/propiedades/:slug`, `propertyId` | adapt -> cargar resource por slug | en migracion |
| `src/pages/ReserveProperty.jsx` | `propertyId` | adapt -> flujo canonico `resourceId` | en migracion |
| `src/routes/AppRoutes.jsx` | rutas `/propiedades/*` y rutas root nuevas | mantener ruta publica + agregar root modules | migrado |
| `src/components/navigation/Sidebar.jsx` | menu root | adapt -> `rootInstance/rootModules` | migrado |
| `src/hooks/useInstanceModules.js` | modulo/limite | mantener | vigente |
| `src/services/instanceSettingsService.js` | `instance_settings` | mantener | vigente |
| `src/pages/RootInstancePage.jsx` | root instancia | mantener | vigente |
| `src/pages/RootModulesPage.jsx` | root modulos/limites | mantener | vigente |
| `functions/create-lead-public/src/index.js` | `propertyId` | adapt -> `resourceId` canonico + compat | migrado |
| `functions/create-lead-public/src/lib/modulesService.js` | module gating | mantener | vigente |
| `functions/create-reservation-public/src/index.js` | `propertyId`, mode rules | adapt -> `resourceId` + gating por modulo/limite | migrado |
| `functions/create-reservation-public/src/lib/modulesService.js` | module gating | mantener | vigente |
| `functions/create-payment-session/src/index.js` | `propertyId` | adapt -> resolver `resourceId` + compat | migrado |
| `functions/create-payment-session/src/lib/modulesService.js` | module gating | mantener | vigente |
| `src/contexts/ChatContext.jsx` | contexto de chat ligado a propiedad | adapt -> resource-centric | en migracion |
| `src/components/chat/PropertyChatButton.jsx` | `propertyId` | adapt -> aceptar `resourceId` | en migracion |
| `src/utils/internalRoutes.js` | rutas de detalle/publicas | mantener `/propiedades/:slug` por SEO | vigente |
| `docs/03_appwrite_db_schema.md` | schema `properties` | update -> `resources` canonico + deprecate legacy | migrado |
| `docs/11_schema_mapping_matrix.md` | mapeos legacy | update -> matrices v3 | migrado |

---

## Archivos con alta prioridad de cierre (pendientes)

1. `src/services/chatService.js`
2. `src/contexts/ChatContext.jsx`
3. `src/pages/PropertyDetail.jsx`
4. `src/pages/ReserveProperty.jsx`
5. `src/services/leadsService.js`
6. `src/services/reservationsService.js`

---

## Criterio de salida de compatibilidad legacy

Se puede deprecar completamente `propertyId/properties` cuando:

- 100% de create/update/read opera con `resourceId/resources`.
- chat/conversaciones no dependan de `propertyId`.
- webhooks/reportes no lean `properties`.

---

Ultima actualizacion: 2026-02-18
Version: 1.0.0
