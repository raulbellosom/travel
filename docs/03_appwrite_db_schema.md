# 03_APPWRITE_DB_SCHEMA.md – REAL ESTATE SAAS PLATFORM

## Referencia

Este documento se rige estrictamente por:

- 00_ai_project_context.md
- 00_project_brief.md
- 01_frontend_requirements.md
- 02_backend_appwrite_requirements.md

---

## Propósito de este Documento

Este archivo es la **fuente de verdad para el schema del backend**.
Los agentes AI **DEBEN** mantenerlo sincronizado con la consola de Appwrite.

---

## Cómo Actualizar este Mirror

Cuando cambies el schema del backend:

1. Actualizar este archivo primero (o en el mismo commit)
2. Aplicar los cambios correspondientes en la consola de Appwrite (o via SDK/CLI)
3. Asegurar que existan índices para cada patrón de query usado por frontend/functions

---

## Formato de Índices

Todos los índices deben documentarse usando el siguiente formato:

| Index Name             | Type     | Attributes  | Notes                  |
| ---------------------- | -------- | ----------- | ---------------------- |
| idx_collection_attr    | key      | attribute ↑ | descripción del índice |
| uq_collection_attr     | unique   | attribute ↑ | unicidad               |
| full_collection_attr   | fulltext | attribute   | búsqueda texto         |
| spatial_collection_loc | spatial  | location    | geoespacial            |

**Reglas**:

- **Index Name**: Máximo 60 caracteres
  - Formato: `<tipo>_<collection>_<campos>`
  - Tipo prefix: `idx_` para key, `uq_` para unique, `full_` para fulltext, `spatial_` para spatial
- **Type**: `key`, `unique`, `fulltext`, o `spatial`
- **Attributes**: Cada campo con flecha de dirección
  - ↑ = ASC (ascendente)
  - ↓ = DESC (descendente)
  - Múltiples campos separados por coma: `field1 ↑, field2 ↓`
  - Para fulltext y spatial: no usar flechas

---

## Instancia Appwrite

- **Endpoint**: https://appwrite.racoondevs.com
- **Project ID**: (definir al crear proyecto)
- **Appwrite Version**: >= 1.5.x
- **Database Engine**: PostgreSQL
- **Notes**: Instancia self-hosted de RacoonDevs

---

## Database

- **Database ID**: `main`
- **Database Name**: Real Estate SaaS Database

---

## Storage Buckets

| Bucket ID       | Purpose                     | Max Size | Extensions        | Public | Notes                                  |
| --------------- | --------------------------- | -------- | ----------------- | ------ | -------------------------------------- |
| property-images | Imágenes de propiedades     | 10 MB    | jpg,jpeg,png,webp | Yes    | Lectura pública, escritura autenticada |
| avatars         | Avatares de usuarios        | 5 MB     | jpg,jpeg,png,webp | No     | Solo lectura para autenticados         |
| documents       | Documentos legales (futuro) | 20 MB    | pdf,doc,docx      | No     | Privado                                |

---

## Collections - Resumen

| Collection ID        | Purpose                        | Phase |
| -------------------- | ------------------------------ | ----- |
| users                | Perfiles de usuario extendidos | 0     |
| user_preferences     | Preferencias UX                | 0     |
| properties           | Propiedades/inmuebles          | 0     |
| property_images      | Imágenes de propiedades        | 0     |
| amenities            | Catálogo de amenidades         | 0     |
| property_amenities   | Relación propiedad-amenidades  | 0     |
| leads                | Contactos/leads                | 0     |
| organizations        | Organizaciones multi-tenant    | 1     |
| organization_members | Miembros de organización       | 1     |
| favorites            | Propiedades favoritas (futuro) | 2     |
| audits               | Auditoría de acciones          | 2     |

---

## Collection: users

**Purpose**: Perfiles de usuario extendidos (mirror de Auth + datos adicionales)

**Document ID**: Preferido que coincida con Auth userId

### Attributes

