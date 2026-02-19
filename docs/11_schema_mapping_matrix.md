# 11_SCHEMA_MAPPING_MATRIX - PROPERTIES -> RESOURCES

## Proposito

Matriz de mapeo entre contrato legacy y contrato canonico v3.

Regla:

- Nuevo desarrollo usa `resources`.
- Compatibilidad temporal con `properties` mientras dure migracion.

---

## Mapeo de entidades

| Dominio | Legacy | Canonico v3 | Estado |
| --- | --- | --- | --- |
| Catalogo principal | `properties` | `resources` | en migracion |
| Galeria | `property_images` | `resource_images` | en migracion |
| Pricing | campos directos en `properties` | `rate_plans` + campos base en `resources` | en migracion |
| Configuracion de plan | N/A | `instance_settings` | vigente |

---

## Mapeo de campos

| Legacy | Canonico | Notas |
| --- | --- | --- |
| `properties.$id` | `resources.$id` | id principal de recurso |
| `operationType` | `commercialMode` | `sale -> sale`, `rent -> rent_long_term`, `vacation_rental -> rent_short_term`, `hourly -> rent_hourly` |
| `propertyType` | `category` | mapeo semantico por tipo |
| `pricePerUnit` | `pricingModel` | alias temporal permitido |
| `propertyId` | `resourceId` | canonico en leads/reservations/chat |
| `propertyTitle` | `resourceTitle` | denormalizado para UI/chat |

---

Nota de alcance para `propertyType -> category`:

- El alias legacy `propertyType` representa categorias del dominio inmobiliario (`resourceType=property`).
- En recursos no inmobiliarios (`service`,`vehicle`,`experience`,`venue`), el campo canonico es `category` y debe validarse contra su catalogo propio por tipo.

---

## Mapeo por coleccion

| Coleccion | Antes | Ahora | Compat |
| --- | --- | --- | --- |
| `leads` | `propertyId` | `resourceId` | guardar ambos temporalmente |
| `reservations` | `propertyId` | `resourceId` | aceptar ambos en API |
| `reservation_payments` | referencia indirecta property | referencia canonica a resource | mantener alias legacy |
| `conversations` | `propertyId`,`propertyTitle` | `resourceId`,`resourceTitle` | mantener aliases |
| `messages` | sin campo property | sin cambio (via conversation) | no aplica |

---

## Enums canonicos v3

### resources

- `resourceType`: `property`, `service`, `vehicle`, `experience`, `venue`
- `commercialMode`: `sale`, `rent_long_term`, `rent_short_term`, `rent_hourly`
- `pricingModel`: `total`, `per_month`, `per_night`, `per_day`, `per_hour`, `per_person`, `per_event`, `per_m2`
- `bookingType`: `manual_contact`, `date_range`, `time_slot`, `fixed_event`

### instance_settings

- `planKey`: `starter`, `pro`, `elite`, `custom`
- `enabledModules[]`: lista de modulo keys (`module.*`)

---

## Estado de implementacion en codigo

| Componente | Cambio | Estado |
| --- | --- | --- |
| Wizard/editor | usa `resourceType/category/commercialMode/pricingModel` | implementado |
| Sidebar root | links a instancia/modulos | implementado |
| Leads function | `resourceId` canonico + fallback | implementado |
| Reservations function | gating por modulo/limite + `resourceId` | implementado |
| Payment session function | resolve `resourceId` + gating | implementado |
| Chat servicios | soporte `resourceId` con alias legacy | implementado parcial |

---

Ultima actualizacion: 2026-02-18
Version: 2.0.0
