# 17_WIZARD_FLOWS_COMBINATIONS

## Changelog

- 2026-02-21: Se aplico filtrado estricto por contexto completo (resourceType -> category -> commercialMode -> pricingModel).
- Vehiculos: se elimino `rent_hourly` en todas las categorias.
- Properties: `rent_hourly` ya no aparece; solo `venue` mantiene renta por hora.
- Pricing: `total` se renombro a `fixed_total` (UI: Precio fijo), manteniendo compatibilidad legacy.
- Se agrego `furnished` en venta para house/apartment/commercial/office/warehouse.
- En `property + land + rent_long_term` se removieron `furnished` y `petsAllowed`; queda `minimumContractDuration`.
- En `property + rent_short_term` se limitaron campos de estancia (no aplican para land/commercial/office/warehouse).

Documento generado automaticamente desde la configuracion real del wizard.

Fecha de generacion: 2026-02-21
Combinaciones totales: 70

---

## 0. Rutas reales del wizard (frontend)

- URL creacion: `/app/properties/new` -> `CreateProperty` -> `PropertyWizard`
- URL edicion: `/app/properties/:id/edit` -> `EditProperty` (mismo motor dinamico)
- No hay URL por `resourceType`; la variacion es runtime dentro del wizard.

---

## 1. Campos base (todos los flujos)

### typeAndInfo

- `resourceType`
- `category`
- `commercialMode`
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

## 2. Matriz exhaustiva de flujos

### resourceType: property