| Attribute           | Type     | Size | Required | Default | Constraint  | Notes                                  |
| ------------------- | -------- | ---- | -------- | ------- | ----------- | -------------------------------------- |
| authId              | string   | 64   | yes      | -       | -           | FK a Appwrite Auth userId              |
| email               | email    | 254  | yes      | -       | -           | Debe coincidir con Auth email          |
| emailVerified       | boolean  | -    | no       | false   | -           | Sincronizar con Auth                   |
| firstName           | string   | 80   | yes      | -       | -           | Nombre(s)                              |
| lastName            | string   | 80   | yes      | -       | -           | Apellido(s)                            |
| phone               | string   | 20   | no       | -       | -           | Teléfono con formato internacional     |
| phoneVerified       | boolean  | -    | no       | false   | -           | Verificación de teléfono               |
| avatarFileId        | string   | 64   | no       | -       | -           | FK a bucket avatars                    |
| role                | enum     | -    | no       | agent   | admin,agent | Rol en la aplicación                   |
| companyName         | string   | 120  | no       | -       | -           | Nombre de empresa (agente individual)  |
| bio                 | string   | 500  | no       | -       | -           | Biografía corta                        |
| whatsappNumber      | string   | 20   | no       | -       | -           | WhatsApp (puede ser diferente a phone) |
| websiteUrl          | URL      | -    | no       | -       | -           | Website personal/empresa               |
| facebookUrl         | URL      | -    | no       | -       | -           | Facebook profile                       |
| instagramUrl        | URL      | -    | no       | -       | -           | Instagram profile                      |
| enabled             | boolean  | -    | no       | true    | -           | Soft delete                            |
| onboardingCompleted | boolean  | -    | no       | false   | -           | Si completó onboarding                 |
| createdAt           | datetime | -    | yes      | now     | -           | Auto                                   |
| updatedAt           | datetime | -    | yes      | now     | -           | Auto                                   |

### Indexes

| Index Name          | Type   | Attributes  | Notes             |
| ------------------- | ------ | ----------- | ----------------- |
| uq_users_authid     | unique | authId ↑    | Unicidad con Auth |
| uq_users_email      | unique | email ↑     | Unicidad de email |
| idx_users_role      | key    | role ↑      | Filtrar por rol   |
| idx_users_enabled   | key    | enabled ↑   | Filtrar activos   |
| idx_users_createdat | key    | createdAt ↓ | Ordenar por fecha |

### Permissions (Fase 0)

- Read: `Role.user({userId})` - Solo su propio perfil
- Create: System only (vía función al registrarse)
- Update: `Role.user({userId})` - Solo su propio perfil
- Delete: `Role.user({userId})` - Solo su propio perfil (soft delete)

---

## Collection: user_preferences

**Purpose**: Preferencias de UX por usuario (tema, idioma, configuración)

### Attributes

| Attribute          | Type     | Size | Required | Default | Constraint        | Notes                              |
| ------------------ | -------- | ---- | -------- | ------- | ----------------- | ---------------------------------- |
| userId             | string   | 64   | yes      | -       | -                 | FK a users.$id                     |
| theme              | enum     | -    | no       | system  | light,dark,system | Tema visual                        |
| locale             | enum     | -    | no       | es      | es,en             | Idioma preferido                   |
| currency           | enum     | -    | no       | MXN     | USD,MXN,EUR       | Moneda para mostrar precios        |
| measurementSystem  | enum     | -    | no       | metric  | metric,imperial   | m² vs sq ft                        |
| brandColor         | string   | 7    | no       | #0F172A | -                 | Color primario (hex)               |
| brandLogo          | string   | 64   | no       | -       | -                 | FK a bucket avatars (logo empresa) |
| notificationsEmail | boolean  | -    | no       | true    | -                 | Recibir notificaciones por email   |
| notificationsSms   | boolean  | -    | no       | false   | -                 | Recibir notificaciones por SMS     |
| customDomain       | string   | 120  | no       | -       | -                 | Dominio personalizado (futuro)     |
| seoTitle           | string   | 160  | no       | -       | -                 | Título SEO personalizado           |
| seoDescription     | string   | 320  | no       | -       | -                 | Descripción SEO                    |
| enabled            | boolean  | -    | no       | true    | -                 | -                                  |
| createdAt          | datetime | -    | yes      | now     | -                 | Auto                               |
| updatedAt          | datetime | -    | yes      | now     | -                 | Auto                               |

