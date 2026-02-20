# 17_WIZARD_FLOWS_COMBINATIONS

Documento generado automaticamente desde la configuracion real del wizard.

Fecha de generacion: 2026-02-20
Combinaciones totales: 82

---

## 0. Rutas reales del wizard (frontend)

### Ruta principal de creacion

- URL canonica: `/app/properties/new`
- Alias legacy/redirect: `/app/crear-propiedad`, `/properties/new`, `/crear-propiedad`
- Componente: `CreateProperty` -> `PropertyWizard`

### Ruta de edicion (usa la misma logica dinamica por perfil de recurso)

- URL canonica: `/app/properties/:id/edit`
- Alias legacy/redirect: `/app/editar-propiedad/:id`, `/properties/:id/edit`, `/editar-propiedad/:id`
- Componente: `EditProperty` (usa el mismo motor de perfil dinamico de campos)

### Nota importante

- No existe una URL distinta por `resourceType` (`property`, `vehicle`, `service`, `experience`, `venue`).
- La variacion por tipo/categoria/modo ocurre dentro del wizard en runtime, no por ruta HTTP.

---

## 1. Campos base (se preguntan en todos los flujos)

### typeAndInfo

- `resourceType`
- `commercialMode`
- `category`
- `title`
- `slug`
- `description`

### location

- `country`
- `state`
- `city`
- `streetAddress`
- `neighborhood`
- `postalCode`
- `latitude`
- `longitude`

### pricing

- `price`
- `currency`
- `pricingModel`
- `priceNegotiable`

### amenities

- `amenityIds`

### images

- `videoUrl`
- `virtualTourUrl`
- `imageFiles`

---

## 2. Catalogo de preguntas dinamicas y valores

- `bedrooms` -> source=root | type=number | range=0..50 | step=1
- `bathrooms` -> source=root | type=number | range=0..50 | step=0.5
- `parkingSpaces` -> source=root | type=number | range=0..20 | step=1
- `totalArea` -> source=root | type=number | range=0..999999 | step=0.01 | unitKey=propertyForm.units.squareMeters
- `builtArea` -> source=root | type=number | range=0..999999 | step=0.01 | unitKey=propertyForm.units.squareMeters
- `floors` -> source=root | type=number | range=1..200 | step=1
- `yearBuilt` -> source=root | type=number | range=1800..2100 | step=1
- `furnished` -> source=root | type=select | values=[unfurnished, semi_furnished, furnished]
- `petsAllowed` -> source=root | type=boolean | values=[true,false]
- `minimumContractDuration` -> source=attributes | type=number | range=1..120 | step=1 | unitKey=propertyForm.units.months
- `maxGuests` -> source=root | type=number | range=1..500 | step=1
- `minStayNights` -> source=root | type=number | range=1..365 | step=1
- `maxStayNights` -> source=root | type=number | range=1..365 | step=1
- `checkInTime` -> source=root | type=time | format=HH:mm
- `checkOutTime` -> source=root | type=time | format=HH:mm
- `bookingMinUnits` -> source=attributes | type=number | range=1..365 | step=1
- `bookingMaxUnits` -> source=attributes | type=number | range=1..365 | step=1
- `availabilityStartTime` -> source=attributes | type=time | format=HH:mm
- `availabilityEndTime` -> source=attributes | type=time | format=HH:mm
- `vehicleModelYear` -> source=attributes | type=number | range=1950..2100 | step=1
- `vehicleSeats` -> source=attributes | type=number | range=1..60 | step=1 | unitKey=propertyForm.units.seats
- `vehicleDoors` -> source=attributes | type=number | range=1..8 | step=1 | unitKey=propertyForm.units.doors
- `vehicleTransmission` -> source=attributes | type=select | values=[automatic, manual, semi_automatic]
- `vehicleFuelType` -> source=attributes | type=select | values=[gasoline, diesel, electric, hybrid]
- `vehicleLuggageCapacity` -> source=attributes | type=number | range=0..20 | step=1 | unitKey=propertyForm.units.pieces
- `serviceDurationMinutes` -> source=attributes | type=number | range=15..1440 | step=15 | unitKey=propertyForm.units.minutes
- `serviceStaffCount` -> source=attributes | type=number | range=1..100 | step=1 | unitKey=propertyForm.units.people
- `serviceAtClientLocation` -> source=attributes | type=boolean | values=[true,false]
- `serviceIncludesMaterials` -> source=attributes | type=boolean | values=[true,false]
- `serviceResponseTimeHours` -> source=attributes | type=number | range=0..168 | step=1 | unitKey=propertyForm.units.hours
- `experienceDurationMinutes` -> source=attributes | type=number | range=30..1440 | step=15 | unitKey=propertyForm.units.minutes
- `experienceMinParticipants` -> source=attributes | type=number | range=1..200 | step=1 | unitKey=propertyForm.units.people
- `experienceMaxParticipants` -> source=attributes | type=number | range=1..200 | step=1 | unitKey=propertyForm.units.people
- `experienceDifficulty` -> source=attributes | type=select | values=[easy, intermediate, challenging, expert]
- `experienceIncludesEquipment` -> source=attributes | type=boolean | values=[true,false]
- `experienceMinAge` -> source=attributes | type=number | range=0..99 | step=1 | unitKey=propertyForm.units.years
- `venueCapacitySeated` -> source=attributes | type=number | range=1..5000 | step=1 | unitKey=propertyForm.units.people
- `venueCapacityStanding` -> source=attributes | type=number | range=1..10000 | step=1 | unitKey=propertyForm.units.people
- `venueHasStage` -> source=attributes | type=boolean | values=[true,false]
- `venueOpeningTime` -> source=attributes | type=time | format=HH:mm
- `venueClosingTime` -> source=attributes | type=time | format=HH:mm

