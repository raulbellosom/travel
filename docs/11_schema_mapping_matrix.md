# 11_SCHEMA_MAPPING_MATRIX.md - Codigo vs Schema Canonico

## Proposito

Matriz de trazabilidad para validar que el codigo use los nombres y enums definidos
en `03_appwrite_db_schema.md`.

Regla:

- Si hay conflicto, el schema canonico manda.

---

## Matriz de mapeo

| Modulo | Antes (legacy/no canonico) | Canonico (docs/03) | Estado | Referencia de implementacion |
| ------ | -------------------------- | ------------------ | ------ | ---------------------------- |
| Propiedades (frontend/services) | `userId` | `ownerUserId` | Migrado | `src/services/propertiesService.js` |
| Propiedades (frontend/pages) | `property.userId` | `property.ownerUserId` | Migrado | `src/pages/PropertyDetail.jsx`, `src/pages/EditProperty.jsx` |
| Imagenes de propiedad | `order` | `sortOrder` | Migrado | `src/services/propertiesService.js` |
| Listados temporales | `createdAt` custom | `$createdAt` / `$updatedAt` | Migrado | `src/services/propertiesService.js`, `src/services/reservationsService.js`, `src/services/reviewsService.js` |
| Lead publico (function) | `property.userId` | `property.ownerUserId` | Migrado | `functions/create-lead-public/src/index.js` |
| Perfil inicial de usuario | rol legacy no permitido | `owner` / `client` segun flujo | Migrado | `functions/user-create-profile/src/index.js` |
| Sync perfil (function) | escritura de campos no declarados | solo campos `users` declarados | Migrado | `functions/sync-user-profile/src/index.js` |
| Email verification (function) | dependencia en campos fuera de schema `users` | solo campos declarados + coleccion `email_verifications` | Migrado | `functions/email-verification/src/index.js` |
| Staff management (function) | solo alta parcial | alta/listado/update/enable sobre `users` canonico | Migrado | `functions/staff-user-management/src/index.js` |
| Root audit query | sin rango por fecha | filtros por `$createdAt` con `fromDate/toDate` | Migrado | `functions/activity-log-query/src/index.js`, `src/services/activityLogsService.js` |

---

## Enums canonicos aplicados

- `users.role`: `root`, `owner`, `staff_manager`, `staff_editor`, `staff_support`, `client`.
- `properties.propertyType`: `house`, `apartment`, `land`, `commercial`, `office`, `warehouse`.
- `properties.operationType`: `sale`, `rent`, `vacation_rental`.
- `properties.status`: `draft`, `published`, `inactive`, `archived`.
- `properties.currency`: `MXN`, `USD`, `EUR`.
- `reservations.status`: `pending`, `confirmed`, `cancelled`, `completed`, `expired`.
- `reservations.paymentStatus`: `unpaid`, `pending`, `paid`, `failed`, `refunded`.
- `reservations.paymentProvider`: `stripe`, `mercadopago`, `manual`.
- `reservation_payments.provider`: `stripe`, `mercadopago`.
- `reservation_payments.status`: `pending`, `approved`, `rejected`, `refunded`.
- `reviews.status`: `pending`, `published`, `rejected`.
- `activity_logs.severity`: `info`, `warning`, `critical`.

---

## Notas

- Esta matriz se debe actualizar cada vez que se introduzca una mutacion de datos.
- El objetivo es evitar regresiones de naming entre frontend, functions y Appwrite.

---

Ultima actualizacion: 2026-02-12
Version: 1.0.0