### Indexes

| Index Name            | Type   | Attributes | Notes                       |
| --------------------- | ------ | ---------- | --------------------------- |
| uq_userprefs_userid   | unique | userId ↑   | Una preferencia por usuario |
| idx_userprefs_enabled | key    | enabled ↑  | Filtrar activos             |

### Permissions

- Read: `Role.user({userId})` via userId
- Create: `Role.user({userId})` via userId
- Update: `Role.user({userId})` via userId
- Delete: `Role.user({userId})` via userId

---

## Collection: properties

**Purpose**: Propiedades/inmuebles publicados por agentes

### Attributes

| Attribute       | Type     | Size | Required | Default | Constraint                                                                       | Notes                                       |
| --------------- | -------- | ---- | -------- | ------- | -------------------------------------------------------------------------------- | ------------------------------------------- |
| userId          | string   | 64   | yes      | -       | -                                                                                | FK a users.$id (propietario)                |
| slug            | string   | 150  | yes      | -       | -                                                                                | URL-friendly unique identifier              |
| title           | string   | 200  | yes      | -       | -                                                                                | Título de la propiedad                      |
| description     | string   | 5000 | yes      | -       | -                                                                                | Descripción detallada                       |
| propertyType    | enum     | -    | yes      | -       | house,apartment,land,commercial,office,warehouse,event_hall,condo,villa,building | Tipo de inmueble                            |
| operationType   | enum     | -    | yes      | -       | sale,rent,vacation_rental,transfer                                               | Tipo de operación                           |
| price           | double   | -    | yes      | -       | -                                                                                | Precio en moneda base                       |
| currency        | enum     | -    | no       | MXN     | USD,MXN,EUR                                                                      | Moneda del precio                           |
| pricePer        | enum     | -    | no       | total   | total,sqm,sqft                                                                   | Precio total o por unidad                   |
| priceNegotiable | boolean  | -    | no       | false   | -                                                                                | Si el precio es negociable                  |
| totalArea       | double   | -    | no       | -       | -                                                                                | Superficie total (m²)                       |
| builtArea       | double   | -    | no       | -       | -                                                                                | Superficie construida (m²)                  |
| bedrooms        | integer  | -    | no       | 0       | -                                                                                | Número de recámaras                         |
| bathrooms       | double   | -    | no       | 0       | -                                                                                | Número de baños (0.5 = medio baño)          |
| parkingSpaces   | integer  | -    | no       | 0       | -                                                                                | Número de estacionamientos                  |
| floors          | integer  | -    | no       | -       | -                                                                                | Número de pisos (edificio/casa)             |
| yearBuilt       | integer  | -    | no       | -       | -                                                                                | Año de construcción                         |
| streetAddress   | string   | 200  | no       | -       | -                                                                                | Calle y número                              |
| neighborhood    | string   | 100  | no       | -       | -                                                                                | Colonia/barrio                              |
| city            | string   | 100  | yes      | -       | -                                                                                | Ciudad                                      |
| state           | string   | 100  | yes      | -       | -                                                                                | Estado/provincia                            |
| country         | string   | 2    | yes      | MX      | -                                                                                | Código país ISO (MX, US, etc)               |
| postalCode      | string   | 10   | no       | -       | -                                                                                | Código postal                               |
| latitude        | double   | -    | no       | -       | -                                                                                | Coordenada GPS                              |
| longitude       | double   | -    | no       | -       | -                                                                                | Coordenada GPS                              |
| locationGeoJSON | string   | 500  | no       | -       | -                                                                                | GeoJSON Point para búsquedas espaciales     |
| mainImageId     | string   | 64   | no       | -       | -                                                                                | FK a property_images.$id (imagen principal) |
| videoUrl        | URL      | -    | no       | -       | -                                                                                | URL de video (YouTube, Vimeo)               |
| virtualTourUrl  | URL      | -    | no       | -       | -                                                                                | URL de tour virtual 360°                    |
| status          | enum     | -    | no       | draft   | draft,published,sold,rented,inactive                                             | Estado de la propiedad                      |
| featured        | boolean  | -    | no       | false   | -                                                                                | Si es propiedad destacada                   |
| views           | integer  | -    | no       | 0       | -                                                                                | Contador de vistas                          |
| contactCount    | integer  | -    | no       | 0       | -                                                                                | Contador de contactos recibidos             |
| publishedAt     | datetime | -    | no       | -       | -                                                                                | Fecha de publicación                        |
| soldAt          | datetime | -    | no       | -       | -                                                                                | Fecha de venta/renta                        |
| enabled         | boolean  | -    | no       | true    | -                                                                                | Soft delete                                 |
| createdAt       | datetime | -    | yes      | now     | -                                                                                | Auto                                        |
| updatedAt       | datetime | -    | yes      | now     | -                                                                                | Auto                                        |

