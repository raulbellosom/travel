# 10_MASTER_PLAN_CHECKLIST - RESOURCE + MODULES

## Proposito

Checklist maestro para migracion de `properties` a `resources` con sistema de modulos por instancia.

---

## Estado auditado (2026-03-08)

- [x] Arquitectura canonica `resource-first` implementada en formularios/wizard/editor.
- [x] Helper de comportamiento `getResourceBehavior` centralizado.
- [x] Hook `useInstanceModules` y servicios de `instance_settings` integrados.
- [x] Rutas root nuevas (`/app/root/instance`, `/app/root/modules`) disponibles.
- [x] Functions criticas (`create-lead`, `create-reservation-public`, `create-payment-session`) migradas con `resourceId` canonico ~~y fallback `propertyId`~~ (fallback eliminado 2025-07).
- [x] Helper de modulo/limites agregado en functions (`modulesService`).
- [x] Documentacion v3 actualizada (`02`, `03`, `05`, `06`, `07`, `11`, `12`, `13`, `14`, `17`).
- [x] Nuevos docs de arquitectura/modulos/migracion creados (`14`, `15`, `16`).
- [x] `attributes.slotMode` implementado en wizard profiles (`music`, `service`, `venue`, `experience`) para `rent_hourly`.
- [x] UI hour-range picker en detalle publico (`PropertyDetail`): selector hora inicio + cantidad de horas.
- [x] `effectiveScheduleType` infiere `manualContactScheduleType` desde `commercialMode` cuando atributo ausente.
- [x] Slots horarios leen `attrs.availabilityStartTime`/`availabilityEndTime` (no `checkInTime`/`checkOutTime`).
- [x] Labels schedule-type-aware en `/reservar/` (date_range/time_slot/single).
- [x] Wizard conditions step: layout responsive 2-col con `slotMode` condicional.
- [x] `slotMode` guard corregido en todos los wizard profiles (`music`, `service`, `venue`, `experience`): solo activo para `bookingType !== "manual_contact"` (2026-03).
- [x] `bookingMinUnits`/`bookingMaxUnits` guard corregido: solo visibles para `slotMode=hour_range` + `commercialMode=rent_hourly` (2026-03).
- [x] Migracion de datos (001): backfill campos canonicos en coleccion `resources`. Resultado: 10 docs, 10 limpios, 0 parches, 0 anomalias (2026-03-08).
- [x] Hardening runtime: `normalizeResourceType()` emite `console.warn` para valores desconocidos no vacios (2026-03).
- [x] Hardening runtime: `normalizeCommercialMode()` emite `console.warn` para valores desconocidos no vacios (2026-03).
- [x] Hardening runtime: eliminado default `|| "house"` en `normalizeResourceDocument()` (2026-03).
- [x] Hardening runtime: `getAllowedPricingModels()` last-resort simplificado a `["fixed_total"]` directo (2026-03).
- [x] Dead code eliminado de `propertiesService.js`: rama `target="legacy"`, `normalizeOperationType`, `normalizedLegacyOperation`, `normalizedLegacyPricePerUnit`, imports `toLegacyOperationType`/`toLegacyPricePerUnit` (2026-03).
- [x] `useCanonicalResources` eliminado: todas las ramas condicionales hardcodeadas a modo canonico en `propertiesService.js` (2026-03).
- [x] Documentacion canonizada: `03_appwrite_db_schema.md` actualizado con sub-keys de `attributes`, nota de colision `house`, correccion de enum `pricingModel` (2026-03-08).
- [x] Nuevo doc `11_resource_booking_behavior.md`: referencia completa de comportamiento por resourceType/commercialMode/bookingType + QA matrix (2026-03-08).

---

## Compatibilidad y migracion

