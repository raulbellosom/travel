# 14_RESOURCE_ARCHITECTURE_SPEC

## Objetivo

Definir arquitectura canonica `resource-first` para INMOBO.

---

## 1. Entidad principal: Resource

`resource` reemplaza conceptualmente a `property` como dominio comercial principal.

Campos troncales:

- `resourceType`
- `category`
- `commercialMode`
- `pricingModel`
- `bookingType`
- `attributes` (JSON extensible)

---

## 2. Taxonomia base

### resourceType

- `property`
- `service`
- `vehicle` (futuro)
- `experience` (futuro)
- `venue`

### commercialMode

- `sale`
- `rent_long_term`
- `rent_short_term`
- `rent_hourly`

### pricingModel

- `total`
- `per_month`
- `per_night`
- `per_day`
- `per_hour`
- `per_person`
- `per_event`
- `per_m2`

### bookingType

- `manual_contact`
- `date_range`
- `time_slot`
- `fixed_event`

### Matriz canonica type -> category

| resourceType | categories permitidas |
| --- | --- |
| `property` | `house`,`apartment`,`land`,`commercial`,`office`,`warehouse` |
| `service` | `cleaning`,`dj`,`chef`,`photography`,`catering`,`maintenance` |
| `vehicle` | `car`,`suv`,`pickup`,`van`,`motorcycle`,`boat` |
| `experience` | `tour`,`class`,`workshop`,`adventure`,`wellness`,`gastronomy` |
| `venue` | `event_hall`,`commercial_local`,`studio`,`coworking`,`meeting_room` |

### Matriz canonica type -> commercialMode

| resourceType | commercialMode permitido |
| --- | --- |
| `property` | `sale`,`rent_long_term`,`rent_short_term`,`rent_hourly` |
| `service` | `rent_short_term`,`rent_hourly` |
| `vehicle` | `sale`,`rent_long_term`,`rent_short_term`,`rent_hourly` |
| `experience` | `rent_short_term`,`rent_hourly` |
| `venue` | `rent_short_term`,`rent_hourly` |

### Matriz canonica type+commercialMode -> pricingModel

| resourceType | commercialMode | pricingModel permitido |
| --- | --- | --- |
| `property` | `sale` | `total`,`per_m2` |
| `property` | `rent_long_term` | `per_month`,`per_day`,`total`,`per_m2` |
| `property` | `rent_short_term` | `per_day`,`per_night`,`total` |
| `property` | `rent_hourly` | `per_hour`,`per_event`,`total` |
| `vehicle` | `sale` | `total` |
| `vehicle` | `rent_long_term` | `per_month`,`per_day`,`total` |
| `vehicle` | `rent_short_term` | `per_day`,`total` |
| `vehicle` | `rent_hourly` | `per_hour`,`total` |
| `service` | `rent_short_term` | `per_day`,`per_person`,`per_event`,`total` |
| `service` | `rent_hourly` | `per_hour`,`per_person`,`per_event`,`total` |
| `experience` | `rent_short_term` | `per_person`,`per_day`,`per_event`,`total` |
| `experience` | `rent_hourly` | `per_hour`,`per_person`,`per_event`,`total` |
| `venue` | `rent_short_term` | `per_day`,`per_event`,`total` |
| `venue` | `rent_hourly` | `per_hour`,`per_event`,`total` |

Reglas de fallback:

- Si llega `category` invalida, se usa la primera categoria valida del `resourceType` solo para normalizacion interna de UI.
- Si llega `commercialMode` invalido, se usa el primer modo valido del `resourceType` solo para normalizacion interna de UI.
- Persistencia debe rechazar combinaciones invalidas (`422 VALIDATION_ERROR`) cuando el payload explicita una combinacion no permitida.

### Perfil dinamico de campos (wizard/editor)

El wizard/editor ya no usa un set fijo de campos de inmueble.
Ahora resuelve el formulario por:

- `resourceType`
- `category`
- `commercialMode`

Reglas operativas:

- Los campos `root` se usan solo cuando aplican al perfil activo.
- `yearBuilt` queda para inmuebles; `vehicle` usa `attributes.vehicleModelYear`.
- Campos especificos no inmobiliarios se serializan en `attributes` (JSON).
- Al cambiar de tipo/categoria/modo, el payload limpia campos dinamicos fuera de perfil para evitar combinaciones ilogicas (ejemplo: `vehicle` con `bedrooms`).
- Los pasos `features` y `commercialConditions` se renderizan solo si el perfil tiene campos.
- `pricingModel` define la periodicidad de cobro; no existe selector duplicado de periodo.
- `minimumContractDuration` se captura como `attributes.minimumContractDuration` para renta larga.

Catalogo inicial de atributos dinamicos (`attributes`) en UI:

- `vehicle`: `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity`.
- `service`: `serviceDurationMinutes`, `serviceStaffCount`, `serviceAtClientLocation`, `serviceIncludesMaterials`, `serviceResponseTimeHours`.
- `experience`: `experienceDurationMinutes`, `experienceMinParticipants`, `experienceMaxParticipants`, `experienceDifficulty`, `experienceIncludesEquipment`, `experienceMinAge`.
- `venue`: `venueCapacitySeated`, `venueCapacityStanding`, `venueHasStage`, `venueOpeningTime`, `venueClosingTime`.
- booking generico (no-property): `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime`.

---

## 3. Rate plans

`rate_plans` desacopla reglas de precio del recurso base.

Campos minimos:

- `resourceId`
- `basePrice`
- `currency`
- `pricingModel`
- `rules` (JSON para minStay, fees, taxes, depositos)

---

## 4. Behavior config central

Helper unico: `getResourceBehavior(resourceDraftOrDoc)`.

Debe devolver:

- `requiresCalendar`
- `requiresPayments`
- `allowedPricingModels`
- `ctaType` (`contact` | `book`)
- `priceLabel`

Se consume en:

- detalle publico
- wizard/editor
- cards/listados
- checkout

---

## 5. Reglas por modo comercial

### sale

- booking: `manual_contact`
- CTA: contacto/agendar visita
- pagos online: no

### rent_long_term

- booking: `manual_contact`
- CTA: solicitar informacion
- pagos online: no
- condiciones comerciales: `furnished`, `petsAllowed`, `minimumContractDuration`
- periodicidad de cobro unificada por `pricingModel` (`per_month`,`per_day`,`total`,`per_m2` segun tipo)

### rent_short_term

- booking: `date_range`
- CTA: reservar
- calendario: si
- pagos: opcional segun modulo

### rent_hourly

- booking: `time_slot` o `fixed_event`
- CTA: reservar
- calendario/slots: si

---

## 6. Compatibilidad legacy

Durante migracion:

- retirar `operationType` del contrato de wizard/editor (solo `commercialMode`).
- retirar `rentPeriod` del contrato de wizard/editor.
- mantener normalizacion defensiva de payload legacy en capas de lectura/migracion.
- mantener aliases `propertyType`, `pricePerUnit`, `propertyId` solo mientras exista deuda tecnica externa.
- persistir `resourceId` como fuente canonica.
- conservar ruta publica `/propiedades/:slug`.

---

## 7. No objetivos de esta fase

- retirar inmediatamente `properties`.
- eliminar todos los aliases legacy sin migracion de datos.

---

Ultima actualizacion: 2026-02-20
Version: 1.3.0