### Indexes

| Index Name                   | Type     | Attributes        | Notes                         |
| ---------------------------- | -------- | ----------------- | ----------------------------- |
| uq_properties_slug           | unique   | slug ↑            | Slug único para URLs          |
| idx_properties_userid        | key      | userId ↑          | Propiedades por usuario       |
| idx_properties_status        | key      | status ↑          | Filtrar por estado            |
| idx_properties_propertytype  | key      | propertyType ↑    | Filtrar por tipo              |
| idx_properties_operationtype | key      | operationType ↑   | Filtrar por operación         |
| idx_properties_price         | key      | price ↑           | Ordenar por precio            |
| idx_properties_city          | key      | city ↑            | Filtrar por ciudad            |
| idx_properties_state         | key      | state ↑           | Filtrar por estado            |
| idx_properties_bedrooms      | key      | bedrooms ↑        | Filtrar por recámaras         |
| idx_properties_bathrooms     | key      | bathrooms ↑       | Filtrar por baños             |
| idx_properties_createdat     | key      | createdAt ↓       | Ordenar por fecha             |
| idx_properties_publishedat   | key      | publishedAt ↓     | Propiedades recientes         |
| idx_properties_featured      | key      | featured ↓        | Destacadas primero            |
| full_properties_search       | fulltext | title,description | Búsqueda texto completo       |
| spatial_properties_location  | spatial  | locationGeoJSON   | Búsqueda geoespacial (futuro) |

### Permissions

- Read:
  - `Role.any()` si `status=published` AND `enabled=true`
  - `Role.user({userId})` (propietario) siempre
- Create: `Role.users()` (cualquier autenticado)
- Update: `Role.user({userId})` (propietario)
- Delete: `Role.user({userId})` (propietario, soft delete)

---

## Collection: property_images

**Purpose**: Imágenes asociadas a propiedades

### Attributes

| Attribute   | Type     | Size | Required | Default | Constraint | Notes                           |
| ----------- | -------- | ---- | -------- | ------- | ---------- | ------------------------------- |
| propertyId  | string   | 64   | yes      | -       | -          | FK a properties.$id             |
| fileId      | string   | 64   | yes      | -       | -          | FK a bucket property-images     |
| title       | string   | 200  | no       | -       | -          | Título descriptivo de la imagen |
| description | string   | 500  | no       | -       | -          | Descripción (alt text)          |
| order       | integer  | -    | no       | 0       | -          | Orden de presentación           |
| isMain      | boolean  | -    | no       | false   | -          | Si es imagen principal          |
| width       | integer  | -    | no       | -       | -          | Ancho en px (metadata)          |
| height      | integer  | -    | no       | -       | -          | Alto en px (metadata)           |
| fileSize    | integer  | -    | no       | -       | -          | Tamaño en bytes                 |
| mimeType    | string   | 50   | no       | -       | -          | Tipo MIME                       |
| enabled     | boolean  | -    | no       | true    | -          | Soft delete                     |
| createdAt   | datetime | -    | yes      | now     | -          | Auto                            |
| updatedAt   | datetime | -    | yes      | now     | -          | Auto                            |

