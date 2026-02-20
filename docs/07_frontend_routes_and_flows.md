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
- Wizard/editor debe filtrar `pricingModel` por combinacion `resourceType + commercialMode`.
- Wizard/editor debe resolver campos dinamicos por perfil `resourceType + category + commercialMode` (sin set fijo inmobiliario).
- Pasos `features` y `commercialConditions` deben ocultarse automaticamente cuando el perfil activo no tenga campos aplicables.
- No se permiten combinaciones cruzadas invalidadas por matriz (ejemplo: `resourceType=vehicle` con `category=house`).

Nota: backend vuelve a validar siempre.

---

## 9. Errores esperados

- `403 MODULE_DISABLED`
- `403 LIMIT_EXCEEDED`
- `422 VALIDATION_ERROR`
- `409 CONFLICT`

---

Ultima actualizacion: 2026-02-20
Version: 3.3.0