| # | category | commercialMode | bookingType default | pricingModel permitidos | steps | features | commercialConditions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `house` | `sale` | `manual_contact` | fixed_total, per_m2 | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `bedrooms`, `bathrooms`, `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | `furnished` |
| 2 | `house` | `rent_long_term` | `manual_contact` | per_month, fixed_total, per_m2 | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `bedrooms`, `bathrooms`, `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | `furnished`, `petsAllowed`, `minimumContractDuration` |
| 3 | `house` | `rent_short_term` | `date_range` | per_night, per_day, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `bedrooms`, `bathrooms`, `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | `maxGuests`, `minStayNights`, `maxStayNights`, `checkInTime`, `checkOutTime` |
| 4 | `apartment` | `sale` | `manual_contact` | fixed_total, per_m2 | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `bedrooms`, `bathrooms`, `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | `furnished` |
| 5 | `apartment` | `rent_long_term` | `manual_contact` | per_month, fixed_total, per_m2 | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `bedrooms`, `bathrooms`, `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | `furnished`, `petsAllowed`, `minimumContractDuration` |
| 6 | `apartment` | `rent_short_term` | `date_range` | per_night, per_day, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `bedrooms`, `bathrooms`, `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | `maxGuests`, `minStayNights`, `maxStayNights`, `checkInTime`, `checkOutTime` |
| 7 | `land` | `sale` | `manual_contact` | fixed_total, per_m2 | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `totalArea` | - |
| 8 | `land` | `rent_long_term` | `manual_contact` | per_month, fixed_total, per_m2 | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `totalArea` | `minimumContractDuration` |
| 9 | `land` | `rent_short_term` | `date_range` | per_day, fixed_total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `totalArea` | - |
| 10 | `commercial` | `sale` | `manual_contact` | fixed_total, per_m2 | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `bathrooms`, `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | `furnished` |
| 11 | `commercial` | `rent_long_term` | `manual_contact` | per_month, fixed_total, per_m2 | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `bathrooms`, `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | `furnished`, `petsAllowed`, `minimumContractDuration` |
| 12 | `commercial` | `rent_short_term` | `date_range` | per_day, fixed_total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `bathrooms`, `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | - |
| 13 | `office` | `sale` | `manual_contact` | fixed_total, per_m2 | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `bathrooms`, `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | `furnished` |
| 14 | `office` | `rent_long_term` | `manual_contact` | per_month, fixed_total, per_m2 | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `bathrooms`, `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | `furnished`, `petsAllowed`, `minimumContractDuration` |
| 15 | `office` | `rent_short_term` | `date_range` | per_day, fixed_total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `bathrooms`, `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | - |
| 16 | `warehouse` | `sale` | `manual_contact` | fixed_total, per_m2 | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | `furnished` |
| 17 | `warehouse` | `rent_long_term` | `manual_contact` | per_month, fixed_total, per_m2 | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | `furnished`, `petsAllowed`, `minimumContractDuration` |
| 18 | `warehouse` | `rent_short_term` | `date_range` | per_day, fixed_total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `parkingSpaces`, `totalArea`, `builtArea`, `floors`, `yearBuilt` | - |


### resourceType: service

| # | category | commercialMode | bookingType default | pricingModel permitidos | steps | features | commercialConditions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 19 | `cleaning` | `rent_short_term` | `date_range` | per_day, per_person, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `serviceDurationMinutes`, `serviceStaffCount`, `serviceAtClientLocation`, `serviceIncludesMaterials`, `serviceResponseTimeHours` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 20 | `cleaning` | `rent_hourly` | `time_slot` | per_hour, per_person, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `serviceDurationMinutes`, `serviceStaffCount`, `serviceAtClientLocation`, `serviceIncludesMaterials`, `serviceResponseTimeHours` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 21 | `dj` | `rent_short_term` | `date_range` | per_day, per_person, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `serviceDurationMinutes`, `serviceStaffCount`, `serviceAtClientLocation`, `serviceIncludesMaterials`, `serviceResponseTimeHours` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 22 | `dj` | `rent_hourly` | `time_slot` | per_hour, per_person, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `serviceDurationMinutes`, `serviceStaffCount`, `serviceAtClientLocation`, `serviceIncludesMaterials`, `serviceResponseTimeHours` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 23 | `chef` | `rent_short_term` | `date_range` | per_day, per_person, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `serviceDurationMinutes`, `serviceStaffCount`, `serviceAtClientLocation`, `serviceIncludesMaterials`, `serviceResponseTimeHours` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 24 | `chef` | `rent_hourly` | `time_slot` | per_hour, per_person, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `serviceDurationMinutes`, `serviceStaffCount`, `serviceAtClientLocation`, `serviceIncludesMaterials`, `serviceResponseTimeHours` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 25 | `photography` | `rent_short_term` | `date_range` | per_day, per_person, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `serviceDurationMinutes`, `serviceStaffCount`, `serviceAtClientLocation`, `serviceIncludesMaterials`, `serviceResponseTimeHours` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 26 | `photography` | `rent_hourly` | `time_slot` | per_hour, per_person, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `serviceDurationMinutes`, `serviceStaffCount`, `serviceAtClientLocation`, `serviceIncludesMaterials`, `serviceResponseTimeHours` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 27 | `catering` | `rent_short_term` | `date_range` | per_day, per_person, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `serviceDurationMinutes`, `serviceStaffCount`, `serviceAtClientLocation`, `serviceIncludesMaterials`, `serviceResponseTimeHours` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 28 | `catering` | `rent_hourly` | `time_slot` | per_hour, per_person, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `serviceDurationMinutes`, `serviceStaffCount`, `serviceAtClientLocation`, `serviceIncludesMaterials`, `serviceResponseTimeHours` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 29 | `maintenance` | `rent_short_term` | `date_range` | per_day, per_person, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `serviceDurationMinutes`, `serviceStaffCount`, `serviceAtClientLocation`, `serviceIncludesMaterials`, `serviceResponseTimeHours` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 30 | `maintenance` | `rent_hourly` | `time_slot` | per_hour, per_person, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `serviceDurationMinutes`, `serviceStaffCount`, `serviceAtClientLocation`, `serviceIncludesMaterials`, `serviceResponseTimeHours` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |


### resourceType: vehicle

| # | category | commercialMode | bookingType default | pricingModel permitidos | steps | features | commercialConditions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 31 | `car` | `sale` | `manual_contact` | fixed_total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 32 | `car` | `rent_long_term` | `manual_contact` | per_month, fixed_total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 33 | `car` | `rent_short_term` | `date_range` | per_day | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 34 | `suv` | `sale` | `manual_contact` | fixed_total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 35 | `suv` | `rent_long_term` | `manual_contact` | per_month, fixed_total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 36 | `suv` | `rent_short_term` | `date_range` | per_day | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 37 | `pickup` | `sale` | `manual_contact` | fixed_total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 38 | `pickup` | `rent_long_term` | `manual_contact` | per_month, fixed_total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 39 | `pickup` | `rent_short_term` | `date_range` | per_day | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 40 | `van` | `sale` | `manual_contact` | fixed_total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 41 | `van` | `rent_long_term` | `manual_contact` | per_month, fixed_total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 42 | `van` | `rent_short_term` | `date_range` | per_day | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 43 | `motorcycle` | `sale` | `manual_contact` | fixed_total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 44 | `motorcycle` | `rent_long_term` | `manual_contact` | per_month, fixed_total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 45 | `motorcycle` | `rent_short_term` | `date_range` | per_day | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 46 | `boat` | `sale` | `manual_contact` | fixed_total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 47 | `boat` | `rent_long_term` | `manual_contact` | per_month, fixed_total | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |
| 48 | `boat` | `rent_short_term` | `date_range` | per_day | `typeAndInfo`, `location`, `features`, `pricing`, `amenities`, `images`, `summary` | `vehicleModelYear`, `vehicleSeats`, `vehicleDoors`, `vehicleTransmission`, `vehicleFuelType`, `vehicleLuggageCapacity` | - |


### resourceType: experience

| # | category | commercialMode | bookingType default | pricingModel permitidos | steps | features | commercialConditions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 49 | `tour` | `rent_short_term` | `date_range` | per_person, per_day, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `experienceDurationMinutes`, `experienceMinParticipants`, `experienceMaxParticipants`, `experienceDifficulty`, `experienceIncludesEquipment`, `experienceMinAge` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 50 | `tour` | `rent_hourly` | `time_slot` | per_hour, per_person, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `experienceDurationMinutes`, `experienceMinParticipants`, `experienceMaxParticipants`, `experienceDifficulty`, `experienceIncludesEquipment`, `experienceMinAge` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 51 | `class` | `rent_short_term` | `date_range` | per_person, per_day, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `experienceDurationMinutes`, `experienceMinParticipants`, `experienceMaxParticipants`, `experienceDifficulty`, `experienceIncludesEquipment`, `experienceMinAge` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 52 | `class` | `rent_hourly` | `time_slot` | per_hour, per_person, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `experienceDurationMinutes`, `experienceMinParticipants`, `experienceMaxParticipants`, `experienceDifficulty`, `experienceIncludesEquipment`, `experienceMinAge` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 53 | `workshop` | `rent_short_term` | `date_range` | per_person, per_day, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `experienceDurationMinutes`, `experienceMinParticipants`, `experienceMaxParticipants`, `experienceDifficulty`, `experienceIncludesEquipment`, `experienceMinAge` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 54 | `workshop` | `rent_hourly` | `time_slot` | per_hour, per_person, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `experienceDurationMinutes`, `experienceMinParticipants`, `experienceMaxParticipants`, `experienceDifficulty`, `experienceIncludesEquipment`, `experienceMinAge` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 55 | `adventure` | `rent_short_term` | `date_range` | per_person, per_day, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `experienceDurationMinutes`, `experienceMinParticipants`, `experienceMaxParticipants`, `experienceDifficulty`, `experienceIncludesEquipment`, `experienceMinAge` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 56 | `adventure` | `rent_hourly` | `time_slot` | per_hour, per_person, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `experienceDurationMinutes`, `experienceMinParticipants`, `experienceMaxParticipants`, `experienceDifficulty`, `experienceIncludesEquipment`, `experienceMinAge` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 57 | `wellness` | `rent_short_term` | `date_range` | per_person, per_day, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `experienceDurationMinutes`, `experienceMinParticipants`, `experienceMaxParticipants`, `experienceDifficulty`, `experienceIncludesEquipment`, `experienceMinAge` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 58 | `wellness` | `rent_hourly` | `time_slot` | per_hour, per_person, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `experienceDurationMinutes`, `experienceMinParticipants`, `experienceMaxParticipants`, `experienceDifficulty`, `experienceIncludesEquipment`, `experienceMinAge` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 59 | `gastronomy` | `rent_short_term` | `date_range` | per_person, per_day, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `experienceDurationMinutes`, `experienceMinParticipants`, `experienceMaxParticipants`, `experienceDifficulty`, `experienceIncludesEquipment`, `experienceMinAge` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 60 | `gastronomy` | `rent_hourly` | `time_slot` | per_hour, per_person, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `experienceDurationMinutes`, `experienceMinParticipants`, `experienceMaxParticipants`, `experienceDifficulty`, `experienceIncludesEquipment`, `experienceMinAge` | `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |


### resourceType: venue

| # | category | commercialMode | bookingType default | pricingModel permitidos | steps | features | commercialConditions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 61 | `event_hall` | `rent_short_term` | `date_range` | per_day, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `venueCapacitySeated`, `venueCapacityStanding`, `totalArea`, `venueHasStage`, `venueOpeningTime`, `venueClosingTime` | `maxGuests`, `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 62 | `event_hall` | `rent_hourly` | `time_slot` | per_hour, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `venueCapacitySeated`, `venueCapacityStanding`, `totalArea`, `venueHasStage`, `venueOpeningTime`, `venueClosingTime` | `maxGuests`, `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 63 | `commercial_local` | `rent_short_term` | `date_range` | per_day, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `venueCapacitySeated`, `venueCapacityStanding`, `totalArea`, `venueHasStage`, `venueOpeningTime`, `venueClosingTime` | `maxGuests`, `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 64 | `commercial_local` | `rent_hourly` | `time_slot` | per_hour, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `venueCapacitySeated`, `venueCapacityStanding`, `totalArea`, `venueHasStage`, `venueOpeningTime`, `venueClosingTime` | `maxGuests`, `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 65 | `studio` | `rent_short_term` | `date_range` | per_day, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `venueCapacitySeated`, `venueCapacityStanding`, `totalArea`, `venueHasStage`, `venueOpeningTime`, `venueClosingTime` | `maxGuests`, `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 66 | `studio` | `rent_hourly` | `time_slot` | per_hour, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `venueCapacitySeated`, `venueCapacityStanding`, `totalArea`, `venueHasStage`, `venueOpeningTime`, `venueClosingTime` | `maxGuests`, `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 67 | `coworking` | `rent_short_term` | `date_range` | per_day, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `venueCapacitySeated`, `venueCapacityStanding`, `totalArea`, `venueHasStage`, `venueOpeningTime`, `venueClosingTime` | `maxGuests`, `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 68 | `coworking` | `rent_hourly` | `time_slot` | per_hour, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `venueCapacitySeated`, `venueCapacityStanding`, `totalArea`, `venueHasStage`, `venueOpeningTime`, `venueClosingTime` | `maxGuests`, `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 69 | `meeting_room` | `rent_short_term` | `date_range` | per_day, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `venueCapacitySeated`, `venueCapacityStanding`, `totalArea`, `venueHasStage`, `venueOpeningTime`, `venueClosingTime` | `maxGuests`, `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |
| 70 | `meeting_room` | `rent_hourly` | `time_slot` | per_hour, per_event, fixed_total | `typeAndInfo`, `location`, `features`, `commercialConditions`, `pricing`, `amenities`, `images`, `summary` | `venueCapacitySeated`, `venueCapacityStanding`, `totalArea`, `venueHasStage`, `venueOpeningTime`, `venueClosingTime` | `maxGuests`, `bookingMinUnits`, `bookingMaxUnits`, `availabilityStartTime`, `availabilityEndTime` |


---

## 3. Reglas dinamicas activas

- Orden fijo en paso 1: `resourceType` -> `category` -> `commercialMode`.
- `category` se filtra por `resourceType`.
- `commercialMode` se filtra por `resourceType + category`.
- `pricingModel` se filtra por `resourceType + category + commercialMode`.
- Si cambia el contexto, se sanitizan y resetean `commercialMode`, `pricingModel`, `bookingType` y campos dinamicos fuera de perfil.
- Validacion por paso: solo campos activos. Guardado final: perfil activo completo.
- `venue` (`event_hall`, `commercial_local`, `studio`, `coworking`, `meeting_room`) concentra los flujos por hora/evento.