### Indexes

| Index Name                | Type | Attributes             | Notes                    |
| ------------------------- | ---- | ---------------------- | ------------------------ |
| idx_propimages_propertyid | key  | propertyId ↑           | Imágenes por propiedad   |
| idx_propimages_order      | key  | propertyId ↑, order ↑  | Ordenar imágenes         |
| idx_propimages_ismain     | key  | propertyId ↑, isMain ↓ | Obtener imagen principal |

### Permissions

- Read: `Role.any()` (en contexto de propiedad pública)
- Create: `Role.user({userId})` via propertyId->userId
- Update: `Role.user({userId})` via propertyId->userId
- Delete: `Role.user({userId})` via propertyId->userId

---

## Collection: amenities

**Purpose**: Catálogo global de amenidades disponibles

### Attributes

| Attribute | Type     | Size | Required | Default | Constraint                                                                  | Notes                  |
| --------- | -------- | ---- | -------- | ------- | --------------------------------------------------------------------------- | ---------------------- |
| name_es   | string   | 100  | yes      | -       | -                                                                           | Nombre en español      |
| name_en   | string   | 100  | yes      | -       | -                                                                           | Nombre en inglés       |
| slug      | string   | 100  | yes      | -       | -                                                                           | Identificador único    |
| iconName  | string   | 50   | no       | -       | -                                                                           | Nombre de ícono Lucide |
| category  | enum     | -    | no       | general | general,security,services,outdoor,views,kitchen,bathroom,climate,technology | Categoría              |
| enabled   | boolean  | -    | no       | true    | -                                                                           | Soft delete            |
| createdAt | datetime | -    | yes      | now     | -                                                                           | Auto                   |
| updatedAt | datetime | -    | yes      | now     | -                                                                           | Auto                   |

### Ejemplos de Amenidades

**General**: Amueblado, Cocina equipada, Clóset, Cuarto de servicio, Bodega
**Seguridad**: Vigilancia 24/7, Caseta de vigilancia, Circuito cerrado, Alarma
**Servicios**: Gas natural, Internet, Cable, Agua caliente, Cisterna, Tinacos
**Outdoor**: Jardín, Patio, Terraza, Roof garden, Alberca, Asador
**Vistas**: Vista al mar, Vista a la montaña, Vista a la ciudad, Vista al parque
**Cocina**: Barra desayunadora, Despensa, Alacena
**Baño**: Jacuzzi, Tina, Regadera, Tocador
**Clima**: Aire acondicionado, Calefacción, Ventiladores
**Tecnología**: Domótica, Paneles solares, Sistema de audio

### Indexes

| Index Name             | Type   | Attributes | Notes                 |
| ---------------------- | ------ | ---------- | --------------------- |
| uq_amenities_slug      | unique | slug ↑     | Slug único            |
| idx_amenities_category | key    | category ↑ | Filtrar por categoría |
| idx_amenities_enabled  | key    | enabled ↑  | Solo activas          |

### Permissions

- Read: `Role.any()` si enabled=true
- Create/Update/Delete: Admin only (via funciones)

---

## Collection: property_amenities

**Purpose**: Relación muchos-a-muchos entre properties y amenities

### Attributes

| Attribute  | Type     | Size | Required | Default | Constraint | Notes               |
| ---------- | -------- | ---- | -------- | ------- | ---------- | ------------------- |
| propertyId | string   | 64   | yes      | -       | -          | FK a properties.$id |
| amenityId  | string   | 64   | yes      | -       | -          | FK a amenities.$id  |
| createdAt  | datetime | -    | yes      | now     | -          | Auto                |

### Indexes

