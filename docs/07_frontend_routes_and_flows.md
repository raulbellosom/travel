# 07_FRONTEND_ROUTES_AND_FLOWS - RESOURCE PLATFORM

## Referencia

- `01_frontend_requirements.md`
- `05_permissions_and_roles.md`
- `06_appwrite_functions_catalog.md`

---

## 1. Principios

1. Mobile-first.
2. Frontend guardas = UX, no seguridad final.
3. Backend decide permisos/modulos/limites.
4. Rutas publicas existentes se preservan.

---

## 2. Guardas globales

- `ProtectedRoute`
- `InternalRoute`
- `RoleRoute`
- `ScopeRoute`
- `RootRoute`

---

## 3. Rutas publicas

| Ruta | Descripcion |
| --- | --- |
| `/` | home/catalogo |
| `/propiedades/:slug` | detalle publico de resource (slug canonico) |
| `/reservar/:slug` | checkout/reserva |
| `/voucher/:code` | lookup de voucher |
| `/login` | auth |
| `/register` | auth |
| `/mis-favoritos` | lista de recursos favoritos del usuario |

Compatibilidad:

- No se rompe `/propiedades/:slug`.
- Internamente se carga `resource` y se mapea comportamiento por `commercialMode/bookingType`.

---

## 4. Rutas privadas de operacion

| Ruta | Guard | Scope/Rol |
| --- | --- | --- |
| `/app/dashboard` | `InternalRoute` | interno |
| `/app/my-properties` | `ScopeRoute` | `resources.read` (compat alias) |
| `/app/properties/new` | `ScopeRoute` | `resources.write` (compat alias) |
| `/app/properties/:id/edit` | `ScopeRoute` | `resources.write` (compat alias) |
| `/app/leads` | `ScopeRoute` | `leads.read` |
| `/app/reservations` | `ScopeRoute` | `reservations.read` |
| `/app/calendar` | `ScopeRoute` | `reservations.read` |
| `/app/payments` | `ScopeRoute` | `payments.read` |
| `/app/reviews` | `ScopeRoute` | `reviews.moderate` |
| `/app/team` | `ScopeRoute` | `staff.manage` |
| `/perfil` | `ProtectedRoute` | cualquier auth |
| `/mis-favoritos` | `ProtectedRoute` | cualquier auth |
| `/mis-resenas` | `ProtectedRoute` | cualquier auth (client) |
| `/my-reviews` | `ProtectedRoute` | cualquier auth (client) |
| `/mis-reservas` | `ProtectedRoute` | cualquier auth (client) |
| `/my-reservations` | `ProtectedRoute` | cualquier auth (client) |

---

## 5. Rutas root (modulos/instancia)

| Ruta | Guard | Uso |
| --- | --- | --- |
| `/app/activity` | `RootRoute` | auditoria |
| `/app/amenities` | `RootRoute` | catalogo amenidades |
| `/app/root/instance` | `RootRoute` | settings generales de instancia |
| `/app/root/modules` | `RootRoute` | toggles de modulos + limites + plan |

Estas rutas no deben mostrarse a owner/staff/client.

---

## 6. Flujo canonico por comportamiento

## 6.1 Venta

- `commercialMode = sale`
- `bookingType = manual_contact`
- CTA: contacto/agendar visita
- Sin checkout online

## 6.2 Renta largo plazo

- `commercialMode = rent_long_term`
- `bookingType = manual_contact`
- CTA: contacto

## 6.3 Renta vacacional

- `commercialMode = rent_short_term`
- `bookingType = date_range`
- requiere modulo `module.booking.short_term`
- si cobra online: `module.payments.online`

## 6.4 Renta por horas

- `commercialMode = rent_hourly`
- `bookingType = time_slot` o `fixed_event`
- requiere modulo `module.booking.hourly`
- si cobra online: `module.payments.online`

## 6.5 Calendario publico en detalle

- Para `bookingType = date_range` en `PropertyDetail`, el calendario embebido del aside usa vista de **1 mes**.
- Se expone accion secundaria para abrir modal de calendario extendido con **2 meses**.
- En modal:
  - desktop: 2 meses en paralelo.
  - mobile: 2 meses apilados en vertical.
- El calendario publico del aside solo se habilita para usuario autenticado con rol `client`.
- Visitantes anonimos y roles internos (`root`, `owner`, `staff_*`) no deben ver este bloque.

---

## 7. Helper unico de comportamiento

`getResourceBehavior(resourceDraftOrDoc)` debe centralizar:

- `requiresCalendar`
- `requiresPayments`
- `allowedPricingModels`
- `ctaType`
- `priceLabel`

Uso obligatorio en:

- detalle publico
- wizard/editor
- cards/listados
- checkout

---

## 8. Gating UI por modulo

- Si `module.booking.short_term` esta OFF: ocultar opcion vacacional.
- Si `module.booking.hourly` esta OFF: ocultar opcion por horas.
- Si `module.payments.online` esta OFF: deshabilitar checkout online.
- Wizard/editor debe filtrar `category` y `commercialMode` por `resourceType` usando taxonomia canonica.
- Wizard/editor debe filtrar `pricingModel` por combinacion `resourceType + category + commercialMode`.
- Wizard/editor debe resolver campos dinamicos por perfil `resourceType + category + commercialMode` (sin set fijo inmobiliario).
- Pasos `features` y `commercialConditions` deben ocultarse automaticamente cuando el perfil activo no tenga campos aplicables.
- No se permiten combinaciones cruzadas invalidadas por matriz (ejemplo: `resourceType=vehicle` con `category=house`).
- `resourceType=music` es de primera clase y concentra `dj` + generos musicales; `dj` no debe aparecer bajo `service`.

Nota: backend vuelve a validar siempre.

---

## 9. Errores esperados

- `403 MODULE_DISABLED`
- `403 LIMIT_EXCEEDED`
- `422 VALIDATION_ERROR`
- `409 CONFLICT`

---

## 10. Favoritos y compartir (detalle publico)

- Vista `PropertyDetail` incluye accion `Compartir`:
  - usa `navigator.share` cuando existe;
  - fallback a copiar URL al portapapeles.
- Vista `PropertyDetail` incluye accion `Favoritos`:
  - usuario autenticado: toggle persistente en coleccion `favorites`;
  - usuario anonimo: redireccion a `/register?redirect=<ruta-actual>`.
- Al quitar favorito, el documento se elimina fisicamente (hard delete).

---

Ultima actualizacion: 2026-02-26
Version: 3.5.0
