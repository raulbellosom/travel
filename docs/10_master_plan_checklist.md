# 10_MASTER_PLAN_CHECKLIST - RESOURCE + MODULES

## Proposito

Checklist maestro para migracion de `properties` a `resources` con sistema de modulos por instancia.

---

## Estado auditado (2026-02-26)

- [x] Arquitectura canonica `resource-first` implementada en formularios/wizard/editor.
- [x] Helper de comportamiento `getResourceBehavior` centralizado.
- [x] Hook `useInstanceModules` y servicios de `instance_settings` integrados.
- [x] Rutas root nuevas (`/app/root/instance`, `/app/root/modules`) disponibles.
- [x] Functions criticas (`create-lead`, `create-reservation-public`, `create-payment-session`) migradas con `resourceId` canonico y fallback `propertyId`.
- [x] Helper de modulo/limites agregado en functions (`modulesService`).
- [x] Documentacion v3 actualizada (`02`, `03`, `05`, `06`, `07`, `11`, `12`, `13`, `14`, `17`).
- [x] Nuevos docs de arquitectura/modulos/migracion creados (`14`, `15`, `16`).
- [x] `attributes.slotMode` implementado en wizard profiles (`music`, `service`, `venue`, `experience`) para `rent_hourly`.
- [x] UI hour-range picker en detalle publico (`PropertyDetail`): selector hora inicio + cantidad de horas.
- [x] `effectiveScheduleType` infiere `manualContactScheduleType` desde `commercialMode` cuando atributo ausente.
- [x] Slots horarios leen `attrs.availabilityStartTime`/`availabilityEndTime` (no `checkInTime`/`checkOutTime`).
- [x] Labels schedule-type-aware en `/reservar/` (date_range/time_slot/single).
- [x] Wizard conditions step: layout responsive 2-col con `slotMode` condicional.

---

## Compatibilidad y migracion

- [x] `properties` y `propertyId` permanecen como capa temporal de compatibilidad.
- [x] Contratos backend aceptan `resourceId` y fallback legacy.
- [x] Rutas publicas SEO (`/propiedades/:slug`) preservadas.
- [ ] Retiro definitivo de `properties/property_images` (pendiente post-migracion completa).

---

## QA manual minima (obligatoria)

1. Crear resource tipo casa en venta -> publicar -> detalle con CTA contacto.

- [ ] Ejecutado

2. Crear resource tipo casa en renta largo plazo -> detalle sin calendario publico.

- [ ] Ejecutado

3. Crear resource tipo casa en renta vacacional -> calendario + checkout + pago.

- [ ] Ejecutado

4. Apagar `module.booking.short_term` -> UI oculta opcion vacacional y backend bloquea.

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

10. Detalle publico muestra slots horarios correctos (usa `availabilityStartTime`/`availabilityEndTime` de attributes).

- [ ] Ejecutado

11. Detalle publico `rent_hourly` + `slotMode=hour_range` muestra selector de hora inicio + cantidad de horas.

- [ ] Ejecutado

12. Wizard `rent_hourly` muestra `slotMode` y condiciona campos visibles (predefined vs hour_range).

- [ ] Ejecutado

---

- [x] `npm run build` en frontend.
- [x] `node --check` en functions migradas.
- [ ] Suite de smoke tests E2E resource/modules.

---

Ultima actualizacion: 2026-02-26
Version: 3.1.0