- [x] ~~`properties` y `propertyId` permanecen como capa temporal de compatibilidad.~~ Runtime hardening completado; fallbacks de lectura (|| doc.operationType, || doc.propertyType) preservados solo como bridges de lectura de DB.
- [x] ~~Contratos backend aceptan `resourceId` y fallback legacy.~~ Fallback `propertyId` eliminado de reservations/functions (2025-07).
- [x] Rutas publicas SEO (`/propiedades/:slug`) preservadas.
- [ ] Retiro definitivo de `properties/property_images` (pendiente post-migracion completa).
- [ ] Migracion 002: renombrar `category="house"` → `"house_music"` en recursos music (pendiente; ver `docs/migrations/`).
- [ ] Eliminar alias legacy del output de `normalizeResourceDocument()`: `operationType`, `pricePerUnit`, `propertyId`, `propertyTitle` (pendiente; verificar que no hay consumidores).

---

## QA manual minima (obligatoria)

Ver matriz completa con outcomes esperados en `docs/core/11_resource_booking_behavior.md § 11`.

### Core + modules

1. Crear resource tipo `property/house` en `sale` → publicar → detalle: CTA "Agendar visita", isVisitMode=true.

- [ ] Ejecutado

2. Crear resource tipo `property/house` en `rent_long_term` → detalle: CTA "Agendar visita", sin calendario de reservas.

- [ ] Ejecutado

3. Crear resource tipo `property/house` en `rent_short_term` + `bookingType=date_range` → calendario disponibilidad + CTA "Reservar".

- [ ] Ejecutado

4. Apagar `module.booking.short_term` → CTA cambia a "Contactar"; backend rechaza reserva.

- [ ] Ejecutado

5. Root activa/desactiva modulos y guarda limites desde `/app/root/modules`.

- [ ] Ejecutado

6. Cambios criticos generan `activity_logs` (root y owner).

- [ ] Ejecutado

7. Lead + chat operan con `resourceId` (si messaging ON).

- [ ] Ejecutado

8. Wizard filtra categorias por `resourceType` (sin cruces invalidos entre tipos).

- [ ] Ejecutado

9. Persistencia rechaza combinaciones invalidas `resourceType/category/commercialMode` con `422 VALIDATION_ERROR`.

- [ ] Ejecutado

### slotMode + hora

10. Detalle publico `rent_hourly` + `slotMode=predefined` muestra grid de slots disponibles.

- [ ] Ejecutado

11. Detalle publico `rent_hourly` + `slotMode=hour_range` muestra selector hora inicio + cantidad de horas.

- [ ] Ejecutado

12. Wizard `rent_hourly` muestra campo `slotMode` y condiciona visibilidad de bookingMinUnits/bookingMaxUnits (solo para hour_range).

- [ ] Ejecutado

### Por resourceType

13. `vehicle/car` en `sale`: CTA "Contactar", sin schedule widget (manualContactScheduleType=none).

- [ ] Ejecutado

14. `service/chef` en `rent_hourly` + `time_slot` + `hour_range`: selector hora inicio + horas en detalle publico.

- [ ] Ejecutado

15. `music/dj` en `rent_short_term` + `manual_contact`: CTA "Contactar", sin schedule widget.

- [ ] Ejecutado

16. `experience/tour` en `rent_short_term` + `date_range`: calendario disponibilidad + CTA "Reservar".

- [ ] Ejecutado

17. `venue/event_hall` en `rent_hourly` + `time_slot` + `predefined`: grid de slots.

- [ ] Ejecutado

### Hardening (console.warn)

18. Abrir consola del navegador → sin warnings `[resourceModel]` durante navegacion normal de recursos publicados.

- [ ] Ejecutado

19. Crear recurso con `resourceType` invalido directamente en Appwrite console → frontend emite `console.warn` en lugar de fallar silenciosamente.

- [ ] Ejecutado

---

- [x] `npm run build` en frontend.
- [x] `node --check` en functions migradas.
- [ ] Suite de smoke tests E2E resource/modules.

---

Ultima actualizacion: 2026-03-08
Version: 3.3.0