| Index Name              | Type   | Attributes                | Notes                       |
| ----------------------- | ------ | ------------------------- | --------------------------- |
| idx_propamen_propertyid | key    | propertyId ↑              | Amenidades de una propiedad |
| idx_propamen_amenityid  | key    | amenityId ↑               | Propiedades con amenidad    |
| uq_propamen_combo       | unique | propertyId ↑, amenityId ↑ | Evitar duplicados           |

### Permissions

- Read: `Role.any()` (en contexto de propiedad pública)
- Create/Delete: `Role.user({userId})` via propertyId->userId

---

## Collection: leads

**Purpose**: Contactos/leads recibidos de formularios

### Attributes

| Attribute       | Type     | Size | Required | Default  | Constraint                                       | Notes                                   |
| --------------- | -------- | ---- | -------- | -------- | ------------------------------------------------ | --------------------------------------- |
| propertyId      | string   | 64   | yes      | -        | -                                                | FK a properties.$id                     |
| propertyOwnerId | string   | 64   | yes      | -        | -                                                | FK a users.$id (duplicar para permisos) |
| name            | string   | 120  | yes      | -        | -                                                | Nombre del contacto                     |
| email           | email    | 254  | yes      | -        | -                                                | Email del contacto                      |
| phone           | string   | 20   | no       | -        | -                                                | Teléfono del contacto                   |
| message         | string   | 2000 | yes      | -        | -                                                | Mensaje del contacto                    |
| source          | enum     | -    | no       | web_form | web_form,whatsapp,phone,email,other              | Fuente del lead                         |
| status          | enum     | -    | no       | new      | new,contacted,in_progress,closed_won,closed_lost | Estado del lead                         |
| rating          | integer  | -    | no       | -        | 1-5                                              | Calificación del lead (importancia)     |
| notes           | string   | 2000 | no       | -        | -                                                | Notas internas del agente               |
| followUpDate    | datetime | -    | no       | -        | -                                                | Fecha de seguimiento                    |
| closedAt        | datetime | -    | no       | -        | -                                                | Fecha de cierre                         |
| enabled         | boolean  | -    | no       | true     | -                                                | Soft delete                             |
| createdAt       | datetime | -    | yes      | now      | -                                                | Auto                                    |
| updatedAt       | datetime | -    | yes      | now      | -                                                | Auto                                    |

### Indexes

| Index Name             | Type | Attributes        | Notes                   |
| ---------------------- | ---- | ----------------- | ----------------------- |
| idx_leads_propertyid   | key  | propertyId ↑      | Leads de una propiedad  |
| idx_leads_ownerid      | key  | propertyOwnerId ↑ | Leads de un usuario     |
| idx_leads_status       | key  | status ↑          | Filtrar por estado      |
| idx_leads_createdat    | key  | createdAt ↓       | Leads recientes primero |
| idx_leads_followupdate | key  | followUpDate ↑    | Próximos seguimientos   |

### Permissions

- Read: `Role.user({propertyOwnerId})` (solo el dueño de la propiedad)
- Create: `Role.any()` (formulario público)
- Update: `Role.user({propertyOwnerId})` (solo el dueño)
- Delete: `Role.user({propertyOwnerId})` (soft delete)

---

## Collection: organizations (Fase 1 - Multi-Tenant)

**Purpose**: Organizaciones/agencias para multi-tenant

### Attributes