---

## 3. Matriz exhaustiva de flujos (una fila por combinacion)

Notas:
- `steps` ya considera si un paso dinamico aparece o se oculta.
- `features` y `commercialConditions` son las preguntas dinamicas exactas por combinacion.

### resourceType: property

| # | category | commercialMode | bookingType default | pricingModel permitidos | steps | features | commercialConditions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `house` | `sale` | `manual_contact` | total, per_m2 | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `bedrooms`, `bathrooms`, `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | - |
| 2 | `house` | `rent_long_term` | `manual_contact` | per_month, per_day, total, per_m2 | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `bedrooms`, `bathrooms`, `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | `furnished`, `petsAllowed`, `minimumContractDuration` |
| 3 | `house` | `rent_short_term` | `date_range` | per_day, per_night, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `bedrooms`, `bathrooms`, `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | `maxGuests`, `minStayNights`, `maxStayNights`, `checkInTime`, `checkOutTime` |
| 4 | `house` | `rent_hourly` | `time_slot` | per_hour, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `bedrooms`, `bathrooms`, `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 5 | `apartment` | `sale` | `manual_contact` | total, per_m2 | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `bedrooms`, `bathrooms`, `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | - |
| 6 | `apartment` | `rent_long_term` | `manual_contact` | per_month, per_day, total, per_m2 | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `bedrooms`, `bathrooms`, `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | `furnished`, `petsAllowed`, `minimumContractDuration` |
| 7 | `apartment` | `rent_short_term` | `date_range` | per_day, per_night, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `bedrooms`, `bathrooms`, `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | `maxGuests`, `minStayNights`, `maxStayNights`, `checkInTime`, `checkOutTime` |
| 8 | `apartment` | `rent_hourly` | `time_slot` | per_hour, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `bedrooms`, `bathrooms`, `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 9 | `land` | `sale` | `manual_contact` | total, per_m2 | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `totalArea` | - |
| 10 | `land` | `rent_long_term` | `manual_contact` | per_month, per_day, total, per_m2 | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `totalArea` | `furnished`, `petsAllowed`, `minimumContractDuration` |
| 11 | `land` | `rent_short_term` | `date_range` | per_day, per_night, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `totalArea` | `maxGuests`, `minStayNights`, `maxStayNights`, `checkInTime`, `checkOutTime` |
| 12 | `land` | `rent_hourly` | `time_slot` | per_hour, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `totalArea` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 13 | `commercial` | `sale` | `manual_contact` | total, per_m2 | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `bathrooms`, `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | - |
| 14 | `commercial` | `rent_long_term` | `manual_contact` | per_month, per_day, total, per_m2 | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `bathrooms`, `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | `furnished`, `petsAllowed`, `minimumContractDuration` |
| 15 | `commercial` | `rent_short_term` | `date_range` | per_day, per_night, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `bathrooms`, `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | `maxGuests`, `minStayNights`, `maxStayNights`, `checkInTime`, `checkOutTime` |
| 16 | `commercial` | `rent_hourly` | `time_slot` | per_hour, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `bathrooms`, `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 17 | `office` | `sale` | `manual_contact` | total, per_m2 | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `bathrooms`, `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | - |
| 18 | `office` | `rent_long_term` | `manual_contact` | per_month, per_day, total, per_m2 | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `bathrooms`, `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | `furnished`, `petsAllowed`, `minimumContractDuration` |
| 19 | `office` | `rent_short_term` | `date_range` | per_day, per_night, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `bathrooms`, `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | `maxGuests`, `minStayNights`, `maxStayNights`, `checkInTime`, `checkOutTime` |
| 20 | `office` | `rent_hourly` | `time_slot` | per_hour, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `bathrooms`, `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 21 | `warehouse` | `sale` | `manual_contact` | total, per_m2 | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | - |
| 22 | `warehouse` | `rent_long_term` | `manual_contact` | per_month, per_day, total, per_m2 | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | `furnished`, `petsAllowed`, `minimumContractDuration` |
| 23 | `warehouse` | `rent_short_term` | `date_range` | per_day, per_night, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | `maxGuests`, `minStayNights`, `maxStayNights`, `checkInTime`, `checkOutTime` |
| 24 | `warehouse` | `rent_hourly` | `time_slot` | per_hour, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |

### resourceType: vehicle

| # | category | commercialMode | bookingType default | pricingModel permitidos | steps | features | commercialConditions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 25 | `car` | `sale` | `manual_contact` | total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 26 | `car` | `rent_long_term` | `manual_contact` | per_month, per_day, total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 27 | `car` | `rent_short_term` | `date_range` | per_day, total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 28 | `car` | `rent_hourly` | `time_slot` | per_hour, total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 29 | `suv` | `sale` | `manual_contact` | total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 30 | `suv` | `rent_long_term` | `manual_contact` | per_month, per_day, total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 31 | `suv` | `rent_short_term` | `date_range` | per_day, total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 32 | `suv` | `rent_hourly` | `time_slot` | per_hour, total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 33 | `pickup` | `sale` | `manual_contact` | total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 34 | `pickup` | `rent_long_term` | `manual_contact` | per_month, per_day, total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 35 | `pickup` | `rent_short_term` | `date_range` | per_day, total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 36 | `pickup` | `rent_hourly` | `time_slot` | per_hour, total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 37 | `van` | `sale` | `manual_contact` | total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 38 | `van` | `rent_long_term` | `manual_contact` | per_month, per_day, total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 39 | `van` | `rent_short_term` | `date_range` | per_day, total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 40 | `van` | `rent_hourly` | `time_slot` | per_hour, total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 41 | `motorcycle` | `sale` | `manual_contact` | total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 42 | `motorcycle` | `rent_long_term` | `manual_contact` | per_month, per_day, total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 43 | `motorcycle` | `rent_short_term` | `date_range` | per_day, total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 44 | `motorcycle` | `rent_hourly` | `time_slot` | per_hour, total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 45 | `boat` | `sale` | `manual_contact` | total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 46 | `boat` | `rent_long_term` | `manual_contact` | per_month, per_day, total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 47 | `boat` | `rent_short_term` | `date_range` | per_day, total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 48 | `boat` | `rent_hourly` | `time_slot` | per_hour, total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |

### resourceType: service

| # | category | commercialMode | bookingType default | pricingModel permitidos | steps | features | commercialConditions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 49 | `cleaning` | `rent_short_term` | `date_range` | per_day, per_person, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `serviceDurationMinutes`, `serviceStaffCount`, `serviceAtClientLocation`, `serviceIncludesMaterials`, `serviceResponseTimeHours` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 50 | `cleaning` | `rent_hourly` | `time_slot` | per_hour, per_person, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `serviceDurationMinutes`, `serviceStaffCount`, `serviceAtClientLocation`, `serviceIncludesMaterials`, `serviceResponseTimeHours` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 51 | `dj` | `rent_short_term` | `date_range` | per_day, per_person, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `serviceDurationMinutes`, `serviceStaffCount`, `serviceAtClientLocation`, `serviceIncludesMaterials`, `serviceResponseTimeHours` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 52 | `dj` | `rent_hourly` | `time_slot` | per_hour, per_person, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `serviceDurationMinutes`, `serviceStaffCount`, `serviceAtClientLocation`, `serviceIncludesMaterials`, `serviceResponseTimeHours` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 53 | `chef` | `rent_short_term` | `date_range` | per_day, per_person, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `serviceDurationMinutes`, `serviceStaffCount`, `serviceAtClientLocation`, `serviceIncludesMaterials`, `serviceResponseTimeHours` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 54 | `chef` | `rent_hourly` | `time_slot` | per_hour, per_person, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `serviceDurationMinutes`, `serviceStaffCount`, `serviceAtClientLocation`, `serviceIncludesMaterials`, `serviceResponseTimeHours` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 55 | `photography` | `rent_short_term` | `date_range` | per_day, per_person, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `serviceDurationMinutes`, `serviceStaffCount`, `serviceAtClientLocation`, `serviceIncludesMaterials`, `serviceResponseTimeHours` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 56 | `photography` | `rent_hourly` | `time_slot` | per_hour, per_person, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `serviceDurationMinutes`, `serviceStaffCount`, `serviceAtClientLocation`, `serviceIncludesMaterials`, `serviceResponseTimeHours` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 57 | `catering` | `rent_short_term` | `date_range` | per_day, per_person, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `serviceDurationMinutes`, `serviceStaffCount`, `serviceAtClientLocation`, `serviceIncludesMaterials`, `serviceResponseTimeHours` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 58 | `catering` | `rent_hourly` | `time_slot` | per_hour, per_person, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `serviceDurationMinutes`, `serviceStaffCount`, `serviceAtClientLocation`, `serviceIncludesMaterials`, `serviceResponseTimeHours` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 59 | `maintenance` | `rent_short_term` | `date_range` | per_day, per_person, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `serviceDurationMinutes`, `serviceStaffCount`, `serviceAtClientLocation`, `serviceIncludesMaterials`, `serviceResponseTimeHours` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 60 | `maintenance` | `rent_hourly` | `time_slot` | per_hour, per_person, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `serviceDurationMinutes`, `serviceStaffCount`, `serviceAtClientLocation`, `serviceIncludesMaterials`, `serviceResponseTimeHours` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |

### resourceType: experience

| # | category | commercialMode | bookingType default | pricingModel permitidos | steps | features | commercialConditions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 61 | `tour` | `rent_short_term` | `date_range` | per_person, per_day, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `experienceDurationMinutes`, `experienceMinParticipants`, `experienceMaxParticipants`, `experienceDifficulty`, `experienceIncludesEquipment`, `experienceMinAge` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 62 | `tour` | `rent_hourly` | `time_slot` | per_hour, per_person, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `experienceDurationMinutes`, `experienceMinParticipants`, `experienceMaxParticipants`, `experienceDifficulty`, `experienceIncludesEquipment`, `experienceMinAge` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 63 | `class` | `rent_short_term` | `date_range` | per_person, per_day, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `experienceDurationMinutes`, `experienceMinParticipants`, `experienceMaxParticipants`, `experienceDifficulty`, `experienceIncludesEquipment`, `experienceMinAge` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 64 | `class` | `rent_hourly` | `time_slot` | per_hour, per_person, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `experienceDurationMinutes`, `experienceMinParticipants`, `experienceMaxParticipants`, `experienceDifficulty`, `experienceIncludesEquipment`, `experienceMinAge` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 65 | `workshop` | `rent_short_term` | `date_range` | per_person, per_day, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `experienceDurationMinutes`, `experienceMinParticipants`, `experienceMaxParticipants`, `experienceDifficulty`, `experienceIncludesEquipment`, `experienceMinAge` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 66 | `workshop` | `rent_hourly` | `time_slot` | per_hour, per_person, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `experienceDurationMinutes`, `experienceMinParticipants`, `experienceMaxParticipants`, `experienceDifficulty`, `experienceIncludesEquipment`, `experienceMinAge` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 67 | `adventure` | `rent_short_term` | `date_range` | per_person, per_day, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `experienceDurationMinutes`, `experienceMinParticipants`, `experienceMaxParticipants`, `experienceDifficulty`, `experienceIncludesEquipment`, `experienceMinAge` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 68 | `adventure` | `rent_hourly` | `time_slot` | per_hour, per_person, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `experienceDurationMinutes`, `experienceMinParticipants`, `experienceMaxParticipants`, `experienceDifficulty`, `experienceIncludesEquipment`, `experienceMinAge` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 69 | `wellness` | `rent_short_term` | `date_range` | per_person, per_day, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `experienceDurationMinutes`, `experienceMinParticipants`, `experienceMaxParticipants`, `experienceDifficulty`, `experienceIncludesEquipment`, `experienceMinAge` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 70 | `wellness` | `rent_hourly` | `time_slot` | per_hour, per_person, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `experienceDurationMinutes`, `experienceMinParticipants`, `experienceMaxParticipants`, `experienceDifficulty`, `experienceIncludesEquipment`, `experienceMinAge` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 71 | `gastronomy` | `rent_short_term` | `date_range` | per_person, per_day, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `experienceDurationMinutes`, `experienceMinParticipants`, `experienceMaxParticipants`, `experienceDifficulty`, `experienceIncludesEquipment`, `experienceMinAge` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 72 | `gastronomy` | `rent_hourly` | `time_slot` | per_hour, per_person, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `experienceDurationMinutes`, `experienceMinParticipants`, `experienceMaxParticipants`, `experienceDifficulty`, `experienceIncludesEquipment`, `experienceMinAge` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |

### resourceType: venue

| # | category | commercialMode | bookingType default | pricingModel permitidos | steps | features | commercialConditions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 73 | `event_hall` | `rent_short_term` | `date_range` | per_day, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `venueCapacitySeated`, `venueCapacityStanding`, `totalArea`, `venueHasStage`, `venueOpeningTime`, `venueClosingTime` | `maxGuests`, `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 74 | `event_hall` | `rent_hourly` | `time_slot` | per_hour, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `venueCapacitySeated`, `venueCapacityStanding`, `totalArea`, `venueHasStage`, `venueOpeningTime`, `venueClosingTime` | `maxGuests`, `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 75 | `commercial_local` | `rent_short_term` | `date_range` | per_day, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `venueCapacitySeated`, `venueCapacityStanding`, `totalArea`, `venueHasStage`, `venueOpeningTime`, `venueClosingTime` | `maxGuests`, `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 76 | `commercial_local` | `rent_hourly` | `time_slot` | per_hour, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `venueCapacitySeated`, `venueCapacityStanding`, `totalArea`, `venueHasStage`, `venueOpeningTime`, `venueClosingTime` | `maxGuests`, `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 77 | `studio` | `rent_short_term` | `date_range` | per_day, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `venueCapacitySeated`, `venueCapacityStanding`, `totalArea`, `venueHasStage`, `venueOpeningTime`, `venueClosingTime` | `maxGuests`, `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 78 | `studio` | `rent_hourly` | `time_slot` | per_hour, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `venueCapacitySeated`, `venueCapacityStanding`, `totalArea`, `venueHasStage`, `venueOpeningTime`, `venueClosingTime` | `maxGuests`, `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 79 | `coworking` | `rent_short_term` | `date_range` | per_day, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `venueCapacitySeated`, `venueCapacityStanding`, `totalArea`, `venueHasStage`, `venueOpeningTime`, `venueClosingTime` | `maxGuests`, `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 80 | `coworking` | `rent_hourly` | `time_slot` | per_hour, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `venueCapacitySeated`, `venueCapacityStanding`, `totalArea`, `venueHasStage`, `venueOpeningTime`, `venueClosingTime` | `maxGuests`, `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 81 | `meeting_room` | `rent_short_term` | `date_range` | per_day, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `venueCapacitySeated`, `venueCapacityStanding`, `totalArea`, `venueHasStage`, `venueOpeningTime`, `venueClosingTime` | `maxGuests`, `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 82 | `meeting_room` | `rent_hourly` | `time_slot` | per_hour, per_event, total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `venueCapacitySeated`, `venueCapacityStanding`, `totalArea`, `venueHasStage`, `venueOpeningTime`, `venueClosingTime` | `maxGuests`, `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |

---

## 4. Referencia rapida de interpretacion

- `rent_long_term`: condiciones comerciales de contrato (sin selector duplicado de periodo). 
- `rent_short_term`: reglas de estancia por fecha + pricing por `pricingModel`.
- `rent_hourly`: reglas por hora/evento + pricing por `pricingModel`.
- `pricingModel` es la unica fuente de verdad para periodicidad de cobro.
- Para `vehicle`, el ano corresponde a `vehicleModelYear` (no `yearBuilt`).
- Para `vehicle`, el paso `commercialConditions` no aplica en este flujo (renta individual sin min/max unidades de reserva).

---

## 5. Reglas dinamicas activas (motor del wizard)

- Al cambiar `resourceType`, se sanitizan automaticamente:
- `category` (solo categorias permitidas para ese tipo).
- `commercialMode` (solo modos permitidos para ese tipo).
- `pricingModel` (solo modelos permitidos para ese tipo + modo).
- `bookingType` (fallback por modo: `manual_contact`, `date_range`, `time_slot`).
- Si cambia el contexto `resourceType|category|commercialMode`, el wizard reinicia navegacion a paso 1 y recalcula pasos visibles.
- El paso `features` solo aparece si el perfil actual tiene campos dinamicos de caracteristicas.
- El paso `commercialConditions` solo aparece si el perfil actual tiene campos dinamicos de condiciones.
- La validacion por paso solo evalua los campos activos de ese paso; al guardar se valida todo el perfil activo.
- En `location`, `country/state/city` se validan por cascada y se normalizan contra catalogo cargado.
- Las amenidades se ordenan por relevancia segun `resourceType` + `category` (no por modo comercial).

---

## 6. Posibles desajustes funcionales detectados

- `property + land + rent_long_term` muestra `furnished` y `petsAllowed`; puede sentirse semantico-debil para terrenos.
- `vehicle` permite `rent_long_term` con `pricingModel=per_day`; operativamente puede ser valido, pero UX puede confundir si esperan solo mensual.
- `amenities` existe para todos los tipos de recurso; si no hay catalogo especializado por tipo, puede mostrar opciones poco pertinentes.
- `location` siempre exige `country/state/city`; para ciertos `service` o `experience` digitales podria requerirse un modo "sin ubicacion fisica".