| Attribute          | Type     | Size | Required | Default | Constraint                 | Notes                                  |
| ------------------ | -------- | ---- | -------- | ------- | -------------------------- | -------------------------------------- |
| name               | string   | 150  | yes      | -       | -                          | Nombre de la organización              |
| slug               | string   | 100  | yes      | -       | -                          | Slug único (para subdomain)            |
| logoFileId         | string   | 64   | no       | -       | -                          | FK a bucket avatars                    |
| description        | string   | 1000 | no       | -       | -                          | Descripción de la empresa              |
| website            | URL      | -    | no       | -       | -                          | Website corporativo                    |
| email              | email    | 254  | no       | -       | -                          | Email de contacto                      |
| phone              | string   | 20   | no       | -       | -                          | Teléfono corporativo                   |
| address            | string   | 300  | no       | -       | -                          | Dirección física                       |
| city               | string   | 100  | no       | -       | -                          | Ciudad                                 |
| state              | string   | 100  | no       | -       | -                          | Estado                                 |
| country            | string   | 2    | no       | MX      | -                          | País                                   |
| ownerId            | string   | 64   | yes      | -       | -                          | FK a users.$id (dueño/admin principal) |
| plan               | enum     | -    | no       | solo    | solo,team,enterprise       | Plan de suscripción                    |
| maxUsers           | integer  | -    | no       | 1       | -                          | Máximo de usuarios permitidos          |
| maxProperties      | integer  | -    | no       | 9999    | -                          | Máximo de propiedades (-1 = ilimitado) |
| customDomain       | string   | 120  | no       | -       | -                          | Dominio personalizado                  |
| brandColor         | string   | 7    | no       | #0F172A | -                          | Color primario                         |
| status             | enum     | -    | no       | active  | active,suspended,cancelled | Estado de la organización              |
| trialEndsAt        | datetime | -    | no       | -       | -                          | Fin del período de prueba              |
| subscriptionEndsAt | datetime | -    | no       | -       | -                          | Fin de suscripción                     |
| enabled            | boolean  | -    | no       | true    | -                          | Soft delete                            |
| createdAt          | datetime | -    | yes      | now     | -                          | Auto                                   |
| updatedAt          | datetime | -    | yes      | now     | -                          | Auto                                   |

### Indexes

| Index Name       | Type   | Attributes | Notes                        |
| ---------------- | ------ | ---------- | ---------------------------- |
| uq_orgs_slug     | unique | slug ↑     | Slug único                   |
| idx_orgs_ownerid | key    | ownerId ↑  | Organizaciones de un usuario |
| idx_orgs_status  | key    | status ↑   | Filtrar por estado           |
| idx_orgs_plan    | key    | plan ↑     | Filtrar por plan             |

### Permissions

- Read: `Role.user({ownerId})` O miembro del team
- Create: `Role.users()` (cualquier autenticado)
- Update: `Role.user({ownerId})` (solo owner)
- Delete: `Role.user({ownerId})` (soft delete)

---

## Collection: organization_members (Fase 1 - Multi-Tenant)

**Purpose**: Miembros de organizaciones con roles

### Attributes

| Attribute      | Type     | Size | Required | Default | Constraint         | Notes                              |
| -------------- | -------- | ---- | -------- | ------- | ------------------ | ---------------------------------- |
| organizationId | string   | 64   | yes      | -       | -                  | FK a organizations.$id             |
| userId         | string   | 64   | yes      | -       | -                  | FK a users.$id                     |
| role           | enum     | -    | no       | member  | owner,admin,member | Rol en la organización             |
| permissions    | string   | 1000 | no       | "[]"    | -                  | JSON array de permisos específicos |
| invitedBy      | string   | 64   | no       | -       | -                  | FK a users.$id (quien invitó)      |
| joinedAt       | datetime | -    | yes      | now     | -                  | Fecha de ingreso                   |
| enabled        | boolean  | -    | no       | true    | -                  | Soft delete (salida del usuario)   |
| createdAt      | datetime | -    | yes      | now     | -                  | Auto                               |
| updatedAt      | datetime | -    | yes      | now     | -                  | Auto                               |

### Indexes

| Index Name            | Type   | Attributes                 | Notes               |
| --------------------- | ------ | -------------------------- | ------------------- |
| idx_orgmembers_orgid  | key    | organizationId ↑           | Miembros de una org |
| idx_orgmembers_userid | key    | userId ↑                   | Orgs de un usuario  |
| uq_orgmembers_combo   | unique | organizationId ↑, userId ↑ | Evitar duplicados   |
| idx_orgmembers_role   | key    | role ↑                     | Filtrar por rol     |

### Permissions

- Read: `Role.team({organizationId})`
- Create: `Role.user({organizationId.ownerId})` O admin
- Update: `Role.user({organizationId.ownerId})` O admin
- Delete: `Role.user({organizationId.ownerId})` O admin O mismo usuario

---

## Relationships Summary

```
users (1) ←→ (N) properties (userId)
users (1) ←→ (1) user_preferences (userId)
properties (1) ←→ (N) property_images (propertyId)
properties (1) ←→ (N) property_amenities (propertyId)
amenities (1) ←→ (N) property_amenities (amenityId)
properties (1) ←→ (N) leads (propertyId)
users (1) ←→ (N) leads (propertyOwnerId)

# Fase 1
organizations (1) ←→ (N) organization_members (organizationId)
users (1) ←→ (N) organization_members (userId)
organizations (1) ←→ (N) properties (organizationId) [futuro]
```

---

## Data Seeding (Inicial)

### Amenidades Base (es/en)

Al inicializar la base de datos, insertar amenidades comunes:

```javascript
const amenitiesBase = [
  {
    slug: "furnished",
    name_es: "Amueblado",
    name_en: "Furnished",
    category: "general",
  },
  {
    slug: "equipped-kitchen",
    name_es: "Cocina equipada",
    name_en: "Equipped kitchen",
    category: "kitchen",
  },
  {
    slug: "closets",
    name_es: "Clósets",
    name_en: "Closets",
    category: "general",
  },
  {
    slug: "24-7-security",
    name_es: "Vigilancia 24/7",
    name_en: "24/7 Security",
    category: "security",
  },
  { slug: "pool", name_es: "Alberca", name_en: "Pool", category: "outdoor" },
  { slug: "garden", name_es: "Jardín", name_en: "Garden", category: "outdoor" },
  {
    slug: "terrace",
    name_es: "Terraza",
    name_en: "Terrace",
    category: "outdoor",
  },
  {
    slug: "parking",
    name_es: "Estacionamiento",
    name_en: "Parking",
    category: "general",
  },
  {
    slug: "elevator",
    name_es: "Elevador",
    name_en: "Elevator",
    category: "services",
  },
  {
    slug: "air-conditioning",
    name_es: "Aire acondicionado",
    name_en: "Air conditioning",
    category: "climate",
  },
  // ... más amenidades
];
```

---

## Consideraciones de Performance

### Queries Frecuentes Optimizados

1. **Listado público de propiedades**:

   ```
   Query: status=published, enabled=true, orderBy=createdAt DESC
   Índices: idx_properties_status, idx_properties_createdat
   ```

2. **Búsqueda por ciudad y tipo**:

   ```
   Query: city=X, propertyType=Y, status=published
   Índices: idx_properties_city, idx_properties_propertytype, idx_properties_status
   ```

3. **Propiedades de un usuario**:

   ```
   Query: userId=X, orderBy=createdAt DESC
   Índice: idx_properties_userid, idx_properties_createdat
   ```

4. **Leads de un usuario**:
   ```
   Query: propertyOwnerId=X, status=new
   Índice: idx_leads_ownerid, idx_leads_status
   ```

### Caching Recomendado

- Catálogo de amenidades (raramente cambia)
- Propiedades publicadas (cache de 5 minutos)
- Contadores de vistas (actualización batch)

---

## Migraciones y Versionado

### Cambios de Schema

Documentar cambios en este archivo con formato:

```
## Migration: YYYY-MM-DD-description

### Added
- Collection X
- Attribute Y en Collection Z

### Modified
- Attribute A cambió de tipo X a Y

### Deprecated
- Attribute B (usar C en su lugar)

### Removed
- Collection obsoleta
```

---

## Estado del Documento

Este documento es:

- ✅ Definitivo para Fase 0
- 📝 Se actualizará con nuevas colecciones en fases posteriores
- 🔒 Debe mantenerse sincronizado con Appwrite en todo momento

---

**Última actualización**: Febrero 2026
**Versión**: 1.0.0
**Schema Version**: 1.0 (Fase 0)
